/* HEXLASH — ТЕКСТЫ ТРЁХ ГРАНЕЙ И ПЯТНАДЦАТИ КРИСТАЛЛОВ — СВОИ У КАЖДОГО ЯДРА
   (ТЗ 24.09.2026 «настоящие тексты кристаллов»; ТЗ 02.10.2026 «свои 15 имён у
   каждого ядра»).

   СЛОВАРЬ — тот же, что в coreFacets.js и ForgeCore.vue:
     ГРАНЬ    — весь луч «Печати» целиком. Их ТРИ: BODY · MIND · WILL.
     КРИСТАЛЛ — один из пяти шагов внутри грани. Их ПЯТНАДЦАТЬ на ядро, ШЕСТЬДЕСЯТ всего.

   ⚠️ ЭТО ТОЛЬКО ПОКАЗ. Ни одного числа, ни одной связи с боем. Файл читается
   местами показа (ядро в зале, строка «из чего собран» в панели зала, SPAR) и
   НЕ читается ничем в бою и думающим бойцом (тому идут фразы из facetReadout.js,
   собранные из чисел данных). Что кристалл делает на самом деле — в
   upgradeData.js: сдвиги осей, бонусы, счёт. Их этот файл не трогает.

   ⚠️ ТЕКСТ ОБЯЗАН ОПИСЫВАТЬ ТО, ЧТО КРИСТАЛЛ ДЕЛАЕТ В БОЮ. «Hits harder» — только
   там, где у кристалла есть рост силы удара (рамп ветки или добавка strikePower);
   «tougher / guard» — только где есть toughness / blockMitigation; «breaks guards» —
   только где есть blockPenetration (у заряженного удара — chargePen); «strongest» —
   сверено по числам внутри грани. Строка CHARACTER — наклон выбора намерения
   (branchThreshold.js, TAG_LEANS) и сдвиги осей, без обещаний приёмов. Меняется
   механика кристалла — перечитай его строки (сверка — docs/crystal-texts/TABLE.md).

   ⚠️ ИМЕНА ЗДЕСЬ — НАДПИСЬ ДЛЯ ИГРОКА, а не ключ. В игровых данных имя кристалла
   (`face.name`) — ключ содержания и часть счёта, его не трогаем; кое-где оно
   расходится с надписью (Inside Work ↔ Close Power, Sticky ↔ Cut Off, Late Fire ↔
   Building Momentum, No Letup ↔ No Breather, Sting the Swing ↔ Feint to Interrupt,
   Seize the Open ↔ Strike the Open, Answer the Swing ↔ Punish Aggression, Long Game ↔
   Run 'Em Ragged). Переименование — только здесь.

   ⚠️ КЛЮЧИ ВНУТРИ — ядро (natisk · nalet · skala · zasada, как в upgradeData.js),
   затем a · b · c, как у клиньев общей фигуры (coreFigure) и веток игрового дерева.
   Порядок кристаллов — от сердца грани к кромке.

   ⚠️ ПРЕДЛОЖЕНИЯ НАБИРАЮТСЯ СВОИМ РЕГИСТРОМ, не капителью: капитель в системе
   отведена лейблам и ударным словам до трёх (hexlash-design §3). Имя кристалла —
   лейбл, оно заглавными; сами фразы — обычные предложения. */

/** Три грани. Ключ — клин общей фигуры, значение — надпись на экране. Одни у всех ядер. */
export const FACET_NAMES = { a: "BODY", b: "MIND", c: "WILL" };

/**
 * Шестьдесят кристаллов: ядро → грань (a/b/c) → пять { name, effect, character }.
 *   name      — надпись кристалла (лейбл, заглавными);
 *   effect    — что кристалл даёт бойцу в бою;
 *   character — как он меняет манеру бойца.
 */
