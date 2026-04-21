# EPIC 3Ba — FINAL REPORT

**Дата закрытия:** 2026-04-21
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Функционально подтверждён пользователем на Vercel preview.
**Скоуп:** Первый sub-эпик 3B — Training sub-scene. Heavy bag в hub → `/v2/training`.

---

## Шаги и коммиты

| # | Что сделано | Коммит |
|---|-------------|--------|
| 1 | Stubs (9 новых файлов) + route `/v2/training` + redirect heavy bag click | `13894f6` |
| 2 | TrainingScene scaffold (fog, camera, floor, walls) + `unregisterScene` API в sceneRegistry | `7aea6b1` |
| 3 | Lighting (5 источников) + volumetric shaft + 80 dust particles | `6c4f4b3` |
| 4 | Heavy bag mesh (trainingBag.js) — 6-chain + body + hemispheres + straps | `4e2ffe1` |
| 5 | Bag physics (trainingBagPhysics.js) — 2-axis spring+damping pendulum | `b38ca7a` |
| 6 | HudTraining + trState composable + training.css (13 HUD классов) | `aa3ae6c` |
| 7a | Click-to-hit raycaster + impulse + energy | `be58000` |
| 7b | Combo + tasks + tap-pop + hit particles | `d3a0361` |
| 8 | — | closed empty (merged into 7b) |
| 9 | Procedural hit sound (useHitSound.js) | `e7d019a` |
| 10 | — | regression test passed, no commit |
| 11 | CLAUDE.md update + handoff 3Bb + final report | this commit |

**Всего:** 10 коммитов ТЗ-шагов + Step 10 no-commit + Step 8 closed-empty + финальный = **10 функциональных коммитов** (Step 8 пропущен формально, прецедент Epic 3A Step 17).

---

## Файлы

### Созданы (10)

**Scene layer:**
- `src/scene/scenes/TrainingScene.js` (210 строк) — fog + camera + floor + walls + lighting + shaft + dust + bag + physics + hitParticles + tick composition.

**Objects:**
- `src/scene/objects/trainingBag.js` (72) — большой центральный мешок с 6-звенной цепью, body cylinder, top/bot hemispheres, 2 straps.
- `src/scene/objects/trainingBagPhysics.js` (42) — `createBagPhysics(bagGroup)` → `{ applyTick, applyImpulse, _state }`.
- `src/scene/objects/trainingHitParticles.js` (59) — `createHitParticles(scene, THREE)` → `{ spawn, tick, dispose }`. 6 sparks per hit.

**Interaction:**
- `src/scene/interaction/useTrainingState.js` (71) — reactive `trState` + `resetTrainingState` + `startTrainingSession` + `multiplierForCombo`.
- `src/scene/interaction/useClickToHit.js` (115) — `attachClickToHit(THREE, camera, bag, applyImpulse, onEnergyEmpty, spawnHitParticles)` → `{ detach }`.
- `src/scene/interaction/useHitSound.js` (69) — lazy `AudioContext` + `playHitSound(multiplier)`.

**Views + HUD:**
- `src/views-v2/TrainingView.vue` (129) — orchestrate: buildScene + register + activate + startSession + click-to-hit + Esc/Back + resize.
- `src/components/hud/HudTraining.vue` (95) — back + counter + energy + 2 tasks + combo + hint. Без scoped CSS (использует общий `training.css`).

**Styles:**
- `src/styles/v24/training.css` (254) — 13 HUD-классов (back, counter, tc-*, energy, te-*, tasks, tt-*, task-*, combo, tc-combo-*, hint) + `.tap-pop` + `@keyframes tapPopAnim`. Scoped под `.app-v2`.

### Изменены (5)

- `src/router/index.js` — добавлен `V2Training` (`/v2/training`) в `v2Routes.children`.
- `src/views-v2/PitViewV2.vue` — watcher: `if (click.id === 'training') router.push('/v2/training')`.
- `src/components/hud/HudPit.vue` — MODAL_CONTENT.training убран (9 → 8 ключей).
- `src/scene/sceneRegistry.js` — добавлена `unregisterScene(id)` (lazy sub-scenes 3Ba/3Bb/3Bc требуют).
- `src/styles/hexlash-v24.css` — `@import './v24/training.css'`.

---

## Технические детали

### Scene параметры

