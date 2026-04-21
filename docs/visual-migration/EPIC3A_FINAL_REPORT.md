# EPIC 3A — FINAL REPORT

**Дата закрытия:** 2026-04-21
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Функционально подтверждён пользователем на Vercel preview.

---

## Шаги и коммиты

| # | Шаг | Коммит |
|---|-----|--------|
| 1 | Stubs + роуты + перехват клика warden/predator | `554d92e` |
| 2 | FD scene scaffold (floor, walls, podium) | `3b2f4ce` |
| 3 | FD lighting, dust, light shaft | `7355bf2` |
| 4 | FD fighter on podium, idle sway, archetype glow | `bc0ab86` |
| 5 | FD branch columns (3 columns, pulse, floor discs) | `128518d` |
| 6 | FD drag-to-rotate camera | `6fc52f2` |
| 7 | FD raycaster, hover scale, click detection | `6405219` |
| 8a | FD HUD (topbar, resources, stats, branch labels) | `2d562ae` |
| 8b | BranchPanel component, real openBranchPanel wiring | `a292224` |
| 9 | Fight scene scaffold (ring platform, floor, walls) | `f9e3eab` |
| fix | renderer.toneMapping + exposure + 9 toneMapped:false (added too much) | `7886f41` |
| fix | revert toneMapped:false additions to prototype parity | `74b0872` |
| fix | bump toneMappingExposure 1.05 → 1.7 | `46d27f2` |
| fix | bump toneMappingExposure 1.7 → 2.3 | `f68606c` |
| fix | lighten pit floor color 0x2c2c34 → 0x4a4a56 | `80fa397` |
| fix | lighten pit floor color 0x4a4a56 → 0x6e6e7a | `989b29f` |
| 10 | Fight posts, ropes, lighting, shaft | `b891ff8` |
| 11 | Fight two fighters, idle, part snapshot | `adba238` |
| 12 | Fight animation system (6 types, tickAnims) | `d0ea51d` |
| 13 | Fight 3 camera modes (pit/side/cinema) | `0f94ec2` |
| 14 | Fight HUD (fight-top, cam-switcher, back, spectate) | `4e95458` |
| 15 | Fight log, flash hit (reactive infrastructure) | `a0a8915` |
| 16 | Fight simulation (prep → rounds → result) | `f4a2d93` |
| 17 | coach-pause — closed empty (реализовано в шаге 16) | — |
| fix | guard activateScene('pit') against mount race | `b1c4c30` |
| 18 | cleanup debug hooks + CLAUDE.md update | `a93f9ef` |

**Всего:** 18 шагов ТЗ (Step 17 closed empty, Step 8 split на 8a/8b) = **21 коммит** включая hot-fixes.

**Диапазон ветки visual-v2:** от `540b900` (epic2: final) до `a93f9ef` (epic3a: final) — 19 коммитов впереди (17 + 2 manual через GitHub UI отсутствуют в этом эпике — все коммиты Claude Code).

---

## Файлы

### Созданы

**Scene layer (3):**
- `src/scene/scenes/FighterDetailScene.js` — `buildFighterDetailScene(THREE, aspect)` возвращает `{ scene, camera, tick, clickableTargets, dispose, setKey, picker }`. 317 строк.
- `src/scene/scenes/FightScene.js` — `buildFightScene(THREE, aspect)` возвращает `{ scene, camera, tick, playMove, setCamMode, getState, resetFight, dispose, ftVerts }`. 364 строки после cleanup debug hooks.
- `src/scene/scenes/useFightSceneApi.js` — reactive composable (31 строка) для HUD ↔ Scene коммуникации: `fightSceneApi { setCamMode, playMove, getState, resetFight }` + `bindFightSceneApi` / `unbindFightSceneApi`.

**Interaction (4):**
- `src/scene/interaction/fdCameraController.js` — `attachFdOrbit(camera, canvas)` → `{ tick, detach, getIsDragging }`. Drag ±π/3 clamp, lerp 0.08, mouse-only. 75 строк.
- `src/scene/interaction/fdProjectToScreen.js` — `fdProjectToScreen(obj3d, addY, camera, THREE)` → `{ x, y, visible }` для tracking branch labels. 27 строк.
- `src/scene/interaction/useFdLabels.js` — reactive `fdLabels { speed, power, technique: { x, y, visible } }` + `updateFdLabel(id, pos)`. 23 строки.
- `src/scene/interaction/useCanvasRef.js` — module-scoped `setCanvasRef(el)` / `getCanvasRef()` для canvas singleton, нужен lazy-сценам без prop drilling. 16 строк. Паттерн продолжает useHoverState/useClickState Эпика 2.

