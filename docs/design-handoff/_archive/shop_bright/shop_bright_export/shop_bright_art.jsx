// shop_bright_art.jsx — BRIGHT shop art. The arena's matte low-poly props are
// kept intact, but the shop body is now allowed to carry light: every decor
// piece sits in the colored bloom of the core it's tuned to. Matte structure,
// emissive accent. One core per element — never two, never pink+core mixed.
// Exports: CORES, CoreGlyph, GlowProp, BrightHexPile.

// ── the four cores (2 tones each) — canon from the palette board ──
const CORES = {
  onslaught: { name: 'ONSLAUGHT', main: '#FF3344', sup: '#FF7A30', rgb: '255,51,68',  glyph: 'onslaught' },
  raider:    { name: 'RAIDER',    main: '#FFA526', sup: '#FFD930', rgb: '255,165,38', glyph: 'raider' },
  bulwark:   { name: 'BULWARK',   main: '#2ED6B0', sup: '#5DD6E6', rgb: '46,214,176', glyph: 'bulwark' },
  ambush:    { name: 'AMBUSH',    main: '#9461FF', sup: '#D461FF', rgb: '148,97,255', glyph: 'ambush' },
};

// ── core glyphs — silhouettes read from the four-cores board ──
// onslaught: rising chevrons (pressure up). raider: twin slashes (hit + peel).
// bulwark: nested hex (hold). ambush: diamond (long wait, one strike).
function CoreGlyph({ core, size = 16, className }) {
  const c = CORES[core];
  if (!c) return null;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className };
  if (c.glyph === 'onslaught') return (
    <svg {...common}><path d="M5 14l7-8 7 8M5 19l7-8 7 8" /></svg>);
  if (c.glyph === 'raider') return (
    <svg {...common}><path d="M7 19L15 5M12 19L20 5" /></svg>);
  if (c.glyph === 'bulwark') return (
    <svg {...common}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z" /></svg>);
  return ( // ambush
    <svg {...common}><path d="M12 3l8 9-8 9-8-9z" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>);
}

// ── glowing prop preview ──────────────────────────────────────────────
// The matte prop (drawObject from home_stage) standing in a core-colored bloom.
// `lvl` scales the bloom: 'rest' (dim, ambient), 'hero' (full, animated by CSS).
// Neutral pieces (no core) get a faint cool wash only — colour is the signal,
// so a no-core piece must read as quieter, never coloured.
function GlowProp({ kind, core, scale = 1, lvl = 'rest' }) {
  const c = CORES[core];
  const id = `${kind}-${core || 'n'}`;
  const main = c ? c.main : '#9fb0c8';
  const sup = c ? c.sup : '#c8d4e6';
  const bloomO = c ? (lvl === 'hero' ? 0.55 : 0.26) : 0.10;
  const ringO = c ? (lvl === 'hero' ? 0.9 : 0.5) : 0.22;
  return (
    <svg viewBox="0 0 260 210" preserveAspectRatio="xMidYMax meet" className={`gp-prev${lvl === 'hero' ? ' is-hero' : ''}`}>
      <defs>
        <radialGradient id={`gp-bloom-${id}`} cx="0.5" cy="0.46" r="0.5">
          <stop offset="0" stopColor={sup} stopOpacity={bloomO} />
          <stop offset="0.45" stopColor={main} stopOpacity={bloomO * 0.7} />
          <stop offset="1" stopColor={main} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`gp-ring-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={main} stopOpacity="0" />
          <stop offset="0.7" stopColor={main} stopOpacity={ringO} />
          <stop offset="1" stopColor={main} stopOpacity="0" />
        </radialGradient>
        <filter id={`gp-soft-${id}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* core bloom — the colored light the prop stands in */}
      <ellipse className="gp-bloom" cx="130" cy="118" rx="120" ry="96" fill={`url(#gp-bloom-${id})`} />

      {/* faint floor hex + colored contact ring */}
      <polygon points="60,182 130,148 200,182 130,216" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
      <ellipse className="gp-ring" cx="130" cy="184" rx={64 * scale} ry={15 * scale} fill={`url(#gp-ring-${id})`} filter={`url(#gp-soft-${id})`} />

      {/* the matte prop, untouched arena material */}
      <g transform={`translate(130,184) scale(${scale})`} dangerouslySetInnerHTML={{ __html: drawObject(kind) }} />

      {/* a single emissive mote at the piece's heart — the one lit point */}
      {c && <circle className="gp-mote" cx="130" cy={kind === 'banner' || kind === 'arch' ? 70 : 150} r="3.4" fill={sup} />}
    </svg>
  );
}

// ── currency pile — brand-pink economy, kept matte (trainer material) ─────
// Currency is the $HEX layer, not a core. Reuse the matte HexPile silhouette;
// the value/heat lives in the card frame (pink), never recolouring the chips.
function BrightHexPile({ tier = 1, best = false }) {
  return (
    <div className={`bhp${best ? ' best' : ''}`}>
      <HexPile tier={tier} />
    </div>
  );
}

Object.assign(window, { CORES, CoreGlyph, GlowProp, BrightHexPile });
