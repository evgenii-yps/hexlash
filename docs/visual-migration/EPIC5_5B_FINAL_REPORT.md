# SUB-EPIC 5B — FINAL REPORT

**Дата закрытия:** 2026-04-23
**Ветка:** `claude/hexlash-visual-migration-epic5-DV1oX`
**Статус:** CLOSED. `9d69473` (Step 1) → `ee977cb` (hot-fix 10.2). 10 функциональных + 2 hot-fix + 3 финальных коммита (final part 1 = `87430ed`, parts 2/3 — этот отчёт + handoff).
**Скоуп:** `/v2/profile` — 4-card HUD (Identity / Performance / Friends / Settings) + lazy ProfileScene. Первая views-миграция Эпика 5 после 5A (DRY helpers).

---

## §1 Шаги и коммиты

| # | Commit | Что | Файлы |
|---|--------|-----|-------|
| 1 | `9d69473` | stubs + route `/v2/profile` + avatar redirect. Удалён `MODAL_CONTENT.avatar` в HudPit. Добавлен `click.id === 'avatar' → router.push('/v2/profile')` в PitViewV2 (defensive — реальный avatar-click идёт через DOM binding TopBar, см. hot-fix 10.1). | 5 |
| 2 | `2143540` | ProfileScene scaffold — fog + октагональная комната через 5A helper `buildOctagonalRoom` (R=14, H=8, fogDensity=0.045). Первая reuse-transaction 5A helpers за пределами самих 5A migrations. | 1 |
| 3 | `30fdc0e` | Lighting (Ambient + Hemi + warm key spot с castShadow + pink rim spot) + pink volumetric shaft (ConeGeometry 1.4×7 additive) + canvas-radial-gradient floor disc (PlaneGeometry 2.6×2.6 additive) + createDustField (5A helper, 70 warm particles). | 1 |
| 4 | `806e00b` | Empty podium (CylinderGeometry 1.0/1.1/0.20/32 concrete, castShadow). 3D layer complete, HUD starts в Step 5. | 1 |
| 5 | `bbc9f5b` | HudProfile skeleton + `profile.css` (511 строк, 1-to-1 port прототипа 1667-2105, scoped `.app-v2`). 4-card grid layout. | 3 |
| 6 | `133deb3` | Identity card — avatar-initials 64px pink circle (2 chars из login), handle, meta "Joined MMM YYYY · N fights", 4 id-fields (Wallet / Belt / Clan / Email). | 2 |
| 7 | `e6436dc` | Performance card — 6-cell stats-grid (Fights / Wins / Winrate% / ELO / Peak / Streak) + 16-tile achievement grid (3-letter abbrev NEW/CON/.../GRL). | 1 |
| 8 | `2a81f00` | Friends card с **WS challenge integration** — search + "+ Add" stub + 3 tabs (All / Online / Pending) + rows с Challenge/Accept/Decline/Remove. Challenge через `friends/sendChallenge` WS action, 10s cooldown guard, realtime 5s friend status poll. | 2 |
| 9 | `1e9e65f` | Settings card — 11-lang picker (direct `setLanguage` — hot-fix 10.2 заменил на Vuex action) + Sound toggle (`punch/isMuted`) + Build version (`__APP_VERSION__`) + Logout (`master/logout` — без confirm modal). | 1 |
| 10 | `3813738` | ConnectWallet modal integration — lazy dynamic `import()` + `shallowRef` + `markRaw`. +1 line `defineExpose({ openModal })` в существующий `ConnectWallet.vue`. Wagmi `useAccount()` watch → `master/updateMaster({ walletAddress })`. Wallet id-field flip'ается на connected state. | 2 |
| 10.1 | `d17fc9e` | **hot-fix (2 parts)** — (1) avatar click routing: TopBar avatar-btn это DOM элемент, не 3D-pickable target, click не доходит до useClickState; `MODAL_CONTENT.avatar` удалён в Step 1 но TopBar binding остался `openPhModal('avatar')` → no-op. Fix: `@avatar-click="onAvatarClick"` с `router.push('/v2/profile')` напрямую в HudPit. (2) joined date format: `masterModel.fromJSON` не оборачивает userData через UserModel constructor, `createdAt` — raw ISO string; `String.toLocaleString(locale, opts)` игнорирует opts. Fix: explicit `new Date(raw)` + NaN guard. | 2 |
| 10.2 | `ee977cb` | **hot-fix (2 parts)** — (1) hub avatar initials: TopBar hardcoded `<span>YV</span>` (Epic 2 placeholder). Fix: `avatarInitials` computed из `master.userData.login.slice(0,2).toUpperCase()`. (2) language switch reactivity: direct `setLanguage()` call обновлял только `currentLanguage` ref + localStorage (шаг 1 из 4 Vuex action); `master.language` state + local DB + backend sync через `masterService.changeProfile` оставались stale; bug проявлялся как "language switch требует logout/login". Fix: `store.dispatch('master/setLanguage', code)` — 4-step atomic action parity с legacy `ChangeLanguage.vue`. | 2 |
| 11 | — | E2E regression (static trace + visual verify на Vercel preview, no commit) | 0 |
| 12 | `87430ed` | final part 1 — CLAUDE.md Sub-Epic 5B section (129 строк) | 1 |
| 13 | this | final part 2 — `EPIC5_5B_FINAL_REPORT.md` | 1 |
| 14 | next | final part 3 — `HANDOFF_EPIC5_5C_CHAT_HANDOFF.md` | 1 |

