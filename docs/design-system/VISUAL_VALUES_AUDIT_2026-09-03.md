# ТЗ-00 · Опись визуальных значений из живого кода

**Дата:** 03.09.2026
**Коммит:** `ccff1e21479de6e42bc799affddcab82ae3e47f9` (= `origin/main`, «feat(brand): roll out the new Hexlash mark across every surface»)
**Ветка отчёта:** `claude/hexlash-visual-values-audit-42sjbp`
**Изменений в коде:** нет. Добавлен только этот файл.

Отчёт составлен **по живому коду**. Notion, `CLAUDE.md`, PDF и `docs/design-handoff/` в качестве источника значений не использовались. Комментарии в коде цитируются только как заявленное намерение — рядом всегда стоит фактическое число.

---

## 0. Что просмотрено

### Просмотрено полностью (прочитано построчно)

| Файл | Строк | Что несёт |
|---|---|---|
| `index.html` | 290 | первый экран загрузки (критический CSS + контроллер), подключение шрифтов, иконки, meta |
| `src/assets/main.css` | 223 | глобальный сброс, `body`, скроллбар, переопределения Vuetify |
| `src/assets/colors.css` | 10 | «устаревшие» переменные |
| `src/styles/hexlash-ui.css` | 255 | `--hex-*` переменные, анимации, утилиты |
| `src/styles/hexlash-v24.css` | 7 | точка входа v24 |
| `src/styles/v24/tokens.css` | 22 | переменные под `.app-v2` + загрузка Google Fonts |
| `src/styles/v24/effects.css` | 37 | зерно / строчки / виньетка |
| `src/styles/v24/verify.css` | 73 | плашка «подтвердите почту» |
| `src/styles/home.css` | 444 | дом: верхняя полоса, кнопка FIGHT, плитки, режим расстановки, **мёртвый блок магазина** |
| `src/styles/shop.css` | 503 | магазин (живой) |
| `src/styles/cabinet.css` | 253 | выдвижная панель игрока |
| `src/styles/forge.css` | 145 | зал FORGE |
| `src/components/landing/landing.css` | 332 | лендинг |
| `src/scene/buildArena.js` | 262 | плита + разлом |
| `src/scene/arenaTextures.js` | 163 | процедурные текстуры |
| `src/scene/arenaPresence.js` | 56 | дыхание разлома |
| `src/data/intentionMotion.js` | 68 | позы намерений |
| `src/components/brand/hexlashMark.js` | 67 | знак, три отрисовки |
| `src/services/sceneLoading.js` (§ констант) | 328 | тайминги экрана загрузки |
| `src/router/index.js` | — | какие экраны живы |

### Просмотрено выборочно (целевой поиск по значениям + чтение блоков настройки)

`src/scene/HomeScene.vue` (1393), `PveScene.vue` (894), `SpaceScene.vue` (491), `ArenaScene.vue` (720), `FighterLabScene.vue` (918), `modePlates.js` (885), `legendPresence.js` (246), `buildFighter.js` (2690), `transitionFlight.js` (747), `homeProps.js`, `hpIndicator.js`, `perfProbe.js`, `data/combatBalance.js` (527), `data/upgradeData.js` (330), `data/behavior.js`, все 44 `.vue`-файла (scoped-стили — через сплошной поиск по свойствам), `scripts/sync-brand-icons.mjs`, `public/manifest.json`, `vite.config.js`.

### Не просмотрено — и почему

| Что | Почему |
|---|---|
| `src/views/PrivacyView.vue` (2654 строки) | автосгенерированный юридический HTML с инлайн-стилями. Он даёт `rgb(89,89,89)` ×143 и `font-size:15px` ×447 — это шум чужого генератора, а не решения проекта. **Из всех таблиц ниже исключён**, кроме тех мест, где он тянет общие переменные (это отмечено). |
| `src/locales/**` | текст, не значения (одно исключение: `pages/rules/en.json` тянет `var(--primary-color)` — отмечено в §7). |
| `node_modules`, Vuetify | внешняя библиотека; учтены только наши переопределения в `main.css`. |
| Растровые ассеты (`public/*.png`, `og-image.png`) | пиксели, а не числа в коде. Их размеры и происхождение — в §5.7. |
| `src/assets/abi`, backend | не визуал. |

**Честно:** сплошной построчный просмотр всех 44 `.vue` не делался — по ним шёл сплошной поиск по каждому визуальному свойству (цвет, шрифт, размер, отступ, рамка, тень, фильтр, прозрачность, движение, слой, breakpoint). Одиночное значение, спрятанное в нестандартной записи (например, собранное в JS-строку), могло проскочить. Всё, что записано обычным CSS или обычным литералом, — в отчёте.

---
# ЧАСТЬ I · Плоский слой (интерфейс)

## 4.1 Цвет

### 4.1.1 Объявленные наборы переменных — их **шесть**, и они не связаны

| # | Где объявлен | Область | Что внутри |
|---|---|---|---|
| 1 | `src/assets/colors.css` `:root` | глобально | `--white #FFFFFF` · `--pink #FF0069` · `--scrollbar-bg #000000dd` · `--scrollbar-thin #3F3F3F` · `--primary-color = var(--pink)`. Файл помечен `DEPRECATED`. |
| 2 | `src/styles/hexlash-ui.css` `:root` | глобально | 21 переменная `--hex-*` (ниже) |
| 3 | `src/styles/v24/tokens.css` `.app-v2` | все `/play/*` | `--hex-primary #FF0069` (**повторное объявление**) · `--bg-deep #070811` · `--bg-panel rgba(14,16,28,.85)` · `--text-dim rgba(255,255,255,.5)` · `--text-mid rgba(255,255,255,.75)` + 3 шрифтовые |
| 4 | `src/styles/home.css` `.home-root` | дом / магазин / PVE / space | 20 локальных (`--acc`, `--bone`, `--ash`, `--line`, `--line2`, семейство `--hs-chrome-*`…) |
| 5 | `src/styles/cabinet.css` `.cab-root` | панель игрока | 13 локальных `--cab-*` |
| 6 | `src/styles/forge.css` `.forge-root` | зал FORGE | 12 локальных `--fg-*` |

Плюс ещё **четыре** локальных набора внутри `.vue`-файлов: `.shopb` (shop.css, 14), `.lp` (landing.css, 8), `.hx-auth` (AuthSelectorView, 12), `.scene` (CoreSelectView, ~20), `#hx-404` (NotFoundView, 6), `#hx-load` (index.html, 6).

**Итого 12 независимых наборов переменных цвета.** Ни один не собран из другого — все объявляют свои литералы заново.

### 4.1.2 `--hex-*` — заявленная система, фактическое употребление

| Переменная | Значение | Использований `var()` | Комментарий |
|---|---|---|---|
| `--hex-primary` | `#FF0069` | **55** | живая |
| `--hex-primary-glow` | `rgba(255,0,105,0.5)` | 15 | живая |
| `--hex-primary-dark` | `#A50344` | **1** | почти мёртвая |
| `--hex-bg-dark` | `#090909` | 5 | |
| `--hex-bg-medium` | `#111111` | **1** | почти мёртвая |
| `--hex-bg-light` | `#1A1A1A` | 8 | |
| `--hex-bg-card` | `rgba(17,17,17,0.85)` | 8 | |
| `--hex-text-primary` | `#FFFFFF` | 24 | |
| `--hex-text-secondary` | `rgba(255,255,255,0.6)` | 10 | |
| `--hex-text-muted` | `rgba(255,255,255,0.35)` | 12 | |
| `--hex-danger` | `#FF3333` | 7 | |
| `--hex-border-default` | `rgba(255,255,255,0.08)` | 9 | |
| `--hex-border-active` | `rgba(255,255,255,0.15)` | 5 | |
| `--hex-border-strong` | `rgba(255,255,255,0.25)` | 3 | |
| `--hex-dice-adrenaline` | `#FF9100` | 2 | **только внутри `.mod-badge--adrenaline`, а этот класс мёртв** — см. K13 |
| `--hex-dice-shield` | `#4DA6FF` | 2 | **только внутри мёртвого `.mod-badge--shield`** |
| `--hex-dice-blind` | `#E040FB` | 2 | **только внутри мёртвого `.mod-badge--blind`** |
| `--hex-spacing-sm/md/lg` | `8/16/24px` | по 1 каждая | практически мёртвые |
| `--hex-radius-md` | `8px` | **1** | практически мёртвая |

Комментарий в файле обещает «6 DICE EFFECTS», объявлено **3**.

### 4.1.3 Все литералы цвета в CSS/Vue (без PrivacyView)

**106 различных hex-литералов.** Полный список с частотой:

| Частота | Значения |
|---|---|
| 96 | `#fff` |
| 64 | `#ff0069` |
| 22 | `#f6f4f6` |
| 16 | `#08080a` |
| 15 | `#cfccd3` |
| 12 | `#8d8992` |
| 11 | `#6e6a72` |
| 9 | `#5d5d66` |
| 6 | `#b9b6bd` |
| 5 | `#a9a5af` · `#2ed6b0` · `#101019` · `#000` |
| 4 | `#ffb21d` · `#ff3344` · `#ededf1` · `#c8d1d8` · `#bdb9c2` · `#9461ff` · `#76727c` · `#1d1a1f` · `#0d0f1c` · `#0d0a0d` · `#030308` |
| 3 | `#ffd930` · `#ffa526` · `#f4f2f6` · `#d6d3da` · `#d4d1d8` · `#7a0033` · `#5f5b64` · `#1b150d` · `#1a0010` · `#12161f` · `#120f0c` · `#0b0d13` · `#0b060a` · `#0a0c12` · `#0a0a12` · `#07080f` · `#060710` · `#000000` |
| 2 | `#ffffff` · `#d8d4da` · `#c8d4e6` · `#9fb0c8` · `#9c98a2` · `#7e7a82` · `#7ae6d0` · `#36343a` · `#1a1a22` · `#160a11` · `#070811` |
| 1 | `#ffc97a` `#ff9100` `#ff7a88` `#ff7a30` `#ff4f8a` `#ff3333` `#ff2d82` `#e7e4ea` `#e6c2d2` `#e4005f` `#e040fb` `#d6534c` `#d461ff` `#c9c6cd` `#c4c0cb` `#bfa0ff` `#a50344` `#9b97a2` `#9a9aa6` `#5dd6e6` `#585f68` `#525d6f` `#4da6ff` `#4a0020` `#48454d` `#45c08a` `#3f3f3f` `#3a4453` `#3a4250` `#3a3740` `#2c0013` `#2a3140` `#252c37` `#1c1a1f` `#1a1a1a` `#171c25` `#161b24` `#16161b` `#15151e` `#15121a` `#120a10` `#11141d` `#111111` `#10141d` `#101010` `#0c0d13` `#0c0b10` `#0c0a0d` `#0b070a` `#0a0a10` `#0a0a0d` `#0a0a0c` `#090909` `#08090e` `#06070b` `#05060b` `#050608` |

**Соседи, отличающиеся на единицы (кандидаты в опечатки или забытые правки):**

| Пара | Расстояние | Где |
|---|---|---|
| `#f6f4f6` (22×) ↔ `#f4f2f6` (3×) | 2 по R, 2 по G | `--bone` / `--fg-bone` / `--ink-bone` vs `--cab-ink` и `.home-root color` |
| `#ff3333` ↔ `#ff3344` | 17 по B | `--hex-danger` vs ядро ONSLAUGHT |
| `#0a0a12` ↔ `#0a0a10` ↔ `#0a0a0d` ↔ `#0a0a0c` | 2–6 по B | фоны в четырёх разных файлах |
| `#0d0a0d` ↔ `#0c0a0d` | 1 по R | `--bg2`/`--fg-carbon` vs `.lp .player` фон |
| `#070811` ↔ `#07080f` | 2 по B | `--bg-deep` vs цвет тумана 3D-сцен, записанный как `0x070811` (совпадает) и `#07080f` отдельно |
| `#3a4250` ↔ `#3a4453` ↔ `#3a4256` | 2–6 | три оттенка одного серо-синего |
| `#1a1a1a` ↔ `#1a1a22` | 8 по B | `--hex-bg-light` vs локальный фон |

**Отдельно — розовый.** Канон `#FF0069`. Найдена одна вариация: `rgba(255, 6, 105, .32)` и `rgba(255, 6, 105, .8)` в `src/scene/FighterLabScene.vue:890,899` — `#FF0669` вместо `#FF0069`, цифры переставлены. Файл — dev-стенд (`/dev/lab`), в меню не залинкован.

### 4.1.4 Белая лестница прозрачности — **43 значения, шкалы нет**

`rgba(255,255,255,α)`, α по возрастанию с частотой:

`0` (3) · `.012` (3) · `.014` (1) · `.015` (2) · `.018` (3) · `.02` (8) · `.022` (5) · `.025` (5) · `.03` (7) · `.035` (1) · `.04` (4) · `.045` (3) · `.05` (8) · `.06` (5) · `.07` (5) · `.08` (5) · `.09` (8) · `.1` (2) · `.10` (2) · `.12` (7) · `.13` (1) · `.14` (10) · `.15` (1) · `.16` (9) · `.18` (4) · `.2` (2) · `.22` (5) · `.25` (1) · `.28` (2) · `.3` (3) · `.35` (2) · `.4` (2) · `.42` (1) · `.45` (1) · `.5` (2) · `.55` (4) · `.6` (3) · `.62` (1) · `.7` (1) · `.75` (1) · `.85` (5) · `.92` (1) · `.95` (1)

Это не набор ступеней, это континуум. `.1` и `.10` записаны обоими способами.

Чёрная лестница — 14 значений: `.12 .14 .15 .2 .25 .3 .35 .4 .45 .5 .55 .6 .7 .85`.

Всего различных записей `rgba()/rgb()` — **165**.

### 4.1.5 Цвета из данных игры — четыре ядра

Канонический источник — `src/data/upgradeData.js`:

| id | Имя | `hue` | `sup` |
|---|---|---|---|
| `natisk` | ONSLAUGHT | `#FF3344` | `#FF7A88` |
| `nalet` | RAIDER | `#FFA526` | `#FFC97A` |
| `skala` | BULWARK | `#2ED6B0` | `#7AE6D0` |
| `zasada` | AMBUSH | `#9461FF` | `#BFA0FF` |

Копии в других файлах — см. §7 (расходятся).

---
## 4.2 Шрифт

### 4.2.1 Где подключаются — **три независимых запроса к Google Fonts**

| # | Где | Что запрашивает | Блокирует первую отрисовку? |
|---|---|---|---|
| 1 | `index.html:59-65` | `Saira Condensed` 500;600;700;800;900 + `JetBrains Mono` 400;500;700 | **Нет** — `rel=preload as=style` + `onload` подмена на stylesheet, плюс `<noscript>`-дубль |
| 2 | `src/styles/v24/tokens.css:5` | `Archivo Black` + `Space Grotesk` 400;500;600;700 + `JetBrains Mono` 400;500 | **Да** — `@import url(...)` внутри CSS, грузится на каждом `/play/*` |
| 3 | `src/views-v2/CoreSelectView.vue:125` | `Saira Condensed` **400**;500;600;700;800;900 + `JetBrains Mono` 400;500;700 | **Да** — `@import` в `<style>` компонента; дублирует №1 и добавляет вес 400 |

Локальные файлы: `src/assets/fonts/Roboto-{Regular,Medium,Bold}.ttf` — три `.ttf` лежат в репозитории, их `@font-face` в `main.css:22-34` **закомментирован**, а `font-family: 'Roboto'` встречается только внутри этого же комментария. Шрифт не грузится и не используется; файлы — мёртвый груз.

