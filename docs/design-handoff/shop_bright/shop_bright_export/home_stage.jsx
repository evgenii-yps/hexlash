// home_stage.jsx — Hexlash "home" stage. The arena floor's calm relative:
// same faceted low-poly slab, dark blue-grey skin, floating in the void —
// but NO battle rift. The only living glow on screen is the fighter's core.
// Renders ONE svg (1440×900) so floor + fighter + decor share one perspective.
// Exports: HomeStage, OBJECTS (catalog meta), drawObject, fighterSVG, mapUV.

const fmtN = n => (Math.round(n * 10) / 10);

// ── matte material family (shared by floor, fighter shell, every prop) ──
// Lit from upper-left. Top cap brightest, front-left lit, right side in shadow.
const MAT = {
  top:  '#525d6f',
  lit:  '#3a4453',
  side: '#252c37',
  dark: '#171c25',
  rim:  'rgba(190,205,226,0.42)',
  edge: 'rgba(228,236,248,0.5)',
};
const CORE = '#ff0069';

// ── floor (perspective trapezoid, ~55° elevation, like the arena slab) ──
const FAR_Y = 300, NEAR_Y = 706;
const FAR_L = 470, FAR_R = 970;
const NEAR_L = 196, NEAR_R = 1244;
const FASC = 66;

// normalized floor coords → screen. u: 0(left)→1(right). v: 0(far)→1(near).
// returns {x,y,s} where s is the depth scale for props standing at that cell.
function mapUV(u, v) {
  const y = FAR_Y + (NEAR_Y - FAR_Y) * v;
  const lX = FAR_L + (NEAR_L - FAR_L) * v;
  const rX = FAR_R + (NEAR_R - FAR_R) * v;
  const x = lX + (rX - lX) * u;
  return { x, y, s: 0.52 + 0.48 * v };
}

// ── faceted cuboid in 3/4 view, base-centre origin, y-up = negative ──
// depth pushes back toward upper-right. Returns an svg fragment string.
function box(hw, dep, h, opts = {}) {
  const m = opts.mat || MAT;
  const dx = dep * 0.84, dy = dep * 0.5;
  const P = {
    FBL: [-hw, 0], FBR: [hw, 0],
    FTL: [-hw, -h], FTR: [hw, -h],
    BTL: [-hw + dx, -h - dy], BTR: [hw + dx, -h - dy],
    BBR: [hw + dx, -dy],
  };
  const pp = a => a.map(p => `${fmtN(p[0])},${fmtN(p[1])}`).join(' ');
  const top = opts.topMat || m.top;
  return `
    <polygon points="${pp([P.FBR, P.BBR, P.BTR, P.FTR])}" fill="${m.side}"/>
    <polygon points="${pp([P.FBL, P.FBR, P.FTR, P.FTL])}" fill="${m.lit}"/>
    <polygon points="${pp([P.FTL, P.FTR, P.BTR, P.BTL])}" fill="${top}"/>
    <polyline points="${pp([P.FTL, P.FTR, P.BTR])}" fill="none" stroke="${m.edge}" stroke-width="1.1" opacity="0.7"/>
    <polyline points="${pp([P.FTR, P.BTR, P.BBR])}" fill="none" stroke="${m.rim}" stroke-width="1" opacity="0.6"/>`;
}

// ───────────────────────────── prop builders ─────────────────────────────
// Each returns an svg fragment authored around base-centre (0,0). Matte only —
// no prop emits light; variety lives in silhouette, never in neon.

function pPlinth() {            // low hex pedestal
  return box(46, 30, 30) + `
    <polygon points="-40,-30 40,-30 33,-37 -33,-37" fill="${MAT.top}" opacity="0.0"/>`;
}

function pCrates() {            // stacked supply blocks
  return `
    <g transform="translate(-30,0)">${box(30, 22, 40)}</g>
    <g transform="translate(34,0)">${box(26, 20, 30)}</g>
    <g transform="translate(2,-40) scale(0.92)">${box(28, 20, 30)}</g>`;
}

function pBanner() {           // tall sentry standard + cloth panel
  return box(13, 12, 150) + `
    <polygon points="13,-150 64,-141 64,-86 13,-99" fill="${MAT.lit}"/>
    <polygon points="13,-150 13,-99 6,-103 6,-146" fill="${MAT.side}"/>
    <polyline points="13,-150 64,-141 64,-86" fill="none" stroke="${MAT.rim}" stroke-width="1" opacity="0.5"/>
    <polygon points="20,-128 57,-122 57,-114 20,-119" fill="${MAT.dark}" opacity="0.55"/>`;
}

