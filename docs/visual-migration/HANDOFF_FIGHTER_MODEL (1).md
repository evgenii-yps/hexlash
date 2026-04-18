# Hexlash Fighter Model — Handoff

Документ для переноса улучшенной 3D‑модели бойца из prototype (`hexlash_v24.html`) в существующий проект.

---

## 1. Что переносить

Функция **`makeFighterLowPoly(variant)`** — конструктор персонажа на базе `three.js`. Возвращает `THREE.Group`, готовую для добавления в любую сцену. Плюс вспомогательная функция **`tickIdleAnimations(t)`** и реестр **`registerIdleFighter(group, phase)`** для лёгкой idle‑анимации (дыхание, sway, guard‑bob).

### Где лежит в прототипе
`hexlash_v24.html`:
- `function makeFighterLowPoly(variant)` — строки **~6051–6395**
- `registerIdleFighter`, `tickIdleAnimations` — строки **~6416–6480**
- Интеграция (как добавляется в сцену) — см. строки **~8215–8235** (fightScene) или **~6684–6691** (podium)

### Зависимости
- `three.js` (r150+ должно хватить; используется `LatheGeometry`, `SphereGeometry`, `CylinderGeometry`, `BoxGeometry`, `MeshStandardMaterial`, `TorusGeometry`)
- Ничего больше. Без shader'ов, без загрузчиков моделей, без textures.

---

## 2. Контракт группы (ВАЖНО — не ломать)

Функция возвращает `THREE.Group` с **ровно 22 прямыми детьми в фиксированном порядке**. `tickIdleAnimations` обращается к ним по индексу — любой сбой порядка = визуальная поломка.

```
child[0]  head        (SphereGeometry)
child[1]  neck        (hidden, visible=false)
child[2]  torso       (LatheGeometry — urn shape, Z-squashed)
child[3]  shoulderL   (Sphere — deltoid cap)
child[4]  shoulderR
child[5]  upperL      (Cylinder — tapered, thick at shoulder)
child[6]  upperR
child[7]  elbowL      (Sphere joint)
child[8]  elbowR
child[9]  foreL       (Cylinder — tapered, thick at elbow)
child[10] foreR
child[11] fistL       (Sphere — dark glove)
child[12] fistR
child[13] hipJoint    (hidden)
child[14] thighL      (Cylinder)
child[15] thighR
child[16] kneeL       (Sphere joint)
child[17] kneeR
child[18] shinL       (Cylinder)
child[19] shinR
child[20] footL       (scaled SphereGeometry — rounded boot)
child[21] footR
```

После этих 22 идут opcional accessories (belt/tail/wraps) — они в массиве `acc`, все `.visible = false`. Их можно включить отдельно если нужны пояс и т.п.

---

## 3. Варианты (variants)

```js
makeFighterLowPoly('warden')    // коренастый, широкие плечи, низкая стойка
makeFighterLowPoly('predator')  // высокий, жилистый, вытянутая передняя рука
makeFighterLowPoly()             // == 'warden'
```

Пропорции переключаются через объект `P` в начале функции (см. блок `const P = (variant === 'predator') ? {...} : {...}`). Чтобы добавить свой вариант — просто extend этот блок; геометрия пересчитается автоматически.

**Ключевые поля P:**
- `scaleY` — общий вертикальный масштаб (0.96–1.08 у существующих)
- `torsoTop/torsoBot/torsoH` — торс (lathe‑профиль раздувается от bot к top)
- `upperArmR/upperArmH`, `foreR/foreH` — руки
- `thighR/thighH`, `shinR/shinH` — ноги
- `torsoLean/torsoTurn/headTilt` — стойка (наклон/поворот корпуса)
- `leadArmExt` — выставление передней руки (0 = прижата к лицу, 1 = вытянута вперёд). **Только для warden/predator**: warden = 0.15, predator = 0.85
- `stanceWidth/stanceStagger` — позиции стоп

---

## 4. Ключевые решения модели (что НЕ упустить при переносе)

### 4.1 Торс — urn‑силуэт через LatheGeometry, сплющенный по Z
```js
const torsoPts = [];  // силуэт амфоры: узкая база → широкие плечи → шея
// ... ~10 Vector2 точек (см. код) ...
const torsoGeo = new THREE.LatheGeometry(torsoPts, 24);
torsoGeo.translate(0, -H / 2, 0);
torsoGeo.scale(1, 1, 0.60);  // ← критично! сплющивает перёд-зад
```
Без `scale(1,1,0.60)` плечи выпирают одинаково вперёд и назад (lathe = тело вращения) — получается «тыква». Z‑squash делает спину почти плоской.