### 4.2.2 Семейства — фактические стеки

| Роль | Стек | Где объявлен |
|---|---|---|
| «дисплей» (заголовки, кнопки) | `"Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif` | `--hs-disp` (home), `--cab-disp`, `--impact` (index.html, 404) |
| то же, короче | `"Saira Condensed", -apple-system, sans-serif` | `--disp` (shop, landing), `--fg-disp` (`+ system-ui`) |
| «телеметрия» (мелкий моно) | `"JetBrains Mono", ui-monospace, monospace` | `--hs-mono`, `--cab-mono`, `--mono`, `--fg-mono` |
| то же, длиннее | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace` | `--tele` (index.html, 404) |
| `.app-v2` дисплей | `'Archivo Black', system-ui, sans-serif` | `--font-display` — **0 потребителей** |
| `.app-v2` текст | `'Space Grotesk', system-ui, sans-serif` | `--font-body` — 1 потребитель (`.app-v2` сам) |
| `<body>` | `'Arial', sans-serif` | `main.css:38` |
| прочее | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` ×11 | PrivacyView (авто) |

Тот же шрифт объявлен четырьмя разными стеками; «моно» — двумя.

### 4.2.3 Кегль — **79 различных записей**

Фиксированные px (частота): `11` (42) · `10` (40) · `13` (36) · `12` (33) · `14` (16) · `9` (14) · `16` (11) · `9.5` (10) · `30` (9) · `18` (9) · `15` (7) · `10.5` (7) · `8.5` (6) · `7.5` (4) · `24` (3) · `22` (3) · `72` (2) · `46` (2) · `40` (2) · `34` (2) · `23` (2) · `20` (2) · `13.5` (2) · `12.5` (2) · `11.5` (2) · `8` (2) · `36` · `32` · `21` · `17`

Относительные: `1.1rem` · `3rem` · `0.7rem` (×3) · `0.5em` · `0.72em` · `0.8em` · `1em` (×2) · `1.3em` (×2) · `1.6em` · `.26em` (×2)

Вьюпортные (только экран загрузки и 404): `38vmin` · `30vmin` · `8vmin` · `6.4vmin` · `3.2vmin` · `3vmin` · `2.6vmin` · `2.3vmin`

`clamp()` — **24 различных выражения**, ни одно не повторяется:
`clamp(110px,min(48vw,30vh),320px)` · `clamp(100px,min(28vw,30vh),300px)` · `clamp(86px,19vw,290px)` · `clamp(52px,12vw,176px)` · `clamp(46px,9.5vw,148px)` · `clamp(42px,7.5vw,108px)` · `clamp(38px,6.6vw,92px)` · `clamp(38px,11vw,76px)` · `clamp(36px,5.6vw,64px)` · `clamp(34px,4vw,56px)` · `clamp(34px,10vw,46px)` · `clamp(32px,5vw,52px)` · `clamp(26px,2.6vw,40px)` · `clamp(22px,7vh,30px)` · `clamp(20px,3.2vw,30px)` · `clamp(20px,2.4vw,26px)` · `clamp(19px,2vw,23px)` · `clamp(16px,4.4vmin,26px)` · `clamp(16px,2.4vw,30px)` · `clamp(14px,1.8vw,19px)` · `clamp(13px,1.9vw,18px)` · `clamp(12px,1.7vmin,16px)` · `clamp(11px,2.6vmin,14px)` · `clamp(11px,1.1vw,15px)` (×2) · `clamp(10px,1.45vmin,13px)` · `clamp(10px,1.35vmin,13px)`

Смешаны пять единиц: px, rem, em, vmin/vw/vh, clamp.

### 4.2.4 Начертания

`700` (32) · `800` (22) · `900` (19) · `500` (15) · `600` (14) · `400` (2)

Запрошено у Google: Saira Condensed 500–900 (в CoreSelectView ещё и 400), JetBrains Mono 400/500/700, Space Grotesk 400–700, Archivo Black (только 400).

### 4.2.5 Межбуквенное — **30 значений, шкалы нет**

`-.01em` (3) · `.005em` (2) · `.01em` (9) · `.015em` · `.02em` (10) · `.03em` (8) · `.04em` (32) · `.05em` (8) · `.06em` (11) · `.08em` (18) · `.1em` (16) · `.12em` (14) · `.13em` · `.14em` (10) · `.15em` (4) · `.16em` (16) · `.18em` (18) · `.2em` (16) · `.22em` (10) · `.24em` (2) · `.26em` (2) · `.28em` (5) · `.30em` · `.3em` (2) · `.34em` (2) · `.4em` (2) · `.42em` · `.5em` (3)

Плюс две записи в пикселях (`1px`, `1.5px`) — в `hexlash-ui.css .hex-pill`, единственное место, где межбуквенное задано не в em. `.30em` и `.3em` — одно значение, две записи.

### 4.2.6 Высота строки

`.84` · `.86` · `.9` · `.92` · `.95` · `1` · `1.35` · `1.5` · `1.55` · `1.6` · `1.65` · `1.7` — двенадцать значений.

### 4.2.7 Регистр

`text-transform: uppercase` — доминирует (около 120 объявлений). `none` — точечно (`.fg-card .none`, `.v-modal .confirm-btn` в комментарии).

---
## 4.3 Размеры

### 4.3.1 Высоты управляющих элементов

| Значение | Что это | Файл |
|---|---|---|
| **44px** (17 объявлений — самое частое) | минимальная тач-зона: `.hs-chrome` (высота), `.hs-seg-shop`/`.hs-seg-cab` на мобиле (44×44), `.dv-core`, `.dv-btn`, `.dv-del` (`min-height`), `.fg-card .close` (44×44), `.cab-tg` (ширина) | home.css, shop.css, forge.css, cabinet.css |
| 48px | `.hs-brandblock` (высота), `.dv-row` `min-height` | home.css, shop.css |
| 40px | `.cab-id .ci-av`, `.cab-empty .ce-ic`, `.hs-brandblock .logo-mark` | cabinet.css, home.css |
| 34px | `.cab-x` (34×34), `.sb-top` на десктопе | cabinet.css, shop.css |
| 28px | `.hs-seg-cab .av` (ромб-аватар), `.cab-foot .cf-soc a` | home.css, cabinet.css |
| 24px | `.cab-tg` (высота), `.lp .player .hud-c`, `.lp .join-check` | cabinet.css, landing.css |
| 74px / 60px | `.hs-strip` — десктоп / мобила | home.css |
| 180px / 150px | `.hs-dock` — десктоп / мобила | home.css |
| 96px / 90px | `.hs-tile` / `.hs-slot` | home.css |

Полный набор высот в px (частота): 1(3) 2(5) 3(4) 4(2) 5(2) 6(3) 7(6) 8(9) 9(2) 10 12 14(6) 16(4) 17 18(4) 19 20 22(2) 24(3) 26(2) 28(3) 30(2) 32(2) 34(3) 40(5) 42 **44(17)** 46 48(7) 52(2) 54(2) 56 60(2) 62 64 68 70 72 74(2) 84(2) 86 90(2) 96(4) 104(2) 108(2) 114 118 120 128 140 150 168 170 180 188 200 218 220 236 240 300 380 520 560(2) 700 720 820 920.

**68 различных значений высоты.**

### 4.3.2 Ширины, зависящие от экрана

| Значение | Что |
|---|---|
| `min(92vw, 392px)` → `392px` от 1024px | панель игрока (`.cab-root`) |
| `min(1180px, 92vw)` | контейнер лендинга (nav / wrap / footer) |
| `min(32vw, 340px)` / `min(38vw, 260px)` | карточка бойца в FORGE (десктоп / узкий ландшафт) |
| `min(60vw, 720px)` / `min(46vw, 420px)` | панель дерева в FORGE |
| `min(340px, 86%)` | кнопка FIGHT на мобиле |
| `min(340px, 80vw)` | поле подписки на лендинге |
| `min(28rem, 88vw)` | пустой ростер FORGE |
| `min(70vw, 860px)` | свечение на 404 |
| `54vmin / 70vmin`, `max-width: 560px` | полоса прогресса на загрузке |
| `440px` | лист покупки (десктоп) |
| `1040px` | сетка магазина |

### 4.3.3 Знак бренда — размеры и переключение отрисовки

`src/components/brand/hexlashMark.js`: три отрисовки, `markVariantFor(size)` → `size >= 64 ? 'full' : size >= 24 ? 'compact' : 'micro'`. viewBox соответственно `0 0 64 64` / `0 0 48 48` / `0 0 16 16`.

Фактические коробки на поверхностях:

| Поверхность | Размер | Попадает в |
|---|---|---|
| верхняя полоса, десктоп | 40px | compact |
| верхняя полоса, ≤560px | 32px | compact |
| nav лендинга, десктоп | 140px (`--lp-nav-logo-size`) | full |
| nav лендинга, ≤680px | 92px | full |
| подвал лендинга | 44px | compact |
| экран загрузки (index.html) | `calc(var(--word) * 2.29)` = `13.74vmin` / `18.32vmin` в портрете | зависит от экрана — на телефоне ~64–130px → full |
| иконки вкладки | 16 / 32 px | micro / compact |

Комментарий в `home.css` предупреждает: «если эта коробка когда-нибудь перейдёт 48px или 24px, отрисовка должна поменяться вместе с ней». На экране загрузки коробка задана во vmin и границу пересекает динамически — но там встроен литеральный SVG **full**-варианта, а не вызов `markVariantFor`.

---

## 4.4 Отступы

### 4.4.1 `gap` — 20 различных значений в px

`2vmin`-класс отдельно; в px: `3` `4` `5`(8) `6`(15) `7`(14) `8`(24) `9`(8) `10`(17) `11`(8) `12`(12) `13`(3) `14`(24) `15` `16`(8) `18`(9) `20`(2) `22`(4) `24`(2) `26` `28` `44`.

Во vmin: `1vmin` `1.4vmin` `2vmin`(3) `2.4vmin` `3vmin`(2) `4vmin`.
В `clamp()`: `clamp(28px,3.6vw,56px)` · `clamp(18px,2.4vw,32px)` · `clamp(14px,2.2vh,24px)` · `clamp(14px,2vh,22px)` · `clamp(12px,2vmin,24px)` · `clamp(10px,1.6vmin,20px)`.
Через переменные: `var(--hex-spacing-sm/md/lg)` — **по одному разу каждая**.

Шкалы 4/8/12/16 не прослеживается: 5, 6, 7, 9, 11, 13 встречаются часто.

### 4.4.2 `padding` — около 90 различных записей

Наиболее частые: `0` (15) · `14px` (9) · `12px 14px` (5) · `0 18px` (5) · `5px 9px` (4) · `10px 12px` (4) · `8px 12px` (3) · `4px 8px` (3) · `20px 22px` (3) · `12px 24px` (3) · `10px 18px` (3) · `0 16px` (3).

Единичные, дающие представление о разбросе: `17px 38px`, `16px 28px`, `13px 24px`, `11px 22px`, `9px 16px`, `3px 7px`, `2px 5px`, `.8vmin 1.6vmin`, `.85vmin 2vmin`, `18vmin 7vw`, `12vmin 6vw`, `clamp(96px,15vh,180px) 0`, `clamp(52px,7vh,84px) 0 40px`, `108px 64px 56px`.

Нечётные значения (`5px`, `7px`, `9px`, `11px`, `13px`, `17px`, `21px`, `26px`) встречаются наравне с чётными.

---

## 4.5 Рамки и скругления

### 4.5.1 Толщина рамки

`1px` — **151** объявление (норма проекта). `2px` — 20. `1.5px` — 2 (`.lp .scrollcue`, `.sheet .sh-bk`). `3px` — 1 (`.dv-warn` левая полоса).

### 4.5.2 Скругление — норма «острый угол», но 17 исключений

| Значение | Кол-во | Где |
|---|---|---|
| **отсутствует** (по умолчанию 0) | подавляющее большинство | всё игровое шасси |
| `4px` | 20 | PrivacyView + `.hex-pill` |
| `50%` | 19 | круги: точки, чек-марки, аватар-ползунок |
| `6px` | 6 | |
| `2px` | 5 | скроллбар, полосы прогресса |
| `8px` | 3 | `.v-modal`, `--hex-radius-md` |
| `3px` | 3 | |
| `9px`, `10px` | по 2 | |
| `0` (явно) | 2 | `.hs-chrome` — **явно обнуляет** |
| `5px` `7px` `11px` `13px` `14px` `16px` `20px` | по 1 | |

Форма «срезанный угол» делается не радиусом, а `clip-path`. Шесть разных срезов:
`polygon(24px 0, …)` — гекс кнопки FIGHT (`--hs-hex`) · `polygon(0 0, 100% 0, 100% calc(100% - 9px), …)` — фаска 9px (`--hs-chamfer`) · срезы на `12px`, `10px`, `9px`, `14px` в `.hs-abtn.place`, `.sp-btn.buy`, `.btn`, `.cab-bind .cb-cta`, `.fg-card`, `.lp .btn-play`, `.lp .join-btn`, `.cc-ribbon`, `.hxl-bar` (в vmin).

### 4.5.3 Контур фокуса — **10 разных стилей**

| Стиль | Кол-во | Где |
|---|---|---|
| `outline: 2px solid var(--dim); outline-offset: 2px` | 3 | shop.css (dev-консоль) |
| `outline: 1px solid var(--core-dim); outline-offset: 2px/3px/4px` | 3 | ForgeTree — **три разных отступа** |
| `outline: 1px solid var(--fg-ash); outline-offset: 2px` | 1 | forge.css |
| `outline: 1px solid var(--fg-ash); outline-offset: -4px` | 1 | forge.css (`.fg-card .close`) — **внутрь** |
| `outline: 1px solid var(--c-dim); outline-offset: 3px` | 1 | CoreSelectView |
| `box-shadow: 0 0 0 5px var(--hex-primary-glow)` | 2 | InputField |
| `box-shadow: 0 0 0 2px var(--hs-chrome-void), 0 0 0 4px rgba(216,227,234,.7)` | 1 | `.hs-chrome` — двойное кольцо |
| `outline: none` | 17 | сброс |

---
## 4.6 Тени и свечения

В коде **нет ни одной настоящей «тени под объектом»** в привычном смысле, кроме трёх случаев. Всё остальное — свечение (нулевое смещение, цветной размытый ореол) или внутренняя подсветка.

### 4.6.1 Настоящие тени (со смещением)

| Значение | Где |
|---|---|
| `0 14px 40px rgba(0,0,0,0.5)` | `.dcard:hover`, `.dcard.neutral:hover` (магазин) |
| `0 18px 60px rgba(0,0,0,0.55)` | `.dcard.hero` (в составе тройной тени) |
| `0 -12px 60px rgba(0,0,0,0.7)` | `.sheet` (лист снизу) |
| `0 4px 12px rgba(255,0,105,0.25)` ×4 | InputField — розовая тень со смещением |
| `0 2px 16px rgba(255,161,51,0.25)` | `.vb-btn` (плашка почты) — оранжевая |
| `0 3px 1px -2px … / 0 2px 2px 0 … / 0 1px 5px 0 …` | `main.css` — переопределение ползунка Vuetify (Material-тень) |

### 4.6.2 Свечения — полный список (57 различных записей `box-shadow`)

**Розовые (бренд):**