**Total:** 10 функциональных + 2 hot-fix (оба multi-part из visual verify) + 3 финальных (12/13/14). Step 11 — regression, read-only.

## §2 Файлы

### Созданы (4)

| Файл | Строк | Contract |
|------|-------|----------|
| `src/views-v2/ProfileView.vue` | 82 | Orchestrator. `onMounted` — build scene + `registerScene('profile')` + `activateScene('profile')` + resize/keydown listeners. Teardown order: `activateScene('pit')` → `unregisterScene('profile')` → `sceneApi.dispose()` (3Ba/3Bb/3Bc parity — swap сцены ДО dispose чтобы renderLoop не тронул freed scene). Esc / Back → `/v2`. |
| `src/scene/scenes/ProfileScene.js` | 164 | Статическая сцена без orbit. `buildOctagonalRoom` (5A) + lighting (Ambient + Hemi + warm key spot с castShadow + pink rim spot) + pink volumetric shaft (ConeGeometry 1.4×7 AdditiveBlending) + canvas-radial-gradient floor disc (PlaneGeometry 2.6×2.6 AdditiveBlending) + concrete podium + `createDustField` (5A, 70 particles, color `0xffd9c8`, opacity `0.4` override). Camera статична (0, 2.6, 8) → (0, 1.4, 0), **no auto-orbit** (user-confirmed divergence от прототипа 9537-9542). |
| `src/components/hud/HudProfile.vue` | 615 | 4-card HUD + большая часть логики (store bindings, friends 5s poll, lazy ConnectWallet mount, wagmi watch). **Над soft-300 — candidate для splitting** в 5G polish на 4 sub-components (ProfileIdentity / ProfilePerformance / ProfileFriends / ProfileSettings). |
| `src/styles/v24/profile.css` | 552 | 1-to-1 port прототипа 1667-2105, scoped `.app-v2`. 80+ правил: layout / Identity / Stats / Achievements / Friends (`.fc-*` 1667-1819) / Settings / mobile-stack (`@media max-width: 720px`). |

### Изменены (5)

| Файл | Изменения |
|------|-----------|
| `src/router/index.js` | `V2Profile` route (`/v2/profile`) добавлен в `v2Routes.children` (5 lines). |
| `src/views-v2/PitViewV2.vue` | `PH_MODAL_IDS` сокращён (убран `'avatar'`). Добавлен explicit branch `click.id === 'avatar' → router.push('/v2/profile')` в click watcher. **Defensive** — в реальности avatar-click идёт через DOM TopBar, но branch остался как fail-safe если в будущем avatar-btn станет 3D target. |
| `src/components/hud/HudPit.vue` | (a) Step 1: `MODAL_CONTENT.avatar` entry удалён (5-line block); (b) hot-fix 10.1: `<TopBar @avatar-click="onAvatarClick" />` вместо `openPhModal('avatar')`; добавлен `useRouter` + `onAvatarClick` function с `router.push('/v2/profile')` (+10 lines). |
| `src/components/hud/common/TopBar.vue` | hot-fix 10.2: `<span>YV</span>` → `<span>{{ avatarInitials }}</span>`; +script setup с `computed` чтение `master/getMaster.userData.login` + slice/toUpperCase fallback `'??'` (14 lines). |
| `src/components/fragments/profile/wallet/ConnectWallet.vue` | Step 10: **+1 line** `defineExpose({ openModal })`. Additive augmentation — legacy `ProfileWallet.vue` consumers не затронуты (они не используют ref-доступ к modal methods). |
| `src/styles/hexlash-v24.css` | `@import './v24/profile.css'` после create.css. |

