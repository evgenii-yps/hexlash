"""Пары «кадр ролика ДО / ПОСЛЕ / эталон» для острова, арены и зала.
ДО   — тот же исходный кадр, закодированный как раньше (без меток цвета, матрица по умолчанию) и показанный обычным плеером (BT.709 для HD);
ПОСЛЕ — кадр из итогового файла (метки BT.709), показанный тем же плеером;
эталон — экран владельца (только сцена: без полосы браузера и панели задач); рядом — тот же кадр стенда при штатной камере (color/refmatch.mjs).
Сверху вниз по каждой паре печатаются средние цвета сцены (без интерфейса) и отклонение от исходного кадра."""
import subprocess, sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); import measure as M
FF = os.path.join(ROOT, '.cache/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2')
OUT = sys.argv[1]; VIDEO = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080
def player(path_or_video, select=None):
    """Как показывает обычный плеер: YUV (TV) → RGB по BT.709."""
    vf = (f"select='eq(n,{select})'," if select is not None else '') + 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24'
    raw = subprocess.run([FF, '-v', 'error', '-i', path_or_video, '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3)
def old_way(png):
    tmp = os.path.join(OUT, '_old.mp4')
    subprocess.run([FF, '-v', 'error', '-y', '-loop', '1', '-framerate', '60', '-t', '1', '-i', png, '-vf', f'scale={W}:{H},setsar=1,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', tmp], check=True)
    r = player(tmp); os.remove(tmp); return r
SCENES = [  # имя, исходный кадр плана, номер кадра на шкале 60 кадр/с, эталон, кадр стенда при штатной камере
    ('island', 'out/s01-home/frames/00060.png', 60, 'island.png', 'out/color/rig-island-2560.png'),
    ('arena', 'out/s03-duel/frames/00100.png', 516 + 100, 'duel1.png', 'out/color/rig-arena-2560.png'),
    ('hall', 'out/s05b-forge/frames/00300.png', 1824 + 300 - 8, 'forge_image.png', 'out/color/rig-hall-2560.png'),
]
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
except Exception: font = ImageFont.load_default()
report = {}
for name, png, n, ref, stand in SCENES:
    src = np.asarray(Image.open(os.path.join(ROOT, png)).convert('RGB'))
    before = old_way(os.path.join(ROOT, png)); after = player(VIDEO, n)
    def scene_mean(a):
        f = a.astype(np.float32) / 255; m = M.mask_for(*f.shape[:2]); return (f[m].mean(0) * 255).round(2).tolist()
    pink = (src[..., 0] > 150) & (src[..., 1] < 90) & (src[..., 2] > 40)   # розовые пиксели исходного кадра (кнопка, трещины, полоски): их цвет в файле должен совпасть
    rep = {'source_scene_mean_RGB': scene_mean(src), 'before_scene_mean_RGB': scene_mean(before), 'after_scene_mean_RGB': scene_mean(after),
           'before_mean_abs_err': round(float(np.abs(before.astype(float) - src).mean()), 3), 'after_mean_abs_err': round(float(np.abs(after.astype(float) - src).mean()), 3)}
    if pink.sum() > 200: rep['pink_pixels_mean_RGB'] = {'n': int(pink.sum()), 'source': src[pink].mean(0).round(1).tolist(), 'before': before[pink].mean(0).round(1).tolist(), 'after': after[pink].mean(0).round(1).tolist()}
    report[name] = rep
    # эталон: только сцена
    r = np.asarray(Image.open(os.path.join(ROOT, 'color-ref', ref)).convert('RGB')); t, b, l, rr = M.REF_CROP[ref]; r = r[t:b, l:r.shape[1] - rr]
    st = np.asarray(Image.open(os.path.join(ROOT, stand)).convert('RGB'))
    tiles = [('до (как раньше)', before), ('после (итог)', after), ('эталон владельца', r), ('стенд, штатная камера', st)]
    cw = 960; rows = []
    for title, a in tiles:
        im = Image.fromarray(a); im = im.resize((cw, int(im.height * cw / im.width)), Image.LANCZOS); rows.append((title, im))
    h = max(im.height for _, im in rows)
    sheet = Image.new('RGB', (cw * 2, (h + 40) * 2), (0, 0, 0)); d = ImageDraw.Draw(sheet)
    for i, (title, im) in enumerate(rows):
        x, y = (i % 2) * cw, (i // 2) * (h + 40)
        sheet.paste(im, (x, y + 40)); d.text((x + 12, y + 6), f'{name}: {title}', fill=(220, 220, 220), font=font)
    sheet.save(os.path.join(OUT, f'pair-{name}.png'))
    Image.fromarray(before).save(os.path.join(OUT, f'{name}-before.png')); Image.fromarray(after).save(os.path.join(OUT, f'{name}-after.png'))
json.dump(report, open(os.path.join(OUT, 'pairs-report.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(report, indent=1, ensure_ascii=False))
