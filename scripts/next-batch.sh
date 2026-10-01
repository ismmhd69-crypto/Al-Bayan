#!/bin/bash
# usage: scripts/next-batch.sh N  -> collects batch N (dry run, no AI) and writes docs/binbaz-batches/_view.txt
N=$(printf "%03d" $1)
npx tsx --conditions=react-server scripts/collect-expansion-batch.ts --scholar=ibn-baz --dry-run --skip-ai --from-index=docs/binbaz-archive-index.json --max-stored=50 --batch-file=docs/binbaz-batches/batch-$N.json 2>&1 | grep -E "Hits found|Newly stored|Index mode|request error|HTTP|^  - |Fatal"
node scripts/show-batch.mjs $1 > docs/binbaz-batches/_view.txt