| Значение | Где |
|---|---|
| `0 0 0 2px var(--hex-primary-glow)` ×2 | InputField |
| `0 0 0 3px var(--hex-primary-glow)` ×6 | InputField |
| `0 0 0 5px var(--hex-primary-glow)` ×4 | InputField (`:focus-visible`) |
| `0 0 8px var(--hex-primary-glow)` | `@keyframes hex-glow-pulse` 0%/100% — **мёртвый** (K13) |
| `0 0 20px var(--hex-primary-glow), 0 0 40px var(--hex-primary-glow)` | `@keyframes hex-glow-pulse` 50% — **мёртвый** |
| `0 0 8px var(--pink)` ×3 | `.sb-creed .dot`, `.sc-kind .dot`, `.cur-info .ci-h .hx-dia` (магазин) |
| `0 0 12px var(--pink)` | `.sb-tab.on::after` (подчёркивание вкладки магазина) |
| `0 0 18px rgba(--pink-rgb, .4)` ×2 | `.btn.buy`, `.btn.claim.live` |
| `0 0 30px rgba(--pink-rgb, .62)` | `.btn.buy:hover` |
| `0 0 18px rgba(--pink-rgb, .45)` | `.cc-ribbon` |
| `0 0 24px rgba(--pink-rgb, .4)` | `.sh-ok` |
| `0 0 0 1px rgba(--pink-rgb,.2), 0 0 34px rgba(--pink-rgb,.16)` | `.scard.hot.live` |
| `0 0 0 1px rgba(--pink-rgb,.25), 0 0 40px rgba(--pink-rgb,.2)` | `.ccard.best` |
| `0 0 0 1px rgba(--pink-rgb,.35), 0 0 52px rgba(--pink-rgb,.28)` | `.ccard.best:hover` |
| `0 0 0 1px rgba(--pink-rgb,.18)` | `.ccard.best.soon` |
| `0 0 8px var(--accent)` ×2 | `.lp .scrollcue span`, `.lp .player-bar i` (лендинг) |
| `0 0 10px var(--accent)` ×2 | `.lp .nav-links a::after`, `.lp .player-bar i` |
| `0 0 12px var(--accent)` ×2 | `.lp .pillar-bar`, `.lp .timeline-fill` |
| `0 0 14px var(--accent)` | `.lp .phase.live .phase-node` |
| `0 0 22px rgba(--accent-rgb,.5)` ×2 | `.lp .join-btn-bg`, `@keyframes lpk-playpulse` 0% |
| `0 0 26px rgba(--accent-rgb,.6), 0 0 64px rgba(--accent-rgb,.35)` ×2 | `.lp .btn-play-bg` |
| `0 0 30px rgba(--accent-rgb,.6)` | `.lp .play-hex-shape` |
| `0 0 34px rgba(--accent-rgb,.75)` | `.lp .join-btn:hover` |
| `0 0 38px rgba(--accent-rgb,.85), 0 0 90px rgba(--accent-rgb,.5)` ×2 | `.lp .btn-play:hover` |
| `0 0 48px rgba(--accent-rgb,.85)` | `@keyframes lpk-playpulse` 50% |
| `0 0 54px rgba(--accent-rgb,.12), inset 0 0 90px rgba(0,0,0,.6)` | `.lp .player` |
| `0 0 9px rgba(--accent-rgb,.9)` ×2 | `.hxl-fill` (полоса загрузки) |
| `0 0 0 3px rgba(--accent-rgb,.12)` | `.lp .join-input:focus` |
| `0 0 22px -3px rgba(--accent-rgb,.6)` | CoreSelectView |
| `0 0 0 1px rgba(--accent-rgb,.55), 0 0 26px -2px rgba(--accent-rgb,.5)` | CoreSelectView |
| `0 0 4px rgba(255,6,105,0.8)` | FighterLabScene (dev; **опечатка в цвете**) |

**Холодно-белые (матовый хром):**

| Значение | Где |
|---|---|
| `0 0 0 1px var(--hs-chrome-rim), 0 0 18px 2px var(--hs-chrome-bloom)` | `.hs-chrome:hover` |
| `0 0 0 1px var(--hs-chrome-rim-hot), 0 0 14px 1px var(--hs-chrome-bloom-hot)` | `.hs-chrome:active` |
| `0 0 0 2px var(--hs-chrome-void), 0 0 0 4px rgba(216,227,234,.7)` | `.hs-chrome:focus-visible` |
| `0 0 5px rgba(255,255,255,0.85)` | CoreSelectView |

**Цветом ядра:**

| Значение | Где |
|---|---|
| `0 0 8px var(--c)` · `0 0 7px rgba(--c-rgb,.7)` · `0 0 16px rgba(--c-rgb,.5)` · `0 0 26px rgba(--c-rgb,.12)` · `0 0 36px rgba(--c-rgb,.14)` · `0 0 60px rgba(--c-rgb,.16)` · `0 0 14px color-mix(in srgb, var(--c) 55%, transparent)` | магазин + ForgeTree |

**Прочее:** `0 0 8px var(--hex-dice-adrenaline / -shield / -blind)` — три бейджа эффектов, **все мёртвые** (K13). `0 0 0 3px rgba(255,51,51,0.20)` ×2 — ошибка в InputField. `0 0 0 1000px var(--hex-bg-card) inset` — гашение автозаполнения браузера.

### 4.6.3 `text-shadow` — 15 записей, все свечения

`0 1px 0 rgba(120,0,40,0.5)` (единственная со смещением, надпись FIGHT) · `0 0 8px + 0 0 36px + 0 0 78px rgba(accent,.55/.55/.45)` (заголовок лендинга) · `0 0 16px + 0 0 60px + 0 0 120px rgba(accent,.5/.45/.28)` (слово `$HEX`) · `0 0 44px rgba(accent,.35)` · `0 0 30px/38px rgba(255,255,255,.1/.18)` · `0 0 20px rgba(accent,.6/.3)` · `0 0 5vmin rgba(accent,.35)` (число процентов) · `0 0 2vmin rgba(accent,.8)` (знак %) · `0 0 1vmin + 0 0 4vmin rgba(accent,.7/.6)` (кредо) · `0 0 1.2vmin + 0 0 5vmin` · `0 0 4vmin + 0 0 9vmin` · `0 0 12/14px color-mix(...)`.

### 4.6.4 Внутренние подсветки

`inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -5px 14px rgba(120,0,40,0.5)` — лицо кнопки FIGHT (блик сверху + затемнение снизу).
`inset 0 0 220px 60px rgba(0,0,0,.7)` — внутренняя виньетка (LandingBackground).
`inset 0 0 0 1px rgba(--acc-rgb,0.5)` — активный слот расстановки.

---

## 4.7 Прозрачность и размытие

### 4.7.1 `opacity` как свойство — 33 значения

`0` (48) · `.035` · `.05` · `.14` · `.16` · `.2` · `.22` · `.28` · `.3` · `.32` · `.34` (2) · `.4` (7) · `.42` (2) · `.45` · `.48` · `.5` (10) · `.55` (11) · `.58` · `.6` (6) · `.62` · `.7` (10) · `.72` · `.75` · `.78` · `.8` (2) · `.82` (3) · `.85` (6) · `.9` (4) · `.92` · `.95` · `1` (48) · **`1.3`** · **`1.35`**

`1.3` и `1.35` — недопустимые значения CSS: браузер приводит их к `1`. Живут в `shop.css`: `.dcard:hover .gp-bloom { opacity: 1.35 }` и `.dcard:hover .gp-ring { opacity: 1.3 }`. Замысел («усилить свечение на наведении») **не исполняется**: если базовая прозрачность уже `1`, эффекта нет вовсе; если меньше — эффект есть, но не тот, что записан.

### 4.7.2 Размытие подложки (`backdrop-filter`)

| Значение | Файл | `-webkit-` дубль |
|---|---|---|
| `blur(8px)` | `home.css` `.hs-chrome` — матовый хром | да |
| `blur(8px)` | `ReferralOverlay.vue` | да |
| `blur(8px)` | `ResetPasswordView.vue` | да |
| `blur(8px)` | `RotateHint.vue` | да |
| `blur(2px)` | `ReferralOverlay.vue` | да |
| `blur(2px)` | `AuthSelectorView.vue` | да |
| `blur(2px)` | `cabinet.css` `.cab-scrim` | **нет** |
| `blur(3px)` | `shop.css` `.sb-scrim` | **нет** |
| `blur(7px)` | `HomeView.vue` | **нет** |
| `blur(8px)` | `SpaceView.vue` | **нет** |

Основное свойство — 10 объявлений, `-webkit-` дубль — 6. Четыре места остались без префикса.

### 4.7.3 Размытие содержимого (`filter: blur`)

`blur(0)` (5, финальное состояние) · `blur(5px)` (2, `[data-reveal]` лендинга) · `blur(6px)` (2, `@keyframes rise` + `.lp .reveal`) · `blur(8px)` (2, `@keyframes riseHero`) · `blur(11px)` (1, ореол FIGHT в узком ландшафте) · `blur(14px)` (1, ореол FIGHT — норма) · `blur(18px)` (2).

### 4.7.4 Прочие фильтры

`brightness(0.97)` · `brightness(1.04)` · `brightness(1.06)` · `brightness(1.08)` (**10** — самый частый) · `brightness(1.12)` · `brightness(1.15)` (2)
`drop-shadow(0 0 4px rgba(accent,.45))` · `drop-shadow(0 0 6px …)` ×2 · `drop-shadow(0 0 8px rgba(accent,.6))` ×2 · `drop-shadow(0 0 8px color-mix(…core 90%…))` · `drop-shadow(0 0 14px rgba(pink,.35))`

Одно и то же «стало ярче на наведении» записано шестью разными коэффициентами.

---
## 4.8 Движение

### 4.8.1 Длительности — **58 различных значений**

Переведено в секунды, с частотой:

| Диапазон | Значения (частота) |
|---|---|
| мгновенные | `0` (5) · `.04` · `.05` (2) · `.08` (4) |
| нажатие | `.11` (2) · `.12` (6) · `.13` (3) · `.14` |
| состояние | **`.15` (54 — самое частое)** · `.18` (18) · `.2` (29) · `.21` · `.22` (3) |
| переход | `.25` (18) · `.26` (2) · `.28` (3) · **`.3` (37)** · `.31` · `.32` (4) · `.35` (18) · `.38` (2) |
| движение | `.4` (6) · `.42` (5) · `.45` (2) · `.46` · `.5` (3) · `.52` · `.55` (3) · `.6` (5) · `.65` · `.68` · `.7` |
| появление | `.8` (6) · `.9` (3) · `.92` · `.95` (2) · `1.0` (3) · `1.08` · `1.2` · `1.3` (2) · `1.4` · `1.5` · `1.6` (2) · `1.7` (2) · `1.8` (2) |
| дыхание / петли | `2.0` · `2.2` · `2.4` · `3.2` · `3.4` (6) · `3.6` · `4.2` · `4.6` (3) · `5.4` · `5.5` (2) · `5.6` (2) · `6.0` (2) · `6.4` · `7.0` |

Именованные переменные (только в `home.css`): `--hs-fast: .15s` · `--hs-hover: .22s` · `--hs-press: .12s`. Остальные 55 значений вписаны прямо в места использования.

### 4.8.2 Кривые ускорения

| Кривая | Кол-во | Имя / где |
|---|---|---|
| `cubic-bezier(.2, .8, .2, 1)` | 8 | лендинг — «мягкое прибытие» |
| `cubic-bezier(0.2, 0.8, 0.2, 1)` | 1 | **то же самое, другая запись** — `--ease-settle` в home.css |
| `cubic-bezier(0.55, 0, 0.12, 1)` | 4 | `--ease-weight` — «тяжёлое движение плиты» |
| `cubic-bezier(0.22, 0.61, 0.36, 1)` | 3 | `--hs-spring` / `--cab-spring` — пружина |
| `cubic-bezier(0.2, 0.7, 0.3, 1)` | 2 | магазин — появление / лист |
| `cubic-bezier(.7, 0, .2, 1)` | 2 | CoreSelectView |
| `cubic-bezier(.4, .05, .1, 1)` | 2 | `--fg-ease` (FORGE) |
| `cubic-bezier(.16, 1, .3, 1)` | 2 | `--fg-ease-out` (FORGE) |

Плюс ключевые слова: `ease` (**99**) · `ease-in-out` (20) · `linear` (9) · `ease-out` (8) · `steps(1)` (мерцание на лендинге).

Итого **8 именованных кривых + 4 ключевых слова** для одного набора переходов.

### 4.8.3 Уменьшенное движение (`prefers-reduced-motion`)

Блоков `reduce` — 11, блоков `no-preference` (движение включается только при их наличии) — 4.

Покрыто: `home.css` · `shop.css` · `cabinet.css` · `landing.css` · `index.html` · `HomeScene` · `PveScene` · `SpaceScene` · `ArenaScene` · `HomeView` · `HomeShop` · `ForgeTree` · `HexGrid` · `NotFoundView` · `RotateHint` · `CoreSelectView` · `SceneLoadingOverlay`.

**Не покрыто:** `forge.css` (переходы `.fg-fade-*`, `.fg-tag` — идут всегда) · `hexlash-ui.css` (все `hex-*` анимации, включая бесконечные `hex-pulse`, `hex-glow-pulse` — идут всегда) · `verify.css` · `v24/effects.css`.

Три разных подхода к выключению:
1. `home.css` / `cabinet.css` / `shop.css` — перечисляют затронутые правила и обнуляют по одному;
2. `landing.css` — одна строка-молот: `.lp *, .lp *::before, .lp *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }` (переходы **не** трогает);
3. `index.html` — `#hx-load * { animation: none !important }` + `.hxl-fill { transition: none }`.

### 4.8.4 Тайминги экрана загрузки

`src/services/sceneLoading.js`:

| Константа | Значение | Смысл |
|---|---|---|
| `LOADING.MIN_SHOW_MS` | `600` | минимальный показ |
| `LOADING.FADE_OUT_MS` | `200` | уход прозрачности (обе поверхности) |
| `LOADING.SAFETY_MS` | `15000` | принудительное снятие |
| `STAGE_CEILING` | `95` | этапы занимают 0..95 |
| `STABLE_FRAMES` | `3` | подряд устоявшихся кадров |
| `CREEP_GAP` / `CREEP_MS` | `0.9` / `120` | подползание в зазоре |

`index.html`: `transition: opacity .2s ease` (совпадает с `FADE_OUT_MS`), затем `setTimeout(remove, 240)` — удаление из DOM на 40 мс позже конца перехода. Ротация подсказок — `3200 ms`.

---

## 4.9 Порядок наложения слоёв

| z-index | Что |
|---|---|
| `2147483000` (3) | `#hx-load` (index.html), `#hx-404`, `SceneLoadingOverlay` |
| `2147482000` (1) | `RotateHint` |
| `10000 !important` (1) | плашка «подтвердите почту» (`verify.css`) |
| `9000` (1) | одиночный случай |
| `200 / 160 / 150` | `.grain` / `.scanlines` / `.vignette` в `v24/effects.css` — **мёртвые, разметки нет** |
| `100`, `86` | точечные |
| `60` | `.cab-toast` |
| `50` (2) | `.cab-root` (панель), `.lp .nav` |
| `40` (2) | `.cab-scrim`, `.fg-tag` |
| `35 / 34` | `.fg-card` / `.fg-tree` |
| `30` | `.fg-empty` |
| `20` | `.sb-scrim` |
| `10` (3) | `.lp .page`, `.lp .footer` |
| `8` | `.hs-strip` |
| `7` (3) | `.hs-arrtop`, `.hs-tray` |
| `6` (4) | `.sb-head` |
| `5` (7) | `.hs-dock`, `.edit-space` |
| `0…4` | внутренние слои карточек |
| `-1` (3) | подложки кнопок (`.btn-play-bg`, `.join-btn-bg`) |