function pArch() {             // faceted ward gateway
  return `
    <g transform="translate(-70,0)">${box(16, 14, 150)}</g>
    <g transform="translate(70,0)">${box(16, 14, 150)}</g>
    <g transform="translate(0,-150)">
      <polygon points="-86,4 86,4 86,-26 -86,-26" fill="${MAT.lit}"/>
      <polygon points="-86,-26 86,-26 98,-38 -74,-38" fill="${MAT.top}"/>
      <polygon points="86,4 98,-8 98,-38 86,-26" fill="${MAT.side}"/>
      <polyline points="-86,-26 86,-26 98,-38" fill="none" stroke="${MAT.edge}" stroke-width="1.1" opacity="0.65"/>
    </g>`;
}

function pDais() {             // raised hex platform / floor tile
  return `
    <polygon points="-90,-6 -50,-30 50,-30 90,-6 50,18 -50,18" fill="${MAT.side}"/>
    <polygon points="-90,-22 -50,-46 50,-46 90,-22 50,2 -50,2" fill="${MAT.top}"/>
    <polyline points="-90,-22 -50,-46 50,-46 90,-22" fill="none" stroke="${MAT.edge}" stroke-width="1.2" opacity="0.7"/>
    <polygon points="-58,-23 -32,-38 32,-38 58,-23 32,-8 -32,-8" fill="${MAT.lit}" opacity="0.85"/>`;
}

function pCorePlinth() {       // pedestal cradling a DORMANT (matte) core
  return box(40, 26, 46) + `
    <g transform="translate(0,-78)">
      <polygon points="0,-26 22,0 0,26 -22,0" fill="${MAT.lit}"/>
      <polygon points="0,-26 22,0 0,26" fill="${MAT.side}"/>
      <polygon points="0,-26 -22,0 0,0 22,0" fill="${MAT.top}" opacity="0.9"/>
      <polyline points="-22,0 0,-26 22,0" fill="none" stroke="${MAT.rim}" stroke-width="1" opacity="0.55"/>
      <circle cx="0" cy="0" r="3.4" fill="#3a4250"/>
    </g>`;
}

const OBJECTS = {
  banner:     { build: pBanner,     name: 'SENTRY BANNER', tag: 'Standard · marks your ground', price: 320, h: 150 },
  plinth:     { build: pPlinth,     name: 'STEP PLINTH',    tag: 'Low riser · pairs with anything', price: 180, h: 30 },
  crates:     { build: pCrates,     name: 'SUPPLY CACHE',   tag: 'Stacked blocks · honest clutter', price: 240, h: 70 },
  arch:       { build: pArch,       name: 'WARD ARCH',      tag: 'Gateway · frames the entrance', price: 760, h: 175 },
  dais:       { build: pDais,       name: 'HEX DAIS',       tag: 'Raised tile · a stage of your own', price: 420, h: 46 },
  corePlinth: { build: pCorePlinth, name: 'CORE PLINTH',    tag: 'Cradles a dormant core', price: 540, h: 124 },
};

function drawObject(kind) {
  const o = OBJECTS[kind];
  return o ? o.build() : '';
}