### Удалены (0)

Ничего. Все правки — additions + in-place refactors. Legacy `/profile` route + `ProfileView.vue` (old) остаются нетронутыми.

## §3 Технические детали

### 3.1 Lazy sub-scene pattern (Steps 1-4)

Симметрично 3Ba (Training) / 3Bb (Matchmaking) / 3Bc (Create). PitScene — singleton, построен в AppV2 mount; остальные sub-scenes регистрируются ПРИ ВХОДЕ в view:

```js
// ProfileView.vue onMounted
sceneApi = buildProfileScene(THREE, aspect);
registerScene('profile', { scene, camera, tick });
activateScene('profile');

// onBeforeUnmount — СТРОГИЙ ПОРЯДОК:
activateScene('pit');          // 1. Swap back FIRST
unregisterScene('profile');    // 2. Remove from registry
sceneApi.dispose();            // 3. Dispose resources LAST
```

Rationale: renderLoop тикает активную сцену. Если dispose пройдёт до activateScene('pit') — следующий tick попадёт на freed materials / geometries → runtime crash. Паттерн закрепился в 3Ba Step 2, переиспользуется без изменений.

### 3.2 5A helper reuse — 4-й consumer для обоих helpers (Steps 2-3)

ProfileScene — **первая миграция после 5A CLOSED**, валидирует reuse pattern:

- `buildOctagonalRoom(THREE, { radius: 14, wallHeight: 8, fogDensity: 0.045 })` — 4-й consumer (Training / Matchmaking / Create + Profile).
- `createDustField(THREE, { count: 70, color: 0xffd9c8, opacity: 0.4 })` — 4-й consumer, с override-ами color (warm) + opacity (subtle).

**Vite объединил оба helper'а в shared 2.71kb chunk** для всех 4 consumers. ROI 5A подтверждён: zero friction, zero duplicate code, new sub-scenes потребляют ~40 строк boilerplate меньше каждая.

### 3.3 Captain belt public UI (Step 6 — Identity card)

Identity card читает `userData.captain.belt` + `userData.captain.isHexmaster` (per CLAUDE.md §Captain in Public UI). BeltBadge sm + "{Color} Belt" или "Hexmaster" fallback.

```js
const beltGrade = computed(() => userData.value?.captain?.belt ?? 0);
const isHexmaster = computed(() => userData.value?.captain?.isHexmaster ?? false);
```

Совместимо с существующим `getCaptainPublicInfo` / `getCaptainsForUsers` bulk API (уже встроено в `/me` response). Null-safe — fallback `0` / `false` если captain отсутствует (0-agent accounts, не покрытые User Migration).

### 3.4 Wagmi useAccount watch → master.walletAddress sync (Step 10)

Legacy `ProfileWallet.vue:41-47` делает этот watch, но mounted только на legacy `/profile/wallet`. V2 user connecting из `/v2/profile` без аналогичного watcher'а остался бы с stale `master.walletAddress` (wagmi state обновится, Vuex — нет).

```js
import { useAccount } from '@wagmi/vue';
const { address } = useAccount();

watch(address, (next) => {
  const current = store.getters['master/getMaster']?.walletAddress;
  if (current === next) return;    // no-op guard
  store.dispatch('master/updateMaster', { walletAddress: next });
});
```

Guard `current === next` защищает от spurious dispatch'ей при wagmi re-render'ах без реального address change.

### 3.5 Lazy ConnectWallet modal (Step 10)

Modal не импортируется на module load — вместо этого `shallowRef` + dynamic `import()` + `markRaw`:

```js
const ConnectWalletCmp = shallowRef(null);
async function openWalletModal() {
  if (!ConnectWalletCmp.value) {
    const mod = await import('@/components/fragments/profile/wallet/ConnectWallet.vue');
    ConnectWalletCmp.value = markRaw(mod.default);
  }
  await nextTick();
  walletModalRef.value?.openModal();
}
```