- Fog: `FogExp2(0x070811, 0.035)`.
- Camera: `PerspectiveCamera(40°, aspect, 0.1, 200)` pos `(2.5, 2.0, 5.5)` lookAt `(0, 1.7, 0)`.
- Room: 8 octagonal walls, `TR_ROOM_R = 14`, `TR_ROOM_H = 8`, wall color `0x14141c`.
- Floor: `CircleGeometry(20, 64)`, concrete repeat 5×5, color `0x2c2c34`.
- Lighting: Ambient `0x1a1a28, 0.45` + Hemi `0x2a2638/0x0a0a12, 0.4` + Key SpotLight `(0xfff0e8, 2.6, 14, π·0.22, 0.55, 1.4)` at `(0, 7.5, 0)` → `(0, 1.8, 0)` castShadow 1024² + RimL `0xff066f, 0.7` at `(-6, 3, 1)` + RimR `0x4dd9ff, 0.4` at `(6, 3, 1)`.
- Shaft: `ConeGeometry(1.5, 7, 24, 1, true)`, `MeshBasicMaterial opacity 0.05 AdditiveBlending DoubleSide depthWrite:false`, pos `(0, 3.5, 0)`.
- Dust: 80 points, X/Z `(rand-0.5)·10`, Y `rand·4+0.3`, color `0xffd9c8, size 0.03, opacity 0.45`. Drift `+= 0.002`, reset при `y > 4` на `0.3`. **Отличается** от pit dust (22×22, cool palette).

### Physics

- `createBagPhysics(bag)`: 2-axis state `{angX, angZ, velX, velZ}`, `damping 0.94`, `spring 0.06`.
- `applyTick`: spring force `vel += -ang·spring` → damping `vel *= 0.94` → integrate `ang += vel` → `bagGroup.rotation.x/z = ang`.
- `applyImpulse(localDir)`: `velZ += localDir.z · 0.025`, `velX -= localDir.x · 0.025` (минус на X — прототип-parity). Randomness `±0.005`.

### Combo + tasks

- Combo window 700мс (prev hit), expire 800мс после последнего.
- Multiplier thresholds: ×2@5, ×3@12, ×5@25.
- Tasks: `taskHitsGoal 100`, `taskCombosGoal 5` (учитываются combos с multiplier ≥ 3). Rewards — visual only (Epic 4).

### Hit particles

- 6 additive spheres, `SphereGeometry(0.04, 8, 6)`, `AdditiveBlending`.
- Velocity `(rand-0.5)·0.05, rand·0.04, (rand-0.5)·0.05`.
- Life decay 0.04 per tick, opacity = `max(0, life)`, dispose geometry+material at `life ≤ 0`.

### Sound

- Lazy `AudioContext` (`window.AudioContext || webkitAudioContext`), shared с `audioState.ctx` если доступен (Epic 5 lane).
- Noise burst ~120мс → BiquadFilter lowpass (`freq = 1200 + multiplier·250 Hz, Q 1.5`) → Gain envelope (0.5 → exp ramp 0.001 за 120мс) → `ctx.destination`.
- `src.start(t); src.stop(t + 0.13)`.

### Tick composition (в порядке)

1. Energy regen (dt-based, gated на `trState.active`).
2. Combo timeout (reset multiplier/count/visible).
3. HUD elapsed sync throttled 100мс (~10Hz).
4. Dust drift.
5. `bagPhysics.applyTick()`.
6. `hitParticles.tick()`.

### HUD↔Scene bridge

- `trState` module-scoped reactive store — паттерн `useFightSimulation` из Epic 3A.
- View импортирует `startTrainingSession`/`resetTrainingState` и вызывает на mount/unmount.
- HUD биндит `trState.*` через v-bind, click-to-hit мутирует.
- Scene читает `trState.active/energy/multiplier/...` в tick.
- Canvas-singleton `useCanvasRef` (Epic 3A) — click-to-hit берёт canvas без prop-drilling.

---

## Проверки

- [x] `npm run build` зелёный на каждом из 10 шагов (+1 в финале).
- [x] Vercel preview зелёный после каждого коммита (подтверждено пользователем).
- [x] Drift test bag physics (импульсы через click) — мешок качается + return to rest через damping.
- [x] Drift test hit particles — 6 искорок на клик, исчезают через ~25 кадров, GC корректен.
- [x] Combo progression ×1 → ×2 → ×3 → ×5 — thresholds 5/12/25 работают.
- [x] Combo timeout через 800мс после последнего hit — сбрасывается, indicator скрывается.
- [x] Task progression: hit→100 = taskHitsDone (зелёный), combos×3+→5 = taskCombosDone (зелёный).
- [x] Tap-pop DOM: `+N` пролетает над точкой клика, crit (multiplier≥3) — pink + larger.
- [x] Energy regen 0.4/sec (42 → 60 за ~45 сек).
- [x] Energy=0 → red flash overlay, click ignored.
- [x] Procedural sound — короткий «бумк» на каждый клик, brighter с multiplier.
- [x] Browser autoplay policy — AudioContext создаётся на первом клике (user gesture), не на mount.
- [x] Regression hub (Step 10, 14 пунктов): heavy bag → `/v2/training`, остальные 5 интерактивов → PhModal, warden/predator → FD, avatar → PhModal, orbit camera, re-entry reset.

---

## Расхождения с ТЗ — все осознанные