**Objects (2):**
- `src/scene/objects/branchColumn.js` — `buildBranchColumn(THREE, branch, opts)` → `{ group, height }`. Per-object модуль паттерна Эпика 2. 98 строк.
- `src/scene/objects/fightAnimations.js` — `createAnimationSystem(leftParts, rightParts, leftBase, rightBase)` → `{ playMove, tickAnims, getAnims }`. 6 типов анимаций (jab/cross/hook/block/dodge/hit). 116 строк.

**Views (2):**
- `src/views-v2/FighterDetailView.vue` — наполнен из stub. Orchestrate сцены, orbit camera, watch route.params.key для live swap warden ↔ predator.
- `src/views-v2/FightView.vue` — наполнен из stub. Orchestrate сцены + resetFight на mount/unmount.

**HUD (10):**
- `src/components/hud/HudFighterDetail.vue` — наполнен, 328 строк. Back, FIGHT btn, fd-top (kicker/name/meta), fd-resources, fd-stats, 3 branch-labels с tracking, BranchPanel integration. Esc listener.
- `src/components/hud/HudFight.vue` — наполнен, 411 строк. fight-top (2 cards + round), cam-switcher, back, spectate-badge, fight-log, hit-flash, PrepOverlay/CoachPause/ResultOverlay integration.
- `src/components/hud/common/BranchPanel.vue` — slide-in справа, 216 строк. kicker/title/level/moves. Upgrade buttons disabled (title="Upgrade — Epic 4").
- `src/components/hud/common/fdBranchData.js` — моки FD_BRANCH_DATA (3 ветки × 5 moves), 37 строк. Вынесен из HudFighterDetail чтобы держать компонент в разумных размерах.
- `src/components/hud/common/PrepOverlay.vue` — 78 строк. VS + 3 strategy cards + Start/Cancel. **Упрощённый** — без deck builder, без stakes (полный prep = Epic 4).
- `src/components/hud/common/ResultOverlay.vue` — 28 строк. VICTORY/DEFEAT + summary + Rematch/Exit.
- `src/components/hud/common/CoachPause.vue` — 21 строка. 3 strategy buttons. Сделан сразу рабочим в шаге 16 (не placeholder), поэтому Step 17 закрылся пустым.
- `src/components/hud/common/useFightLog.js` — `fightLog { lines: [] }` reactive + `logFight(html, cls)` + `clearFightLog()`. Auto-trim 50 строк. 24 строки.
- `src/components/hud/common/useFlashHit.js` — `flashing` ref + `triggerFlash()` с микротиком для restart CSS animation. 34 строки.
- `src/components/hud/common/useFightSimulation.js` — state machine `fightState`, `startFight`, `runRound`, `doExchange`, `showCoachPause`, `setCoachStrategy`, `endFight`, `resetFight`. 198 строк.

**Styles (1):**
- `src/styles/v24/fight-overlays.css` — shared стили для PrepOverlay / ResultOverlay / CoachPause, 268 строк. Паттерн tokens.css / effects.css Эпика 1. Подключён через `@import` в hexlash-v24.css. Осознанное отклонение от ТЗ (ТЗ предполагал scoped per-component).

### Изменены

- `src/router/index.js` — добавлены роуты `/v2/fd/:key` (FighterDetailView) и `/v2/fight` (FightView).
- `src/views-v2/PitViewV2.vue` — watcher useClickState.seq: если id ∈ {warden, predator} → `router.push('/v2/fd/' + id)`. Остальные id (6 интерактивов + avatar) — как в Эпике 2 через PhModal.
- `src/scene/CanvasLayer.vue` — `if (!getActiveScene()) activateScene('pit')` guard (fix race при прямом заходе на `/v2/fd/*` или `/v2/fight`) + `renderer.toneMapping = ACESFilmicToneMapping` + `renderer.toneMappingExposure = 2.3` (итеративный тюнинг вместо прототипного 1.05).
- `src/scene/objects/arena.js` — pit floor color `0x2c2c34 → 0x6e6e7a` (итеративный тюнинг яркости).
- `src/styles/hexlash-v24.css` — `@import './v24/fight-overlays.css'`.
- `CLAUDE.md` — добавлена подсекция `### Эпик 3A — Fighter Detail + Fight (✅ COMPLETE)` со всем содержимым (что видит пользователь, дерево файлов, API контракты, расхождения, deferred, next epic).

