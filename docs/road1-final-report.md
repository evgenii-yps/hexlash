# Дорога 1 — Финальный отчёт

## Итог

Визуальная миграция Hexlash к дизайн-системе Neon Discipline завершена.
Все экраны, компоненты и навигация переведены на `--hex-*` CSS переменные.
Legacy переменные (`--pink`, `--dark`, `--gray*`) сохранены только в PrivacyView
(авто-генерированный legal HTML с inline styles — документированное исключение).

## Что сделано

### Фаза 1: Фундамент (Phases 1.1–1.2a)
- `hexlash-ui.css` — единая дизайн-система с 118 CSS переменными (`--hex-*`)
- 45 pixel-иконок в `pixelIcons.js` (16x16, 9 категорий)
- `PixelIcon.vue` — canvas-based рендерер (preserved, unused — см. rationale ниже)
- `HexButton.vue` — 5 вариантов, 3 размера
- `HexCard.vue` — 5 вариантов (default/elevated/archetype/active/result)
- `HexProgress.vue` — HP/branch/generic варианты
- `HexBadge.vue` — archetype/branch/status/counter/custom варианты

### Фаза 2: Навигация
- `BottomMenu.vue` — SVG-иконки с filter-based active state, backdrop-blur
- `Logo.vue` + `App.vue` header — `--hex-*` переменные, AnonymousBalance font

### Фаза 3: Core экраны (260+ замен)
- Phase 3.1a: Arena (PreparationView, ModeSelector)
- Phase 3.2a: CardFightView (fight, dice, coach, victory/defeat/overdrive)
- Phase 3.3: Training + MoveTree (72 замены)
- Phase 3.4: Profile + DeckBuilder (71 замена)

### Фаза 4: Вторичные экраны (280 замен, 11 файлов)
- ClubView, RatingsView, FriendsView, MatchmakingView, SpectateView,
  RainView, PageView, NotFoundView, VerifyEmailView + auth формы

### Фаза P0: PixelIcon revert
- Откат использования PixelIcon в app-файлах, возврат к оригинальным SVG/img
- Компонент и данные сохранены для возможного будущего использования

### Фаза 5: Финализация
- Phase 5.1: Final sweep — 330 legacy var замен в 53 файлах, 0 legacy vars remain
- Phase 5.2: Animation utilities (10 классов: transitions, hover, press, pulse, glow, float-up, Vue fade/slide-up)
- Phase 5.3: Responsive fixes — 320px min-width, @media 360px breakpoints

### Visual System v1.0 Alignment (ТЗ #0–17 эквивалент)
- Переписан `hexlash-design/SKILL.md` как оперативный гайд Neon Discipline v1.0
- Добавлены `--hex-bg-deep`, `--hex-border-hi` CSS переменные
- 16 "Align" коммитов: каждый экран проверен и выверен по Visual System PDF v1.0

### ТЗ #18a: Документационная сверка
- CLAUDE.md синхронизирован с реальным кодом
- Удалены 11 phantom-компонентов из документации
- Visual System PDF v1.1 выверен

### ТЗ #18b: Код-чистка
- Orphaned файлы подчищены
- Legacy grep верифицирован
- ChallengeNotification pattern fix

### ТЗ #18c: Финальный отчёт (этот документ)

## Статистика

| Метрика | Значение |
|---------|----------|
| Коммитов (контент) | 42 |
| Коммитов (CLAUDE.md) | 11 |
| Коммитов всего | 53 |
| Строк добавлено | +5,905 |
| Строк удалено | -2,594 |
| Файлов изменено | 99 |
| Vue компонентов затронуто | 89 |
| CSS файлов затронуто | 3 |
| `--hex-*` переменных в системе | 118 |
| Legacy `--pink`/`--dark` нарушений | 0 (PrivacyView — исключение) |
| Период | 2026-03-15 — 2026-04-08 |

## Верификации

- **Legacy CSS vars:** 0 нарушений глобально. Единственное использование legacy vars — PrivacyView.vue (авто-генерированный legal HTML с inline `var(--primary-color)` — документированное исключение, не мигрируем).
- **i18n:** 0 изменений в locale файлах от Road 1 коммитов. Road 1 — чисто визуальная миграция, новых i18n ключей не добавлялось.
- **Backend invariant:** 0 изменений в `/backend/` от Road 1 коммитов. Backend не затронут.
- **Visual System PDF v1.1:** синхронизирован с кодом (ТЗ #18a).
- **CLAUDE.md:** синхронизирован с реальностью (ТЗ #18a).

## Что НЕ сделано в Road 1 (передано в Road 2)

См. `/docs/road2-parking-list.md`

## Найденные функциональные баги (не фиксились в Road 1)

- **MAX_DECK_SIZE расхождение:** CLAUDE.md и `constants.js` = 8, `DeckBuilderView` валидирует по 5. Требует определения источника правды и синхронизации. Не визуальный баг — отдельный трек.

## PixelIcon rationale

45 pixel-иконок в `/src/data/pixelIcons.js` и компонент `/src/components/ui/PixelIcon.vue` сохранены как preserved dead code.

Причина: pixel-стиль иконок конкурирует с pixel-font Anonymous в заголовках и ударных моментах. Решение Neon Discipline — один pixel-блок на экран (font), иконки остаются line-стилем (Lucide/SVG). PixelIcon может вернуться в будущем в decorative-контексте (фон карточек, achievement badges, loading screens) — удалять без обсуждения нельзя.

Связанные файлы:
- `src/components/ui/PixelIcon.vue` — canvas-based рендерер (props: name, size, color, glow)
- `src/data/pixelIcons.js` — 45 иконок, 9 категорий, 16x16 grid
- `src/test-icons.html` — standalone demo page
- `HexButton.vue` / `HexBadge.vue` — имеют icon prop для PixelIcon, но ни один app-файл его не использует