// ───────────────────────────── the fighter ─────────────────────────────
// Low-poly humanoid construct. Dark blue-grey shell from the same material
// family; ONE pink core in the chest is the only light source on the stage.
// Authored around base-centre (0,0), ~150 tall.
function fighterSVG() {
  const L = '#46505f', S = '#272e39', T = '#5a6678', B = '#141922', rim = 'rgba(198,212,232,0.55)';
  return `
    <!-- legs -->
    <polygon points="-26,-2 -6,-2 -8,-78 -28,-80" fill="${L}"/>
    <polygon points="-6,-2 4,-6 2,-78 -8,-78" fill="${S}"/>
    <polygon points="6,-4 26,-2 30,-74 12,-78" fill="${L}"/>
    <polygon points="26,-2 34,-8 38,-70 30,-74" fill="${S}"/>
    <polygon points="-28,-80 -8,-78 -6,-90 -26,-92" fill="${B}"/>
    <polygon points="12,-78 30,-74 32,-86 14,-88" fill="${B}"/>
    <!-- left arm (shadow) -->
    <polygon points="-30,-92 -42,-96 -48,-150 -36,-152" fill="${S}"/>
    <polygon points="-30,-92 -36,-152 -30,-150 -26,-94" fill="${L}" opacity="0.8"/>
    <!-- torso -->
    <polygon points="-30,-86 18,-96 30,-176 -22,-182" fill="${L}"/>
    <polygon points="18,-96 40,-104 48,-172 30,-176" fill="${S}"/>
    <polygon points="-22,-182 30,-176 50,-170 -2,-190" fill="${T}"/>
    <polyline points="18,-96 40,-104 48,-172" fill="none" stroke="${rim}" stroke-width="1.4" opacity="0.7"/>
    <!-- right arm (weapon-side) -->
    <polygon points="40,-104 52,-110 58,-168 46,-170" fill="${S}"/>
    <polygon points="40,-104 46,-170 42,-168 36,-106" fill="${L}" opacity="0.85"/>
    <!-- head -->
    <polygon points="-14,-188 14,-196 18,-228 -10,-226" fill="${L}"/>
    <polygon points="14,-196 30,-204 32,-226 18,-228" fill="${S}"/>
    <polygon points="-14,-188 6,-198 30,-204 14,-196" fill="${T}"/>
    <polyline points="14,-196 30,-204 32,-226" fill="none" stroke="${rim}" stroke-width="1.1" opacity="0.6"/>
    <!-- ▸ THE CORE — only glow on the stage ◂ -->
    <g class="hs-core">
      <ellipse cx="2" cy="-150" rx="34" ry="40" fill="${CORE}" opacity="0.32" filter="url(#coreBloom)"/>
      <polygon points="2,-168 16,-150 2,-132 -12,-150" fill="${CORE}" filter="url(#coreSoft)"/>
      <polygon points="2,-162 10,-150 2,-138 -6,-150" fill="#ffd7e6"/>
    </g>`;
}

