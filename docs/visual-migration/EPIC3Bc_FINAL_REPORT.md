# EPIC 3Bc — FINAL REPORT

**Дата закрытия:** 2026-04-21
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Функционально подтверждён пользователем на Vercel preview. 18/18 static trace + user visual verified.
**Скоуп:** последний sub-эпик Эпика 3B — Create Fighter (`/v2/create`) + FD cleanup (удаление временной FIGHT-кнопки из Epic 3A). С этим эпиком Эпик 3B закрыт полностью.

---

## Шаги и коммиты

| # | Что сделано | Коммит |
|---|-------------|--------|
| 1 | Stubs (9 новых файлов) + route `/v2/create` + plinth redirect | `b6bd5af` |
| 1 hot-fix | pointer-events `.create-back` + `activateScene('create')` | `809c63f` |
| 2 | CreateScene scaffold — fog + camera + floor + 8 walls | `a56a693` |
| 3 | Lighting (Ambient + Hemi + Key + Front) + shaft + 80 dust | `7c81dbe` |
| 4 | Create podium — concrete disc + brushed-metal ring | `04492f0` |
| 5 | Holo fighter + `setHologram` + breathing/sway idle | `d4e60f7` |
| 6 | Archetype glow factory + `useCreateState` wiring | `8a6068e` |
| 7 | HUD scaffold + `create.css` (полный порт прототипа 1354-1562) | `78ea542` |
| 8 | Step 1 Archetype cards (6 × ARCHETYPES + click-to-glow) | `019b957` |
| 9 | Step 2 Name + `useCreateNames` (input + roll + chips) | `ee5fc9e` |
| 9 hot-fix | `resetCreateState()` on CreateView mount | `cbc074a` |
| 10 | Step 3 Confirm + `startMaterializeAnimation` | `e7d79ea` |
| 11 | FD cleanup (remove `.fd-fight-btn`, restore `right: 14px`) | `88618b4` |
| 12 | — | regression test no-commit (static trace 18 пунктов + user visual verify) |
| 13 final part 1 | CLAUDE.md подсекция Эпик 3Bc | `8bee41c` |
| 13 final part 2 | EPIC3Bc_FINAL_REPORT.md (этот коммит) | — |
| 13 final part 3 | HANDOFF_EPIC4_CHAT_HANDOFF.md | — |

**Всего:** 11 функциональных шагов + 2 hot-fix + 3 финальных документа-коммита = **13 кодовых коммитов** 3Bc. Split final применён с первого финала (прецедент 3Bb stream timeout urged) — не ждали timeout'а, разбили preemptive.

---

## Файлы

### Созданы (9)

**Scene layer:**
- `src/scene/scenes/CreateScene.js` (300 строк) — fog + camera + floor + 8 walls + lighting (Ambient + Hemi + Key + Front, **NO rim right** — прототип-parity) + volumetric shaft + 80 dust + podium + holoFighter + archetype glow + tick (breathing + sway + dust drift) + dispose с explicit `glow.dispose()` первой строкой.

**Objects (3):**
- `src/scene/objects/createPodium.js` (82) — `createPodium(THREE)` → `THREE.Group`. `CylinderGeometry(1.4, 1.5, 0.30, 32)` concrete disc (makeConcreteTexture + color `0xa8a8b0` + roughness 0.9 + metalness 0.05) + `TorusGeometry(1.42, 0.022, 8, 64)` brushed-metal ring (color `0x4a4d58` + roughness 0.4 + metalness 0.85).
- `src/scene/objects/createHologram.js` (88) — `setHologram(group, alpha)` с `!Array.isArray(material)` guard (accessories carry Array<material>); `makeHoloFighter(THREE)` → warden variant через `makeFighterLowPoly` + setHologram(0.35); `startMaterializeAnimation(group, from, to, durationMs, { onDone })` → `{ cancel() }` rAF loop + linear easing + 700ms pause + idempotent cancel на rAF + setTimeout.
- `src/scene/objects/createArchetypeGlow.js` (116) — `createArchetypeGlow(THREE, podium)` → `{ setColor(hex), dispose() }`. Canvas 256×256 radial gradient 3 stops → CanvasTexture + PlaneGeometry(1.4, 1.4) + PointLight. `disposeCurrent()` первой строкой `setColor` — rapid carousel clicks не утекают textures.

