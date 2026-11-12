import * as fs from "node:fs";
import * as path from "node:path";
import { processTitleBatch, BATCH_SIZE } from "./process-title-batch";

async function main() {
  const allTitlesFile = path.join("data", "fatwa-title-translations", "all-titles.json");
  const allTitles = JSON.parse(fs.readFileSync(allTitlesFile, "utf8"));
  const totalBatches = Math.ceil(allTitles.length / BATCH_SIZE);

  console.log(`Starting continuous batch runner for fatwa titles.`);
  console.log(`Total titles: ${allTitles.length}, total batches: ${totalBatches} (${BATCH_SIZE} per batch).\n`);

  for (let b = 1; b <= totalBatches; b++) {
    const pad = String(b).padStart(3, "0");
    const batchOutFile = path.join("data", "fatwa-title-translations", `batch-${pad}.json`);

    if (fs.existsSync(batchOutFile)) {
      console.log(`[Batch ${b}/${totalBatches}] Already done.`);
      continue;
    }

    console.log(`[Batch ${b}/${totalBatches}] Starting translation...`);
    const { processed } = await processTitleBatch(b);
    console.log(`[Batch ${b}/${totalBatches}] Done: ${processed} items translated and saved safely.\n`);

    // Polite pause between batches
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("All fatwa title batches completed successfully!");
}

main().catch((err) => {
  console.error("Batch runner failed:", err);
  process.exit(1);
});

