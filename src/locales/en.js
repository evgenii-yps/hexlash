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
  // Upgrade screen (/play/upgrade). Only the guest notice is keyed so far —
  // the rest of that screen is a 1:1 design port that still carries its copy
  // inline; keying it is a separate pass, not this one.
  upgrade: {
    // Honesty line under the build bar: a guest's work is tab-lived, by design.
    // Hidden for a signed-in player (nothing temporary about their progress).
    guestNote: "Playing as a guest — your build is kept while this tab stays open. Create an account to keep it for good.",
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
    // DEV console — owner tool, temporary. Goes out with the tab.
    tabDev: "Dev",
    ledeDev: "Owner controls. Nothing on this tab is part of the game.",
    dev: {
      warn: "Temporary tool — it will be removed once the game says where fighters come from.",
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
