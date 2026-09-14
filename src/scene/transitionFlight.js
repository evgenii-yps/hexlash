// transitionFlight.js — the cinematic flight between the player HOME and the MODE
// plates. There is no second screen any more: FIGHT does not navigate, it flies.
// Home and the two mode plates stand in ONE world a long way apart, and this file
// is the director that moves the camera between them, breathes the fog, and stands
// the HEXLASH sign in the corridor for a beat on the way out.
//
// What it owns (built once, at scene init — never at transition time, so the flight
// can never stall on an asset):
//   · the camera path (two variants — see CONFIG.variant),
//   · the fog envelope (scene.fog distance falloff + colour),
//   · the 3D HEXLASH sign.
//
// FOG DISCIPLINE — the fog is atmosphere, not a curtain, and it is ONE layer: the
// scene's own linear distance falloff and nothing else. It is never a flat CSS film
// over the canvas (that would delaminate the picture), never true volumetrics (way
// too dear for a phone), and — since this pass — never soft billboards either.
//
// Billboards were the third thing tried here and they are gone for good. A billboard
// is a flat picture turned to face the camera: seen head-on it reads as a DISC with
// an edge, its radial gradient reads as a bright core with a halo ringed round it,
// and it slides against the world as the camera moves. That is a sticker on the lens,
// which is precisely what the falloff was rebuilt to stop being. Honest depth with no
// volumetric fakery beats fakery with visible seams, so if the corridor ever needs
// more life it gets it from the DENSITY (see fogBreath), never from added geometry.
//
// SIGN DISCIPLINE — the HEXLASH sign is real extruded geometry standing in the world,
// NOT DOM text, not a sprite. It is monochrome, COLD WHITE, and it GLOWS: since
// 13.09.2026 the owner separates the flat mark in the chrome (matte, as it always
// was) from this sign, which is a lit object inside the world. The rule that came
// with that change: pink glow belongs to action, white glow belongs to the world —
// so there is no pink on this object and there never will be.
//
// Exports: FLIGHT (the tuning block), createTransitionFlight.
import * as THREE from 'three';
import { FOG_COLOR, LIGHTING, MATERIALS } from '../data/sceneTokens.js';
import { flickerAt } from '../data/signFlicker.js';

