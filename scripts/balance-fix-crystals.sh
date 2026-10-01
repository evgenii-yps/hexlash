#!/bin/bash
# balance-fix-crystals.sh <тег> — полный пересъём 60 кристаллов (одиночка + в грани) на текущем коде (TZ_balance_fix_v2).
# Ставит копию дерева с зондом, гонит этапы zero / solo / build перезамера кристаллов в папку docs/balance-fix/out/<тег>/crystals и собирает таблицы.
set -e
cd "$(dirname "$0")/.."
TAG=$1; [ -z "$TAG" ] && { echo "нужен тег"; exit 1; }
export CR_OUT=docs/balance-fix/out/$TAG/crystals
export WT=/tmp/bf/wt-cr-$TAG
mkdir -p $CR_OUT/raw
python3 scripts/balance-fix-wt.py $WT
for st in zero solo build; do node scripts/crystal-remeasure-run.mjs $st --jobs=4; done
node scripts/crystal-remeasure-input.mjs
node scripts/crystal-remeasure-report.mjs solo
node scripts/crystal-remeasure-report.mjs build
echo "ГОТОВО $CR_OUT"
