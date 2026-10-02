#!/usr/bin/env python3
"""Сборка автономных копий деки (/deckinvestors) одним HTML-файлом.

Читает public/deckinvestors/index.html и public/brand, сам НИЧЕГО в них не меняет.
Шрифты берёт у Google Fonts (нужна сеть только на момент сборки) и вшивает в файл.

  python3 docs/deck-export/build_export.py

Результат (рядом со скриптом):
  deck_export_full.html   — с видео зала (720p) внутри
  deck_export_light.html  — вместо видео постер с подписью

Что заменяется в копии (на сайте остаётся как есть):
  1. Google Fonts <link>-и           → @font-face с woff2 внутри файла (data:)
  2. знак /brand/mark-full-*.png      → одна картинка 256 внутри файла
  3. постер /deckinvestors/hall-*.jpg → внутри файла
  4. видео зала                       → blob из base64 внутри файла (full) / подпись (light)
  5. иконки вкладки, og:image         → иконка внутри файла / убраны
  6. ссылка «ПЕРЕЙТИ/GO» /play/gate   → абсолютная https://hexlash.com/play/gate
"""
import base64, re, sys, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'public/deckinvestors/index.html'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
GF = ('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800;900'
      '&family=JetBrains+Mono:wght@400;500;700&display=swap')

def b64(data): return base64.b64encode(data).decode('ascii')
def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()

html = SRC.read_text(encoding='utf-8')

# ---- 1. шрифты: только реально используемые начертания и подмножества ----------
# Используются (проверено по файлу): JetBrains Mono 400/500/700 (латиница + кириллица),
# Saira Condensed 700/800/900 (латиница; кириллицы у Saira нет — её рисует JetBrains Mono,
# как и на сайте). JetBrains Mono у Google — один переменный файл на подмножество.
css = fetch(GF).decode('utf-8')
blocks = re.findall(r'/\* ([\w-]+) \*/\s*@font-face \{(.*?)\}', css, re.S)
faces, cache = [], {}
for subset, body in blocks:
    fam = re.search(r"font-family: '([^']+)'", body).group(1)
    wt = int(re.search(r'font-weight: (\d+)', body).group(1))
    url = re.search(r'url\(([^)]+)\)', body).group(1)
    rng = re.search(r'unicode-range: ([^;]+)', body).group(1)
    if fam == 'JetBrains Mono' and subset in ('latin', 'cyrillic'):
        key = (fam, subset)
        if key in cache: continue            # один переменный файл на все три веса
        cache[key] = True
        weight = '400 700'
    elif fam == 'Saira Condensed' and subset == 'latin' and wt in (700, 800, 900):
        weight = str(wt)
    else:
        continue
    faces.append("@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:block;"
                 "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}"
                 % (fam, weight, b64(fetch(url)), rng))
fonts_css = '<style id="dk-embedded-fonts">\n' + '\n'.join(faces) + '\n</style>\n'

# убрать всё, что ходит за шрифтами / картинками в сеть из <head>
html = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', html)
html = re.sub(r'<link rel="preload" as="style"[^>]*>\s*', '', html, flags=re.S)
html = re.sub(r'<noscript>\s*<link rel="stylesheet"[^>]*fonts\.googleapis[^>]*>\s*</noscript>\s*', '', html, flags=re.S)
html = re.sub(r'<link rel="preload" as="image"[^>]*>\s*', '', html, flags=re.S)
html = re.sub(r'<meta property="og:image"[^>]*>\s*', '', html)
html = re.sub(r'<meta name="twitter:image"[^>]*>\s*', '', html)
icon = b64((ROOT / 'public/favicon-32.png').read_bytes())
html = re.sub(r'<link rel="icon"[^>]*>\s*', '', html)
html = html.replace('</head>', '<link rel="icon" type="image/png" href="data:image/png;base64,%s">\n%s</head>' % (icon, fonts_css), 1)

# ---- 2. знак ---------------------------------------------------------------
mark = 'data:image/png;base64,' + b64((ROOT / 'public/brand/mark-full-256.png').read_bytes())
html = re.sub(r'src="/brand/mark-full-256\.png"\s+srcset="[^"]*"', 'src="%s"' % mark, html)

