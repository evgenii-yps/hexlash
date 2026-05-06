// Epic 5 — Sub-Epic 5D Step 7.
// Mock browsable-clans data for the no-clan state. Verbatim port of
// prototype hexlash_v24.html lines 11001-11008. Real backend wiring
// deferred to a future PvP-integration sub-epic (carry-over from 5C
// ratingsMock.js precedent).
//
// MY_CLAN_MEMBERS reserved for Step 8 in-clan roster — port of
// prototype lines 11010-11024.

export const BROWSABLE_CLANS = [
  { tag: 'NGH', name: 'NIGHTHAWKS',     tagline: 'Late-night EU grinders.',                members: 18, cap: 20, xp: 9240,  rank: 14,  privacy: 'Open',        crestColor: '#A855F7' },
  { tag: 'EMB', name: 'EMBER HANDS',    tagline: 'Predator-heavy, fast trades.',           members: 11, cap: 20, xp: 6100,  rank: 88,  privacy: 'Open',        crestColor: '#FF066F' },
  { tag: 'SEN', name: 'SENTINELS',      tagline: 'Defense-first. Out-last, out-think.',    members: 20, cap: 20, xp: 12400, rank: 7,   privacy: 'Invite only', crestColor: '#2ee07f' },
  { tag: 'ANA', name: 'GRID ANALYSTS',  tagline: 'Counter-play meta. Data-driven.',        members: 14, cap: 20, xp: 7800,  rank: 22,  privacy: 'Open',        crestColor: '#4dd9ff' },
  { tag: 'MAV', name: 'MAVERICK LINE',  tagline: 'High risk. Nothing below ×3.',           members: 9,  cap: 20, xp: 4550,  rank: 140, privacy: 'Open',        crestColor: '#FFA133' },
  { tag: 'JUG', name: 'JUGGERCO',       tagline: 'Power overwhelming. Slow wrath.',        members: 16, cap: 20, xp: 8900,  rank: 18,  privacy: 'Invite only', crestColor: '#D4A843' },
];

export const MY_CLAN_MEMBERS = [
  { handle: 'LordNoctis',     role: 'Leader',  elo: 2041, wins: 186, losses: 74, wr: 72, lastSeen: 'online' },
  { handle: 'yurii.varvarov', role: 'Officer', elo: 1247, wins: 10,  losses: 4,  wr: 71, lastSeen: 'online', self: true },
  { handle: 'Crowhaven',      role: 'Officer', elo: 1962, wins: 124, losses: 58, wr: 68, lastSeen: '12m ago' },
  { handle: 'Kestrel.7',      role: 'Member',  elo: 1994, wins: 142, losses: 49, wr: 74, lastSeen: '1h ago' },
  { handle: 'SablePrey',      role: 'Member',  elo: 1918, wins: 108, losses: 62, wr: 64, lastSeen: '2h ago' },
  { handle: 'RuinPact',       role: 'Member',  elo: 1877, wins: 96,  losses: 55, wr: 64, lastSeen: '3h ago' },
  { handle: 'Vex.01',         role: 'Member',  elo: 1801, wins: 84,  losses: 48, wr: 64, lastSeen: '5h ago' },
  { handle: 'HaloRune',       role: 'Member',  elo: 1743, wins: 72,  losses: 41, wr: 64, lastSeen: '8h ago' },
  { handle: 'SlateWolf',      role: 'Member',  elo: 1689, wins: 61,  losses: 39, wr: 61, lastSeen: '1d ago' },
  { handle: 'Frost.X',        role: 'Member',  elo: 1621, wins: 58,  losses: 42, wr: 58, lastSeen: '1d ago' },
  { handle: 'EchoVein',       role: 'Member',  elo: 1540, wins: 44,  losses: 38, wr: 54, lastSeen: '2d ago' },
  { handle: 'NobleRust',      role: 'Member',  elo: 1488, wins: 40,  losses: 36, wr: 53, lastSeen: '3d ago' },
  { handle: 'WraithMk2',      role: 'Member',  elo: 1422, wins: 34,  losses: 34, wr: 50, lastSeen: '4d ago' },
  { handle: 'EmberGrit',      role: 'Member',  elo: 1376, wins: 28,  losses: 30, wr: 48, lastSeen: '1w ago' },
];
