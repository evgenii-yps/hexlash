#!/usr/bin/env python3
# balance-fix-leanplan-apply.py <json весов> — вписывает план наклонов в данные: теги кристаллов (upgradeData.js) и таблицу TAG_LEANS (branchThreshold.js).
import json, re, sys
plan = json.load(open(sys.argv[1]))     # тег -> [намерение, условие, вершина, вес]
CAP = 0.45
import subprocess
ordering = subprocess.check_output(['node', '--input-type=module', '-e', "import {PLAN} from '/home/user/hexlash/scripts/balance-fix-leanplan.mjs'; console.log(JSON.stringify(PLAN))"]).decode()
PLAN = json.loads(ordering)
INT = {'press': 'P', 'strike': 'ST', 'sting': 'SG', 'hold': 'H', 'break': 'BR', 'catch': 'C'}
# 1) теги в upgradeData.js
p = 'src/data/upgradeData.js'
s = open(p).read()
lines = s.split('\n')
def branch_span(core, br):
    i0 = next(i for i, l in enumerate(lines) if l.startswith(f'  {core}: ['))
    i1 = next(i for i in range(i0 + 1, len(lines)) if lines[i].startswith('  ],'))
    # внутри ядра ищем mkBranch('<br>'
    j0 = next(i for i in range(i0, i1) if lines[i].strip().startswith(f"mkBranch('{br}',"))
    j1 = next(i for i in range(j0 + 1, i1) if lines[i].strip().startswith(']'))
    faces = [i for i in range(j0 + 1, j1) if lines[i].strip().startswith('{ name:')]
    return faces
for core, bi, tg, X, cnd, *rest in PLAN:
    br, idx = bi[0], int(bi[1])
    vtx = bool(rest and rest[0])
    li = branch_span(core, br)[idx - 1]
    if f"'{tg}'" in lines[li]:
        continue
    key = 'effects' if vtx else 'conditionals'
    # вставляем перед закрывающей « },» строки
    m = re.match(r'^(\s*\{ name: .*?)( \},?)$', lines[li])
    assert m, lines[li]
    body, tail = m.group(1), m.group(2)
    if f'{key}: [' in body:
        body = re.sub(rf"{key}: \[([^\]]*)\]", lambda mm: f"{key}: [{mm.group(1)}, '{tg}']", body)
    else:
        body += f", {key}: ['{tg}']"
    lines[li] = body + tail
open(p, 'w').write('\n'.join(lines))
# 2) TAG_LEANS в branchThreshold.js
p = 'src/data/branchThreshold.js'
s = open(p).read()
a = s.index('export const TAG_LEANS = {')
b = s.index('};', a) + 2
out = ['export const TAG_LEANS = {']
cur = None
names = {'natisk': 'ONSLAUGHT', 'nalet': 'RAIDER', 'skala': 'BULWARK', 'zasada': 'AMBUSH'}
for core, bi, tg, X, cnd, *rest in PLAN:
    if core != cur:
        out.append(f'  // {names[core]}'); cur = core
    I, C_, V, W = plan[tg]
    W = min(CAP, W)
    out.append(f"  {tg}: [{INT[X]}, '{cnd}', {'true' if V else 'false'}, {W:.2f}],   // {bi}")
out.append('};')
s = s[:a] + '\n'.join(out) + s[b:]
s = s.replace("const t = TAG_LEANS[tag];\n      if (t) leans.push({ i: t[0], w: t[2] ? G.vertexLean : G.tagLean, when: t[1], tag });", "const t = TAG_LEANS[tag];\n      if (t) leans.push({ i: t[0], w: t[3] != null ? t[3] : t[2] ? G.vertexLean : G.tagLean, when: t[1], tag });")
open(p, 'w').write(s)
print('готово')