Три разных «самых верхних» значения (`2147483000`, `2147482000`, `10000 !important`) — три разных представления о том, что главнее.

---

## 4.10 Переломы раскладки

### По ширине

| Порог | Кол-во | Где |
|---|---|---|
| `max-width: 430px` | 1 | landing.css — узкие телефоны |
| `max-width: 480px` | 1 | |
| `max-width: 520px` | 1 | |
| `max-width:520px` (без пробела) | 1 | **то же значение, другая запись** |
| `max-width: 560px` | 4 | home.css (мобильный блок), landing.css |
| `max-width: 640px` | 1 | |
| `max-width: 680px` | 2 | landing.css (nav → левый кластер) |
| `max-width: 820px` | 1 | |
| `max-width: 860px` | 1 | landing.css (сетки) |
| `min-width: 641px` | 1 | **единственный не круглый порог** |
| `min-width: 880px` | 1 | shop.css — десктоп |
| `min-width: 1024px` | 3 | main.css (`html { font-size: 18px }`), cabinet.css, hexlash-ui.css |

### По высоте и ориентации

| Условие | Где |
|---|---|
| `(orientation: landscape) and (max-height: 560px)` ×2 | home.css — «телефон на боку»: плита FIGHT уменьшается |
| `(orientation: landscape) and (max-height: 520px)` | forge.css |
| `(orientation: landscape) and (max-width: 900px)` | forge.css |
| `(orientation: portrait) and (max-height: 700px)` | forge.css (`--fg-band: 42vh`) |
| `(orientation: portrait)` | forge.css |
| `(max-height: 720px)` | |
| `(min-width: 900px) and (min-height: 820px)` | |
| `(min-width: 1200px) and (min-height: 920px)` | |
| `(max-aspect-ratio: 1/1)` ×3 | index.html + 404 — портретный экран загрузки |

### По типу указателя

`(hover: hover)` — 1 (CoreSelectView). `matchMedia('(pointer: coarse)')` в JS — 5 сцен + RotateHint.

**Итого 12 порогов по ширине, 8 комбинаций по высоте/ориентации, 3 по соотношению сторон.** Общей сетки нет: `home.css` ломается на 560, `shop.css` — на 880, `landing.css` — на 860/680/560/430, `cabinet.css` — на 1024, `forge.css` — по ориентации.

---
# ЧАСТЬ II · Объёмный слой (3D)

Живых сцен четыре плюс dev-стенд:

| Сцена | Файл | Маршрут | Строк |
|---|---|---|---|
| Дом / выбор режима | `HomeScene.vue` | `/play/home`, `/play/mode` | 1393 |
| Зал FORGE | `PveScene.vue` | `/play/pve` | 894 |
| Пространство | `SpaceScene.vue` | `/play/space` | 491 |
| Арена | `ArenaScene.vue` | `/play/arena` | 720 |
| Лаборатория бойца | `FighterLabScene.vue` | `/dev/lab` (dev) | 918 |

Общие модули: `buildArena.js` (плита + разлом), `buildFighter.js` (боец), `arenaTextures.js`, `modePlates.js` (двери), `legendPresence.js` (гексарх), `homeProps.js`, `hpIndicator.js`, `transitionFlight.js` (пролёт дом⇄режимы).

## 5.1 Материалы

### 5.1.1 Плита арены (`buildArena.js`) — общая для дома, FORGE, арены

| Объект | Материал | Значения |
|---|---|---|
| тело плиты | `MeshStandardMaterial` | `color 0x14182a` · `flatShading true` · `roughness 0.82` · `metalness 0.14` · `side DoubleSide` |
| гекс-сетка сверху | `MeshBasicMaterial` | `map` hexTex · `transparent` · `depthWrite false` · `DoubleSide` · `vertexColors true`; альфа по вершинам `0.3 + 0.6·t` (дальний край темнее) |
| кромка | `LineBasicMaterial` | `color 0x7184b0` · `opacity 0.85` |
| контактная тень | `MeshBasicMaterial` | радиальная `rgba(0,0,0,0.55) → rgba(0,0,0,0.28)` на стопе `0.45`, `opacity 0.7`, `fog false` |

Геометрия плиты: `PLATFORM = { width: 6, height: 1, outerZ: 2.0, slitHalf: 0.12, amp: 0.42 }`. Зерно разлома `2026`, зерно искр `4242` (детерминированно). Один тайл гекс-текстуры = `6.5` мировых единиц.

### 5.1.2 Боец (`buildFighter.js`)

| Объект | Материал | Значения |
|---|---|---|
| «кожа» игрока | `MeshStandardMaterial` | `color 0x1c2233` · `flatShading` · `roughness 0.8` · `metalness 0.18` |
| «кожа» соперника | та же, другой цвет | `color 0x141b2e` (темнее и холоднее) |
| нейтральный (dev) | та же | `SKIN_NEUTRAL 0x23262e` |
| ядро (кристалл) | `MeshBasicMaterial` | цвет ядра × `coreDim` (игрок `1.0`, соперник `0.7`); `OctahedronGeometry(0.06, 0)` |
| ореол ядра | `SpriteMaterial` | радиальная `rgba(255,235,243,0.95) → pink@0.5` стоп `0.4`; `AdditiveBlending`; `opacity 0.8 × coreGain` (игрок `1.0`, соперник `0.55`); масштаб `0.34` |
| тень под ногами | `MeshBasicMaterial` | `rgba(0,0,0,0.6) → rgba(0,0,0,0.3)` стоп `0.4`; `opacity 0.6`; `fog false`; плоскость `1.0 × 0.62` |
| искра удара | `MeshBasicMaterial` | `rgba(255,255,255,0.95) → pink@0` стоп `0.32`; `AdditiveBlending`; `opacity 0` в покое; плоскость `0.55 × 0.55`; живёт `hitFlashSec = 0.18s` |

Тело: бедро `0.42×0.18×0.26`, грудь `0.5×0.46×0.3`, шея `0.16×0.08×0.16`, голова `0.26×0.24×0.24`, плечо `0.16×0.34×0.16`, предплечье `0.14×0.32×0.14`, бедро ноги `0.2×0.43×0.2`, голень `0.18×0.41×0.18`, стопа `0.18×0.09×0.26`. Высота таза `HIP_Y = 0.93`.

Все боксы делят **один** экземпляр `skin` — цвет меняется разом для всего тела.

### 5.1.3 Лампы (`HomeScene` + собственная копия в `PveScene`)

| Часть | Материал | Значения |
|---|---|---|
| отражатель | `MeshStandardMaterial` | `0x161a24` · `flatShading` · `roughness 0.9` · `metalness 0.2` · `DoubleSide`; `ConeGeometry(0.55, 0.5, 16, 1, true)` |
| штанга | `MeshStandardMaterial` | `0x0c0f16` · `roughness 0.8` · `metalness 0.3`; радиус `0.018` |
| лампочка | `MeshBasicMaterial` | `0xffb368` · `opacity 0.95`; `SphereGeometry(0.12, 10, 8)` |

### 5.1.4 Двери режимов (`modePlates.js`)

`body 0x14182a` (та же мастерская, что и плита дома) · `rim 0x7184b0` при `rimOpacity 0.2` (в отличие от арены — **не светится**) · масштаб `0.6` от домашней плиты · фаска `0.34` · тайл гекса `5.0`.

**FORGE:** фигуры кольца `0x2b3446`, гексарх `0x4a5a78`, ядро `core 0.1` в покое → `coreLit 1.7` при подсветке, радиус `0.085`. Пьедестал `pedR 0.34`, `pedThick 0.11`, `pedGap 0.03`, `pedEdge 0.22`, `pedGlow 0.5`.

**ARENA:** перчатки — верх `0x262f42` (матовое семейство), низ `0x8e1a4a` (тот же тон с подмешанным розовым, **запечён в вершинный цвет**, не свет). Радиус кулака `0.35`, зазор `±0.36`, высота `0.86`. Разлом: жёлоб `0.13`, ореол `0.3`, ядро `0.1`; ореол `haloRest 0.22 → haloOpacity 0.55`, ядро `coreRest 0.46 → coreOpacity 0.85`.

`dimLevel 0.55` — яркость **непод свеченной** двери, пока горит вторая. `litLerp 6.5` 1/с.

### 5.1.5 Пьедестал гексарха (`legendPresence.js`)

`CylinderGeometry(size, size·0.88, thickness, 6, 1)`, `MeshStandardMaterial 0x1b2433` · `flatShading` · `roughness 0.92` · `metalness 0.12`.
Янтарные рёбра: `LineBasicMaterial 0xffb21d` · `opacity 0.18` · `fog false`.
Контактный диск: радиальная `rgba(255,205,140,0.95) → rgba(255,178,90,0)` стоп `0.5`, `color 0xffb21d`, `opacity = PED.glow × 0.55`, `AdditiveBlending`, `fog false`.
Дымка: `hazeDensity 90` · `hazeRadius 0.95` · `hazeHeight 1.5` · `hazeColor 0xffce85` · `hazeSize 0.13` · `hazeOpacity 0.34`.
Дым: `amount 44` · `length 1.15s` · `rise -0.32` · `spread 0.14` · `size 0.15` · `opacity 0.30` · `emitPerSec 30`.

### 5.1.6 Поле пространства (`SpaceScene`)

`FIELD = { size: 46, repeat: 18, baseColor: 0x0d1120, lineOpacity: 0.5, y: 0.5 }`. База — `MeshStandardMaterial roughness 0.95 metalness 0.1`; решётка — `MeshBasicMaterial` с гекс-текстурой, `opacity 0.5`, `depthWrite false`.

---

## 5.2 Свет

### 5.2.1 Одинаковая тройка на трёх сценах

`ArenaScene`, `PveScene`, `HomeScene` — **побайтово одинаковый набор**:

| Тип | Цвет | Интенсивность | Позиция |
|---|---|---|---|
| `DirectionalLight` (ключ) | `0xfff2e8` | `2.3` | `(4, 10, 6)` |
| `AmbientLight` | `0x2a3550` | `0.5` | — |
| `HemisphereLight` | небо `0x44506e` / земля `0x05060c` | `0.4` | — |

### 5.2.2 Дополнительные источники

| Сцена | Источник | Значения |
|---|---|---|
| HomeScene | контр-заливка `FAR_FILL` | `DirectionalLight 0x9fb0cc`, `0.75`, `x -4, y 9, zOffset -10` |
| HomeScene / PveScene | 4 лампы `PointLight` | `0xffb368` · `intensity 16` · `distance 18` · `decay 2`; позиции `(-1.9,-0.5)`, `(1.9,0.5)`, `(0.1,-1.5)`, `(-0.3,1.4)`, `drop 0/0.7/0.3/1.0`; мерцание `flicker 0.05` @ `flickerSpeed 1.3`; потолок `7.3`, трос `1.6` (PVE: `hangLift 1.2`) |
| SpaceScene | своя тройка | ключ `0xfff2e8 @ 2.6`, поз. `(4,16,6)` · hemi `0x7a6650`/`0x0c0e16 @ 1.25` · ambient `0x463f3a @ 0.9` |
| FighterLabScene | своя четвёрка | ключ `0xffffff @ 1.7` · заливка `0x8fa0c0 @ 0.7` · ambient `0x3a4256 @ 0.75` · hemi `0x586a90`/`0x0d0f16 @ 0.55` |

### 5.2.3 Тени

**Теней нет нигде.** `renderer.shadowMap` не включён ни в одной сцене; `castShadow` / `receiveShadow` не встречаются ни разу. Комментарии («no shadow maps (pure fill)», «no shadows (mobile)») это подтверждают.

### 5.2.4 Настройки рендерера

Все четыре живые сцены:

```
antialias: true
alpha: true                     (кроме ArenaScene / HomeScene — там в объекте настроек)
powerPreference: 'high-performance'
setPixelRatio(Math.min(devicePixelRatio, maxDPR))
maxDPR = lowPowerDevice() ? 1.5 : 2
outputColorSpace = THREE.SRGBColorSpace
```

`lowPowerDevice()` = `hardwareConcurrency <= 4 || deviceMemory <= 4`.

**`toneMapping` и `toneMappingExposure` не задаются нигде** → действует умолчание Three.js (`NoToneMapping`, экспозиция `1`). FighterLabScene жёстко ограничивает DPR числом `2` без проверки устройства.

---

## 5.3 Туман и фон

### 5.3.1 Туман

| Сцена | Тип | Цвет | Параметры |
|---|---|---|---|
| ArenaScene | `FogExp2` | `0x070811` | плотность `0.03` |
| PveScene | `FogExp2` | `0x070811` | плотность `0.03` |
| SpaceScene | `FogExp2` | `0x070811` | плотность `0.019` |
| HomeScene | `Fog` (линейный) | `FLIGHT.fogRest` | `near/far` = `FLIGHT.fogNearHome/fogFarHome`, **пересчитываются каждый кадр** режиссёром пролёта (`transitionFlight.applyFog`) |
| FighterLabScene | — | — | тумана нет |

### 5.3.2 Купол фона

`HomeScene.BACKDROP` / `PveScene.BACKDROP` — **два почти одинаковых блока**:

| Параметр | HomeScene | PveScene |
|---|---|---|
| `radius` | `58` | `45` |
| `centerY` | `1.6` | `1.6` |
| `centerZ` | `null` → середина коридора | не задан |
| `texW` / `texH` | `1024` / `1024` | `1024` / `1024` |
| градиент | `[0, #060710] [0.42, #0a0a12] [0.62, #120f0c] [1.0, #1b150d]` | **идентичен** |
| `hexCols` | `60` | `60` |
| `hexRGB` | `'255,186,120'` | `'255,186,120'` |
| `hexMaxAlpha` | **`0`** | **`0`** |
| `hexFadeStart` / `End` | `0.46` / `0.62` | `0.46` / `0.62` |
| `dither` | **`0`** | **`0`** |

`hexMaxAlpha: 0` означает, что функция `drawHexWeave()` в обеих сценах проходит цикл по всем гексам и на каждом выходит по `if (a <= 0.002) continue` — **не рисует ничего**. То же с `dither: 0`. Функции `strokeHex` + `drawHexWeave` (около 25 строк, продублированы в обоих файлах) исполняются вхолостую.

### 5.3.3 Виньетка — четыре близких, но разных значения

| Сцена | Значение |
|---|---|
| Арена | `radial-gradient(ellipse 75% 75% at 50% 48%, transparent 55%, rgba(3,3,8,0.55) 100%)` |
| Дом | `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 56%, rgba(3,3,8,0.55) 100%)` |
| FORGE | `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 56%, rgba(3,3,8,0.55) 100%)` — **совпадает с домом** |
| Пространство | `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 54%, rgba(3,3,8,0.6) 100%)` |
| (мёртвая) `.app-v2 .vignette` | двухслойная, `rgba(0,0,0,.55/.85)` + `rgba(0,0,0,.7)` — разметки нет |

---
## 5.4 Камера

