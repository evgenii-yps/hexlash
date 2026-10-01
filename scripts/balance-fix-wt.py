#!/usr/bin/env python3
# balance-fix-wt.py — КОПИЯ ДЕРЕВА С ЗОНДОМ (TZ_balance_fix_v2). Копирует src/ и scripts/ из репозитория в отдельную папку и вставляет в копию
# зонд решений; в src/ игры зонд НЕ попадает. Вставка идёт по якорным строкам, а не патчем: правки игры не ломают применение (нет якоря — ошибка).
# ЗАПУСК: python3 scripts/balance-fix-wt.py <папка копии>      (повторный запуск обновляет копию)
import sys, os, subprocess, re
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WT = os.path.abspath(sys.argv[1])
os.makedirs(WT, exist_ok=True)
import shutil
for d in ['src', 'scripts']:
    shutil.rmtree(f'{WT}/{d}', ignore_errors=True)
    shutil.copytree(f'{REPO}/{d}', f'{WT}/{d}')
for f in ['package.json']:
    subprocess.check_call(['cp', f'{REPO}/{f}', f'{WT}/{f}'])
nm = f'{WT}/node_modules'
if not os.path.exists(nm):
    os.symlink(f'{REPO}/node_modules', nm)

def patch(path, anchor, new, count=1):
    s = open(path).read()
    if anchor not in s:
        sys.exit(f'нет якоря в {path}: {anchor[:70]!r}')
    s = s.replace(anchor, new, count)
    open(path, 'w').write(s)

# ── intentions.js: зонд видов нужд (__BF) и контрфактов решений (__PROBE, протокол crystal-remeasure) ───────────────────
I = f'{WT}/src/data/intentions.js'
patch(I, "export function chooseIntentionSpinal(self, foe, memory, fight) {\n  return hardNeed(self, foe, memory, fight) || spinalScore(self, foe, memory, fight);\n}",
"""export function chooseIntentionSpinal(self, foe, memory, fight) {
  // ЗОНД balance-fix (только копия дерева). Решения стороны 'player': вид нужды (__BF) и контрфакты (__PROBE).
  const BF = globalThis.__BF;
  const P = globalThis.__PROBE;
  if (!(self.side === 'player' && ((BF && BF.on) || (P && P.on)))) return hardNeed(self, foe, memory, fight) || spinalScore(self, foe, memory, fight);
  P && (P.holds = null);
  const kind = hardNeedKind(self, foe, memory, fight);
  const need = kind ? hardNeed(self, foe, memory, fight) : null;
  const act = need || spinalScore(self, foe, memory, fight);
  if (BF && BF.on) BF.onDecision(kind, act);
  if (P && P.on) {
    if (!P.holds && self.leans && self.leans.length) spinalScore(self, foe, memory, fight);
    const holds = P.holds;
    const R = P.rec;
    if (R) {
      const run = (o) => hardNeed(o, foe, memory, fight) || spinalScore(o, foe, memory, fight);
      R.dec++; if (need) R.need++;
      const cfAct = {};
      for (const c of P.cfs || []) {
        const o = { ...self };
        if (c.ax01) o.ax01 = c.ax01;
        if (c.leans !== undefined) o.leans = c.leans;
        const a = run(o);
        cfAct[c.name] = a;
        if (a !== act) R.chg[c.name] = (R.chg[c.name] || 0) + 1;
      }
      for (const t of P.tagSpecs || []) {
        if (!holds || !self.leans) continue;
        let on = false;
        for (const l of self.leans) if (t.tags.includes(l.tag) && String(l.when).split('&').every(holds)) { on = true; break; }
        if (on) {
          R.tt[t.key] = (R.tt[t.key] || 0) + 1;
          if (cfAct[t.flipCf] !== undefined && cfAct[t.flipCf] !== act) R.tf[t.key] = (R.tf[t.key] || 0) + 1;
        }
      }
    }
  }
  return act;
}""")
patch(I, "    for (const l of self.leans) {\n      if (s[l.i] == null) continue;", "    if (globalThis.__PROBE) globalThis.__PROBE.holds = holds; // ЗОНД\n    for (const l of self.leans) {\n      if (s[l.i] == null) continue;")
B = f'{WT}/src/scene/buildFighter.js'
patch(B, "      leans: (behavior && behavior.leans) || null,", "      side, // ЗОНД balance-fix (только копия дерева)\n      leans: (behavior && behavior.leans) || null,")
print('копия готова:', WT)
