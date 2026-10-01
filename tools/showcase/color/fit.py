"""Подбор ОДНОЙ общей цветокоррекции по 7 эталонам владельца.

Сравнивать «ролик ↔ эталон» по кадрам нельзя: камера и кадрирование разные, и на цифры яркости пола влияет ракурс.
Поэтому подбор ведётся по парам «стенд ↔ экран владельца» при ОДИНАКОВОЙ камере (штатная камера игры, окно 2560×1300,
color/refmatch.mjs) и по величинам, не зависящим от кадрирования:
  • цвет фона (почти чёрный) и цвет плиты пола (самый частый тон освещённой неокрашенной поверхности);
  • плюс общие распределения яркости освещённого (для отчёта, не для подбора).
Модель — lib/grade.mjs: баланс (множитель на канал) → гамма → контраст/яркость → насыщенность.
Здесь подбираются множители каналов и гамма (МНК по логарифмам); контраст/яркость/насыщенность — по цвету плит и по доле цвета.
Запуск:  python3 tools/showcase/color/fit.py   → color/fit-report.json
"""
import sys, os, json, glob
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import measure as M

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REFMATCH = {  # сцена: (кадр стенда при штатной камере, [эталоны владельца])
    'island': ('out/color/rig-island-2560.png', ['island.png']),
    'arena':  ('out/color/rig-arena-2560.png', ['duel1.png', 'duel2.png']),
    'hall':   ('out/color/rig-hall-2560.png', ['forge_image.png']),
}
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)

def scene_mask(a, scene):
    m = M.mask_for(*a.shape[:2])
    if scene == 'island':
        h, w = a.shape[:2]; m[int(.74*h):int(.95*h), int(.38*w):int(.62*w)] = False   # кнопка FIGHT и подпись
    return m

def floor_and_bg(a, m):
    L = a @ LUM; mx = a.max(2); mn = a.min(2); sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
    bg = m & (L < 0.05)
    lit = m & (L >= 0.05) & (L < 0.32) & (sat < 0.35)
    q = (a[lit] * 255).round().astype(np.int32)
    key = q[:, 0] * 65536 + q[:, 1] * 256 + q[:, 2]
    u, c = np.unique(key, return_counts=True); k = u[np.argmax(c)]
    floor = np.array([k >> 16, (k >> 8) & 255, k & 255], np.float64) / 255
    colored = m & (sat >= 0.5) & (L >= 0.15)
    return {'bg': a[bg].mean(0).astype(np.float64), 'floor': floor,
            'lit_L': [float(np.percentile(L[lit], p)) for p in (10, 50, 90)], 'col_share': float(colored.mean()),
            'col_rgb': a[colored].mean(0).astype(np.float64) if colored.any() else np.zeros(3),
            'clip': float((a[m].max(1) > 0.985).mean())}

def load_ref(name):
    a = M.load(os.path.join(ROOT, 'color-ref', name)); t, b, l, r = M.REF_CROP[name]
    return a[t:b, l:a.shape[1] - r]

def main():
    pairs = []; per_scene = {}
    for scene, (rigf, refs) in REFMATCH.items():
        rig = M.load(os.path.join(ROOT, rigf)); R = floor_and_bg(rig, scene_mask(rig, scene))
        rs = [floor_and_bg(load_ref(n), scene_mask(load_ref(n), scene)) for n in refs]
        ref = {k: np.mean([x[k] for x in rs], 0) for k in ('bg', 'floor', 'col_rgb')}
        ref['lit_L'] = np.mean([x['lit_L'] for x in rs], 0).tolist(); ref['clip'] = float(np.mean([x['clip'] for x in rs])); ref['col_share'] = float(np.mean([x['col_share'] for x in rs]))
        per_scene[scene] = {'rig': {k: (v.tolist() if hasattr(v, 'tolist') else v) for k, v in R.items()}, 'ref': {k: (v.tolist() if hasattr(v, 'tolist') else v) for k, v in ref.items()}}
        # пары (стенд → экран) по каналам: фон и плита (hall: плита по самому частому тону, окрашенное и яркие лампы не используем)
        for what in ('bg', 'floor'):
            for c in range(3): pairs.append((c, float(R[what][c]), float(ref[what][c]), scene, what))
    # МНК: ref_c = (k_c * rig_c) ^ gamma  →  log ref = gamma * (log k_c + log rig)
    best = None
    for gamma in np.arange(0.85, 1.2001, 0.0025):
        ks = []; err = 0.0
        for c in range(3):
            pc = [(r, f) for (cc, r, f, *_ ) in pairs if cc == c and r > 0 and f > 0]
            lk = np.mean([np.log(f) / gamma - np.log(r) for r, f in pc]); ks.append(float(np.exp(lk)))
            err += sum((gamma * (lk + np.log(r)) - np.log(f)) ** 2 for r, f in pc)
        if best is None or err < best[0]: best = (err, float(gamma), ks)
    _, gamma, ks = best
    # остаток по уровням (8 бит) до и после
    def lv(x): return round(float(x) * 255, 2)
    table = []
    for (c, r, f, scene, what) in pairs:
        after = min(1.0, (ks[c] * r) ** gamma)
        table.append({'scene': scene, 'what': what, 'ch': 'RGB'[c], 'rig': lv(r), 'ref': lv(f), 'diff_before': round(lv(r) - lv(f), 2), 'diff_after': round(lv(after) - lv(f), 2)})
    mean_before = float(np.mean([abs(t['diff_before']) for t in table])); mean_after = float(np.mean([abs(t['diff_after']) for t in table]))
    # решение: подобранная коррекция принимается, только если она заметно лучше «ничего не менять» (>0,05 уровня из 255 в среднем);
    # иначе — тождественная (баланс 1, гамма 1, контраст 1, яркость 0, насыщенность 1)
    use_fit = mean_after < mean_before - 0.05
    chosen = {'balance': [round(k, 4) for k in ks], 'gamma': round(gamma, 4)} if use_fit else {'balance': [1, 1, 1], 'gamma': 1}
    chosen.update({'contrast': 1, 'brightness': 0, 'saturation': 1, 'pivot': 0.2, 'identity': not use_fit})
    rep = {'chosen': chosen, 'pairs': table, 'balance': [round(k, 4) for k in ks], 'gamma': round(gamma, 4),
           'mean_abs_levels_before': round(mean_before, 3), 'mean_abs_levels_after': round(mean_after, 3), 'scenes': per_scene}
    json.dump(rep, open(os.path.join(HERE, 'fit-report.json'), 'w'), indent=1, ensure_ascii=False)
    print('ВЫБРАНО:', chosen)
    print('подобранное МНК (не принято, если не лучше тождественного): баланс', rep['balance'], 'гамма', rep['gamma'], '| средняя |ошибка| в уровнях: до', rep['mean_abs_levels_before'], 'после', rep['mean_abs_levels_after'])
    for t in table: print(f"  {t['scene']:6s} {t['what']:5s} {t['ch']}  стенд {t['rig']:6.2f}  эталон {t['ref']:6.2f}  до {t['diff_before']:+.2f}  после {t['diff_after']:+.2f}")

if __name__ == '__main__': main()