// ─────────────────────────────── Tuning ───────────────────────────────
export const FLIGHT = {
  // ── shape of the world ──
  modeZ: 30,           // how far down -Z the mode plates stand from the home slab
  modeY: 0,            // ground height of the mode area (home slab base is 0)

  // ── camera path ──
  // 'B' — "взлёт": the camera lifts and pulls back off the home first (the home
  //       stays under us, alive and shrinking), then swings forward to the plates.
  // 'A' — "пролёт": the camera runs forward and down, the home passes beneath it
  //       and off the bottom of frame, and it comes out at the plates.
  // One continuous path either way — never two moves glued together.
  variant: 'B',
  riseB: 3.2,          // B: how far up the opening lift goes
  retreatB: 3.6,       // B: how far back (away from the look point) it pulls
  diveA: 6.5,          // A: how far forward the opening run goes
  dropA: 1.9,          // A: how far down it dips over the slab
  midLift: 1.4,        // hump height over the corridor midpoint (see buildPath)
  approachBack: 6.0,   // how far short of the final pose the approach point sits
  approachLift: 1.8,   // how far above the final pose the approach point sits

  // ── time ──
  duration: 3.7,       // seconds, forward flight (owner band 3.4–4.0)
  reverseFactor: 0.5,  // ← BACK runs the same road at half the length
  settle: 0.15,        // a tap mid-flight rides this out to the end pose (no teleport)

  // Shortening repeats was tried and PULLED: it dropped the sign from the second
  // flight onward, which reads as the sign breaking rather than as restraint. The
  // machinery is kept behind this flag in case a final duration brings it back —
  // when on it shortens by `repeatFactor` AND drops the title beat, as before.
  // Against staleness we have the tap-to-skip, which is always there.
  shortenRepeats: false,
  repeatFactor: 0.6,

  // The camera's start is held in SECONDS, not as a share of the duration: a longer
  // flight must not push the opening back with it. FIGHT has to answer at once —
  // any delay there reads as lag, not as cinema. Everything past the start scales
  // with the duration, so a slower flight puts its extra time where it belongs: the
  // middle of the move and the decel into the arrival.
  camStartSec: 0.18,
  easeTail: 3.0,       // how long the decel into the arrival runs (higher = longer)

  // Phase marks, as fractions of `duration`. They OVERLAP on purpose: the move must
  // not read as a sequence of discrete steps.
  fogPeakAt: 0.5,      // where the atmosphere is thickest
  fogPower: 1.5,       // shape of the rise/fall (higher = later, sharper peak)
  signIn: 0.42, signHold: 0.58, // the title beat swells in over this stretch
  // The 2D chrome's own fade is NOT timed here — it rides a CSS transition on the
  // `.is-away` class in HomeView, so the browser owns it and it cannot drift out of
  // step with a stalled frame. Change its length there.

  // ── fog: a DISTANCE FALLOFF, not a curtain ──
  // The curve is LINEAR (near → far), not exponential, and that is the whole trick.
  // The job is asymmetric: leave the picture in front of the player exactly as it
  // was, and still bury the far end so the plates and the sign are not readable from
  // the home. An exponential curve cannot do both — it bites from the first unit, so
  // the only density that buries something 30 units out also murks the fighter at 5.
  // A linear curve has a `near` below which NOTHING is fogged at all (that is the
  // "3–5 units unchanged" half) and a `far` at which everything has BECOME the sky
  // (that is the "sinks into the background" half). Past `far` a fogged object is
  // the fog colour and nothing else, whatever its material — which is why dimming
  // the plate materials alone never hid them: fog is added after the material, so a
  // near-black plate still drew as a DARKER-than-sky cut-out.
  //
  // The curve is also asymmetric BY END, blended on the same presence the plates
  // ride. Standing at the home the far end has to vanish; standing at the plates the
  // home has to survive as a distant silhouette — that is the point of being able to
  // turn round. One curve cannot serve both, so there are two and they cross-fade.
  fogNearHome: 14,     // at the home: nothing inside this is fogged at all
  fogFarHome: 26,      // …and the plates (modeZ = 30) sit PAST it ⇒ they are the sky
  fogNearMode: 16,     // at the plates: the plates and the sign stay clean
  // …and the home. This one is set by the answer to "what is the player allowed to
  // KNOW is over there", not by taste. At 62 the home kept about half its contrast
  // and every part of it was nameable from the plates — the lamps, the fighter, the
  // hex grid, the rim of the slab. It has to read as "something is there and I can't
  // tell what", so the curve is pulled in to just INSIDE the home's own distance
  // (the camera parks ≈38.6 out, the slab spans ≈36–41): the back of it is the sky
  // outright and the front keeps a tenth of itself, which leaves mass without detail.
  // Measured from the parked pose, whole-home contribution: 67 levels at 62, 11 here.
  // Do not push this below ~36 — that is where the mass goes too, and a hole in the
  // world reads worse than a legible home.
  fogFarMode: 39,
  fogNearFlight: 9,    // mid-flight the curve tightens — that IS the atmosphere beat
  fogFarFlight: 34,    // …and opens again on arrival, on the same envelope
  // Keep the fog DARK. The backdrop dome is unlit (fog:false), so a pale fog would
  // make distant objects brighter than the sky behind them — depth read backwards,
  // and the plates would hang in the air like cut-outs. The fog's job is to sink
  // distance into the dark, and the smoke tone is the only colour it is allowed to
  // lean on while doing it. Raise this only if the owner wants a paler night.
  fogTint: 0.1,        // how far the fog colour leans to the smoke tone at peak
  smoke: 0x96a1b0,     // cold dust-grey — never white, never warm
  // The colour the falloff CONVERGES ON, and the one number here that is not free:
  // it has to be the sky the far end is supposed to disappear into. Past `far` a
  // fogged object is this colour and nothing else, so if it differs from the backdrop
  // behind it the object does not vanish — it turns into a flat patch of the wrong
  // hue, which is exactly how the plates stayed legible from the home even while
  // their materials were dimmed to nearly black. Matched by eye to the backdrop's
  // colour. С 12.09.2026 у купола нет градиента вовсе — он весь --void, тот же
  // цвет, что и FOG_COLOR, так что совпадение уже не «подобрано глазом», а
  // выполняется по построению.
  // Тон тумана — общий для всех залов (FOG_COLOR = --void = дальний край купола).
  // Раньше дом стоял в своём чёрном 0x0F0E11, на семь пунктов светлее остальных:
  // передний план уходил в один чёрный, а купол за ним — в другой.
  fogRest: FOG_COLOR,

  // ── the breath ──
  // Removing the billboards left the corridor perfectly still, and perfectly still
  // air is a picture rather than a place. Life comes back as DENSITY, not as things:
  // how far you can see wanders very slowly and very slightly. It must sit on the
  // edge of noticing — if a player can watch this happen it is too strong, and it is
  // the fastest way to end up with a "breathing" screen that reads as a bug.
  // It scales the (far - near) SPAN, so `near` is untouched and the near field stays
  // provably fixed, exactly as the linear curve promises.
  fogBreath: 0.035,    // ± fraction of the span
  fogBreathW: 0.13,    // rad/s ⇒ ~48 s a cycle

  // ── HEXLASH sign ──
  //
  // ВЫКЛЮЧАТЕЛЬ вывески и её отмели. Живой: читается каждый кадр в applySignOpacity
  // (там и так решается, видна вывеска или нет — вето обрезки + порог прозрачности,
  // и это третье условие), и он же задаёт состояние, в котором группа РОЖДАЕТСЯ, —
  // чтобы не было кадра до первой подгонки, когда её могло бы нарисовать.
  //
  // ИСТОРИЯ. 14.09.2026 владелец снял вывеску с экрана на время демо — выключателем,
  // а не удалением: на этот блок ушли недели замеров, и он документирует не только
  // сегодняшние числа, но и все отвергнутые варианты. В тот же день решение было
  // ОТМЕНЕНО (Decisions Log, пятнадцатая запись): вывеска остаётся на всех экранах.
  // Выключатель оставлен на месте — он стоит копейку и уже один раз пригодился.
  //
  // Отмель — ребёнок группы вывески, уходит вместе с ней и отдельного выключателя не
  // просит. Больше эта группа в сцену не добавляет НИЧЕГО: ни света, ни тени, ни
  // подсветки пола (в этом файле нет ни одного источника света и ни одного
  // castShadow). И перелёт от неё не зависит: его средняя точка взгляда целится в
  // ОСЬ коридора на глубине вывески — см. l2 в buildPath, там числа отсюда, а не
  // сам объект.
  signShown: true,
  //
  // ── ГДЕ МЫ ОСОЗНАННО РАСХОДИМСЯ С ЭТАЛОНОМ ────────────────────────────────────
  // Эталон вида — docs/design-handoff/hexlash_sign (README + params.json), принят
  // владельцем 14.09.2026. Он задаёт ВИД и ничего больше: положение, размер в кадре,
  // дистанция и яркость после тумана меряются здесь и оттуда не берутся.
  //
  // Пять расхождений. Каждое — решение, а не недоделка:
  //
  //  1. ШРИФТ. Эталон: Saira Condensed 900. Здесь: семь глифов, обведённых руками
  //     (см. GLYPHS). Загрузчика шрифтов в проекте нет, а завести его значит
  //     положить новый асинхронный файл на критический путь перелёта. Форма
  //     повторяет брендовое начертание; это не тот же шрифт и никогда им не станет.
  //
  //  2. МЕЖБУКВЕННОЕ. Эталон: +1,5 % em. Здесь: SIGN_TRACK = 0.085 em, и это НЕ
  //     та же величина. У настоящего шрифта каждый глиф несёт свои боковые поля, и
  //     +1,5 % добавляется к ним; у обведённых руками контуров полей нет вовсе —
  //     они идут от 0 до своей ширины, — поэтому весь просвет между буквами несёт
  //     этот один параметр. 0.085 ≈ два боковых поля (~4 % каждое) плюс те самые
  //     1,5 %. Поставить сюда 0.015 — слепить буквы, ровно то, от чего эталон и
  //     предостерегает.
  //
  //  3. ГРАДИЕНТЫ НА ГРАНЯХ. Эталон: фронтальная грань светлеет сверху и темнеет
  //     снизу до #DFE3E9, боковая стенка — градиент #A9AEB8 → #545A63. Здесь их
  //     нет: это освещённый объект, и тон грани даёт свет зала на фасках
  //     (flatShading), а не заранее нарисованный переход. Мерено: на опорном кадре
  //     буквы 47 px высотой, боковая стенка при signDepth 0.07 уже меньше пикселя.
  //     Красить градиентом нечего.
  //
  //  4. ЧЕТЫРЕ КЛОКА НАД ЯДРОМ ОБЛАКА / «верхний контур не прямая линия».
  //     ⚠️ ЭТО ПРЯМОЙ КОНФЛИКТ ДВУХ РЕШЕНИЙ ВЛАДЕЛЬЦА, суток друг от друга.
  //     13.09 отменено «нижняя треть утоплена в дымке» и потребовано: у отмели
  //     ПОВЕРХНОСТЬ — ровный верхний край, без вздутия под серединой, и ничего
  //     перед буквами выше нижней десятой. Эталон 14.09 просит наверху четыре
  //     несимметричных клока. Выполнено решение 13.09: оно конкретнее, оно измерено,
  //     и на нём держится гарантия «ни одна крупинка не достаёт до букв» (см.
  //     cloudTop). Поднять cloudTopJitter значит эту гарантию сломать. Доложено —
  //     развилка владельца, не этого файла.
  //
  //  5. МЕРЦАНИЕ: «гаснет только ореол, буквы не темнеют». В плоском заголовке
  //     лендинга ореол — отдельный слой, его и гасят. У объёмного знака отдельного
  //     слоя нет: его свечение И ЕСТЬ его emissive. Поэтому гаснет emissive, и
  //     честный здешний эквивалент «буквы сохраняют тело» — дно 0.4, не ноль.
  //     Мерено на полном цикле: буквы проседают до 0.70 средней яркости и ни на
  //     пиксель не сдвигаются (силуэт совпадает на всех 28 пробах). Таблица одна на
  //     лендинг и на вывеску (src/data/signFlicker.js) и здесь не трогалась: она
  //     общая, и правка отсюда переписала бы заголовок лендинга.
  //
  // ── и дальше, ниже, весь набор вывески как он есть ─────────────────────────────
  //
  // A FIXED landmark standing in the corridor, not a title card that follows the
  // camera. It is placed once, at scene init, and never moves again: the player can
  // turn round at the plates and find it still standing there with the home behind
  // it, which is the whole reason it is an object and not a caption.
  //
  // The camera passes well ABOVE it on the way out (the arc humps over the corridor),
  // so it can never be flown through and never needs to blink out to get out of the
  // way — it simply swings past and is left behind.
  // WHERE it stands is now set by READABILITY FROM THE HOME, not by the middle of
  // the corridor. The home's own falloff runs 14 → 27, so at the old 0.55 (≈23.7
  // units out) three quarters of the word had already been replaced by the sky: even
  // pure white came out at about a fifth of its brightness — a grey smudge, whatever
  // colour it was painted. Nothing but DISTANCE fixes that, and buying it by
  // thinning the fog is not on the table (it is the same curve that hides the plates
  // from the home, which must keep working). So the sign has walked up the corridor
  // to where the home's own air still lets it through, and grown to hold its size in
  // frame from further away at the other end.
  // ⚠️ 13.09.2026 — this moved, and the rule that said it could not was retired the
  // same day. "Do not change the distance" had been standing in for "do not make it
  // look too close", and those are different things: how big the word LOOKS is set by
  // its width and the fit rule, while the distance sets how much of its light the air
  // keeps. Held still, it turned every sideways step into a step further away — which
  // is exactly how a week of work ended up choosing between a word in the middle of
  // the frame and a word you could read.
  //
  // The three now work together. x takes the word to the middle of the reference
  // frame, z brings it back inside the fog so the move costs nothing, and the width
  // comes down so the size on screen does not change. Solved by measurement, each
  // depth with the x that centres it and the width that holds 17.3 % of the frame:
  //
  //     z      x      width   distance   (fog is gone by 26)
  //   −15   −12.92    9.46      28.3     ← centre, and unreadable
  //   −13   −11.58    8.75      25.9
  //   −11    −9.96    7.94      23.4
  //   −10    −9.10    7.52      22.1     ← here
  //    −9    −8.28    7.11      20.8
  //
  // 0.3333 · 30 = 10. A third of the way down the corridor rather than half.
  //
  // ⚠️ AND IT IS ALSO WHAT FIXED THE MODE SCREEN, which was asked for as a separate
  // job and turned out not to need one. At half the corridor the sign stood level
  // with the plates and read as standing ON them — the word over FORGE, across the
  // mentor. Brought back to a third it is far behind them again, and passes above
  // their silhouettes instead of through them.
  //
  // Measured, not eyeballed, and on silhouettes rather than boxes: three frames per
  // pose — everything / sign hidden / sign and plates hidden — so the word's own
  // pixels and the stage's own pixels are both exact, and a button is not mistaken
  // for a plate. Per column, the word's lowest pixel against the stage's topmost.
  // Over the whole camera envelope the player can reach there (azimuth × polar 60-86°
  // × zoom 5.6-12.8, 900 poses), the worst overlap anywhere is 8 px deep across 2
  // columns — 0.4 % of the word — at full zoom-in with the camera almost level, where
  // the word hangs in the gap between the two plates and grazes FORGE's top edge.
  // At the default framing the word never shares a column with the stage at all.
  //
  // So no height change was made. The brief's remedy was "raise it", and raising it
  // would have had to be paid for at home, where the chrome is overhead.
  signAt: 0.3333,      // where along the corridor it stands (0 = home, 1 = the plates)
  // WHERE ACROSS the corridor it stands — and this is the one that was wrong for a
  // week. The sign sat on the corridor's own axis, x = 0, which sounds like the only
  // defensible place for it until you trace the start camera: it stands at x = +4.6
  // and aims at the fighter near the origin, so its line of sight crosses the sign's
  // plane (z = −15) at x = −12.9. Frame centre in that pose IS x = −12.9. A sign on
  // the axis therefore lands far to the RIGHT of centre — under SHOP and the cabinet,
  // every time, in 100 % of the samples with the camera un-turned.
  //
  // Two days were spent trying to fix that with height. Height cannot fix it: raising
  // the word walks it further up behind the same buttons, and to clear them over the
  // top it would have to reach y ≈ 4.0, where its own top is thirty pixels off the
  // frame. Lowering it clears them, which is what 12.09 did, and the owner's answer
  // was that the word now sits in the dark with nothing around it — correct, and not
  // the point.
  //
  // Moving it sideways is the only lever that takes the buttons out of the argument
  // altogether, and it is cheap: the chrome starts at x = 635 on the reference layout,
  // and the word's right edge crosses under that line at about x = −4.5. Measured at
  // the start azimuth, 844×390:
  //
  //         x = 0    x = −4   x = −5   x = −6
  //   right   764      648      623      604
  //   clear    no       no      yes      yes
  //
  // −6 rather than −5 because the chrome's left edge is not a constant: it moves with
  // the SHOP label, and a locale with a longer word walks it left onto a sign parked
  // at the minimum.
  //
  // …and then −9 rather than −6, because −6 cleared the chrome on the layouts that
  // matter and left two that it did not: 568×320 had the word's right end still hard
  // against SHOP, and portrait cut it in half at the frame's edge. Measured through
  // the fit rule, at the start azimuth:
  //
  //                    844×390   568×320   portrait   1920
  //   x=−6,  w=7.0      17.4 %   does not   cut off    21.2 %
  //                               fit
  //   x=−9,  w=8.2      17.7 %    8.3 %     30.4 %     21.5 %
  //   x=−12.9, w=9.6    17.6 %   21.5 %     64.6 %     21.4 %
  //
  // −12.9 is where the start camera's own line of sight crosses this plane, so the
  // word would stand dead centre and every layout passes. It was REJECTED, and not on
  // the table: sideways is also AWAY, and the home's fog is gone by 26 units. At −6
  // the sign is 24.4 out, at −9 it is 26.0, at −12.9 it is 28.6 — past the end of the
  // curve, where a word in the middle of the frame would be a smudge. That is the
  // complaint this whole run started from, so the centre of the frame is bought at the
  // price of the thing that was wrong in the first place.
  //
  // ⚠️ …and −9 was tried and MEASURED BACK OUT for the same reason, one step earlier
  // on the same curve. It passed every layout — that was the point of it — but at 26.0
  // units it sits exactly where the home's fog runs out, and the light it lost could
  // not be bought back. Both positions taken to the same peak against the FIGHT
  // button (81 %), each with its own glow, start frame:
  //
  //                             peak   mean   p90      at 1920: mean
  //   x=−6,  w=7.0, glow 3.30    200     94    170              101
  //   x=−9,  w=8.2, glow 7.6     199     76    156               82
  //
  // Same peak, and eighteen per cent less word under it: the glow can drive the
  // brightest pixel up the ceiling but cannot drag the body of the letters with it
  // through that much air. So −6 stands, and the two layouts −9 was bought for —
  // 568×320 and portrait — are served by the no-clipped-word rule instead.
  //
  // ⚠️ …and then to −9.10, which is where the start camera's own line of sight crosses
  // the sign's plane once that plane came closer (see signAt). The word is now in the
  // MIDDLE of the reference frame — measured offset from frame centre, 0.8 px — and
  // the depth it was brought to keeps the distance at 22.1 units, well inside the fog.
  // The earlier attempts at the middle failed because they tried to get there
  // sideways alone, which walks the word out of the light.
  //
  // ⚠️ Accepted by the owner as the price: this centres ONE frame — 844×390, camera
  // un-turned. Turn the camera or change the screen's proportions and the word moves,
  // because it is an object standing in a room and not a label pinned to the glass.
  //
  // ⚠️ AND THE SAME FACT HAS A SECOND PRICE, which no placement can pay off. The home
  // orbit is unclamped (minAzimuthAngle = −Infinity), so the camera comes all the way
  // round, and a world object under a full turn must eventually cross the screen's
  // top-right corner — which is where SHOP and the cabinet live. Walked round 1° at a
  // time from the start pose, reference frame:
  //
  //                       poses on screen   under the buttons   worst short of 20 px
  //   x=−6,  z=−15, w=7.0       136                41                  38 px
  //   x=−9.10, z=−10, w=7.52    147                42                  33 px
  //
  // So the "zero samples over the whole orbit" line is not met here — and was not met
  // before either; the two positions fail it about equally. It is not reachable by
  // moving the sign at all: clearing the corner needs the word pushed DOWN the screen,
  // and shrinking to clear it costs 38 % of the size at the worst pose, which is the
  // size the owner accepted. Reported; the owner's call, not this file's.
  //
  // ⚠️ 13.09.2026 — AND THE MODE SCREEN IS NOT A SIDEWAYS PROBLEM EITHER. The note
  // under signAt says a third of the corridor fixed it. Re-measured on the right
  // question, it did not — and the reason the old pass came back clean is the pass,
  // not the sign. It counted the word's VISIBLE pixels against the stage's, and the
  // hexarch stands IN FRONT of the word: every pixel he covers stops belonging to the
  // word, so the one thing the test was aimed at is the one thing it cannot see.
  //
  // Asked the other way — does the word's OWN silhouette, occlusion set aside, cross
  // the hexarch's — over the mode orbit (azimuth × polar 60-86° × zoom 0.7-1.6, 5°
  // steps; 220 of those poses have the word on screen at 844×390) it crosses him in
  // 28 of them, worst 44 px deep across 69 columns, at the closest zoom around
  // azimuth 200°. 1280×720: 21 poses, 42 px. 1920×1080: 23 poses, 85 px. All three
  // far past the "8 px across 2 columns" the old metric reported.
  //
  // SIDEWAYS CANNOT CLOSE IT, and that was measured across the whole axis rather than
  // argued — seventeen positions from −20 to +4, same envelope, 844×390:
  //
  //     x       −20  −16  −12  −9.10   −6   −2    0   +4
  //   poses      18   23   26     28    27   25   23   17
  //   worst px   35   40   43     44    44   44   44   40
  //
  // It is geometry, not tuning. Over the window the word is on screen for, the
  // hexarch's silhouette sweeps ~215 px and the word's ~840 px, so the two cross at
  // SOME azimuth wherever the word stands; and at every azimuth where they can share
  // a column the word's lower edge is already 5-48 px below his crown. x only picks
  // WHICH azimuth the crossing happens at, and −9.10 already picks the shallowest one
  // at the default zoom.
  //
  // Nor is there room to try: clearing him at the worst pose alone needs 3.2 units
  // one way or 6.4 the other, and the frame rules leave −10.25 … −8.50 (outside that
  // portrait shrinks the word or cuts it) — ±1 unit, ≈ ±25 px against the ~80 px the
  // nearest miss wants. Every position in that band measures the same 27-29 poses /
  // 44 px, and both ends throw away the centring the depth move was bought for: the
  // gap either side of the word on the home screen goes from 0.9 / 1.4 / 1.3 % out of
  // true at 844 / 1280 / 1920 to 8-14 %, and in portrait the word ends up 5 px off one
  // frame edge or 4 px off the other.
  //
  // So the word passes BEHIND him, which is what a landmark twenty units further down
  // the corridor does when somebody stands in front of it. Moving that read needs a
  // lever this line does not own — the height and the depth together, or the plate
  // pair's own layout. Reported; the owner's call, not this file's.
  signX: -9.10,        // across the corridor — the start camera's own axis
  // HEIGHT. Back where v4 left it, and now for a different reason: with the sign out
  // from under the buttons, the chrome no longer has an opinion about its height at
  // all. What is left is the frame's own top edge, and 0.6 keeps thirty-odd pixels of
  // it. The 12.09 answer of −0.35 was the height the buttons forced when the word was
  // still under them; nothing forces it now.
  signY: 0.6,          // height — clear of the frame's top edge, chrome not involved
  // Real world width, at full size. 7.0, up from the 5.4 it held on the axis, and the
  // increase is the PRICE OF THE SIDEWAYS MOVE, not a change of mind about size: a
  // word pushed off the view axis is seen more obliquely, and is further away, so the
  // same object reads narrower. Each step of the move had to be paid for:
  //   x = 0,  w = 5.4 → 18.0 % of the reference frame
  //   x = −6, w = 5.4 → 13.7 %     … w = 7.0 → 17.4 %
  //   x = −9, w = 5.4 → 12.4 %     … w = 8.2 → 17.7 %   (measured back out — see signX)
  //
  // …and then DOWN to 7.52, because the word also came closer. Sideways had been the
  // only lever and it cost size; with the depth free to move as well, the two cancel:
  // at z = −10 and x = −9.10 the word is in the middle of the frame AND the same
  // 17.3 % of it wide as before. The size on screen is what the owner accepted, and
  // nothing about it has changed — only the object's distance and its world size did,
  // in opposite directions.
  //
  // ⚠️ 14.09.2026 — and DOWN again to 72 % of that, 7.52 → 5.4144, which is a size
  // decision and not a framing one. The designer measured the word's own legibility
  // boundary: at 72 % it still reads as a sign standing over the gates; at 60 % the
  // bank collapses to a kerb, the halo stops separating the word from the haze, and
  // the object reads as a caption. Below 70 % it fails reliably. So 72 % is the FLOOR
  // of the usable band (the reference recommends 72-75 %), and the whole of the
  // remaining size budget is spent here.
  //
  // What it was spent ON was the hexarch on the FORGE plate, and it did not buy him.
  // Measured on silhouettes, occlusion set aside, over the whole mode orbit
  // (azimuth 0-355° in 5° steps × polar 60-86° × zoom 0.7-1.6; 1440 poses), the word
  // against the hexarch, the bob pinned at its top so two runs can agree:
  //
  //     of full   844x390            1920x1080
  //               poses   worst px   poses   worst px
  //     100 %       43       43        44      105
  //      85 %       36       36        41       89
  //      72 %       27       30        35       74     ← here
  //      60 %       25       25        31       62
  //      40 %       13       17        19       42
  //      20 %        9        9         9       21
  //       5 %        5        3         5        5
  //
  // Read the last row. At five per cent the word is a dot a third of a unit across
  // and it STILL crosses him in five poses: what is left at that size is the word's
  // own centre, and the centre passes behind him at azimuth ~190° whatever it is
  // wearing. So the column does not reach zero — there is no size at which it does,
  // short of no word at all. Shrinking buys a third of the depth and a third of the
  // poses, and that is the whole of what it can buy. Which lever is left is not this
  // file's to choose: the plate pair's own layout, or the word's height and depth
  // together, or the owner deciding the pass-behind is fine. Reported.
  //
  // ⚠️ "At full size": the word is no longer one fixed size in every layout — see the
  // fit rule, which is what carries this size onto the screens it will not fit.
  signWidth: 5.4144,   // 72 % of the 7.52 measured above — the legibility floor
  // Real thickness, in EM (cap height 1) — the bevels are what catch the light.
  // ⚠️ 14.09.2026 — 0.17 → 0.07, straight off the approved reference
  //   (handoff/params.json: geometry.extrusionDepthOfCapHeight = 0.07). The old
  //   number was never measured against anything; it was picked when the word was a
  //   slab in the dark and it made the letters a quarter as thick again as the face
  //   they are cut from. At the distance this sign stands, that shows up as a second
  //   pale shape beside every stroke rather than as thickness.
  signDepth: 0.07,

  // ── the fit rule ──
  // ONE rule, not a list of exceptions: the word keeps clear air under the top
  // panel, and where it cannot, it shrinks until it does. Nothing here knows about
  // portrait, or about 568×320, or about any other particular screen — the rule is
  // evaluated against whatever the viewport and the panel actually are, so there is
  // no second set of numbers to drift out of step with the first.
  //
  // Why a rule at all, when the sign is an object and objects have one size: because
  // the panel is CSS and the word is geometry, and the two scale by different laws.
  // The panel's bottom edge sits at a near-fixed 59 screen pixels whatever the
  // screen (52 in portrait, where the chrome goes compact), while the word's height
  // on screen grows as the frame gets shorter. On a big screen that leaves 128
  // pixels of air; on the smallest phone in landscape it left none at all. A single
  // world size cannot serve both, and picking one for the worst case would throw
  // away the size the owner asked for on the phone that matters.
  //
  // It is measured at ONE pose — the home start framing — and recomputed only when
  // the viewport changes. So it is not a thing that happens while the player is
  // looking: the word does not breathe as the camera orbits.
  //
  // Continuity, measured across 560…920 px of width at 390 tall and 320…440 px of
  // height at 844 wide: the scale walks in steps of three to six per cent per twenty
  // pixels of viewport and never jumps. The ONE exception is not the rule's: at
  // 576 px the chrome itself changes shape and its lower edge drops seven pixels, and
  // the word has to follow it down — twelve per cent, in one step, because the word is
  // only forty-odd pixels tall and seven of them is a sixth of it. That step belongs
  // to the panel's breakpoint; the guard is hard, so there is nothing to smooth it
  // with that would not be the word sitting in the chrome for a moment.
  //
  // ⚠️ What the rule does NOT fix, and cannot: portrait. There the word is not big,
  // it is elsewhere — it projects to x 503…818 of a 390-wide frame, its near edge
  // 15.6° off the axis against a horizontal half-field of 10.06°. Scaling moves the
  // word toward its own centre, which at x≈660 is off the frame as well, so no
  // positive scale brings it in; the size never binds there either (314 px of word in
  // 374 px of room). Portrait is a POSITION problem and this rule is about size. It
  // declines to grind the word to a dot chasing a frame it was never in.
  signFitGapPx: 20,    // clear air the word must keep under the panel, screen px
  // …and THE FLOOR: the smallest the rule may ever hand the word back at, in world
  // units, measured the same way signWidth is.
  //
  // ⚠️ 14.09.2026 — this replaced `signFitMinScale: 0.30`, and the change is not a
  // retune of that number, it is a different quantity. A RATIO floor says "never
  // below three tenths of whatever size the word happens to be authored at", which
  // drifts every time signWidth moves and which nothing has ever measured. What the
  // designer measured is ABSOLUTE: the word reads as a sign over the gates down to
  // 5.4144 world units, and below about 5.26 it stops reading at all — the bank
  // collapses to a kerb and the halo no longer separates the word from the haze. So
  // the floor is stated in the units the boundary was measured in, and signWidth can
  // move without quietly moving it.
  //
  // Why it was needed: the old ratio let the rule shrink to ×0.38 on the narrow
  // layouts, which is far under that boundary. Those screens were being shown a word
  // in a state where it does not work as a word — and unlike a clipped word, nothing
  // caught it, because from the rule's point of view it had succeeded.
  //
  // It is currently EQUAL to signWidth, so the rule has no room to shrink at all and
  // is a yes/no gate: the word appears at its authored size or not at all. That is
  // not a coincidence and it is not permanent — signWidth was taken down to the same
  // legibility boundary in the same pass (see signWidth). Raise signWidth and the
  // rule gets its range back automatically; this number stays put, because it is a
  // property of the word's legibility and not of today's framing.
  //
  // ⚠️ And the branch that used to sit under this is gone with it. Reaching the floor
  // without fitting used to hand the word back at FULL size and let the clipping veto
  // decide. It no longer does: a word that cannot be got into the frame at or above
  // the floor is NOT DRAWN (see signUnfit in fitSign). Both halves of the same rule —
  // a word sawn off by the frame edge and a word ground down to an unreadable stub
  // are each a sign that has stopped being a sign, and absence is better than either.
  signFitFloorWidth: 5.4144,
  // Цвета здесь нет намеренно: настроечный блок сцены держит движение и
  // размеры, а краску — src/data/sceneTokens.js (MATERIALS.sign = --ink).
  signSideBand: 1.6,   // world units either side of the sign's own plane over which
  //                      the two halves hand over — see applySignOpacity
  signOpacity: 1.0,    // at the top of the title beat
  signRest: 1.0,       // …and the rest of the time. A FLOOR, not a fade: the sign is
  //                      a landmark standing in the world and it is meant to be
  //                      findable from BOTH ends of the corridor, so nothing dims it
  //                      but the distance falloff every other object answers to.
  //                      ⚠️ 13.09.2026 this floor reached the top, so the title
  //                      beat's opacity swell is now FLAT — signIn / signHold /
  //                      signOpacity still shape it, they just have nothing left to
  //                      shape. That is the right way round for this object: a lit
  //                      solid sign that the corridor shows through is not a sign,
  //                      and the six per cent it used to let through was both a
  //                      light leak and a colour one (whatever passed behind the
  //                      word — a lamp cone, the fighter's core — bled into it).
  //                      The light it gives back is taken off signGlow below, so the
  //                      word reads the same and burns less hard underneath.

  // ── how bright the sign burns ──
  // WHAT the sign is made of is in sceneTokens (MATERIALS.sign): a cold white
  // emissive plus a deliberately dim response to the hall. HOW HARD it burns is
  // here, because it is a framing decision and it is measured against the one thing
  // on this screen that is allowed to be brighter — the FIGHT button.
  //
  // The ceiling is not taste: FIGHT is the anchor of the home screen and the word is
  // a landmark behind it, so the word's peak has to sit a clear margin below FIGHT's
  // (the owner's band: at least a third). FIGHT peaks at ≈246, so the word may not
  // pass ≈164, and this number is what holds it there.
  //
  // ⚠️ THE WORD IS AT ITS CEILING. It cannot be made brighter in the start frame.
  // The reason it looked nearly black there was never the material: at the start
  // frame the sign stands 22.7 units out and the home's falloff runs 14 → 26, so
  // 67 % of its light has been replaced by sky before it reaches the camera. That
  // is the whole difference between this frame and any closer view of it, it was
  // confirmed by measuring the falloff at the sign's own distance, and the fog is
  // out of bounds by instruction. What DID fix the reading was making the word
  // bigger, lifting it and taking it out of the haze — mean brightness in the start
  // frame went 78.5 → 108 on those three changes alone, all under the same ceiling.
  //
  // Peak and mean move together here (checked: shifting brightness between the
  // emissive and the hall response, and flattening roughness and metalness, changes
  // both by the same factor — the word has no dark faces left to recover). So the
  // cap on the peak is a cap on how bright the word can read, full stop.
  //
  // ⚠️ 13.09.2026 — the ceiling was raised by the owner from "a third under FIGHT" to
  // "no more than 85 % of it", and this knob went 0.80 → 3.30 to use it. The jump is
  // bigger than the ceiling change alone, because the sideways move (signX) cost the
  // word half its light on the way: at x = 0 it stood 22.7 units out and the home's
  // falloff runs 14 → 26, leaving 27 % of its light; at x = −6 it stands 24.4 out and
  // keeps 13 %. Measured at 844×390, start frame:
  //
  //                          peak    mean
  //   x=0,  w=5.4, glow 0.80  163     112     ← before the move
  //   x=−6, w=7.0, glow 0.80  111      55     ← the move, unchanged light
  //   x=−6, w=7.0, glow 3.30  200      93     ← here
  //
  // So most of this is buying back what the move spent, and even at the new ceiling
  // the word's MEAN is still under what it was on the axis. Fog and distance were out
  // of bounds by instruction, which leaves the word's own light as the only lever.
  //
  // The level is set by the ceiling and nothing else: 3.30 lands the start-frame peak
  // at 81 % of the FIGHT button on the phone reference and 79 % on the owner's 1920,
  // against a ceiling of 85 %. The four points either side, same frame:
  //   2.00 → 66 % · 2.60 → 74 % · 3.00 → 78 % · 3.50 → 83 % · 4.00 → 88 % ✗
  // The run-to-run spread on the peak is about ±3 percentage points (dust crossing
  // the letters), which is what the four points of margin are for.
  // ⚠️ …and back DOWN to 1.30 on the same day, when the sign came closer. 3.30 was
  // what it took to read from 24.4 units through air that ends at 26; from 22.1 the
  // same word arrives with far more of its light intact, and 3.30 there clips: peak
  // 255, which is 104 % of the FIGHT button and straight through the ceiling. The
  // level is set by the ceiling as before — 1.30 lands 79.6 % on the phone reference
  // and 80.8 % on 1920 — and the word is brighter than it has ever been under it:
  //
  //                              peak   mean
  //   x=−6, z=−15, glow 3.30      200     94
  //   x=−9.10, z=−10, glow 1.30   196    111     ← here, and centred
  //
  // Neighbours at this position, reference frame: 0.80 → 69 %, 1.20 → 77 %,
  // 1.40 → 83 %, 1.60 → 87 % ✗.
  //
  // ⚠️ WHAT THE CEILING MEASURES, and what it does not. The MEAN is a solid number:
  // 110 on the phone reference, 116 on 1920, the same to a tenth run after run. The
  // PEAK is one pixel and it moves: ten frozen samples on 1920 came out 0.808, 0.808,
  // 0.808, 0.812, 0.828, 0.831, 0.845, 0.875, 0.881 of the FIGHT button, so three of
  // ten sit above the 85 % line. The phone reference never did — 0.756…0.820 over the
  // same runs — and the phone reference is the frame the ceiling was written for.
  //
  // The spread is the HALL, not the sign. Kill the emissive entirely and the word's
  // brightest pixel still reads 51…61 from the corridor lamps alone, and it is that
  // 0…20 levels, varying with whichever lamp phase the freeze catches, that rides on
  // top of a constant 197.6 of the word's own light. So the glow is NOT sitting on
  // the ceiling: it is sitting four points under it, and the lamps occasionally lend
  // the difference.
  //
  // Left at 1.30 deliberately. Trimming it would cost the mean the last three briefs
  // were spent buying, and it would be trimming against a statistic whose spread is
  // wider than the change. Reported instead — the owner's call.
  signGlow: 1.30,      // multiplies MATERIALS.sign.emissiveIntensity

  // ── the contact stutters ──
  // The word flickers like a sign with a bad contact, and it flickers with EXACTLY
  // the character the landing headline has: same period, same two events at the same
  // uneven places, same two jolts inside each, same floor. There is one table for
  // both and it lives in src/data/signFlicker.js — the numbers are not repeated here
  // on purpose, because two copies of a rhythm come apart at the first edit.
  //
  // The flicker rides the word's own light (emissive) and rides it ALONE: the letters
  // keep their body through the deepest dip, exactly as the landing's letters keep
  // theirs while only the halo layer drops. The bank dips with it, because the bank
  // is lit by the word — one sign with one bad contact, not two effects.
  signFlicker: true,   // off under reduced motion and on a device that is struggling

  // ── the sign lighting its own bank ──
  // The word is a light now, so the haze it stands in has to answer to it: a bank
  // lit only by the hall reads as dirt the word happens to be standing behind,
  // rather than as air the word is shining through.
  //
  // Split, not replacement. `cloudSignShare` is how much of the bank's brightness
  // comes from the word rather than from the hall. Most of it does — that is what
  // makes the bank dip with the word when the contact stutters, and what keeps it
  // alive if the hall ever goes dark.
  cloudSignShare: 0.68,
  // The SHAPE of that light, baked per grain at build (see buildSignCloud). The
  // falloff is measured OUT of the letter slab, not from its centre — along the word
  // every grain is beside some letter, so there is nothing to fall off from there.
  cloudNear: 0.30,     // distance, in cap heights, at which the word's light is down
  //                      to a quarter. Roughly the depth of the shoal itself, so the
  //                      surface right under the letters is lit and the underside is
  //                      not — which is what makes it read as a lit surface rather
  //                      than an evenly grey slab. Pulled in from 0.50 with the
  //                      shoal: the old number was scaled to the old, taller mound.
  cloudNearBase: 0.18, // …and what the far flanks keep anyway. NOT zero: the light
  //                      has to run out smoothly, or the lit part draws its own edge
  //                      and the bank grows the silhouette it was built to avoid

  // ── the sign's own cloud ──
  // The word does not hang in clean black: it STANDS on a low flat shoal of haze,
  // dipped into it about a tenth of its height. This is the sign's OWN cloud and it
  // lives with the sign always — it is not the corridor haze, which is a distance
  // falloff and has no place (see the fog block), and it is not a title-card effect
  // that arrives with the flight. Without it the word floats in the void with
  // nothing under it.
  //
  // ⚠️ 13.09.2026 the owner CANCELLED "the bottom third is sunk in the haze" (ТЗ v2).
  // The word stands on the shoal now, it does not wade in it. Two things came with
  // that: the bank has to have a SURFACE — a level top edge, no swell under the
  // middle — and nothing of it may be drawn in front of the letters above the
  // bottom tenth. What used to be a soft mound a whole cap height tall is now a
  // flat band about a third of one, and the change is in SHAPE, not in density:
  // v3 raised the density threefold and evenly, and all that did was make the core
  // of the mound visible while the ends stayed too thin to read.
  //
  // NOT A BILLBOARD. The one thing this must never become is a flat picture turned
  // to face the camera: seen head-on that reads as a disc with an edge and it slides
  // against the world when the camera moves. It is a VOLUME — a bank of many small
  // soft grains, each at a real world position, so the parallax is honest from every
  // angle the orbit can reach and there is no single edge to catch.
  //
  // NOT A LIGHT OF ITS OWN — but LIT, and mostly by the word. Points are unlit by
  // nature, so both lights are folded into the colour by hand (see setLit): the
  // hall's ambient + hemisphere, and the sign's own glow with its flicker. The
  // second one is new on 13.09.2026 and it is the difference between air the word
  // shines through and dirt the word stands behind. Still never additive, and still
  // never warm.
  //
  // A SHOAL, NOT A MOUND. Everything below is in EM — the sign's own units, cap
  // height 1, letters spanning y ∈ [-0.5, +0.5] — so the shoal keeps its proportions
  // whatever size or distance the sign is set to.
  // ⚠️ 14.09.2026 — both up by ×1.44 with the taller section (see cloudHeight). The
  // section itself grew by ×2.16, so the bank is now two thirds as DENSE per unit of
  // volume as it was, and the pairing rule below says that is exactly how ends stop
  // reading. It was taken on measurement rather than on the ratio: at ×1.44 the bank
  // still reads 1.63 of the word wide on the reference frame against the 1.4 it is
  // held to, its own peak is unmoved (25.2 → 24.3 against the word's 162), and the
  // frame share is 1.45 % against a ceiling of 8. Matching the ratio would have meant
  // 23 800 grains for no measurable gain. If the ends ever start dropping out, this
  // is the first number to raise and the measurement above is what to check.
  cloudCount: 15800,   // grains at full quality …
  cloudCountLow: 5470, // …and once the frame watchdog has seen this device stall.
  //                      Never zero: a word with no footing reads as a fault.
  //                      ⚠️ Both went up by the same factor as cloudSpread on
  //                      13.09.2026, and that pairing is the whole point: the shoal
  //                      got LONGER, not thinner. Lengthened alone it read 1.22…1.65
  //                      of the word from one run to the next — its outer grains were
  //                      sitting on the edge of visibility and the reading flickered
  //                      with them. Lengthened with the count, it reads 1.48…1.78.
  //                      Keep them in step.
  //
  //                      ⚠️ …and they moved together again when the slab became a
  //                      club: the section it fills grew about 3.6×, and a bank
  //                      thinned out by that much fails the same visibility bar its
  //                      ends failed before. Not raised by 3.6 though — most of the
  //                      new room is DEPTH, and depth adds grains along the view ray
  //                      rather than spreading them across the screen, so it pays for
  //                      much of itself. Measured, not reasoned: see the frame share.
  cloudGrain: 0.22,    // grain diameter, in cap heights. HALVED from 0.40: a surface
  //                      needs an edge, and an edge cannot be sharper than one grain.
  //                      At 0.40 the top of the bank was a 0.4-high gradient — there
  //                      was no line for the word to stand on. The grains still merge
  //                      into haze rather than reading as grit because the shoal is
  //                      three times shallower than the mound was, so the same count
  //                      sits in a third of the volume.
  cloudSpread: 1.00,   // half-width, as a share of the word's WIDTH ⇒ the bank is
  //                      2.0 × the word GEOMETRICALLY, and carries on past both ends.
  //
  //                      ⚠️ 14.09.2026 — the approved reference asks for a bank 1.6 ×
  //                      the word (handoff/params.json: cloud.widthOfWordWidth), and
  //                      this number was taken to 0.80 to give exactly that, and then
  //                      MEASURED BACK OUT. The reference's 1.6 is a width you can
  //                      SEE; this knob is a width the bank is BUILT to, and the two
  //                      are not the same number because the outer `cloudFlank` of it
  //                      dissolves on purpose. On screen, reference frame:
  //
  //                        cloudSpread 1.00 → built 2.0 × the word → reads 1.66
  //                        cloudSpread 0.80 → built 1.6 × the word → reads 1.42
  //
  //                      So 1.00 is what puts the reference's number on the screen,
  //                      and 0.80 would have undershot it by a quarter while looking
  //                      like compliance in the source. Left where it is, deliberately.
  //
  //                      ⚠️ 0.78 until 13.09.2026, and the number moved because the
  //                      SIGN did. In the world the shoal is a fixed multiple of the
  //                      word and always was; on SCREEN it is only as wide as the part
  //                      of it that is bright enough to see, and once the sign went
  //                      off the view axis its pale ends stopped clearing that bar —
  //                      the measured width fell from 1.44 of the word to 1.22, below
  //                      the 1.4 the shoal is held to, without the shoal changing at
  //                      all. This buys the screen width back by making the object
  //                      longer. Its shape — the flat top, the tenth of a letter of
  //                      immersion, the clean two thirds above — is untouched, and
  //                      measured so after: 1.48…1.78 of the word, top edge flat to
  //                      3.7 px, immersion 7 %, zero wisps above the bottom third.
  cloudFlank: 0.28,    // the outer share of that half-width over which it dissolves
  cloudBelly: 0.30,    // …and how much fuller the middle of the body is than its
  //                      flanks, in density and in section together. Measured flat
  //                      before this existed — 146 · 662 · 816 · 854 · 843 · 862 ·
  //                      848 · 879 · 843 · 902 · 864 · 891 · 806 · 653 · 131 across
  //                      fifteen bands, which is an extruded section, not a mass.
  //                      ⚠️ Gentle on purpose. This knob is the ball the shoal was
  //                      built to escape; past about 0.5 the word's ends start
  //                      hanging in the void again.
  // THE SURFACE. This is the line the word stands on, in cap heights: -0.40 leaves
  // exactly a tenth of the letters (which end at -0.5) dipped into it.
  cloudTop: -0.37,
  cloudTopJitter: 0.03, // …with this much play, so the surface is a water line and
  //                      not a ruled edge. Small on purpose: it is the only thing
  //                      between "level" and "wavy".
  // …and the surface FADES IN over this depth rather than starting at full strength.
  // Without it the top row of grains reads as a comb: up there the shoal is thin, so
  // each grain is on its own and its round edge becomes a scallop. Measured flat
  // (worst deviation from a straight line 1.3 px) and still wrong to the eye at 3×.
  // Fading them instead of cutting them keeps the geometry — and with it the
  // guarantee below — while the eye sees a surface rather than a row of beads.
  cloudEdge: 0.10,
  cloudEdgeFloor: 0.12, // how much the very topmost grains keep. Not zero: a taper
  //                      that reaches nothing just moves the hard edge down to where
  //                      it stops.
  // ⚠️ The guarantee that nothing reaches the letters, and the ONE place it lives.
  // Every grain is planed off at cloudTop and the jitter only ever lowers one, so the
  // highest a grain's CENTRE can sit is cloudTop itself, -0.37. A grain reaches half
  // its own diameter past that, putting the very top of the haze at -0.26. The bottom
  // third of the letters ends at -0.167. Margin: 0.093 cap heights, and the grains up
  // there are on the taper's floor anyway.
  // Raising cloudTop or cloudGrain eats that margin directly. The section's own size
  // — height, depth, how hard it packs — cannot, which is what makes the roll under
  // this line free to grow.
  // ── the section ──
  // ⚠️ 13.09.2026 — the shoal became a CLUB, and these three knobs replaced the flat
  // `cloudBody` (0.20) + `cloudTail` (0.16) that shaped it before. The old pair built
  // a slab: height drawn flat, depth drawn from a bell centred on the word's own
  // plane. A rectangle crossed with a spike, which is a strip — a bank from the
  // front and a card from the side, and the orbit shows the side.
  //
  // Now the section is an ELLIPSE in (y, z), sampled by radius and planed off level
  // at cloudTop. Same flat top the word stands on; a mass under it instead of a
  // sheet.
  // ⚠️ 14.09.2026 — both moved together, to the reference's section
  // (handoff/params.json: cloud.heightOfCapHeight = 1.25, coreAtHeightFraction = 0.66).
  // The pair is what sets the body, so they are only ever read together:
  //     body      = cloudCore + cloudHeight            = 1.25 cap heights
  //     core sits = (body - cloudCore) / body          = 0.66 of the body up from its
  //                                                      underside
  // The old pair gave a body of 0.58 — under half what the reference asks for — and
  // that is the difference between a mass the word stands on and a bank that reads as
  // a line under its feet. The top is untouched: everything is still planed off at
  // cloudTop and the guarantee above is unaffected, because the roll only ever grew
  // DOWNWARD and away from the letters.
  cloudHeight: 0.825,  // vertical radius of the roll …
  cloudCore: 0.425,    // …and how far below the planed top its axis runs.
  cloudPack: 0.62,     // how the grains crowd the section's core. 0.5 spreads them
  //                      evenly over its area; 1.0 piles them on the axis. This is
  //                      the "denser in the middle, softer at the edges" the flat
  //                      body never had — and it works across AND along, because the
  //                      flank envelope shrinks the whole section, not just its height.
  //
  // WHAT THE CLUB MEASURES, reference frame 844×390, letters 43 px tall on screen:
  //
  //   visible height          26 px median, 29 px at the ninth decile — 0.60 of the
  //                           letters, against 0.36 as a slab. Geometry agrees: the
  //                           haze reaches 0.607 em below its own top line.
  //   profile ALONG           105 · 542 · 773 · 837 · 901 · 921 · 919 · 965 · 921 ·
  //                           936 · 884 · 874 · 746 · 559 · 117 — a belly with the
  //                           ends dissolving, where it used to be flat to a few %.
  //   profile ACROSS          66 · 370 · 593 · 777 · 906 · 1043 · 1211 · 1281 ·
  //                           1136 · 972 · 894 · 715 · 622 · 350 · 64 — a core.
  //   profile DOWN            552 · 967 · 1116 · 1081 · 1108 · 1008 · 898 · 855 ·
  //                           750 · 745 · 589 · 503 · 383 · 292 · 153 — thickest just
  //                           under the word, running out below with no cut.
  //   depth                   2160 grains in front of the letters, 2220 behind,
  //                           2521 inside their own slab. Wrapped, not curtained.
  //   from the side           seen end-on the haze's silhouette is 1.35 wide to 1
  //                           tall and keeps 1824 px of body. A card would be a line.
  //   immersion               11.1 % of the letters' height — the tenth, kept.
  //   wisps above the bottom third                                    zero
  //   on-screen width         1.76 … 1.97 of the word (held to ≥ 1.4)
  //   share of frame          1.86 % (ceiling 8 %)
  //   own peak vs the word's  36 against 196 — 0.19
  //   warm pixels / pink      0 / 0, measured on the haze's OWN contribution
  //   top edge                worst deviation from level 1.6 px
  //   on the cheap layout     width 1.75, height 24 px, frame 1.68 % — the cap holds
  cloudDepth: 0.34,    // depth radius of that same section. Unchanged in value and
  //                      completely changed in effect: as a bell's width four fifths
  //                      of the grains sat inside ±0.11 of the word's plane, so the
  //                      bank was 0.39 tall and 0.23 deep. Sampled radially the
  //                      grains FILL it, and the same 0.34 now means what it says.
  //                      The letters are 0.17 deep, so haze stands in front of them
  //                      and behind — the feet are wrapped, not curtained.
  //                      ⚠️ Depth is safe to grow because the plane at cloudTop, not
  //                      the depth, is what keeps wisps off the letters: nothing is
  //                      ever placed above that line however deep the roll gets.
  // The densest the bank is ever allowed to be. ⚠️ The old ceiling of 0x1e1e24 —
  // "a shade above the sky and no more" — was CANCELLED by the owner on 13.09.2026
  // in the same breath as the glow: a bank lit by a lit sign has to be lighter than
  // one lit by nothing, or the word reads as standing in front of the haze rather
  // than in it. The ceiling that replaces it is a RELATIVE one and it is the real
  // constraint: the bank's own peak must stay clearly under the letters' peak,
  // because a source has to be brighter than what it lights.
  cloudTint: 0x3a3a44,
  cloudAlpha: 0.40,    // one grain's share — the mass comes from overlap, not from
  //                      any single grain being visible on its own. Overlap can only
  //                      ever converge ON the tint, never past it, so the ceiling
  //                      above is structural: raising this makes the bank reach its
  //                      cap sooner, it cannot make it brighter than the cap.
  cloudTurn: 0.010,    // rad/s — a whole turn takes ten minutes. Rigid, so it cannot
  //                      open a seam; off under reduced motion.

  // ── final MODE framing + the orbit it hands over to ──
  // The framing is computed from the plate pair's bounds so it survives an
  // orientation change (portrait re-lays the pair in depth — see MODE_PLATES).
  fit: {
    marginX: 1.6,        // world padding either side of the pair
    marginY: 1.8,        // …and above / below
    depthToScreen: 0.55, // how much of the pair's DEPTH reads as screen height at this pitch
    minDist: 8,
    maxDist: 30,
    pitchDeg: 17,        // camera elevation above the plate plane
    targetLift: 1.0,     // pivot height over the plate tops — the OPENING guess only;
                         // modeFraming then measures and re-centres (see there)
    // Room kept for the caption cards hanging under the pair, and the breathing space
    // around the whole block. Pixels, because that is what the captions live in.
    captionPx: 62,       // caption card height + its gap under the plate silhouette
    edgePx: 18,          // clearance from the frame edge on every side
    // The orbit at the mode stage is FREE all the way round — the plates stand in a
    // world, not on a backdrop, and the player is meant to be able to turn and find
    // the corridor, the sign and the home still behind them. Only the two limits
    // that protect the illusion are kept: you cannot drop under the plates and see
    // their underside, and you cannot back out far enough to reach the sky.
    pitchSpanDeg: 13,    // ± around the default elevation …
    pitchFloorDeg: 4,    // … and never flatter than this above the plate plane
    zoomMin: 0.7,
    zoomMax: 1.6,
    zoomMaxAbs: 20,      // hard ceiling in world units — keeps the dome out of reach
    returnDelay: 5.0,    // idle seconds before the camera drifts back to the default
    //                      framing. Longer than the old 3s: with a full circle to
    //                      look round, three seconds pulls the camera back while the
    //                      player is still looking at something.
    returnLerp: 0.06,    // per-frame ease of that drift (any input cancels it)
  },

  // ── presence: which end of the corridor the camera is standing at ──
  // 0 = at the home, 1 = at the plates. The two ends of the world dim each other out
  // with it, so each stage stays calm without anything being switched off — turning
  // a whole object off would tear a hole in the world the moment the player orbits
  // and looks that way. `hint` is the floor: the far end never vanishes, it just
  // sinks into the distance until it is a suggestion rather than a thing to read.
  presence: {
    // The two ends are NOT symmetric, are not measured the same way, and are not
    // meant to be. Each end answers to its OWN distance, not to a shared "which half
    // of the corridor am I in" mix: a mix cannot say when the plates are close enough
    // to deserve their colour back, only which end is nearer, and those are different
    // questions once the camera is out over the void between them.
    //
    // Far end (the plates and the sign) — driven by distance to the plate pair.
    farOn: 34,         // at or beyond this the far end is only a hint in the dark
    farFull: 14,       // …and at or inside it the plates are fully themselves
    // The plates are small and must not be readable from the home at all. The floor
    // is never zero: switching them off would tear a hole in the world the moment the
    // player orbits at the home and looks this way. The thing that actually HIDES
    // them is the distance falloff (see the fog block) — this only keeps them dark.
    hintFar: 0.05,
    // Home end (the home's own glows) — driven by distance to the home. The home is
    // large and is the player's landmark, so its GEOMETRY is never dimmed: it stays a
    // legible silhouette from the far end. Only its glows go out, so the one pink on
    // screen is always the one the stage in front of the player is entitled to.
    homeOff: 30,       // at or beyond this the home's glows are fully out
    homeOn: 15,        // …and at or inside it they are fully lit
    hintHomeGlow: 0,   // raise if the home should keep a spark of its own from afar
  },

  // ── health ──
  lowFpsDt: 0.05,      // a frame longer than this counts as a stall (20fps)
  lowFpsFrames: 3,     // …this many in a row ⇒ ride the flight out early
  graceSec: 0.3,       // ignore stalls during the opening beat (plates waking up)
  maxDt: 0.05,         // dt clamp — a backgrounded tab resumes, it does not jump
};