# ---- 3. постер -------------------------------------------------------------
poster_uri = 'data:image/jpeg;base64,' + b64((ROOT / 'public/deckinvestors/hall-poster.jpg').read_bytes())
html = html.replace('src="/deckinvestors/hall-poster.jpg"', 'src="%s"' % poster_uri)

# ---- 6. ссылка в игру --------------------------------------------------------
html = html.replace('href="/play/gate"', 'href="https://hexlash.com/play/gate"')

def build(variant):
    h = html
    if variant == 'full':
        video = (ROOT / 'public/deckinvestors/hall-loop-720.mp4').read_bytes()
        # Видео — blob из base64, собирается один раз и делится между RU и EN окном.
        # В копии всегда 720p (на сайте компьютер получает 1080p).
        blob = ('<script id="dk-embedded-video">window.DK_HALL_B64="%s";'
                'window.DK_hallURL=function(){if(!window.DK_hallU){var s=atob(window.DK_HALL_B64),n=s.length,a=new Uint8Array(n);'
                'for(var i=0;i<n;i++)a[i]=s.charCodeAt(i);window.DK_hallU=URL.createObjectURL(new Blob([a],{type:"video/mp4"}))}'
                'return window.DK_hallU};</script>\n') % b64(video)
        old = "var SRC = window.innerWidth <= 700 ? '/deckinvestors/hall-loop-720.mp4' : '/deckinvestors/hall-loop-1080.mp4';"
        assert old in h
        h = h.replace(old, "var SRC = null; /* копия: видео внутри файла, см. DK_hallURL */")
        old2 = "it.v.preload = 'auto'; it.v.src = SRC; it.v.load();"
        assert old2 in h
        h = h.replace(old2, "it.v.preload = 'auto'; it.v.src = window.DK_hallURL(); it.v.load();")
        h = h.replace('</body>', blob + '</body>', 1)
    else:
        # вместо видео — постер с подписью; сценарий видео и сами <video> убираются
        h = re.sub(r'<video class="dk-clip-video".*?</video>', '', h, flags=re.S)
        i = h.index('/* Запись из игры в разделе 06 (зал FORGE).')
        s0 = h.rfind('<script>', 0, i); s1 = h.index('</script>', i) + len('</script>')
        h = h[:s0] + h[s1:]
        cap = ("<span class=\"dk-clip-cap\" style=\"position:absolute;left:0;right:0;bottom:0;z-index:2;padding:14px 16px;"
               "background:linear-gradient(180deg,rgba(8,8,10,0) 0,rgba(8,8,10,.86) 100%%);font:500 11px/1.6 'JetBrains Mono',monospace;"
               "letter-spacing:.16em;color:#F6F4F6\">%s</span>")
        parts = h.split('<img class="dk-clip-poster"')
        assert len(parts) == 3                      # RU-слой, EN-слой
        def with_cap(tail, text):
            j = tail.index('</div>')                # конец .dk-clip
            return tail[:j] + (cap % text) + tail[j:]
        h = (parts[0] + '<img class="dk-clip-poster"' + with_cap(parts[1], 'ЗДЕСЬ ВИДЕО ЗАЛА 6,9 с, петля')
             + '<img class="dk-clip-poster"' + with_cap(parts[2], 'VIDEO OF THE HALL HERE · 6.9 s, loop'))
    # справка в начале файла
    note = ('<!-- Автономная копия страницы hexlash.com/deckinvestors (%s). Сгенерирована docs/deck-export/build_export.py.\n'
            '     Шрифты, знак, постер%s внутри файла; внешних обращений нет. Образец для редизайна, не источник правды. -->\n'
            % (variant, ', видео зала' if variant == 'full' else ''))
    h = h.replace('<head>', '<head>\n' + note, 1) if '<head>' in h else note + h
    (OUT / ('deck_export_%s.html' % variant)).write_text(h, encoding='utf-8')
    print(variant, len(h.encode('utf-8')))

build('full'); build('light')
