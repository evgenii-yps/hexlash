#!/bin/bash
# balance-fix-cr.sh <тег> <что: all | ядро(natisk|nalet|skala|zasada) | solo | build> [--set=2] [--cb=… --ud=… …] — частичный пересъём кристаллов (TZ_balance_fix_v2).
# Копия дерева (с правками --cb/--ud/…, если заданы) → нулевой блок → solo-* и build-*-full выбранных ячеек → свод balance-fix-cr-quick.mjs.
cd "$(dirname "$0")/.."
TAG=$1; WHAT=$2; shift 2
SET=1; OV=()
for a in "$@"; do case $a in --set=*) SET=${a#--set=};; *) OV+=("$a");; esac; done
export CR_OUT=docs/balance-fix/out/$TAG/crystals CR_SET=$SET WT=/tmp/bf/wt-cr-$TAG
mkdir -p $CR_OUT/raw
python3 scripts/balance-fix-wt.py $WT "${OV[@]}" >/dev/null || exit 1
Z="zero-natisk-b$SET,zero-nalet-b$SET,zero-skala-b$SET,zero-zasada-b$SET"
CR_ONLY=$Z node scripts/crystal-remeasure-run.mjs zero --jobs=4 2>&1 | tail -1
case $WHAT in
  all) SOLO=solo-; BUILD=-full;;
  solo) SOLO=solo-; BUILD=NONE;;
  build) SOLO=NONE; BUILD=-full;;
  *) SOLO=solo-$WHAT; BUILD=build-$WHAT;;
esac
[ "$SOLO" != NONE ] && CR_ONLY=$SOLO node scripts/crystal-remeasure-run.mjs solo --jobs=4 2>&1 | tail -1
if [ "$BUILD" != NONE ]; then
  # build-<ядро>-<ветвь>-full: фильтр по подстроке «-full» (или «build-<ядро>» вместе с «-full» отдельно)
  if [ "$BUILD" = "-full" ]; then CR_ONLY=-full node scripts/crystal-remeasure-run.mjs build --jobs=4 2>&1 | tail -1
  else
    ONLY=""; for b in a b c; do ONLY="$ONLY,build-$WHAT-$b-full"; done
    CR_ONLY=${ONLY#,} node scripts/crystal-remeasure-run.mjs build --jobs=4 2>&1 | tail -1
  fi
fi
node scripts/balance-fix-cr-quick.mjs $TAG $( [[ $WHAT =~ ^(natisk|nalet|skala|zasada)$ ]] && echo $WHAT ) --set=$SET