// ─────────────────────────── The HEXLASH sign ───────────────────────────
// Real letters, hand-authored as outlines in a 1.0-high em box and extruded. The
// project ships no font loader and no typeface JSON, and adding one would mean a
// new async asset on the critical path of a transition — so the seven glyphs of
// HEXLASH live here as geometry. Condensed geometric caps, matching the brand
// display face. Coordinates are [x, y] with y=0 the baseline and y=1 the cap line.
const GLYPHS = {
  H: { w: 0.62, out: [[0, 0], [0.19, 0], [0.19, 0.41], [0.43, 0.41], [0.43, 0], [0.62, 0], [0.62, 1], [0.43, 1], [0.43, 0.59], [0.19, 0.59], [0.19, 1], [0, 1]] },
  E: { w: 0.58, out: [[0, 0], [0.58, 0], [0.58, 0.19], [0.19, 0.19], [0.19, 0.405], [0.52, 0.405], [0.52, 0.595], [0.19, 0.595], [0.19, 0.81], [0.58, 0.81], [0.58, 1], [0, 1]] },
  X: { w: 0.62, out: [[0, 0], [0.22, 0], [0.31, 0.34], [0.4, 0], [0.62, 0], [0.465, 0.5], [0.62, 1], [0.4, 1], [0.31, 0.66], [0.22, 1], [0, 1], [0.155, 0.5]] },
  L: { w: 0.52, out: [[0, 0], [0.52, 0], [0.52, 0.19], [0.19, 0.19], [0.19, 1], [0, 1]] },
  A: {
    w: 0.64,
    out: [[0, 0], [0.185, 0], [0.255, 0.3], [0.385, 0.3], [0.455, 0], [0.64, 0], [0.41, 1], [0.23, 1]],
    holes: [[[0.268, 0.42], [0.372, 0.42], [0.32, 0.8]]],
  },
  S: { w: 0.58, out: [[0, 0], [0.58, 0], [0.58, 0.58], [0.19, 0.58], [0.19, 0.81], [0.58, 0.81], [0.58, 1], [0, 1], [0, 0.42], [0.39, 0.42], [0.39, 0.19], [0, 0.19]] },
};
const SIGN_WORD = 'HEXLASH';
const SIGN_TRACK = 0.085; // letter-spacing, in em

