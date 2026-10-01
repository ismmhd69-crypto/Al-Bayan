import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { processBatchNumber } from "./process-batch";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function main() {
  console.log("Starting translation loop until every published fatwa is translated...");

  let batchesSinceCommit = 0;

  while (true) {
    // Determine next batch number from translation-log.md
    const logContent = fs.readFileSync("docs/translation-log.md", "utf-8");
    const batchMatches = Array.from(logContent.matchAll(/^\|\s*(\d+)\s*\|/gm));
    const highestBatch = batchMatches.length > 0 ? Math.max(...batchMatches.map(m => parseInt(m[1], 10))) : 0;
    const nextBatch = highestBatch + 1;

    console.log(`\n==================================================`);
    console.log(`Starting Batch ${nextBatch}...`);
    console.log(`==================================================\n`);

    const { processed, totalLeft } = await processBatchNumber(nextBatch);

    if (processed === 0 || totalLeft === 0) {
      console.log(`Loop finished: totalLeft is ${totalLeft}`);
      if (batchesSinceCommit > 0) {
        commitBatches();
      }
      break;
    }

    batchesSinceCommit++;

    // Commit every 2 batches
    if (batchesSinceCommit >= 2) {
      commitBatches();
      batchesSinceCommit = 0;
    }

    // Short pause between batches
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("Translation loop complete!");
}

function commitBatches() {
  try {
    console.log("Committing translated batches locally...");
    execSync("git add data/translations/batch-*.json docs/translation-log.md", { stdio: "inherit" });
    const status = execSync("git status --porcelain", { encoding: "utf-8" });
    const hasStaged = status.split("\n").some(line => /^[MADRCU]/.test(line));
    if (hasStaged) {
      execSync('git commit -m "Translate fatwas batch progress into EN and DE"', { stdio: "inherit" });
      console.log("Committed successfully.");
    } else {
      console.log("Nothing to commit.");
    }
  } catch (err: any) {
    console.error("Git commit error:", err.message);
  }
}

main().catch((err) => {
  console.error("Fatal error in translation loop:", err);
  process.exit(1);
});