---

## Технические детали

### FighterDetailScene архитектура

- `FogExp2(0x070811, 0.035)`, camera 38° at (0, 2.4, 7.0) lookAt (0, 1.6, 0).
- Floor `CircleGeometry(20, 64)` + 8 octagonal walls (FD_ROOM_R=14, H=8).
- Podium = Group(disc + torus ring), z=1.0 (сдвиг вперёд от колонок).
- 2 отдельные concrete-текстуры (fdFloorTex repeat 5×5 + fdPodiumTex дефолт 1×1) — правило PATCH Эпика 2.
- Lighting: Ambient + Hemisphere + Key SpotLight (castShadow 1024²) + Front fill SpotLight cyan + Light shaft ConeGeometry.
- Dust: 80 частиц, drift Y +0.002/frame, reset при y>4.
- 3 branch columns (speed/power/technique) через per-object builder `branchColumn.js`. Emissive pulse `0.40 + sin(t*1.2 + i*1.7)*0.10` на shaft-материале.
- Fighter: `makeFighterLowPoly(key)` на подиуме через `setKey(key)` (вызывается из View при mount и watch route.params.key). Outer idle sway: `y = 0.30 + sin(t*1.2)*0.012`, `rotation.y = sin(t*0.5)*0.06`.
- Glow disc: warden 0xD4A843 (золотой), predator 0xFF066F (розовый).
- `setKey(key)` делает teardown старого (unregisterIdleFighter + remove + dispose) + build нового.

### FighterDetailScene — FD per-part idle не работает

Это **прототип-parity**. В прототипе `fdPodium.children = [podiumDisc, podiumRing, fdFighter, archetypeGlow]`, `children[0] = podiumDisc`, не fighter. `tickIdleAnimations` ожидает `g.children[0] = inner` с 22 детьми и делает `continue` для FD. Значит per-part idle (дыхание торса, bob кулаков, sway) **не работает** в FD — только outer sway через формулу в FD.tick.

Claude Code отметил это в отчёте шага 4, пользователь подтвердил Вариант А (1-в-1 прототип, не чинить). Откладываем в Epic 5 polish.

### FD drag-to-rotate camera

- ZOOM нет (fd не нуждается).
- Rotation clamp ±π/3 ≈ ±60°.
- lerp 0.08 для rotation, lerp lookAt static `(0, 1.6, 0)`, `r=7.0`, `y=2.4`.
- Mousedown на canvas, mousemove/mouseup на window (drag не ломается при выходе).
- Drag formula: `dragStartRot + (dx / innerWidth) * π * 0.6` — абсолютная, не накопительная (как в Шаге 7 Эпика 2 orbit).
- Touch events — нет (Epic 5 mobile).
- Attach в FighterDetailView через composable useCanvasRef (canvas-singleton publisher из CanvasLayer).

### Branch labels tracking

- `fdLabels` module-scoped reactive store (паттерн Эпика 2: useHoverState, useClickState).
- В FD.tick для каждой колонки: `fdProjectToScreen(group, 0.10+h+0.4, camera, THREE)` → `updateFdLabel(id, pos)`.
- HudFighterDetail биндит `:style` на fdLabels[id].x / y / visible для 3 branch-labels.
- Labels следуют за колонками при drag камеры.

### Raycaster + click detection (Вариант А)

В шаге 7 Claude Code предложил обобщённое решение: каждая сцена публикует в registry-entry `picker`, `getIsDragging`, `hoverScale`, `labels`. CanvasLayer forward'ит pointer events через `getActiveScene()`. Единый код hover/click работает на pit и FD.

- Pit hoverScale = 1.04 (Эпик 2), FD hoverScale = 1.06 (прототип).
- Click detection: dist < 5px между pointerdown и pointerup.
- useClickState.pickClick(id) с `seq` counter — для повторных кликов.
- PitViewV2 watcher реагирует только на pit-id (warden, predator, 6 интерактивов, avatar).
- FighterDetailView watcher — только на FD id (speed, power, technique).

