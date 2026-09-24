/* HEXLASH — НАСТОЯЩИЕ ТЕКСТЫ ТРЁХ ГРАНЕЙ И ПЯТНАДЦАТИ КРИСТАЛЛОВ
   (ТЗ 24.09.2026, «настоящие тексты кристаллов»).

   СЛОВАРЬ — тот же, что в coreFacets.js и ForgeCore.vue:
     ГРАНЬ    — весь луч «Печати» целиком. Их ТРИ: BODY · MIND · WILL.
     КРИСТАЛЛ — один из пяти шагов внутри грани. Их ПЯТНАДЦАТЬ.

   ⚠️ ЭТО ТОЛЬКО ПОКАЗ. Ни одного числа, ни одной связи с боем. Файл читается
   ровно двумя местами показа (ядро в зале и строка «из чего собран» в панели)
   и НЕ читается ничем в бою. Что кристалл делает на самом деле — по-прежнему
   в upgradeData.js: сдвиги осей, бонусы, счёт. Их эта правка не трогает.

   ⚠️ ПОЧЕМУ ОТДЕЛЬНЫЙ ФАЙЛ. В игровых данных имя кристалла (`face.name`) было
   одновременно и ключом содержания, и надписью на экране. ТЗ §4.3 велит их
   развести: ключи остаются как есть (они часть счёта), показ уезжает сюда.

   ⚠️ КЛЮЧИ ВНУТРИ — те же a · b · c, что у клиньев общей фигуры (coreFigure)
   и у ветвей игрового дерева (upgradeData). Ничего не переименовано.

   ⚠️ НАБОР ОДИН НА ВСЕ ЧЕТЫРЕ ЯДРА. Пятнадцать — это пятнадцать, а не
   пятнадцать на каждое ядро: тело, ум и воля растут у всякого бойца
   одинаково, ядро говорит, КТО он, кристаллы — КАК он растёт.

   ⚠️ СТРОКА ХАРАКТЕРА СЕГОДНЯ НИЧЕГО НЕ ДЕЛАЕТ (ТЗ §4.5). Это текст.
   Влияние характера на поведение бойца — отдельная работа после демо.

   ⚠️ ПРЕДЛОЖЕНИЯ НАБИРАЮТСЯ СВОИМ РЕГИСТРОМ, не капителью: капитель в системе
   отведена лейблам и ударным словам до трёх (hexlash-design §3). Подпись
   CHARACTER — лейбл, она заглавными; сами фразы — обычные предложения. */

/** Три грани. Ключ — клин общей фигуры, значение — надпись на экране. */
export const FACET_NAMES = { a: "BODY", b: "MIND", c: "WILL" };

/**
 * Пятнадцать кристаллов: по пять в каждой грани, в том же порядке, в каком
 * они стоят на грани от сердца к кромке.
 *   name      — одно слово заглавными;
 *   effect    — что кристалл даёт бойцу в бою;
 *   character — как он меняет манеру бойца (показывается под лейблом CHARACTER).
 */
export const CRYSTAL_TEXTS = {
  a: [
    {
      name: "ROOT",
      effect: "Holds his ground. He no longer gives way when pressed.",
      character: "Stubborn. He backs off less often than he should.",
    },
    {
      name: "DRIVE",
      effect: "The weight moves with the punch, not just the arm.",
      character: "Impatient. He opens the exchange first.",
    },
    {
      name: "GRIND",
      effect: "He does not fade in a long exchange.",
      character: "Takes punishment well. Stays in an exchange past the point where it pays.",
    },
    {
      name: "BREAK",
      effect: "Finds the moment an opponent tips, and pushes through it.",
      character: "Greedy for the finish. Forgets his guard when he smells weakness.",
    },
    {
      name: "ANVIL",
      effect: "The body takes a hit and returns it through movement.",
      character: "Calm under pressure. He no longer panics in the corner.",
    },
  ],
  b: [
    {
      name: "WATCH",
      effect: "Sees where the opponent is going sooner.",
      character: "Careful. Waits a little longer before he enters.",
    },
    {
      name: "TIMING",
      effect: "Lands in the gaps between the opponent's movements.",
      character: "Deliberate. Throws fewer blind punches.",
    },
    {
      name: "FEINT",
      effect: "Lies with the body and punishes the answer.",
      character: "Sly. Starts playing with the opponent and loses tempo.",
    },
    {
      name: "ADAPT",
      effect: "Stops repeating what has already failed twice.",
      character: "Flexible. Changes the plan even where holding it would have paid.",
    },
    {
      name: "COLD",
      effect: "Another man's success does not knock him off his plan.",
      character: "Cold. Never rattled, and never lit up when a spark is what he needs.",
    },
  ],
  c: [
    {
      name: "HOLD",
      effect: "Recovers faster between exchanges.",
      character: "Composed. Asks for fewer pauses.",
    },
    {
      name: "SPITE",
      effect: "The worse it goes for him, the more dangerous he becomes.",
      character: "Angry. Dull in an even fight.",
    },
    {
      name: "VOW",
      effect: "Holds the order he was given to the end instead of drifting off it.",
      character: "Loyal to the order. Improvises worse.",
    },
    {
      name: "HUNGER",
      effect: "Learns faster from what is done to him inside the fight.",
      character: "Eager. Probes where he should not.",
    },
    {
      name: "STILL",
      effect: "Slows down inside at the deciding moment and acts clean.",
      character: "Ice. His overall liveliness drops.",
    },
  ],
};

/** Надпись грани по ключу клина. '' — если ключ чужой. */
export const facetTitle = (facetId) => FACET_NAMES[facetId] || "";

/** Весь текст кристалла: { name, effect, character }. null — если не нашли. */
export const crystalText = (facetId, index) => CRYSTAL_TEXTS[facetId]?.[index] || null;

/** Одно имя кристалла. '' — если не нашли. */
export const crystalTitle = (facetId, index) => crystalText(facetId, index)?.name || "";
