/* Hexlash auth — brand mark + monochrome icon set.
   Mark: faceted "hex aperture" — 6 interlocked blades around an inner hex ring
   + center hex. Same mark as the landing header / loading screen. Monochrome,
   no glow (its own territory). Geometry locked from the live mark. */

const TAU = Math.PI / 180;
const _pt = (ang, r) => [ +(50 + r * Math.cos(ang * TAU)).toFixed(2), +(50 - r * Math.sin(ang * TAU)).toFixed(2) ];
const _P  = a => a.map(p => p.join(',')).join(' ');
const _hex = r => [90,150,210,270,330,30].map(a => _pt(a, r));

function HexMark({ size = 64, color = '#f6f4f6', style }) {
  // blades: outer edge sits ON the hexagon silhouette; inner edge twisted CCW
  const ro = 45, bi = 31, twist = 12, gap = 3, ri = 22, cHex = 8.5, sw = 5;
  const edges = [60,120,180,240,300,0];
  const blades = edges.map((e, i) => {
    const A = _pt(e + 30 - gap, ro);
    const B = _pt(e - 30 + gap, ro);
    const C = _pt(e - 30 + gap + twist, bi);
    const D = _pt(e + 30 - gap + twist, bi);
    return <polygon key={i} points={_P([A, B, C, D])} fill={color} />;
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true"
         style={{ display: 'block', ...style }}>
      {blades}
      <polygon points={_P(_hex(ri))} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="miter" />
      <polygon points={_P(_hex(cHex))} fill={color} />
    </svg>
  );
}

/* ---- monochrome line / glyph icons. thin, even stroke, currentColor ---- */
const ic = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };

function IconGoogle({ s = 20 }) {
  // monochrome "G" glyph (single color per brandbook — no multicolor)
  return (
    <svg {...ic} width={s} height={s} stroke="none" fill="currentColor">
      <path d="M21.6 12.2c0-.66-.06-1.3-.17-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.74 3-4.3 3-7.2Z" opacity=".95"/>
      <path d="M12 22c2.7 0 4.96-.9 6.6-2.43l-3.2-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.76-5.6-4.13H3.1v2.6A10 10 0 0 0 12 22Z"/>
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/>
      <path d="M12 5.96c1.47 0 2.8.5 3.84 1.5l2.86-2.86A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.96 12 5.96Z"/>
    </svg>
  );
}
function IconX({ s = 18 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="none" fill="currentColor">
      <path d="M18.9 2H22l-7.5 8.6L23.3 22h-6.8l-5.3-7-6.1 7H2l8-9.2L1 2h7l4.8 6.4L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z"/>
    </svg>
  );
}
function IconWallet({ s = 20 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="13" rx="2.5"/>
      <path d="M3 9.5h18"/>
      <circle cx="16.5" cy="13.5" r="1.15" fill="currentColor" stroke="none"/>
      <path d="M16 6V4.6a1.6 1.6 0 0 0-2-1.55L5 5.2"/>
    </svg>
  );
}
function IconFarcaster({ s = 20 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <path d="M5 5h14M4.4 5l.9 14M19.6 5l-.9 14"/>
      <path d="M7.2 9.2h9.6M7.6 9.2v6.6M16.4 9.2v6.6"/>
      <path d="M5.6 19h3.2M15.2 19h3.2"/>
    </svg>
  );
}
function IconDiscord({ s = 20 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="none" fill="currentColor">
      <path d="M19.5 5.3A17 17 0 0 0 15.4 4l-.25.5a13 13 0 0 1 3.7 1.8 12 12 0 0 0-13.7 0A13 13 0 0 1 8.85 4.5L8.6 4a17 17 0 0 0-4.1 1.3C1.9 9.2 1.2 13 1.5 16.7A17 17 0 0 0 6.7 19l.65-1.1a11 11 0 0 1-1.7-.82l.42-.32a8.4 8.4 0 0 0 7.86 0l.42.32a11 11 0 0 1-1.7.82L13.3 19a17 17 0 0 0 5.2-2.3c.36-4.3-.6-8.07-2-11.4ZM8.4 14.4c-.82 0-1.5-.74-1.5-1.66 0-.92.66-1.67 1.5-1.67.84 0 1.51.76 1.5 1.67 0 .92-.67 1.66-1.5 1.66Zm6.4 0c-.82 0-1.5-.74-1.5-1.66 0-.92.66-1.67 1.5-1.67.84 0 1.51.76 1.5 1.67 0 .92-.66 1.66-1.5 1.66Z"/>
    </svg>
  );
}
function IconMail({ s = 20 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2.2"/>
      <path d="M3.6 6.5 12 12.4l8.4-5.9"/>
    </svg>
  );
}
function IconChevron({ s = 16, dir = 'right' }) {
  const d = dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6';
  return (
    <svg {...ic} width={s} height={s} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}
function IconTicket({ s = 16 }) {
  return (
    <svg {...ic} width={s} height={s} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z"/>
      <path d="M13 6v2M13 11v2M13 16v2" strokeDasharray="0.1 3"/>
    </svg>
  );
}

Object.assign(window, {
  HexMark, IconGoogle, IconX, IconWallet, IconFarcaster, IconDiscord,
  IconMail, IconChevron, IconTicket,
});
