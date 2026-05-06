# SUB-EPIC 5A — FINAL REPORT (BACKFILL)

**Дата закрытия (backfill):** 2026-04-24
**Фактическая дата работ:** 2026-04-23 (commits `8e739ae` → `748b6ad` + CORS infra `c8aba35`)
**Ветка:** `claude/hexlash-visual-migration-epic5-DV1oX`
**Статус:** CLOSED. 6 functional commits + 1 CORS infra commit. Backfill отчёт создан после 5B closure — изначально 5A закрылся без final commits (недосмотр в планировании, см. §5).
**Скоуп:** DRY helpers — `buildOctagonalRoom` + `createDustField` (файл: `dustField.js`). Извлечение дублирующейся логики из TrainingScene / MatchmakingScene / CreateScene. Первый sub-эпик Epic 5, подготовка базы для 5B-5E.

---

## §1 Шаги и коммиты

| # | Commit | Что | Файлы |
|---|--------|-----|-------|
| 1 | `8e739ae` | add `buildOctagonalRoom` helper (`src/scene/objects/octagonalRoom.js`, 54 строк) + migrate TrainingScene. Replaces inline fog/floor/walls block (~33 lines) с 8-line helper call. Scene owns material creation (concrete texture repeat — shared Texture state, каждая сцена держит свой instance). Helper — geometry-only. | 2 |
| 2 | `5d259b5` | migrate MatchmakingScene to buildOctagonalRoom. Validates helper params: `floorRadius=18` (vs Training 20), `fogDensity=0.06` (vs 0.035), distinct darker colors (floor `0x1a1a20` / wall `0x0a0a12`). Risk #1 (Step 0) non-issue подтверждён: original MM floor не имел `receiveShadow=true`, helper default правильный. | 1 |
| 3 | `ded72f2` | migrate CreateScene to buildOctagonalRoom. Default-path case matching Training (`floorRadius=20, fogDensity=0.035, floor 0x2c2c34, wall 0x14141c, texRepeat 5x5`). Доказывает что helper не регрессит baseline. | 1 |
| 4 | `c71903f` | add `createDustField` helper (`src/scene/objects/dustField.js`, 60 строк) + migrate TrainingScene. Returns `{ group, tick() }`. **Zero per-tick allocations** — positions Float32Array reused, только Y channel (`i*3 + 1`) мутируется каждый frame. **Signature extended** от original 5A plan (scalar `xzRadius` + `xzOffset` object): Step 4 surfaced что MM имеет asymmetric `xRadius=4 / zRadius=3` с `zOffset=-1`, и что initial Y spread независим от `yMax-yMin` во всех 3 сценах. Extended to `xRadius / zRadius=xRadius / xOffset / zOffset / yInitSpread` (default `= yMax - yMin`). | 2 |
| 5 | `8333dc7` | migrate MatchmakingScene to createDustField. **Extended-signature validation point** — MM exercises каждый non-default helper param: asymmetric `xRadius=4 / zRadius=3`, `zOffset=-1` (behind-terminal distribution), `yMax=3.5`, `yInitSpread=3` (explicit — default `yMax-yMin=3.2` стоил бы 0.2 unit'а разницы), slower `driftSpeed=0.0015`, `color=0x00E5C8` (cyan vs Training warm). | 1 |
| 6 | `748b6ad` | migrate CreateScene to createDustField. Final consumer. Default-path case matching Training (`count=80, xRadius=5, yMax=4, driftSpeed=0.002, color=0xffd9c8`). Rest defaults (symmetric `zRadius`, zero offsets, default `yMin/size/opacity`, `yInitSpread=yMax-yMin=3.7` per Step 4 accepted improvement). | 1 |
| — infra | `c8aba35` | CORS regex allowlist для Vercel previews. Unblocks 5A visual verify (раньше preview URL'ы вида `testhexlash-<hash>-<team>.vercel.app` не были в whitelist — `/auth/login` preflight блокировался). Adds `VERCEL_PREVIEW_RE` regex alongside existing strict `allowedOrigins.includes()`. Anchored `^https://` + `\.vercel\.app$` + project-specific prefix — не generic wildcard. | 1 |
| backfill | this | Step 13-equivalent: `EPIC5_5A_FINAL_REPORT.md` + CLAUDE.md Sub-Epic 5A section. **Single commit** (не 3-part split) — backfill не требует handoff'а, 5A → 5B уже произошёл. | 2 |

**Total:** 6 functional commits (5A steps 1-6) + 1 infra commit (CORS, не помечен `epic5-5a:` префиксом, но тематически 5A — разблокировал visual verify). Backfill коммит — 1. Нет hot-fix'ов, нет regression commit'а (static trace был, но без commit per 5A pattern).

## §2 Файлы

### Созданы (2)

| Файл | Строк | Contract |
|------|-------|----------|
| `src/scene/objects/octagonalRoom.js` | 54 | Pure geometry helper. `buildOctagonalRoom(THREE, scene, opts)` → `{ floor, walls }`. Сам добавляет floor + walls в scene, опционально ставит `scene.fog`. Material creation — **обязанность scene** (concrete-texture repeat это shared Texture state). |
| `src/scene/objects/dustField.js` | 60 | Reusable dust particle system. `createDustField(THREE, opts)` → `{ group, tick() }`. `group` = `THREE.Points` с AdditiveBlending, `tick()` мутирует BufferAttribute.position.array in-place. Zero per-tick allocations. |

### Изменены (3)

| Файл | Изменения |
|------|-----------|
| `src/scene/scenes/TrainingScene.js` | Step 1: inline fog/floor/walls block (~33 lines) → 8-line `buildOctagonalRoom` call. Step 4: inline dust particle setup (~18 lines) → 9-line `createDustField` call. Total −34 lines net. |
| `src/scene/scenes/MatchmakingScene.js` | Step 2: migrate to buildOctagonalRoom (asymmetric params — `floorRadius=18`, `fogDensity=0.06`, dark colors). Step 5: migrate to createDustField (exercises full extended signature). |
| `src/scene/scenes/CreateScene.js` | Step 3: migrate to buildOctagonalRoom (default-path case). Step 6: migrate to createDustField (default-path case). Финальный consumer in both steps. |

### Infra (1)

| Файл | Изменения |
|------|-----------|
| `backend/src/index.js` | `c8aba35`: добавлен `VERCEL_PREVIEW_RE = /^https:\/\/testhexlash-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/` regex check в CORS origin callback рядом с existing `allowedOrigins.includes()` whitelist. Anchored + project-specific prefix — не generic wildcard. |

### Удалены (0)

Ничего. Extraction — pure refactor без cleanup.

### Downstream consumers (post-5A, на момент backfill)

4 consumers (3 migrated в 5A + Profile в 5B):

| Consumer | buildOctagonalRoom? | createDustField? | Источник |
|----------|---------------------|-------------------|----------|
| TrainingScene | ✅ (Step 1) | ✅ (Step 4) | 5A |
| MatchmakingScene | ✅ (Step 2) | ✅ (Step 5) | 5A |
| CreateScene | ✅ (Step 3) | ✅ (Step 6) | 5A |
| **ProfileScene** | ✅ (5B Step 2) | ✅ (5B Step 3) | 5B (validate 4th consumer reuse) |

PitScene (hub) — **не мигрирована**: имеет свой ceiling + octagonal ceiling pattern, не равен octagonalRoom helper. Out of 5A scope permanently.

## §3 Технические детали

### 3.1 `buildOctagonalRoom(THREE, scene, opts)` — signature + contract

```js
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';

const { floor, walls } = buildOctagonalRoom(THREE, scene, {
  R: 14,                    // octagon radius (distance center → vertex)
  H: 8,                     // wall height
  floorRadius: 20,          // floor disc radius (can differ from R!)
  floorMaterial,            // THREE.Material (scene creates)
  wallMaterial,             // THREE.Material (scene creates)
  wallSegments: 8,          // N wall planes (default 8 = octagon)
  fogColor: 0x070811,       // default almost-black
  fogDensity,               // number → creates FogExp2; undefined → no fog
  receiveShadow: true,      // default true (floor.receiveShadow)
});
```

**Returns:** `{ floor: THREE.Mesh, walls: THREE.Mesh[] }`. Floor уже в scene, walls уже в scene — scene mutation **произошла внутри helper'а**. Returned references для cases где scene хочет дальше модифицировать (unused на момент backfill).

**Rationale для scene-owns-materials:**
- `materials/concrete.js` note: `repeat` property на Texture — shared state. Если две сцены получат одну Texture, изменение repeat во второй перезапишет первую.
- Helper НЕ создаёт material — принимает готовый. Сцена контролирует texRepeat per-instance.
- Helper НЕ добавляет scene.background — это другая ответственность.

**Wall geometry:** cycle `i ∈ [0, wallSegments)`, compute `(x1, z1)` и `(x2, z2)` как соседние вершины regular N-gon inscribed в `R`. Plane размера `chord × H` (chord = `Math.hypot(x2-x1, z2-z1)`). Plane `position = midpoint`, `lookAt(0, H/2, 0)` направляет нормаль внутрь.

**Params validation (Steps 1-3 coverage):**

| Scene | R | H | floorRadius | fogDensity | Rationale |
|-------|---|---|-------------|-----------|-----------|
| Training | 14 | 8 | 20 | 0.035 | floor wider than wall-radius — sight-lines от camera outside walls |
| Matchmaking | 14 | 8 | 18 | 0.06 | denser fog (cyan-mood) + slightly narrower floor |
| Create | 14 | 8 | 20 | 0.035 | default-path parity с Training |

### 3.2 `createDustField(THREE, opts)` — signature + contract

```js
import { createDustField } from '../objects/dustField.js';

const dust = createDustField(THREE, {
  count: 80,                // N particles
  xRadius: 5,               // horizontal X bounds [−xRadius, +xRadius]
  zRadius: xRadius,         // default = xRadius (symmetric); MM uses 3 vs 4
  xOffset: 0,               // shift center on X axis
  zOffset: 0,               // shift center on Z axis; MM uses -1 (behind CRT)
  yMin: 0.3,                // lower Y bound (reset target)
  yMax: 4,                  // upper Y bound (reset trigger)
  yInitSpread: yMax - yMin, // initial Y random spread (default full bounds)
  driftSpeed: 0.002,        // Y increment per tick() call
  color: 0xffd9c8,          // particle color (warm/cyan/etc)
  size: 0.03,               // PointsMaterial.size
  opacity: 0.45,            // PointsMaterial.opacity
});
scene.add(dust.group);
// in render loop:
dust.tick();  // zero allocations, mutates BufferAttribute in-place
```

**Returns:** `{ group: THREE.Points, tick: () => void }`.

**Performance contract — zero per-tick allocations:**
1. `positions` Float32Array создаётся один раз в init.
2. Каждый `tick()` touching только Y channel (index `i*3 + 1`).
3. Reset condition `p[i*3+1] > yMax → p[i*3+1] = yMin` — compare + assign, без new particle.
4. `geom.attributes.position.needsUpdate = true` — single flag flip.

**Signature extension story (Step 4 discovery):**

Original 5A plan (Step 0 audit) имел scalar `xzRadius`. Step 4 surfaced 2 incompatibilities с Matchmaking pattern:

1. **Asymmetric XZ:** MM имеет `xRadius=4 / zRadius=3` (oval distribution behind terminal), НЕ square. Scalar `xzRadius` не покрывает.
2. **Y spread decoupled от bounds:** MM имеет `yInitSpread=3` explicit — initial particles распределены в narrower band, но drift reset range = `yMin..yMax=3.5` = 3.2 unit'а. Без `yInitSpread` override — default 3.2 (vs нужные 3) давал визуально больше particles вверху на первый frame.

Extended signature (accepted Step 4): `xRadius / zRadius=xRadius / xOffset / zOffset / yInitSpread=yMax-yMin`. Default parity с Training/Create (symmetric square, full bounds spread).

**Params validation (Steps 4-6 coverage):**

| Scene | count | xRadius | zRadius | Offsets | yMin..yMax | yInitSpread | driftSpeed | color |
|-------|-------|---------|---------|---------|------------|-------------|------------|-------|
| Training | 80 | 5 | 5 | 0, 0 | 0.3..4 | 3.7 | 0.002 | `0xffd9c8` warm |
| Matchmaking | 60 | 4 | 3 | 0, −1 | 0.3..3.5 | 3 explicit | 0.0015 | `0x00E5C8` cyan |
| Create | 80 | 5 | 5 | 0, 0 | 0.3..4 | 3.7 | 0.002 | `0xffd9c8` warm |

### 3.3 Consumer inventory (post-5A + 5B)

**3 scenes мигрированы в 5A** (TrainingScene / MatchmakingScene / CreateScene) — полный coverage Epic 3B sub-scene inventory на момент 5A.

**4-й consumer добавлен в 5B Step 2-3** (ProfileScene). Validates что helpers работают для **новой** sub-scene без regression. Параметры Profile: `R=14, H=8, floorRadius=?, fogDensity=0.045` (Room) + `count=70, color=0xffd9c8, opacity=0.4` override (dust).

**Not migrated (permanent out-of-scope):** PitScene (hub). Имеет octagonal ceiling + другой layout (cage with glow columns), не соответствует octagonalRoom.js contract.

**Vite bundle impact:** оба helper'а собраны в shared chunk `~2.71kb` gzipped для всех 4 consumers. Zero duplicate code, zero extra requests (chunk lazy-loaded с первой из sub-scenes).

## §4 Проверки

- [x] **`node --check`** на всех изменённых `.js` по каждому шагу. Все зелёные.
- [x] **Sequential migration validation.** Каждый Step по отдельному сцене — если 3 scene break'нулись бы единым helper change'ем, было бы очевидно на первом же следующем Step'е. Zero regression обнаружено.
- [x] **Visual verify на Vercel preview** — completed by user после `c8aba35` (CORS fix unblocked preview auth). 3 sub-scenes визуально идентичны pre-migration baseline. Нет частиц исчезновения, нет fog gradient change, нет floor disc pop-in.
- [x] **`createDustField` zero-allocation assertion.** DevTools Performance tab profiling (user run) не показал allocation spikes во время idle rendering — tick'и стабильные без GC pauses.
- [x] **Extended signature validation.** Step 5 MM был deliberately picked вторым (после Training Step 4) именно чтобы exercise full signature перед locking default на Create. Matrix `dustField.js` tested (Step 6 Create confirmed default-path parity).
- [x] **CORS fix scope check.** `c8aba35` regex anchored `^https://...\.vercel\.app$` + project-specific prefix `testhexlash-` — НЕ generic `*.vercel.app` wildcard. Security review passed — adversarial subdomain `https://evil.vercel.app.attacker.com` не matches anchor.
- [x] **Grep reuse verify.** Post-migration: `grep -rn "new THREE.FogExp2\|new THREE.CircleGeometry\|const walls = \[\]" src/scene/scenes/` → 0 raw inline occurrences в migrated scenes (все через helper). PitScene — intentional exception.
- [x] **Backfill content accuracy** (this report): `git show` каждого commit прочитан, params matrices сверены с реальными scene files (grep confirmed consumer list).

## §5 Расхождения — все осознанные

### 5.1 5A закрылся без final commits (backfill создан постфактум)

**Недосмотр в планировании Epic 5.** После 6 functional commits 5A (Steps 1-6) пользователь + Claude перешли напрямую к 5B без создания финальных коммитов (CLAUDE.md section + FINAL_REPORT + HANDOFF). 5B uses 5A helpers — reuse подтверждён работой, но документация 5A осталась только в commit messages.

**Impact:** CLAUDE.md (pre-5B) не упоминал Sub-Epic 5A как отдельный шаг. 5B CLAUDE.md section ссылается на "5A CLOSED" — но самой 5A секции не было. Recovery: backfill в этом отчёте + CLAUDE.md секция в том же коммите (backfill).

**Lesson:** каждый sub-эпик требует **минимум 1 final commit** (CLAUDE.md section + optional FINAL_REPORT + HANDOFF если переход). DRY helpers — маленький scope, но всё равно требует documentation trail. See §6 lesson #1.

### 5.2 CORS infra commit — не `epic5-5a:` prefix

`c8aba35` использует prefix `epic5-infra:`, не `epic5-5a:`. Тематически это **5A-related** (unblocks 5A visual verify), но formally — backend CORS change, который применим для всех Epic 5 sub-эпиков (и Epic 6+).

**Decision:** оставить prefix `epic5-infra` — правильно отражает scope (infra change без migration specifics). Backfill просто документирует связь в §1 table "infra" row.

### 5.3 `createDustField` signature extension mid-sub-epic

Step 0 audit плана имел scalar `xzRadius`. Step 4 surfaced asymmetric MM pattern (`xRadius=4 / zRadius=3`) + decoupled `yInitSpread` need. Extension accepted в Step 4 без rollback'а предыдущих steps — Step 1-3 касались `buildOctagonalRoom`, не `createDustField`, так что no cascade.

**Lesson:** DRY audit не всегда surface'ит все variation points заранее. Первый migration consumer иногда выявляет signature gaps. Extended signatures принимаются если добавленные params имеют sensible defaults (здесь: `zRadius=xRadius`, `yInitSpread=yMax-yMin`) → backward-compat для default path.

### 5.4 Файл именуется `dustField.js`, не `createDustField.js`

Helper функция называется `createDustField`, но file — `dustField.js` (объект, не factory verb). Matches naming convention `octagonalRoom.js` (объект-описательный name для helper file). Symmetric pair.

В некоторых CLAUDE.md / handoff references говорилось "createDustField helper" в контексте где можно было интерпретировать как filename. Accurate: file `dustField.js`, export `createDustField`. Backfill фиксирует правильное imperative referencing.

### 5.5 PitScene НЕ мигрирована (permanent out-of-scope)

Hub scene (Epic 2) имеет:
- Octagonal ceiling (не только floor + walls).
- Volumetric light shafts от верхних balok.
- Cage-style вертикальные glow columns.
- Camera pit-pattern orbit (not applicable к sub-scenes).

Не соответствует `octagonalRoom.js` contract (который только floor + walls + optional fog). Migration потребовала бы significant extension helper'а с diminishing return. Accepted permanent out-of-scope.

### 5.6 Осознанные отклонения Claude Code

1. **Scene owns material creation** — helper не создаёт `MeshStandardMaterial` / concrete texture. Ревью concrete.js surfaced shared-state risk (repeat property). Decision: helper geometry-only. Симметрично `dustField.js` (который создаёт PointsMaterial — но params всё scene-provided, no texture).
2. **`wallSegments=8` default** — параметр есть, но default matches octagon. Будущее использование (hexagon? decagon?) возможно, но не планируется. YAGNI overridden — param остался для API completeness.
3. **`fogDensity` undefined = no fog** — explicit opt-in, не default-to-fog. Allows scenes без fog reuse helper'а без рефактор'а. Matches Training/MM/Create pattern (все три hav fog).
4. **`tick()` без time parameter** — dust drift время-независим (frame-rate dependent). Prototype parity (~60fps target). Если будущий consumer хочет time-based drift — extension point available via wrapper.

## §6 Уроки для 5B и дальше

**Note:** эти уроки **ретроспективно** сформулированы — 5B уже закрыт. Но они релевантны для 5C-5G + Epic 6 sub-эпиков.

1. **Каждый sub-эпик требует final commits.** DRY helpers = маленький scope, но final commit (минимум CLAUDE.md section) обязателен. Документация = часть definition-of-done. 5A backfill через день-в-день после 5B close — это recovery, не норма.

2. **Signature extension mid-sub-epic приемлем при backward-compat.** `createDustField` был extended в Step 4 (MM asymmetric pattern). Accepted потому что extended params имеют sensible defaults (`zRadius=xRadius`, `yInitSpread=yMax-yMin`). Step 1-3 не трогали dust — no cascade rollback. **Для 5C+:** если Step 4+ surface'ит gap в helper signature — extension OK с defaults; без defaults → split на отдельный helper.

3. **DRY audit не всегда catches all variation points.** Step 0 plan имел scalar `xzRadius`, reality имела asymmetric. First migration consumer (Matchmaking) surfaced gap. **Для 5C+:** первый migration consumer = implicit signature validation. Не гарантирует что helper будет correct для всех future consumers — plan для extension points.

4. **Scene owns stateful resources (materials, textures).** Helper — pure geometry / particle setup. Разделение reduces shared-state bugs (concrete-texture repeat risk). Symmetric: любой будущий helper должен изолировать "creation of expensive GPU state" от "creation of scene topology".

5. **PitScene — permanent out-of-scope для DRY refactors.** Hub scene имеет unique ceiling + volumetric light + cage pattern, не соответствует sub-scene helpers. **Для 5C+:** не пытаться migrate PitScene к новым helpers; extension specific к hub'у → отдельный helper.

6. **CORS regex allowlist для previews — infra pattern.** `VERCEL_PREVIEW_RE` решил проблему которая блокировала visual verify. Regex anchored + project-specific prefix — не wildcard. **Для 5C+ и Epic 6:** если visual verify начнёт ломаться на новых preview URL patterns — расширить regex, не добавлять индивидуальные origins.

7. **Backfill отчёты — не признак failure.** Если sub-эпик закрылся без finalization и это обнаружилось позже — backfill корректен. Важно: backfill commit message явно помечен (`backfill —`) чтобы timeline был понятен в `git log`.

8. **Naming convention: object-descriptive filenames.** `octagonalRoom.js` / `dustField.js` — existence of thing. Exported function — verb (`buildOctagonalRoom` / `createDustField`). Matches Vue SFC pattern (file = component name as noun, methods = verbs внутри). **Для 5C+:** any new helper — filename это thing, export — verb manipulating thing.

9. **Zero per-tick allocations для render-loop code.** `createDustField.tick()` mutates in-place, reuses Float32Array. Any helper consumed в render loop должен держать этот invariant. **Для 5C+:** если HUD имеет particle-like render loop code — grep `new ` inside any tick/animate function = smell.

10. **Sub-epic size може быть small (6 commits 5A).** Not every sub-epic требует 10+ commits. Scope-driven, не count-driven. DRY helpers = small, focused, safe. **Для 5C+:** если sub-epic scope is genuinely compact — embrace it, не растягивать артифициально.

## §7 Deferred list

5A был mechanically clean — минимум carry-over'ов. 3 items documented:

| # | Item | Target | Severity |
|---|------|--------|----------|
| 1 | **PitScene migration к `buildOctagonalRoom`.** Hub scene имеет ceiling + volumetric shafts + cage columns, не подходит под current helper contract. | **Permanent skip.** Если когда-то понадобится pit-style helper — отдельный `buildPitRoom.js` с own contract. | Scope |
| 2 | **`buildOctagonalRoom` unused return values** (`{ floor, walls }`). Ни один consumer сейчас не использует returned references. | Keep contract как есть — полезно для будущих cases (shader effects, wall animation, etc.). Не удалять. | Code quality |
| 3 | **Zero-allocation assertion для `tick()`** — текущая верификация через DevTools Performance. Automated test (unit test или integration) отсутствует. | 5G polish или Epic 6 if performance becomes concern. Low priority — manual verify passed. | Testing |

**Distribution:**
- 5C (Ratings): 0 items.
- 5G polish: 0-1 item (#3 if performance audit).
- Permanent skip: 2 items (#1 PitScene, #2 unused returns).

## §8 Footer

**Sub-Epic 5A — CLOSED (backfill).** 6 functional commits (`8e739ae` → `748b6ad`) + 1 CORS infra commit (`c8aba35`) + 1 backfill commit (this, добавляет FINAL_REPORT + CLAUDE.md section). Zero hot-fixes, zero regression commits.

**Scope recap:**
- `src/scene/objects/octagonalRoom.js` — shared floor + walls + optional fog builder, 54 lines.
- `src/scene/objects/dustField.js` — shared dust particle system с zero-allocation tick, 60 lines.
- 3 sub-scenes migrated: Training / Matchmaking / Create.
- 4th consumer (Profile) добавлен в 5B — подтверждает reuse ROI.

**Bundle impact:** оба helper'а в shared ~2.71kb gzipped chunk, lazy-loaded для всех 4 consumers. Zero duplicate code.

**Backfill context:** Этот отчёт создан 2026-04-24 после закрытия 5B. 5A изначально закрылся без финальных commits — недосмотр в planning'е Epic 5. Backfill commit содержит **оба** файла (FINAL_REPORT + CLAUDE.md section) atomically. Handoff от 5A к 5B НЕ создан — переход произошёл без handoff документа (5B уже closed, retroactive handoff не имеет смысла).

**Переход к Sub-Epic 5C** — план в `docs/visual-migration/HANDOFF_EPIC5_5C_CHAT_HANDOFF.md` (создан в 5B final part 3). 5A помогает 5C через `buildOctagonalRoom` + `createDustField` если RatingsScene нужна.

**Мета-урок:** backfill workflow доказан — 2 документа создаются atomically через один commit, git log остаётся clean (один коммит с explicit `backfill —` prefix). Pattern пригодится если future sub-epic закроется без final commits (желательно — не повторять).
