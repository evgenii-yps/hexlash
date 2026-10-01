#!/usr/bin/env python3
"""Картинка «звук + доли + события ролика» (шаг 2 правок v1).
Запуск: python3 plot_beatmap.py <mix.wav> <beatmap.csv> <marks-beats.csv> <music-info.json> <выход.png>
Сверху вниз: громкость готового звука, доли трека (в времени ролика), события ролика с подписью, на какую долю села каждая."""
import sys, csv, json
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont

wav, beats_csv, marks_csv, info_json, out = sys.argv[1:6]
y, sr = sf.read(wav); y = y.mean(1) if y.ndim > 1 else y
info = json.load(open(info_json)); dur = info['times']['dur']
beats = [float(r['время в ролике, с'].replace(',', '.')) for r in csv.DictReader(open(beats_csv, encoding='utf8'), delimiter=';')]
marks = list(csv.DictReader(open(marks_csv, encoding='utf8'), delimiter=';'))
W, H, L, R = 3000, 980, 70, 40
x = lambda t: L + (W - L - R) * t / dur
img = Image.new('RGB', (W, H), (8, 8, 10)); d = ImageDraw.Draw(img)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
d.text((L, 14), 'HEXLASH · звук, доли и события ролика (шаг 2)', fill=(246, 244, 246), font=F(26, True))
# громкость 50 мс
top, bot = 70, 330
w = int(0.05 * sr); pts = []
for i in range(0, len(y) - w, w):
    db = 20 * np.log10(np.sqrt((y[i:i + w] ** 2).mean()) + 1e-9); pts.append((i / sr, max(-60, db)))
for t, db in pts:
    h = (db + 60) / 60 * (bot - top)
    d.rectangle([x(t), bot - h, x(t + 0.05) + 1, bot], fill=(70, 150, 190))
d.text((L, top - 26), 'громкость готового звука (дБ, окно 50 мс)', fill=(150, 150, 160), font=F(16))
# доли
for b in beats:
    d.line([x(b), 340, x(b), 372], fill=(120, 120, 130), width=1)
d.text((L, 376), 'доли трека (темп ≈99 уд/мин), в времени ролика', fill=(150, 150, 160), font=F(16))
# оси
for s in range(0, int(dur) + 1, 5):
    d.line([x(s), bot, x(s), bot + 6], fill=(150, 150, 160)); d.text((x(s) - 14, bot + 8), f'{s}', fill=(150, 150, 160), font=F(15))
colors = {'title': (246, 244, 246), 'bam': (255, 0, 105), 'gesture': (212, 168, 67), 'transition': (130, 200, 130), 'segment': (90, 90, 100), 'action': (110, 110, 120), 'fight': (60, 60, 70), 'legend': (110, 110, 120)}
sel = [m for m in marks if m['тип'] in ('title', 'bam', 'gesture', 'transition')]
# события — колонкой по уровням, чтобы подписи не слипались
last = {}
ly = 420
for m in sel:
    t = int(m['кадр']) / 60; c = colors[m['тип']]
    lvl = 0
    while lvl in last and x(t) - last[lvl] < 330: lvl += 1
    last[lvl] = x(t)
    yy = ly + lvl * 52
    d.line([x(t), top, x(t), yy], fill=c + (255,) if False else c, width=2 if m['тип'] in ('bam', 'title') else 1)
    sh = m['сдвиг, мс (метка − доля)']
    nm = m['метка'][:44]
    d.text((x(t) + 4, yy), nm, fill=c, font=F(14, m['тип'] in ('bam', 'title')))
    d.text((x(t) + 4, yy + 18), f"{m['время']} · доля {m['ближайшая доля, с (ролик)']} · {('+' if int(sh) >= 0 else '')}{sh} мс", fill=(150, 150, 160), font=F(13))
img.save(out)