| Сцена | FOV | near / far | Стартовая позиция | Прицел | Управление |
|---|---|---|---|---|---|
| ArenaScene | `42` | `0.1 / 100` | — | — | орбита |
| HomeScene | `42` | `0.1 / 100` | `CAM_BASE = (4.6, 5.2, 6.7)` | боец, `target.y = topY + 1.1` | орбита `HOME_ORBIT = { minDist 3.5, maxDist 12, polarMin 0.3, polarMax 1.4 }` |
| PveScene | `42` | `0.1 / 100` | направление `dir = [0, 1.65, 9.6]` | измеряется по составу | **фиксированная**, без орбиты; `minDist 4.5`, `maxDist 22`, `moveSec 0.55` |
| SpaceScene | `CAM.fov = 44` | `0.1 / 200` | `tiltDeg 58`, `headingDeg 30`, `dist 34` | центр поля, `targetLift 1.0` | свободная орбита, `zoomMin 12`, `zoomMax 46`, `damping 0.08`, `polarMin 0.18`, `polarMax 1.48`, `panMargin 3`, авто-возврат `returnDelay 2.0s`, `returnLerp 0.05` |
| FighterLabScene | `45` | `0.1 / 100` | — | — | dev |

**Три разных FOV на пяти сценах** (42 / 44 / 45), при этом дом, FORGE и арена делят один (42).

### Слежение за бойцом (HomeScene)

`FOLLOW_DEADZONE = 0.75` (в этом радиусе опорная точка стоит) · `FOLLOW_LERP = 1.3` 1/с (догон за границей мёртвой зоны, шаг ограничен `min(0.05, dt)`).

### Ярлык у бойца (HomeScene)

`TAG = { headY: 2.05, nearOn: 5.3, nearOff: 6.5 }` — гистерезис 1.2 единицы, чтобы подпись не мигала на границе.

### Кадрирование FORGE (доли холста)

```
overviewPortrait  { x0 .05  x1 .95  y0 .11  y1 .70 }
overviewLandscape { x0 .05  x1 .95  y0 .15  y1 .95 }
workPortrait      { x0 .08  x1 .92  y0 .17  y1 .56 }
workLandscape     { x0 .04  x1 .58  y0 .13  y1 .93 }
```
`workPortrait.y1 = 0.56` намеренно согласован с `--fg-band: 40vh` в `forge.css` (комментарий это фиксирует). При `(orientation: portrait) and (max-height: 700px)` полоса становится `42vh` — **а число в камере не меняется**.

---

## 5.5 Свечение в объёме — что реально светится

Считаны все объекты с `AdditiveBlending` и все неосвещаемые (`MeshBasicMaterial`) яркие материалы.

| Модуль | Аддитивных материалов |
|---|---|
| `buildArena.js` | 3 (ленты разлома, стена, искры) |
| `buildFighter.js` | 2 (ореол ядра, искра удара) |
| `modePlates.js` | 3 (ядро гексарха, ореол разлома, ядро разлома) |
| `legendPresence.js` | 3 (диск пьедестала, дымка, дым) |
| `HomeScene.vue` | 4 (пыль, тёплая лужа, ореолы ламп ×N, ещё один) |
| `PveScene.vue` | 1 (лужа под бойцом) |
| `SpaceScene.vue` | 2 (диск маяка, световая колонна) |
| `ArenaScene.vue` | 0 (всё из `buildArena`) |
| `FighterLabScene.vue` | 1 |

### Пофасадный разбор

**Арена (`/play/arena`).** Разлом: 4 ленты + завеса + 12 искр, все пульсируют **одним множителем** (`arenaPresence`: `f = 0.91 + 0.09·sin(t·2π/5)` — период 5 с). Базовые прозрачности: завеса `0.85`, ореол `0.8`, ядро `0.95`, ближний гребень `0.3` (цвет `0xffd9e6`), искры `0.8`. Вспышка при попадании: `+0.55`, спад за `0.32 с`. Плюс два ядра бойцов (игрок `1.0`, соперник `0.55`). **Итого: разлом (как одно) + 2 ядра.**

**Дом (`/play/home`).** Разлом **погашен**: `riftGlow.forEach(r => r.mat.opacity = 0)`, `sparks.points.visible = false`, все `isLine` скрыты. Остаётся: ядро бойца (`opacity 0.8`) · 4 лампочки `MeshBasicMaterial 0xffb368 @ 0.95` · 4 ореола ламп (`HAZE`: `0xffb368`, `opacity 0.14`, `scale 2.6`) · пыль (`DUST`: 110 точек, `0xffb368`, `opacity 0.4`, размер `0.16`) · тёплая лужа (`GLOW`: радиус `1.9`, `0xffb368`, `opacity 0.3`). **Итого: 1 «яркое» + 10 тёплых дымных источников.**

**Режимы (`/play/mode`).** В покое **обе двери матовые**. При наведении светится ровно одна: FORGE — янтарное ядро (`0.1 → 1.7`), ARENA — разлом (ореол `0.22 → 0.55`, ядро `0.46 → 0.85`). Вторая гаснет до `dimLevel 0.55`. Плюс всё домашнее с предыдущего абзаца, приглушённое `applyHomeGlowGate` по мере ухода камеры.

**FORGE (`/play/pve`).** Ядра ростера в покое **матовые**: `CORE_LIGHT.rest = 0.14`, поднимается до полного только у наведённого / выбранного, `lerp 7.0` 1/с. Плюс лужа под каждым бойцом (`GLOW.opacity 0.16`, радиус `1.3`, цвет — **ядро этого бойца**, не янтарь) — то есть при 8 бойцах на плите 8 цветных луж. Плюс гексарх: янтарные рёбра `0.18`, диск `PED.glow × 0.55`, дымка 90 частиц `@ 0.34`, дым 44 `@ 0.30`. Плюс лампы. **Итого: 1 янтарный якорь + до 8 цветных луж + до 8 ядер (одно яркое) + 4 лампы.**

**Пространство (`/play/space`).** Один маяк лидера: диск радиуса `2.0` `@ 0.5` + колонна радиуса `0.7`, высотой `4.4` `@ 0.11`, дыхание `pulse 0.16` @ `pulseSpeed 1.3`, слежение `followLerp 0.09`. Ядра **всех 14 бойцов** горят по обычному правилу `buildFighter` (`opacity 0.8`, цвета циклом по четырём). **Итого: 1 розовый маяк + 14 цветных ядер.**

---

## 5.6 Нагрузка

| Что | Значение | Где |
|---|---|---|
| бойцов на поле пространства | **14** (`rosterCount`, диапазон 12–16) | `SpaceScene.CONFIG` |
| бойцов в зале FORGE | до **8** (из хранилища `roster`, кэп 8) | `PveScene` |
| бойцов на арене | 2 | `ArenaScene` |
| бойцов дома | 1 | `HomeScene` |
| фигур в кольце FORGE-двери | `ringCount 5` | `modePlates` |
| частиц пыли (дом) | `count 110` | `HomeScene.DUST` |
| искр разлома | `sCount 12` | `buildArena` |
| частиц дымки гексарха | `hazeDensity 90` | `legendPresence` / `PveScene.LEGEND` |
| частиц дыма гексарха | `amount 44` | `legendPresence.SMOKE` |
| ламп | 4 | `HomeScene`, `PveScene` |
| пыль в FORGE | **удалена** (комментарий: «REMOVED on PVE») | `PveScene` |
| пыль в пространстве | ламп и пыли нет вовсе | `SpaceScene` |

Счётчик полигонов: `perfProbe.js` считает `plateTris` / `plateHiddenTris` / `minFps` — только по требованию, через `?perf=1`. Жёстко зашитого бюджета треугольников в коде нет.

Размер текстур: гекс-сетка `1024×1024`, купол фона `1024×1024`, радиальные спрайты `128×128`, ленты разлома `8×128`.

---

## 5.7 Настроечные блоки

Все блоки, вынесенные наверх файла «для подкрутки на превью»:

| Файл | Блок | Что настраивает |
|---|---|---|
| `buildArena.js` | `PLATFORM` | геометрия плиты и щели (5 чисел) |
| `HomeScene.vue` | `CAM_BASE` | стартовая позиция камеры |
| | `TAG` | порог показа подписи бойца (3) |
| | `FAR_FILL` | контр-заливка дальнего конца (5) |
| | `LAMPS` | лампы: подвес, форма, цвет, свет, позиции, мерцание (16) |
| | `DUST` | пыль (12) |
| | `GLOW` | тёплая лужа (5) |
| | `BACKDROP` | купол фона (13) |
| | `HAZE` | ореолы ламп (4) |
| | `FOLLOW_DEADZONE` / `FOLLOW_LERP` | слежение камеры (2) |
| | `HOME_ORBIT` | коридор орбиты (4) |
| `PveScene.vue` | `CONFIG` | расстановка ростера (8) |
| | `CAM` | направление, тайминг, 4 прямоугольника кадрирования, пределы (8) |
| | `WORK` | место работы с бойцом, гашение остальных (4) |
| | `CORE_LIGHT` | яркость ядер в покое (2) |
| | `LEGEND` | гексарх (6) |
| | `CORE_PALETTE` / `LEGEND_HUE` | цвета |
| | `LAMPS` / `GLOW` / `BACKDROP` | **копии домашних** |
| `SpaceScene.vue` | `FIELD` | поле (5) |
| | `CONFIG` | ростер и разброс (6) |
| | `LEADER` | маяк (8) |
| | `CAM` | камера и авто-возврат (13) |
| | `CORE_PALETTE` | цвета |
| | `LIGHT` | свет (3 группы) |
| `modePlates.js` | `MODE_PLATES` | двери целиком: раскладка, тона, акценты, эмблемы FORGE и ARENA (~50 чисел) |
| `legendPresence.js` | `DEFAULTS` + `PEDESTAL` + `ORBIT` + `SMOKE` | гексарх (~30) |
| `transitionFlight.js` | `FLIGHT` | пролёт дом⇄режимы, включая туман |
| `data/combatBalance.js` | весь файл | 527 строк боевых чисел |
| `data/intentionMotion.js` | `INTENTION_MOTION` | 7 намерений × (speedMul + 5–6 каналов позы) |
| `services/sceneLoading.js` | `LOADING` | 3 тайминга + 4 внутренние константы |
| `data/upgradeData.js` | — | ядра, грани, цвета |

---
# ЧАСТЬ III · Расшифровка слов

## 6.1 «Матовый хром»

Стоит **`.hs-chrome`** в `home.css` — один материал на четыре элемента: SHOP, back, чип кабинета, EDIT SPACE. Прямоугольник, радиус **явно `0`**, никаких скруглений и фасок.

| Состояние | Полный набор значений |
|---|---|
| **покой** | высота `44px` · паддинг `0 18px` · рамка `1px solid rgba(200,209,216,0.16)` · фон `rgba(22,22,27,0.55)` · `backdrop-filter: blur(8px)` (+ `-webkit-`) · текст `#c8d1d8` · глиф `17×17` · подпись Saira `700 / 14px / .14em / uppercase` |
| **наведение** | рамка → `rgba(216,227,234,0.45)` · фон → `rgba(28,30,37,0.72)` · текст → `#fff` · `box-shadow: 0 0 0 1px rgba(216,227,234,0.45), 0 0 18px 2px rgba(200,209,216,0.22)` · `translateY(-1px)` · однократный блик `hs-sheen 0.6s` (градиент `105deg`, `rgba(216,227,234,0.18)` на 50%, проход `-130% → 130%`) |
| **нажатие** | текст `#fff` · `box-shadow: 0 0 0 1px rgba(216,227,234,0.8), 0 0 14px 1px rgba(200,209,216,0.3)` · `scale(0.985)` · длительность `--hs-press = 0.12s` |
| **фокус** | `outline: none` + `box-shadow: 0 0 0 2px #08080a, 0 0 0 4px rgba(216,227,234,0.7)` — двойное кольцо с чёрным зазором |
| **выключено** | рамка `rgba(255,255,255,0.09)` · фон `rgba(22,22,27,0.4)` · текст `#5d5d66` · тени нет · трансформации нет · `cursor: not-allowed` |
| **уменьшенное движение** | переходы сокращены до цветовых, `::after` (блик) `display: none`, подъём и нажатие обнулены |

Переход: `border-color, background, box-shadow, color, transform` — все по `--hs-hover (0.22s)` с кривой `--ease-weight cubic-bezier(0.55, 0, 0.12, 1)`.

**Слово честное.** Материал существует, собран в одном месте, все шесть состояний прописаны. Розового в нём нет ни в одном состоянии — свечение холодно-белое.

**Но:** на мобиле (`≤560px`) SHOP и кабинет схлопываются в квадраты `44×44` и **теряют подпись** (`.n { display: none }`) — глиф `17px` остаётся один в коробке 44px.

---

## 6.2 «Геройское свечение»

Стоит **`.hs-fight`** — кнопка FIGHT, три слоя:

| Слой | Значения |
|---|---|
| `f-bloom` (единственное свечение) | `150% × 230%` от кнопки · `opacity 0.6` · `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,0,105,0.5), rgba(255,0,105,0.12) 45%, transparent 70%)` · `filter: blur(14px)` |
| `f-plinth` (тумба, толщина) | `clip-path: var(--hs-hex)` · `linear-gradient(180deg, #7a0033 0%, #4a0020 55%, #2c0013 100%)` · сдвинут `translateY(6px)` |
| `f-face` (лицо) | `clip-path: var(--hs-hex)` · `linear-gradient(180deg, #ff2d82 0%, #ff0069 42%, #e4005f 100%)` · `box-shadow: inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -5px 14px rgba(120,0,40,0.5)` · паддинг `20px 76px` · зазор `22px` |
| надпись | Saira `900 / 40px / .13em` · `#fff` · `text-shadow: 0 1px 0 rgba(120,0,40,0.5)` |
| стрелка | `28×28` |
| подпись | JetBrains Mono `11px / .26em` · `#c4c0cb` |

Форма гекса: `polygon(24px 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 24px 100%, 0 50%)`.

| Состояние | Значения |
|---|---|
| **покой (в движении)** | плита оседает `fSettle 5.4s ease-in-out` (`translateY 0 → -1.5px`) · ореол дышит `fGlow 3.6s ease-in-out` (`opacity 0.6→0.92`, `scale 1→1.07`) · блик `fSheen 6.4s --ease-settle` (`background-position 185% → -90%`, отдыхает вне кадра) |
| **наведение** | лицо `translateY(-5px)` + `brightness(1.04)` · тумба `translateY(9px)` · ореол: анимация **выключается**, `opacity 1`, `scale 1.16` · стрелка `translateX(6px)` · всё по `0.42s --ease-weight` |
| **нажатие** | лицо `translateY(4px) scale(0.992)` + `brightness(0.97)` · тумба `translateY(2px)` · ореол `opacity 0.7 scale(0.92)` · длительность `0.11s` |
| **фокус** | **не определён** — своего правила у `.fbtn` нет |
| **выключено** | **не определено** |
| **уменьшенное движение** | дыхание/блик/оседание не запускаются (за `no-preference`); наведение и нажатие обнулены полностью — лицо, тумба, ореол и стрелка стоят в покое, тумба зафиксирована на `translateY(6px)`, ореол на `opacity 0.6` |

**Телефон на боку** (`landscape` + `max-height: 560px`): паддинг `11px clamp(34px,6vw,56px)` · надпись `clamp(22px, 7vh, 30px)` · стрелка `20×20` · ореол `blur(11px)` · подпись `9.5px / .2em`.
**Мобила** (`≤560px`): ширина `min(340px, 86%)`, паддинг `18px 34px`, надпись `32px`.

