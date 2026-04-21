# HANDOFF — Переход из Эпика 3Bb в Эпик 3Bc

**Дата:** 2026-04-21
**Источник:** завершение Эпика 3Bb (Matchmaking).
**Цель:** ввод нового чата Claude Code в контекст Эпика 3Bc (Create Fighter).

---

## 1. Где мы сейчас

**Эпик 3Ba (Training):** ✅ закрыт — `/v2/training` с heavy bag, физикой, combo, tasks, procedural sound.
**Эпик 3Bb (Matchmaking):** ✅ закрыт — `/v2/matchmaking` с CRT terminal, typeLog, filters, candidate grid, Start Fight → `/v2/fight` через `useFightSetup`.

**Ветка разработки:** `visual-v2`. После финала 3Bb рабочая ветка сессии `claude/hexlash-visual-v2-YE5u1` смерджена в `visual-v2` (ff-only).

**Последний коммит на `visual-v2`** (на момент создания этого handoff):
- `epic3bb: final part 3 — HANDOFF_EPIC3Bc_CHAT_HANDOFF.md` — этот файл.
- Перед ним: `final part 2 — EPIC3Bb_FINAL_REPORT.md` + `final part 1 — CLAUDE.md подсекция 3Bb`.
- Перед финалом: 9 функциональных коммитов 3Bb (Steps 1-9) + hot-fix (`c644f1b` Step 10 stale-state fix).

**Что работает на Vercel preview `/v2`:**
- `/v2` — hub (Эпик 2): pit-сцена, 8 кликабельных интерактивов, orbit camera, TopBar, hover-hint, PhModal.
- `/v2/fd/warden`, `/v2/fd/predator` — Fighter Detail (Эпик 3A): подиум, 3 branch columns, stats.
- `/v2/fight` — Fight (Эпик 3A): ринг, 2 бойца, PrepOverlay → 3-5 exchanges → CoachPause → ResultOverlay. **Теперь принимает opponent setup от Matchmaking через `useFightSetup`** (3Bb Step 9 + hot-fix).
- `/v2/training` — Training (Эпик 3Ba): tap heavy bag, combo, energy, tasks, hit sound.
- `/v2/matchmaking` — Matchmaking (Эпик 3Bb): CRT typeLog, фильтры, кандидаты, Start Fight → Fight.

**Следующий эпик:** 3Bc — Create Fighter. **Последний sub-эпик внутри Эпика 3B.** После 3Bc — Эпик 3B закрыт целиком.

---

## 2. Что прочитать в новом чате

Прикрепить к сообщению нового чата в этом порядке:

1. **`HANDOFF_EPIC3Bc_CHAT_HANDOFF.md`** (этот файл) — читать первым.
2. **`EPIC3Bb_FINAL_REPORT.md`** — свежий опыт Matchmaking. В нём §5 «Расхождения» содержит явную поправку handoff §5.4 про holo material (см. §5.1 открытых вопросов ниже).
3. **`EPIC3Ba_FINAL_REPORT.md`** — опыт Training (паттерн sub-scene, module-per-object, canvas-singleton).
4. **`EPIC3A_FINAL_REPORT.md`** — FighterDetail + Fight, в т.ч. `makeFighterLowPoly` integration, FD FIGHT-кнопка временная (которая удаляется в финале 3Bc).
5. **`EPIC2_FINAL_REPORT.md`**, **`EPIC1_FINAL_REPORT.md`** — базовый контекст hub'а и foundation v2.
6. **`HANDOFF_VISUAL_MIGRATION.md`**, **`VISUAL_MIGRATION_PLAN.md`** — полный контекст миграции.
7. **`HANDOFF_FIGHTER_MODEL.md`** — **КРИТИЧНО** для 3Bc. 22-индексный контракт `makeFighterLowPoly` + accessories + archetype glow. Holo-fighter в Create оборачивает именно эту функцию.
8. **`PROMPT_EPIC3B_a_TRAINING_FOR_CLAUDE_CODE.md`** — референс формата ТЗ (структура шагов, definition of done, commit template).
9. **`hexlash_v24.html`** — прототип. Фокус-окрестности для Эпика 3Bc:
   - `openCreate` — строки **9262-9460** (обработчик клика «+» plinth, сборка Create-сцены).
   - `setHologram` — строки **8937-8945** (применение holo material).
   - `materializeFighter` — строки **9231-9258** (opacity lerp animation на Confirm).
   - Name generator — строки **9128-9170**.
   - Archetype cards HTML — **4248-4265**, CSS — **~2450-2560**.
