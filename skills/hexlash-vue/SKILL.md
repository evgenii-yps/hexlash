---
name: hexlash-vue
description: Фронтенд-конвенции проекта Hexlash. Триггерится на Vue компоненты, Vuex модули, Router, фронтенд-логику, store, views, components, props, computed, реактивность, шаблоны, slots, lifecycle hooks, dispatch, getters, actions, mutations, v-model, v-if, v-for, template, script, style, scoped, или любые файлы в /src. Грузить вместе с hexlash-dev (всегда) и hexlash-design (если задача затрагивает UI).
---

# hexlash-vue — Frontend Conventions

## Стек и версии

- **Vue 3.5** — преимущественно Options API, Composition API допускается для новых сложных компонентов
- **Vuex 4** — глобальный store, 13 модулей
- **Vue Router 4** — auth guards, восстановление состояния боя
- **Vuetify 2** — частично используется (`<v-img>`, `<v-btn>` в легаси), новые компоненты — без Vuetify
- **Vite 7** — dev server на :5173, build с обфускацией + Brotli + image optimization
- **Howler.js** — звук (punch, rain)
- **Three.js** — 3D punching bag в TrainingView
- **Кастомный i18n** — `/src/locales/index.js`, **НЕ vue-i18n**

---

## Структура фронтенда

```
/src
  App.vue               — root, header, BottomMenu, тосты, ChallengeNotification
  main.js               — Vue + Vuetify + i18n + store init
  router/index.js       — routes, auth guards, fight state restore
  views/                — page-level (20 view, суффикс View)
  components/           — 75+ компонентов
    ui/                 — дизайн-система (Hex* префикс): HexButton, HexCard, HexProgress, HexBadge, BeltBadge, UserCaptainBadge, PixelIcon
    club/               — 7 Club Mode компонентов
    clan/               — 1 Clan социальный компонент
    fragments/clan/     — 10 Clan фрагментов
    ratings/            — AgentLeaderboard
  core/
    state/store.js      — Vuex store
    state/modules/      — 13 Vuex модулей
    services/           — 9 бизнес-сервисов
    database/           — 7 LocalStorage/IDB репозиториев
    api/apiClient.js    — Axios HTTP клиент
    engine/             — combat (combatEngine, aiStrategy, opponentGenerator)
    websocket/          — WebSocket клиент
    constants.js        — игровые константы
  data/                 — статические данные (branches, moves, requirements, cardPower, clanLevels, pixelIcons)
  locales/              — i18n: 11 языков
  styles/hexlash-ui.css — дизайн-система (источник правды по CSS)
```

Детали — в CLAUDE.md секция "Project Structure".

---

## Vuex — правила работы

Store: `/src/core/state/store.js`, модули в `/src/core/state/modules/`.

### 13 модулей

| Модуль | Назначение |
|--------|-----------|
| `masterState` | App init, auth, info/error сообщения, язык |
| `userState` | Профиль, статистика, аватар |
| `cardFightState` | Активный бой: раунды, HP, dice, coach, playerModules, localStorage persist |
| `progressionState` | Moves unlocked/levels, taps, XP per branch, server sync (PUT /user/progression) |
| `clanState` | Clan инфо, участники, баланс, роли. Namespace `clan/` |
| `taskState` | Daily + social задачи |
| `punchState` | Punch/tap rate limiting, cooldown, 2D/3D toggle, sound mute |
| `achievementState` | Достижения + разблокировка |
| `contractState` | Web3 кошелёк, баланс токенов |
| `webSocketState` | WS соединение, real-time сообщения |
| `pvpState` | Real-time PvP matchmaking и бои |
| `friendsState` | Друзья, заявки, challenges (WebSocket) |
| `agentState` | Agent roster: CRUD, auto-fight, Fight Club level, detail actions |

**Все модули namespaced.** Доступ:
- Геттер: `store.getters['module/getterName']`
- Действие: `store.dispatch('module/actionName', payload)`
- Мутация: только из actions, **никогда** напрямую из компонентов

В компонентах: `mapState`, `mapGetters`, `mapActions` или прямой `this.$store`.

Persist в localStorage — через подписку в action или helper, не через vuex-persistedstate.

Server sync: progression — debounced PUT через action в `progressionState`.

---

## Router — правила

- Файл: `/src/router/index.js`
- Auth guard: проверяет JWT в localStorage, редирект на `/auth/login` для protected routes
- Fight state restore: при перезагрузке во время боя — восстанавливается из localStorage
- BottomMenu скрывается на PvP-экранах через computed `isPvPScreen` в App.vue (matchmaking, fight в pvp режиме, spectate)
- Таблица маршрутов — в CLAUDE.md секции "Routes"

---

## i18n — критически важно

**НЕ используем vue-i18n.** Кастомный реактивный i18n.

