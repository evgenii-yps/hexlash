# balance-recon-lever-sums.py — какие рычаги меняют контрольные суммы боя (TZ_balance_recon_v1). Накладывает правку на ОТДЕЛЬНУЮ копию дерева, гоняет обе регрессии, откатывает.
# ЗАПУСК: python3 scripts/balance-recon-lever-sums.py <копия дерева> <выходной json>   (копия: git worktree add --detach /tmp/wt2 d9327e02 + ln -s node_modules; четыре строки с большим шагом перепроверены вручную, см. out/lever-sums.json)
import subprocess, re, sys, json
W=sys.argv[1]
def run(cmd):
    return subprocess.run(cmd,shell=True,cwd=W,capture_output=True,text=True).stdout
def sums():
    a=re.search(r'checksum: (\w+)',run('node scripts/fight-regression.mjs')).group(1)
    b=re.search(r'checksum: (\w+)',run('node scripts/fight-regression-builds.mjs')).group(1)
    return a[:8],b[:8]
BASE=('ec148d29','5b0a65d4')
muts=[
 ('профиль ядра (behavior.js CORE_PROFILES natisk.tempo 80→81)','src/data/behavior.js','natisk: { distance: 15, initiative: 90, tempo: 80','natisk: { distance: 15, initiative: 90, tempo: 81'),
 ('сдвиг оси кристалла (upgradeData.js RAM Heavy Hit weight 14→15)',"src/data/upgradeData.js","{ name: 'Heavy Hit', shifts: [s('weight', 14)] }","{ name: 'Heavy Hit', shifts: [s('weight', 15)] }"),
 ('вес тега (combatBalance.grani.tagLean 0.12→0.13)','src/data/combatBalance.js','tagLean: 0.12','tagLean: 0.13'),
 ('вес вершины (grani.vertexLean 0.2→0.21)','src/data/combatBalance.js','vertexLean: 0.2,','vertexLean: 0.21,'),
 ('вес резонанса (grani.homeLean 0.3→0.31)','src/data/combatBalance.js','homeLean: 0.3,','homeLean: 0.31,'),
 ('порог резонанса (grani.threshold 3→4)','src/data/combatBalance.js','threshold: 3, //','threshold: 4, //'),
 ('соответствие тега намерению (branchThreshold.js TAG_LEANS dig_in H→C)','src/data/branchThreshold.js',"dig_in: [H, 'close']","dig_in: [C, 'close']"),
 ('дом ветви (branchThreshold.js BRANCH_HOME natisk.a)','src/data/branchThreshold.js',"natisk: { a: [ST, P]","natisk: { a: [P, ST]"),
 ('hardNeed.bend 0→0.1','src/data/combatBalance.js','hardNeed: { bend: 0 }','hardNeed: { bend: 0.1 }'),
 ('порог нужды: запас сил 0.22→0.23 (intentions.js)','src/data/intentions.js','self.stamina01 < 0.22 *','self.stamina01 < 0.23 *'),
 ('порог нужды: ворота ответа на замах counter>0.55→0.56','src/data/intentions.js','a.counter > 0.55','a.counter > 0.56'),
 ('порог нужды: дальность ответа 0.8→0.9','src/data/intentions.js','self.range + 0.8 *','self.range + 0.9 *'),
 ('порог нужды: заряд 0.85→0.86','src/data/intentions.js','0.85 * (1 - K * (2 * a.weight - 1))','0.86 * (1 - K * (2 * a.weight - 1))'),
 ('бонус удержания 0.08→0.09','src/data/intentions.js','s[self.current] += 0.08','s[self.current] += 0.09'),
 ('клич: сдвиг осей PUSH distance -70→-71','src/data/klichBalance.js','push:     { distance: -70','push:     { distance: -71'),
 ('клич: cooldownSec 6→7','src/data/klichBalance.js','cooldownSec: 6,','cooldownSec: 7,'),
 ('клич: chargesPerKlich 3→4','src/data/klichBalance.js','chargesPerKlich: 3','chargesPerKlich: 4'),
 ('клич: группа HOLD','src/data/klichBalance.js',"hold:     ['hold', 'catch']","hold:     ['hold']"),
 ('бафф: TOWEL heal 0.20→0.21','src/data/buffBalance.js','healFracOfMax: 0.20','healFracOfMax: 0.21'),
 ('бафф: BUCKET paceMul 1.30→1.31','src/data/buffBalance.js','paceMul: 1.30','paceMul: 1.31'),
 ('бафф: грань кубика 6 mul 3.0→3.1','src/data/buffBalance.js','6: { hits: 3, mul: 3.0 }','6: { hits: 3, mul: 3.1 }'),
 ('бафф: cooldownSec 8→9','src/data/buffBalance.js','cooldownSec: 8,','cooldownSec: 9,'),
 ('бафф: порог бота towelHpBelow 0.40→0.41','src/data/buffBalance.js','towelHpBelow: 0.40','towelHpBelow: 0.41'),
 ('общий урон (combatBalance damageFracBase)','src/data/combatBalance.js',None,None),
 ('потолок RESOURCE 7→6 (upgradeData.js)','src/data/upgradeData.js','export const RESOURCE = 7;','export const RESOURCE = 6;'),
 ('botFacetsMax 7→6 (combatBalance)','src/data/combatBalance.js','botFacetsMax: 7,','botFacetsMax: 6,'),
]
rows=[]
for name,f,old,new in muts:
    p=W+'/'+f
    if old is None:
        s=open(p,encoding='utf8').read()
        m=re.search(r'(damageFracBase:\s*)([0-9.]+)',s)
        if not m: rows.append((name,'—','—','нет ключа')); continue
        old=m.group(0); new=m.group(1)+str(round(float(m.group(2))*1.01,6))
    s=open(p,encoding='utf8').read()
    if old not in s: rows.append((name,'—','—','строка не найдена')); continue
    open(p,'w',encoding='utf8').write(s.replace(old,new,1))
    a,b=sums()
    rows.append((name, 'изменилась' if a!=BASE[0] else 'та же', 'изменилась' if b!=BASE[1] else 'та же', ''))
    subprocess.run(f'git checkout -- {f}',shell=True,cwd=W)
json.dump(rows,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
for r in rows: print(' | '.join(r))
