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
    shopSub: "DECOR · MORE",     // cluster — shop segment sublabel
    fight: "FIGHT",              // the hero action (the one pink + glow)
    fightSub: "SEND YOUR FIGHTER TO THE ARENA",
    editSpace: "EDIT SPACE",     // corner button → decor arrange mode
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
    back: "← Back to Home",
    title: "Shop",
    unit: "$HEX",
    soon: "Soon",
    owned: "Owned",
    buy: "Buy",
    tabDecor: "Decor",
    tabCurrency: "Currency",
    tabSpecials: "Specials",
    ledeDecor:
      "Furnish your floor. Every piece is cut from the same low-poly stock as the arena — matte, dark, no neon. It's your ground; mark it. Decor is cosmetic only — it never touches a fight.",
    ledeCurrency:
      "$HEX unlocks decor, fighter skins and FX. Top up below. Cosmetics never touch the fight — no stat, no edge.",
    ledeSpecials:
      "Limited drops and starter kits. Time-boxed value — cosmetics only, never power.",
    // decor sub-tabs
    subDecor: "Decor",
    subSkins: "Fighter Skins",
    subFx: "FX",
    subCores: "Cores",
    tagNew: "New",
    decor: {
      banner: { name: "Sentry Banner", sub: "Standard · marks your ground" },
      corePlinth: { name: "Core Plinth", sub: "Cradles a dormant core" },
      dais: { name: "Hex Dais", sub: "Raised tile · a stage of your own" },
      crates: { name: "Supply Cache", sub: "Stacked blocks · honest clutter" },
      arch: { name: "Ward Arch", sub: "Gateway · frames the entrance" },
    },
    // currency
    whatIsTitle: "What is $HEX",
    whatIsBody:
      "$HEX is the cosmetic currency — decor, skins, FX. Cosmetics never touch the fight: no stat, no edge, no pay-to-win.",
    bestValue: "Best Value",
    valueSuffix: "value",
    currency: {
      spark: { name: "Spark" },
      fieldKit: { name: "Field Kit" },
      cache: { name: "Cache" },
      vault: { name: "Vault" },
      arsenal: { name: "Arsenal" },
    },
    // specials
    hotDeal: "Hot Deal",
    freeClaim: "Free Claim",
    bundleLabel: "Bundle",
    claim: "Claim",
    specials: {
      arenaCache: { name: "Arena Cache", contains: "2,000 $HEX + Supply Cache" },
      dailyDrop: { name: "Daily Drop", contains: "+250 $HEX" },
      firstBlood: { name: "First Blood Kit", contains: "2,500 $HEX + Sentry Banner" },
    },
    // buy confirm flow
    confirmTitle: "Confirm Purchase",
    lblPrice: "Price",
    lblBalance: "Balance",
    lblBalanceAfter: "Balance after",
    confirm: "Confirm",
    unlockedTitle: "Unlocked",
    unlockedBody: "Place it from Arrange Mode.",
    done: "Done",
    // wallet stub
    walletTitle: "Wallet",
    walletHead: "Connect Wallet · Top up $HEX",
    walletBody: "Wallet top-up and real-money purchases arrive in Stage 2.",
    connect: "Connect",
    walletStamp: "Stage 2 · live wallet + real money",
    // claim stub
    claimTitle: "Not Yet Live",
    claimBody: "The rewards economy goes live in Stage 2.",
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