- Файл: `/src/locales/index.js`
- Экспортирует:
  - `t` — computed ref, **в шаблонах без `.value`**
  - `setLanguage(lang)` — смена языка
  - `interpolate(str, vars)` — подстановка переменных
- 11 локалей: `en, ru, de, es, fr, pt, ar, hi, ja, ko, zh`

Использование:
- **В шаблоне:** `{{ t.section.key }}` (auto-unwrap ref)
- **В script:** `t.value.section.key`
- **С интерполяцией:** `interpolate(t.value.moves.lblUnlockFirst, { name: '...' })`

**Любой новый текст → в `/src/locales/{lang}.js`** для всех 11 локалей. EN fallback обязателен.

Для деталей — грузить `hexlash-i18n`.

---

## Стилизация компонентов

- **Только** `--hex-*` CSS переменные из `/src/styles/hexlash-ui.css`
- Никаких легаси `--pink, --dark, --gray*` (исключение — PrivacyView)
- Для UI правил, цветов, шрифтов — грузить `hexlash-design`
- Готовые UI компоненты в `/src/components/ui/`: **сначала проверить, есть ли подходящий**, потом писать новый
- Готовые: `HexButton`, `HexCard`, `HexProgress`, `HexBadge`, `BeltBadge`, `UserCaptainBadge`, `PixelIcon` (последний preserved но не используется)
- `<style scoped>` обязателен в новых компонентах

---

## Файловые и кодовые конвенции

- Компоненты: PascalCase (`FriendCard.vue`, `MorningReport.vue`)
- Views: суффикс `View` (`ProfileView.vue`, `CardFightView.vue`)
- UI дизайн-системы: префикс `Hex` (`HexButton.vue`)
- Vuex модули: camelCase + суффикс `State` (`agentState.js`, `pvpState.js`)
- Сервисы: camelCase (`combatEngine.js`, `aiStrategy.js`)
- Один компонент = один файл `.vue` (template + script + scoped style)
- Импорты: алиас `@` = `/src` (настроен в Vite)
- ES modules везде

---

## Реактивность и работа с данными

- Source of truth для прогрессии (moves, XP, taps, deck, playerModules) — **сервер**
- Локальные изменения → debounced PUT `/v1/user/progression` (3s) через `progressionState`
- При логине — восстанавливается через GET `/v1/user/me`
- PvP fight state — очищается из localStorage на `fight_end` через action `clearSavedFight`
- API клиент: `/src/core/api/apiClient.js` — Axios, JWT в Authorization header
- Для backend деталей — грузить `hexlash-api`

---

## WebSocket в компонентах

- Клиент: `/src/core/websocket/`
- Vuex модуль: `webSocketState`
- Подписка через `store.dispatch('webSocket/...')` или геттеры
- **Не открывать WebSocket напрямую из компонента** — всегда через сервис
- Для деталей — грузить `hexlash-websocket`

---

## Звук

- Howler.js: punch sounds (BottomMenu, TrainingView), rain (RainView)
- Mute toggle: Profile > Account, компонент `SoundToggle.vue`
- Состояние: `store.getters['punch/isMuted']`, persist в localStorage ключ `isMuted`
- **Перед воспроизведением звука всегда проверять isMuted**

---

## Запрещено

- Импортировать vue-i18n — у нас свой
- Использовать `--pink, --dark, --gray*` в новых файлах
- Использовать `v-html` для пользовательских данных (XSS) — только для доверенного i18n контента
- Прямые мутации Vuex state из компонентов
- Создавать компонент, дублирующий существующий из `/src/components/ui/`
- `localStorage.setItem` напрямую из компонентов для критичных данных — через сервис/action
- Хардкодить тексты в шаблонах — всегда через i18n
- Открывать WebSocket напрямую — через сервис
- Использовать Composition API ради моды — Options API остаётся дефолтом

---

## Чеклист готовности компонента

- [ ] Использует только `--hex-*` переменные
- [ ] Все тексты вынесены в i18n (11 локалей, EN fallback)
- [ ] `<style scoped>`
- [ ] PascalCase имя файла
- [ ] Если UI элемент — пройден чеклист `hexlash-design`
- [ ] Touch targets минимум 44×44px (mobile-first)
- [ ] Работает на ширине 320px (iPhone SE)
- [ ] Если требует данные с сервера — есть loading/empty/error состояния
- [ ] Если меняет state — через Vuex action, не напрямую
- [ ] Не дублирует существующий компонент

---

## Связанные скиллы

- `hexlash-dev` — базовый воркфлоу (всегда первым)
- `hexlash-design` — для любых UI задач
- `hexlash-i18n` — для работы с переводами
- `hexlash-api` — когда нужны backend данные
- `hexlash-websocket` — для real-time
- `hexlash-combat` — для combat-related компонентов