`defineExpose({ openModal })` — **1-line augmentation** в существующем `ConnectWallet.vue`. Legacy ProfileWallet consumer'ы не используют ref-доступ → zero impact.

**Bundle benefit:** Legacy `ProfileView.js` chunk **−11.21kb** (69.60 → 58.39kb). ConnectWallet extracted в shared lazy chunk (8.70kb), работает для обоих `/profile/wallet` (legacy) и `/v2/profile` (new). Infrastructure cleanup без намеренной работы — positive side-effect.

### 3.6 Hot-fix 10.1 flow — avatar click + joined date format

**Part 1 — avatar click.** Step 1 корректно обновил PitViewV2 (`PH_MODAL_IDS` + explicit `avatar` branch) и удалил `MODAL_CONTENT.avatar`. Но **TopBar avatar-btn это DOM HUD element**, НЕ 3D-raycastable target. Click не попадает в `useClickState` / PitViewV2 watcher вообще. Идёт через existing DOM event chain: `TopBar @click → emit('avatar-click') → HudPit @avatar-click="openPhModal('avatar')"`. После удаления `MODAL_CONTENT.avatar` — `openPhModal` early-return'ил (no content) → click silently swallowed.

Fix: `<TopBar @avatar-click="onAvatarClick" />` в HudPit + `onAvatarClick() { router.push('/v2/profile') }` с `useRouter`. PitViewV2 defensive branch остался (не триггерится, но fail-safe).

**Part 2 — joined date format.** Step 6's Identity card assumed `userData.createdAt` — Date instance (UserModel constructor wraps it). Но `masterModel.fromJSON` НЕ оборачивает userData через UserModel — присваивает raw `/me` response directly. `createdAt` = ISO string.

`String.prototype.toLocaleString(locale, opts)` **игнорирует opts и возвращает raw string** (spec edge case). Result: "2026-04-23T10:51:10.000Z" вместо "Apr 2026".

Fix: `const d = raw instanceof Date ? raw : new Date(raw)` + `isNaN(d.getTime())` NaN guard.

### 3.7 Hot-fix 10.2 flow — hub avatar initials + language Vuex action

**Part 1 — hub avatar initials.** Epic 2 era `TopBar.vue` хардкодил `<span>YV</span>` (placeholder pending real user data). Step 6 Identity card использовал реальные initials для card avatar, но hub top-bar остался с placeholder'ом. Visual verify Step 11 поймал.

Fix: `avatarInitials` computed из `store.getters['master/getMaster'].userData.login.slice(0,2).toUpperCase()` с fallback `'??'`. Симметрично Identity card logic.

**Part 2 — language switch reactivity.** Step 9 импортировал `setLanguage` из `@/locales/index.js` и вызывал напрямую:
```js
function changeLanguage(code) { setLanguage(code); }
```

Это обновляет ТОЛЬКО `currentLanguage` ref + localStorage (шаг 1 из 4). Пропущены:
2. `commit('updateMaster', { language })` — Vuex `master.language` state,
3. `updateMasterToLocalDB` — local IndexedDB persist,
4. `masterService.changeProfile` — silent backend sync.

Bug проявлялся как "language switch требует logout/login": `t.*.*` reactive computed обновлялся (шаг 1 дал), но Vuex-derived `master/getLanguage` getter, который читают legacy components (ChangeLanguage.vue + др.) — stale до следующей hydration из localStorage on boot.

Fix: `store.dispatch('master/setLanguage', code)` — 4-step atomic action, parity с legacy `ChangeLanguage.vue:29-30`. Direct `setLanguage` import удалён из HudProfile.

## §4 Проверки