**Слово честное и очень плотное** — но нет состояний «фокус» и «выключено» у главной кнопки игры.

---

## 6.3 «Ободок на касании»

**За этим словом в коде ничего не стоит.**

Что найдено при поиске:
- `MODE_PLATES.touchTwoStep = false` — флаг «первый тап подсвечивает, второй входит» **выключен**. При включении первый тап зажигал бы дверь (`setHover(id)`) — но это подсветка двери, а не ободок, и в текущем состоянии не работает.
- `-webkit-tap-highlight-color: transparent` — три места (`ForgeTree` ×2, `CoreSelectView`): системный ободок касания **убран**, взамен ничего не поставлено.
- `:focus-visible` — есть, десять разных стилей (§4.5.3), но это клавиатурный фокус, а не касание; на тач-устройствах он не срабатывает.

Единственное, что похоже: `.hs-chrome:active` даёт кольцо `0 0 0 1px rgba(216,227,234,0.8)` — но это состояние нажатия, оно живёт доли секунды и держится, пока палец на экране.

**Вывод: правила «ободок на касании» в коде нет.** Есть три разрозненных механизма, ни один не описывает единый ободок.

---

## 6.4 «Единственное свечение на экране»

| Сцена | Заявлено в комментариях | Фактически светится |
|---|---|---|
| **Арена** | «one pink, one glow (the rift)» | **разлом** (5 материалов, пульсируют одним множителем `0.91 ± 0.09`, период 5 с) + **2 ядра бойцов** (`0.8` и `0.8×0.55`). Ядро объявлено вторым разрешённым свечением — итого **2 сущности**, но 7 светящихся объектов. |
| **Дом** | «the ONLY glow on this scene is the fighter's core» | **1 ядро** (`0.8`) — плюс **4 лампочки** `MeshBasicMaterial 0xffb368 @ 0.95` (неосвещаемый материал = светится сам), **4 ореола ламп** (`0.14`), **110 частиц пыли** (аддитивные, `0.4`), **тёплая лужа** (`0.3`). Разлом честно погашен в ноль. Итого **1 яркая точка + 10 тёплых дымных источников**. |
| **Режимы** | «at rest BOTH plates are matte: nothing glows» + «Each island lights exactly ONE thing» | В покое двери матовые — **правда**. При наведении горит ровно одна: FORGE `core 0.1→1.7`, ARENA `halo 0.22→0.55` + `core 0.46→0.85`. Плюс вся домашняя атмосфера, приглушаемая по мере ухода камеры. Правило «две горящие двери — баг, а не состояние» в коде реализовано (`setHover` может зажечь только одну). |
| **FORGE** | «At rest every core is MATTE — eight lit cores in four colours is a Christmas tree» | Ядра в покое `CORE_LIGHT.rest = 0.14` — **правда**. Но каждый боец получает **свою лужу цвета своего ядра** (`GLOW.opacity 0.16`, радиус `1.3`) — при 8 бойцах это 8 цветных пятен на плите. Плюс янтарь гексарха (рёбра `0.18`, диск `~0.28`, 90 частиц дымки `0.34`, 44 дыма `0.30`) + 4 лампы. |
| **Пространство** | «the scene's SINGLE glow, pink» | Маяк лидера — **один**. Но у **всех 14 бойцов** ядра горят по обычному правилу `buildFighter` (`opacity 0.8`), четырьмя цветами циклом. Итого **15 светящихся сущностей**. |

**Вывод.** Правило соблюдается там, где под ним есть механизм (двери, ядра FORGE в покое, гашение разлома на доме). Там, где его нет, — не соблюдается: 14 ядер в пространстве и 8 цветных луж в FORGE светятся штатно, потому что светимость ядра зашита в `buildFighter` и снаружи не гасится.

---

## 6.5 «Ядро бойца»

`src/scene/buildFighter.js:126-146`:

| Часть | Значения |
|---|---|
| кристалл | `OctahedronGeometry(0.06, 0)`, `MeshBasicMaterial`, цвет = переданный `pink` × `coreDim`; позиция `(0, 0.4, -0.16)` — перед грудью |
| ореол | `Sprite`, текстура `rgba(255,235,243,0.95) → pink@0.5` (стоп `0.4`), `AdditiveBlending`, `depthWrite false`, `opacity 0.8 × coreGain`, масштаб `0.34³` |

**Свой против чужого — разница ровно в двух числах:**

| | `coreDim` (яркость кристалла) | `coreGain` (яркость ореола) | цвет тела |
|---|---|---|---|
| игрок | `1.0` | `1.0` → `opacity 0.8` | `0x1c2233` |
| соперник | `0.7` | `0.55` → `opacity 0.44` | `0x141b2e` (темнее и холоднее) |

Цвет **не меняется** — «тот же `#FF0069`, второго цвета нет» (комментарий подтверждается кодом).

Нейтральный режим (dev): `setNeutralColor(true)` → тело `0x23262e` у обоих, кристалл и ореол `visible = false`.

Цвет ядра в игре приходит снаружи: на арене/дома — `--hex-primary`, в FORGE и пространстве — цвет ядра бойца из `upgradeData` (см. §7 о расхождениях).

Гашение в покое (только FORGE): `CORE_LIGHT.rest = 0.14` множителем, подъём до `1.0` у наведённого/выбранного, `lerp 7.0` 1/с.

---

## 6.6 «Разлом»

Строится в `buildArena.js`, состоит из **пяти** частей, все `AdditiveBlending` + `fog: false` + `depthWrite: false` (но с включённым тестом глубины — плиты обрезают свечение до щели):

| Часть | Геометрия | Текстура | Базовая прозрачность |
|---|---|---|---|
| завеса дальней стены | лента `topY … topY − 0.7`, по дальней рваной кромке, смещение `+0.02` | `makeWallGlowTexture`: `0 → pink@0`, `0.5 → pink@0.12`, `0.8 → pink@0.5`, `0.95 → pink@0.85`, `1.0 → rgba(255,240,247,0.95)` | **`0.85`** |
| розовый ореол | плоская лента, полуширина `0.13`, `y = topY − 0.06` | `makeHaloBandTexture`: `0.42 → pink@0.4`, `0.5 → pink@0.95`, `0.58 → pink@0.4`, спад к `0.7` | **`0.8`** |
| горячее ядро | плоская лента, полуширина `0.07`, `y = topY − 0.02` | `makeCoreBandTexture`: `0.46 → pink@0.6`, `0.5 → rgba(255,250,252,1)`, `0.54 → pink@0.6` | **`0.95`** |
| ближний гребень | лента, смещение `+0.12`, полуширина `0.05`, `y = topY + 0.006`, цвет перекрашен в `0xffd9e6` | halo-текстура | **`0.3`** |
| искры | 12 точек, `PointsMaterial size 0.06`, текстура `rgba(255,250,252,0.95) → pink@0.55` стоп `0.4`, `sizeAttenuation` | — | **`0.8`** |

Линия разлома: `riftCenterline(seed 2026, +3 → −3, 24 сегмента, amp 0.42)` — мелкое дрожание `±0.07`, с вероятностью `0.32` резкий зуб `0.2 + rnd·0.42`. Щель постоянной ширины `slitHalf = 0.12`.

**Пульс** (`arenaPresence.js`): один множитель на все пять — `f = 0.91 + 0.09·sin(t·2π/5)`, период **5 секунд**. Вспышка при попадании: `+0.55`, линейный спад за `0.32 с`. Искры поднимаются от `yMin −0.25` на `span 1.05`, скорости `0.12…0.42`.

**Где включён:** арена (`ArenaScene`), дверь ARENA (собственная упрощённая копия в `modePlates.arena`).
**Где погашен:** дом и FORGE — `arena.refs.riftGlow.forEach(r => r.mat.opacity = 0)` + `sparks.points.visible = false` + скрытие всех `isLine`. Само построение при этом отрабатывает — объекты создаются и потом гасятся снаружи.
**Уменьшенное движение:** `f = 1` (застывает на полной яркости), искры скрыты.

---
## 6.7 «Янтарь гексарха»

`#FFB21D`. Объявлен в двух местах: `MODE_PLATES.amber = '#FFB21D'` (дверь FORGE) и `PveScene.LEGEND_HUE = '#FFB21D'` (гексарх в зале). В `legendPresence.js` записан как `0xffb21d`.

| Где применён | Значение |
|---|---|
| рёбра пьедестала | `LineBasicMaterial 0xffb21d`, `opacity 0.18`, `fog: false` |
| контактный диск на пьедестале | `MeshBasicMaterial 0xffb21d`, текстура `rgba(255,205,140,0.95) → rgba(255,178,90,0)` стоп `0.5`, `opacity = PED.glow × 0.55`, `AdditiveBlending`, `fog: false`, размер `PED.size × 2.1` |
| ядро гексарха на двери FORGE | `core 0.1` в покое → `coreLit 1.7` при подсветке, радиус `0.085` |
| дымка вокруг гексарха | цвет `0xffce85` (**не `#FFB21D`**), 90 частиц, `size 0.13`, `opacity 0.34` |

**Чем отличается от розового по яркости.** Относительная светимость (sRGB):
- `#FFB21D` → **0.556**
- `#FF0069` → **0.221**

Янтарь **в 2.5 раза светлее** розового при равной прозрачности. То есть янтарное пятно той же непрозрачности читается заметно ярче розового. Это нигде не скомпенсировано числом — обе двери используют одинаковые `dimLevel 0.55` и одинаковые прозрачности.

Есть и третий тёплый: `0xffb368` (лампы, пыль, тёплая лужа, ореолы ламп, `HAZE`, `hexRGB '255,186,120'` купола) — светимость **0.593**. Он ещё светлее янтаря и живёт в отдельном «ламповом семействе». `0xffce85` (дымка) — четвёртый тёплый.

**Итого четыре тёплых оттенка** в одном визуальном семействе: `#FFB21D` (янтарь гексарха), `#FFB368` (лампы), `#FFCE85` (дымка), `#FFD930` (RAIDER в PveScene).

---

## 6.8 «Маяк лидера»

`SpaceScene.LEADER`, отмечает бойца с индексом `0` (детерминированно, смены лидера в превью нет):

| Часть | Значение |
|---|---|
| диск под ногами | радиус `2.0`, прозрачность `0.5`, цвет `--hex-primary` |
| световая колонна | радиус `0.7`, высота `4.4`, прозрачность `0.11` |
| слежение | `followLerp 0.09` за кадр |
| дыхание | `pulse 0.16` амплитуда, `pulseSpeed 1.3` — при уменьшенном движении отключено |

Оба объекта — `AdditiveBlending`. Это единственный розовый на сцене; ядра остальных 13 бойцов — четырьмя цветами ядер.

---

## 6.9 «Фон как ровный тёмный»

| Сцена | Как сделан |
|---|---|
| **Дом** | купол-сфера радиус `58`, текстура `1024×1024`, вертикальный градиент `#060710 → #0a0a12 (0.42) → #120f0c (0.62) → #1b150d (1.0)`, `MeshBasicMaterial`, `fog: false`. **Зернистость `dither = 0`. Гекс-плетение `hexMaxAlpha = 0`.** Оба выключены. |
| **FORGE** | тот же купол, радиус `45`, **тот же градиент**, `dither = 0`, `hexMaxAlpha = 0` |
| **Пространство** | свой купол + туман `FogExp2 0x070811 @ 0.019` |
| **Арена** | купола нет, только туман `FogExp2 0x070811 @ 0.03` |
| **Магазин** | плоский `#101019` (`--shop-bg`), один ровный тон на всю страницу |
| **Лендинг** | `LandingBackground.vue` — `.lp-bg__scanlines` + `.lp-bg__grain` + `.lp-bg__vignette`; внутренняя виньетка `inset 0 0 220px 60px rgba(0,0,0,.7)` |
| **Экран загрузки / 404** | `radial-gradient(130% 80% at 50% 120%, #1a0010 0%, #0b060a 46%, #08080a 82%)` — одинаковый на обоих |

**Слово честное.** Зернистость и плетение выключены явными нулями, а не удалением кода: функции `strokeHex` и `drawHexWeave` (~25 строк) продублированы в `HomeScene` и `PveScene` и исполняются вхолостую на каждой сборке купола.

Отдельно живёт `.app-v2 .grain` (`opacity 0.035`, SVG-шум `baseFrequency 0.9`, `mix-blend-mode: overlay`, `z-index 200`) и `.app-v2 .scanlines` в `v24/effects.css` — **разметки для них нет**, они мертвы.

---

## 6.10 «Весомое движение»

Разложено на три уровня.

### Уровень 1 — вес бойца → манера перемещения (`buildFighter.js:610-614`)

```
speedMul = lerp(1.4, 0.6, weight01)     // лёгкий 1.4 · нейтральный 1.0 · тяжёлый 0.6
accelMul = lerp(1.25, 0.65, weight01)   // разгон и торможение
heavy01  = clamp(weight01·0.7 + tempo01·0.3, 0, 1)
```

Тяжёлый ходит в **2.3 раза медленнее** лёгкого и в **1.9 раза** ленивее набирает и гасит скорость.

Две полосы шага (`buildFighter.js:540-541`), до умножения на `speedMul`/`accelMul`:

| | `speed` | `accel` | `decel` | `swing` | `knee` | `arm` | `lean` | `bob` | `twist` |
|---|---|---|---|---|---|---|---|---|---|
| `SLOW` (сбор, обход) | `0.92` | `3.0` | `4.0` | `0.5` | `0.78` | `0.4` | `-0.05` | `0.035` | `0.05` |
| `FAST` (заход) | `2.0` | `8.0` | `6.5` | `0.66` | `1.0` | `0.55` | `-0.16` | `0.055` | `0.07` |

`FAST_DASH = 1.4` — максимальный разрыв, который заход закрывает одним броском. Джиттер скорости `±5%`.

Уклон (`combatBalance.dodge`): `speed 2.6`, `accel 14`, `decel 11`. Поворот корпуса `turnRate 3.2` рад/с. Множитель обхода `circleSlowMul 0.5`.

### Уровень 2 — фазы удара (`buildFighter.js`, клипы)

| Приём | `dur` | `windup` | `impact` | множитель урона |
|---|---|---|---|---|
| PUNCH (джеб) | `1.3` | `0.6` | `0.6` | `1.0` |
| INTERCEPT (сбив) | `0.55` | `0.2` | `0.2` | `1.0` |
| DOUBLE (двойка) | `1.45` | `0.32` | `0.32` и `0.58` | `1.33` ×2 |
| COMBO (тяжёлый) | `2.0` | `1.12` | `1.12` | `3.67` |
| HOOK | `0.95` | `0.5` | `0.5` | `1.7` |
| UPPERCUT | `1.0` | `0.52` | `0.52` | `1.9` |
| BODY SHOT | `0.85` | `0.42` | `0.42` | `1.2` |
| FRONT KICK | `0.55` | `0.28` | `0.28` | `2.2` |
| TEEP | `0.5` | `0.26` | `0.26` | `1.6` |
| KNEE | `0.45` | `0.22` | `0.22` | `2.6` |
| FEINT | `0.75` | `0.46` | нет | — |
| DODGE | `DODGE_DUR` | нет | нет | — |
| STAGGER | — | — | — | длина `staggerDurationSec = 0.5` |

Замах = ровно половина длительности во всех ударных клипах. Медленнее всех COMBO: `2.0 с`, из них `1.12 с` замах — «самый болезненный единичный удар несёт самый долгий замах».

