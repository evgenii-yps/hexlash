// shop_bright_palette.jsx — the OTHER half of the brief: an expanded palette
// proposed as canon, plus the rules of the bright direction, laid out ready to
// drop into the brand book. Named set (hex · role · where · glow), the four
// cores with both tones, trainer materials, the bright-direction laws, and a
// reference→translation ledger. Self-contained styles (scoped to .pboard).
// Exports: PaletteBoard.

if (typeof document !== 'undefined' && !document.getElementById('pboard-styles')) {
  const s = document.createElement('style');
  s.id = 'pboard-styles';
  s.textContent = `
  .pboard{--void:#08080a;--panel:#16161b;--ink:#ededf1;--dim:#a9a5af;--muted:#76727c;
    --pink:#ff0069;--line:rgba(255,255,255,0.09);--line2:rgba(255,255,255,0.05);
    --disp:"Saira Condensed",sans-serif;--mono:"JetBrains Mono",monospace;
    position:absolute;inset:0;overflow:hidden;background:var(--void);color:var(--ink);
    font-family:var(--disp);-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(120% 60% at 50% -8%,#130a10 0%,#0a0a10 46%,var(--void) 80%);}
  .pboard *{box-sizing:border-box;margin:0;padding:0;}
  .pb-inner{padding:56px 64px 64px;}
  .pb-eye{display:flex;align-items:center;gap:14px;font-family:var(--mono);font-size:12px;font-weight:500;
    letter-spacing:.34em;color:var(--pink);text-transform:uppercase;margin-bottom:18px;}
  .pb-eye::before{content:"";width:34px;height:2px;background:var(--pink);box-shadow:0 0 10px var(--pink);}
  .pb-h{font-weight:900;text-transform:uppercase;letter-spacing:.01em;font-size:64px;line-height:.9;}
  .pb-h b{color:#fff;text-shadow:0 0 12px rgba(255,0,105,.55),0 0 44px rgba(255,0,105,.4);}
  .pb-intro{font-family:var(--mono);font-size:13.5px;line-height:1.7;color:var(--dim);max-width:80ch;margin-top:18px;}
  .pb-intro b{color:#fff;font-weight:500;}
  .pb-sec{margin-top:48px;}
  .pb-sh{font-family:var(--mono);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#fff;
    border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:22px;display:flex;align-items:center;gap:12px;}
  .pb-sh i{color:var(--pink);font-style:normal;}
  .pb-sh small{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--muted);text-transform:none;margin-left:auto;}

  /* swatch grid */
  .pb-row{display:grid;gap:14px;}
  .pb-row.n4{grid-template-columns:repeat(4,1fr);}
  .pb-row.n5{grid-template-columns:repeat(5,1fr);}
  .pb-sw{border:1px solid var(--line);background:rgba(255,255,255,0.02);overflow:hidden;display:flex;flex-direction:column;}
  .pb-chip{height:92px;position:relative;display:flex;align-items:flex-end;padding:12px;}
  .pb-chip .glow{position:absolute;top:10px;right:10px;font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;
    text-transform:uppercase;padding:2px 6px;border-radius:2px;}
  .pb-chip .glow.on{color:#fff;background:rgba(0,0,0,.4);}
  .pb-chip .glow.off{color:rgba(255,255,255,.7);background:rgba(0,0,0,.32);}
  .pb-meta{padding:12px 14px 14px;}
  .pb-nm{font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.02em;}
  .pb-hex{font-family:var(--mono);font-size:11px;color:var(--dim);margin-top:4px;letter-spacing:.06em;}
  .pb-role{font-family:var(--mono);font-size:10.5px;color:var(--muted);margin-top:8px;line-height:1.5;}
  .pb-role b{color:#cfccd3;font-weight:500;}

  /* core card */
  .pb-cores{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .pb-core{border:1px solid var(--line);background:rgba(255,255,255,0.02);overflow:hidden;}
  .pb-core .ch{height:108px;position:relative;display:flex;align-items:center;justify-content:center;}
  .pb-core .tones{position:absolute;inset:0;display:flex;}
  .pb-core .tones span{flex:1;}
  .pb-core .gly{position:relative;z-index:2;color:#fff;filter:drop-shadow(0 0 10px rgba(0,0,0,.5));}
  .pb-core .pulse{position:absolute;z-index:1;width:120px;height:120px;border-radius:50%;
    filter:blur(22px);opacity:.55;}
  .pb-core .cmeta{padding:13px 15px 15px;}
  .pb-core .cnm{font-weight:800;font-size:18px;text-transform:uppercase;letter-spacing:.03em;}
  .pb-core .chexes{font-family:var(--mono);font-size:10.5px;color:var(--dim);margin-top:5px;letter-spacing:.04em;
    display:flex;gap:10px;}
  .pb-core .chexes b{color:#fff;font-weight:500;}
  .pb-core .crole{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:9px;line-height:1.5;}

  /* rules */
  .pb-rules{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
  .pb-rule{border:1px solid var(--line);background:rgba(255,255,255,0.02);padding:18px 20px;display:flex;gap:16px;}
  .pb-rule .num{font-family:var(--mono);font-size:12px;color:var(--pink);font-weight:700;flex:none;padding-top:2px;letter-spacing:.1em;}
  .pb-rule .rt{font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.02em;margin-bottom:7px;}
  .pb-rule .rd{font-family:var(--mono);font-size:11px;line-height:1.65;color:var(--dim);}
  .pb-rule .rd b{color:#fff;font-weight:500;}
  .pb-rule.no .rt{color:#fff;} .pb-rule.no .num{color:var(--muted);}

  /* ledger */
  .pb-led{border:1px solid var(--line);}
  .pb-lr{display:grid;grid-template-columns:1fr 1.3fr;gap:0;}
  .pb-lr + .pb-lr{border-top:1px solid var(--line2);}
  .pb-lr > div{padding:15px 20px;font-family:var(--mono);font-size:11.5px;line-height:1.6;}
  .pb-lr .from{color:var(--dim);border-right:1px solid var(--line2);}
  .pb-lr .from b{color:#cfccd3;font-weight:500;letter-spacing:.04em;}
  .pb-lr .to{color:#d8d4da;}
  .pb-lr .to b{color:var(--pink);font-weight:500;}
  .pb-lr.head > div{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);background:rgba(255,255,255,0.015);}
  `;
  document.head.appendChild(s);
}