### 4.2 Руки — конические цилиндры
- **Upper arm**: шире у плеча, уже у локтя — `CylinderGeometry(R*0.82, R*1.05, H, 16)`
- **Forearm**: толще у локтя, тоньше у запястья — `CylinderGeometry(R*0.70, R*1.00, H, 16)`
- **Sphere joints** (плечо, локоть, колено) — сглаживают стыки между цилиндрами, заполняют швы

### 4.3 Голова — сплющенная сфера без flatShading
```js
const headGeo = new THREE.SphereGeometry(r, 16, 12);
headGeo.scale(1, 0.85, 1);  // slightly squashed
// material: НЕ использовать flatShading — иначе грани видны
```

### 4.4 Кулаки (очень важный баг, обязательно фиксить)

**Перчатки** — тёмные, почти в цвет тела (НЕ яркие цвета):
```js
const matGlove = new THREE.MeshStandardMaterial({
  color: 0x2a2d34,     // near-black slate
  roughness: 0.70, metalness: 0.15
});
const fistGeo = new THREE.SphereGeometry(P.foreR * 1.00, 14, 12);
```

**БАГ DRIFT** (в idle loop): оригинальный код делал `position.y += fistBob` каждый кадр → координаты накапливались бесконечно → кулаки улетали в воздух. ИСПРАВЛЕНИЕ:
- Сохраняем `entry.base = { fistL_pos: ...clone(), ... }` при первом тике
- В тике делаем **`position.y = base.fistL_pos.y + fistBob`** (установка, не `+=`)
- То же самое для forearms.rotation.x, shoulders.y, knees.y

Без этого фикса видимые кулаки через ~20 секунд игры улетают в стратосферу.

### 4.5 Ботинки — scaled sphere
```js
const footGeo = new THREE.SphereGeometry(0.16, 14, 10);
footGeo.scale(P.footW / 0.32, P.footH / 0.32, P.footD / 0.32);
```
Капсулообразная форма — без плоских торцов цилиндра.

### 4.6 Позиционирование ведущей руки (stance)
Блок `// LEAD ARM (left) — extension driven by P.leadArmExt` — логика согнутой / вытянутой руки. Угол `upperLAngle` интерполируется от `-0.50` (прижата к лицу) до `-1.20` (вытянута). **Не забыть**: кулаки позиционируются в конце предплечий:
```js
const foreLTipY = upperLTipY - Math.cos(foreLAngle) * P.foreH;
const foreLTipZ = upperLTipZ + Math.sin(-foreLAngle) * P.foreH;
fistL.position.set(-P.shoulderX - 0.06, foreLTipY, foreLTipZ);
```

---

## 5. Материалы — палитра

```js
matBody    = 0x3e4148  // основной цвет тела/костюма (тёмный steel-blue)
matPants   = 0x2a2d34  // штаны, hip, колени
matSneaker = 0x14161b  // ботинки
matSkin    = (variant === 'predator') ? 0xc48573 : 0xd4a088  // голова
matGlove   = 0x2a2d34  // кулаки — почти чёрный
```

Все `MeshStandardMaterial`, **никакого `flatShading: true`** — иначе грани цилиндров видны. Нужны плавные нормали.

---

## 6. Idle‑анимация — интеграция

В главном render loop:
```js
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  tickIdleAnimations(clock.getElapsedTime());
  renderer.render(scene, camera);
}
```

Добавление fighter'а в сцену:
```js
const container = new THREE.Group();       // wrapper — для idle sway всего тела
container.position.set(0, 0, 0);
scene.add(container);
const fighter = makeFighterLowPoly('warden');
container.add(fighter);                    // fighter будет children[0] у container
registerIdleFighter(container, 0);         // phase offset — для рассинхрона нескольких бойцов
```

**Важно:** `tickIdleAnimations` ожидает что inner (реальный fighter) — это `container.children[0]`. Любая обёртка ломает доступ по индексам. Если добавляешь glow‑диск под ногами — добавляй его **после** fighter'а (`container.children[1]`) или в отдельный parent.

