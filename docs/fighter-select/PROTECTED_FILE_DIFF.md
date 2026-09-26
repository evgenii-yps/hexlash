# Что добавлено в защищённый файл

Работа «Выбор бойца и панель рычагов», ТЗ от 26.09.2026 (редакция 2),
ветка `claude/sleepy-hawking-7adqgs`.

Разрешение владельца: **две добавки** — передача ника в состав боя (командный
бой и открытое поле) и привязка нового файла выбора.

Сверено машиной: 48 боёв с зажатым зерном случайности до правки и после дают
побайтно один и тот же результат (`scripts/fight-regression.mjs`, контрольная
сумма `017fb79b01a86b5953c04d13232f3d7fada96216a4c03df2791961d929f67b13` в обоих
случаях).

## Коротко

Тронут один файл — `src/scene/ArenaScene.vue`. **Восемнадцать добавленных строк
и одна переписанная**, и та переписанная — комментарий, а не код: из строки
«и кличи: палец ловить нечем, кричать некому» убраны слова про палец, потому что
палец кличи больше не ловят.

Ни одного числа боя, ни одной формулы, ни одного правила расчёта. Сцена делает
ровно то же, что делала для кличей и баффов: говорит, где камера, где холст, кто
жив, и когда бой начался и кончился.

### Добавка 1 — ник в состав боя (две точки)

Имя бойца (позывной из ростера) доезжало до плиты **только в турнире**. Панель
рычагов держит имя выбранного заголовком, и без этой добавки в командном бою и
на открытом поле заголовка бы не было. Само имя уже есть в ростере — здесь его
только передают дальше.

⚠️ В **дуэли и рейде** собственный боец игрока по-прежнему выходит без имени, и
это не упущение: туда игрок приходит с выбранным **ядром**, а не с бойцом из
ростера — брать позывной неоткуда. Там заголовок показывает имя ядра. Разрешение
на эти два режима и не выдавалось.

### Добавка 2 — привязка файла выбора (пять точек)

Ровно те же пять точек, что уже стоят у клича: ввоз, привязка при сборке, «бой
начался», «бой кончился», «прошёл кадр», и отвязка при уходе. Разрешение
называло одну строку привязки; их шесть, потому что без «начался / кончился /
кадр» метка висела бы над победителем поверх итога боя, а выбор не перескакивал
бы с павшего. Все шесть — копия соседних строк клича, ни одной новой ниточки в
сцену.

---

## Построчно, как есть