const NEUTRALS = [
  { nm: 'VOID', hex: '#08080A', role: 'Base / background. The tactical ground everything sits on.', glow: false },
  { nm: 'PANEL', hex: '#16161B', role: 'Raised surface — cards, sheets, frames.', glow: false },
  { nm: 'INK DIM', hex: '#5D5D66', role: 'Meta, mono labels, disabled & SOON states.', glow: false },
  { nm: 'INK', hex: '#EDEDF1', role: 'Primary text. Warm-cool white, never pure.', glow: false },
];
const TRAINER = [
  { nm: 'SAND', hex: '#C9B8A0', role: 'Low-poly prop bodies. Neutral-warm filler.', glow: false },
  { nm: 'RUST', hex: '#E86134', role: 'Worn metal accent on structural art.', glow: false },
  { nm: 'TEAL', hex: '#2F86A8', role: 'Cool patina on stone / chrome props.', glow: false },
  { nm: 'CHROME', hex: '#C8D1D8', hex2: '#585F68', role: 'Edge highlight → shadow ramp on facets.', glow: false },
  { nm: 'AMBER', hex: '#FFB21D', role: 'Warm lamp / contact light on matte props.', glow: false },
];
const RULES = [
  { t: 'One hero glow per screen', d: 'Exactly one card carries a full bloom at rest — the featured tuning. Every other card stays restrained until hovered, then lights in its own core.' },
  { t: 'One accent per element', d: 'A card wears <b>one</b> colour: its core, or brand pink for the system layer. Never two cores in one element, never pink mixed with a core.' },
  { t: 'Colour is a signal, not decor', d: 'A core colour always means "tuned to this core." This replaces the reference\u2019s rainbow rarity — no colour without a meaning in the Hexlash system.' },
  { t: 'Pink owns chrome + economy', d: 'Brand pink drives CTAs, balance, tabs, BUY, $HEX value (BEST VALUE, HOT). Cores own the merchandise — frames, glyphs, blooms. They never blend.' },
  { t: 'Glow hierarchy', d: 'Strongest \u2192 weakest: <b>hero bloom \u2192 BEST&nbsp;VALUE / HOT ring \u2192 BUY button \u2192 hover rim</b>. At most one bloom + one ring lit at rest per viewport.' },
  { t: 'Where glow is forbidden', d: 'Never on: the top chrome (matte, shared with home), SOON / gated states, owned items, body copy, or trainer-material prop bodies.' },
];
const LEDGER = [
  { from: 'Dense, "real" storefront — packed cards, hero moments', to: 'Kept. Presence cards, a value ladder and one hero tuning per shelf.' },
  { from: 'Rarity colour (random per item)', to: 'Re-coded as <b>core tuning</b> — colour = which of the four cores a cosmetic is themed to. Meaningful, not arbitrary.' },
  { from: 'Value badges · timers · free-claim · bundles', to: 'Kept as merchandising rhythm — but every reward is cosmetic, and gated behind honest SOON until Stage 2.' },
  { from: 'Sells power — boosters, nuke, repair', to: 'Removed entirely. Desire engine is self-expression, status, rarity of cosmetics — <b>cosmetic only, no pay-to-win.</b>' },
  { from: 'Glow on everything (neon noise)', to: 'Budgeted glow: one hero bloom, one ring, the rest lights on hover. Loud, but disciplined.' },
  { from: 'Whole UI shouts', to: 'Only the shop body shouts. The chrome stays matte, shared with the matte home that catches up later.' },
];