// ───────────────────────────── the scene ─────────────────────────────
// props: array of {kind, u, v} placed on the floor (painter-sorted by v).
// mode: 'home' | 'arrange'.  ghost: {kind,u,v} a prop mid-placement.
// hexCells: array of {u,v} snap cells to light up (arrange mode).
function HomeStage({ props = [], mode = 'home', ghost = null, hexCells = [], fighterU = 0.5, fighterV = 0.52 }) {
  const W = 1440, H = 900;

  // floor polygons
  const topFace = `M${FAR_L} ${FAR_Y} L${FAR_R} ${FAR_Y} L${NEAR_R} ${NEAR_Y} L${NEAR_L} ${NEAR_Y} Z`;
  const fascia = `M${NEAR_L} ${NEAR_Y} L${NEAR_R} ${NEAR_Y} L${NEAR_R - 14} ${NEAR_Y + FASC} L${NEAR_L + 14} ${NEAR_Y + FASC} Z`;
  const lEdge = `M${NEAR_L} ${NEAR_Y} L${FAR_L} ${FAR_Y} L${FAR_L} ${FAR_Y + 8} L${NEAR_L + 14} ${NEAR_Y + FASC} Z`;

  // a single placed prop (contact shadow + body), depth-scaled
  const Prop = ({ kind, u, v, ghost: isGhost }) => {
    const { x, y, s } = mapUV(u, v);
    const body = drawObject(kind);
    const shW = 92 * s, shH = 22 * s;
    return (
      <g opacity={isGhost ? 0.5 : 1}>
        <ellipse cx={x} cy={y + 4} rx={shW} ry={shH} fill="#000" opacity={isGhost ? 0.25 : 0.42} filter="url(#softBlur)" />
        <g transform={`translate(${fmtN(x)},${fmtN(y)}) scale(${fmtN(s)})`}
           dangerouslySetInnerHTML={{ __html: body }} />
        {isGhost && (
          <g transform={`translate(${fmtN(x)},${fmtN(y)}) scale(${fmtN(s)})`}>
            <polygon points="-92,-6 -52,-30 52,-30 92,-6 52,18 -52,18" fill="none"
              stroke={CORE} strokeWidth="2" opacity="0.9" />
          </g>
        )}
      </g>
    );
  };

  // painter order: far → near (smaller v drawn first)
  const ordered = [...props].sort((a, b) => a.v - b.v);
  const fighter = { x: mapUV(fighterU, fighterV).x, y: mapUV(fighterU, fighterV).y, s: mapUV(fighterU, fighterV).s };

  // interleave fighter into the paint order by depth
  const drawList = [...ordered.map(p => ({ t: 'prop', ...p })), { t: 'fighter', v: fighterV }]
    .sort((a, b) => a.v - b.v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <defs>
        <radialGradient id="voidBg" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#101620" />
          <stop offset="0.5" stopColor="#0a0c12" />
          <stop offset="1" stopColor="#06070b" />
        </radialGradient>
        <linearGradient id="floorTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#11151d" />
          <stop offset="1" stopColor="#1c2230" />
        </linearGradient>
        <linearGradient id="floorHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0c12" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#0a0c12" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0a0c12" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fasciaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3140" />
          <stop offset="1" stopColor="#0a0d13" />
        </linearGradient>
        <linearGradient id="hexFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.95" />
          <stop offset="1" stopColor="#000" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="dropG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.6" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreHalo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff6aa0" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#ff0069" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ff0069" stopOpacity="0" />
        </radialGradient>
        <pattern id="hexPat" width="56" height="48" patternUnits="userSpaceOnUse">
          <path d="M14 0 L42 0 L56 24 L42 48 L14 48 L0 24 Z" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="0.8" />
        </pattern>
        <mask id="hexMask"><rect x="0" y="0" width={W} height={H} fill="url(#hexFade)" /></mask>
        <clipPath id="topClip"><path d={topFace} /></clipPath>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="coreBloom" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="20" /></filter>
        <filter id="coreSoft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>

      {/* void */}
      <rect width={W} height={H} fill="url(#voidBg)" />

      {/* page-level core halo — the one warm wash, kept tight around the fighter */}
      <ellipse cx={fighter.x} cy={fighter.y - 130 * fighter.s} rx={320} ry={300} fill="url(#coreHalo)" opacity="0.5" filter="url(#coreBloom)" />

      {/* floating contact shadow under the slab */}
      <ellipse cx={W / 2} cy={NEAR_Y + FASC + 40} rx={W * 0.42} ry={40} fill="url(#dropG)" />

      {/* slab thickness */}
      <path d={lEdge} fill="#0c0f15" />
      <path d={fascia} fill="url(#fasciaG)" />
      <line x1={NEAR_L} y1={NEAR_Y} x2={NEAR_R} y2={NEAR_Y} stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* top face */}
      <path d={topFace} fill="url(#floorTop)" />
      <g clipPath="url(#topClip)">
        <rect x="0" y="0" width={W} height={H} fill="url(#hexPat)" mask="url(#hexMask)" />
      </g>
      <path d={topFace} fill="url(#floorHaze)" />

      {/* far + side edge hairlines */}
      <line x1={FAR_L} y1={FAR_Y} x2={FAR_R} y2={FAR_Y} stroke="#fff" strokeOpacity="0.14" strokeWidth="1" />
      <line x1={FAR_L} y1={FAR_Y} x2={NEAR_L} y2={NEAR_Y} stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
      <line x1={FAR_R} y1={FAR_Y} x2={NEAR_R} y2={NEAR_Y} stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />

      {/* arrange-mode snap cells */}
      {mode === 'arrange' && hexCells.map((c, i) => {
        const { x, y, s } = mapUV(c.u, c.v);
        const w = 52 * s, h = 30 * s;
        const active = c.active;
        return (
          <polygon key={i}
            points={`${x - w},${y} ${x - w * 0.5},${y - h} ${x + w * 0.5},${y - h} ${x + w},${y} ${x + w * 0.5},${y + h} ${x - w * 0.5},${y + h}`}
            fill={active ? 'rgba(255,0,105,0.12)' : 'rgba(255,255,255,0.015)'}
            stroke={active ? CORE : 'rgba(255,255,255,0.16)'}
            strokeWidth={active ? 1.8 : 1}
            strokeDasharray={active ? 'none' : '3 4'} />
        );
      })}

      {/* depth-sorted props + fighter */}
      {drawList.map((d, i) => d.t === 'fighter' ? (
        <g key={`f${i}`} className="hs-fighter">
          <ellipse cx={fighter.x} cy={fighter.y + 4} rx={70 * fighter.s} ry={18 * fighter.s} fill="#000" opacity="0.45" filter="url(#softBlur)" />
          <g transform={`translate(${fmtN(fighter.x)},${fmtN(fighter.y)}) scale(${fmtN(fighter.s)})`}
            dangerouslySetInnerHTML={{ __html: fighterSVG() }} />
        </g>
      ) : (
        <Prop key={`p${i}`} kind={d.kind} u={d.u} v={d.v} />
      ))}

      {/* ghost prop mid-placement */}
      {ghost && <Prop kind={ghost.kind} u={ghost.u} v={ghost.v} ghost />}

      {/* corner vignette */}
      <rect width={W} height={H} fill="none" />
    </svg>
  );
}

Object.assign(window, { HomeStage, OBJECTS, drawObject, fighterSVG, mapUV });