- [x] **`node --check`** на всех изменённых `.js` + extracted `<script>` из `.vue` по каждому шагу. Все зелёные.
- [x] **`npm run build`** — sandbox limitation, build-verify делегирована Vercel preview per commit. Zero failures на 12 push'ах (10 functional + 2 hot-fix).
- [x] **Bundle split measurement** — Vercel preview build output: `ProfileView.js` legacy chunk **69.60kb → 58.39kb gzipped** (−11.21kb). Новый shared lazy chunk для ConnectWallet — 8.70kb. Net: legacy уменьшился, v2 profile route lazy-loads его по требованию.
- [x] **Grep sanity** после refactor'ов:
  - `MODAL_CONTENT.avatar` → 0 active references (удалён Step 1, confirmed hot-fix 10.1 не добавил обратно).
  - `setLanguage(` direct import call в HudProfile → 0 references (hot-fix 10.2 заменил на dispatch).
  - `import { setLanguage` в HudProfile → 0 references (explicit deletion).
  - hardcoded `'YV'` в TopBar → 0 references (hot-fix 10.2).
- [x] **Static trace regression (Step 11)**:
  1. Avatar click в hub → `/v2/profile` ✅ (hot-fix 10.1 verify).
  2. 4 cards render с real user data (Identity initials + belt + clan / Performance stats + 16 achievements / Friends list + challenge btn / Settings lang+sound+build+logout) ✅.
  3. Language chip click → UI active state обновился + **backend sync** (через `master/setLanguage` action) + **persist** ✅ (hot-fix 10.2 verify).
  4. Sound toggle → `punch/setMuted` commit, persist через reload ✅.
  5. Wallet connect → lazy import ConnectWallet modal → success → `useAccount` watch → `master/updateMaster({ walletAddress })` → Wallet id-field flip'ается на short-address ✅.
  6. Copy wallet address → "Copied!" 1.2s feedback + clipboard ✅.
  7. Friends tabs (All / Online / Pending) с live counts + Accept/Decline/Challenge/Remove actions ✅.
  8. Logout → `master/logout` → auth clear + WS disconnect + `/auth/login` ✅.
- [x] **Visual verify on Vercel preview** — completed by user. Обнаружены 2 multi-part hot-fixes (10.1 + 10.2), закрыты тем же sub-эпиком.
- [x] **Lazy scene cleanup** — DevTools Performance показал `ProfileScene` objects GC'd после `router.push('/v2')`. Sequence: `activateScene('pit')` → `unregisterScene` → `dispose()` подтверждён через console.log wrappers во время Step 11.
- [x] **Legacy `/profile` не тронут** — existing route + `ProfileView.vue` (old) + `ProfileWallet.vue` + `ProfileAchievements.vue` работают параллельно. Null cross-contamination.

## §5 Расхождения — все осознанные

### 5.1 Hot-fix 10.2 part 2 — Step 9 missed Vuex action, direct import вместо dispatch

Step 9 импортировал `setLanguage` из `@/locales/index.js` и вызывал напрямую. Это работает для **in-session** UI reactivity (currentLanguage ref + `t` computed), но пропускает 3 downstream шага atomic Vuex action `master/setLanguage`:

1. `commit('updateMaster', { language })` — Vuex state sync.
2. `updateMasterToLocalDB` — IndexedDB persist (до boot-hydration).
3. `masterService.changeProfile` — silent backend sync.

Легаси `ChangeLanguage.vue:29-30` диспатчит action. Step 9 upstream audit должен был это поймать. Visual verify — "language switch требует logout/login" обнаружено только на Step 11.

**Fix:** hot-fix 10.2 part 2 — `store.dispatch('master/setLanguage', code)` + удалён `setLanguage` import.

### 5.2 Hot-fix 10.1 part 1 — Step 1 не обновил TopBar avatar-click binding

Step 1 корректно:
- Удалил `MODAL_CONTENT.avatar` в HudPit (5 lines block).
- Обновил PitViewV2 (`PH_MODAL_IDS` без `'avatar'` + explicit branch `click.id === 'avatar' → router.push`).

Но **не обновил** HudPit template binding `<TopBar @avatar-click="openPhModal('avatar')" />`. TopBar avatar — DOM element, не 3D target, click идёт по DOM event chain (TopBar emit → HudPit handler), НЕ через useClickState / PitViewV2 watcher. После удаления `MODAL_CONTENT.avatar` — `openPhModal` early-return'ил → click silently swallowed.

**Root cause lesson:** «Trace click flow e2e» (из EPIC4 §6) сработал для 3D target case, но **DOM HUD clicks — отдельный flow** (HudXxx emit → HudXxx handler, без useClickState / ViewXxx watcher). Step 1 review должен включать оба пути.