10. **Project knowledge в новом чате должно содержать актуальный `CLAUDE.md`** — подсекции «Эпик 3Ba» (строка 2080) и «Эпик 3Bb» (сразу после). Если user переключил чат — перезалить CLAUDE.md в project files.

---

## 3. Уроки Эпика 3Bb — обязательны к учёту в 3Bc

1. **Критические риски через §5 handoff передаются корректно.** Прецедент 3Bb: `clearFightSetup` риск был статически предсказан в 3Ba Step 10, передан в handoff 3Bb §5.5 с указанием fix-варианта, воспроизведён в 3Bb Step 10 regression test, починен через Variant 1 (commit `c644f1b`). **В 3Bc:** если Claude Code видит потенциальный риск — фиксировать в handoff на Epic 4 с указанием конкретного fix-варианта.

2. **One-shot consumption (`get + clear + apply`) — паттерн для shared state между sub-scenes.** `useFightSetup` — прецедент. **В 3Bc:** если Create передаёт данные нового бойца (например, `createdFighterId` → FD нового бойца после materialize) — использовать тот же паттерн. Создать `useCreatedFighter.js` или аналог, consumer очищает state сразу после read. Module-scoped reactive, не `ref`, не `provide/inject`.

3. **Большие финальные документы разбивать на отдельные коммиты и микро-Edit'ы (≤50 строк за Edit).** Прецедент 3Bb: 3 stream timeout'а подряд на секции «Технические детали» одним Write/Edit. Решение — preemptive split на 3 финальных коммита (CLAUDE.md / FINAL_REPORT / HANDOFF) + микро-Edit'ы внутри каждого файла. **В 3Bc:** применять с первого финального коммита, не ждать timeout'а. Skeleton с плейсхолдерами → 40-50 строк за Edit.

4. **Отдельный модуль per sub-scene.** Паттерн `trainingBag.js` vs hub `heavyBag.js` (3Ba) → `matchmakingTerminal.js` vs hub `terminal.js` (3Bb) — подтверждён дважды. **В 3Bc:** для Create podium — если геометрия отличается от hub `plinth.js` (прототип «+» plinth), создать отдельный `createPodium.js`. Если совпадает — можно переиспользовать, но чаще проще клонировать для изоляции.

5. **Canvas texture для 3D-экранов — паттерн 3Bb.** `screenCanvas` + `CanvasTexture` + `MeshBasicMaterial({ toneMapped: false })` + dynamic draw через composable. **В 3Bc:** не очевидно применимо (Create scene — fighter на подиуме + HUD-stepper). Если в прототипе есть archetype-info дисплей на сцене (проверить 9262-9460) — применить тот же паттерн. `toneMapped: false` — white-list из 2 случаев, extend требует явного обоснования.

6. **Статическая трассировка regression test — потолок Claude Code без браузера.** Step 10 no-commit pattern из 3Ba + 3Bb. Claude Code пишет «что проверено из кода» (контракты, early-returns, cleanup paths), пользователь подтверждает «что работает визуально» на Vercel preview. **В 3Bc:** повторить Step 10 regression, 14-18 пунктов.

7. **Timer cleanup + scene teardown ordering в `onBeforeUnmount`.** Паттерн 3A → 3Ba → 3Bb: `cancel animations/timers` (первые строки) → `resetState` → `activateScene('pit')` → `unregisterScene(id)` → `sceneApi.dispose()`. renderLoop не должен тикать disposed scene. **В 3Bc:** `materializeFighter` имеет 1.2s animation — нужен cancel handle если user уйдёт с `/v2/create` в середине materialize. Создать `{ cancel() }` return value как `startSearchLogAnimation` в 3Bb.

---

## 4. Карта Эпика 3Bc — Create Fighter

**Цель:** последняя sub-scene Эпика 3B. После 3Bc закрывается весь Эпик 3B, начинается планирование Epic 4 (backend integration).

**Точка входа:** клик «+» plinth в hub → `/v2/create`.