**Унификация convention:** `userData.branchId` → `userData.id` в branchColumn.js (было ожидаемо из ТЗ). Click-handler читает `.id` единообразно.

### FightScene архитектура

- `FogExp2(0x070811, 0.030)`, camera 42° (начальная позиция управляется updateFightCamera).
- Ring platform: ExtrudeGeometry(shape from 8 ftVerts, depth=0.5, bevel 0.06). FT_RING_R=3.6, FT_RING_H=0.5.
- Outer floor: CircleGeometry(16, 64), repeat 4×4.
- 8 walls: octagonal (FT_ROOM_R=14, H=8).
- 8 posts: CylinderGeometry(0.07, 0.09, 2.3, 16), metal texture.
- 8 caps: SphereGeometry(0.10, 16, 12), matte dark (не бликует от pink rim).
- 24 ropes: 3 levels (0.55 / 1.15 / 1.75) × 8 sides.
- Lighting: Ambient + Hemisphere + Key (2.4, π*0.25, castShadow 1024²) + RimL pink + RimR gold + Light shaft cone.
- 2 бойца: warden at x=-1.2 rotation.y=π/2, predator at x=+1.2 rotation.y=-π/2.
- Archetype glows: золотой + розовый.
- registerIdleFighter phase offsets: 0 и 1.5 (рассинхрон).

### Fight animation system

- Module `fightAnimations.js` — reusable helper.
- `ftAnims` очередь активных.
- `playMove(side, type)` — dur 400 для block/dodge, 500 для остальных.
- `applyAnim(parts, base, anim, t)` — 6 типов 1-в-1 прототип 8307-8362:
  - **jab:** правая рука разгибается (rotation.x -0.6, fistR z +0.45).
  - **cross:** левая рука (задняя) +0.7/+0.55 + torso rotation.y +0.3 + head +0.15.
  - **hook:** правая сбоку (rotation.z -0.8) + torso counter-rotation.
  - **block:** оба кулака up + forearms up-rotation.
  - **dodge:** torso back lean + head back.
  - **hit:** torso recoil + head tilt.
- `tickAnims()` — backward splice на завершённых, reset to base на пустом queue.

### Fight tick order (критично)

```
updateFightCamera(t);
tickAnims();
if (ftAnims.length === 0) {
  tickIdleAnimations(t);   // idle только когда нет combat — иначе перезаписывал бы
}
```

По прототипу 8838-8846. Без guard idle перезаписывал бы combat через reset-to-base → дёрганая картинка.

### Fight 3 camera modes

- **pit (default):** `orbit = sin(t*0.05)*0.4`, r=8.5, medium height (y=4.0), lookAt (0, 1.4, 0). Медленный зрительский орбит.
- **side:** static (0, 1.7, 7.5) → (0, 1.5, 0). Профиль сбоку.
- **cinema:** активно вращается r=5.5+sin(t*0.3)*0.5, tracks attacker via `animSystem.getAnims().find(a => a.type !== 'block/dodge/hit')` → opposite fighter position. `_cinemaLookAt = Vector3` переиспользуется без per-frame allocations.
- `setCamMode(mode)` whitelist-guarded.

### Fight simulation state machine

- `fightState` reactive: phase('prep'|'fight'|'result') + round/totalRounds + leftHp/rightHp + coachShown/coachStrategy + resultWon/resultSummary + coachPauseOpen/coachPauseText + leftName/leftArch/rightName/rightArch + timer.
- `startFight(strategy)` → phase='fight', clearLog, logFight bell, schedule runRound 700ms.
- `runRound()` → 3-5 exchanges alternating attacker. На середине `round === floor(totalRounds/2)` → showCoachPause() взамен next round.
- `doExchange(attacker)` → pick MOVES, apply strategy modifier (aggressive +0.08 leftOnly, defensive -0.10 rightOnly, counter noop), playMove, 220ms later hit/miss roll + crit 12% (dmg *1.6). triggerFlash on hit.
- `showCoachPause()` → 3 ветки text по HP diff ±15.
- `setCoachStrategy(strat)` → logFight "Coach: ...", close pause, schedule runRound 800ms.
- `endFight()` → phase='result', compute won + summary.
- `resetFight()` → clear timer + reset state + clearLog.
- Defensive `phase !== 'fight'` guard в каждом scheduled callback — защита от pending setTimeout при unmount/reset.

