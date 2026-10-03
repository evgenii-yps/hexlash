#!/usr/bin/env python3
"""Цвета, реально записанные в PDF: цвет каждого текстового отрезка и цвет
заливок/обводок. Печатает JSON: [{kind, rgb, opacity, count}].

Нужен pymupdf (pip install pymupdf). Градиенты ядра сюда не попадают: они
собираются из того же розового и тёмных констант генератора ядра.
Прозрачность у PyMuPDF для границ карточек иногда читается как 1 — поэтому
проверка по цвету, а не по прозрачности; отдельно сверяется растр."""
import json, sys
try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

doc = pymupdf.open(sys.argv[1])
acc = {}
rendered = {}
sizes = set()
def put(kind, rgb, op):
    k = (kind, rgb, op)
    acc[k] = acc.get(k, 0) + 1

hexf = lambda c: '#%02X%02X%02X' % tuple(round(x * 255) for x in c)
for page in doc:
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                put('text', '#%06X' % s['color'], 1.0)
                sizes.add(round(s['size'] / 0.75, 2))
    for d in page.get_drawings():
        r = d['rect']
        # путь из одних отрезков без площади — заливка у него ничего не рисует
        no_area = all(it[0] == 'l' for it in d['items']) and len(d['items']) < 3
        if d.get('fill') is not None and not no_area:
            op = round(d.get('fill_opacity') or 1.0, 3)
            put('fill', hexf(d['fill']), op)
            if hexf(d['fill']) == '#FFFFFF' and op == 1.0:
                # PyMuPDF иногда не видит прозрачность тонких рамок: смотрим, что реально нарисовано
                pm = page.get_pixmap(matrix=pymupdf.Matrix(4, 4), clip=r)
                px = pm.pixel(pm.width // 2, pm.height // 2)
                rendered[(r.x0, r.y0)] = '#%02X%02X%02X' % tuple(px[:3])
        if d.get('color') is not None and d.get('width'):
            put('stroke', hexf(d['color']), round(d.get('stroke_opacity') or 1.0, 3))
print(json.dumps({'colors': [{'kind': k[0], 'rgb': k[1], 'opacity': k[2], 'count': v} for k, v in sorted(acc.items(), key=str)], 'whiteRendered': sorted(set(rendered.values())), 'sizesPx': sorted(sizes)}))