---

## 7. Pitfalls (часто ломается при переносе)

1. ❌ **Менять порядок `g.add(...)` вызовов в makeFighterLowPoly** — `tickIdleAnimations` лазит по индексам 0..21, перестановка = всё сломано.
2. ❌ **Забыть `torsoGeo.scale(1, 1, 0.60)`** — получится тыква со спины.
3. ❌ **Забыть entry.base snapshot в idle loop** — кулаки улетят.
4. ❌ **Использовать `flatShading: true`** — проявятся facets, персонаж станет «гранёным».
5. ❌ **Ставить fighter напрямую в scene** без wrapper‑группы — idle sway (`inner.position.x = sway`) применится к fighter‑inner, но wrapper‑sway не сработает. Нужен: `scene → container → fighter → (22 parts)`.
6. ❌ **Окрашивать перчатки в цвет архетипа** (золотой/розовый) — выглядит как неоновые шарики. Оставлять тёмными.

---

## 8. Промпт для Claude Code

Скопируй в начало задачи:

> Перенеси модель бойца из `hexlash_v24.html` в существующий проект.
>
> **Источник:** `hexlash_v24.html` — prototype файл. Функции, которые нужны:
> - `makeFighterLowPoly(variant)` — строки ~6051–6395
> - `registerIdleFighter`, `tickIdleAnimations` — строки ~6416–6480
>
> **Контракт:** возвращает `THREE.Group` с **22 детьми в фиксированном порядке** (индексы 0..21 — см. `HANDOFF_FIGHTER_MODEL.md` раздел 2). Порядок `g.add(...)` нельзя менять — idle анимация обращается по индексам.
>
> **Критично:**
> 1. В torso сохрани `torsoGeo.scale(1, 1, 0.60)` — без этого спина выпирает.
> 2. В idle loop сохраняй `entry.base` snapshot позиций кулаков/плеч/коленей и **устанавливай** `position = base + offset`, а НЕ `+=`. Без этого кулаки дрейфуют вверх и улетают в стратосферу через ~20 сек.
> 3. Перчатки тёмные (`0x2a2d34`), не цвет архетипа.
> 4. Не использовать `flatShading: true`.
> 5. `MeshStandardMaterial` везде.
>
> **Интеграция:**
> - Создавай wrapper `Group` и клади fighter первым ребёнком:
>   `container.add(makeFighterLowPoly('warden')); registerIdleFighter(container, 0);`
> - В render loop: `tickIdleAnimations(clock.getElapsedTime());`
>
> **Варианты:** `'warden'` (коренастый) или `'predator'` (высокий/жилистый). Добавить свой — extend объект `P` внутри функции, все геометрии пересчитаются автоматически.
>
> **Остальные детали и pitfalls** — в `HANDOFF_FIGHTER_MODEL.md`.

---

## 9. Что НЕ переносить

В `hexlash_v24.html` есть вторая, неиспользуемая функция `makeFighterSemiReal` (~строка 6472) — это старая hi‑fi версия с hoodie. Игнорировать, в продакшен не тянуть.

---

## 10. Тест‑чеклист после переноса

- [ ] Fighter отрисовывается без console errors
- [ ] Оба варианта (`warden`, `predator`) выглядят различно (warden — коренастый; predator — выше, тоньше, вытянутая рука)
- [ ] Idle работает: лёгкое дыхание торса, weight‑sway, bob кулаков
- [ ] **Через 2 минуты в idle кулаки НЕ улетели** (главный тест drift‑бага)
- [ ] Спина плоская, не выпирает как шар сзади
- [ ] Перчатки тёмные, в тон телу
- [ ] Плечи/локти/колени гладко сливаются с цилиндрами рук/ног (без видимых швов)
- [ ] Голова округлая, без граней

---

## ⚠️ Поправка для следующего чата (добавлено в Эпике 0)

**В прототипе `hexlash_v24.html` используется Three.js r128**, а не r150+ как указано в разделе 1 этого документа. Проверено grep-ом исходника (строка 5035: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`).

Используемые в r128 geometry — `LatheGeometry`, `SphereGeometry`, `CylinderGeometry`, `BoxGeometry`, `MeshStandardMaterial`, `TorusGeometry`. Все они в r128 есть. Совместимость с актуальной проектной версией Three.js — проверить в Эпике 1.