Просадка после удара: `lightDur 0.3` / `heavyDur 0.55` по весу приёма. Реакция на попадание: `reactStepDist 0.34` при весе `≥ reactStrongWeight 0.7`; отшатывание `dur 0.28`. Вспышка контакта `hitFlashSec 0.18`.

Ритм: тяжёлый получает паузу `heavyPause = lerp(-0.12, 0.4, weight01)` — тяжёлый бьёт редко и сильно, лёгкий сыплет.

### Уровень 3 — намерение ведёт тело (`intentionMotion.js`)

| Намерение | `speedMul` | стиль | поза (`lean` / `crouch` / `torso` / `sh` / `el` / `knee`) |
|---|---|---|---|
| PRESS | `1.10` | `press` | `-0.07 / -0.01 / -0.12 / 0.30 / 1.15` |
| STRIKE | `1.0` | `strike` | `-0.05 / -0.02 / -0.06 / 0.28 / 1.05` |
| STING | `1.35` | `sting` | `0.0 / 0.02 / 0.0 / 0.32 / 0.85` |
| HOLD | `0.55` | `plant` (вперёд) | `-0.08 / -0.03 / 0.12 / 0.58 / 1.72` |
| CATCH | `0.65` | `plant` (назад) | `0.07 / -0.13 / -0.02 / 0.45 / 1.40 / 0.55` |
| BREAK | `1.30` | `retreat` | `0.05 / 0.0 / -0.03 / 0.36 / 1.20` |
| BREATHE | `0.45` | `retreat` | `0.08 / -0.10 / 0.07 / 0.0 / 0.0` |

Размах `speedMul` по намерениям — **3× (0.45…1.35)**, и он умножается на вес (`0.6…1.4`), давая полный разброс скорости **`0.27…1.89`** от базовой.

Медленный «переминающийся» покой: `shiftPeriodSec 4.5`, `swayPeriodSec 6.0` — «медленное переминание, НЕ подпрыгивание».

### В интерфейсе

Кривая `--ease-weight: cubic-bezier(0.55, 0, 0.12, 1)` — заявлена как «heavy slab/chrome motion», применена в 4 местах: три перехода `.hs-chrome` и `0.42s` переходы плиты FIGHT. Инерции как числа в CSS нет — только форма кривой.

**Слово честное и самое проработанное из десяти.** Оно опирается на три независимых числовых слоя, каждый с явным диапазоном.

---
# ЧАСТЬ IV · Конфликты и расхождения

Отсортировано от самого грубого.

---

## K1 · Цвет ядра RAIDER — три разных значения в трёх файлах

| Файл | Значение | Роль |
|---|---|---|
| `src/data/upgradeData.js:20` | `hue: '#FFA526'`, `sup: '#FFC97A'` | **канонические данные игры** |
| `src/scene/SpaceScene.vue:88` | `hue: '#FFA526'` | совпадает с каноном |
| `src/scene/PveScene.vue:122` | **`hue: '#FFD930'`** | комментарий: «RAIDER = the bright tone» |
| `src/components/home/HomeShop.vue:278` | `main: '#FFA526'`, **`sup: '#FFD930'`** | `#FFD930` тут — вспомогательный, не основной |

В зале FORGE тот же боец светится **вспомогательным** тоном, а в пространстве и в магазине — основным. Один боец, два разных цвета ядра в зависимости от экрана.

## K2 · Вспомогательные цвета ядер — **все четыре** расходятся

| Ядро | `upgradeData.js` (канон) | `HomeShop.vue` |
|---|---|---|
| ONSLAUGHT | `#FF7A88` | **`#FF7A30`** |
| RAIDER | `#FFC97A` | **`#FFD930`** |
| BULWARK | `#7AE6D0` | **`#5DD6E6`** |
| AMBUSH | `#BFA0FF` | **`#D461FF`** |

Совпадений нет ни одного. Магазин красит карточки одним набором, дерево прокачки — другим.

## K3 · Розовый бренда — четыре записи + одна опечатка

| Запись | Где | Кому виден |
|---|---|---|
| `#FF0069` | `hexlash-ui.css --hex-primary` | глобально |
| `#FF0069` | `v24/tokens.css --hex-primary` | **повторное объявление** под `.app-v2`, перекрывает глобальное на всех `/play/*` |
| `#FF0069` | `colors.css --pink` (файл помечен DEPRECATED) | глобально |
| `#ff0069` (строчными) | 64 литерала в 8 локальных наборах (`--acc`, `--accent`, `--pink`, `--lash`, `--cab-acc`) | везде |
| **`rgba(255, 6, 105, …)`** | `FighterLabScene.vue:890,899` | `/dev/lab` |

Значение одно и то же, но объявлено 12 раз независимо. Одна перестановка цифр (`0069` → `0669`) прошла незамеченной.

## K4 · Файл, объявленный устаревшим, живёт и используется — а его переменные означают разное

`src/assets/colors.css` подписан: *«DEPRECATED. Kept for backward compatibility only. Will be removed after full migration.»* Он импортируется первым в `src/main.js`.

Фактическое употребление:
- `var(--primary-color)` — **38** мест в `PrivacyView.vue` + `locales/pages/rules/en.json`
- `var(--white)` — **20** в PrivacyView, **7** в `AuthSelectorView`, 1 в `landing.css`
- `var(--pink)` — **19** в `shop.css`
- `var(--scrollbar-bg)` / `--scrollbar-thin` — по 1 в `main.css`

Хуже другого: **`--white` означает разное в зависимости от места.**
- глобально (`colors.css`) → `#FFFFFF`
- внутри `.lp` (landing) → **`#f6f4f6`**
- внутри `.hx-auth` (AuthSelectorView) → **`#f6f4f6`**

То же с `--pink`: глобально `#FF0069`, внутри `.shopb` — своё объявление `#ff0069`. Значение совпадает, но связи нет: правка глобального файла не дойдёт до магазина.

## K5 · Два комплекта правил про свечение в магазине — оба в репозитории

`home.css` содержит блок `.sp-*` под заголовком **«SHOP · DECOR (zero glow)»** (~60 строк, строки ~320-380). Всё в нём матовое: подчёркивание вкладки без тени, ромб цены без тени, кнопка BUY без тени.

Живой магазин — это `HomeShop.vue` + `shop.css`, порт «BRIGHT direction», и он полон свечений: подчёркивание вкладки `0 0 12px var(--pink)`, точка кредо `0 0 8px`, кнопка BUY `0 0 18px → 0 0 30px` на наведении, героическая карточка `0 0 60px`, «лучшее предложение» `0 0 40px → 0 0 52px`, лента `0 0 18px`.

**Классы `.sp-wrap`, `.sp-h1`, `.sp-card`, `.sp-grid`, `.sp-tabs`, `.sp-price`, `.sp-btn`, `.sp-bg`, `.sp-lede`, `.sp-back` не встречаются ни в одном `.vue`/`.js` файле.** Блок мёртв, но шапка `home.css` до сих пор заявляет: *«Shop = zero glow»*.

## K6 · Три отдельных запроса к Google Fonts, два из них блокируют отрисовку, один семейство никому не нужно

| Запрос | Блокирует | Проблема |
|---|---|---|
| `index.html` — Saira Condensed 500-900 + JetBrains Mono 400/500/700 | нет (`preload` + подмена `rel`) | — |
| `v24/tokens.css` — **Archivo Black** + Space Grotesk 400-700 + JetBrains Mono 400/500 | **да** (`@import` в CSS) | грузится на **каждом** `/play/*`; `--font-display` (`Archivo Black`) имеет **0 потребителей**; `--text-dim`, `--text-mid`, `--bg-panel` — тоже **0**; `--font-body` — 1 (сам `.app-v2`) |
| `CoreSelectView.vue` — Saira Condensed **400**-900 + JetBrains Mono 400/500/700 | **да** (`@import` в scoped-стиле) | дублирует первый запрос, добавляя вес 400 |

Комментарий в `AppV2.vue` объясняет, зачем оставлен `hexlash-v24.css`: *«…so the account/wallet HUD styling tokens (--text-*, --font-*, --hex-*) still resolve»*. Из перечисленных живы только `--font-mono` (8) и `--bg-deep` (1). Обоснование устарело, а плата — блокирующая загрузка двух неиспользуемых шрифтовых семейств на каждом входе в игру.

## K7 · `v24/effects.css` — целиком мёртв

37 строк: `.app-v2 .grain` (SVG-шум, `opacity 0.035`, `z-index 200`), `.app-v2 .scanlines` (`z-index 160`), `.app-v2 .vignette` (двухслойный градиент, `z-index 150`).

Разметки нет ни для одного: `class="grain"` / `class="scanlines"` / `class="vignette"` в `.vue`-файлах отсутствуют. Лендинг рисует своё (`.lp-bg__grain`, `.lp-bg__scanlines`, `.lp-bg__vignette`), сцены — своё (`.arena-vignette`, `.home-scene-vignette`, `.pve-scene-vignette`, `.space-scene-vignette`).

Комментарий в `AppV2.vue` это подтверждает: *«the 3D CanvasLayer, ChallengeNotification and GlobalOverlays (grain/scanlines/vignette) were removed with the game»*. Стили остались, разметка ушла. Заодно остались три значения `z-index` (150/160/200), которые продолжают жить в общей шкале слоёв как «занятые».

## K8 · `opacity: 1.3` и `opacity: 1.35` — недопустимые значения, эффекта нет

`shop.css`:
```
.dcard:hover .gp-bloom { opacity: 1.35; }
.dcard:hover .gp-ring  { opacity: 1.3;  }
```
CSS приводит `opacity` к диапазону `0…1`. Замысел — «усилить свечение ядра на наведении» — не исполняется. Рядом задан переход `transition: opacity 0.3s`, который тоже ни к чему не приводит, если базовое значение уже `1`.

## K9 · Гекс-плетение и зернистость купола: код исполняется, результат — ничто

`HomeScene.BACKDROP.hexMaxAlpha = 0`, `dither = 0`. То же в `PveScene.BACKDROP`.

Функции `strokeHex()` и `drawHexWeave()` (примерно по 25 строк, **продублированы дословно в обоих файлах**) обходят весь купол `1024×1024` по всем `hexCols: 60` колонкам и на каждом гексе выходят по `if (a <= 0.002) continue`. Ни одного штриха не рисуется.

Заодно `hexRGB: '255,186,120'`, `hexFadeStart: 0.46`, `hexFadeEnd: 0.62` — три настройки того, чего нет.

## K10 · Одинаковые близнецы настроены по-разному

| Что | Разные значения |
|---|---|
| **виньетка сцены** | арена `75% 75% at 50% 48%` / `transparent 55%` / `.55` · дом и FORGE `78% 78% at 50% 50%` / `56%` / `.55` · пространство `80% 80%` / `54%` / `.6` |
| **купол фона** | дом `radius 58` · FORGE `radius 45`; всё остальное — дословная копия |
| **FOV камеры** | дом/FORGE/арена `42` · пространство `44` · лаборатория `45` |
| **плотность тумана** | арена `0.03` · FORGE `0.03` · пространство `0.019` · дом — линейный, пересчитывается каждый кадр |
| **блок ламп** | `HomeScene.LAMPS` и `PveScene.LAMPS` — идентичные значения, но **две независимые копии функции `buildLamps`** (~35 строк каждая); в PVE добавлено поле `hangLift: 1.2` |
| **`buildUnderGlow` / `GLOW`** | дом `radius 1.9`, `opacity 0.3`, `follow 0.06`, цвет янтарь · FORGE `radius 1.3`, `opacity 0.16`, `follow 0.08`, цвет **ядра бойца** |
| **ограничение DPR** | четыре живые сцены `lowPowerDevice() ? 1.5 : 2` · `FighterLabScene` — жёстко `2` |
| **пружина** | `--hs-spring` (home) и `--cab-spring` (cabinet) — **одно и то же** `cubic-bezier(0.22, 0.61, 0.36, 1)`, объявлено дважды |
| **длительность выдвижения** | панель кабинета `0.42s` · плита FIGHT `0.42s` · заголовок cabinet.css говорит «420ms spring» — совпадает |

## K11 · Одна и та же кривая записана двумя способами

`cubic-bezier(.2, .8, .2, 1)` — 8 употреблений в `landing.css`.
`cubic-bezier(0.2, 0.8, 0.2, 1)` — 1 употребление, объявлено как `--ease-settle` в `home.css`.

Это одна кривая. Поиск по строке их не свяжет.

Аналогично: `(max-width: 520px)` и `(max-width:520px)` — один порог, две записи. `.30em` и `.3em`. `.1` и `.10` в белой лестнице.

## K12 · Числа вписаны руками там, где рядом есть подходящая переменная

| Случай | Что вписано | Что рядом |
|---|---|---|
| `shop.css:156,158` | литерал `#101019` дважды | `--shop-bg: #101019` объявлен на `.shopb`; комментарий признаёт: *«the literal #101019 below IS --shop-bg; keep them in sync»* |
| межбуквенное | `1px`, `1.5px` в `.hex-pill` | все остальные 28 значений — в `em` |
| отступы | ~90 записей `padding`, ~40 значений `gap` | `--hex-spacing-sm/md/lg` использованы по 1 разу каждая |
| скругление | 17 разных радиусов | `--hex-radius-md` использована 1 раз |
| длительности | 55 из 58 значений вписаны прямо в место использования | `--hs-fast/hover/press` покрывают только 3 |
| цвет ядра BULWARK | `--core: #2ED6B0` литералом в `forge.css:28` | тот же цвет в `upgradeData.js` |
| розовый | 64 литерала `#ff0069` | `--hex-primary` |

## K13 · `hexlash-ui.css` — 204 строки из 255 не использует никто

Файл заявлен как «HEXLASH UI SYSTEM · Unified style file for the entire game». Фактически живёт только блок `:root` (строки 9–50) — 21 переменная. **Всё, что ниже, — мёртвый код.**

Проверены все 40 классов, объявленных в файле. Потребителей в `.vue`/`.js` — **ноль у каждого**:

| Группа | Классы | Потребителей |
|---|---|---|
| бейджи эффектов | `.mod-badge`, `.mod-badge-icon`, `.mod-badge--adrenaline/shield/blind` | 0 |
| анимации | `.hex-animate-fade-in`, `.hex-animate-scale-in`, `.hex-animate-pulse`, `.hex-pulse`, `.hex-glow-pulse`, `.hex-float-up` | 0 |
| переходы | `.hex-transition`, `.hex-transition-slow` | 0 |
| состояния | `.hex-hover-brighten`, `.hex-hover-lift`, `.hex-press` | 0 |
| Vue-переходы | `.hex-fade-*` (4), `.hex-slide-up-*` (4) | 0 |
| кнопка-таблетка | `.hex-pill` (+ своя `@media (min-width: 1024px)`) | 0 |
| утилиты | `.hex-flex*` (4), `.hex-gap-*` (3), `.hex-mt-*` (3), `.hex-mb-*` (3), `.hex-text-*` (3) | 0 |

Следом мертвы и все шесть `@keyframes` (`hex-fade-in`, `hex-scale-in`, `hex-pulse`, `hex-pulse-opacity`, `hex-glow-pulse`, `hex-float-up`) — на них ссылаются только мёртвые классы.

Следом мертвы и три переменные `--hex-dice-adrenaline / -shield / -blind`: они употреблены **только** внутри `.mod-badge--*`.

Комментарий над `.mod-badge` описывает его как «extracted from HudFight … для cross-component reuse» — компонента `HudFight` в проекте больше нет.

