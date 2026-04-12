---
name: hexlash-dev
description: Базовый операционный скилл проекта Hexlash. Загружается ПЕРВЫМ перед любой задачей. Триггерится на любую задачу в Hexlash, старт работы, упоминание структуры проекта, git, воркфлоу, файловых конвенций, кодстайла, организации кода, новой фичи, бага, рефакторинга. Всегда читать CLAUDE.md первым.
---

# hexlash-dev — Core Workflow

## Главное правило

Перед началом ЛЮБОЙ задачи:
1. Прочитать `CLAUDE.md` — source of truth
2. Загрузить релевантные доменные скиллы (см. карту ниже)
3. Проанализировать связанные файлы
4. Только потом — план и реализация

---

## Tech Stack

- **Frontend:** Vue 3.5, Vite 7, Vuex 4, Vue Router 4, Vuetify 2, Three.js, Howler.js, Ethers.js 6, кастомный i18n (не vue-i18n)
- **Backend:** Express 4, Prisma 5 (PostgreSQL), JWT, ws, Multer, Anthropic SDK
- **Real-time:** WebSocket на том же HTTP-сервере что и Express

---

## Структура проекта

```
/src              — Vue фронтенд (views, components, core/state, core/services, data, locales, styles)
/backend          — Express + Prisma + WebSocket
/public           — статика, скины бойцов
/skills           — 12 Claude Code скиллов
CLAUDE.md         — source of truth, всегда читать первым
```

Детали структуры — в CLAUDE.md секция "Project Structure".

---

## Карта доменных скиллов

| Триггер задачи | Скилл |
|----------------|-------|
| UI, CSS, цвета, дизайн, верстка, компоненты | `hexlash-design` |
| Vue компоненты, Vuex, Router, фронтенд логика | `hexlash-vue` |
| Бой, PvE/PvP, движок, кубик, коуч, archetype | `hexlash-combat` |
| WebSocket сообщения, real-time, матчмейкинг, challenges | `hexlash-websocket` |
| Backend endpoints, Express, Prisma, JWT, миграции | `hexlash-api` |
| Деплой, Docker, Nginx, Vercel, CI/CD | `hexlash-deploy` |
| Тесты, QA, регрессия, дебаг | `hexlash-testing` |
| Web3, NFT ERC-1155, кошелёк, x402, Base | `hexlash-web3` |
| Claude API, AI Trainer, промпты, анализ боя | `hexlash-ai` |
| Локализация, переводы, 11 языков, locales/ | `hexlash-i18n` |
| Баланс, архетипы, формулы урона, механики | `hexlash-gamedesign` |

**Правило:** всегда грузить ВСЕ релевантные скиллы. UI-задача с бэкенд частью = `hexlash-design` + `hexlash-vue` + `hexlash-api`.

---

## Git workflow

- Основная ветка: `main`
- Текущая dev-ветка фиксируется в CLAUDE.md (секция "Branch (Git)")
- Перед любым коммитом — проверить, что ветка та, что нужна
- Имена коммитов: краткие, по делу, без воды
- Перед PR — обновить CLAUDE.md если изменения затрагивают архитектуру/компоненты/views

---

## Файловые конвенции

- Vue компоненты: PascalCase (`HexButton.vue`, `FriendCard.vue`)
- UI компоненты дизайн-системы: `/src/components/ui/` с префиксом `Hex` (`HexButton`, `HexCard`, `HexProgress`, `HexBadge`)
- Views: `/src/views/`, суффикс `View` (`ProfileView.vue`, `CardFightView.vue`)
- Vuex модули: `/src/core/state/modules/`, camelCase (`agentState.js`)
- Сервисы: `/src/core/services/`, camelCase
- Backend routes: `/backend/src/routes/`, lowercase (`auth.js`, `user.js`)

---

## Base URLs и порты

- Frontend dev: `http://localhost:5173` (Vite)
- Backend dev: `http://localhost:3000` (Express)
- WebSocket: same HTTP server as Express (shared port 3000 в проде, `WS_PORT=444` в конфиге для разработки)
- API base path: `/v1/`
- Production: `hexlash.com`, `test.hexlash.com`

---

## Критические правила работы

- **CLAUDE.md — source of truth.** Любое изменение архитектуры → обновить CLAUDE.md в той же задаче.
- **Скиллы > общие знания.** Если скилл говорит одно, а общие знания LLM другое — скилл прав.
- **Шаги маленькие, статусы короткие.** Не делать большие необратимые правки без подтверждения.
- **Не угадывать.** Если что-то не покрыто — стоп, спросить.
- **JWT_SECRET обязателен.** Backend крашится без него — это by design, не баг.
- **Только `--hex-*` CSS переменные.** Никаких легаси `--pink/--dark/--gray*` в новом коде.
- **i18n для всех новых текстов.** 11 локалей, EN fallback обязателен.

---

## После выполнения задачи — обновить CLAUDE.md

Чеклист:
- Изменён view/компонент → обновить описание в "Key Views" или "Component Highlights"
- Новый компонент → добавить в "Component Highlights"
- Новый файл данных → добавить в "Project Structure"
- Изменена архитектура → обновить релевантную секцию
- Новый Vuex модуль → обновить таблицу "Vuex Modules"
- Новый route → обновить таблицу "Routes"
- Новый WebSocket message → обновить таблицу "WebSocket Protocol"

---

## Связанные документы

- `/CLAUDE.md` — source of truth по проекту
- `/Hexlash_Pitch.pdf` — продуктовый питч (для контекста product-задач)
- `/Hexlash_OnePager.pdf` — краткая выжимка проекта
- `Hexlash_Visual_System.pdf` — **не в репо**; источник правды по визуалу = `hexlash-design/SKILL.md`
