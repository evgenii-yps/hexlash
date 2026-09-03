// home_screen.jsx — the Hexlash home ("дом игрока"). Constant navigation around
// a calm version of the arena: fighter idle on the slab, one pink core.
// state: 'empty' | 'lived' | 'arrange'.  Exports: HomeScreen.

const MK = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <polygon points="24,3 41.5,13 41.5,35 24,45 6.5,35 6.5,13" fill="none" stroke="currentColor" strokeWidth="2.4"/>
    <polygon points="24,13 33,18.5 33,29.5 24,35 15,29.5 15,18.5" fill="none" stroke="currentColor" strokeWidth="2.4"/>
    <path d="M24 13 L24 24 M24 24 L33 18.5 M24 24 L15 29.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
  </svg>
);

const ICON = {
  train: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l5-5 4 4 7-8"/><path d="M16 9h4v4"/></svg>,
  shop:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>,
  prof:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  hex:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2Z"/><path d="M12 8v8M8 10l8 4M16 10l-8 4" opacity="0.6"/></svg>,
};

function NavTile({ icon, name, sub, onClick }) {
  return (
    <div className="hs-tile" onClick={onClick}>
      {ICON[icon]}
      <div>
        <div className="tl-n">{name}</div>
        <div className="tl-s">{sub}</div>
      </div>
    </div>
  );
}

// floor placements per state
const SETS = {
  empty: [
    { kind: 'corePlinth', u: 0.27, v: 0.42 },
    { kind: 'banner',     u: 0.75, v: 0.40 },
  ],
  lived: [
    { kind: 'corePlinth', u: 0.23, v: 0.40 },
    { kind: 'banner',     u: 0.81, v: 0.36 },
    { kind: 'crates',     u: 0.17, v: 0.66 },
    { kind: 'arch',       u: 0.84, v: 0.64 },
    { kind: 'plinth',     u: 0.67, v: 0.5  },
    { kind: 'dais',       u: 0.5,  v: 0.84 },
  ],
  arrange: [
    { kind: 'corePlinth', u: 0.24, v: 0.40 },
    { kind: 'banner',     u: 0.80, v: 0.36 },
    { kind: 'crates',     u: 0.18, v: 0.66 },
  ],
};