// Strip the cap that faces AWAY from the reader, leaving an open shell: readable
// face + walls + bevels. This is what makes the back-to-back pair work.
//
// Depth alone cannot do it. Each half is a closed solid, so it also carries an
// inward cap with the letters the wrong way round — and because the mirrored word's
// letters do not sit exactly on top of the right ones (the glyphs are different
// widths), that cap pokes out past its neighbour wherever they disagree and draws
// there, no matter what the depth buffer says. With the cap gone there is simply
// nothing to leak: from the wrong side each half is hollow, and hollow is culled.
//
// ExtrudeGeometry is non-indexed, so this is a straight walk over the triangles.
function dropBackCap(geo, THREE_) {
  const pos = geo.attributes.position.array;
  const keep = [];
  for (let i = 0; i < pos.length; i += 9) {
    const ux = pos[i + 3] - pos[i]; const uy = pos[i + 4] - pos[i + 1]; const uz = pos[i + 5] - pos[i + 2];
    const vx = pos[i + 6] - pos[i]; const vy = pos[i + 7] - pos[i + 1]; const vz = pos[i + 8] - pos[i + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    if (nz / len > -0.9) for (let k = 0; k < 9; k++) keep.push(pos[i + k]); // keep all but the flat back cap
  }
  const out = new THREE_.BufferGeometry();
  out.setAttribute('position', new THREE_.Float32BufferAttribute(keep, 3));
  out.computeVertexNormals();
  geo.dispose();
  return out;
}

function glyphShape(g) {
  const shape = new THREE.Shape();
  shape.moveTo(g.out[0][0], g.out[0][1]);
  for (let i = 1; i < g.out.length; i++) shape.lineTo(g.out[i][0], g.out[i][1]);
  shape.closePath();
  (g.holes || []).forEach((h) => {
    const path = new THREE.Path();
    path.moveTo(h[0][0], h[0][1]);
    for (let i = 1; i < h.length; i++) path.lineTo(h[i][0], h[i][1]);
    path.closePath();
    shape.holes.push(path);
  });
  return shape;
}

// Build the sign → { group, mat, emWidth, dispose }. Authored around its own centre
// so the caller can place it as one object. MATTE — no emissive, no glow.
//
// READS FROM BOTH SIDES. The sign stands between the home and the plates, so the
// player meets its front on the way out and its back when they turn round at the
// plates — and the back of an extruded word is a mirror image. Turning it to face
// the camera would fix that and destroy the point of it: the moment it swivels it
// stops being a thing in the world and becomes a sticker on the lens.
//
// So it is built as two half-depth copies of the word back to back, the second
// turned 180° about Y. That rotation mirrors the letters AND reverses their order,
// which is exactly what un-mirrors them for a viewer on the far side. The halves
// occupy z ∈ [0, d/2] and z ∈ [-d/2, 0] — adjacent, never coincident, so nothing
// double-blends while the sign fades; together they read as one solid slab whose
// side walls run the full depth.
//
// The catch, and why each half carries its OWN material: HEXLASH is not a palindrome.
// Reversed it is HSALXEH, whose letters fall in different places, so the two halves
// do not share a silhouette and the far one is visible THROUGH the near one's gaps —
// as pale strokes inside and between the letters, the mirrored X sitting across the
// LA being the clearest of them. Depth cannot hide it: there is simply nothing in
// front of those pixels to hide it behind. What does hide it is only ever drawing
// the half that is facing the reader, so the far one is faded out by the side fade
// in applySignOpacity.
function buildSign(o) {
  const group = new THREE.Group();
  const shapes = [];
  let x = 0;
  for (const ch of SIGN_WORD) {
    const g = GLYPHS[ch];
    const s = glyphShape(g);
    s.getPoints(); // touch once so ExtrudeGeometry sees a resolved outline
    shapes.push({ shape: s, x, w: g.w });
    x += g.w + SIGN_TRACK;
  }
  const emWidth = x - SIGN_TRACK;

  const makeMat = () => new THREE.MeshStandardMaterial({
    // Cold white, and it BURNS: the emissive in the token is the word's own light,
    // the colour is the little it takes from the hall. Blending stays normal and
    // there is no additive anywhere — additive is how haze and signage turn into a
    // smear with no letters left in it. Details, and why the hall response is held
    // down, are on MATERIALS.sign.
    ...MATERIALS.sign,
    transparent: true,
    opacity: 0,
    // The sign WRITES DEPTH, unlike the rest of the fading pieces here, and it has
    // to: it is a closed solid, so each half also carries an inward-facing cap with
    // the letters on it the wrong way round. Without depth those caps blend straight
    // through the correct face and the word reads mirrored from both sides. Writing
    // depth lets the near face win, which is simply what a solid object does.
    depthWrite: true,
    // FOGGED. It used to be exempt so opacity alone drove it, and that is exactly
    // why it was still legible from the home: a light grey object 30 units away with
    // nothing dimming it but a small alpha. Distance is supposed to be what hides it,
    // so distance gets to. The cost at the title beat (~13 units) is a few per cent.
    fog: true,
  });
  // ONE MATERIAL PER HALF, not one shared between them. The two halves have to be
  // able to fade independently — see the side fade in applySignOpacity, which is
  // what stops the far half showing through the near one's gaps.
  const matFront = makeMat();
  const matBack = makeMat();

  const half = o.signDepth / 2;
  const geos = [];
  let capY = -Infinity;   // the real top of the letters, in the sign's own units
  const front = new THREE.Group(); // reads from the home side (+Z)
  const back = new THREE.Group();  // reads from the plates side (-Z)
  back.rotation.y = Math.PI;
  for (const s of shapes) {
    let geo = new THREE.ExtrudeGeometry(s.shape, {
      depth: half, bevelEnabled: true,
      // ⚠️ 14.09.2026 — 0.014 → 0.010 em, the reference's ≈1 % of cap height
      // (handoff/params.json: geometry.bevelWidthOfCapHeight). One segment, so it is
      // one facet and catches one highlight along the top edge — which is the only
      // metal the reference allows anywhere on this object.
      bevelThickness: 0.010, bevelSize: 0.010, bevelSegments: 1, curveSegments: 1,
    });
    geo = dropBackCap(geo, THREE); // open shell — see the helper
    geo.translate(s.x - emWidth / 2, -0.5, 0); // centre the word on its own origin
    // The real cap, read off the built letters rather than assumed at +0.5. The em
    // box is taller than the capitals standing in it, and the fit rule measures its
    // clearance against this: guarding the em box would have the word ducking under
    // the panel by however much of the box is empty air above the letters, which on
    // this face is a couple of screen pixels at the phone size and is exactly the
    // kind of quiet slack that turns into "why is it small on my screen".
    geo.computeBoundingBox();
    capY = Math.max(capY, geo.boundingBox.max.y);
    geos.push(geo);
    front.add(new THREE.Mesh(geo, matFront));
    back.add(new THREE.Mesh(geo, matBack)); // same geometry, mirrored by the group's turn
  }
  group.add(front, back);

  group.visible = false;
  const dispose = () => {
    geos.forEach((g) => g.dispose());
    matFront.dispose();
    matBack.dispose();
  };
  return { group, matFront, matBack, emWidth, capY, dispose };
}

// ─────────────────────── The cloud the sign stands in ───────────────────────
// The word is not a caption floating in clean black — it stands in a low bank of
// haze that swallows the bottom third of its letters. See the cloud block in FLIGHT
// for the discipline; the two things it must never become are a flat card turned to
// the camera and a source of light.
//
// It is built as a VOLUME of small soft grains. Grains are camera-facing by nature,
// but that is not what a billboard is: a billboard is ONE quad standing in for a
// volume, and it betrays itself by having a single silhouette that slides against
// the world. A hundred grains at a hundred real world positions have no shared
// silhouette to catch and parallax correctly from any angle, which is exactly the
// property that was missing last time.
//
// Layout is deterministic (a seeded generator, not Math.random): the bank must be
// the same bank on every load, or the corridor changes shape between sessions.
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One grain: a round patch of alpha that fades to nothing well before its own edge.
// The falloff is squared-smoothstep with NO rim and NO bright centre — a radial
// gradient with a hot core is the other half of how the old billboards gave
// themselves away, reading as a core with a halo ringed round it.
function grainTexture(THREE_) {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const g = cv.getContext('2d');
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / S * 2 - 1;
      const dy = (y + 0.5) / S * 2 - 1;
      const d = Math.min(1, Math.hypot(dx, dy));
      const k = 1 - d;
      const a = k * k * k * (3 - 2 * k); // smooth to zero at the edge, flat-ish inside
      const i = (y * S + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE_.CanvasTexture(cv);
  tex.colorSpace = THREE_.SRGBColorSpace;
  return tex;
}

// Build the bank → { group, mat, setCount, setLit, dispose }.
// `capHeight` is the sign's cap height in world units, `width` its world width, and
// the bank is authored around the sign group's own origin so it can be parented to
// it and inherit its placement for free.
function buildSignCloud(o, emWidth) {
  const group = new THREE.Group();
  const tex = grainTexture(THREE);

  // Everything here is in EM: cap height 1, the word `emWidth` wide, letters centred
  // on the origin so their baseline is -0.5. The group is parented to the sign, so
  // the sign's own scale carries all of it into the world at the right size.
  const rx = emWidth * o.cloudSpread;   // half-width of the bank
  const rz = o.cloudDepth;              // depth radius of the section
  const ry = o.cloudHeight;             // vertical radius of the section
  const yc = o.cloudTop - o.cloudCore;  // …and where the roll's axis runs under the top
  const pack = Math.min(1, Math.max(0.5, o.cloudPack));
  const flank = Math.max(1e-3, o.cloudFlank);

  // Ends DISSOLVE, they do not stop: over the last `cloudFlank` of the half-width the
  // bank both thins out (fewer grains survive the roll below) and shrinks in section,
  // so there is no line anywhere for the eye to find.
  const endEnvelope = (ax) => {
    const t = clamp01((1 - ax) / flank);
    return t * t * (3 - 2 * t);
  };

  const rnd = mulberry32(0x48584c); // 'HXL'
  const pos = new Float32Array(o.cloudCount * 3);
  // Per-grain share of the SIGN's own light — see the `cloudNear` block in FLIGHT.
  // Baked once, at build: the word does not move inside its own bank, so a grain's
  // distance from the letters never changes and there is nothing to recompute.
  const col = new Float32Array(o.cloudCount * 3);
  const near = Math.max(1e-3, o.cloudNear);
  for (let i = 0; i < o.cloudCount; i++) {
    // Along the word: a BELLY, not a plateau and not a ball.
    //
    // Even end to end was the answer to the ball this once was — a ball is densest at
    // its core and has nothing at the ends, which is how the word came to be standing
    // on one smear of haze in the middle with both ends hanging in the void. Even
    // fixed that and overshot: measured along its length the body came out flat to
    // within a few per cent, which reads as an extruded section rather than as a mass
    // of anything.
    //
    // `cloudBelly` puts a gentle swell back — full in the middle, easing off toward
    // the flanks, in DENSITY and in SECTION together so the roll is fatter there as
    // well as busier. Gentle is the whole point: at 0.30 the ends of the body still
    // keep seven tenths of the middle, which is a mass with a waist, not a ball with
    // tails.
    let x; let env; let belly;
    do {
      x = rnd() * 2 - 1;
      const ax = Math.abs(x);
      env = endEnvelope(ax);
      belly = 1 - o.cloudBelly * ax * ax;
    } while (rnd() > env * belly);    // flanks dissolve, and the body swells to its middle
    const section = (0.58 + 0.42 * env) * belly;

    // A ROLL WITH ITS TOP PLANED OFF, not a slab.
    //
    // The top stays exactly what it was — a level line the word stands on, with
    // nothing ever placed above it. Everything under that line changed. It used to
    // be a rectangle crossed with a spike: height drawn flat from the surface down,
    // depth drawn from a bell centred on the word's own plane. Four fifths of the
    // grains therefore landed inside a sheet a fifth as deep as the bank was tall,
    // so it read as a bank from the front and as a card from the side — and the
    // corridor is orbited, so the side is on show half the time.
    //
    // Now the section is sampled as an ellipse: a RADIUS and an ANGLE, not two
    // independent draws. The grains fill it, `pack` decides how hard they crowd its
    // core, and the flank envelope shrinks the whole section rather than only its
    // height — so the mass is denser in the middle and softer at every edge, across
    // as well as along, with nothing anywhere for the eye to catch as a boundary.
    let ey = -1; let ez = 0;
    for (let tries = 0; tries < 24; tries++) {
      const rad = pack === 0.5 ? Math.sqrt(rnd()) : rnd() ** pack;
      const th = rnd() * Math.PI * 2;
      const cy = rad * Math.sin(th);
      // Planed off. The guarantee that no wisp reaches the letters lives HERE and
      // nowhere else, which is what lets the roll be as deep as it likes.
      if (yc + cy * ry * section > o.cloudTop) continue;
      ey = cy; ez = rad * Math.cos(th);
      break;
    }
    // The jitter breaks the planed line into a water line. It only ever lowers a
    // grain, so the highest centre in the bank is cloudTop itself.
    const y = yc + ey * ry * section - rnd() * o.cloudTopJitter;
    const z = ez * rz * section;
    pos[i * 3] = x * rx;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    // How much of the WORD'S light this grain catches. The letters are a slab: they
    // span the whole width, y ∈ [-0.5, 0.5], and are thin in depth, so the distance
    // that matters is the distance OUT of that slab — vertically for the grains under
    // the feet, in depth for the ones standing in front of and behind the word. Along
    // the word there is nothing to fall off from: a grain beside the H is as close to
    // a letter as one beside the A. Past the ends it does fall off, which the width
    // term below carries.
    const dy = Math.max(0, Math.abs(y) - 0.5);
    const dz = Math.max(0, Math.abs(z) - o.signDepth / 2);
    const dx = Math.max(0, Math.abs(x * rx) - emWidth / 2);
    const d = Math.hypot(dx, dy, dz) / near;
    // Falls off smoothly and NEVER to nothing: the far flanks still sit in the word's
    // spill, just faintly. A hard edge to the lit part would draw the outline of the
    // lamp, and the one thing this bank must not grow is an edge.
    const f = 1 / (1 + d * d);
    let w = o.cloudNearBase + (1 - o.cloudNearBase) * f;

    // The surface FADES IN over the top `cloudEdge`. Up there the shoal is thin and
    // every grain stands alone, so a hard cut hands the eye a row of round edges —
    // a comb, not a water line. Dimming them does what dropping them cannot: the
    // geometry (and the guarantee that nothing reaches the letters) is untouched,
    // and the edge still dissolves. Colour, not alpha, because one Points material
    // has a single alpha for all of it — and over a near-black corridor dimming a
    // grain and thinning it come to the same thing.
    const fromTop = o.cloudTop - y;
    const e = clamp01(fromTop / Math.max(1e-3, o.cloudEdge));
    w *= o.cloudEdgeFloor + (1 - o.cloudEdgeFloor) * (e * e * (3 - 2 * e));

    col[i * 3] = w; col[i * 3 + 1] = w; col[i * 3 + 2] = w;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, o.cloudCount);

  const mat = new THREE.PointsMaterial({
    size: o.cloudGrain, // in cap heights — resolved against camera + scale below
    sizeAttenuation: true,
    map: tex,
    color: 0x000000,      // set every frame from the light in the corridor — setLit
    // Per-grain weight: how much of the WORD's own light each grain catches. Baked
    // above. The material colour is the light LEVEL (hall + sign, and it flickers
    // with the sign); this attribute is the SHAPE of it, and the shape never moves.
    vertexColors: true,
    transparent: true,
    opacity: o.cloudAlpha,
    // Writes NO depth, tests against it. That single pair is what sinks the letters:
    // a grain behind a letter fails the test and is dropped, a grain in front of one
    // draws over it, and in the gaps between the letters every grain draws. The word
    // ends up standing IN the bank rather than behind a veil.
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending, // never additive — additive is how haze glows
    fog: true,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = 1; // after the sign, which is what makes the depth test bite
  points.frustumCulled = false; // the bank is wider than its own origin implies
  group.add(points);

  const tint = new THREE.Color(o.cloudTint);
  const _c = new THREE.Color();

  return {
    group,
    mat,
    /** Drop to the cheap layout once the device has shown it cannot keep up. */
    setCount(n) { geo.setDrawRange(0, Math.min(n, o.cloudCount)); },
    /**
     * Grain size, resolved.
     *
     * Two corrections, both needed. `PointsMaterial.size` is NOT a world size: three
     * sizes a point as size · height / (2 · distance) and leaves the field of view
     * out of it, so at this camera a grain came out at 0.38 of what it was asked for
     * — quarter of the area — and the bank read as grit sprinkled over the letters.
     * And the size is NOT scaled by the object's matrix either, so a grain authored
     * in the sign's units has to be carried into the world by hand; without that the
     * grains would stay put while the sign changed size, and the bank would lose its
     * proportions the moment the word was moved or resized.
     */
    setGrainScale(fovDeg, worldPerEm) {
      mat.size = o.cloudGrain * worldPerEm / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
    },
    /**
     * The bank is LIT, not self-coloured, and since 13.09.2026 it has TWO lights.
     *
     * @param hallK  the hall's own ambient + hemisphere, 0…1 (see relight)
     * @param signK  the word's own glow, 0…1, flicker included (see signGlowNow)
     *
     * Points carry no lighting of their own, so both are folded into the colour by
     * hand. The split between them is `cloudSignShare`: the bank is mostly the
     * word's own spill, which is why it dips when the word's contact stutters and
     * why it survives the hall going dark. That last part used to be the test that
     * the bank was not a light of its own — the owner cancelled it on 13.09 when
     * the sign became a light, and it is now the wrong test: a lit sign standing in
     * an unlit room still lights the air around itself.
     */
    setLit(hallK, signK) {
      const k = (1 - o.cloudSignShare) * hallK + o.cloudSignShare * signK;
      mat.color.copy(_c.copy(tint).multiplyScalar(k));
    },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); },
  };
}

// ─────────────────────────── Easing ───────────────────────────
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Perceived brightness of a light's colour — used to weigh the hall's ambient
// and hemisphere into the one number the sign's cloud is coloured by.
// NB: THREE.Color components are LINEAR, not sRGB — the numbers here are not the
// ones a colour picker shows, and mixing the two spaces is how the sign's bank came
// out nearly black the first time.
const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;

// What "fully lit" means for the sign's cloud: the ambient + hemisphere the halls
// are actually built with. DERIVED from the lighting tokens rather than typed, so it
// cannot drift away from them — a hall lit dimmer gets a dimmer bank, which is what
// being lit means. Computed once, lazily, because it needs THREE.Color.
let _litRef = 0;
function litReference() {
  if (!_litRef) {
    _litRef = LIGHTING.amb.intensity * lum(new THREE.Color(LIGHTING.amb.color))
      + LIGHTING.hemi.intensity * lum(new THREE.Color(LIGHTING.hemi.sky));
  }
  return _litRef;
}
// Slow off the mark, builds, then a LONG decel into the arrival — the tail is what
// makes the camera feel like it has weight rather than snapping to a mark. FLIGHT.
// easeTail sets how long that decel runs, which is where a slower flight is meant to
// spend most of its extra time.
function easeFlight(u, tail) {
  const x = clamp01(u);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, tail) / 2;
}
// Rise → hold → fall envelope over [a, b] with the peak at `peak`.
function envelope(u, peak, power) {
  const x = clamp01(u);
  const s = x < peak ? x / peak : (1 - x) / (1 - peak);
  return Math.pow(clamp01(s), 1 / power);
}
// Smooth 0→1 across [a,b].
function ramp(u, a, b) {
  if (b <= a) return u >= b ? 1 : 0;
  const x = clamp01((u - a) / (b - a));
  return x * x * (3 - 2 * x);
}

// ─────────────────────────── The director ───────────────────────────
/**
 * @param {object} deps
 *   scene    — the home scene (fog + the flight's own props are added to it)
 *   camera   — the shared perspective camera (the director drives it directly)
 *   poseFor  — (where:'home'|'mode') => ({ position: Vector3, target: Vector3 })
 *              Live suppliers, so an orientation change mid-flight is picked up.
 *   reduced  — prefers-reduced-motion
 *
 * @returns controller — see the methods at the bottom.
 */
export function createTransitionFlight(deps) {
  const o = FLIGHT;
  const { scene, camera, poseFor } = deps;
  const reduced = !!deps.reduced;

  // The sign is a FIXED landmark: placed once here and never moved again, so the
  // player can turn round at the plates and find it exactly where they flew past it.
  const sign = buildSign(o);
  // `let`, not `const`, since 13.09.2026: the word keeps this size wherever it fits
  // and is shrunk off it where it does not — see fitSign. Everything downstream that
  // needs the size (the bank's grain, above all) reads this one variable, so there is
  // no second copy to fall out of step when the fit moves it.
  let signScale = o.signWidth / sign.emWidth;
  // Set by the fit rule: the frame cuts this word and no size stops it, so it is not
  // drawn. See fitSign, and applySignOpacity, which is where the veto lands.
  let signClipped = false;
  // …and the second veto beside it: the frame can hold the whole word, but not at any
  // size the word is still legible at. See signFitFloorWidth.
  let signUnfit = false;
  // Where the title swell was left, so a re-fit can re-apply the veto without
  // disturbing it. (It is 1 at rest today — signRest reached the top — but the swell
  // is still the thing that owns this number, so the fit rule borrows it rather than
  // guessing.)
  let lastTitleK = 0;
  sign.group.scale.setScalar(signScale);
  sign.group.position.set(o.signX, o.signY, -o.modeZ * o.signAt);
  sign.group.rotation.set(0, 0, 0); // front toward the home, back toward the plates
  // The switch also decides the state the group is BORN in, so there is no window
  // before the first fit in which it could be drawn. Both materials start at zero
  // opacity anyway, so this is belt and braces — but the two places that own the
  // sign's visibility should not disagree, even for one frame. See signShown.
  sign.group.visible = o.signShown;
  scene.add(sign.group);

  // The bank the word stands in. PARENTED TO THE SIGN, so it is placed, scaled and
  // fogged by exactly the same numbers and can never drift away from the letters it
  // is supposed to be swallowing. Authored in the sign's own em units (cap height 1,
  // the word `emWidth` wide) because that is the space the sign group is in.
  const cloud = buildSignCloud(o, sign.emWidth);
  cloud.setGrainScale(camera.fov, signScale);
  sign.group.add(cloud.group);

  // ───────────────────────────── the fit rule ──────────────────────────────
  //
  // "Вывеска всегда влезает в кадр целиком и всегда имеет просвет до верхней
  // панели. Где не влезает — уменьшается ровно настолько, чтобы влезть."
  //
  // ONE mechanism. Nothing below knows about portrait, or about 568×320, or about
  // any other particular screen: it reads the viewport and the panel it is actually
  // given and solves for the scale that clears them. A table of per-screen sizes
  // would be the other way to do this and would be wrong — two sets of numbers for
  // one thing drift apart at the first edit.
  //
  // The solve leans on one fact: scaling the word about its own origin leaves that
  // ORIGIN's screen point exactly where it was. So every other point of the word
  // moves along a line through it, and the scale that pulls an offending point onto
  // its limit is just the ratio of the two distances from the origin. Perspective
  // makes that ratio slightly off — the point is at a different depth once it moves
  // — so it is iterated, and it converges in two passes.
  //
  // It is measured against a SET of poses, handed in by the scene, and the word is
  // sized so that it fits at every one of them. One pose would not do: the home
  // camera trails the wandering fighter within a dead-zone, so the word slides across
  // the frame all day — measured at the middle of that drift it would duck under the
  // chrome at the ends of it. The set is the corners of the drift, so the answer holds
  // wherever the fighter has got to. And it is still computed only on a viewport
  // change: the word does not resize as the camera drifts, it is sized for the worst
  // of the drift once and left alone.
  const _fitV = new THREE.Vector3();

  /**
   * Set the scale — about the letters' FEET, not their middle.
   *
   * Two reasons, and they happen to be the same reason. Visually: the word stands on
   * the shoal, so a word that got smaller around its own centre would climb off the
   * bank and float. Mechanically: shrinking is the only lever the fit rule has over
   * the top of the letters, and about the centre it is a weak one — the cap can only
   * ever come down by half the height that was lost. Pivoted on the baseline it comes
   * down by all of it, which is the difference between the rule working on a small
   * phone and not. The bank rides along: its surface is authored a hair above the
   * baseline (cloudTop −0.37 against feet at −0.5), so pivoting there leaves it
   * essentially where it was and the word keeps standing in it at the same depth.
   *
   * `updateMatrixWorld` because `localToWorld` reads matrixWorld and that is only
   * otherwise refreshed at render time — without it every measurement below would be
   * reading the previous pass.
   */
  function applyFitScale(v) {
    sign.group.scale.setScalar(v);
    sign.group.position.y = o.signY - 0.5 * (o.signWidth / sign.emWidth - v);
    sign.group.updateMatrixWorld(true);
  }

  /** A point of the sign's own space → screen px under a given fit camera. */
  function fitToScreen(cam, x, y, z, vw, vh) {
    _fitV.set(x, y, z);
    sign.group.localToWorld(_fitV);
    _fitV.project(cam);
    return { x: (_fitV.x * 0.5 + 0.5) * vw, y: (-_fitV.y * 0.5 + 0.5) * vh };
  }

  /**
   * The topmost screen point of the letters' CAP LINE within an x span.
   *
   * Not the bounding box. The word is seen at an angle, so its cap runs downhill
   * across the frame and the box's top corner overstates the clearance by the whole
   * of that slope — nine pixels at the reference layout, half the guard. What the
   * panel can actually collide with is the cap directly beneath it, so the cap is
   * clipped to the panel's own x span first and read there. A straight line in the
   * world is still a straight line on the screen, so clipping is a lerp.
   *
   * @param spans [[x0,x1], …] the chrome's own boxes — the panel is two buttons with
   *              air between them, and the air cannot collide with anything
   * @returns screen y, or null when no part of the cap passes under any of them
   */
  function capTopOver(cam, spans, vw, vh) {
    const hw = sign.emWidth / 2;
    const hz = o.signDepth / 2;
    let top = null;
    for (const z of [hz, -hz]) {     // front and back cap edges — either can be higher
      const a = fitToScreen(cam, -hw, sign.capY, z, vw, vh);
      const b = fitToScreen(cam, hw, sign.capY, z, vw, vh);
      const lo = Math.min(a.x, b.x);
      const hi = Math.max(a.x, b.x);
      const span = b.x - a.x;
      for (const [x0, x1] of spans) {
        const s0 = Math.max(lo, x0);
        const s1 = Math.min(hi, x1);
        if (s1 < s0) continue;       // this edge passes clear of that button
        for (const sx of [s0, s1]) { // the extremes of a straight segment
          const u = Math.abs(span) < 1e-6 ? 0 : (sx - a.x) / span;
          const y = a.y + (b.y - a.y) * u;
          if (top === null || y < top) top = y;
        }
      }
    }
    return top;
  }

  /** Screen box of the letters — all eight corners, since the word is turned. */
  function letterBox(cam, vw, vh) {
    const hw = sign.emWidth / 2;
    const hz = o.signDepth / 2;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const sx of [-hw, hw]) for (const sy of [-0.5, sign.capY]) for (const sz of [-hz, hz]) {
      const p = fitToScreen(cam, sx, sy, sz, vw, vh);
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    return { x0, x1, y0, y1 };
  }

  /**
   * How much the word must shrink to stop hanging off an edge it is PARTLY inside.
   *
   * "Partly" is the whole of it. A word that straddles an edge is a cut word and
   * shrinking pulls it back in. A word that is entirely off the frame is not cut —
   * it is somewhere else — and shrinking does not bring it back, because the point
   * it shrinks toward is off the frame too. The rule declines to grind such a word
   * down to a dot chasing a frame it was never in; that case is reported, not fudged.
   */
  function edgeOk(b, P, vw, vh) {
    // Shrinking pulls the word toward the pivot, so it can only fetch a word back
    // into frame if the pivot is IN the frame. Where it is not — portrait, where the
    // word's own middle is off the right edge — shrinking pushes the visible part off
    // instead of pulling the rest on, and the honest answer is that size is not the
    // problem. Left alone and reported.
    if (P.x < 0 || P.x > vw || P.y < 0 || P.y > vh) return true;
    return b.x0 >= 0 && b.x1 <= vw && b.y0 >= 0 && b.y1 <= vh;
  }

  /**
   * Re-fit the word to a viewport. Call at build and on every resize.
   *
   * @param view  { width, height } of the canvas, CSS px
   * @param panel { bottom, spans } of the top chrome IN CANVAS COORDINATES, or null
   *              when there is no panel over the word (then only the frame binds)
   * @param poses [{ position, target }, …] every framing the word has to survive —
   *              FIXED ones, please, not whatever the camera is doing this frame
   * @returns a small report — the scale it settled on and why (the scene stashes it
   *          for the dev readout; nothing in the render path reads it)
   */
  function fitSign(view, panel, poses) {
    const vw = view && view.width;
    const vh = view && view.height;
    const full = o.signWidth / sign.emWidth;
    const list = Array.isArray(poses) ? poses : (poses ? [poses] : []);
    if (!vw || !vh || !list.length) return { scale: signScale, of: signScale / full, why: 'no view' };

    const cams = list.map((p) => {
      const c = new THREE.PerspectiveCamera(camera.fov, vw / vh, camera.near, camera.far);
      c.up.copy(camera.up);
      c.position.copy(p.position);
      c.lookAt(p.target);
      c.updateMatrixWorld(true);
      return c;
    });

    const need = panel && panel.spans && panel.spans.length
      ? panel.bottom + o.signFitGapPx
      : null;

    /**
     * Does the word fit at this scale? The whole rule, in one predicate.
     *
     * A predicate and not a formula because the two constraints do not answer to
     * scale smoothly. As the word shrinks it also withdraws sideways, so the stretch
     * of cap that is actually under a button changes as well as its height — and a
     * closed-form "shrink by this ratio" walks straight past the answer and grinds
     * the word down to the floor chasing a target that moved. Asked instead of
     * solved, the question has no such failure mode.
     */
    function fits(v) {
      applyFitScale(v);
      for (const c of cams) {
        if (need !== null) {
          const top = capTopOver(c, panel.spans, vw, vh);
          if (top !== null && top < need) return false;
        }
        if (!edgeOk(letterBox(c, vw, vh), fitToScreen(c, 0, -0.5, 0, vw, vh), vw, vh)) return false;
      }
      return true;
    }

    let s = full;
    let why = 'full size';
    // The floor in the same units as `full`, and never above it: a floor over the
    // authored size would mean "shrink upward", which is not a thing.
    const floor = Math.min(full, o.signFitFloorWidth / sign.emWidth);
    signUnfit = false;
    if (!fits(full)) {
      if (floor >= full || !fits(floor)) {
        // Nothing AT OR ABOVE THE FLOOR clears it, so there is no size left that is
        // both legible and in the right place — and the word is not shown at all.
        //
        // Two earlier answers to this branch were wrong in opposite directions. It
        // first sat on the floor, which delivered a smudge that was STILL overlapping
        // whatever it had been overlapping — shrinking is a lever on the frame's edges
        // only while the word's own middle is clear of them, and once the middle is
        // under a button every scale is under that button. Then it handed the word
        // back at full size and let the clipping veto decide, which was right for the
        // frame-edge case and wrong for the chrome one: it put a full-size word under
        // the buttons and called it a result.
        //
        // Absence is the answer to both. A word sawn off by the frame edge and a word
        // ground down below the point where it reads are each a sign that has stopped
        // being a sign, and the owner has already given that answer once, for portrait.
        //
        // It is reported, not hidden — `why` and `unfit` both say so.
        why = 'does not fit at or above the floor — not shown';
        signUnfit = true;
      } else {
        // Largest scale that still fits, to within a quarter of a percent. Eleven
        // halvings of a range half a unit wide; it runs once per resize.
        let lo = floor;   // fits
        let hi = full;    // does not
        for (let i = 0; i < 11; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) lo = mid; else hi = mid;
        }
        s = lo;
        why = 'shrunk to fit';
      }
    }

    applyFitScale(s);
    signScale = s;
    cloud.setGrainScale(camera.fov, signScale);

    // ── the veto: a cut word is not shown ──
    // Half a sign hanging off the edge of the frame does not read as a sign, it reads
    // as something broken. If the rule could not get the whole word inside, the word
    // does not appear — absence is the better of the two, and it is the same answer
    // the owner already gave for portrait.
    //
    // Decided HERE, at the fit pose, once per viewport — not per frame. The camera
    // turns all day and the word slides a long way across the frame with it; a veto
    // re-tested every frame would blink the sign in and out as it went, which is worse
    // than either state it was choosing between. So this is a property of the layout,
    // like the scale, and it holds until the viewport changes.
    //
    // Note what it is NOT: a word that fits the frame but stands under a button is
    // still drawn, at full size. That case is about the chrome, not the frame, and a
    // sign beside a button is a sign; a sign with its end sawn off is not.
    signClipped = false;
    for (const c of cams) {
      const b = letterBox(c, vw, vh);
      const onScreen = b.x1 > 0 && b.x0 < vw && b.y1 > 0 && b.y0 < vh;
      if (onScreen && (b.x0 < 0 || b.x1 > vw || b.y0 < 0 || b.y1 > vh)) { signClipped = true; break; }
    }
    applySignOpacity(lastTitleK);

    return {
      scale: s,
      of: s / full,
      why,
      clipped: signClipped,
      unfit: signUnfit,
      floorOf: +(Math.min(full, o.signFitFloorWidth / sign.emWidth) / full).toFixed(4),
      need,
      capTop: need !== null ? capTopOver(cams[0], panel.spans, vw, vh) : null,
      box: letterBox(cams[0], vw, vh),
      view: `${vw}x${vh}`,
    };
  }

  // The bank is lit by the hall, not by itself. The lights themselves are added at
  // scene build and do not come and go, so the LIST is gathered once; their totals
  // are re-read every frame, which costs a loop over three objects and buys the one
  // thing that matters here — turn the hall's lights down and the bank goes with
  // them. A colour read once at build would survive a lights-off check and make the
  // check worthless, which is exactly what it did on the first pass.
  const skyLights = [];
  scene.traverse((n) => { if (n.isAmbientLight || n.isHemisphereLight) skyLights.push(n); });

  // How hard the word is burning RIGHT NOW, 0…1, where 1 is its resting glow.
  // One number, read by both the letters and the bank, so the two can never drift
  // apart — a bank that kept burning through a dip in the letters would read as
  // two separate effects rather than as one sign with a bad contact.
  let signGlowNow = 1;
  // Whether the contact is allowed to stutter at all. Reduced motion turns it off
  // outright; the frame watchdog turns it off later if the device cannot hold up.
  let flickerOn = o.signFlicker && !reduced;

  function relight() {
    let lit = 0;
    for (const n of skyLights) {
      if (!n.visible) continue;
      lit += n.intensity * lum(n.isHemisphereLight ? n.color : n.color);
    }
    cloud.setLit(clamp01(lit / litReference()), signGlowNow);
  }

  // The word's own light, applied. Base intensity comes from the material token,
  // `signGlow` is the framing multiplier, `signGlowNow` the flicker.
  const emissiveBase = (MATERIALS.sign.emissiveIntensity ?? 1) * o.signGlow;
  function applySignGlow(k) {
    signGlowNow = k;
    const e = emissiveBase * k;
    sign.matFront.emissiveIntensity = e;
    sign.matBack.emissiveIntensity = e;
    relight();
  }
  applySignGlow(1);

  // Remember the scene's own resting fog colour so the flight always hands it back
  // exactly. The DISTANCE of the curve is not remembered — it is derived from
  // presence every frame (see applyFog), because where the falloff should start
  // depends on which end of the corridor the camera is standing at.
  const fogBaseColor = new THREE.Color(o.fogRest);
  const smoke = new THREE.Color(o.smoke);
  const _fogC = new THREE.Color();

  let active = false;
  let dir = 'toMode';        // 'toMode' | 'toHome'
  let el = 0;                // elapsed seconds
  let dur = o.duration;
  let withTitle = true;      // does THIS flight carry the title beat?
  let camStartFrac = 0.05;   // FLIGHT.camStartSec expressed against the live duration
  let presence = 0;          // 0 at the home … 1 at the plates (fed by the scene)
  let posCurve = null;
  let lookCurve = null;
  let reverse = false;       // traverse the curve backwards (the way home)
  let onArrive = null;
  let endPose = null;        // cached destination, watched for orientation changes
  let settling = 0;          // >0 while a skip rides out
  let settleFrom = null;
  const _lastLook = new THREE.Vector3(); // the flight's live look point (see currentLook)
  let haveLastLook = false;
  let lastT = 0;             // last scene time seen — keeps the breath continuous
  //                            across the calls that have no clock to hand (play,
  //                            finish, dispose), so it never jumps on a hand-back.
  let slow = 0;              // consecutive stalled frames
  let stalled = false;       // …and whether they actually cut a flight short (dev readout)
  let flights = 0;           // how many this session (2nd+ runs shortened)
  const _look = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  // Build the two curves for a HOME → MODE run. The way back reuses the same pair
  // traversed backwards, so both directions ride literally the same road.
  function buildPath(from, to) {
    const up = new THREE.Vector3(0, 1, 0);
    const viewH = _tmp.copy(from.target).sub(from.position);
    viewH.y = 0;
    if (viewH.lengthSq() < 1e-6) viewH.set(0, 0, -1);
    viewH.normalize();

    let p1; let l1;
    if (o.variant === 'A') {
      // «пролёт» — forward and down; the home passes under the camera.
      p1 = from.position.clone().addScaledVector(viewH, o.diveA).addScaledVector(up, -o.dropA);
      p1.y = Math.max(p1.y, 1.6);
      l1 = from.target.clone().addScaledVector(viewH, 4).addScaledVector(up, -0.6);
    } else {
      // «взлёт» — up and back off the home first; the home stays under us, alive.
      p1 = from.position.clone().addScaledVector(up, o.riseB).addScaledVector(viewH, -o.retreatB);
      l1 = from.target.clone();
    }

    const midZ = THREE.MathUtils.lerp(from.position.z, to.position.z, 0.42);
    // A hump BETWEEN the two heights, not a height stacked on top of the opening
    // lift: stacking sends the camera up like a rocket and leaves the corridor
    // hanging along the top edge of a mostly empty frame.
    const midY = THREE.MathUtils.lerp(p1.y, to.position.y, 0.5) + o.midLift;
    const p2 = new THREE.Vector3(THREE.MathUtils.lerp(p1.x, to.position.x, 0.6), midY, midZ);
    // Mid-corridor look point: a point on the CORRIDOR'S AXIS at the sign's depth —
    // deliberately not the sign itself.
    //
    // It used to be the sign, which was free while the sign stood on the axis and
    // became expensive the moment it did not: aiming the middle of a two-second look
    // path nine units off to one side and back took the peak turn rate from 53 to
    // 89 °/s. That is the beat whipping to keep a landmark centred, and it would have
    // to be re-tuned every time the landmark moved again.
    //
    // Aimed at the axis, the flight and the sign's position are no longer each other's
    // business. The beat frames the corridor it is flying down; the sign stands beside
    // it and is read in passing, which is what a sign in a corridor is for. The arc
    // still humps above, so the camera passes over rather than through.
    const l2 = new THREE.Vector3(0, o.signY, -o.modeZ * o.signAt);

    const back = _p.copy(to.position).sub(to.target);
    back.y = 0;
    if (back.lengthSq() < 1e-6) back.set(0, 0, 1);
    back.normalize();
    const p3 = to.position.clone().addScaledVector(back, o.approachBack).addScaledVector(up, o.approachLift);

    posCurve = new THREE.CatmullRomCurve3(
      [from.position.clone(), p1, p2, p3, to.position.clone()], false, 'catmullrom', 0.4,
    );
    lookCurve = new THREE.CatmullRomCurve3(
      [from.target.clone(), l1, l2, to.target.clone(), to.target.clone()], false, 'catmullrom', 0.4,
    );
    // Both curves are read with getPointAt (ARC LENGTH), never getPoint: the control
    // points are far from evenly spaced, so the raw parameter would sprint the long
    // leg and crawl the short one — the easing below has to be the only thing shaping
    // the speed. The length table is built once, here, not during the flight.
    posCurve.arcLengthDivisions = 240;
    lookCurve.arcLengthDivisions = 240;
    posCurve.updateArcLengths();
    lookCurve.updateArcLengths();
  }

  // The falloff has two inputs, and they are independent on purpose:
  //   · `presence` — WHERE the camera is standing, which picks the resting curve
  //     (home curve ⇔ mode curve). This runs whether or not a flight is playing, so
  //     an orbiting player gets the right curve for the end they are at.
  //   · `env`      — the flight's 0…1 atmosphere envelope, which tightens the curve
  //     mid-corridor and lets it back out on arrival.
  // scene.fog is a THREE.Fog (linear). See the fog block in FLIGHT for why.
  function applyFog(env, t) {
    if (!scene.fog) return;
    if (t !== undefined) lastT = t; else t = lastT;
    const restNear = THREE.MathUtils.lerp(o.fogNearHome, o.fogNearMode, presence);
    const restFar = THREE.MathUtils.lerp(o.fogFarHome, o.fogFarMode, presence);
    const near = THREE.MathUtils.lerp(restNear, o.fogNearFlight, env);
    const far = THREE.MathUtils.lerp(restFar, o.fogFarFlight, env);
    // …and the breath. This is the ONLY thing allowed to move in the corridor now
    // that the billboards are gone: the air is alive because how far you can see
    // wanders a little, not because there is anything hanging in it to look at.
    // Off under reduced motion, with the rest of the scene's idle life.
    const b = reduced ? 1 : 1 + Math.sin(t * o.fogBreathW) * o.fogBreath;
    scene.fog.near = near;
    scene.fog.far = near + (far - near) * b;
    _fogC.copy(fogBaseColor).lerp(smoke, o.fogTint * env);
    scene.fog.color.copy(_fogC);
  }

  // Resting fog is the same function with the flight envelope at zero — there is no
  // separate "off" state to drift out of step with the live one.
  function restFog(t) { applyFog(0, t); }

  function finish() {
    active = false;
    settling = 0;
    settleFrom = null;
    haveLastLook = false; // next flight starts from the orbit pivot again
    restFog();
    const cb = onArrive;
    onArrive = null;
    if (cb) cb(dir);
  }

  // Put the camera exactly on a pose (no motion). Used for a direct URL load, for
  // reduced motion, and as the landing of a skip.
  function snapTo(where) {
    const pose = poseFor(where);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
  }

  /**
   * Fly. `where` is the destination ('mode' | 'home').
   * opts.onArrive(dir) fires once the camera is on the final pose.
   * Every outbound flight carries the title beat — see FLIGHT.shortenRepeats.
   */
  function play(where, opts = {}) {
    onArrive = opts.onArrive || null;
    dir = where === 'home' ? 'toHome' : 'toMode';

    if (reduced) {
      // Reduced motion: no flight at all. The caller covers the swap with a short
      // dim; we just place the camera and report arrival on the next update.
      restFog();
      snapTo(where);
      active = true;
      settling = 0;
      el = 0;
      dur = 0;
      return;
    }

    const short = o.shortenRepeats && flights > 0; // off by default — see the config
    flights += 1;
    // The title beat rides EVERY outbound flight. The way back never carries it: the
    // sign is still there, but as the landmark it is, not as a card being played.
    withTitle = dir === 'toMode' && !short;
    dur = o.duration * (dir === 'toHome' ? o.reverseFactor : 1) * (short ? o.repeatFactor : 1);
    // Hold the opening in real seconds against THIS flight's length, so a slower
    // flight starts just as promptly and spends its extra time further in.
    camStartFrac = Math.min(0.35, o.camStartSec / Math.max(dur, 0.01));

    const here = { position: camera.position.clone(), target: currentLook() };
    if (dir === 'toMode') {
      reverse = false;
      endPose = poseFor('mode');
      buildPath(here, endPose);
    } else {
      // The way home rides the same road backwards: build the outbound path from the
      // home pose to where we are standing now, then traverse it in reverse.
      reverse = true;
      endPose = poseFor('home');
      buildPath(endPose, here);
    }

    el = 0;
    slow = 0;
    stalled = false;
    active = true;
    settling = 0;
    settleFrom = null;
  }

  // The camera's current look point. While the orbit owns the camera this is the
  // orbit pivot the scene hands us (so a flight starts from exactly where the player
  // left it, with no snap on the first frame); while the flight owns the camera the
  // pivot is stale, so the live path look point wins.
  let lookHint = null;
  function setLookHint(v) { lookHint = v; }
  function currentLook() {
    if (active && haveLastLook) return _lastLook.clone();
    if (lookHint) return lookHint.clone();
    return _look.copy(camera.position).addScaledVector(
      camera.getWorldDirection(_tmp), 8,
    ).clone();
  }

  /** A tap anywhere mid-flight: ride out to the end pose. Never a teleport. */
  function skip() {
    if (!active || settling > 0 || dur === 0) return;
    settleFrom = { position: camera.position.clone(), target: currentLook() };
    settling = 0.0001; // >0 marks "settling"; the update advances it
  }

  // The sign's opacity, in ONE place. It is a landmark, and a landmark you can only
  // see from one end of the corridor is not one: the word reads from the home AND
  // from the plates, and what makes it far away is the distance falloff, the same
  // one every other object in the corridor answers to. It used to be multiplied by
  // `presence` as well, which drove it to nothing at the home — belt and braces on a
  // decision that has since been reversed. The title beat only ever ADDS: it swells
  // over the landmark on the way out and then leaves it standing.
  function applySignOpacity(titleK) {
    lastTitleK = titleK;
    const rest = o.signRest;
    const op = Math.max(rest, o.signOpacity * titleK);
    // WHICH HALF the reader is looking at. The sign faces +Z, so the side is simply
    // which side of its own plane the camera is standing on. Only the facing half is
    // drawn; the other one is faded out, because it is not a mirror of the near one
    // (HEXLASH reversed is HSALXEH) and would otherwise show through the gaps.
    // The changeover is a band, not a switch, because it happens with the sign very
    // nearly edge-on and there must be nothing to catch. It is reached in the flight
    // (the camera passes directly over the sign) and, at the home, only from the far
    // corner of the orbit — fully zoomed out and near horizontal, where the camera
    // can just get past z ≈ -9. At the plates it is out of reach entirely: that orbit
    // comes no nearer than z ≈ -21.6.
    const side = clamp01((camera.position.z - sign.group.position.z) / o.signSideBand * 0.5 + 0.5);
    const k = side * side * (3 - 2 * side);
    sign.matFront.opacity = op * k;
    sign.matBack.opacity = op * (1 - k);
    // The bank shares the sign's fate exactly: they arrive together and leave
    // together, because a bank with no word in it is weather and a word with no bank
    // under it is a caption. `sign.group.visible` covers the cloud too — it is a
    // child of the sign group.
    cloud.mat.opacity = o.cloudAlpha * op;
    // …and the fit rule's veto sits on top of both: a word the frame cuts in half is
    // not shown at all. See signClipped. On top of THAT sits the switch — see
    // signShown. It is deliberately the last word and nothing else reads it:
    // everything above still computes exactly as it did, so flipping the switch
    // brings the sign in already fitted and faded to the right side rather than in
    // some stale state.
    sign.group.visible = o.signShown && !signClipped && !signUnfit && op > 0.004;
  }

  // The bank turns, very slowly and RIGIDLY — the whole volume as one body, so it
  // cannot open a seam or make a grain pop across the letters. Ten minutes a turn:
  // it is meant to be a place rather than a picture, not something a player can
  // watch happen. Off under reduced motion, with the rest of the scene's idle life.
  let lastFov = camera.fov;
  function spinCloud(t) {
    // The stutter, before relight — the bank is lit by the word and has to carry the
    // same dip in the same frame, or the two read as two effects.
    //
    // Driven off the scene's OWN running clock, never off flight-elapsed: the rhythm
    // belongs to the object, so it must not restart when the player leaves for the
    // plates and comes back, and must not pause while the camera is moving. It is
    // also applied to both halves of the word equally, so the front/back handover
    // cannot make it jump.
    //
    // Off under reduced motion (steady glow — the sign does not go out, it just stops
    // stuttering) and off once the frame watchdog has thinned the bank: on a device
    // that is already struggling the flicker is the first thing to go and the glow is
    // the last.
    applySignGlow(flickerOn && t !== undefined ? flickerAt(t) : 1);
    if (camera.fov !== lastFov) { lastFov = camera.fov; cloud.setGrainScale(camera.fov, signScale); }
    if (reduced || t === undefined) return;
    cloud.group.rotation.y = t * o.cloudTurn;
  }

  /**
   * Advance the flight. Call once per frame from the scene loop — including while
   * NOTHING is flying, because the sign and the falloff belong to the world, not to
   * the transition, and still have to answer to where the camera is standing.
   * @param dtRaw seconds since the previous frame (clamped inside — a backgrounded
   *              tab must resume, not jump over the move)
   * @param t     scene elapsed time (drives the density breath)
   * @param mix   0 at the home … 1 at the plates
   * @returns true while the director owns the camera
   */
  function update(dtRaw, t, mix) {
    presence = clamp01(mix ?? presence);
    if (!active) {
      // Standing still: the sign is a landmark and the falloff is the weather. Both
      // are simply where the camera is standing.
      applySignOpacity(0);
      spinCloud(t);
      restFog(t); // the falloff follows the camera down the corridor, flight or no flight
      return false;
    }

    // Reduced motion / zero-length run: the caller covers the swap with a dim.
    if (dur === 0) { finish(); return false; }

    const dt = Math.min(Math.max(dtRaw, 0), o.maxDt);
    spinCloud(t);

    // ── riding out a skip ──
    if (settling > 0) {
      settling += dt;
      const k = clamp01(settling / o.settle);
      const s = k * k * (3 - 2 * k);
      const dest = endPose || poseFor(dir === 'toMode' ? 'mode' : 'home');
      camera.position.lerpVectors(settleFrom.position, dest.position, s);
      _lastLook.lerpVectors(settleFrom.target, dest.target, s);
      camera.lookAt(_lastLook);
      const fade = 1 - s;
      applyFog(envelope(clamp01(el / dur), o.fogPeakAt, o.fogPower) * fade, t);
      applySignOpacity(withTitle ? ramp(clamp01(el / dur), o.signIn, o.signHold) * fade : 0);
      if (k >= 1) finish();
      return true;
    }

    el += dt;
    const u = clamp01(el / dur);

    // ── health watchdog ──
    // The flight is driven by the clock, not by frames, so a stall never stretches
    // it — but on a device that is genuinely choking, a stuttering 2.5s of cinema is
    // worse than arriving. Three stalled frames in a row (after the opening beat,
    // where the plates are still waking up) ride it out.
    if (el > o.graceSec) {
      slow = dtRaw > o.lowFpsDt ? slow + 1 : 0;
      if (slow >= o.lowFpsFrames) {
        stalled = true;
        // This device has shown it cannot hold the frame. Thin the sign's bank to
        // its cheap layout for the rest of the session — fewer grains, never none:
        // a word left with no footing reads as something broken, not as restraint.
        cloud.setCount(o.cloudCountLow);
        // …and stop the contact stuttering, with the glow left burning steady. On a
        // frame that is already dropping, a flicker cannot be told from the drop:
        // it stops reading as a sign with a bad contact and starts reading as the
        // page failing. The glow itself is the last thing to go, and it doesn't.
        flickerOn = false;
        applySignGlow(1);
        skip();
        return true;
      }
    }

    // ── orientation change mid-flight ──
    // The destination framing is aspect-dependent; if the device rotated, re-aim at
    // the new pose from wherever we are, in whatever time is left. Position and look
    // both start from the current values, so there is no seam.
    const live = poseFor(dir === 'toMode' ? 'mode' : 'home');
    if (endPose && live.position.distanceTo(endPose.position) > 0.05) {
      const remain = Math.max(0.35, dur - el);
      buildPath({ position: camera.position.clone(), target: currentLook() }, live);
      reverse = false;
      endPose = live;
      dur = remain;
      el = 0;
      camStartFrac = Math.min(0.35, o.camStartSec / Math.max(dur, 0.01));
      return true;
    }

    const e = easeFlight((u - camStartFrac) / (1 - camStartFrac), o.easeTail);
    const param = reverse ? 1 - e : e;
    camera.position.copy(posCurve.getPointAt(param));
    _lastLook.copy(lookCurve.getPointAt(param));
    haveLastLook = true;
    camera.lookAt(_lastLook);

    const env = envelope(u, o.fogPeakAt, o.fogPower);
    applyFog(env, t);

    applySignOpacity(withTitle ? ramp(u, o.signIn, o.signHold) : 0);

    if (u >= 1) {
      const dest = endPose || live;
      camera.position.copy(dest.position);
      camera.lookAt(dest.target);
      finish();
      return false;
    }
    return true;
  }

  function dispose() {
    restFog();
    scene.remove(sign.group);
    cloud.dispose();
    sign.dispose();
  }

  return {
    play, skip, update, snapTo, dispose, setLookHint, fitSign,
    /** Reset the session counter (used when the scene remounts). */
    resetSession() { flights = 0; },
    get active() { return active; },
    /** Did the low-FPS watchdog ride the last flight out early? (dev readout) */
    get stalled() { return stalled; },
    get direction() { return dir; },
    get progress() { return dur > 0 ? clamp01(el / dur) : 1; },
  };
}