**Interaction (2):**
- `src/scene/interaction/useCreateState.js` (71) — reactive `createState { step, archetypeId, name, materializing }` + `ARCHETYPES` (6 архетипов 1-в-1 прототип 9030-9067) + `resetCreateState()` + `onArchetypeChange(id, { setGlow })` с DI.
- `src/scene/interaction/useCreateNames.js` (24) — `NAME_PARTS_A × 16` + `NAME_PARTS_B × 10` (160 комбинаций) + `randomName()` + `generateSuggestions(n=5)`. Собственный пул, **не** reused из `MM_POOL_NAMES`.

**Views + HUD (2):**
- `src/views-v2/CreateView.vue` (134) — orchestrator: `resetCreateState()` первой строкой в onMounted + `buildCreateScene` + `registerScene('create')` + `activateScene('create')`. Prop-drilling: `handleArchetypeColor`, `getHoloFighter`, `getFlashEl`. Emit listener `@materialize-start="onMaterializeStart"` для ownership cancel handle. Teardown ordering: `matHandle.cancel()` → remove listeners → `activateScene('pit')` → `unregisterScene('create')` → `sceneApi.dispose()`.
- `src/components/hud/HudCreate.vue` (294) — 3 panel templates per step (`v-if`/`v-else-if`) + back button + 3-step stepper + `onCreate` DOM flash reflow + `emit('materialize-start', handle)` + `emit('back')` при onDone → единый navigation path.

**Styles:**
- `src/styles/v24/create.css` (380) — полный порт прототипа 1354-1562 + 2559-2565 (arch-tag colours). 10 блоков: back / stepper / panel / headers / archetype / name input+roll / chips / confirm / nav / flash. `position: absolute → fixed`, `pointer-events: auto` на interactable classes. Все правила scoped под `.app-v2` (паттерн 3Ba/3Bb).

### Изменены (6)

