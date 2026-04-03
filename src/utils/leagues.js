export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   min: 0,    max: 899,  color: '#CD7F32', icon: '🥉' },
  { id: 'silver',   name: 'Silver',   min: 900,  max: 1099, color: '#C0C0C0', icon: '🥈' },
  { id: 'gold',     name: 'Gold',     min: 1100, max: 1299, color: '#FFD700', icon: '🥇' },
  { id: 'platinum', name: 'Platinum', min: 1300, max: 1499, color: '#E5E4E2', icon: '🏆' },
  { id: 'diamond',  name: 'Diamond',  min: 1500, max: 1799, color: '#B9F2FF', icon: '💎' },
  { id: 'champion', name: 'Champion', min: 1800, max: 9999, color: '#FF066F', icon: '⭐' },
];

export function getLeague(elo) {
  return [...LEAGUES].reverse().find(l => elo >= l.min) || LEAGUES[0];
}

export function getLeagueColor(elo) {
  return getLeague(elo).color;
}