function HomeScreen({ state = 'empty', onCustomize, onFight, onShop }) {
  const isArrange = state === 'arrange';
  const props = SETS[state] || [];
  const unbound = state === 'empty';          // new player hasn't linked yet
  const ghost = isArrange ? { kind: 'dais', u: 0.56, v: 0.70 } : null;

  // arrange snap grid
  const hexCells = [];
  if (isArrange) {
    [0.2, 0.35, 0.5, 0.65, 0.8].forEach(u =>
      [0.42, 0.56, 0.70, 0.84].forEach(v => {
        const active = Math.abs(u - 0.56) < 0.06 && Math.abs(v - 0.70) < 0.02;
        hexCells.push({ u, v, active });
      }));
  }

  return (
    <div className="hs-root">
      <HomeStage props={props} mode={isArrange ? 'arrange' : 'home'} ghost={ghost} hexCells={hexCells} />

      <div className="hs-bracket tl"></div>
      <div className="hs-bracket tr"></div>
      <div className="hs-bracket bl"></div>
      <div className="hs-bracket br"></div>

      {/* fighter nameplate — "this is MY fighter" */}
      <div className="hs-plate" style={{ left: '50%', top: 292 }}>
        <div className="pn">GHOST</div>
        <div className="pm"><span className="ln"></span><span>NÆ-04</span><i>◆</i><span>ONSLAUGHT CORE</span><span className="ln"></span></div>
      </div>

      {/* ───────── normal home chrome ───────── */}
      {!isArrange && (
        <React.Fragment>
          <div className="hs-top">
            <div className="hs-brand">
              {MK}
              <span className="wm">HEXLASH</span>
              <span className="season">SEASON 0</span>
            </div>
            <div className="hs-topr">
              <div className="hs-bal"><span className="dia"></span><b>2,480</b>&nbsp;<i>$HEX</i></div>
              <div className="hs-prof">
                <span className="hand">GHOST_0xA4</span>
                <span className="av"><span></span></span>
              </div>
            </div>
          </div>

          {unbound && (
            <div className="hs-bind">
              <span className="dot"></span>
              <span>Wallet not linked — <a>link your account</a> to keep your fighter &amp; space</span>
              <span className="x">✕</span>
            </div>
          )}

          <div className="hs-rail">
            <div className="hs-stub">
              <div className="st-h"><b>Dailies</b><span className="soon">SOON</span></div>
              <div className="st-s">Daily contracts<br/>land here.</div>
            </div>
            <div className="hs-stub">
              <div className="st-h"><b>Leaderboard</b><span className="soon">SOON</span></div>
              <div className="st-s">Season 0 ranks<br/>open at launch.</div>
            </div>
          </div>

          {state === 'empty' && (
            <div className="hs-hook" style={{ right: 300, top: 560 }}>
              <div className="hh">Your space.</div>
              <div className="hs">A bare floor, a fighter, a core. Drop in props and make it yours →</div>
            </div>
          )}

          <div className="hs-dock">
            <div className="hs-navset">
              <NavTile icon="train" name="Train" sub="TUNE FACETS" />
              <NavTile icon="shop" name="Shop" sub="DECOR · MORE" onClick={onShop} />
              <NavTile icon="prof" name="Profile" sub="WALLET · ACCT" />
            </div>

            <div className="hs-fight">
              <div className="fbtn" onClick={onFight}><span>FIGHT</span><span className="arr">→</span></div>
              <div className="fsub">Send your fighter to the arena</div>
            </div>

            <div className="hs-custom" onClick={onCustomize}>
              {ICON.hex}
              <div>
                <div className="cu-n">Customize<br/>Space</div>
                <div className="cu-s">ARRANGE PROPS</div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* ───────── arrange mode ───────── */}
      {isArrange && (
        <React.Fragment>
          <div className="hs-arrtop">
            <div className="hs-arrtit">
              <div className="at-k"><span className="dot"></span>ARRANGE MODE</div>
              <div className="at-n">PLACING <b>HEX DAIS</b></div>
            </div>
            <div className="hs-arract">
              <div className="hs-abtn cancel"><span>✕</span><span>Cancel</span></div>
              <div className="hs-abtn place"><span>✓</span><span>Place here</span></div>
            </div>
          </div>

          <ArrangeTray />
        </React.Fragment>
      )}
    </div>
  );
}

function ArrangeTray() {
  const items = [
    { kind: 'dais', label: 'Hex Dais', cnt: '×1', active: true },
    { kind: 'plinth', label: 'Plinth', cnt: '×3' },
    { kind: 'crates', label: 'Cache', cnt: '×2' },
    { kind: 'banner', label: 'Banner', cnt: '×1' },
    { kind: 'corePlinth', label: 'Core Plinth', cnt: '×1' },
    { kind: 'arch', label: 'Ward Arch', cnt: '×0', locked: true },
  ];
  return (
    <div className="hs-tray">
      <div className="hs-tray-h">
        <span className="th">Your props</span>
        <span className="ts">Drag onto a cell · snaps to the floor grid</span>
      </div>
      <div className="hs-tray-row">
        {items.map((it, i) => (
          <div key={i} className={`hs-slot${it.active ? ' active' : ''}${it.locked ? ' locked' : ''}`}>
            <span className="sn">{it.label}</span>
            <span className="cnt">{it.cnt}</span>
            <svg viewBox="0 0 118 84" preserveAspectRatio="xMidYMax meet">
              <g transform="translate(59,74) scale(0.42)" dangerouslySetInnerHTML={{ __html: drawObject(it.kind) }} />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
