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
    // Only the web3 wallet strings remain — consumed by the (orphaned but
    // preserved) ConnectWallet / BuyTokens components. Account-screen strings
    // were removed with the account UI.
    wallet: {
      lblTopUpBalance: "Top Up Balance",
      lblBuyFCTokens: "Buy HXL tokens",
      lblSelectToken: "Select token",
      lblAmount: "Amount",
      lblYouWillGet: "You will get",
      lblFCTokens: "HXL tokens",
      lblConnectWallet: "Connect Wallet",
      lblReconnectWallet: "Reconnect",
      msgConnectWalletTooltip: "Connect your wallet to buy or withdraw Hexlash tokens",
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
    shopSub: "DECOR · MORE",     // (legacy) chip is single-label now; sub unused
    fight: "FIGHT",              // the hero action (the one pink + glow)
    fightSub: "SEND YOUR FIGHTER TO THE ARENA",
    editSpace: "EDIT SPACE",     // corner button → decor arrange mode
    editSpaceSub: "ARRANGE PROPS",
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