### PrepOverlay — упрощённый

ТЗ Epic 3A: только VS + 3 strategy cards + Start/Cancel. **БЕЗ** deck builder (5 moves pick), **БЕЗ** stakes (low/med/high). Это полный Card Fight prep, требует логики upgrade и ставок — Epic 4.

### HudFight.vue 411 строк

Над soft-порогом 300, но ниже stream-timeout 400 (используется Edit tool, не Write). Splitting на HudFight + HudFightOverlays wrapper — Epic 5 polish.

### scene activation race fix (`b1c4c30`)

**Проблема:** CanvasLayer (async sibling) и FighterDetailView/FightView (async route) оба в onMounted безусловно пишут activeId. При прямом заходе на `/v2/fd/warden` или `/v2/fight` (hard-refresh URL) — если View монтируется раньше CanvasLayer, он активирует свою сцену, потом CanvasLayer безусловно переключает на pit и перезаписывает.

**Симптом:** на `/v2/fd/warden` HUD правильный FD, но 3D-canvas рендерит pit.

**Fix:**
```js
if (!getActiveScene()) activateScene('pit');
```

Guard защищает от перезаписи. Первая загрузка `/v2` — activeId null, активируем pit. Прямой заход `/v2/fd/*` — FD уже активна, CanvasLayer не трогает. Unmount FD → FighterDetailView.onBeforeUnmount вызывает `activateScene('pit')` — работает, pit зарегистрирован.

**Альтернатива (отвергнута, Epic 5 polish):** удалить `activateScene('pit')` из CanvasLayer, делегировать в PitViewV2.onMounted. Архитектурно чище, но требует симметрию в unmount.

---

## Проверки

- [x] `npm run build` зелёный на каждом из 21 коммита.
- [x] Vercel зелёный на каждом push (подтверждено пользователем).
- [x] Drift test на fighter idle в Fight: 2+ минуты, кулаки не уплывают — подтверждено пользователем после Шага 11.
- [x] Animation system 6 типов (jab/cross/hook/block/dodge/hit) — подтверждено пользователем через debug hook `_playMove` в DevTools после Шага 12.
- [x] 3 camera modes (pit/side/cinema) — подтверждено пользователем через `_setCamMode` после Шага 13.
- [x] Полный бой от prep до result (PrepOverlay → Start → раунды → CoachPause → Defend → Result → Rematch / Exit) — подтверждено пользователем после Шага 16.
- [x] Scene activation для всех 3 URL (`/v2`, `/v2/fd/warden`, `/v2/fight`) — подтверждено после hot-fix `b1c4c30`.
- [x] Финальный прогон визуально — подтверждено пользователем.
- [x] `grep window\._ src/` → 0 совпадений после шага 18.
- [x] CLAUDE.md обновлён (Эпик 3A COMPLETE подсекция).

---

## Расхождения с ТЗ — все осознанные

Всё зафиксировано в ходе работы, ничего не «молча чинилось». Отдельная таблица — потому что их много.

### Hot-fixes (после моих ошибок в ТЗ или пропусков Эпика 1/2)

1. **`renderer.toneMapping` пропущен в Эпике 1.** В прототипе все сцены используют `ACESFilmicToneMapping + 1.05`. У нас не выставлено — визуал слишком ярок/контрастен. Hot-fix `7886f41` ставит tonemap на shared renderer в CanvasLayer. Долг Эпика 1, чинится в Эпике 3A.

2. **Слишком широкое добавление `toneMapped:false`.** Вместе с toneMapping Claude Code добавил `toneMapped:false` на 8 материалов (glow-диски, CRT-экран, shaft), из которых прототип метит только 1 (shopLocker display). Аргумент «прототип был черновиком» — интерпретация без данных. Откачено в `74b0872` — оставили только прототип-parity (shopLocker display + matchmaking screen Эпик 3B).

3. **toneMappingExposure тюнинг.** После ACES-включения сцена стала визуально темной на target hardware. Итеративно подняли: `1.05 → 1.7` (`46d27f2`), `1.7 → 2.3` (`f68606c`). Итоговое значение — **осознанное отклонение от прототипа** в пользу визуальной читаемости. Revisit Epic 5.

