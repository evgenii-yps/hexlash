---
name: hexlash-design
description: Дизайн-система "Neon Discipline" проекта Hexlash. Триггерится на UI, CSS, цвет, color, шрифт, font, кнопка, button, карточка, card, иконка, icon, анимация, animation, экран, screen, верстка, layout, padding, margin, glow, неон, neon, дизайн, design, hex-, --hex. Грузить ВСЕГДА перед UI-задачами вместе с hexlash-dev и hexlash-vue. Для сложных задач — см. секцию антипаттернов в этом SKILL.md.
---

# hexlash-design — Neon Discipline

> **Status (Apr 2026):** Neon Discipline v1.0 — SUPERSEDED. Editorial Refresh v24 is the new foundation (Phase 7+). См. секцию §Editorial Refresh v24 внизу. `--hex-*` и Neon-components остаются функциональными в legacy-коде до Phase 7.6 cleanup.

## Главное правило

- **Источник правды — `/src/styles/hexlash-ui.css`.** При расхождениях с PDF и SKILL.md прав код.
- **Только `--hex-*` переменные.** Никаких `--pink, --dark, --gray*`. Исключение — PrivacyView.
- **Один розовый акцент на экран.** Одна точка фокуса.
- **Pixel-font (`Anonymous`) — один ударный блок на экран.**
- **Архетипные цвета — только в иконках или активном контексте бойца.**
- **Перед добавлением нового цвета/токена — стоп.** Обновить CSS + скилл + PDF.

---

## Видение

> «Минималистичный underground, поверх которого AI рисует точную и сдержанную неоновую разметку. Voice — тихий, уверенный, без улыбок».

Два слоя: реальный мир (бетон, лампы, силуэты) = **фон, атмосфера**. Цифровой мир (розовый неон, числа, pixel-font) = **UI, функция**. Они не смешиваются.

---

## Палитра — CSS переменные

**Все значения — в `/src/styles/hexlash-ui.css`.** Здесь только токены и правила.

### Фоны
`--hex-bg-deep` (оверлеи) → `--hex-bg-dark` (страница) → `--hex-bg-medium` (панели) → `--hex-bg-light` (инпуты) → `--hex-bg-card` (полупрозрачный, ~85% opacity)

Темнее = дальше назад.

### Бордеры
`--hex-border-default` (покой) → `--hex-border-active` (hover/focus) → `--hex-border-strong` (выбранный) → `--hex-border-hi` (акцентный нейтральный)