**Scene (`CreateScene.js`):**
- Октагональная комната (параметры — см. прототип 9262+), подиум в центре.
- Голографический fighter: `makeFighterLowPoly(variant)` обёрнут в `setHologram(group, 0.35)` — **только `transparent: true + opacity: 0.35`**, никакого emissive (см. §5.1 открытых вопросов).
- Подиум: переиспользовать `plinth.js` из hub ИЛИ создать `createPodium.js` — решение в Step 4, зависит от геометрии прототипа.
- Свет (вероятно ambient + key + rim), dust (если есть в прототипе).
- Никакой orbit camera (прототип — static или slow breath).

**HUD (`HudCreate.vue`):**
- Back button, stepper (Archetype → Name → Confirm).
- Панель per шаг (v-if на `createState.step`):
  - **Archetype:** grid карточек (warden / predator / etc.), click → preview в 3D через `setVariant(variant)` composable. Archetype data: `id / name / colorHex / description`.
  - **Name:** text input + random-generate кнопка (прототип 9128-9170 имеет оба механизма). Валидация: 3-20 chars, [a-zA-Z0-9_] (подтвердить из прототипа).
  - **Confirm:** preview (summary: archetype + name) + Create button.
- Прототип HTML — 4248-4265, CSS — ~2450-2560.

**State (`useCreateState.js`):**
```js
createState = reactive({
  step: 'archetype',           // 'archetype' | 'name' | 'confirm'
  archetype: 'warden',         // selected archetype id
  name: '',
  materialLizing: false,       // true during 1.2s opacity lerp
});
```

**Materialize animation (`materializeFighter`):**
- Opacity lerp 0.35 → 1.0 за 1.2 сек (requestAnimationFrame loop, ease-in-out).
- По завершении: `transparent: false` возврат на обычный рендер (прототип 9231-9258).
- После materialize → см. §5.2 открытых вопросов (переход в hub или FD нового бойца).
- **Cancel handle обязателен** — если user навигирует назад во время materialize, анимация должна остановиться (прецедент 3Bb `animHandle.cancel()`).

**Финал Эпика 3B (отдельный шаг, см. §5.5):**
- Удалить временную FIGHT-кнопку из `HudFighterDetail.vue` + соответствующие стили.
- `fd-resources right: 150px` → `right: 14px` (прототип-parity восстановлен).
- Matchmaking становится единственным входом в Fight.

**Ожидаемая сложность:** 6-9 функциональных шагов + Step «FD cleanup» + финал (CLAUDE.md + FINAL_REPORT + HANDOFF Epic 4).

---

## 5. Открытые вопросы на момент передачи

5 вопросов. Новый чат должен **обсудить их в первом ответе** до начала ТЗ.

### 5.1 Holo material: 1-в-1 прототип (подтверждение)

- **Прототип 8937-8945** `setHologram(group, alpha)`:
  ```js
  fighter.traverse((obj) => {
    if (obj.isMesh) {
      obj.material.transparent = true;
      obj.material.opacity = alpha;
    }
  });
  ```
  Только `transparent + opacity`. Никакого emissive / emissiveIntensity / custom shader.
- **`HANDOFF_EPIC3B` §5.4 ошибочно** описал это как «emissive material». Опровергнуто в `EPIC3Bb_FINAL_REPORT.md` §5 (Расхождения, подраздел «Поправка handoff §5.4»).
- **В начале 3Bc подтвердить:** holo material = opacity only. Реальный fresnel / scanlines / rim-effect holo-shader — Epic 5 polish, **не 3Bc**.

### 5.2 После Confirm — переход в hub или FD нового бойца?

- **Прототип:** `closeCreate()` → hub (`body.is-create` removed, возврат на pit-сцену). Никакого перехода в FD.
- **Альтернатива:** Create → FD нового бойца (`/v2/fd/:newKey`) → пользователь сразу видит своего нового captain'а в детальном виде.
- **Расширение скоупа 3Bc** — альтернатива требует: регистрацию FD scene для динамических variants, `useCreatedFighter` composable (паттерн one-shot consumption из урока №2), обработку в FighterDetailView onMounted.
- **Минимум:** 1-в-1 прототип (Create → hub). **Рекомендация:** подтвердить минимум, альтернативу в Epic 4 (real backend + persistence).

### 5.3 Archetype данные