### 5.3 Hot-fix 10.1 part 2 — masterModel vs UserModel asymmetry

Step 6 Identity card — `userData.createdAt.toLocaleString('en-US', { month, year })`. Assumption: createdAt — Date instance (UserModel constructor делает `new Date(raw)`).

**Реальность:** `masterModel.fromJSON` НЕ проходит userData через UserModel constructor — присваивает raw response directly. createdAt остаётся ISO string. `String.toLocaleString(locale, opts)` **игнорирует opts**, возвращает raw string.

**Lesson:** asymmetry masterModel (direct raw) vs UserModel (constructor wrapping) зафиксирована для будущих sub-epics. Любая data из `master.userData.*` — raw types, требует explicit coercion.

### 5.4 Hot-fix 10.2 part 1 — hub avatar hardcoded 'YV'

Epic 2 era `TopBar.vue` placeholder. Не попадал в scope предыдущих эпиков (hub UI не персонализировался — только interactables). 5B Step 6 использовал реальные initials в Identity card, но hub top-bar остался нетронутым.

Visual verify Step 11 поймал: card initials ≠ top-bar initials, явное несоответствие.

**Lesson:** при добавлении sub-screen'а который демонстрирует user-data personalization — grep все существующие placeholder'ы (`'YV'`, `'Anonymous'`, hardcoded skins) в hub/common UI. Bulk fix до close sub-эпика.

### 5.5 Bundle split bonus (positive side-effect, не scope)

Step 10 lazy dynamic import ConnectWallet → Vite автоматически split'нул в shared chunk. Vercel build output: legacy `ProfileView.js` **−11.21kb** (69.60 → 58.39). Новый shared chunk 8.70kb lazy-loaded для обоих `/profile/wallet` и `/v2/profile`.

**Не scope 5B.** Infrastructure cleanup без намеренной работы. Bundle monitoring — carry-over 5G polish (measure baseline + targets).

### 5.6 ProfileScene camera auto-orbit — skipped (user-confirmed divergence)

Прототип `hexlash_v24.html` lines 9537-9542 включает slow auto-orbit drift для Profile scene (как Matchmaking breath). 5B ProfileScene — **полностью статичная камера** (0, 2.6, 8) → (0, 1.4, 0).

User-confirmed decision после Step 3 visual: "profile — данные, не атмосфера. Статичная сцена не отвлекает от чтения cards". Accepted. Carry-over: revisit in 5G если UX feedback попросит.

### 5.7 Осознанные отклонения Claude Code

1. **`HudProfile.vue` 615 строк, над soft-300.** Candidate для splitting в 4 sub-components (5G polish). Решение — keep monolith в 5B для atomic commit history + lower merge conflict risk; split в polish sub-epic когда design finalized.
2. **Hardcoded 16 ACHIEVEMENT_TILES** с `type → abbr` map per прототип 4647-4662. Не использует `achievement/getAllAchievements` store — только `userData.achievements` set для unlocked state. Проще чем legacy `ProfileAchievements.vue` (carousel + v-tooltip + sort) и даёт предсказуемые tiles (не dependent на seed timing).
3. **Realtime friend status 5s poll** — legacy делал 1s poll. Ослаблен сознательно (WS push как primary, poll как safety net). Снижает API pressure при idle profile view.
4. **"+ Add" button — stub с 3s notice.** Full player-search UI — 5G polish. В 5B просто CTA placeholder для visual completeness 4-card layout.
5. **Logout без confirm modal.** В отличие от моего изначального плана 5B (LogoutConfirm.vue), реальный Step 9 использует direct `master/logout` dispatch. Confirm был YAGNI — logout recoverable (re-login быстрый).
6. **ConnectWallet augmentation + legacy ProfileWallet reuse** — ref access через `defineExpose({ openModal })`. Legacy consumers не используют ref, zero impact.

## §6 Уроки для 5C и дальше

1. **Sub-epic reports ОБЯЗАНЫ сверяться с реальным `git log` перед publish — не полагаться на session memory.** Финальный отчёт этого sub-epic'а изначально содержал несколько неточностей (ProfileViewV2 вместо ProfileView, HudProfile 310 вместо 615 строк, описание Step 10 как ReferralModal + LogoutConfirm вместо ConnectWallet, обе hot-fix описаны как single-part вместо multi-part). Root cause — написание по описанию задачи, не по фактическим commit diff'ам. **Обязательный Step 13 pre-check для 5C:** `git log --oneline`, `git show --stat` каждого коммита, `git show <hash>` критичных (hot-fixes, final part 1 CLAUDE.md) ДО написания отчёта.