Все зафиксированы в отчётах шагов, ничего не «молча чинилось».

### Микро-оптимизации / улучшения по инициативе Claude Code

1. **Pre-allocated `raycaster`, `pointer`, `localDir` в closure** `useClickToHit` (Step 7a). В прототипе `localDir = new THREE.Vector3()` создаётся каждый клик (9794). Оптимизация-отклонение без влияния на поведение, GC чище.
2. **`clickHandle.detach()` первой строкой onBeforeUnmount** TrainingView (Step 7a). Защита от late mousedown на disposed bag/applyImpulse через freed closures.
3. **`spawnTapPop` как module-level функция** (Step 7b). Чистая функция над DOM, closure не нужен.
4. **`hitParticles.dispose()` первой строкой в scene.dispose** (Step 7b). Particles в отдельном массиве, не покрываются `scene.traverse`.
5. **`_state` экспонирован в return `createBagPhysics`** (Step 5). Debug-only, не используется — на будущее.
6. **Constants вместо magic numbers** — `ENERGY_INITIAL/MAX/REGEN` (Step 6), `SPARKS_PER_HIT/LIFE_DECAY` (Step 7b), `COMBO_WINDOW_MS/COMBO_SHOW_MS/TAP_POP_LIFE_MS/CRIT_MULT_THRESHOLD` (Step 7b), `HUD_SYNC_INTERVAL_MS` (Step 7b). Паттерн Epic 2/3A.

### Прототип-parity (правило 0.3.4 выше буквы ТЗ)

1. **`ensureHitAudio` с двумя typeof-check'ами** (Step 9). ТЗ упомянул только mute check в `playHitSound`; прототип 9883-9886 также делает shared-context check в `ensureHitAudio`. Добавлены оба с `eslint-disable-next-line no-undef`, чтобы Epic 5 global audio infrastructure заработала без правок в этом файле.

### Отклонения без технической необходимости

1. **CSS `position: absolute → fixed`** на 13 HUD-классах (Step 6). Прототип использовал `absolute` внутри `.training-hud` (родитель с `inset:0`). У нас эквивалент работает, но унифицировано на `fixed` относительно `.app-v2`. Визуально идентично, пересмотреть в Epic 5 polish если вылезет баг с transform-owning parent.

### Формальные отклонения

1. **Step 8 closed-empty** (prototype-parity с Step 17 Epic 3A). Все требования Step 8 покрыты в Step 7b (hit particles), отдельный коммит не создавался.
2. **Step 10 no-commit** (regression test). Все 14 пунктов прошли статический аудит + пользовательскую визуальную верификацию. Код-изменений не потребовалось.

### Deferred (по ТЗ, не отклонение)

- **Touch events** (`touchstart`, прототип 9965-9969) — Epic 5 mobile.
- **Task rewards profile binding** — Epic 4.
- **Global audio infrastructure** (rumble + mute toggle + volume slider в Settings) — Epic 5.
- **HANDOFF_EPIC3B §5.4 incorrect Create holo-material** — описал как "emissive", прототип 8937-8945 использует только `transparent + opacity`. Фиксируется здесь как известное расхождение handoff vs код; применить при 3Bc.

---

## Уроки для Эпика 3Bb

1. **Статическая верификация — потолок Claude Code.** Browser access отсутствует. Step 10-подобные regression test'ы = код-ревью на соответствие контрактам + пользовательский визуальный прогон. Claude Code пишет "что проверено из кода", пользователь подтверждает "что работает визуально". Этот split корректен и эффективен.
2. **Константы вместо magic numbers — штатный паттерн.** В каждом шаге выносить все пороги/timings/multipliers в именованные const в начале модуля. Это вошло в привычку после Epic 3A, в 3Ba применено без исключений.
3. **Pre-allocated THREE.* в closure для hot-path** (raycaster, pointer, vectors в click-handler'ах). Микро-оптимизация, GC-friendly, паттерн Epic 3A (FighterDetailScene.js `_v = new THREE.Vector3()` для label tracking).
4. **Прототип-parity выше буквы ТЗ** (правило 0.3.4). Если ТЗ упрощает то, что в прототипе есть — делать по прототипу, отмечать в отчёте шага. Пример 3Ba Step 9 — второй typeof-check в ensureHitAudio.
5. **`hitParticles.dispose()` / array-backed particle systems** — первой строкой scene dispose, чтобы массив ссылок очистился и не держал disposed resources. Паттерн переносимо на любой sub-scene с particle-based эффектами.
6. **Module-level pure functions в composables** (`spawnTapPop`) если state не нужен. Не делать closure без причины.
7. **`unregisterScene` API** в `sceneRegistry.js` добавлена в Step 2, использована в 3Ba TrainingView. Готова к 3Bb Matchmaking и 3Bc Create — они также будут lazy регистрироваться/ремонтироваться на каждый mount.

---

**Конец отчёта.**
