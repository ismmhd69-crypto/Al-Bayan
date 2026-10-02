import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

process.loadEnvFile(".env");

const CHAIN_WORDS = ["حَدَّثَنَا", "أَخْبَرَنَا", "حَدَّثَنِي", "أَخْبَرَنِي", "عَنْ", "سَمِعْتُ", "قَالَ"];

export type HadithMark = {
  id: string;
  url: string;
  start: string | null;
  kind: "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
};

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// Check if a character is an Arabic letter
function isArabicLetter(char: string): boolean {
  return /[\u0621-\u064A\u0671]/.test(char);
}

export function validateSingleMark(mark: HadithMark, textOriginal: string): ValidationResult {
  if (mark.start === null) {
    if (mark.kind !== "reference_only" && mark.kind !== "unclear") {
      return { valid: false, error: `start is null but kind is '${mark.kind}' (must be reference_only or unclear)` };
    }
    return { valid: true };
  }

  // start is non-null
  if (mark.kind === "reference_only" || mark.kind === "unclear") {
    return { valid: false, error: `start is non-null but kind is '${mark.kind}'` };
  }

  // 1. start must occur EXACTLY ONCE
  const occurrences = textOriginal.split(mark.start).length - 1;
  if (occurrences === 0) {
    return { valid: false, error: `start text was not found in text_original` };
  }
  if (occurrences > 1) {
    return { valid: false, error: `start text occurs ${occurrences} times in text_original (must be exactly once)` };
  }

  const startIndex = textOriginal.indexOf(mark.start);

  // 2. start must begin at a word boundary
  if (startIndex > 0) {
    const prevChar = textOriginal[startIndex - 1];
    if (isArabicLetter(prevChar)) {
      return { valid: false, error: `start does not begin at a word boundary (previous char: '${prevChar}')` };
    }
  }

  // 3. The chain before it is at least 10 characters
  const chain = textOriginal.slice(0, startIndex);
  if (chain.length < 10) {
    return { valid: false, error: `chain length is ${chain.length} characters (must be at least 10)` };
  }

  // 4. Chain contains at least one chain word
  const hasChainWord = CHAIN_WORDS.some((word) => chain.includes(word));
  if (!hasChainWord) {
    return { valid: false, error: `chain does not contain any required chain word (${CHAIN_WORDS.join(", ")})` };
  }

  // 5. chain + start + rest reproduces original text exactly
  const rest = textOriginal.slice(startIndex + mark.start.length);
  if (chain + mark.start + rest !== textOriginal) {
    return { valid: false, error: `chain + start + rest does not reproduce text_original exactly` };
  }

  return { valid: true };
}

export async function validateBatchFile(batchFile: string): Promise<{ validCount: number; errors: Array<{ id: string; url: string; error: string }> }> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  const marks: HadithMark[] = JSON.parse(fs.readFileSync(batchFile, "utf8"));
  if (!Array.isArray(marks)) {
    throw new Error(`Invalid format in ${batchFile}: expected array`);
  }

  const ids = marks.map((m) => m.id);
  const textMap = new Map<string, string>();

  // Fetch text_original for each id in chunks of 100
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error } = await db.from("sources").select("id, text_original").in("id", chunk);
    if (error) throw error;
    for (const row of data ?? []) {
      textMap.set(row.id, row.text_original);
    }
  }

  const errors: Array<{ id: string; url: string; error: string }> = [];
  let validCount = 0;

  for (const mark of marks) {
    const textOriginal = textMap.get(mark.id);
    if (!textOriginal) {
      errors.push({ id: mark.id, url: mark.url, error: "Record not found in database" });
      continue;
    }
    const val = validateSingleMark(mark, textOriginal);
    if (!val.valid) {
      errors.push({ id: mark.id, url: mark.url, error: val.error || "Validation failed" });
    } else {
      validCount++;
    }
  }

  return { validCount, errors };
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="))?.split("=")[1];
  if (!fileArg) {
    console.error("Usage: npx tsx scripts/validate-hadith-marks.ts --file=data/hadith-split/marks-NNN.json");
    process.exit(1);
  }

  const { validCount, errors } = await validateBatchFile(fileArg);
  console.log(`Validation results for ${fileArg}:`);
  console.log(`Valid: ${validCount}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`- [${err.url}] ${err.error}`);
    }
    process.exit(1);
  } else {
    console.log("All marks passed validation!");
  }
}

if (process.argv[1]?.endsWith("validate-hadith-marks.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