- `src/router/index.js` — добавлен `V2Create` route (`/v2/create`) в `v2Routes.children` (после `V2Matchmaking`).
- `src/views-v2/PitViewV2.vue` — click watcher: `click.id === 'create' → router.push('/v2/create')`.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.create` удалён (7 → 6 ключей). Dead `warden`/`predator` entries остались — см. §6.6 Minor carry-over.
- `src/styles/hexlash-v24.css` — `@import './v24/create.css'`.
- `src/components/hud/HudFighterDetail.vue` (Step 11) — удалены `.fd-fight-btn` template + handler `onFight` + CSS block `.fd-fight-btn`. `.fd-resources right: 150px → 14px` (прототип-parity restoration).
- `src/scene/sceneRegistry.js` — **НЕ изменён** (unregisterScene уже добавлена в 3Ba Step 2).

### Удалены (0)

Удалений файлов нет — FIGHT-кнопка и её CSS убраны из существующих файлов как in-place edits Step 11.

---

## Технические детали

### 4.1 Scene параметры

- **Room:** `CR_ROOM_R = 14`, `CR_ROOM_H = 8`, `CR_WALL_SEGMENTS = 8` (octagonal).
- **Fog:** `FogExp2(0x070811, 0.035)` — идентично Training; cold-blue underground atmosphere.
- **Camera:** `PerspectiveCamera(38°, aspect, 0.1, 200)` at `(-1.5, 2.4, 7.0)`, lookAt `(0, 1.6, 0)`. Off-centre слева — подиум читаемо с угла. **Статичная**, никакого orbit или breath drift (прототип parity).
- **Floor:** `CircleGeometry(20, 64)` + `makeConcreteTexture` repeat 5×5, color `0x2c2c34`, roughness 0.95, metalness 0.02, `receiveShadow = true`.
- **Walls:** 8 octagonal `PlaneGeometry` с shared `MeshStandardMaterial({ color: 0x14141c, roughness: 0.95 })`.
- **Lighting (4 источника, NO rim right — парность с прототипом):**
  - `AmbientLight(0x1a1a28, 0.4)`.
  - `HemisphereLight(0x2a2638 sky / 0x0a0a12 ground, 0.4)`.
  - Key `SpotLight(0xfff0e8, 2.2, 14, π·0.22, 0.55, 1.4)` at `(0, 7.5, 0)` → `(0, 1.2, 0)`, `castShadow`, `mapSize 1024×1024`.
  - Front `SpotLight(0x4dd9ff, 0.4, 12, π·0.5, 0.9, 1.4)` at `(0, 2.5, 7)` → `(0, 1.4, 0)` — cyan fill с камеры.
- **Shaft:** `ConeGeometry(1.5, 7, 24, 1, true)` + `MeshBasicMaterial({ color: 0xfff0e8, opacity: 0.05, AdditiveBlending, DoubleSide, depthWrite: false })` at `(0, 3.5, 0)`.
- **Dust:** 80 points, X/Z `(rand-0.5)·10` (spread ±5), Y `rand·4+0.3`, color `0xffd9c8`, size 0.03, opacity 0.45, AdditiveBlending. Tick drift `y += 0.002`, reset `y = 0.3` при `y > 4`, X/Z не сбрасываются.

### 4.2 Holo contract (setHologram)

1-в-1 прототип 8937-8945 — **только `transparent + opacity`**. No emissive, fresnel, rim shader. Handoff 3Bc §5.1 correction подтверждён.

```js
export function setHologram(group, alpha) {
  group.traverse((o) => {
    if (o.material && !Array.isArray(o.material)) {
      o.material.transparent = true;
      o.material.opacity = alpha;
    }
  });
}
```

**Array material guard — обязателен.** Warden fighter accessories (belt/tail/wraps) carry `Array<material>` по `fighterModel.js` контракту. Без guard traverse бы crash'ился на `o.material.transparent = true` (TypeError — нельзя set property на Array). Accessories также `.visible = false` по default, но traverse посещает невидимые объекты.

**Экспорт `HOLO_ALPHA_INITIAL = 0.35`** вместо magic number — паттерн Epic 2/3A/3Ba constants-at-top.

**`makeHoloFighter(THREE)`** — `makeFighterLowPoly(THREE)` (default warden) + `setHologram(fighter, HOLO_ALPHA_INITIAL)` → возвращает Group с opacity 0.35 на всех non-array materials.

### 4.3 Archetype glow mechanics

Factory `createArchetypeGlow(THREE, podium)` → `{ setColor(hex), dispose() }`. 1-в-1 прототип 8950-8983.

**`setColor(hex)` — rebuild both disc + light на каждый call:**

1. **`disposeCurrent()` первой строкой** — освобождает предыдущие disc geometry + material + canvas texture + light. Guards на null-refs (idempotent).
2. Canvas 256×256 → `createRadialGradient(mid, mid, 5, mid, mid, 128)` → 3 stops:
   - `0` → `rgba(r, g, b, 0.85)`.
   - `0.45` → `rgba(r, g, b, 0.35)`.
   - `1` → `rgba(r, g, b, 0)`.
3. `CanvasTexture` → `MeshBasicMaterial({ map, transparent, depthWrite: false, AdditiveBlending, DoubleSide })` → `PlaneGeometry(1.4, 1.4)` disc.
4. `disc.rotation.x = -π/2`, `disc.position.y = 0.31` (0.01 выше podium top `y=0.30` — avoids z-fighting с torus ring).
5. `PointLight(hex, 0.55, 3.5, 2)` at `(0, 0.5, 0)` — даёт цветную подсветку снизу на fighter.
6. Оба `podium.add(...)` — children, ride-along с parent transform.

**`dispose()`** = `disposeCurrent()` — idempotent, можно вызвать несколько раз без crash.

**Защита от leak'ов:** rapid carousel click'и (user быстро переключает архетипы) без disposeCurrent() утекали бы CanvasTexture'ы (WebGL textures не GC'атся автоматически при remove из scene). Паттерн `dispose → rebuild` на каждый color change.

### 4.4 Materialize animation

Прототип 9231-9258. Инкапсулирован в `startMaterializeAnimation(group, fromAlpha, toAlpha, durationMs, { onDone })` → `{ cancel() }`.

**Константы (`createHologram.js`):**
- `MATERIALIZE_FROM = 0.35`
- `MATERIALIZE_TO = 1.0`
- `MATERIALIZE_DURATION_MS = 1200`
- `MATERIALIZE_PAUSE_MS = 700`

**Loop:**
- `requestAnimationFrame` step: `t = clamp((now - start) / duration, 0, 1)`.
- **Linear easing** — прототип 9242 `0.35 + (1.0 - 0.35) * t`. **НЕ ease-in-out** (намеренно — резкий solidify контрастнее выглядит).
- На каждый кадр: `setHologram(group, alpha)` — прогоняет через все non-array materials.
- При `t === 1`: `setTimeout(onDone, 700)` — прототип 9247 pause перед navigation.

**Cancel handle — idempotent:**
- Устанавливает `cancelled = true` (step() early-return'ит).
- `cancelAnimationFrame(rafId)` + `clearTimeout(timeoutId)`.
- Safe на double-cancel.

**DOM flash overlay** — отдельный mechanism, вызывается в `HudCreate.onCreate` перед `startMaterializeAnimation`:
```js
flash.classList.remove('flash');
flash.offsetWidth; // force reflow
flash.classList.add('flash');
```
Прототип 9233-9236 force-reflow паттерн (без него CSS animation не restart'илась бы при повторных Create'ах в пределах одной сессии — cached frame пропускал бы 0→20% ramp).

**Ownership cancel handle:** `HudCreate.onCreate` вызывает `emit('materialize-start', handle)` → `CreateView.onMaterializeStart(handle)` → `matHandle = handle`. `onBeforeUnmount` **первой строкой** вызывает `matHandle.cancel()` — late rAF/setTimeout не может вызвать `onDone → emit('back') → router.push` после view disposal. Паттерн 3Bb `animHandle`.

### 4.5 State lifecycle

**`createState`** — module-scoped reactive singleton в `useCreateState.js`:
```js
export const createState = reactive({
  step: 1,              // 1 archetype | 2 name | 3 confirm
  archetypeId: null,    // id из ARCHETYPES
  name: '',
  materializing: false, // true во время opacity lerp
});
```

**Persists через Vue unmount** (import'ирован в HudCreate template) — Vue не reset'ит module-level reactive'ы на re-mount.

**`resetCreateState()`** обнуляет все 4 поля к defaults. Экспортируется из useCreateState.

**In-session persistence** (поведение внутри одной жизни CreateView):
- `goToStep(n)` мутирует ТОЛЬКО `createState.step`, не archetypeId/name. Step 3 → Back → step 2 (name visible) → Back → step 1 (archetype `.selected`).
- `onArchetypeChange(id, { setGlow })` мутирует `archetypeId` + зовёт `setGlow(color)`. Name не трогается.
- `onRoll`/`onChip` мутируют `name`. archetypeId не трогается.

**Cross-session reset** (между mount/unmount):
- `CreateView.onMounted` **первой строкой** вызывает `resetCreateState()` (hot-fix `cbc074a`).
- Без этого call'а user, выходящий в hub на step 3, возвращался на step 3 с persisted данными.
- Прототип 9266-9269 (`openCreate`) эквивалент — сбрасывает state на каждое открытие.

**`onArchetypeChange` DI паттерн:**
```js
export function onArchetypeChange(id, { setGlow }) {
  createState.archetypeId = id;
  const a = ARCHETYPES.find((x) => x.id === id);
  if (a && setGlow) setGlow(a.color);
  // Epic 4: if (a && setVariant) setVariant(id);
}
```
Extension point для Epic 4 — `setVariant(id)` для 6 per-archetype fighter variants.

### 4.6 FD cleanup (Step 11)

Step 11 закрывает **Epic 3A deferred entry** — временную FIGHT-кнопку в FighterDetail HUD.

**Контекст Epic 3A:** при старте 3A Fight scene был закрыт через FD FIGHT-кнопку как короткий путь для testing. `.fd-resources right: 150px` был добавлен чтобы resources tiles (Taps + Free XP) не пересекались с `.fd-fight-btn`. Оба были помечены «Temporary — moves to Matchmaking in Epic 3B» в comment'ах.

**Что удалено:**
- `HudFighterDetail.vue` template: `<button class="fd-fight-btn" ...>FIGHT →</button>` (5 строк).
- `HudFighterDetail.vue` script: `function onFight() { router.push('/v2/fight'); }` (1 строка).
- `HudFighterDetail.vue` CSS: `.fd-fight-btn { ... }` block (13 строк).

**Что restore'но:**
- `.fd-resources right: 150px → 14px` — прототип-parity (прототип 648 имеет `right: 14px`).

**Grep verification (Step 12 static trace пункт 15):**
- `grep -rn "router.push('/v2/fight')" src/` → **единственный match: `MatchmakingView.vue:122`**.
- Hub → terminal → matchmaking → Start Fight — единственный путь в Fight scene.
- Никаких alternative entries — Epic 3B design intent полностью соблюдён.

**Side effect:** `useFightSetup` composable (создан в 3Bb для Matchmaking → Fight data passing) — не затронут. Используется только в pair Matchmaking + Fight.

---

## Проверки

- [x] `npm run build` зелёный на всех 13 коммитах (Steps 1-11 + 2 hot-fix + final part 1). 4803 modules transformed к финалу.
- [x] Vercel preview зелёный после каждого push'а — пользователь подтверждал визуально per step.
- [x] **Static trace 18 пунктов (Step 12):** navigation (1-3) / wiring (4-9) / state (10-12) / hub integration (13-15) / cleanup (16-18). 18/18 зелёных, hot-fix не потребовался.
- [x] **Critical grep проверка:** `router.push('/v2/fight')` → единственный match в `MatchmakingView.vue:122`. Единственный путь в Fight подтверждён.
- [x] **Critical grep проверка:** `.fd-fight-btn` → 0 активных упоминаний в src/ (даже comment удалён по ходу Step 11 отчёта).
- [x] **In-session persistence regression:** Step 3 → Back → Step 2 → Back → Step 1 — archetype `.selected` + name visible между шагами (goToStep только переключает step).
- [x] **Cross-session reset regression:** выход в hub на step 3 → повторный `/v2/create` → clean step 1 (hot-fix `cbc074a`).
- [x] **Materialize cancel regression:** Esc mid-lerp → `matHandle.cancel()` первой строкой → no console errors, no late `onDone` triggering router.push после unmount.
- [x] **Rapid navigation memory:** static проверка — `registerScene('create')` использует `Map.set` (idempotent overwrite), `unregisterScene` делает `Map.delete`, `sceneApi.dispose()` освобождает все resources (scene.traverse + glow.dispose + floorTex.dispose + dustGeom.dispose). Hub `'pit'` scene registered один раз в CanvasLayer (Epic 2), не пересоздаётся.

---

## Расхождения с ТЗ — все осознанные

### 6.1 ТЗ неточности (peer-review handoff 3Bc нашёл ДО старта)

Три расхождения handoff vs прототипа, зафиксированные до начала Step 1:

1. **Handoff 3Bc §5.3 — «2 или 6 архетипов».** Прототип 9030-9067 уже имеет **6 архетипов** (predator / analyst / ghost / sentinel / maverick / juggernaut). Выбор «2 vs 6» неактуален — 6 обязательны в UI.
   - **Resolution:** 6 архетипов в UI + warden default в 3D (все archetypeId отображаются как warden mesh), `setVariant` — extension point для Epic 4.
2. **Handoff 3Bc §5.4 — «text input + random-generate button».** Прототип 9149-9175 имеет **3 механизма**: input с maxlength=16 + roll-dice 🎲 button + 5 suggestion chips (regenerate on every step 2 entry).
   - **Resolution:** все 3 механизма реализованы 1-в-1 прототип в Step 9.
3. **Project knowledge `CLAUDE.md` был устарелый** при старте 3Bc — не содержал подсекций 3Ba/3Bb.
   - **Resolution:** Claude Code в начале чата работал по handoff'ам и коду на диске; пользователь обновил project knowledge позже. Зафиксировано как recurring risk — см. §7 Lessons.

**Механизм peer-review handoff подтверждён работоспособным:** handoff 3Bc написан предыдущим чатом, текущий чат обнаружил расхождения до старта ТЗ и применил прототип-parity без коммит-фиксов.

### 6.2 Prototype-parity overrides ТЗ (правило 0.3.4)

Два override'а где буквальный ТЗ расходился с прототипом — применён прототип, зафиксировано в commit message шага.

1. **Step 4 podium geometry + material.** ТЗ §2 Step 4 указал:
   - `CylinderGeometry(1.4, 1.5, 0.30, 48)` — 48 segments.
   - Material `{ color: 0x1a1a22, roughness: 0.7, metalness: 0.3 }` — metal-looking dark plate.

   **Прототип 8914-8920:**
   - `CylinderGeometry(1.4, 1.5, 0.30, 32)` — **32 segments**.
   - Material `{ map: makeConcreteTexture(), color: 0xa8a8b0, roughness: 0.9, metalness: 0.05 }` — **concrete-textured подиум**.

   **Решение:** применён прототип. Concrete texture визуально сочетается с floor'ом (floor тоже concrete); ТЗ-версия выглядела бы как inconsistent metallic disc в concrete room. Ring params 1-в-1 совпадают.

2. **Step 3 rim right light — отсутствует в прототипе.** ТЗ §2 Step 3 попросил «проверь прототип 9000-9015 на наличие rim right light». Прототип 8986-9015 содержит **только 4 источника**: Ambient + Hemisphere + Key + Front. **Нет rim spots** (ни pink, ни cyan). Unlike Training (где 5 sources: Ambient + Hemi + Key + **pink RimL** + **cyan RimR**) Create использует минималистичный lighting.

   **Решение:** применён прототип. Create scene визуально contemplative (focus на fighter), не combat-ready (Training rim lights подчёркивают combat vibe).

### 6.3 Bug fixes (hot-fix коммиты)

Два hot-fix'а по ходу эпика — обнаружены через visual regression пользователем.

1. **`809c63f` Step 1 fix — pointer-events + activateScene.**
   - **Bug A** (Back не кликался): `.create-view` root имеет `pointer-events: none` (v2 HUD pattern). `create.css` был пустой по ТЗ §1.1 Step 1 → `.create-back` наследовал `none` → клик проваливался на canvas.
   - **Bug B** (pit scene видна на `/v2/create`): Step 1 stub не регистрировал scene → `getActiveScene()` возвращал pit → renderLoop продолжал рендерить pit каждый кадр.
   - **Root cause:** Step 1 «stubs + route» pattern из ТЗ предполагал пустой canvas, но общий CanvasLayer с одним renderer требует explicit activation scene в Step 1 (не существует «empty» default scene с Epic 2 — она была заменена на PitScene).
   - **Fix:** 2 CSS правила + `registerScene('create', emptyScene)` + `activateScene('create')` в onMounted stub.
   - **Lesson для Epic 4:** любой Step 1 sub-эпика должен регистрировать минимум empty scene даже в stub'е.

2. **`cbc074a` Step 9 fix — resetCreateState on mount.**
   - **Bug:** user проходил flow до step 3, выходил в hub, возвращался `/v2/create` → попадал на step 3 с persisted данными.
   - **Root cause:** `createState` — module-scoped reactive singleton, persist через Vue mount/unmount. Прототип 9266-9269 (`openCreate`) сбрасывает `step/archetypeId/name` на каждое открытие; v2 эквивалент отсутствовал.
   - **Fix:** `resetCreateState()` первой строкой в `CreateView.onMounted`.
   - **Static trace Bug B (Back buttons):** был следствием Bug A, не требовал отдельного fix'а — все 3 pункта chain (`$emit('back')` → `@back="onBack"` → `router.push`) проверены зелёными в trace.
   - **Lesson для Epic 4:** любой module-scoped reactive singleton требует reset point. Preferred location — `onMounted` first line.

### 6.4 Осознанные отклонения Claude Code

Все отклонения отчитаны в соответствующих step commit message'ах.

1. **Constants вместо magic numbers.** Все пороги/timings/colors вынесены в именованные const в начале модулей — `CR_*`, `POD_*`, `HOLO_*`, `GLOW_*`, `MATERIALIZE_*`. Паттерн Epic 2/3A/3Ba/3Bb применён без исключений.
2. **Getter props вместо прямых refs** (`getHoloFighter`, `getFlashEl`). Функция-геттер отсроченного lookup'а, invoked at click time. Alternative — передавать Vue ref напрямую — требовал бы reactive wrapping `sceneApi` (non-reactive let), добавлял overhead без выгоды. Closure-based getter проще + паттерн симметричен 3Bb.
3. **Variant A wiring (prop-drilling + emit) вместо Variant B (module-scoped API setter).** ТЗ §2 Step 8 оставил выбор. Выбран A — симметрия 3Bb `animHandle` pattern, Vue idiomatic parent-child ownership, unit-testable HUD без зависимости от module-let. Обоснование в Step 8 + Step 10 commit message'ах.
4. **`disposeCurrent()` первой строкой в `setColor`** (glow). Защищает от CanvasTexture leak'ов при rapid carousel clicks — даже если user click'ает 6 архетипов за секунду. Паттерн 3Bb `screenTex.dispose()`.
5. **Single navigation path через `emit('back')`** в materialize onDone. Альтернатива — импорт `useRouter` в HudCreate — дал бы двойной navigation entry, оба вызывающие router.push. Emit-through-parent избегает дублирования.
6. **Step 11 inline comment в `HudFighterDetail.vue:218`** (документирующий почему `right: 14px` вместо прежнего `150px`) — оставлен как archeology для будущих readers. Minor observation: grep `.fd-fight-btn` даёт 0 активных упоминаний в template/script/CSS rules, но 1 match в этом комментарии. Кандидат на cleanup в Epic 5 polish. Не баг.

### 6.5 Deferred (не в скоупе 3Bc)

Переходят дальше:

1. **4 недостающих 3D fighter variants** (analyst / ghost / sentinel / maverick / juggernaut) — сейчас все archetypeId'ы отображаются как warden mesh. Epic 4 расширит `P` object в `makeFighterLowPoly` per-archetype proportions + skin color + stance (handoff `HANDOFF_FIGHTER_MODEL.md` §6 содержит 22-индексный контракт). Extension point в useCreateState.js готов — добавить `setVariant` в DI объект.
2. **Fresnel / scanlines / rim holo-shader.** Текущий holo = transparent + opacity only (прототип parity). Visual polish с custom ShaderMaterial (fresnel edge glow + animated scanlines) — Epic 5.
3. **`buildOctagonalRoom()` helper.** CreateScene / TrainingScene / MatchmakingScene имеют идентичную геометрию комнаты (8 walls + concrete floor). Общий factory вынес бы 40+ строк повтора из каждой scene. DRY refactor — Epic 5 polish.
4. **Переход Create → FD нового бойца** (`/v2/fd/:newKey`). Сейчас materialize → hub (1-в-1 прототип 9249-9255 `closeCreate`). Epic 4 расширит: Create → backend POST /v1/agents/create → response newFighterId → `router.push('/v2/fd/' + newFighterId)`. Требует регистрацию dynamic FD scenes и `useCreatedFighter` composable (one-shot consumption паттерн 3Bb).
5. **Create → real backend persistence.** Сейчас Create Fighter button только анимирует visual; fighter не сохраняется. Epic 4 добавит API integration + optimistic UI + error handling.
6. **Touch events support.** Вся /v2 миграция работает mouse-only. Epic 5 mobile sub-epic — `touchstart`/`touchmove`/`touchend` handlers для всех interactables.

### 6.6 Minor carry-over (не баг, зафиксировать для Epic 5)

1. **`HudPit.vue:56-67` — dead `MODAL_CONTENT.warden` / `MODAL_CONTENT.predator` entries** (Epic 3A carry-over). `PitViewV2.vue` click watcher проверяет `FD_IDS = ['warden', 'predator']` **first** и early-return'ит с `router.push('/v2/fd/' + click.id)` — до fallback'а `hudRef.value.openPhModal(click.id)`. Следовательно MODAL_CONTENT для warden/predator **unreachable**, но данные остались в HudPit.vue с Epic 3A. Safe to delete, но не делалось в 3Bc (вне скоупа).
2. **`HudFighterDetail.vue:218` — self-referential comment** про Step 11 3Bc. Польза для будущих readers (документирует почему `right: 14px`), но в production CSS это шум. Два пути: (a) оставить как archeology, (b) очистить в Epic 5. Выбор за Epic 5 reviewer.
3. **Comment dead area в `create.css`** — 3 TODO comment'а `/* Step 8-10 populate */` в ranges ARCHETYPE CARDS / NAME INPUT / CONFIRM SUMMARY. К финалу Steps 8-10 выполнили populate, comment'ы остались указывая в никуда. Minor.

**Both carry-over items** — не блокируют Epic 4, кандидаты на Epic 5 polish pass.

---

## Уроки для Epic 4

1. **Peer-review handoff работает — механизм подтверждён.** 3Bc handoff написан предыдущим чатом по best-available знанию. Текущий чат нашёл **3 неточности до старта ТЗ**: 6 vs 2 архетипа; 3 vs 2 механизма name; CLAUDE.md stale. Применял прототип-parity без коммит-фиксов. **Для Epic 4:** новый чат должен **прогнать handoff через peer-review** первым действием — сверить утверждения с прототипом/кодом, зафиксировать расхождения до старта Step 1.

2. **Step 1 «stubs + route» pattern требует активации scene.** Hot-fix `809c63f` как прецедент — общий CanvasLayer renderer не имеет «empty» default scene (Epic 2 заменил её на PitScene). Любой Step 1 sub-эпика должен **register + activate** минимум пустую scene даже в stub'е. **Для Epic 4:** если добавляется новая `/v2/*` view — Step 1 = stub factory + registerScene с empty Scene + activateScene. Не откладывать на Step 2.

3. **Module-scoped reactive singleton требует explicit reset point.** Vue не reset'ит module-level reactive'ы на re-mount. Прототип-эквивалент (в нашем случае `openCreate` 9266-9269) — паттерн обязательный. **Preferred location** — `onMounted` first line. **Для Epic 4:** `useCreatedFighter`, `useMatchResult`, любые other cross-view state'ы — всегда с reset hook'ом.

4. **Linear easing для materialize / navigation transitions** — не эстетизировать без причины. Прототип 9242 линейный (`0.35 + 0.65 * t`); добавлять ease-in-out без явного design requirement — отклонение без выгоды. **Для Epic 4:** если прототип использует linear, v2 оставляет linear. Tweening curves — только если явно в ТЗ.

5. **Cancel handle + teardown first line** — паттерн 3Bb → 3Bc переносится 1-в-1. Любая rAF/setTimeout-based animation возвращает `{ cancel() }`, orchestrator view сохраняет handle, `onBeforeUnmount` **первой строкой** вызывает cancel. Late callback'и не должны trigger'ить navigation/mutation после disposal. **Для Epic 4:** все backend API calls с optimistic UI — cancelable через AbortController с тем же паттерном.

6. **Prop-drilling Вариант A > module-scoped API setter.** `HudCreate ← getHoloFighter/getFlashEl + emit('materialize-start', handle)` — симметрично 3Bb, Vue idiomatic, unit-testable HUD. Module-scoped composable как API setter (Вариант B) — extra module state без выгод для testing. **Для Epic 4:** при новых HUD↔Scene wiring'ах — начинать с Variant A, переходить на B только если appears truly shared state между 3+ components.

7. **CLAUDE.md в project knowledge — recurring risk.** Пользователь обновляет вручную через Project settings → Knowledge. Источник правды для нового чата = handoff + код на диске, **не** project_knowledge_search. **Для Epic 4:** handoff §2 «Что прочитать» должен явно список файлов с диска + explicit note «project knowledge может быть stale — если расходится с диском, источник правды = диск».

8. **Split финала на 3 коммита с первого раза** — прецедент 3Bb stream timeout убедил. В 3Bc применили preemptive: 13.1 CLAUDE.md, 13.2 FINAL_REPORT (этот коммит), 13.3 HANDOFF Epic 4. 0 timeout'ов, ни одного не потребовался monolithic Write. **Для Epic 4:** каждый финал — split на 3 + микро-Edit'ы ≤50 строк внутри каждого документа.

---

## Эпик 3B — CLOSED

Все 3 sub-эпика + FD cleanup завершены. Route таблица `/v2`:

| Route | Sub-эпик | Commit range | Статус |
|-------|----------|--------------|--------|
| `/v2` | Эпик 2 (hub) | — | ✅ работает |
| `/v2/fd/:key` | Эпик 3A (Fighter Detail) | EPIC3A range | ✅ без FIGHT-кнопки (Step 11 3Bc) |
| `/v2/fight` | Эпик 3A + 3Bb integration | EPIC3A + 3Bb useFightSetup | ✅ через Matchmaking only |
| `/v2/training` | **3Ba — Training** | Epic 3Ba commits | ✅ heavy bag + physics + combo + sound |
| `/v2/matchmaking` | **3Bb — Matchmaking** | Epic 3Bb commits | ✅ CRT typeLog + candidates grid + Start Fight |
| `/v2/create` | **3Bc — Create Fighter** | Epic 3Bc commits | ✅ archetype → name → confirm → materialize |

**Единственный путь в Fight:** hub → terminal click → `/v2/matchmaking` → typeLog → select candidate → Start Fight → `/v2/fight`. Никаких alternative entries.

**Epic 3A deferred закрыто:**
- ~~FD FIGHT-кнопка как короткий путь в Fight (temporary)~~ — удалено в Step 11 3Bc.
- ~~`.fd-resources right: 150px`~~ — восстановлено `right: 14px` прототип-parity.

**Следующий эпик:** **Epic 4 — Backend Integration.** План в `docs/visual-migration/HANDOFF_EPIC4_CHAT_HANDOFF.md`. Цели:
- Matchmaking → real API (replace `mmCandidatesMock`).
- Create → backend persistence + `/v2/fd/:newFighterId` navigation.
- 4 недостающих 3D fighter variants (analyst/ghost/sentinel/maverick/juggernaut) через `setVariant` DI extension point.
- Real captain data в hub + Club Mode 1-6 agents вокруг ринга.

---

**Конец отчёта.**
