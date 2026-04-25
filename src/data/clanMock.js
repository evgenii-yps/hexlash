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
  // populated Step 8 — port prototype 11010-11024.
];