function CoreSwatch({ id }) {
  const c = CORES[id];
  return (
    <div className="pb-core">
      <div className="ch">
        <div className="tones"><span style={{ background: c.main }}></span><span style={{ background: c.sup }}></span></div>
        <div className="pulse" style={{ background: c.main }}></div>
        <div className="gly"><CoreGlyph core={id} size={40} /></div>
      </div>
      <div className="cmeta">
        <div className="cnm">{c.name}</div>
        <div className="chexes"><span>MAIN <b>{c.main}</b></span><span>SUP <b>{c.sup}</b></span></div>
        <div className="crole">Glow allowed — in its own colour only, when this core is the active / featured one.</div>
      </div>
    </div>
  );
}

function PaletteBoard() {
  return (
    <div className="pboard">
      <div className="pb-inner">
        <div className="pb-eye">Palette · Draft 1 → Brand Book</div>
        <h1 className="pb-h">THE BRIGHT<br /><b>PALETTE.</b></h1>
        <p className="pb-intro">The shop is the avant-garde surface — it shifts Hexlash toward a brighter, fuller language while the rest of the game holds its matte discipline. This is the canon that lets it shout without going to noise: a near-black tactical base, brand pink for the system layer, and the four cores as the merchandising spine. <b>Bolder, with glow and presence — never random neon, never borrowed rarity.</b></p>

        <div className="pb-sec">
          <div className="pb-sh"><i>01</i> Neutrals — cool base <small>no glow, ever</small></div>
          <div className="pb-row n4">
            {NEUTRALS.map(s => (
              <div className="pb-sw" key={s.nm}>
                <div className="pb-chip" style={{ background: s.hex, borderBottom: '1px solid var(--line)' }}>
                  <span className="glow off">No glow</span>
                </div>
                <div className="pb-meta"><div className="pb-nm">{s.nm}</div><div className="pb-hex">{s.hex}</div><div className="pb-role">{s.role}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-sec">
          <div className="pb-sh"><i>02</i> Brand — the system layer <small>glow allowed</small></div>
          <div className="pb-row n4">
            <div className="pb-sw" style={{ gridColumn: 'span 2' }}>
              <div className="pb-chip" style={{ background: '#ff0069', boxShadow: 'inset 0 0 60px rgba(255,255,255,.12)' }}>
                <span className="glow on">Glow ✓</span>
              </div>
              <div className="pb-meta">
                <div className="pb-nm">HEXLASH PINK</div><div className="pb-hex">#FF0069 · rgb 255,0,105</div>
                <div className="pb-role"><b>Owns the chrome &amp; economy:</b> CTAs, BUY, balance, tabs, $HEX value cues (BEST VALUE, HOT DEAL). Glows on the system layer — never blended into a core element.</div>
              </div>
            </div>
            <div className="pb-sw" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>
              <div className="pb-meta" style={{ padding: '18px 20px' }}>
                <div className="pb-role" style={{ marginTop: 0, fontSize: '11px', lineHeight: 1.7 }}>
                  Pink is the one colour shared with the matte home — it stays the brand's single strike. In the bright shop it earns more presence (fill, glow, ribbons), but it never mixes with a core hue inside the same element. <b style={{ color: '#fff' }}>Rule 2 holds the whole system together.</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-sec">
          <div className="pb-sh"><i>03</i> The four cores — 2 tones each <small>the merchandising spine</small></div>
          <div className="pb-cores">
            {['onslaught', 'raider', 'bulwark', 'ambush'].map(id => <CoreSwatch key={id} id={id} />)}
          </div>
        </div>

        <div className="pb-sec">
          <div className="pb-sh"><i>04</i> Trainer materials — neutral-warm <small>structural art · no glow</small></div>
          <div className="pb-row n5">
            {TRAINER.map(s => (
              <div className="pb-sw" key={s.nm}>
                <div className="pb-chip" style={{ background: s.hex2 ? `linear-gradient(105deg, ${s.hex}, ${s.hex2})` : s.hex, borderBottom: '1px solid var(--line)' }}>
                  <span className="glow off">No glow</span>
                </div>
                <div className="pb-meta"><div className="pb-nm">{s.nm}</div><div className="pb-hex">{s.hex}{s.hex2 ? ` → ${s.hex2}` : ''}</div><div className="pb-role">{s.role}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-sec">
          <div className="pb-sh"><i>05</i> Rules of the bright direction <small>what goes in the brand book</small></div>
          <div className="pb-rules">
            {RULES.map((r, i) => (
              <div className="pb-rule" key={i}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <div><div className="rt">{r.t}</div><div className="rd" dangerouslySetInnerHTML={{ __html: r.d }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-sec">
          <div className="pb-sh"><i>06</i> Reference → Hexlash <small>energy taken · how it was translated</small></div>
          <div className="pb-led">
            <div className="pb-lr head"><div>From the reference P2E shop</div><div>Translated into Hexlash</div></div>
            {LEDGER.map((l, i) => (
              <div className="pb-lr" key={i}>
                <div className="from" dangerouslySetInnerHTML={{ __html: l.from }} />
                <div className="to" dangerouslySetInnerHTML={{ __html: l.to }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PaletteBoard });
