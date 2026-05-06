// src/data/shopMock.js
//
// Port verbatim из docs/visual-migration/hexlash_v24.html lines 12534-12572.
// Mock catalog 18 items × 5 categories × 4 rarities. Real backend purchase API
// deferred per Q3 (5E) — wired в отдельном backend sub-epic после 5E.

export const SHOP_ITEMS = [
  // Skins
  { id: 'skn_obsidian',  cat: 'skin',  rarity: 'common',    name: 'Obsidian',  ico: 'OBS', colorHex: '#3a3a42', desc: 'A flat matte black hoodie. Low-key. Pro-looking.', effect: 'Cosmetic — no stat effect', price: { taps: 120 } },
  { id: 'skn_cinder',    cat: 'skin',  rarity: 'common',    name: 'Cinder',    ico: 'CDR', colorHex: '#FFA133', desc: 'Burnt orange with scorch marks.', effect: 'Cosmetic — no stat effect', price: { taps: 180 } },
  { id: 'skn_kestrel',   cat: 'skin',  rarity: 'rare',      name: 'Kestrel',   ico: 'KSL', colorHex: '#4dd9ff', desc: 'Pale cyan rip-stop with metallic accents.', effect: 'Cosmetic — no stat effect', price: { taps: 650 } },
  { id: 'skn_specter',   cat: 'skin',  rarity: 'epic',      name: 'Specter',   ico: 'SPT', colorHex: '#A855F7', desc: 'Iridescent purple that shifts in low light.', effect: 'Cosmetic — no stat effect', price: { taps: 2200, xp: 40 } },
  { id: 'skn_riot',      cat: 'skin',  rarity: 'legendary', name: 'Riot',      ico: 'RIT', colorHex: '#ff066f', desc: 'Hot-pink with torn accents. Loud. Limited run.', effect: 'Cosmetic — no stat effect', price: { eth: 0.045 } },

  // Gloves
  { id: 'glv_bandage',   cat: 'glove', rarity: 'common',    name: 'Bandage Wraps', ico: 'BND', colorHex: '#d4d4d0', desc: 'Cotton wrappings. Cleanest start.', effect: 'Cosmetic — no stat effect', price: { taps: 80 } },
  { id: 'glv_bruiser',   cat: 'glove', rarity: 'rare',      name: 'Bruiser 14oz', ico: 'BRS', colorHex: '#ff066f', desc: '14oz sparring gloves. Heavy weight class.', effect: 'Cosmetic — no stat effect', price: { taps: 850 } },
  { id: 'glv_steelgrip', cat: 'glove', rarity: 'epic',      name: 'Steel Grip', ico: 'STG', colorHex: '#D4A843', desc: 'Reinforced knuckles. Gold-stitched.', effect: 'Cosmetic — no stat effect', price: { taps: 2800, xp: 60 } },

  // Boosts
  { id: 'bst_taps_2x_24h', cat: 'boost', rarity: 'rare',      name: '2× Taps — 24h', ico: '2X',  colorHex: '#FFD262', desc: 'Double Taps earned from Heavy Bag for 24 hours.', effect: '+100% Taps from training (24h)', price: { taps: 400 } },
  { id: 'bst_xp_2x_24h',   cat: 'boost', rarity: 'rare',      name: '2× XP — 24h',   ico: '2X',  colorHex: '#6EE7FF', desc: 'Double XP from fights for 24 hours.', effect: '+100% XP from fights (24h)', price: { taps: 600 } },
  { id: 'bst_streak_save', cat: 'boost', rarity: 'epic',      name: 'Streak Save',   ico: 'SSV', colorHex: '#A855F7', desc: 'Protects your win streak from one loss.', effect: 'Auto-consume on a loss', price: { taps: 1800, xp: 30 } },
  { id: 'bst_elo_shield',  cat: 'boost', rarity: 'legendary', name: 'ELO Shield',    ico: 'ELS', colorHex: '#FFD262', desc: 'Halve ELO loss on your next 3 defeats.', effect: '-50% ELO loss × 3 defeats', price: { eth: 0.020 } },

  // Titles
  { id: 'ttl_newborn',  cat: 'title',  rarity: 'common', name: 'Newborn',   ico: 'NWB', colorHex: '#8a8a90', desc: 'Visible under your handle in the Leaderboard.', effect: 'Displayed in leaderboard', price: { taps: 100 } },
  { id: 'ttl_ghost',    cat: 'title',  rarity: 'rare',   name: 'The Ghost', ico: 'GST', colorHex: '#A855F7', desc: 'Earned by slipping 50 punches in one fight.', effect: 'Displayed in leaderboard', price: { taps: 900, xp: 50 } },
  { id: 'ttl_ironfist', cat: 'title',  rarity: 'epic',   name: 'Iron Fist', ico: 'IRF', colorHex: '#FFD262', desc: 'Earned by winning 3 fights by KO.', effect: 'Displayed in leaderboard', price: { taps: 2500, xp: 80 } },

  // Banners
  { id: 'bnr_ember',    cat: 'banner', rarity: 'common',    name: 'Ember Banner',    ico: 'EMB', colorHex: '#FFA133', desc: 'Orange banner for your clan hall.', effect: 'Clan-wide cosmetic', price: { taps: 200 } },
  { id: 'bnr_sentinel', cat: 'banner', rarity: 'rare',      name: 'Sentinel Banner', ico: 'SEN', colorHex: '#2ee07f', desc: 'Green sentinel shield motif.', effect: 'Clan-wide cosmetic', price: { taps: 1100 } },
  { id: 'bnr_legacy',   cat: 'banner', rarity: 'legendary', name: 'Legacy',          ico: 'LGC', colorHex: '#FFD262', desc: 'Woven gold. Owned by less than 100 players.', effect: 'Clan-wide cosmetic', price: { eth: 0.065 } },
];

export const SHOP_OWNED_INIT = ['glv_bandage', 'ttl_newborn'];

export const INITIAL_BALANCE = { taps: 12480, xp: 340, eth: 0.128 };
