# Auth Provider-Selector — Implementation Report

**Branch:** `claude/auth-ui-redesign-GnjpC`
**Source TZ:** `TZ_auth_implementation.md` (provider-selector replacement of legacy LoginView/SignupView)
**Phases:** 0 (discovery) → 1 (skeleton) → 2 (state machine) → 3 (Vuex) → 3.5 (touch targets) → 4 (rm legacy) → 5 (this report)
**Commits (5):** `fb1c43e` (P1) · `ec25731` (P2) · `b9b9666` (P3) · `76f42b6` (P3.5) · `7754fdb` (P4)
**Live QA:** Vercel preview, all 4 critical points OK (login/signup payload, no email leak, referral roundtrip, toast on /auth/*).

---

## Summary

**Replaced** legacy `LoginView.vue` (368 lines) and `SignupView.vue` (406 lines) — два отдельных view с дублирующей формой — единым `AuthSelectorView.vue` с локальной state machine из 4 экранов:

| Screen | Что | Контент |
|---|---|---|
| **A — Provider** | Default | WELCOME + 4 кнопки (Google / X / Web3 / More options) + "I have referral code" CTA под карточкой |
| **B — More** | A → "More options" | Back + WELCOME + 3 кнопки (Email / Farcaster / Discord) |
| **C — Referral overlay** | A → "I have referral code" | Teleport-to-body, code input + Apply, Esc/×/backdrop close |
| **D — Email form** | B → "Email" | Back + WELCOME + Handle (+Email на signup) + Password + Submit |

**Reused** (untouched):
- `master/login` + `master/register` Vuex actions — те же контракты, тот же error semantics
- `masterService.login` / `register` — service layer не трогал
- `InfoMessageModel.withoutButton` для всех 5 "coming soon" toasts
- Глобальный `Info.vue` mount (App.vue:19-20) — toast виден на /auth/*
- `localStorage['hexlash_referral_code']` (existing key из `/r/:username` redirect, router.js:64)
- `AuthLayoutView.vue` shell (image-logo + glow + router-view) — только обновил комментарий

**Added** (new files): 7 .vue components (1282 строки total).

**Did NOT change:**
- Backend (zero touches; payload контракты `{login, password, referralCode?}` — те же)
- `hexlash-ui.css` (new tokens предложены в этом отчёте, но не добавлены — per TZ §15)
- Routes `/auth/reset` / `/auth/telegram` (уже удалены в 1b — TZ §10 confirmed)
- Route names `Login` / `Signup` (router.beforeEach line ~296 на них завязан через `next({name: 'Login'})`)

---

## Files

### Created (7 files, 1282 lines)

| File | Lines | Role |
|---|---|---|
| `src/views/auth/AuthSelectorView.vue` | 260 | View-orchestrator. State (screen/mode/referralOpen/loading/serverError) + handlers + watch(route.path). Card frame с 4 corner-marks (desktop only). |
| `src/components/auth/AuthTabs.vue` | 88 | Login/Signup pill tabs. ARIA `role=tablist/tab/aria-selected/tabindex` roving. |
| `src/components/auth/ProviderButton.vue` | 124 | Базовая кнопка провайдера. Slots `icon`/default + props `chevron`/`loading`/`disabled`. Used by ProviderSelector + MoreOptions. |
| `src/components/auth/ProviderSelector.vue` | 122 | Screen A. Inline SVG icons (Google G / X / Wallet / Person), referral CTA. |
| `src/components/auth/MoreOptions.vue` | 112 | Screen B. Back + 3 ProviderButton (Email envelope / Farcaster M / Discord). |
| `src/components/auth/EmailForm.vue` | 354 | Screen D. Email validation pattern client-side. **Email НЕ отправляется в BE** (TODO comment в template + script). |
| `src/components/auth/ReferralOverlay.vue` | 222 | Screen C. Teleport-to-body, autofocus, Esc/×/backdrop close, Enter→Apply. |

### Modified (2 files)

- `src/router/index.js` — оба child route `'login'` + `'signup'` теперь resolve на `AuthSelectorView` (имена `'Login'` / `'Signup'` сохранены)
- `src/views/AuthLayoutView.vue` — refresh комментария на line 18

### Deleted (2 files, 774 lines)

- `src/views/auth/LoginView.vue` — 368 lines
- `src/views/auth/SignupView.vue` — 406 lines

**Net:** +1282 / −774 = +508 lines. Прирост за счёт 7 файлов компонентной декомпозиции (вместо 2 монолитных view) и общей более богатой UI (4 экрана вместо одной формы).

---

## Mapping `--c-*` → `--hex-*` (final)

| TZ token | Hexlash token | Resolved value | Status |
|---|---|---|---|
| `--c-bg-dark` | `--hex-bg-dark` | `#090909` | ✅ direct |
| `--c-bg-card` | `--hex-bg-card` | `rgba(17,17,17,0.85)` | ✅ direct |
| `--c-bg-elev` | `--hex-bg-light` | `#1A1A1A` | ⚠️ best-fit (см. предложения ниже) |
| `--c-bg-elev-hover` | `rgba(255, 255, 255, 0.06)` overlay | inline | ⚠️ no token |
| `--c-border` | `--hex-border-default` | `rgba(255,255,255,0.08)` | ✅ direct |
| `--c-border-strong` | `--hex-border-strong` | `rgba(255,255,255,0.25)` | ✅ direct |
| `--c-text-primary` | `--hex-text-primary` | `#FFFFFF` | ✅ direct |
| `--c-text-secondary` | `--hex-text-secondary` | `rgba(255,255,255,0.6)` | ✅ direct |
| `--c-text-muted` | `--hex-text-muted` | `rgba(255,255,255,0.35)` | ✅ direct |
| `--c-accent-pink` | `--hex-primary` | `#FF066F` | ✅ direct |
| `--c-focus-ring` | `--hex-primary-glow` | `rgba(255,6,111,0.5)` | ⚠️ semantically близко, но glow saturated — см. предложения |
| `--c-danger` | `--hex-danger` | `#FF3333` | ✅ direct |
| `--c-danger-soft` | `rgba(255, 51, 51, 0.10)` | inline | ⚠️ no token |

**Direct hits:** 9/13. **Approximations:** 4/13.

---

## Proposed additions to `hexlash-ui.css` (NOT made — per TZ §15)

5 предложений на отдельный sub-epic / polish round:

### 1. `--hex-bg-elev` + `--hex-bg-elev-hover` (surface elevation)

**Use case:** elevated input/button surfaces поверх карточного фона. Сейчас все consumer'ы используют `--hex-bg-light` (#1A1A1A) что слегка светлее `--hex-bg-card` (rgba(17,17,17,0.85)) — pattern работает но не имеет именованного контракта.

**Proposed:**
```css
--hex-bg-elev: #1F1F26;          /* surface above card */
--hex-bg-elev-hover: #262630;    /* hover state */
```

**Consumers post-add:** ProviderButton (default + hover bg), EmailForm input bg, ReferralOverlay input bg.

### 2. `--hex-focus-ring` (semantic focus ring colour)

**Use case:** focus-visible outline. Сейчас все consumer'ы используют `var(--hex-primary-glow)` (`rgba(255,6,111,0.5)`) — работает, но saturated (50% opacity vs typical 30-40% для focus rings).

**Proposed:**
```css
--hex-focus-ring: rgba(255, 6, 111, 0.35);
```

**Consumers post-add:** все `:focus-visible { box-shadow: 0 0 0 3px var(--hex-primary-glow) }` правила во всех 7 новых файлах + других views где аналогичный паттерн.

### 3. `--hex-danger-soft` (soft danger background)

**Use case:** error alert background tint. Сейчас inline `rgba(255, 51, 51, 0.10)` в EmailForm + Error input shadow.

**Proposed:**
```css
--hex-danger-soft: rgba(255, 51, 51, 0.10);
--hex-danger-border: rgba(255, 51, 51, 0.35);  /* parallel for alert border */
```

**Consumers post-add:** EmailForm error alert, EmailForm input--error box-shadow, любой будущий error toast inline-mount.

### 4. `--hex-text-on-primary` (text colour on primary surfaces)

**Use case:** semantic name для белого текста на pink CTA. Сейчас 3× `#fff` хардкод (mirrors existing `LoginView.vue:264,291` convention pre-deletion). `--hex-text-primary` (#FFFFFF) семантически "text on dark bg" — использовать его на pink button было бы semantic abuse.

**Proposed:**
```css
--hex-text-on-primary: #FFFFFF;
```

**Consumers post-add:** `.email-form__submit color`, `.email-form__submit-spinner border-top-color`, `.referral-overlay__apply color`, и весь будущий primary CTA код.

---

## Decisions log (all user-discretion choices)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Image-logo в AuthLayoutView над карточкой | **Keep** | TZ §1 запрет касался "HEXLASH pixel-font" блока. Image-logo image — другой контекст, AuthLayoutView вне scope. Подтверждено user'ом перед Phase 1. |
| 2 | Confirm password в signup | **Remove** | TZ §1 explicit, намеренное упрощение UX. |
| 3 | Referral localStorage key | **`hexlash_referral_code` existing** | Existing key из `/r/:username` redirect (router.js:64) + `masterService.register` уже читает (line 146). TZ §12 предлагал новый ключ — TZ assumption mismatch caught. |
| 4 | Referral payload field | **`referralCode` camelCase** | BE контракт + service layer (masterService.js:147-150) уже формирует. TZ §12 говорил `referral_code` — mismatch caught, не передаю руками вообще, service сам подхватывает из localStorage. |
| 5 | Login BE field | **`login`** (BE контракт) | TZ §12 говорил `handle_or_email` — mismatch. UI label "Handle or email" остаётся (визуально), payload field `login`. |
| 6 | Watch на `route.path` (deep-link / browser back-forward) | **Yes, with guard** | Реальный кейс. Loop guard `if (targetMode !== mode.value)` traceable. |
| 7 | `serverError` cleanup на tab change / back / Email entry | **Clear на 3 точках** | UX bleed prevention — stale error от login dispatch'а не должна показываться на signup mode. Не было в TZ explicit — caught как UX-баг. |
| 8 | `#fff` хардкод (3 места: 2× `color`, 1× `border-top-color`) | **Keep** | Нет токена `--hex-text-on-primary`. Existing `LoginView.vue:264,291` convention — same `#fff`. Token предложен в этом отчёте. |
| 9 | Watch + Vue auto-cleanup vs explicit `onUnmounted` | **Auto-cleanup** | Vue gracefully чистит `watch` при unmount. ReferralOverlay сам чистит свой `keydown` listener в `onBeforeUnmount`. No new subscriptions. |
| 10 | Provider toast naming | **`"<Provider> login is coming soon."`** | Стандартный шаблон. X читается коротко, но это название бренда — `"X (Twitter)"` оставлен как маркетинговое решение, не код-конвенция. |
| 11 | `Web3 wallet` toast label | `"Web3 wallet login is coming soon."` | Mirrors human-cased UI кнопки label "Web3 Wallet". |
| 12 | Referral overwrite policy | **Overwrite (manual entry priority)** | TZ default, manual entry в overlay = explicit user action. |
| 13 | Disable provider buttons during email loading | **No** | На `screen=email` providers не visible (другой экран). Submit button уже `:disabled`. Real double-click vector закрыт. |
| 14 | Touch targets (β: ≥44px на secondary) vs (α: leave ~30-36px secondary) | **β — bump к 44px** | TZ §13 strict reading: "≥44 на ВСЕХ кнопках". α обоснован "matches LoginView convention" — но это аргумент в пользу переноса legacy недоделок. Phase 3.5 — CSS-only, 4 файла, +20/-12, zero риск. |
| 15 | Provider icon style | **Inline minimal SVG, line-style, currentColor** | TZ Q1 approved default. Brand-correct лого вступило бы в конфликт с design rule "один pink акцент на экран". |
| 16 | Email field в signup payload | **Collect UI, NOT send** | BE pending. Triple-layer defense: EmailForm:142 (commented), AuthSelectorView dispatch destructure (login/password only), masterService.js destructure (login/password/referralCode только). TODO comment + report flag. |
| 17 | Referral overlay backdrop | **Solid backdrop blur(2px) + rgba(0,0,0,0.45)** | TZ Q3 approved simplification. Cross-DOM dim on card-behind через Teleport too brittle. Visually equivalent. |
| 18 | Phase 4 trigger | **Live QA OK** | Sandbox не имеет browser/DevTools. Static trace very-high confidence + user manual QA = effective gate. |

---

## TODO comments left in code

### `src/components/auth/EmailForm.vue:69-72` (HTML comment)

```vue
<!-- TODO(auth-email): BE payload пока не принимает email.
     Поле собирается в UI, но не отправляется. Дописать когда BE
     расширит master/register payload до {login, email, password}.
     См. ТЗ TZ_auth_implementation.md §12 + Phase 0 mismatch caught. -->
```

**Resolves when:** backend `POST /v1/auth/register` принимает `email` field. Тогда:
1. Раскомментить `email: form.email` line в `EmailForm.vue` submit emit (line 163)
2. Расширить dispatch destructure в `AuthSelectorView.onEmailSubmit` (line 175): `await store.dispatch('master/register', { login, password, email: payload.email })`
3. Расширить `masterService.register` (line 147-151) destructure
4. Удалить TODO

### Cross-references к `TODO(auth-email)`

- `AuthSelectorView.vue:59` — header comment block
- `AuthSelectorView.vue:171` — inline comment в register dispatch
- `EmailForm.vue:163` — `// email: form.email,  // intentionally omitted`

---

## Known existing behavior (NOT introduced by this PR)

### Referral storage persistence

**Behavior:** юзер вводит код в overlay → закрывает overlay (Apply) → уходит со страницы не зарегистрировавшись → код остаётся в `localStorage['hexlash_referral_code']` → применится при следующей регистрации (возможно другим юзером на том же устройстве). Также применяется к `/r/:username` redirect-у который тоже пишет в этот ключ (router.js:64).

**Where existing:** `masterService.register` line 152 чистит ключ только после **успешной** регистрации, не после ввода/отмены. Это поведение существовало до этой задачи (и в `/r/:username` redirect, и косвенно в legacy LoginView/SignupView через тот же сервис).

**Not fixed in this PR** because:
1. Out of TZ scope (§12 только говорит "сохранять в localStorage")
2. Trade-off: clear-on-overlay-close затрёт ввод если юзер случайно закрыл overlay; clear-after-N-minutes требует timer

**Если когда-нибудь понадобится фикс:** добавить TTL в storage entry (`{code, expires}`) или clear на explicit "logout" / "clear referral" action.

### `master/login` action push-on-success

`master/login` (masterState.js:121) сам делает `router.push('/')` после `masterService.login`. На `/` user authed → 1a beforeEnter cascade → `/play`. Component (AuthSelectorView) unmount'ится во время этого push — `loading.value = false` finally branch не успеет выполниться, но это OK потому что unmount всё равно убивает state. Аналогично для `master/register` (line 149).

---

## Расхождения с CLAUDE.md (caught по ходу)

### 1. Routes section — `## Routes` в CLAUDE.md строка для `/auth/login` `/auth/signup`

CLAUDE.md описывает: `AuthLayoutView > LoginView/SignupView (Sub-epic 1b)`. После этого PR актуально: `AuthLayoutView > AuthSelectorView (Эпик 9 auth-redesign)`.

**Recommended CLAUDE.md update** (post-merge):

```diff
-| `/auth/login` `/auth/signup` | AuthLayoutView > LoginView/SignupView (Sub-epic 1b) | No |
+| `/auth/login` `/auth/signup` | AuthLayoutView > AuthSelectorView (Эпик 9 auth-redesign — provider-selector with state machine) | No |
```

### 2. Component Highlights section — Auth Forms entry (line "Auth Forms")

CLAUDE.md упоминает: `auth/LoginView.vue, auth/SignupView.vue ... .auth-form-* BEM-light scoped classes`. После этого PR — устарело.

**Recommended update:** заменить на `Auth Forms | auth/AuthSelectorView.vue + components/auth/* (7 files) | Provider-selector with state machine (4 screens: provider/more/email/referral overlay). 5 "coming soon" toasts via InfoMessageModel.withoutButton. .auth-selector-* / .provider-* / .email-form-* BEM-light scoped classes.`

Both CLAUDE.md edits — outside this PR scope (CLAUDE.md sync per its own rule "After every task" обычно делается отдельным commit per существующую convention в проекте — Sub-epic CLOSED entries в CLAUDE.md делаются в финальной фазе sub-epic). Если нужно — отдельной задачей или включением в этот PR.

---

## TZ §14 final checklist

| # | Item | Status | Note |
|---|---|---|---|
| 1 | `LoginView.vue` и `SignupView.vue` удалены | ✅ | Phase 4, commit `7754fdb` |
| 2 | Создан `AuthSelectorView.vue` + 6 компонентов | ✅ | `AuthCardFrame` skip — corner-marks inline (TZ §9 implied option) |
| 3 | Router обновлён, оба auth-роута → `AuthSelectorView` | ✅ | router.js:13-29, имена `Login`/`Signup` сохранены |
| 4 | A → B → D, A → C, A ↔ табы работают | ✅ | Phase 2 wiring + live QA passed |
| 5 | Логотипа над карточкой нет | ✅ | В самой карточке: WELCOME + hint (Inter + Anonymous) — pixel-font HEXLASH блока нет. Image-logo в AuthLayoutView сохранён per decision #1. |
| 6 | Toast на 5 провайдеров через `InfoMessageModel.withoutButton` | ✅ | `showComingSoon` helper, AuthSelectorView:74-76, live QA passed |
| 7 | Login и Signup переключаются табами + URL меняется через `router.replace` | ✅ | `onTabChange`, `router.replace`, watch с guard |
| 8 | Confirm password НЕ добавлен | ✅ | EmailForm 2 поля на login (handle/password), 3 на signup (handle/email/password) |
| 9 | Все цвета через `--hex-*` токены — `grep "#[0-9a-fA-F]+"` пусто | ⚠️ partial | 3× `#fff` для белого CTA-текста (документировано decision #8 + предложение `--hex-text-on-primary` token) |
| 10 | Все состояния (default/hover/focus/loading/error/disabled) | ✅ | Все scoped CSS блоки покрывают, Phase 3.5 добавил touch ≥44 |
| 11 | Corner-marks на desktop / скрыты на mobile (≤480px) | ✅ | AuthSelectorView:144-149 `@media (max-width: 480px) { .auth-corner { display: none; } }` |
| 12 | Mobile (380×800): card не overflow, тач-таргеты 44+ | ✅ | Phase 3.5 closed sub-44 controls (tabs/back/close ×). Static check + live QA confirmed. |
| 13 | aria-labels проставлены, `role="..."` | ✅ | AuthTabs `role=tablist/tab + aria-selected + tabindex roving`. ReferralOverlay `role=dialog + aria-modal + aria-label`. EmailForm error alert `role=alert`. Back/close icon-buttons имеют `aria-label`. |
| 14 | Email login + signup проходят сабмит и редирект (Vuex actions) | ✅ | Live QA passed; static trace 3-layer defense confirmed |
| 15 | Referral сохраняется в localStorage (TBD-маркер не нужен — backend уже подхватывает) | ✅ | `localStorage.setItem('hexlash_referral_code', code)` в `onReferralApply`. masterService автоматически кладёт в payload + чистит после успеха. Live QA confirmed roundtrip. |

**Score:** 14/15 ✅, 1 ⚠️ (item #9 — `#fff` хардкод, документирован)

---

## Что нужно проверить вручную перед мержем

1. **Verify CI build pass на PR'е** — Vercel preview должен зеленеть (локальный build pass подтверждён, но CI = ground truth)
2. **Smoke на staging** если есть (полный roundtrip login → succeed → /play, signup → succeed → /play, signup с ошибкой "handle taken" → see alert, referral roundtrip с network tab)
3. **`router.beforeEach` line ~296 unauth redirect** — проверить что `next({name: 'Login'})` всё ещё работает (route name 'Login' preserved Phase 4)
4. **CLAUDE.md sync** — два расхождения выше (Routes table + Component Highlights) — отдельный commit или включить в этот PR (на твоё усмотрение)
5. **Rollback plan** — если post-merge regression: `git revert 7754fdb 76f42b6 b9b9666 ec25731 fb1c43e` (5 коммитов в обратном порядке) → `git push`. AuthLayoutView.vue:18 комментарий восстановится; router restored к pre-PR state. Старые view вернутся в working tree.

---

## Build artifact summary

**AuthSelectorView lazy chunk:**
- JS: 12.87 kB raw / 4.23 kB gzip / 3.56 kB brotli
- CSS: 12.35 kB raw / 2.13 kB gzip / 1.76 kB brotli

**Phase progression:**

| Phase | JS gzip | CSS gzip | Δ JS gzip |
|---|---|---|---|
| 1 (skeleton) | 3.75 kB | 2.13 kB | — |
| 2 (state machine) | 3.89 kB | 2.13 kB | +0.14 |
| 3 (Vuex/toast/localStorage) | 4.22 kB | 2.13 kB | +0.33 |
| 3.5 (touch targets +20 lines CSS) | 4.23 kB | 2.13 kB | +0.01 |
| 4 (rm legacy) | 4.23 kB | 2.13 kB | 0 (chunks self-contained, dead views were already tree-shaken) |

`LoginView` / `SignupView` lazy chunks были на main чанке pre-PR — эмитировались в `dist/assets/LoginView-*.js` / `SignupView-*.js` (~4-5 kB gzip each). После Phase 1 router больше их не импортировал — Vite tree-shake'нул мгновенно. Phase 4 удаление с диска bundle delta дополнительно не дало.

---

## Final tree

```
src/
├── views/
│   ├── AuthLayoutView.vue        (modified: 1 comment line refresh)
│   └── auth/
│       └── AuthSelectorView.vue  (new, 260 lines)
└── components/
    └── auth/                     (new directory)
        ├── AuthTabs.vue          (88 lines)
        ├── EmailForm.vue         (354 lines)
        ├── MoreOptions.vue       (112 lines)
        ├── ProviderButton.vue    (124 lines)
        ├── ProviderSelector.vue  (122 lines)
        └── ReferralOverlay.vue   (222 lines)
```

`src/router/index.js` — 1 import block updated (lines 12-32), 2 child component references → `AuthSelectorView`.

---

## Phase chain — commits

| Phase | Commit | Title |
|---|---|---|
| 1 | `fb1c43e` | feat(auth): Phase 1 — provider-selector skeleton |
| 2 | `ec25731` | feat(auth): Phase 2 — wire state machine |
| 3 | `b9b9666` | feat(auth): Phase 3 — Vuex + toasts + localStorage referral |
| 3.5 | `76f42b6` | feat(auth): Phase 3.5 — bump secondary touch targets to ≥44px |
| 4 | `7754fdb` | feat(auth): Phase 4 — remove legacy LoginView + SignupView |
| 5 | (this commit) | docs(auth): add implementation report |

All pushed to `claude/auth-ui-redesign-GnjpC`. PR ready.

---

## Follow-ups / Tech debt

Track these as separate backlog items / issues — **NOT introduced by this PR**, but surfaced or left open in scope-disciplined fashion. Owner: project maintainer (post-merge).

### 1. `TODO(auth-email)` — extend BE register payload to accept email

**Where:** `EmailForm.vue:69` (HTML comment) + `EmailForm.vue:163` + `AuthSelectorView.vue:59,171` (cross-references).

**What:** Backend `POST /v1/auth/register` does not currently accept `email` field. Email is collected in signup UI (3-field form: handle / email / password) but only `{login, password}` is sent. Triple-layer defense (EmailForm emit destructure → dispatch destructure → `masterService.register` field destructure) ensures email never leaks to BE.

**Resolution path:**
1. Backend: extend `POST /auth/register` to accept optional `email` field + validate format + persist to `User.email` (existing column).
2. Frontend: uncomment `email: form.email` in `EmailForm.vue:163`.
3. Frontend: extend `onEmailSubmit` dispatch in `AuthSelectorView.vue:175` — add `email: payload.email`.
4. Frontend: extend `masterService.register` destructure (line 147-151).
5. Remove all 3 `TODO(auth-email)` comments.

**Until then:** email is UI-only collection (potential future tech debt if BE never extends). Suggested priority: **medium** — email collection is part of TZ §2 D (signup mode 3 fields).

### 2. 5 proposed semantic tokens in `hexlash-ui.css`

Components currently use temp fallbacks. Adding these tokens centralises the contract and lets `--hex-*` grep stay clean.

| Token | Current fallback | Use |
|---|---|---|
| `--hex-bg-elev` | `--hex-bg-light` (#1A1A1A) | Surface above card (provider buttons, inputs) |
| `--hex-bg-elev-hover` | inline `rgba(255,255,255,0.06)` | Hover state for elevated surfaces |
| `--hex-focus-ring` | `--hex-primary-glow` (rgba 0.5, saturated) | Semantic focus ring (typically rgba 0.30-0.35) |
| `--hex-danger-soft` | inline `rgba(255,51,51,0.10)` | Soft danger background tint |
| `--hex-text-on-primary` | `#fff` hardcode (3 sites) | White text on pink CTA — closes 1 ⚠️ in TZ §14 checklist |

**Resolution path:** add 5 tokens to `hexlash-ui.css` `:root`; refactor 7 auth files (+ any future consumers) to reference tokens; remove 3 `#fff` hardcodes. Suggested priority: **low** — current behaviour correct, only design-system hygiene.

### 3. Referral storage persistence edge case

**Where:** `localStorage['hexlash_referral_code']` lifecycle.

**What:** If user enters referral in overlay → Apply → leaves /auth without registering → key remains until next register attempt (potentially by a different person on shared device). Same behaviour exists in `/r/:username` redirect (router.js:64). NOT introduced by this PR — `masterService.register:152` only clears on successful POST.

**Possible mitigations (all out of scope for this PR):**
- Add TTL: store as `{code, expiresAt}` JSON, expire after 24h on read
- Clear on logout / Login screen mount (overlay close-without-register intent unclear)
- Move to sessionStorage instead of localStorage (persists per-tab only — strong fix but breaks `/r/:username` redirect-then-close-tab flow)

Suggested priority: **low** — security/UX edge case, not a regression.

### 4. Pre-merge checklist

For maintainer before merging this PR:

- [ ] CI build green on PR (Vercel preview deploy)
- [ ] Smoke test on staging (if exists): roundtrip `login → /play`, `signup → /play`, `signup with handle taken → server error in alert`, `referral roundtrip with network tab → referralCode in payload + localStorage cleared post-success`
- [ ] `router.beforeEach` line ~296 unauth redirect via `next({name: 'Login'})` still works (route name preserved Phase 4 — verified statically)
- [ ] Rollback plan ready: `git revert b46eee6 7754fdb 76f42b6 b9b9666 ec25731 fb1c43e` (6 commits in reverse) → `git push`. Restores legacy LoginView/SignupView from working tree, AuthLayoutView comment, router children.

### Suggested PR description block

For copy-paste into GitHub PR description:

```markdown
## Follow-ups / Tech debt

Backlog items surfaced during this PR — NOT regressions, NOT in scope for this merge.

1. **TODO(auth-email):** extend BE `POST /v1/auth/register` to accept `email`; uncomment 1 line in `EmailForm.vue:163` + 2 destructure expansions. See `docs/auth-redesign-implementation-report.md` §Follow-ups #1.
2. **5 semantic tokens** to add to `hexlash-ui.css`: `--hex-bg-elev`, `--hex-bg-elev-hover`, `--hex-focus-ring`, `--hex-danger-soft`, `--hex-text-on-primary`. Eliminates 3× `#fff` hardcode + inline rgba in 7 auth files. See report §"Proposed additions".
3. **Referral persistence edge case:** `localStorage['hexlash_referral_code']` cleared only on successful register. Pre-existing project behaviour (also in `/r/:username` redirect). Possible mitigation: TTL or clear-on-logout. See report §"Known existing behavior".
4. **Pre-merge checklist** in report §"Pre-merge checklist".
```