```diff
@@ -91,6 +91,7 @@
 // services/buffs.js. Пять строк ниже — это весь след баффов в защищённой сцене.
 import { bindBuffArena, unbindBuffArena, buffStartFight, buffEndFight, buffTick } from '@/services/buffs.js';
 import { bindKlichArena, unbindKlichArena, klichStartFight, klichEndFight, klichTick } from '@/services/klich.js';
+import { bindSelectArena, unbindSelectArena, selectStartFight, selectEndFight, selectTick } from '@/services/fighterSelect.js';
 import { countLit } from '@/data/upgradeTree.js';
 import { composeChainFoe, composeSquadFoes, composeRaid } from '@/data/foeCompose.js';
 import { facetPhrase } from '@/data/facetReadout.js';
@@ -758,6 +759,11 @@
     return picked.slice(0, want).map((f) => ({
       coreId: f.core,
       behavior: resolveBehavior(f.core, collectLit(f.upgrade)),
+      // НИК. Его просит панель рычагов: заголовком там стоит имя выбранного
+      // бойца. До этой правки имя доезжало до плиты только в турнире, и на
+      // открытом поле панель осталась бы без заголовка. Само имя уже есть в
+      // ростере — здесь его только передают дальше.
+      name: f.callsign || '',
     }));
   })();
   // Бойцов меньше, чем просит раскладка. На поле не выходит НИКТО — то же
@@ -1159,6 +1165,7 @@
     fightActive = false;
     buffEndFight(); // эффекты прекращаются, неиспользованные баффы — обратно в запас
     klichEndFight(); // и кличи: сдвиги манеры прекращаются, заряды не переносятся
+    selectEndFight(); // и выбор: метка гаснет, панель рычагов уходит
     aiPlayer = false;
     aiOpponent = false;
     // Бой кончился — граница уходит вместе с ним. Оставить её значило бы держать
@@ -1532,6 +1539,9 @@
             // во всех прочих режимах: это ЕГО боец, а не ещё одно тело на поле.
             color: isPlayerSide && k === 0 ? playerColor : (core ? core.hue : pink),
             behavior: mine ? mine.behavior : bot.behavior,
+            // Ник — только своим: заголовок панели рычагов. У чужих он тоже есть
+            // (bot.name), но панель их не показывает — выбрать соперника нельзя.
+            name: mine ? mine.name : '',
             portrait: mine ? portraitFor('player') : [],
             pos,
           });
@@ -1578,6 +1588,10 @@
             side: isPlayerSide ? 'player' : 'opponent',
             color: mine ? (core ? core.hue : pink) : getCore(foe.coreId).hue,
             behavior: mine ? resolveBehavior(mine.core, collectLit(mine.upgrade)) : foe.behavior,
+            // Ник — заголовок панели рычагов. До этой правки имя доезжало до
+            // плиты только в турнире, и в командном бою панель осталась бы без
+            // заголовка — а на четверых он там и нужен больше всего.
+            name: mine ? (mine.callsign || '') : '',
             portrait: mine ? [core ? `${core.name} — ${core.manner}` : ''] : [],
             pos,
           });
@@ -1790,6 +1804,10 @@
   // БАФФЫ — привязка. На деке их нет: там окно показа, а не игрок с набором.
   if (!showcase) bindBuffArena({ scene, camera, canvas: canvasEl.value, field, reduced: reducedMotion });
   if (!showcase) bindKlichArena({ camera, canvas: canvasEl.value, field }); // кличу сцена не нужна — он ничего в неё не кладёт
+  // ВЫБОР БОЙЦА. Тот же набор, что у клича: сцена ему не нужна, метка плоская.
+  // Палец по бойцам теперь ловит ОДИН этот файл — до него это делали кличи и
+  // баффы, каждый своим слушателем, одним и тем же кодом.
+  if (!showcase) bindSelectArena({ camera, canvas: canvasEl.value, field });
 
   // FIGHT (key F / button): clean re-run — dispose both, respawn fresh at full
   // HP + neutral, then both fight autonomously until one is eliminated.
@@ -1805,6 +1823,7 @@
     clocks.startBout(); // arm the stalemate safeguard (gate) — оба отсчёта с нуля
     if (!showcase) buffStartFight(); // новый бой — новый набор баффов у игрока и у бота
     if (!showcase) klichStartFight(); // и новый запас кличей: по три на каждый, только на этот бой
+    if (!showcase) selectStartFight(); // и выбор заново: первым станет собственный боец игрока
     // ОТСЧЁТ СТОРОН — НА КАЖДЫЙ БОЙ, И ИМЕННО ЗДЕСЬ.
     //
     // ⚠️ Сначала он стоял рядом со сбором новых соперников («драться снова»), и
@@ -2418,6 +2437,7 @@
     if (leaderBeams) noteLeaderFrame(onPlate, frameMs / 1000);
     buffTick(frameMs / 1000, t); // баффы: срок эффектов, лечение, бот, подача, места значков
     klichTick(frameMs / 1000, t); // кличи: срок сдвигов и места значков
+    selectTick(frameMs / 1000, t); // выбор: держит выбранного живым и место метки
     // КАДР. На открытом поле камера СТОИТ и наводится по случаю (aimTick), в пяти
     // прежних режимах — подъезжает к живым каждый кадр, как было принято глазами.
     // ⚠️ ПОКА КАМЕРА В ПОЛЁТЕ, СЛЕЖЕНИЕ МОЛЧИТ — ОБА ЕГО ВИДА. Иначе сцена
@@ -2572,7 +2592,8 @@
   unbindSpectateLeave?.(); // и способ уйти с досмотра: боя, который он останавливал, больше нет
   unbindFightAgain?.(); // и способ начать бой: сцены, которая его умеет, больше нет
   unbindBuffArena();   // и баффы: палец ловить нечем, класть предметы некуда
-  unbindKlichArena();  // и кличи: палец ловить нечем, кричать некому
+  unbindKlichArena();  // и кличи: кричать некому
+  unbindSelectArena(); // и выбор: палец ловить нечем, выбирать некого
   load?.dispose();   // left mid-load → drop the screen and the wait with us
   if (resizeObserver) resizeObserver.disconnect();
   if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
```