4. **Pit floor color тюнинг.** После ACES пол слился с чёрным фоном. Итеративно подняли: `0x2c2c34 → 0x4a4a56` (`80fa397`), `0x4a4a56 → 0x6e6e7a` (`989b29f`). Только pit floor — FD и Fight полы остались прототип-parity `0x2c2c34`. Пользователь решил отложить распространение до наблюдения в контексте. Revisit Epic 5.

5. **Scene activation race.** При прямом заходе на `/v2/fd/*` или `/v2/fight` 3D-canvas показывал pit, HUD — правильный. Причина: async siblings CanvasLayer и route View оба безусловно активировали свою сцену. Fix `b1c4c30` — guard `if (!getActiveScene()) activateScene('pit')`. Долг Эпика 1 архитектурный.

### Архитектурные решения Claude Code (осознанные и принятые)

1. **useCanvasRef composable** — третий после useHoverState/useClickState в `scene/interaction/`. Нужен чтобы lazy-сцены получали canvas без DOM-queries/prop-drilling. Продолжение паттерна Эпика 2.

2. **Ленивая регистрация FD/Fight сцен в View (не в CanvasLayer).** Pit регистрируется в CanvasLayer (он дефолтный). FD/Fight — в своих View.onMounted. Не требует CanvasLayer знать про каждую новую сцену.

3. **Variant A для raycaster/hover (active-scene forwarding).** Вместо per-scene pointerevents — единый CanvasLayer.onPointerMove/Up через `getActiveScene()`. Registry-entry объявляет picker/getIsDragging/hoverScale/labels. Pit-entry расширен. Pattern растягивается на Fight без изменения CanvasLayer.

