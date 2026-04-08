# Парковочный список после Дороги 1

## Категория A: Observations (не баги, не фиксим, зафиксировано)

**A1.** Fighter.vue как переиспользуемый компонент не существовал.
CardFightView и SpectateView содержат независимые inline-версии
отображения бойца (аватар, HP, имя, статус). Кандидат на рефакторинг
в Phase 1 (Club Mode) когда Fighter станет центральной сущностью.

**A2.** SpectateView дублирует HP-бары, Fighter карточки, round log
из CardFightView. Техдолг с момента создания SpectateView.
Рассмотреть извлечение общих компонентов при работе над PvP/Club Mode.

**A3.** Top-3 highlighting и "это ты" отсутствуют в RatingsView. UX gap.
Рассмотреть в Phase 1 вместе с Agent Rankings.

**A4.** background_club.webp конфликтует с underground эстетикой Neon Discipline.
TODO на замену арта. Низкий приоритет — фон виден только на ClubView.

**A5.** `--hex-border-color` дубликат `--hex-border-default` в hexlash-ui.css.
Не блокер, обе переменные имеют одинаковое значение. Консолидировать
в будущем при рефакторинге CSS.

**A6.** Font aliases параллельная система:
`--hex-font-display`/`body`/`mono` в hexlash-ui.css указывают на
Impact/Inter/JetBrains Mono, но 0 Vue компонентов их используют.
Реальные шрифты: Anonymous (titles/impact), AnonymousBalance (numbers),
system sans-serif (body). Решение: удалить мёртвые font-переменные
или переназначить под реальные шрифты проекта.

## Категория B: TODO для ТЗ #18.5 (аудит библиотеки HexButton/HexCard)

**B1.** HexButton `secondary` variant рендерит розовый outline вместо нейтрального.
Найдено при работе над ТЗ #3 (Arena Friends), ТЗ #5 (ProfileWallet Connect).
Нарушает правило "один розовый акцент на экран" когда secondary кнопка
соседствует с primary.

**B2.** HexButton содержит 2x hardcoded `#FFFFFF` — нарушение правила
"все цвета через CSS переменные". Нужна замена на `--hex-text-primary`
или `--hex-text-on-primary`.

**B3.** Возможные другие баги библиотеки — выяснить systematic чтением
всех 4 Hex-компонентов (Button, Card, Progress, Badge) + сверкой
с Visual System v1.0 спецификацией.

## Категория C: TODO для Phase 1 (Club Mode концепт)

**C1.** Club Mode prototype exists — `FightClubView.vue`, `AgentRoster.vue`,
`AgentCard.vue`, `AgentLeaderboard.vue`, `ArchetypeSelector.vue`,
`MorningReport.vue`, `RetirementPanel.vue`, `SkinPicker.vue`,
`ClubLevelBar.vue`. Недокументированный прототип — разобраться что работает,
что требует переделки, использовать как базу или переписать.

**C2.** Fighter archetype glow в CardFightView: архетип соперника не
пробрасывается в шаблон. Archetype-specific colors (var(--hex-arch-*))
не применяются к Fighter карточке оппонента. Подключить когда Fighter
станет самостоятельной сущностью.

**C3.** ModuleBuilder архетипные цвета через `<img>`: текущая реализация
использует `<img>` для архетипных иконок, что не позволяет применять
CSS-переменные для цветов. Требует перехода на inline SVG для поддержки
`var(--hex-arch-*)` динамической окраски.

## Категория D: Верификационные TODO (проверить в ходе Phase 1)

**D1.** AiTrainerAnalysis.vue states на 320px / error / loading —
проверить вживую что layout не ломается на минимальной ширине
и что loading/error стейты визуально корректны.

**D2.** Overdrive pulse-glow соответствие Visual System секция 10 —
верифицировать что анимация overdrive (`event-overdrive` CSS class)
соответствует спецификации glow-эффекта.

**D3.** Dice button vs Coach button — правило "один светящийся объект" —
проверить что таймингами разведены (dice доступен после кулдауна,
coach после раунда 6, не одновременно).

**D4.** Coach UI в PvP — проверить что визуально идентичен PvE после
Visual System alignment. Оба используют одинаковые стили в CardFightView.

**D5.** "Waiting for opponent..." loading state в PvP coach — проверить
соответствие Visual System секция 12 (loading patterns).

**D6.** SoundToggle off state в Profile > Account — верифицировать
визуальное соответствие (success green on-state, neutral off-state).

**D7.** Punch3D фон vs underground фон TrainingView — проверить что
3D-сцена и background не конкурируют визуально. 3D untouched в Road 1.

## Категория E: Функциональные баги (не визуальные — отдельный трек)

**E1.** MAX_DECK_SIZE: `constants.js` = 8, `DeckBuilderView` валидирует по 5.
CLAUDE.md документирует MAX_DECK_SIZE = 8. Определить источник правды,
синхронизировать. Требует решения до любой работы с DeckBuilder.
Возможные варианты: 8 (constants.js) или 5 (текущий UI лимит) —
нужно решение геймдизайнера.