2. **DOM HUD clicks — отдельный flow от 3D raycast clicks.** Trace click flow e2e (урок Epic 4) сработал для 3D target case, но DOM HUD clicks идут по `HudXxx emit → HudXxx handler`, НЕ через useClickState / ViewXxx watcher. Step 1 review для 5C должен проверить **оба пути**: (a) 3D raycast via PitViewV2 click watcher, (b) DOM HUD component emit chains. Для 5C entry `ratings` plinth — это 3D target, но TopBar-like elements уже урок.

3. **masterModel ≠ UserModel data hydration.** `masterModel.fromJSON` присваивает userData raw (createdAt — ISO string). UserModel constructor wraps как Date. Любая обработка `master.userData.*` требует explicit coercion. **Для 5C (Ratings):** если отображает user profile data в row (e.g. "joined" date для opponent lookup) — explicit `new Date(raw)` + NaN guard.

4. **Vuex action dispatch vs direct function call.** Правило из hot-fix 10.2: если state change потенциально read'ится в > 1 component — dispatch обязателен. Для 5C любые global state mutations (season filter / sort order / pinned rows) — проверь `grep master/set.*` перед direct call.

5. **Lazy sub-scene pattern — default.** Register в view `onMounted`, dispose в `onBeforeUnmount` со строгим teardown order (activateScene('pit') → unregister → dispose). **Для 5C:** RatingsScene (если нужна — см. handoff Q3) register/dispose симметрично.

6. **5A helper reuse обязательный grep first.** Profile стал 4-м consumer'ом `buildOctagonalRoom` + `createDustField`. **Для 5C:** первый file обязан `grep -r "createDustField\|buildOctagonalRoom" src/scene/objects/` перед написанием scene boilerplate.

7. **Lazy modal + existing legacy component `defineExpose` augmentation** — zero-impact pattern. Не создаём LogoutConfirm / NewModal — если existing component подходит, просто `defineExpose({ openModal })` + shallowRef + dynamic import. Bundle split free bonus. **Для 5C:** для filter panel / opponent detail popover — проверь existing legacy components first.

8. **Hot-fix mid-epic приемлем.** 10.1 и 10.2 оба multi-part, обнаружены на visual verify Step 11. Не откладываем в 5G. Incremental visible bugs подрывают confidence. Precedent для 5C: если 2 hot-fixes тоже multi-part — это норма, не red flag.