**Практическое следствие для сборки токенов.** Значения из этого файла нельзя брать как «то, как выглядит проект» — их никто не видел. Реальный вид задают локальные наборы `home.css` / `cabinet.css` / `forge.css` / `shop.css` / `landing.css`.

## K14 · Мёртвые и почти мёртвые переменные

| Переменная | Употреблений | Файл |
|---|---|---|
| `--font-display` (`Archivo Black`) | **0** | `v24/tokens.css` |
| `--bg-panel` | **0** | `v24/tokens.css` |
| `--text-dim` | **0** | `v24/tokens.css` |
| `--text-mid` | **0** | `v24/tokens.css` |
| `--hex-dice-adrenaline / -shield / -blind` | 2 каждая, **все внутри мёртвого класса** | `hexlash-ui.css` |
| `--hex-radius-md` | 1 (в мёртвом `.mod-badge`) → фактически **0** | `hexlash-ui.css` |
| `--hex-bg-medium` | 1 (в мёртвом `.hex-pill.is-active`) → фактически **0** | `hexlash-ui.css` |
| `--hex-spacing-sm/md/lg` | по 1 (в мёртвых `.hex-gap-*`) → фактически **0** | `hexlash-ui.css` |
| `--hex-primary-dark` | 1 | `hexlash-ui.css` |
| `--font-body` | 1 (сам `.app-v2`) | `v24/tokens.css` |
| `--bg-deep` | 1 | `v24/tokens.css` |

Плюс три `.ttf` Roboto в `src/assets/fonts/` при закомментированном `@font-face`.

## K15 · «Одна кнопка — три разных высоты»

Заявленная минимальная тач-зона — `44px` (17 объявлений, самое частое). Но:

| Элемент | Высота |
|---|---|
| `.hs-chrome` (SHOP / back / кабинет / EDIT SPACE) | `44px` |
| `.hs-abtn` (CANCEL / PLACE в режиме расстановки) | `13px 24px` паддинг → **≈45px**, но задан не высотой |
| `.sp-back`, `.dv-del`, `.cab-btn` | через паддинг, высота не задана |
| `.btn` в магазине | `11px 20px` (мобила) / `11px 22px` (десктоп) → **≈37px** — **ниже тач-минимума** |
| `.sb-tab` | `14px 4px` → **≈40px** |
| `.cab-x` (закрыть панель) | `34×34` — **ниже тач-минимума** |
| `.cab-tg` (переключатель) | `44×24` — по ширине проходит, по высоте нет |
| `.cab-foot .cf-soc a` | `28×28` — **ниже тач-минимума** |
| `.fg-card .close` | `44×44` — проходит |

Правило есть в трёх файлах и нарушено в четырёх местах.

## K16 · Уменьшенное движение покрыто не везде

Не покрыты:
- `hexlash-ui.css` — **бесконечные** анимации `hex-pulse` (1s), `hex-pulse-opacity` (1.5s), `hex-glow-pulse` (2s) идут всегда;
- `forge.css` — переходы `.fg-fade-*` (0.28s), появление `.fg-tag` (0.18s);
- `verify.css`;
- `v24/effects.css` (мёртв, но правила есть).

Три несовместимых подхода к выключению (перечисление / `!important`-молот на анимации без переходов / `animation: none` на поддерево) — §4.8.3.

## K17 · Знак бренда: правило переключения отрисовки есть, на экране загрузки не применяется

`hexlashMark.js` определяет `markVariantFor(size)`: `≥64 → full`, `24–48 → compact`, `<24 → micro`. Комментарий в `home.css` предупреждает, что коробка не должна пересекать 24 и 48 без смены отрисовки.

На экране загрузки (`index.html`) коробка задана как `calc(var(--word) * 2.29)` при `--word: 6vmin` (портрет — `8vmin`), то есть **`13.74vmin` / `18.32vmin`** — величина, зависящая от экрана. Внутри жёстко встроен литеральный SVG **full**-варианта. Причина указана честно (*«inline because this screen paints before the bundle and the stylesheet exist»*), но следствие: на очень маленьком окне коробка может уйти ниже 64px, а отрисовка останется полной.

## K18 · Три разных «самый верхний слой»

`2147483000` (экран загрузки, 404, `SceneLoadingOverlay`) · `2147482000` (`RotateHint`) · `10000 !important` (плашка почты, `verify.css`) · `9000` (одиночный случай).

Плашка почты с `!important` окажется **под** экраном загрузки, но её `!important` делает её неперекрываемой обычными правилами — смешаны две разные стратегии.

## K19 · Кадрирование FORGE и полоса CSS расходятся на узком экране

`PveScene.CAM.rect.workPortrait.y1 = 0.56`; `forge.css: --fg-band: 40vh`. Комментарии в обоих файлах фиксируют, что числа обязаны совпадать.

Но `forge.css:34` содержит: `@media (orientation: portrait) and (max-height: 700px) { :root { --fg-band: 42vh } }` — на невысоком портретном экране полоса растёт до `42vh`, а число в камере остаётся `0.56`. Договор между 2D и 3D нарушается ровно там, где он важнее всего.

## K20 · `backdrop-filter` без `-webkit-` в четырёх местах

Основное свойство — 10 объявлений, `-webkit-` дубль — 6. Без префикса остались:

| Место | Значение |
|---|---|
| `cabinet.css:39` `.cab-scrim` | `blur(2px)` — затемнение под панелью игрока |
| `shop.css:318` `.sb-scrim` | `blur(3px)` — затемнение под листом покупки |
| `HomeView.vue:394` | `blur(7px)` |
| `SpaceView.vue:122` | `blur(8px)` |

Ровно те же эффекты в `ReferralOverlay`, `AuthSelectorView`, `ResetPasswordView`, `RotateHint` и `home.css` префикс имеют. То есть правило известно и применяется — но не везде.

## K21 · Шесть коэффициентов яркости для одного жеста

`brightness(0.97)` · `brightness(1.04)` · `brightness(1.06)` · `brightness(1.08)` (10 раз) · `brightness(1.12)` · `brightness(1.15)` (2 раза) — все означают «стало ярче на наведении/нажатии».

## K22 · Десять стилей контура фокуса

См. §4.5.3. Из них три отступа (`2px`, `3px`, `4px`) и один **отрицательный** (`-4px`, внутрь элемента) в одном и том же файле `forge.css`. Толщина — `1px` или `2px` без правила. У кнопки FIGHT — главной кнопки игры — фокуса нет вовсе.

## K23 · Удаление экрана загрузки на 40 мс позже, чем заявлено

`sceneLoading.js`: `FADE_OUT_MS: 200`. `index.html`: `transition: opacity .2s ease` — совпадает. Но `setTimeout(remove, 240)`.

40 мс — не проблема, но комментарий в `index.html` утверждает: *«Leave — must match LOADING.FADE_OUT_MS in src/services/sceneLoading.js, so the first-load surface and the in-app one lift identically»*. Одна из двух связанных величин синхронизирована, вторая — нет.

## K24 · Единственный не круглый порог раскладки

Все пороги — `430 / 480 / 520 / 560 / 640 / 680 / 820 / 860 / 880 / 900 / 1024 / 1200`. Один выбивается: **`min-width: 641px`** (`CoreSelectView.vue:270`). Это `max-width: 640px` + 1, то есть парная граница, записанная в другой манере — в том же файле выше есть `max-width: 640px`.

## K25 · Шкал нет: белая лестница, межбуквенное, длительности, кегль

- прозрачность белого — **43** значения, ступеней нет;
- межбуквенное — **30** значений, ступеней нет;
- длительности — **58** значений, из них именованы **3**;
- кегль — **79** записей в **5** единицах измерения;
- `gap` — **20** значений в px, нечётные наравне с чётными;
- скругление — **17** значений при том, что норма проекта — острый угол.

Это не отдельный конфликт, а фон, на котором живут все остальные.

---
# ЧАСТЬ V · Наблюдения исполнителя

Свободным текстом, честно.

### Дисциплина держится там, где под ней есть механизм — и только там

Правило «одно свечение» соблюдено ровно в трёх местах, и во всех трёх оно **написано кодом**, а не соблюдено вручную:
- `modePlates.setHover` физически не может зажечь две двери;
- `CORE_LIGHT.rest = 0.14` гасит все ядра в FORGE централизованно;
- дом гасит разлом снаружи (`riftGlow.forEach(... opacity = 0)`).

Там, где механизма нет, правило не работает — не из-за небрежности, а потому что светимость ядра зашита внутрь `buildFighter` и снаружи не регулируется. Поэтому 14 ядер в пространстве и 8 цветных луж в FORGE горят штатно. Это не «нарушение», это отсутствие ручки. Когда будете писать токены — это первое место, где нужна ручка.

### Половина настроечных блоков — копии

`LAMPS`, `BACKDROP`, `buildLamps`, `strokeHex`, `drawHexWeave`, `GLOW` существуют дважды: в `HomeScene.vue` и в `PveScene.vue`. В комментариях это признано честно («home recipe, own copy»), но значения при этом уже разошлись: `radius 58` против `45`, `GLOW.opacity 0.3` против `0.16`, добавилось `hangLift`. Расхождение накапливается молча, потому что связи между копиями нет.

### Забытые эксперименты, которые дошли до `main`

Три находки выглядят именно так:
1. **`opacity: 1.35`** — кто-то хотел «умножить свечение», CSS так не умеет, эффекта нет, никто не заметил, потому что визуально разница между `1` и «попыткой 1.35» отсутствует.
2. **`hexMaxAlpha: 0` + `dither: 0`** — гекс-плетение на куполе фона выключили нулём вместо удаления. Функция осталась и обходит 60 колонок гексов на каждой сборке купола, не рисуя ничего. То же в двух файлах.
3. **`rgba(255, 6, 105, …)`** в `FighterLabScene` — переставленные цифры в розовом. Файл dev-only, поэтому и жив.

Плюс `v24/effects.css` — 37 строк стилей, чья разметка удалена вместе с игрой, а сами стили остались и продолжают занимать три уровня в шкале `z-index`.

### `.app-v2` — самая дорогая мёртвая ветка

`AppV2.vue` оставлен ради переменных `--text-*` / `--font-*`. Из шести перечисленных живы две. Плата — блокирующий `@import` двух шрифтовых семейств (`Archivo Black`, `Space Grotesk`) на **каждом** входе в игру, при том что `Archivo Black` не использует никто. Это самое заметное расхождение между обоснованием в комментарии и фактическим состоянием.

### Два магазина

`home.css` содержит полный, аккуратно матовый блок магазина (`.sp-*`) с явной пометкой «zero glow», а живёт совсем другой магазин — яркий порт с двенадцатью свечениями. Мёртвый блок никого не ломает, но шапка `home.css` до сих пор обещает читателю правило, которое в живом магазине сознательно отменено. Это тот случай, когда документация в коде расходится с кодом в соседнем файле.

### Токены назывались токенами, но ими не стали

Это самая важная находка отчёта, и она проверялась дважды.

`src/styles/hexlash-ui.css` подписан «HEXLASH UI SYSTEM · Unified style file for the entire game». В нём 255 строк. **Живут 42 из них** — блок `:root` с переменными. Остальные 204 строки (40 классов, 6 наборов `@keyframes`, свой собственный `@media (min-width: 1024px)`) не использует **ни один** файл проекта. Проверено сплошным поиском по каждому классу.

Следом мертвы три переменные (`--hex-dice-*`) — они упомянуты только внутри мёртвых классов. Ещё четыре (`--hex-radius-md`, `--hex-bg-medium`, `--hex-spacing-sm/md/lg`) формально имеют по одному употреблению — и это употребление тоже внутри мёртвого класса.

При этом в проекте живут 20 значений `gap`, ~90 записей `padding` и 17 радиусов — вписанных руками.

Вывод для следующего шага: **брать значения из `hexlash-ui.css` нельзя.** То, что в нём написано, никто никогда не видел на экране. Настоящий облик проекта задают локальные наборы — `home.css` (матовый хром, кнопка FIGHT), `cabinet.css`, `forge.css`, `shop.css`, `landing.css`. Они разрознены и расходятся между собой, но они хотя бы отрисовываются.

### Что выглядит нестабильным

- **`--white`.** Одно имя, два значения (`#FFFFFF` глобально, `#f6f4f6` внутри `.lp` и `.hx-auth`). Любая правка глобального файла даст разный результат на разных экранах. Это единственное найденное место, где переменная **означает разное** в зависимости от того, где её прочитали.
- **Договор `--fg-band` ↔ `CAM.rect.workPortrait`.** Два числа в двух разных языках (CSS и JS) обязаны совпадать, комментарии это фиксируют, и на невысоком портретном экране они уже не совпадают. Такие связки ломаются тихо.
- **Кнопка FIGHT без состояний фокуса и «выключено».** Главная кнопка игры не имеет клавиатурного фокуса и не умеет выглядеть недоступной. Пока это не мешает — но любая механика вроде «нет бойца → нельзя драться» упрётся в это.
- **Шрифт грузится тремя запросами.** Если один из них когда-нибудь отвалится, `Saira Condensed` пропадёт на части экранов и не пропадёт на других — диагностировать это будет неприятно.

### Что удивило в хорошую сторону

- Матовый хром (`.hs-chrome`) — единственное место в проекте, где материал собран целиком: шесть состояний, один блок, честное поведение при уменьшенном движении. Это готовый образец для остальных.
- «Весомое движение» разложено на три независимых числовых слоя с явными диапазонами и внятными комментариями. Это самая проработанная часть проекта — заметно проработаннее, чем интерфейс.
- Разлом пульсирует **одним множителем на все пять частей**. Дисциплина «пульсирует как одно» реализована буквально, а не пятью отдельными анимациями.
- Комментарии в коде почти нигде не врут о намерении. Они расходятся с фактом там, где факт изменился в соседнем файле (магазин, `.app-v2`), но самих себя описывают точно. Для проекта, у которого документация разъехалась, это редкость.

### Чего в отчёте нет — и это стоит проверить отдельно

- **Значения, собранные в JS-строку.** Например, `` `rgba(${o.hexRGB},${a})` `` в куполе или градиенты, склеенные в текстурах Canvas. Такие я ловил чтением, а не поиском, — что-то могло остаться.
- **Vuetify.** Проект переопределяет её стили в `main.css` (тултипы, модалки, слайдеры, списки), но собственные значения библиотеки в отчёт не входят. При сборке токенов их придётся либо перекрыть, либо от Vuetify отказаться.
- **`PrivacyView.vue`** — 2654 строки чужой генерации, тянущие `var(--primary-color)` 38 раз. Формально это часть системы, фактически — отдельный мир.

---

## Итог в цифрах

| Что | Сколько |
|---|---|
| независимых наборов CSS-переменных | 12 |
| различных hex-литералов цвета | 106 |
| различных `0x`-литералов цвета (3D) | 44 |
| различных записей `rgba()/rgb()` | 165 |
| значений прозрачности белого | 43 |
| записей кегля | 79 (в 5 единицах) |
| значений межбуквенного | 30 |
| значений `gap` в px | 20 |
| значений скругления | 17 |
| различных `box-shadow` | 57 |
| длительностей движения | 58 (именованы 3) |
| кривых ускорения | 8 + 4 ключевых слова |
| стилей контура фокуса | 10 |
| порогов раскладки по ширине | 12 |
| различных высот элементов | 68 |
| запросов к Google Fonts | 3 |
| конфликтов, найденных в §7 | 25 |

**Изменений в коде не вносилось.**
