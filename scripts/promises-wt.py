#!/usr/bin/env python3
# promises-wt.py — КОПИЯ ДЕРЕВА С ЗОНДАМИ ДЛЯ РАЗВЕДКИ «ОБЕЩАНИЯ ТЕКСТОВ» (TZ_promises_v1, шаг 1).
# Копирует src/ и scripts/ в отдельную папку и вставляет в КОПИЮ buildFighter.js зонд — вызовы globalThis.__PR.* в местах, где бой уже
# считает нужные числа (контакт удара, запуск удара, финт, «клюнул», расплата, уворот). В src/ репозитория зонд НЕ попадает.
# Вставка идёт по якорным строкам; нет якоря — ошибка (правка боя не должна молча ломать зонд).
# ЗАПУСК: python3 scripts/promises-wt.py <папка копии>
import sys, os, shutil
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WT = os.path.abspath(sys.argv[1])
# --cb='js' --ud='js' --bt='js' --bb='js' --it='js': пробные правки чисел ТОЛЬКО в копии (дописываются в конец файла)
OV = {a.split('=', 1)[0][2:]: a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--') and '=' in a}
os.makedirs(WT, exist_ok=True)
for d in ['src', 'scripts']:
    shutil.rmtree(f'{WT}/{d}', ignore_errors=True)
    shutil.copytree(f'{REPO}/{d}', f'{WT}/{d}')
shutil.copy(f'{REPO}/package.json', f'{WT}/package.json')
nm = f'{WT}/node_modules'
if not os.path.exists(nm):
    os.symlink(f'{REPO}/node_modules', nm)

def patch(path, anchor, new):
    s = open(path).read()
    if s.count(anchor) != 1:
        sys.exit(f'якорь найден {s.count(anchor)} раз(а) в {path}: {anchor[:80]!r}')
    open(path, 'w').write(s.replace(anchor, new, 1))

B = f'{WT}/src/scene/buildFighter.js'
PR = "if (side === 'player' && globalThis.__PR) globalThis.__PR."

# 1. контакт удара: один вызов strikeDamage (в нём jit() берёт случайное число — второй вызов сдвинул бы бой)
patch(B,
      "    onImpact(strikeDamage(c) * (1 + dmgBonus), pen, sb.interruptBonus || 0, contactPoint, c.weight || 0);",
      f"    const _sd = strikeDamage(c);\n    {PR}contact(lastT, c, _sd, dmgBonus, feintPayoffActive, riposte, chargeShotPower, pen);\n"
      "    onImpact(_sd * (1 + dmgBonus), pen, sb.interruptBonus || 0, contactPoint, c.weight || 0);")
# 2. запуск удара
patch(B, "  const launchStrike = (t, atk) => {\n    rushedClip = answerPending; answerPending = false; // удар-ответ на чтение несёт sb.rushMiss до конца клипа\n    play(atk);\n",
      f"  const launchStrike = (t, atk) => {{\n    rushedClip = answerPending; answerPending = false; // удар-ответ на чтение несёт sb.rushMiss до конца клипа\n    play(atk);\n    {PR}launch(t, atk);\n")
# 3. финт брошен
patch(B, "    play(FEINT);\n    stamina = THREE.MathUtils.clamp(stamina - B.feintStaminaCost",
      f"    play(FEINT);\n    {PR}feint(t);\n    stamina = THREE.MathUtils.clamp(stamina - B.feintStaminaCost")
# 4. враг «клюнул» на финт
patch(B, "{ feintBaited = true; feintBaitUntil = 0; feintAdvUntil = t + B.feintAdvantageWindowSec",
      f"{{ {PR}bait(t); feintBaited = true; feintBaitUntil = 0; feintAdvUntil = t + B.feintAdvantageWindowSec")
# 5. удар-расплата взведён
patch(B, "if (feintBaited && feintAdvUntil && t < feintAdvUntil) { feintPayoffActive = true;",
      f"if (feintBaited && feintAdvUntil && t < feintAdvUntil) {{ {PR}payoff(t); feintPayoffActive = true;")
# 6. свой уворот
patch(B, "      play(DODGE); // slip the hit: no HP loss, no rhythm hitch\n",
      f"      play(DODGE); // slip the hit: no HP loss, no rhythm hitch\n      {PR}dodge(lastT, sb.dodgeCounter || 0);\n")
FILES = {'cb': 'src/data/combatBalance.js', 'ud': 'src/data/upgradeData.js', 'bt': 'src/data/branchThreshold.js', 'bb': 'src/data/buffBalance.js', 'it': 'src/data/intentions.js'}
for key, rel in FILES.items():
    if key in OV:
        open(f'{WT}/{rel}', 'a').write('\n/* --- ПРОБНЫЕ ПРАВКИ (только копия) --- */\n' + OV[key] + '\n')
print('копия с зондом готова:', WT, ('правки: ' + str(list(OV))) if OV else '')
