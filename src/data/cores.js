// The 4 cores ("Ядра") — a fighter's innate character (1 of 4, immutable, the
// fighter is born with it). Decided 06.06.2026 (Notion → Game Design): per-core
// hue, NOT canon pink. Each core differs ONLY by colour at this stage (icons are
// the simplified faceted-hex + circle + hot centre, no inner manner-drawing).
//
// This is the seed of the future data-каркас: the pre-fight flow passes the whole
// core ID into the arena (not just the colour), so behaviour (core → fight style)
// can hook onto the same ID later without rewiring. `support` tones are a
// placeholder slot for the Claude Design data.js handoff (upgrade-screen palette).
export const CORES = [
  { id: 'natisk', name: 'Натиск', axis: 'Давление', color: '#FF3344' },
  { id: 'naletchik', name: 'Налётчик', axis: 'Темп', color: '#FFA526' },
  { id: 'skala', name: 'Скала', axis: 'Живучесть', color: '#2ED6B0' },
  { id: 'zasada', name: 'Засада', axis: 'Контратака', color: '#9461FF' },
];

// Canon pink (Neon Discipline). The arena rift + the opponent fighter keep this;
// only the player's core glows the selected hue (one glow source per screen).
export const CANON_PINK = '#FF0069';

export const getCore = (id) => CORES.find((c) => c.id === id) || null;