- **Прототип `makeFighterLowPoly`:** 2 варианта — warden + predator (параметр `variant`).
- **Вопрос:** оставляем 2 или готовим расширение на 4-6 архетипов для Epic 4 (real backend)?
- **Минимум:** 2 (1-в-1 прототип). Расширение на 6 архетипов — когда появится связь с `ARCHETYPE_MODIFIERS` из backend'а (PvP combat, см. `CLAUDE.md § Combat System`). **Рекомендация:** 2 в 3Bc, 6 в Epic 4 через extension `makeFighterLowPoly(variant)` → variant из enum.

### 5.4 Name generator

- **Прототип 9128-9170:** text input **+** random-generate button. Random — pick из пула готовых имён + опциональный digit suffix.
- **Вопрос:** переносим оба механизма 1-в-1 или упрощаем до text input only?
- **Минимум:** оба, 1-в-1 прототип. Random-generate — часть UX фантазии игрока («roll до красивого имени»), отбрасывать без причины нельзя.
- **Рекомендация:** оба. Упрощение — осознанное отклонение, зафиксировать в отчёте шага с явным обоснованием (но здесь нет — прототип parity).
- **Пул имён:** использовать `MM_POOL_NAMES` из `mmCandidatesMock.js` (30 имён уже готовы в codebase) или прототип-специфичный пул для Create? Проверить `hexlash_v24.html` в окрестности 9128 — есть ли отдельный `CREATE_POOL_NAMES`.

### 5.5 Удаление временной FIGHT-кнопки FD — финал 3Bc или отдельный шаг

- **Контекст:** в 3A добавлена временная FIGHT-кнопка в `HudFighterDetail.vue` с `fd-resources right: 150px` чтобы кнопка не пересекалась с resources. После 3Bb Matchmaking — единственный вход в Fight через hub → terminal → mm → Start Fight. FD FIGHT-кнопка больше не нужна.
- **Что удалить:**
  - Элемент `.fd-fight-btn` в `HudFighterDetail.vue` template + соответствующие handlers.
  - CSS `.fd-fight-btn` в `v24/fd.css` (или где он живёт).
  - `fd-resources right: 150px` → `right: 14px` (прототип-parity восстановлен, см. `EPIC3A_FINAL_REPORT.md` §Deferred).
- **Варианты:**
  - **(A)** В финале 3Bc одним коммитом вместе с handoff Epic 4.
  - **(B)** Отдельным «FD cleanup» шагом перед финалом — visual verify, что FIGHT-кнопки больше нет, `fd-resources` в правильном месте, все переходы работают только через hub → terminal.