export const CRYSTAL_TEXTS = {
  /* ONSLAUGHT */
  natisk: {
    a: [
      { name: "HEAVY HIT", effect: "Hits harder. Every step carries more weight.", character: "Heavy and unhurried. Trades speed for mass." },
      { name: "GUARD CRUSH", effect: "His blows break through a raised guard.", character: "Sees a closed guard and swings into it anyway." },
      { name: "UNSHAKEN", effect: "A hit no longer knocks him off his swing.", character: "Stands his ground when the opponent attacks." },
      { name: "INSIDE WORK", effect: "Hits harder and fights from closer in.", character: "Wants to be right up close. Swings the moment he is in reach." },
      { name: "BREAKTHROUGH", effect: "Goes straight through the guard.", character: "Smells a hurt opponent and goes for the finish." },
    ],
    b: [
      { name: "HARD ENTRY", effect: "Closes the gap fast. His first blow rarely misses.", character: "Goes in first and swings on arrival." },
      { name: "RUN-DOWN", effect: "Hits a little harder and keeps the distance short.", character: "When the opponent goes quiet, he attacks." },
      { name: "STICKY", effect: "Stays on the opponent after the exchange. Breaks through guards.", character: "Once he is close, he stays there and holds his ground." },
      { name: "CLING", effect: "Hard to knock off his swing. Stays glued in close.", character: "Refuses to step back once inside." },
      { name: "LOCKDOWN", effect: "Hits harder, breaks guards and stays right on top of the opponent.", character: "Pins himself to the opponent. Almost never lets go." },
    ],
    c: [
      { name: "LONG COMBO", effect: "A touch quicker, a touch heavier on the hands.", character: "In reach, he throws instead of waiting." },
      { name: "NO PAUSE", effect: "Quicker pace and harder hits.", character: "Swings the moment the opponent is caught off balance." },
      { name: "LATE FIRE", effect: "Picks up the pace and hits a little harder.", character: "The longer the fight, the more he swings." },
      { name: "NO LETUP", effect: "Quicker, harder, and stays on the opponent after the exchange.", character: "If the opponent stops attacking, he does not stop." },
      { name: "RAMPAGE", effect: "The biggest gain in hitting power in this branch.", character: "Swings at every chance he gets." },
    ],
  },
  /* RAIDER */
  nalet: {
    a: [
      { name: "QUICK OUT", effect: "Hits harder and keeps more distance.", character: "Lands and gets out. Breaks off when the opponent gets close." },
      { name: "PINPOINT ENTRY", effect: "His entry rarely misses.", character: "Takes the initiative when the opponent goes quiet." },
      { name: "FAR BOUNCE", effect: "Hits harder, bounces far out after the exchange and slips more.", character: "Lives at long range." },
      { name: "CLEAN EXCHANGE", effect: "Quicker in and out, with harder hits.", character: "Prefers quick pokes to a long exchange." },
      { name: "PERFECT PRICK", effect: "In, hit, out: the hardest pokes in this branch, and hard to touch.", character: "When the opponent goes quiet, he darts in." },
    ],
    b: [
      { name: "FAKE-IN", effect: "Fakes more often.", character: "When the opponent swings, he steps off instead of meeting it." },
      { name: "PUNISH REACTION", effect: "When the opponent bites on a fake, the answer hits harder.", character: "Presses in when the opponent covers up." },
      { name: "BROKEN RHYTHM", effect: "Quicker pace and harder hits.", character: "Breaks off in close and comes back on his own timing." },
      { name: "STING THE SWING", effect: "Quicker and harder.", character: "Answers the opponent's swing with a quick poke." },
      { name: "SETUP COMBO", effect: "The fake opens the way: the follow-up hits hardest and breaks through guards.", character: "Up close, he commits to the full combination." },
    ],
    c: [
      { name: "READ THE TELL", effect: "Hits harder and more accurately.", character: "Waits for the opponent to swing, then answers." },
      { name: "SEIZE THE OPEN", effect: "Hits harder.", character: "Goes in when the opponent is off balance." },
      { name: "CHARGED RUN", effect: "Hits harder and builds his power blow faster.", character: "Keeps his distance and pokes while he loads." },
      { name: "PUNISH AGGRESSION", effect: "Hits harder and punishes openings.", character: "Answers aggression with a counter." },
      { name: "KILLING RUN", effect: "His charged blow lands much harder.", character: "Once loaded, he goes in to spend it." },
    ],
  },
  /* BULWARK */
  skala: {
    a: [
      { name: "TOUGH HIDE", effect: "Takes hits better. A slightly stronger guard.", character: "Holds his ground in close." },
      { name: "STEADY GUARD", effect: "Harder to knock off his rhythm. A stronger guard.", character: "Holds his ground against an attack." },
      { name: "CATCH BREATH", effect: "Tougher, and recovers his wind faster.", character: "Uses the quiet moments to steady himself." },
      { name: "DIG IN", effect: "Tougher, with a much stronger guard. Plants himself closer.", character: "Close in, he digs in and does not move." },
      { name: "UNBREAKABLE", effect: "His guard stops even more of the damage.", character: "Always ready to stand and absorb." },
    ],
    b: [
      { name: "RIPOSTE", effect: "Tougher. After a block, his answer hits harder.", character: "Meets an attack by stepping into it." },
      { name: "CATCH & PUNISH", effect: "Catching a swing mid-motion hurts the opponent more.", character: "Pushes in when the opponent is off balance." },
      { name: "HARD MEET", effect: "Catching a swing hurts even more.", character: "Steps forward into anyone who comes close." },
      { name: "RETALIATION", effect: "His answer after a block hits harder.", character: "Swings back when the opponent swings." },
      { name: "SEA WALL", effect: "His strongest answer after a block. A swing he catches hurts too.", character: "In a long fight he waits for the swing and punishes it." },
    ],
    c: [
      { name: "BODY SHOVE", effect: "Fights closer and breaks guards a little.", character: "Leans on the opponent in close." },
      { name: "HEAVY SLAM", effect: "His blows break through a guard. Heavier on his feet.", character: "In reach, he throws the heavy one." },
      { name: "NO WAY AROUND", effect: "Stays on the opponent after the exchange.", character: "When the opponent covers up, he holds his place and keeps him in front." },
      { name: "PIN", effect: "Fights closer and stays there.", character: "Once close, he holds the opponent in place." },
      { name: "CLINCH", effect: "Breaks through guards and stays fully on the opponent.", character: "Grinds forward in close and never lets go." },
    ],
  },
  /* AMBUSH */
  zasada: {
    a: [
      { name: "HARD COUNTER", effect: "His counters come more readily.", character: "Answers a swing with a swing." },
      { name: "SLIP COUNTER", effect: "A slipped blow arms a stronger counter.", character: "Strikes when the opponent goes quiet." },
      { name: "ANSWER THE SWING", effect: "Punishes openings more.", character: "The opponent's attack is his cue to strike." },
      { name: "PUNISH WHIFF", effect: "The opponent's miss opens a counter.", character: "Strikes the moment the opponent is off balance." },
      { name: "PERFECT TRAP", effect: "A slip arms his strongest counter. The opponent's misses are punished too.", character: "Waits in silence, then strikes." },
    ],
    b: [
      { name: "LONG SLIP", effect: "Slips further and keeps more distance.", character: "Meets a swing with a poke from range." },
      { name: "HARD TO REACH", effect: "Harder to hit and harder to reach.", character: "In a long fight he works from range." },
      { name: "LONG GAME", effect: "Keeps distance and slips more.", character: "Settles into pokes from range as the fight drags on." },
      { name: "OPEN WINDOW", effect: "A slip sets up his next blow.", character: "Strikes when the opponent is off balance." },
      { name: "PHANTOM", effect: "The hardest fighter in this branch to touch.", character: "When he takes damage, he goes elusive and pokes." },
    ],
    c: [
      { name: "LOADED HIT", effect: "Hits harder. His charged blow lands heavier.", character: "Once loaded, he lets it go." },
      { name: "LONG CHARGE", effect: "Hits harder and can store a bigger charge.", character: "Keeps loading instead of spending." },
      { name: "HIT THE OPENING", effect: "Hits harder.", character: "Waits for the opening, then strikes." },
      { name: "PIERCE", effect: "His charged blow breaks through a guard.", character: "Swings into a raised guard." },
      { name: "EXECUTION", effect: "The heaviest charged blow in this branch.", character: "Close in, he goes for the finish." },
    ],
  },
};

/** Надпись грани по ключу клина. '' — если ключ чужой. */
export const facetTitle = (facetId) => FACET_NAMES[facetId] || "";

/** Весь текст кристалла: { name, effect, character }. null — если ядра/места не нашли. */
export const crystalText = (coreId, facetId, index) => CRYSTAL_TEXTS[coreId]?.[facetId]?.[index] || null;

/** Одно имя кристалла. '' — если не нашли. */
export const crystalTitle = (coreId, facetId, index) => crystalText(coreId, facetId, index)?.name || "";
