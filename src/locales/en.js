export default {
  loading: "Loading...",
  connection: "No connection to server. Please check your internet connection.",
  close: "Close",
  modal: {
    btnCancel: "Cancel",
    btnConfirm: "Confirm",
    btnOk: "OK",
    btnSave: "Save",
    btnCreate: "Create",
    btnNext: "Next",
  },
  rotateHint: {
    label: "Rotate your device for the best view",
    dismiss: "Tap to continue",
  },
  // Лендинг (/). Первый раздел строк витрины: до этой правки весь её текст был
  // зашит в разметку. Остальные секции лендинга сюда ещё не перенесены.
  // Внутренние слова (HOUSE, HEXARCH, ASCENSION, TEMPER, DOCTRINE) во внешний
  // текст не идут — правило проекта.
  landing: {
    hero: {
      lead: "TRAIN THE AI UNTIL IT BECOMES THE TRAINER.",
      leadSub: "Fighters that think, remember, and eventually take command.",
    },
  },
  profile: {
    // Web3 wallet strings. Their UI consumers (ConnectWallet / BuyTokens) were
    // deleted (sub-wave 1.5); only `checkLimits` is still referenced — via the
    // preserved contract subsystem (contractState.js, t('profile.wallet.checkLimits')).
    // The remaining keys are orphaned and flagged for a follow-up i18n cleanup
    // (kept for now because this section is reached by dynamic t('profile.wallet.*')
    // string paths).
    wallet: {
      lblTopUpBalance: "Top Up Balance",
      lblBuyFCTokens: "Buy HXL tokens",
      lblSelectToken: "Select token",
      lblAmount: "Amount",
      lblYouWillGet: "You will get",
      lblFCTokens: "HXL tokens",
      lblReconnectWallet: "Reconnect",
      lblGameBalance: "GAME BALANCE",
      lblWithdrawToWallet: "Withdraw to wallet",
      lblConnecting: "Connecting...",
      lblConnectYourWallet: "Connect your wallet",
      lblInsufficientBalance: "Your current balance is not enough to buy the selected amount of tokens.",
      approveExplainTitle: "Approving the spending transaction...",
      approveExplainDesc: "We are currently requesting approval. This allows us to use your tokens for purchasing HXL.",
      approvedAmount: "Already approved for use:",
      purchaseExplainTitle: "Confirm the transaction in your wallet...",
      purchaseExplainDesc: "Please confirm the purchase of HXL tokens in your wallet. The transaction will be completed once you approve it.",
      successPurchase: "Your purchase was successful. The tokens will appear in your balance within 15 minutes.",
      checkLimits: "You cannot buy less than 100 HXL or more than 100,000 HXL",
    },
  },
  referral: {
    lblTitle: "Referral Program",
    lblCopyLink: "Copy Link",
    lblShare: "Share",
    lblCopied: "Copied!",
    lblFriendsInvited: "Friends invited",
    lblRewardPerInvite: "+500 taps per invite",
    lblRecentReferrals: "Recent referrals",
    lblNoReferrals: "No referrals yet. Share your link!",
    lblDaysAgo: "{days} days ago",
    lblToday: "Today",
    lblHaveCode: "I have referral code",
    lblCodeApplied: "Referral code applied",
    lblReferralButton: "Referral",
  },
  // Player HOME chrome (2D controls over the 3D HomeScene). UI is en-only.
  home: {
    brand: "HEXLASH",            // brand wordmark (left lock-up, monochrome)
    shop: "Shop",                // cluster — shop segment label
    back: "Back",                // same chip while the shop is open (← arrow)
    shopSub: "DECOR · MORE",     // shop-chip sublabel — still used by the PveView strip
    fight: "FIGHT",              // the hero action (the one pink + glow)
    fightSub: "SEND YOUR FIGHTER TO THE ARENA",
    editSpace: "EDIT SPACE",     // corner button → decor arrange mode (single-label chip)
  },
  // Mode stage — the ARENA / FORGE fork. Not a screen any more: the home FIGHT
  // button flies the camera out to two plates standing in the same world, and these
  // are the captions anchored over them (+ the one control that stage carries).
  //
  // The keys keep their old pve/pvp names because the plate ids are wired through
  // the scene, the tags module and the router; the WORDS PVE and PVP are gone from
  // the product and must not come back into any string the player can read.
  //   pve → FORGE  (the hexarch trains the roster)   → /play/pve
  //   pvp → ARENA  (fight another trainer)           → /play
  mode: {
    back: "← Back",
    pveName: "FORGE",
    pveDesc: "The hexarch trains your roster",
    pvpName: "ARENA",
    pvpDesc: "Fight another trainer",
  },
  // Space — the /play/space 3D preview. Direct-URL only since Ground Select was
  // removed (24.08.2026); `doorEnter` went with that screen's SPACE door, its only
  // consumer. UI is en-only.
  space: {
    // matte "mode coming soon" note over the preview scene (SOON mark lives with it)
    previewNote: "Space — a big field, everyone for themselves. Mode coming soon. This is a preview of how it will look.",
  },
  // FORGE hall (/play/pve) — the roster on the platform + the picked fighter's card
  // and tree. The tree strings came with the mechanic from the retired pre-fight
  // upgrade screen (which carried its copy inline); they are keyed here.
  forge: {
    noFights: "none yet",
    // tree
    openCrystals: "Open the crystals",
    stepCore: "Core",
    stepCrystal: "Crystal",
    stepFacet: "Facet",
    hintCore: "Tap the core to enter the tree",
    hintCrystal: "Pick a crystal",
    hintFacet: "Light one — quench another",
    stLit: "Lit",
    stOpen: "Open",
    stLocked: "Locked",
    stLimit: "Limit",
    stNoPts: "No pts",
    // Грань видна, но занятие под неё не отработано. Молчаливой недоступности
    // быть не должно: игрок обязан понимать, что именно мешает.
    stUntrained: "Untrained",
    buildEmpty: "NOTHING LIT YET",

    // ── the hall's PANEL (the block beside the 3D hall) ──────────────────
    // Каждая подпись — заглавными, как в макете панели. Внутренний словарь
    // (HEXARCH и прочее) сюда не попадает: игрок его не видит.
    selected: "SELECTED",
    fightsLabel: "FIGHTS",
    // ── тренировка (18.09.2026) ──────────────────────────────────
    // Три слова на три состояния. Ни цифр, ни процентов, ни остатка времени:
    // занятие — событие, а не накопление, и его ход показывает тело в зале.
    stateLabel: "STATE",
    stFree: "FREE",
    stTraining: "TRAINING",
    // Метка «готов». Самое простое слово из возможных: оно читается и в шапке,
    // и в узкой строке списка, и не притворяется наградой.
    stReady: "READY",
    // кнопка
    trainStart: "TRAIN",
    trainCancel: "CANCEL",
    // причины отказа — спокойными словами, без восклицаний
    whyBusy: "HE IS WORKING · LET HIM FINISH",
    whyReady: "HIS LESSON IS DONE · LIGHT A FACET TO TAKE IT",
    whyFull: "EVERY FACET IS LIT · NOTHING LEFT TO WORK FOR",
    whyUntrained: "A FACET IS EARNED, NOT PICKED · TRAIN HIM FIRST",
    whyHolds: "ONE LESSON, ONE FACET · LIGHT THE ONE HE EARNED FIRST",
    // строка под кнопкой, пока занятие идёт — ни чисел, ни полосы
    trainingNote: "HE IS DRILLING IN THE HALL",
    readyNote: "HIS LESSON IS DONE · ONE FACET IS HIS TO LIGHT",
    // шапка — по одному состоянию на строку
    headNoPick: "NO FIGHTER",
    headNoPickSub: "PICK ONE FROM THE ROSTER",
    headEmpty: "NO FIGHTERS",
    headLoading: "LOADING FIGHTER",
    headError: "FIGHTER DATA DID NOT LOAD",
    // дерево — состояния
    treeHint: "PICK A CRYSTAL TO LIGHT A FACET",
    treeSpent: "RESOURCE SPENT · NOTHING LEFT TO LIGHT",
    treeNoFighter: "NO TREE WITHOUT A FIGHTER",
    treeLoading: "READING FIGHTER · {n} OF {total}",
    treeErrorTitle: "TREE DID NOT LOAD",
    treeErrorBody: "SOMETHING WENT WRONG. THE FIGHTER IS FINE.",
    retry: "RETRY",
    // ОСИ БОЙЦА в блоке статов. Имена самих осей приходят из набора осей
    // (data/behavior.js) и не переводятся — они внутренние имена механики.
    traitsLabel: "TRAITS",
    // строка характера
    styleLabel: "STYLE",
    // список ростера
    rosterLabel: "ROSTER",
    rosterEmptyTitle: "YOUR ROSTER IS EMPTY",
    rosterEmptyBody: "A FIGHTER IS BORN WITH A CORE. TAKE ONE AND THE HALL OPENS.",
    newFighter: "NEW FIGHTER",
    // подписи кнопки боя (fight / fightBlocked) сняты 15.09.2026 вместе с самой
    // кнопкой: из зала в бой больше не уходят, см. ForgePanel.vue
    // строка гостя
    guestLine: "GUEST · WORK IS KEPT WHILE THIS TAB IS OPEN",
  },
  // Ворота арены — пространство за дверью ARENA. Имена и строки самих режимов
  // лежат в data/arenaModes.js рядом с их размерами состава: они игровые данные,
  // а не оформление, и раздваивать их между двумя файлами нечем.
  // Баффы в бою: короткая строка под панелью карточек. Больше слов у баффов нет
  // — имена предметов (TOWEL / BUCKET / DICE) собственные и не переводятся.
  buffs: {
    tapFighter: "TAP YOUR FIGHTER",
    noTarget: "NO TARGET — A BUFF IS ALREADY RUNNING",
  },
  gate: {
    soon: "SOON",
    // Баффы — три слота «В бой» на шаге выбора бойца (ТЗ 22.09.2026, работа 2).
    buffKit: "Take into the fight",
    buffEmpty: "EMPTY",
    buffNone: "No buffs in stock — the fight starts without them.",
    // Боец на тренировке: остров затемнён и не нажимается. До демо не
    // встречается — ставить бойца на тренировку пока некому.
    forge: "FORGE",
    inForge: "IN THE FORGE",
    // Строка шага на выборе бойцов.
    pickOne: "Pick one fighter.",
    pickMore: "Pick {n} more fighters.",
    squadReady: "Squad ready.",
    // Пустой ростер — честное состояние, а не пустое поле. Те же слова, что на
    // плоском экране состава: игрок встречает одно и то же сообщение, откуда бы
    // он ни пришёл.
    emptyTitle: "No fighters left.",
    emptyNote: "Your roster is empty — there is nobody to send in. Recruit in the shop, then come back.",
    noFighters: "No fighters to send. Recruit in the shop.",
    // ⚠️ Плоская кнопка в бой. Игроку её больше не показывают: в сцене стоит
    // объёмная. Остаётся запасным путём под служебным признаком ?flatstart=1 —
    // пока объёмную не проверили на телефоне, дорога в бой не должна зависеть
    // только от неё.
    toArena: "To arena",
    // ⚠️ Ключа `fight` («FIGHT» под кнопкой) здесь БОЛЬШЕ НЕТ. Слово переехало
    // на сам предмет: оно прорезано насквозь в табличке, стоящей на плите
    // кнопки (scene/gateFightPlaque.js). Буквы там — геометрия, а не текст, и
    // перевода у них нет: это марка действия, как и знак игры.
    // ПРАВИЛА РЕЖИМА — одна строка у кнопки FIGHT. Говорит, чем этот бой
    // отличается от прочих, ровно в тот момент, когда игрок готов в него выйти.
    // Ключи — идентификаторы режимов (см. data/arenaModes.js); читаются по
    // ключу на ходу, поэтому поиском по `t.gate.rules.duel` не находятся.
    rules: {
      duel: "One on one. Last fighter standing wins.",
      squad: "Your team against theirs. Last side standing wins.",
      chain: "3 fights in a row. HP carries over. Lose once — the run is over.",
      raid: "3 allies join you. Bring down the boss.",
      collapse: "Win every round to take the tournament. Lose once — you're out.",
      openfield: "Twenty sides enter one field. No rounds, no pairs — last side standing wins.",
    },
    // Командный бой: сколько бойцов с каждой стороны. Переключатель стоит только
    // в SQUAD — у дуэли выбора нет.
    sizeLabel: "{n} v {n}",
    // Бойцов в ростере меньше, чем просит выбранный размер. Честное состояние:
    // размер выбрать можно, но в бой не выйти, пока некого поставить.
    needOne: "Need 1 more fighter",
    needMany: "Need {n} more fighters",
  },
  cabinet: {
    // Entry chip (top-left of the home) — the single door into the cabinet.
    chipHandle: "GHOST_0xA4",
    chipOpen: "OPEN CABINET",
    // Shell
    title: "Cabinet",
    back: "Cabinet",
    close: "Close",
    soon: "SOON",
    // Profile (landing section)
    fighterLabel: "YOUR FIGHTER",
    fighterName: "GHOST",
    coreSuffix: "CORE",
    seasonLabel: "SEASON 0",
    rankValue: "UNRANKED",
    // Section rows
    rowBalance: "Balance",
    rowBalanceSub: "Your $HEX",
    rowReferrals: "Referrals",
    rowReferralsSub: "Invite & earn",
    rowQuests: "Quests",
    rowQuestsSub: "Daily contracts",
    rowLeaderboard: "Leaderboard",
    rowLeaderboardSub: "Season ranks",
    rowSettings: "Settings",
    rowSettingsSub: "Language · sound · motion",
    // Account bind ribbon
    bindTitle: "SAVE YOUR PROGRESS",
    bindDesc: "Link an account to keep your fighter, space & balance.",
    bindCta: "Link account",
    bindLinkedTitle: "Account linked",
    bindLinkedDesc: "Your progress is saved.",
    toastLinked: "Account linked",
    // Balance
    balanceTitle: "Balance",
    balanceUnit: "$HEX",
    txHistory: "Transaction history",
    txHistoryDesc: "Your $HEX movements will show up here.",
    depositWithdraw: "Deposit / Withdraw",
    depositWithdrawDesc: "On-chain deposits & withdrawals open later.",
    // Referrals
    referralsTitle: "Referrals",
    refLinkLabel: "Your referral link",
    copy: "Copy",
    copied: "Copied",
    toastCopied: "Link copied",
    promoLabel: "Promo code",
    promoPlaceholder: "Enter code",
    apply: "Apply",
    toastApplied: "Code applied",
    invitesRewards: "Invites & rewards",
    invitesRewardsDesc: "Track invited friends and rewards here.",
    // Quests (honest empty)
    questsTitle: "Quests",
    questsEmptyTitle: "NO ACTIVE CONTRACTS",
    questsEmptySub: "OPENS AT LAUNCH",
    // Leaderboard (honest empty)
    leaderboardTitle: "Leaderboard",
    leaderboardEmptyTitle: "SEASON 0 — UNRANKED",
    leaderboardEmptySub: "RANKS OPEN AT LAUNCH",
    // Settings
    settingsTitle: "Settings",
    settingLanguage: "Language",
    settingLanguageValue: "ENG",
    settingSound: "Sound",
    settingVolume: "Volume",
    settingReducedMotion: "Reduced motion",
    // Footer (every section)
    footPrivacy: "Privacy Policy",
    footTerms: "Terms of Use",
    socialX: "X",
    socialDiscord: "Discord",
  },
  // SHOP (/play/home → SHOP). Three tabs: Decor (live visual buy facade) +
  // Currency / Specials (Stage-2 stubs behind the SOON flag). en-only.
  shop: {
    title: "Shop",
    unit: "$HEX",
    soon: "Soon",
    buy: "Buy",
    owned: "Owned",
    creed: "Cosmetic Only · No Pay-to-Win",
    // section tabs
    tabDecor: "Decor",
    tabCurrency: "Currency",
    tabSpecials: "Specials",
    tabBuffs: "Buffs",
    // DEV console — owner tool, temporary. Goes out with the tab.
    tabDev: "Dev",
    ledeDev: "Owner controls. Nothing on this tab is part of the game.",
    dev: {
      warn: "Temporary tool — it will be removed once the game says where fighters come from. The roster lives in this browser tab only: open the game in a second tab and that tab starts empty.",
      rosterLabel: "Roster",
      coreLabel: "Core",
      random: "Random",
      recruit: "Give fighter",
      full: "Roster is full — remove one to make room.",
      empty: "No fighters yet.",
      remove: "Remove",
    },
    ledeDecor:
      "Furnish your floor. Each piece is cut from the same low-poly stock as the arena — but now it carries the light of the core it’s tuned to. Colour tells you which core; it never buys you an edge.",
    ledeCurrency:
      "Top up $HEX. Bigger packs carry more free $HEX and a better rate — the value ladder rewards going large.",
    // БАФФЫ. Единственный раздел магазина, который трогает бой, — и потому
    // единственный, который НЕ продаётся за $HEX. Строка ниже говорит это прямо:
    // общий девиз магазина «косметика не трогает бой» здесь не подходит.
    ledeBuffs:
      "Throw-in items for the fight. Bought with LASH, which you earn by fighting — never with $HEX.",
    buffs: {
      towel: "Restores health. Faster get-up.",
      bucket: "Moves faster. Closes distance sooner.",
      dice: "Roll for bonus damage. Never a bad roll.",
    },
    buffHave: "You have",          // "You have ×3"
    buffBought: "Added to stock",  // короткое подтверждение на карточке
    buffNeed: "Need {n} more LASH",
    buffEarn: "LASH comes from fights.",
    ledeSpecials:
      "Rotating deals, a free daily drop and a starter bundle. Timers and rewards run on the Stage-2 economy.",
    // decor sub-tabs
    subDecor: "Decor",
    subSkins: "Fighter Skins",
    subFx: "FX",
    subCores: "Cores",
    // decor card tags
    tagNew: "New",
    tagOwned: "Owned",
    tagFeatured: "Featured",
    neutral: "Neutral",
    featuredTuning: "Featured Tuning",
    tuningWord: "tuning",   // "{Core} tuning"
    decor: {
      banner: { name: "Sentry Banner", sub: "Onslaught tuning · marks your ground" },
      dais: { name: "Hex Dais", sub: "Bulwark tuning · a stage of your own" },
      corePlinth: { name: "Core Plinth", sub: "Raider tuning · cradles a dormant core" },
      arch: { name: "Ward Arch", sub: "Ambush tuning · frames the entrance" },
      crates: { name: "Supply Cache", sub: "Neutral stock · honest clutter" },
      plinth: { name: "Step Plinth", sub: "Neutral base · pairs with anything" },
    },
    // currency
    curWhatIs: "What is $HEX",
    curWhatIsBody: "The arena's currency. Stack it, then spend it on decor and cosmetics.",
    curRule: "Cosmetics never touch the fight.",
    curRuleBody: "$HEX buys how your floor looks — never an edge in the cage.",
    bestValue: "Best Value",
    valueWord: "Value",
    bonusFree: "free",        // "+{n} free"
    bonusIncluded: "included",
    baseRate: "base rate",
    currency: {
      spark: { name: "Spark" },
      kit: { name: "Field Kit" },
      cache: { name: "Cache" },
      vault: { name: "Vault" },
      arsenal: { name: "Arsenal" },
    },
    // specials
    hotDeal: "Hot Deal",
    freeClaim: "Free Claim",
    bundle: "Bundle",
    claim: "Claim",
    specials: {
      hot: { name: "Arena Cache", sub: "Hot deal · resets every 24h", l1: "2,000 $HEX", l2: "Supply Cache — decor" },
      daily: { name: "Daily Drop", sub: "Claim once every 24h", reward: "+250 $HEX", note: "Free login reward. Stacks a streak." },
      starter: { name: "First Blood Kit", sub: "Starter bundle · best first buy", l1: "2,500 $HEX", l2: "Ward Arch — Ambush decor" },
    },
    // buy modal
    confirmEye: "Confirm Purchase",
    cosmeticLine: "Cosmetic only — it never touches the fight.",
    neutralPiece: "Neutral piece",
    lblPrice: "Price",
    lblBalance: "Balance",
    lblBalanceAfter: "Balance after",
    cancel: "Cancel",
    confirm: "Confirm",
    unlockedTitle: "Unlocked",
    unlockedYours: "is yours. Place it from",  // "{name} is yours. Place it from ARRANGE MODE on your floor."
    arrangeMode: "Arrange Mode",
    unlockedTail: "on your floor.",
    newBalance: "New balance",
    done: "Done",
    // wallet modal
    walletEye: "Connect Wallet",
    walletTitle: "Top Up $HEX",
    walletBody: "Real-money top-ups need a connected wallet on Base. This goes live in Stage 2 — wiring shown for layout only.",
    provBase: "Base Wallet",
    provMeta: "MetaMask",
    provOther: "Other wallets",
    close: "Close",
    connect: "Connect",
    walletStamp: "Stage 2 · live wallet + real money",
    // claim modal
    claimEye: "Daily Drop",
    claimTitle: "Not Yet Live",
    claimBody: "Daily rewards turn on with the Stage-2 economy. Win fights and log in daily to build a streak — then claim here.",
    gotIt: "Got It",
    claimStamp: "Stage 2 · rewards economy",
  },
  verify: {
    title: "Email verification",
    successMsg: "Your email has been successfully verified! Thank you for confirming. You can continue using the service as usual.",
    errorMsg: "There was an issue verifying your email. Please check the code and try again. If the problem persists, please contact support.",
  },
  // Arena — the fight scene. Only the failure state speaks here: everything else
  // in the arena is 3D, and the dev panel is not player-facing copy.
  arena: {
    failedTitle: "The arena didn't open",
    failedNote: "The scene failed to build. This is on us, not on your connection. Head home and step back in.",
    failedBack: "Back to home",
  },
  // ИТОГ БОЯ — панель после любого боя, кроме забега. До неё арена не сообщала
  // исход никак: бой замирал, и на экране не оставалось ни одной кнопки.
  // LASH — игровые монеты. Имя собственное, английскими буквами, как названия
  // баффов: переводить его некуда, проект только на английском.
  lash: {
    unit: "LASH",
  },
  fight: {
    victory: "Victory",
    victoryNote: "Your side is the last one standing.",
    defeat: "Defeat",
    defeatNote: "Your side fell.",
    // РЕЙД. Заголовки те же — исход у боя один, — а строка под ними другая:
    // рейд выигран падением босса, а не тем, что своя сторона осталась одна.
    victoryNoteRaid: "The boss is down.",
    defeatNoteRaid: "Your team fell.",
    again: "Fight again",
    toGate: "Back to the gate",
  },
  // ЗАБЕГ (CHAIN) — три боя подряд одним бойцом. Панель между раундами, итог
  // забега и сообщение о брошенном забеге. Больше про забег нигде не говорится:
  // над головой соперника по-прежнему YOU / FOE, как в обычном бою.
  chain: {
    round: "Round {n} / {of}",
    hp: "HP",
    foe: "Foe",
    stake: "Stake",
    nextBtn: "Next",
    complete: "Chain complete",
    completeNote: "Every round survived. Your fighter walks out of it.",
    broken: "Chain broken",
    brokenNote: "Round {n} ended the run. Everything on the line is gone.",
    toGate: "Back to the gate",
    interrupted: "Run interrupted",
  },
  // ТУРНИР (COLLAPSE) — сетка на выбывание. Панель между волнами, итог турнира и
  // честное состояние «бойцов не хватает». Больше про турнир нигде не говорится:
  // над головой соперника по-прежнему YOU / FOE, как в обычном бою.
  //
  // ⚠️ НАГРАД НЕТ. Системы наград в игре нет, тема отложена владельцем — поэтому
  // здесь нет ни ставки, ни приза: слово о награде, которой не существует,
  // читалось бы как обещание.
  collapse: {
    wave: "Wave {n} / {of}",
    sidesLeft: "Sides left",
    hp: "HP",
    foe: "Foe",
    // Кого сторона игрока уже прошла — по порядку, через точку.
    beat: "Beat",
    nextBtn: "Next",
    won: "Collapse won",
    wonNote: "The last side standing is yours.",
    out: "Collapse — out in wave {n}",
    outNote: "The bracket closed on you.",
    // Место: у победителя одно число, у выбывшего — вилка (9–16 и так далее).
    place: "Place {p} of {of}",
    // Бойцов в списке меньше, чем просит раскладка. Те же слова, что в воротах:
    // игрок встречает одно и то же сообщение, откуда бы он ни пришёл.
    needOne: "Need 1 more fighter",
    needMany: "Need {n} more fighters",
    shortNote: "This layout needs a bigger roster. Recruit in the shop, then come back.",
    toGate: "Back to the gate",
  },
  // ОТКРЫТОЕ ПОЛЕ. Двадцать бойцов на одной большой плите, стороны дерутся все
  // против всех, остаётся одна.
  //
  // ⚠️ СЛОВА СВОИ, ХОТЬ ЧАСТЬ И СОВПАДАЕТ С ТУРНИРОМ. «Sides left», «Place …»,
  //    нехватка бойцов — игрок должен встречать ОДНО И ТО ЖЕ слово, откуда бы он
  //    ни пришёл, поэтому значения совпадают дословно. А вот ключи разные: свяжи
  //    два режима одной строкой, и правка слова в турнире молча поехала бы сюда.
  //    Это уже проходили — см. разбор повторов ключей от 05.2026.
  openField: {
    // Счётчик поверх боя. Слово, шрифт и цвет — те же, что в межволновой панели
    // турнира: игрок уже знает, что оно означает.
    sidesLeft: "Sides left",
    // Лидер — магнит поля. Строка встаёт ПОД счётчиком сторон, тем же списком и
    // тем же шрифтом: это второе показание того же боя, а не отдельная надпись.
    leader: "Leader",
    // Корона на своей стороне. Не позывной, а прямое обращение: игрок и так знает,
    // как зовут его бойцов, а знать ему надо, что охотятся теперь на него.
    youAreLeader: "You are the leader",
    // Уголок на кромке экрана — он без подписи, поэтому строка нужна читалке.
    leaderOffscreen: "Leader is off screen",
    // СУЖЕНИЕ ПОЛЯ. Обратный отсчёт встаёт ТРЕТЬЕЙ строкой того же списка, под
    // лидером, и только на последние десять секунд перед началом. Подпись здесь,
    // число рядом — ровно как у счётчика сторон: это третье показание того же боя,
    // а не отдельная надпись, и своего вида ему не заводится.
    closingIn: "Field closing in",
    // Кнопка возврата слежения — она без подписи, значком, поэтому строка нужна
    // только читалке экрана. Глагол, а не существительное: кнопка действия.
    recenter: "Show my side",
    // ТА ЖЕ КНОПКА В ДОСМОТРЕ. Своих на поле нет, вести некуда — и она ведёт к
    // лидеру, то есть туда, где поле решается. Значок и место те же: это одна
    // кнопка с двумя назначениями, а не две разные.
    followLeader: "Follow the leader",
    // ПОЛОСА ДОСМОТРА. Своя сторона пала, место замерло, поле дерётся дальше.
    // Дверь одна и короткая: игрок уже увидел своё место, звать его словами
    // «вернуться в ворота» здесь незачем — панель итога это и скажет.
    leave: "Leave",
    // Кто выиграл поле. Строка встаёт ПОД местом на панели итога и появляется
    // только когда поле ДОИГРАЛО: ушёл раньше — победителя ещё нет, и врать про
    // него нельзя.
    winner: "Winner · {name}",
    // Место игрока. У открытого поля оно ОДНО ЧИСЛО, а не вилка, как у турнира:
    // здесь все стороны на поле разом, и порядок выбывания известен точно.
    place: "Place {n} of {of}",
    // Бойцов в списке меньше, чем просит раскладка. Те же слова, что в воротах и
    // в турнире: одно сообщение, откуда бы игрок ни пришёл.
    needOne: "Need 1 more fighter",
    needMany: "Need {n} more fighters",
    shortNote: "This layout needs a bigger roster. Recruit in the shop, then come back.",
    toGate: "Back to the gate",
  },
  errors: {
    pageNotFound: "Page not found",
    error404Code: "ERROR 404",
    // 404 screen (brand voice — en-only, matches design handoff)
    notFoundSr: "Error 404 — page not found",
    notFoundCreedLead: "Wrong",
    notFoundCreedAccent: "Turn.",
    notFoundSub: "This route isn't on the fight card. No arena down this road.",
    notFoundBack: "Back to home",
    notFoundPlay: "Play",
    notFoundNoteLabel: "Field Note",
    notFoundNote: "Even champions take a wrong turn. Get back in.",
  },
};