### Текст (3 уровня — не больше)
- `--hex-text-primary` (#FFF) — заголовки, body, ключевые значения
- `--hex-text-secondary` (60% white) — описания
- `--hex-text-muted` (35% white) — метки, подсказки

### Главный акцент — розовый
- `--hex-primary` (#FF066F) — **одна точка фокуса на экран**
- `--hex-primary-light` — hover
- `--hex-primary-dark` — pressed
- `--hex-primary-glow` — box-shadow

### Статусные
`--hex-success` (#00FF88), `--hex-warning` (#FFB800), `--hex-danger` (#FF3333), `--hex-info` (#4DA6FF)

### Game status
`--hex-victory` / `--hex-victory-bg`, `--hex-defeat` / `--hex-defeat-bg`, `--hex-draw` / `--hex-draw-bg`, `--hex-info` / `--hex-info-bg`

### Ветки
`--hex-branch-speed` (cyan), `--hex-branch-power` (pink = brand), `--hex-branch-technique` (purple). Каждая с `-dark`, `-light`, `-glow`.

### Combat actions
`--hex-action-attack` (red), `--hex-action-defense` (blue), `--hex-action-position` (purple)

### Dice эффекты
`--hex-dice-heal` (green), `--hex-dice-adrenaline` (orange), `--hex-dice-shield` (blue), `--hex-dice-blind` (purple), `--hex-dice-rage` (red), `--hex-dice-crit` (yellow)

### Mode colors
`--hex-mode-pve` (cyan), `--hex-mode-pvp` (pink), `--hex-mode-club` (green)

### Belt system
`--hex-belt-white` ... `--hex-belt-black`, `--hex-belt-hexmaster`, `--hex-belt-stripe`, `--hex-belt-outline`

### Утилиты
- Тени: `--hex-shadow-card`, `--hex-shadow-elevated`, `--hex-shadow-modal`
- Glow: `--hex-glow-sm`, `--hex-glow-md`, `--hex-glow-lg`
- Blur: `--hex-blur-sm/md/lg`
- Border: `--hex-border-width` (2px), `--hex-line-height` (1.5)
- Spacing: `--hex-spacing-xs(4)/sm(8)/md(16)/lg(24)/xl(32)/xxl(48)`
- Radius: `--hex-radius-sm(4)/md(8)/lg(12)/xl(16)/round(50%)`
- Transitions: `--hex-transition-fast` (0.15s), `--hex-transition-normal` (0.25s), `--hex-transition-slow` (0.4s)

### Типографика — три голоса

| Голос | Шрифт | Где |
|-------|-------|-----|
| Бренд/удар | Archivo Black (`--hex-font-display`) | HEXLASH, START FIGHT, VICTORY/DEFEAT/DRAW, OVERDRIVE. Один блок на экран. |
| Числа | JetBrains Mono (`--hex-font-mono`) | HP, taps, XP, timers, stats. |
| Body | Space Grotesk (`--hex-font-body`) | Everything else. |
| Legacy compact | System sans | ModeSelector, Friends (preserved pattern). |

---

## Архетипы — отдельный язык

| Архетип | Токен | Идея |
|---------|-------|------|
| Predator | `--hex-arch-predator` (#FF066F) | Агрессия (= primary pink) |
| Sentinel | `--hex-arch-sentinel` (#2ee07f) | Защита (emerald) |
| Ghost | `--hex-arch-ghost` (#A855F7) | Уклонение (violet) |
| Analyst | `--hex-arch-analyst` (#4dd9ff) | Анализ (cyan) |
| Maverick | `--hex-arch-maverick` (#FFA133) | Хаос (amber) |
| Juggernaut | `--hex-arch-juggernaut` (#D4A843) | Давление (gold) |
| Warden | `--hex-arch-warden` (= juggernaut) | Лор-алиас |

Каждый с `-dark`, `-light`, `-bg`, `-glow`.

**Где используется:** иконки архетипов (всегда в своём цвете), контекст активного бойца (тонкий бордер/свечение).

**Где НЕ используется:** глобальный UI, кнопки, текст, фоны. Два архетипных цвета на одном элементе — никогда.

Динамическая передача: `archetype-color="var(--hex-arch-ghost)"` → `--_arch-color` внутри.

---

## Типографика — три голоса (v23)

| Голос | Шрифт | Где |
|-------|-------|-----|
| Бренд/удар | Archivo Black (`--hex-font-display`) | HEXLASH, START FIGHT, VICTORY/DEFEAT/DRAW, OVERDRIVE. Один блок на экран. |
| Числа | JetBrains Mono (`--hex-font-mono`) | HP, taps, XP, timers, stats. |
| Body | Space Grotesk (`--hex-font-body`) | Everything else. |
| Legacy compact | System sans | ModeSelector, Friends (preserved pattern). |

**Размеры (mobile 360-414px):** Display 32, H1 24, H2 18, H3 14, Body 14, Caption 11, Micro 9.

Правила: max 3 размера на экран, body = `--hex-text-primary`, серый для второстепенного, line-height 1.4-1.5, ALL CAPS только лейблы и удары (≤3 слов).

---

## UI компоненты

Готовые в `/src/components/ui/`. **Перед написанием нового — проверить.**

| Компонент | Варианты |
|-----------|----------|
| `HexButton` | primary, secondary, ghost, danger, archetype × sm/md/lg |
| `HexCard` | default, elevated, archetype, active, result × padding |
| `HexProgress` | hp, branch, generic × 3 size |
| `HexBadge` | archetype, branch, status, counter, custom |
| `BeltBadge` | grade 0-32, isHexmaster, sm/md/lg |
| `PixelIcon` | **Не используется**, preserved |

---

## Кнопки — 4 типа

- **primary** — розовый. **Одна на экран.** START FIGHT, SAVE.
- **secondary** — тёмная + бордер. CHANGE, EDIT, BACK.
- **ghost** — без заливки. Cancel, Skip.
- **danger** — бордер `--hex-danger`. Delete, Retire.

Размеры: sm 32px, md 40px, lg 48px. Состояния: default/hover/active/disabled/loading.

**Запрещено:** две primary рядом, цветные кнопки кроме pink/danger, градиенты, ALL CAPS на ghost.

---

## Карточки — 5 вариантов

- **default** — `--hex-bg-card`, бордер default
- **elevated** — с `--hex-shadow-elevated`
- **archetype** — левая полоска 2px в архетипном цвете
- **active** — бордер 1.5px архетипный
- **result** — верхняя полоска (victory/defeat/draw)

Max 2 уровня вложенности. Фон не светлее `--hex-bg-card`.

---

## Glow — правила

**Допустим:** primary кнопка (одна!), лого, VICTORY, Hexmaster belt, активный таб, карточка активного бойца.

**Запрещён:** текст, secondary/ghost/danger кнопки, карточки default, иконки нав, бейджи, фоны.

**Один светящийся объект на экран.**

---

## Анимации

| Длительность | Где |
|-------------|-----|
| 100ms | Press feedback |
| 150ms | Tooltip |
| 250ms | **Дефолт.** Карточки, табы |
| 400ms | Модалки |
| 600ms | VICTORY, ключевые |
| 1500ms | Glow pulse |

Запрещено: bounce, rotation (кроме спиннеров), parallax, >600ms для рутины.

---

## Сетка и отступы

Базовая единица: **4px**. Spacing: `--hex-spacing-xs(4)/sm(8)/md(16)/lg(24)/xl(32)/xxl(48)`.

- Container padding-x: 16px
- Min: 320px (iPhone SE). Target: 360-414px. Max content: 480px
- Touch-targets: ≥44×44px
- Max 5-7 элементов в первом экране
- Max 3 уровня иерархии

---

## Фоны

Фон = атмосфера, не функция. Underground, Sin City + Cyberpunk Edgerunners.
- Затемнение `::before` overlay #0A0A0A с opacity 0.75-0.85
- Тёмный центр, vignette по краям
- Лимит: ≤200KB

---

## Atmosphere Layers (Phase 2)

Global DOM overlays, always rendered by AppShell behind all content:

- `.grain` — SVG noise texture, opacity 0.035, mix-blend overlay (z-index 200)
- `.vignette` — radial gradient dimming edges (z-index 150)
- `.scanlines` — CRT horizontal lines (z-index 175) — opt-in per-view, not global

Files: `src/styles/atmosphere.css` (Phase 1), applied in `src/components/shell/AppShell.vue` (Phase 2).

Scanlines can be added per-view via `<div class="scanlines">` inside the view template. Currently recommended only for Fighter Detail per v23.

---

## Состояния

- **Loading:** skeleton (pulse opacity). Нет "Loading..." текста.
- **Empty:** иконка xl + заголовок + описание + primary кнопка
- **Error:** `--hex-danger` иконка + заголовок + RETRY. Inline.
- **Disabled:** **не opacity** — disabled вариант компонента. `--hex-text-muted`, `--hex-bg-card`.

---

## 10 антипаттернов

1. Множественные розовые акценты
2. Pixel-font везде
3. Конкурирующие фоны
4. Полупрозрачные карточки с просвечиванием
5. Серые dashed плейсхолдеры
6. Inconsistent terminology
7. Mix outlined/filled иконок
8. Вторая палитра "случайно"
9. Яркий фон-фото
10. `--pink/--dark` вместо `--hex-*`

---

## Чеклист готовности экрана

**Цвета:** одна розовая точка, архетипы в иконках, нет легаси, нет цветов вне палитры.

**Типографика:** pixel-font max 1, AnonymousBalance для чисел, max 3 размера.

**Сетка:** кратно 4px, min 16px padding, touch ≥44px, 320px min.

**Компоненты:** существующие из ui/, max 1 primary, все состояния.

**Glow:** max 1 объект, только разрешённые.

**Состояния:** loading/empty/error/disabled.

**i18n:** 11 локалей, ширина +30%.

**Финал:** узнаётся как Hexlash, главное действие за 1с, нет антипаттернов.

---

## Расширенный контекст

`Hexlash_Visual_System.pdf` — **не в репо**. Этот SKILL.md является полным операционным источником правды по визуалу. Если PDF появится — обновить ссылки.

---

## Editorial Refresh v24 — Foundation (Phase 7.1)

**Status:** Neon Discipline v1.0 — SUPERSEDED. Editorial Refresh v24 — новая основа.

**Эстетика:** brutal editorial, тёмный спортивный журнал. Paper-fill карточки на тёмной 3D-сцене, hard-offset shadows, крупные display-заголовки на Archivo Black, italic accents на Instrument Serif.

**Anti-patterns:** no glow, no blur, no gradient (кроме vignette), no radius > 2px, no neon-pink accents, no emoji, no scanlines.

### Параллельное существование

В Phase 7.1 обе палитры живут рядом в `src/styles/hexlash-ui.css`:

- `--hex-*` — **легаси**, используется всем существующим кодом (Pit 6.2b shell, HexButton/HexCard и т.д.). Не трогаем.
- `--ed-*` — **новое**, для Ed-компонентов (Phase 7.2+) и новых view-rewrites (Phase 7.5+).

**Не смешивать `--hex-*` и `--ed-*` в одном элементе.** В новом Ed-коде — только `--ed-*`. В существующем Neon-коде — только `--hex-*`.

### Палитра `--ed-*`

- **Ink** (surfaces): `--ed-ink` (#0A0907), `--ed-ink-2`, `--ed-ink-3`
- **Paper** (cards over dark): `--ed-paper` (#F1E9D6), `--ed-paper-2`, `--ed-paper-dim`
- **Rules** (separators): `--ed-rule` (14% paper), `--ed-rule-2` (28% paper), `--ed-rule-ink` (18% ink)
- **Accents:** `--ed-press` (#D93A2F) единственный акцент на экран, `--ed-gold` (#C9A14C), `--ed-sage` (#6A7A5A), `--ed-slate` (#3A3A36)

### Типографика — четыре голоса

| Голос | Токен | Где |
|-------|-------|-----|
| Display | `--ed-font-display` (Archivo Black) | HEXLASH, VICTORY, section mastheads |
| Serif | `--ed-font-serif` (Instrument Serif italic) | Editorial accents, pull quotes, coach text |
| Body | `--ed-font-body` (Work Sans) | Всё остальное (заменил Space Grotesk в v24) |
| Mono | `--ed-font-mono` (JetBrains Mono) | Числа, kicker, meta |

### Правила

1. **Один `--ed-press` акцент на экран** (как одна розовая точка в Neon — но красная).
2. **Hard-offset shadows:** `box-shadow: 3px 3px 0 var(--ed-ink);` — не размытые, смещённые.
3. **Paper cards:** `background: var(--ed-paper); color: var(--ed-ink);` — инверсия фон/текст на тёмной сцене.
4. **Border-radius ≤ 2px** (в Neon было до 16px).
5. **Никаких градиентов**, кроме vignette.
6. **:lang(ru) letter-spacing:** кириллица на Archivo Black нуждается в уменьшенном letter-spacing — правила добавятся в Phase 7.3.

### Из чего собрано

- Мокап `hexlash_standalone.html` (v24 bundler, ~1.1 MB, 495K chars template)
- State-machine через body class (`is-pit`, `is-profile`, `is-training`, `is-ratings`, `is-clan`, `is-detail`, `is-fight`, `is-mm`, `is-shop`) — совпадает с VALID_SCENES в sceneState
- 9 scenes идентичны Phase 6.2b PitView shell

### Phase 7 roadmap

| Sub-phase | Scope |
|-----------|-------|
| 7.1 ← **СЕЙЧАС** | Foundation: токены + шрифты + atmosphere + декларация |
| 7.2 | Ed-components (EdButton, EdCard, EdKicker, EdHeadline) |
| 7.3 | i18n wordlist + `:lang(ru)` letter-spacing |
| 7.4 | Pit HUD в Editorial |
| 7.5 | 9 v2 views rewrite |
| 7.6 | Cleanup `--hex-*` и Hex* legacy |
| 7.7 | Docs rewrite (SKILL + PDF + CLAUDE.md) |

---

## Связь с кодом

| Где | Что |
|-----|-----|
| `/src/styles/hexlash-ui.css` | **ИСТОЧНИК ПРАВДЫ.** |
| `/src/components/ui/` | Компоненты дизайн-системы |
| Этот SKILL.md | Операционная выжимка |
| `Hexlash_Visual_System.pdf` | **Не в репо.** Этот SKILL.md = источник правды |

Цикл: решение → CSS (код первым!) → SKILL → PDF → CLAUDE.md → компоненты.

---

## Запрещено

- Новый цвет без обновления CSS + скилл + PDF
- Легаси `--pink/--dark/--gray*`
- Дублировать компонент из ui/
- Хардкодить hex-цвета
- Opacity для disabled
- Архетипный цвет вне иконок/активного контекста
- Два розовых акцента
- Pixel-font в нескольких местах
- Использовать `--hex-font-*` алиасы вместо реальных Anonymous/system-sans
- Игнорировать чеклист

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-vue` — конвенции компонентов
- `hexlash-i18n` — тексты на 11 языках
- `hexlash-combat` — если UI боя
- `hexlash-gamedesign` — если UI отображает баланс