- **Рекомендация: (B).** Один коммит для удаления, один для финала. Меньше риска (изменения trivial и hot-patch'и не нужны), чище git-history (явный «end of 3B» marker). Прецедент — 3Ba Step 10 no-commit и 3Bb Step 10 hot-fix: regression test как отдельный шаг.

---

## 6. Что делать новому чату в первом сообщении

Новый чат НЕ стартует ТЗ сразу. Первый ответ — ровно следующее:

1. **Прочитать `HANDOFF_EPIC3Bc_CHAT_HANDOFF.md`** (этот файл) целиком.
2. **Прочитать `EPIC3Bb_FINAL_REPORT.md`** — свежий опыт + §5 Расхождения (особенно §5.4 поправка про holo material).
3. **Бегло** `EPIC3Ba_FINAL_REPORT.md`, `EPIC3A_FINAL_REPORT.md`, `HANDOFF_VISUAL_MIGRATION.md`.
4. **Внимательно** `HANDOFF_FIGHTER_MODEL.md` — **критично** для 3Bc (22-индексный контракт `makeFighterLowPoly`, accessories, archetype glow).
5. **Project knowledge** — проверить что `CLAUDE.md` в project содержит подсекции 3Ba + 3Bb (строки ~2080+). Если нет — перезалить.
6. **Подтвердить прочитанное** — 1-2 предложения: «прочитал X, Y, Z, понял текущее состояние».
7. **Ответить на 5 открытых вопросов §5** — свои рекомендации + вопросы пользователю. Особенно явно:
   - §5.1 подтверждение holo = opacity only.
   - §5.2 выбор перехода после Confirm.
   - §5.3/5.4 минимум vs расширение.
   - §5.5 вариант (B) удаления FIGHT-кнопки.
8. **НЕ начинать писать ТЗ или код** до подтверждения пользователя по вопросам §5.
9. Режим работы — **Режим А** (строгий step-by-step): СТОП после каждого шага, отчёт, ждать «ок». Прецедент 3Ba/3Bb.

---

## 7. Стартовое сообщение для нового чата

Готовый текст для копи-паста пользователем в новый чат на claude.ai. Скопировать целиком начиная от `---` до следующего `---`:

---

Привет. Начинаем **Эпик 3Bc — Create Fighter**. Это последний sub-эпик внутри Эпика 3B визуальной миграции Hexlash (проект Hexlash на ветке `visual-v2`).

Предыдущие эпики закрыты: 3Ba (Training) и 3Bb (Matchmaking). Все работают на Vercel preview `/v2/training` и `/v2/matchmaking`.

**Прикрепил ключевые документы:**
- `HANDOFF_EPIC3Bc_CHAT_HANDOFF.md` — читай первым. Там: статус, что почитать, уроки 3Bb, карта 3Bc, 5 открытых вопросов.
- `EPIC3Bb_FINAL_REPORT.md` — свежий отчёт по Matchmaking (особенно §5 Расхождения).
- `EPIC3Ba_FINAL_REPORT.md`, `EPIC3A_FINAL_REPORT.md` — контекст предыдущих.
- `HANDOFF_FIGHTER_MODEL.md` — **критично**, Create-fighter использует `makeFighterLowPoly`.
- `HANDOFF_VISUAL_MIGRATION.md`, `VISUAL_MIGRATION_PLAN.md` — полный контекст миграции.
- `hexlash_v24.html` — прототип. Фокус для 3Bc: `openCreate` (9262), `setHologram` (8937-8945), `materializeFighter` (9231-9258), name generator (9128-9170).

**CLAUDE.md в project knowledge** — проверь, должен содержать подсекции «Эпик 3Ba» и «Эпик 3Bb» (строки ~2080+). Если устарел — обнови из репо.

**Что сделать в первом ответе:**
1. Прочитай документы выше в указанном порядке.
2. Подтверди что понял текущее состояние (1-2 предложения).
3. Ответь на **5 открытых вопросов** из §5 handoff'а — свои рекомендации + уточни у меня. Особенно важны 5.1 (holo material — только opacity, не emissive, handoff §5.4 ошибочен) и 5.5 (вариант (B) удаления FD FIGHT-кнопки отдельным шагом).
4. **Не пиши ТЗ и не начинай код** до моего подтверждения по вопросам §5.

Режим работы — **Режим А**: СТОП после каждого шага, отчёт, жди «ок». Прецедент 3Ba/3Bb.

Поехали.

---

**Примечание для пользователя (не копировать в новый чат):** если Claude Code в новом чате начнёт ТЗ/код до обсуждения §5 — остановить его явно. Handoff специально требует consult-first.

---

## 8. Чеклист самого handoff'а

Валидация полноты этого документа перед push'ем:

- [x] §1 Статус 3Ba + 3Bb зафиксирован (оба `✅ закрыт`, ветка `visual-v2`).
- [x] §2 Список файлов для прикрепления (10 пунктов, включая `HANDOFF_FIGHTER_MODEL.md` и фокус-строки прототипа).
- [x] §3 Уроки 3Bb — **7 пунктов** (handoff risks, one-shot consumption, split commits + micro-Edit, per-module, canvas-texture, static regression, timer cleanup + teardown ordering).
- [x] §4 Карта 3Bc — вход через «+» plinth, scene + HUD + state + materialize, финал 3B с FD cleanup.
- [x] §5 Открытые вопросы — **5 штук**, включая §5.1 holo-поправку (opacity only) и §5.5 вариант (B) FD cleanup.
- [x] §6 Первое действие нового чата (9 пунктов, не начинать код до §5).
- [x] §7 Стартовое сообщение готово к копи-пасту.
- [x] §8 Этот чеклист (meta-pункт).

**Следующий эпик после 3Bc:** Epic 4 — backend integration (real matchmaking API, real captain data, match state persistence). Или Epic 5 — polish (touch support, global audio, CSS pass, transitions). Решение — по итогам 3Bc.

---

**Конец handoff'а.**