4. **Вынос branchColumn.js в objects/** (Шаг 5 Variant 2). Избегаем раздувания FighterDetailScene.js. Паттерн Эпика 2 (arena.js, heavyBag.js, plinth.js).

5. **Вынос fightAnimations.js в objects/** (Шаг 12). Избегаем раздувания FightScene.js выше 400.

6. **Вынос fdBranchData.js** (Шаг 8b). Моки FD_BRANCH_DATA — отдельный файл. Держит HudFighterDetail в разумных размерах.

7. **fight-overlays.css shared (Шаг 16)** — вместо scoped per-component. 60% классов общие Prep+Result. Паттерн tokens.css/effects.css Эпика 1.

8. **CoachPause как полноценный компонент в Шаге 16** (не placeholder). Сэкономил коммит Шага 17 — он закрылся пустым.

9. **userData.branchId → userData.id** (Шаг 7). Унификация convention с интерактивами pit. Click-handler читает `.id` единообразно на всех сценах.

10. **HP `Math.max(0, ...)` clamp в display** — прототип не clamp'ит. Мелкое улучшение, не меняет исход endFight.

### Упрощения скоупа (зафиксированы для Epic 4+)

1. **Branch-panel upgrade disabled.** Upgrade-кнопки (+) и «Level Up Branch» видимы, но disabled с title="Upgrade — Epic 4". Без fdState.taps, rebuildColumnHeight, spawnShockwave. Это логика прокачки — Epic 4.

2. **PrepOverlay упрощённый.** VS + 3 strategy cards + Start/Cancel. Без deck builder (5 moves pick из 15), без stakes (low/med/high). Полный prep = Epic 4+.

3. **coach-strategy 'counter' noop.** Прототип 8502-8505 комментирует «Handled below», но реально не реализовано. Мы тоже noop.

4. **Touch events в FD camera — нет.** Только mouse. Touch откладывается в Epic 5 mobile.

5. **spectate-badge всегда видим в Fight HUD.** Прототип gating через `body.fight-readonly` (spectate-режим). У нас нет этого класса в v2. Условие появится в Epic 4 (own match vs spectate).

6. **fd-resources right: 150px** (прототип 14px) — из-за временной FIGHT-кнопки. При удалении кнопки в Эпике 3B (Matchmaking становится входом в Fight) — вернуть `right: 14px`.

7. **FighterBadge.vue stub не заполнен.** Это Pit HUD (DOM-ярлыки над 3D-бойцами в hub), не FD/Fight. Epic 3 late phases или Epic 4.

8. **FD per-part idle не работает** (прототип-parity, см. раздел «FD per-part idle» выше).

### Формальные отклонения от ТЗ

1. **Step 17 закрыт пустым.** CoachPause.vue сделан полным в Шаге 16 (по инициативе Claude Code для экономии коммита). Step 17 coach-pause buttons + contextual text уже реализованы → коммит не нужен. Зафиксировано.

2. **Step 8 split на 8a/8b.** HUD FD + BranchPanel разбиты на два коммита чтобы каждый был в разумном размере.

3. **HudFight.vue 411 строк** — над soft-порогом 300. Под safe для stream (используется Edit, не Write). Splitting Epic 5 polish.

4. **FighterDetailScene.js 317 строк** — над soft-порогом. Безопасный размер (under stream limit). Если понадобится cut — вынести FD_BRANCHES/GLOW_COLOR в fdConstants.js (−14 строк).

---

## Deferred — в handoff Эпика 3A → 3B

### Epic 3B (следующий):

- **Убрать временную FIGHT-кнопку из FD.** Matchmaking становится входом в Fight (клик по opponent-кандидату). fd-resources возвращается на `right: 14px`.

### Epic 5 (polish):

- **Punch-zoom transition** hub → sub-scene (из HANDOFF_EPIC3).
- **Blur + fade transitions** между сценами (из HANDOFF_EPIC3).
- **Touch events support** — FD camera drag + общий mobile.
- **toneMapping/exposure final tuning** — сейчас 2.3, прототип 1.05. Пересмотр на реальных устройствах.
- **Floor color consistency** — сейчас pit 0x6e6e7a, FD/Fight прототипные 0x2c2c34. Унификация.
- **FD per-part idle fix** — переделка podium структуры (fighter должен быть children[0] обёртки).
- **HudFight.vue splitting** — разделение на HudFight + HudFightOverlays wrapper.
- **spectate-badge gating** — условное появление в spectate-режиме.
- **CanvasLayer race elimination** — удалить `activateScene('pit')` из CanvasLayer, делегировать в PitViewV2.onMounted. Текущий guard работает, но архитектурно чище.

---

## Уроки для Эпика 3B

1. **Claude Code инициативы иногда расширяют скоуп.** Случай с `toneMapped:false` на 8 материалов (`7886f41`) — Claude Code дополнил защитный пункт ТЗ до восьми материалов. Правило: защитные пункты в ТЗ формулировать с white-list ("только для этих материалов") или явным "не добавляй больше чем перечислено". Откат был быстрый (`74b0872`), но повторения избегать.

2. **Итеративный визуальный тюнинг — не фикс, а процесс.** exposure 1.05 → 1.7 → 2.3 + floor color 0x2c2c34 → 0x4a4a56 → 0x6e6e7a — каждая итерация отдельный коммит. Можно сжать на будущее, но приятнее иметь историю.

3. **Vercel prod-путь для import не работает.** DevTools проверка через `import('/src/...')` падает в prod (MIME error). Альтернатива — либо DOM-проверка через Elements, либо debug hook через window (но это в code). В Эпике 3B — просто помнить.

4. **Shared state через composables — уже штатный паттерн.** В Эпике 3A добавлено useCanvasRef, useFdLabels, useFightSceneApi, useFightLog, useFlashHit, useFightSimulation. Паттерн работает, продолжаем в Эпике 3B (Training/Matchmaking/Create требуют своих composables).

5. **Async siblings race — реальный риск.** Scene activation race (`b1c4c30`) потребовал аудита с временными console.log перед правкой. Если в Эпике 3B появятся новые async компоненты — сразу проверять порядок onMounted.

6. **FD per-part idle не заработает в других сценах по той же причине.** Create / Profile / Training — если fighter добавляется не как `group.children[0]`, per-part idle не сработает. Если нужно — оборачивать в дополнительный Group где fighter единственный child.

7. **Декомпозиция файлов — профилактически, не после timeout'а.** Вынос branchColumn.js, fightAnimations.js, fdBranchData.js — делали заранее. Stream timeout не сработал ни разу в Эпике 3A.

8. **Осознанные отклонения — в отчёт каждого шага.** В Эпике 3A Claude Code фиксировал 10+ отклонений в отчётах шагов: useCanvasRef, Variant A raycaster, вынос модулей, CoachPause opportunistic, HP clamp, и т.д. Все приняты пользователем, потому что обоснованы. Продолжать в Эпике 3B.

---

**Конец отчёта.**
