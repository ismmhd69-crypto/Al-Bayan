#!/bin/sh
# usage: run.sh <mix A|B|C> <run 1|2>
cd "$(dirname "$0")/../.."
W="openrouter:qwen/qwen3-235b-a22b-2507"
case "$1" in
  A) AI_MODELS="$W"; AI_VERIFIER_MODELS="openrouter:mistralai/mistral-small-3.2-24b-instruct";;
  B) AI_MODELS="$W"; AI_VERIFIER_MODELS="openrouter:qwen/qwen3-32b";;
  C) AI_MODELS="$W,openrouter:google/gemini-2.5-flash-lite"; AI_VERIFIER_MODELS="openrouter:mistralai/mistral-small-3.2-24b-instruct";;
  D) AI_MODELS="openrouter:apodex/apodex-1.1-mini:free"; AI_VERIFIER_MODELS="openrouter:inclusionai/ling-3.0-flash-sante:free"; export OPENROUTER_RPM=18;;
esac
export AI_MODELS AI_VERIFIER_MODELS QURAN_API_ENV=production QURAN_CHAPTERS= HADITH_SOURCE=library SHOW_AI_TRANSLATIONS=true ASK_DEADLINE_MS=50000
unset ASK_LEAN ASK_TIERED
export OPENROUTER_SORT="${OPENROUTER_SORT:-}"
npx tsx --conditions=react-server scripts/measure-ai-mix.ts --out=docs/openrouter-runs/mix-$1-run-$2.json