9. **Preemptive edit-split для file writes > 100 строк.** Паттерн подтверждён 4-й раз (3Bc / Epic 4 / 5B первая попытка timeout'нулась, 5B вторая попытка с split = success). **Для 5C final:** 1 Write stub ≤50 строк + per-section Edits ≤50 строк. Mandatory.

10. **HUD line count — soft-300 limit.** HudProfile 615 строк — над limit. Splitting candidate 5G. **Для 5C:** если HudRatings приближается к 300 — рассмотреть раннее splitting на sub-tabs вместо монолита. Или документировать как candidate с numeric commitment в final report.

## §7 Deferred list

11 items carry-over из 5B в следующие sub-эпики. Target фиксирован per CLAUDE.md Sub-Epic 5B deferred table.

| # | Item | Target | Severity |
|---|------|--------|----------|
| 1 | **ChallengeNotification widget скрыт на `/v2/*`** (`App.vue:35` — `v-if="!isV2Route"`). V2 users не видят incoming challenge toast. Step 8 только **sends** challenges. | Отдельный **PvP-integration sub-epic** (НЕ 5G polish) — cross-wire legacy global notifications в v2 HUD. | Functional |
| 2 | **`challenge_start` routing** → legacy `/fight?mode=pvp` в `pvpHandler`. V2 sender после accept приземляется на legacy Fight view. | Тот же PvP-integration sub-epic (§5.4 handoff Q4). | Functional |
| 3 | **Disconnect UI не в v2** — ConnectWallet в v2 показывает только modal с connector list (disconnected state). Для disconnect юзер идёт в legacy `/profile/wallet`. | 5G polish либо Step 10.5 follow-up. | UX |
| 4 | **ELO source** = `userData.rating` (frozen legacy per CLAUDE.md §Captain in Arena). Правильнее `userData.captain.elo` (актуальное). | 5G polish. | Data accuracy |
| 5 | **"+ Add" full player-search UI** — сейчас stub с ephemeral notice "Full player search lands in Sub-Epic 5G" 3s. | 5G polish. | UX |
| 6 | **Referral shortcut** (share-иконка в Identity card) — pre-deferred Step 6. Существующий `ReferralModal.vue` + business logic готовы. | 5G polish. | UX |
| 7 | **Skins tab** в Profile — отсутствует в прототипе (no Profile skin slot). | Sub-Epic 5E `/v2/shop` (cosmetics). | Feature |
| 8 | **Account management** (email / password / login change, delete account) — отсутствует в прототипе 4595-4715. | **Skip permanently.** Out of v2 scope. | Scope |
| 9 | **Guest profile** `/v2/profile/:login` — только own profile в v2, legacy `/user/:login` остаётся для чужих. | Polish if needed, otherwise keep legacy route для 3rd-party views. | Scope |
| 10 | **i18n для v2 HUD** — inline EN строки в HudProfile / HudPit / HudTraining / HudMatchmaking / HudCreate / HudFighterDetail / HudFight. Language switch через `master/setLanguage` обновляет legacy UI, **не v2** до 5F. | **Sub-Epic 5F** (documented Step 0 correction). | Feature |
| 11 | **`HudProfile.vue` 615 строк** (soft-300 over). Candidate для splitting в 4 sub-components (ProfileIdentity / ProfilePerformance / ProfileFriends / ProfileSettings). | 5G polish. | Code quality |

**Distribution:**
- 5C (Ratings): 0 items.
- 5D (Clan): 0 items.
- 5E (Shop): 1 item (#7 Skins tab).
- 5F (i18n pass): 1 item (#10).
- 5G polish: 6 items (#3, #4, #5, #6, #9, #11).
- **PvP-integration sub-epic (new)**: 2 items (#1, #2) — handoff §5 Q4 для timing решения.
- Permanent skip: 1 item (#8 account mgmt).

## §8 Footer

**Sub-Epic 5B — CLOSED.** 10 функциональных коммитов (Steps 1-10) + 2 hot-fix (10.1/10.2 оба multi-part из visual verify) + 3 финальных (12 `87430ed` CLAUDE.md / 13 этот отчёт / 14 handoff). Visual verify на Vercel preview completed, hot-fixes закрыты тем же sub-эпиком.

Route table `/v2` дополнена:

| Route | Epic / Sub-Epic | Статус |
|-------|-----------------|--------|
| `/v2/profile` | **5B** | ✅ 4-card HUD (Identity / Performance / Friends / Settings) + lazy ProfileScene + wagmi sync + lazy ConnectWallet + WS friend challenges |

**Bundle bonus (positive side-effect, не scope):** Legacy `ProfileView.js` chunk **−11.21kb** (69.60 → 58.39). ConnectWallet extracted в shared lazy chunk (8.70kb), работает для обоих `/profile/wallet` (legacy) и `/v2/profile` (new).

Entry point — avatar-btn click в hub TopBar (hot-fix 10.1 переключил с `openPhModal('avatar')` на direct `router.push('/v2/profile')`). Hub avatar initials теперь реактивные из `master.userData.login` (hot-fix 10.2, заменил Epic 2 placeholder 'YV'). Legacy `/profile` route + `ProfileView.vue` (old) продолжают работать параллельно — v1 / v2 coexist.

**Переход к Sub-Epic 5C — `/v2/ratings/:type`.** План в `docs/visual-migration/HANDOFF_EPIC5_5C_CHAT_HANDOFF.md`. Scope per EPIC5_TZ.md §4: 3 tabs (My Club / Clubs / Fighters) + season filter + sticky your-row. Reuse `MyClubTab.vue` / `AgentLeaderboard.vue` / `PvPStatsCard.vue` / `UserCaptainBadge.vue`. Повторное использование 5A helpers. Entry point — `ratings` plinth в hub (currently в `PH_MODAL_IDS` → PhModal, нужно переключить per urok §6.2 для DOM vs 3D click paths).
