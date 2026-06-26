// shop_art.jsx — SVG art for the Hexlash shop.
// The brand mark + matte low-poly $HEX coin piles in the arena material family.
// No prop emits light — variety lives in mass and silhouette, never neon.
// Exports: Mark, HexPile, CoinGlyph.

// arena matte material (mirrors MAT in home_stage.jsx)
const SMAT = {
  top:  '#525d6f',
  lit:  '#3a4453',
  side: '#272e39',
  dark: '#171c25',
  rim:  'rgba(190,205,226,0.42)',
  edge: 'rgba(228,236,248,0.5)',
};

// nested-hexagon Y-strike brand mark
function Mark({ className, glow, style }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true"
      style={{ ...(glow ? { filter: 'drop-shadow(0 0 8px rgba(255,0,105,.5))' } : null), ...(style || null) }}>
      <polygon points="24,3 41.5,13 41.5,35 24,45 6.5,35 6.5,13" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <polygon points="24,13 33,18.5 33,29.5 24,35 15,29.5 15,18.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M24 13 L24 24 M24 24 L33 18.5 M24 24 L15 29.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// one faceted hexagonal chip (pointy-left/right, squashed for 3/4 view)
function hexCoin(cx, cy, rx, t) {
  const ry = rx * 0.5, a = rx * 0.5;
  const f = (x, y) => `${Math.round((x) * 10) / 10},${Math.round((y) * 10) / 10}`;
  const top = [f(cx - rx, cy), f(cx - a, cy - ry), f(cx + a, cy - ry), f(cx + rx, cy), f(cx + a, cy + ry), f(cx - a, cy + ry)].join(' ');
  const side = [
    f(cx - rx, cy), f(cx - a, cy + ry), f(cx + a, cy + ry), f(cx + rx, cy),
    f(cx + rx, cy + t), f(cx + a, cy + ry + t), f(cx - a, cy + ry + t), f(cx - rx, cy + t),
  ].join(' ');
  // a small inner facet hex on the top cap for a struck-coin read
  const ir = rx * 0.46, ia = ir * 0.5, iry = ir * 0.5;
  const inner = [f(cx - ir, cy), f(cx - ia, cy - iry), f(cx + ia, cy - iry), f(cx + ir, cy), f(cx + ia, cy + iry), f(cx - ia, cy + iry)].join(' ');
  return `
    <polygon points="${side}" fill="${SMAT.side}"/>
    <polygon points="${top}" fill="${SMAT.top}"/>
    <polygon points="${inner}" fill="${SMAT.lit}" opacity="0.85"/>
    <polyline points="${f(cx - rx, cy)} ${f(cx - a, cy - ry)} ${f(cx + a, cy - ry)} ${f(cx + rx, cy)}" fill="none" stroke="${SMAT.edge}" stroke-width="1" opacity="0.55"/>`;
}

// stack layouts per tier (1..5). each stack: {x, y, h}. y = base coin centre.
const PILES = {
  1: [{ x: 130, y: 150, h: 3 }],
  2: [{ x: 112, y: 152, h: 4 }, { x: 160, y: 156, h: 2 }],
  3: [{ x: 100, y: 154, h: 5 }, { x: 150, y: 150, h: 3 }, { x: 180, y: 160, h: 2 }],
  4: [{ x: 92, y: 156, h: 6 }, { x: 140, y: 150, h: 4 }, { x: 182, y: 158, h: 3 }, { x: 120, y: 168, h: 2 }],
  5: [{ x: 80, y: 158, h: 7 }, { x: 126, y: 149, h: 5 }, { x: 172, y: 160, h: 4 }, { x: 106, y: 169, h: 3 }, { x: 152, y: 171, h: 3 }, { x: 196, y: 166, h: 2 }],
};

function pileSVG(tier) {
  const rx = 30, t = 9;
  const stacks = (PILES[tier] || PILES[1]).slice().sort((a, b) => a.y - b.y);
  let out = '';
  for (const s of stacks) {
    for (let i = 0; i < s.h; i++) {
      out += hexCoin(s.x, s.y - i * t, rx, t);
    }
  }
  return out;
}

// the pile preview component (matte chips on a faint hex dais + contact shadow)
function HexPile({ tier = 1 }) {
  return (
    <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMax meet" className="hx-prev">
      <defs>
        <radialGradient id={`hxdrop-${tier}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="64,182 130,150 196,182 130,214" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
      <ellipse cx="130" cy="184" rx={48 + tier * 8} ry={13 + tier} fill={`url(#hxdrop-${tier})`} />
      <g dangerouslySetInnerHTML={{ __html: pileSVG(tier) }} />
    </svg>
  );
}

// small inline diamond used in prices / balances
function CoinGlyph({ className }) {
  return <span className={className || 'hx-dia'} aria-hidden="true"></span>;
}

Object.assign(window, { Mark, HexPile, CoinGlyph });
