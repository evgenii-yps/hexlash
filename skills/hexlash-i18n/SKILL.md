---
name: hexlash-i18n
description: Локализация Hexlash — 11 языков, кастомный реактивный i18n. Триггерится на i18n, локализация, перевод, translation, locale, language, язык, t.value, interpolate, en/ru/de/es/fr/pt/ar/hi/ja/ko/zh, текст в UI, label, lbl. Грузить вместе с hexlash-dev. Для компонентов — hexlash-vue. Для UI текстов — hexlash-design.
---

# hexlash-i18n — Localization

## Главное правило

**Кастомный i18n, НЕ vue-i18n.** Любой новый текст → **все 11 локалей одновременно**. EN — fallback. Хардкод текстов запрещён.

---

## Локали

| Код | Язык | RTL | Help | Rules |
|-----|------|-----|------|-------|
| en | English (fallback) | нет | да | да |
| ru | Русский | нет | да | да |
| de | Deutsch | нет | EN fallback | да |
| es | Español | нет | EN fallback | да |
| fr | Français | нет | EN fallback | да |
| pt | Português | нет | EN fallback | да |
| ar | العربية | **да** | EN fallback | да |
| hi | हिन्दी | нет | EN fallback | да |
| ja | 日本語 | нет | EN fallback | да |
| ko | 한국어 | нет | EN fallback | да |
| zh | 中文 | нет | EN fallback | да |

Help pages: только en + ru. Остальные 9 → EN fallback. Rules: все 11.

---

## Архитектура

- **Движок:** `/src/locales/index.js`
- **Экспорт:**
  - `t` — computed ref (реактивный)
  - `setLanguage(lang)` — смена + localStorage
  - `getLanguage()` — текущий язык
  - `interpolate(str, vars)` — подстановка `{varName}`
  - `availableLanguages` — массив `[{code, name}]`
  - `ruCountRule(choice, choicesLength)` — русские склонения
- **Storage key:** `hexlash-language` (localStorage)
- **Auto-detect:** browser language → fallback EN

---

## Использование

**В template:** `{{ t.section.key }}` (auto-unwrap, без `.value`)

**В script:** `t.value.section.key`

**С интерполяцией:**
```js
import { t, interpolate } from '@/locales'
interpolate(t.value.moves.lblUnlockFirst, { name: 'Hurricane' })
```

**Смена языка:** `setLanguage('ru')`

---

## Секции (из en.js — источник правды)

`menu`, `modal`, `auth`, `profile`, `arena`, `clan`, `club` (Fight Club UI), `fight`, `friends`, `pvp`, `spectate`, `xpAllocation`, `cards`, `training`, `rating`, `info`, `getStarted`, `deck`, `moves`, `referral`, `gameData`, `nav`, `verify`, `errors`, `belts`

**Game data:** `gameData.branches[id].{name,description}`, `gameData.moves[id].{name,description}`

---

## Конвенция ключей

- **Иерархия:** `section.key` или `section.subsection.key`
- **Префиксы:** `lbl*` (кнопки/поля), `txt*` (параграфы), `err*` (ошибки), `msg*` (инфо)
- **Интерполяция:** `{varName}` — одинаковые ключи переменных во всех локалях

---

## Добавление текста — flow

1. Определить секцию и ключ (по конвенции)
2. Добавить EN в `/src/locales/en.js` (обязательный fallback)
3. Добавить во все **10 остальных** локалей
4. Использовать: `{{ t.section.key }}` или `t.value.section.key`
5. Проверить: DE/RU (длинные слова), AR (RTL)

**Никогда не комитить текст без всех 11 локалей.**

---

## Страничный контент

- Help: `/src/locales/pages/help/{lang}.json` — только en + ru, остальные → EN fallback
- Rules: `/src/locales/pages/rules/{lang}.json` — все 11 языков

---

## RTL — арабский

- `ar` — единственный RTL
- При смене на ar — `dir="rtl"` на html (проверить реализацию)
- Direction-зависимая вёрстка: `margin-inline`, `padding-inline`, стрелки зеркалятся

---

## Проверка перед коммитом

- [ ] Нет хардкода текстов
- [ ] Все 11 локалей содержат новые ключи
- [ ] EN fallback корректен
- [ ] DE/RU не ломают вёрстку (+30% длины)
- [ ] AR (RTL) работает
- [ ] Интерполяция: все `{varName}` имеют значения
- [ ] Ключи по конвенции (`lbl*`, `txt*`, `err*`)
- [ ] Новая секция → все 11 файлов

---

## Качество переводов

- **EN** — вычитанный, fallback
- **RU** — основной для команды, качественный
- **9 остальных** — машинные, но технически корректные (теги сохранены)
- При сомнении → EN fallback + TODO
- **Не переводить:** Hexlash, Predator, Sentinel, Ghost, Analyst, Maverick, Juggernaut

---

## Связь с UI

- Текстовые блоки выдерживают +30% длины (DE, RU)
- Pixel-font (Anonymous) ≤3 слов — длинные локали могут не влезть
- Лейблы навигации — короткие во всех языках
- Подробнее → `hexlash-design`

---

## Запрещено

- Хардкод текста в template/script
- Импортировать vue-i18n
- Ключ только в одну локаль
- Удалять EN ключ, оставив в других
- Менять имя ключа без обновления всех call-sites
- `v-html` для пользовательского i18n контента (XSS)
- Переводить бренды и архетипы
- `if (lang === 'ru')` — через i18n систему
- Разные имена переменных в разных локалях (`{name}` vs `{имя}`)

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| i18n движок | `/src/locales/index.js` |
| EN (fallback) | `/src/locales/en.js` |
| RU | `/src/locales/ru.js` |
| Все локали | `/src/locales/{lang}.js` |
| Help pages | `/src/locales/pages/help/{lang}.json` |
| Rules pages | `/src/locales/pages/rules/{lang}.json` |
| Game data | `{lang}.js` → `gameData.branches`, `gameData.moves` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-vue` — использование i18n в компонентах
- `hexlash-design` — длина текстов в UI
- `hexlash-gamedesign` — переводы движений и веток
