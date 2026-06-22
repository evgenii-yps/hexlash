// home_shop.jsx — SHOP · DECOR. The store's first living shelf. Same discipline
// as the home: dark, matte, one pink. Not a loud Web3 stall — restrained,
// telemetry-priced, props shown in the arena material family. Exports: ShopDecor.

function PropPreview({ kind, scale = 1 }) {
  return (
    <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMax meet" className="sp-prev">
      <defs>
        <radialGradient id={`spdrop-${kind}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* faint hex dais the item sits on */}
      <polygon points="80,176 130,150 180,176 130,202" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
      <ellipse cx="130" cy="178" rx={70 * scale} ry={14 * scale} fill={`url(#spdrop-${kind})`} />
      <g transform={`translate(130,180) scale(${scale})`} dangerouslySetInnerHTML={{ __html: drawObject(kind) }} />
    </svg>
  );
}

function ShopCard({ kind, owned, featured, previewScale }) {
  const o = OBJECTS[kind];
  return (
    <div className={`sp-card${featured ? ' feat' : ''}`}>
      <div className="sp-frame">
        <span className="sp-tag">{kind === 'corePlinth' ? 'NEW' : 'DECOR'}</span>
        <PropPreview kind={kind} scale={previewScale || (featured ? 1.35 : 0.92)} />
      </div>
      <div className="sp-meta">
        <div className="sp-name">{o.name}</div>
        <div className="sp-sub">{o.tag}</div>
        <div className="sp-buy">
          <div className="sp-price"><span className="dia"></span><b>{o.price.toLocaleString()}</b><i>$HEX</i></div>
          {owned
            ? <div className="sp-btn owned">OWNED</div>
            : <div className="sp-btn buy">BUY<span className="ar">→</span></div>}
        </div>
      </div>
    </div>
  );
}

function ShopDecor() {
  return (
    <div className="hs-root">
      <div className="sp-bg"></div>
      <div className="hs-bracket tl"></div>
      <div className="hs-bracket tr"></div>
      <div className="hs-bracket bl"></div>
      <div className="hs-bracket br"></div>

      <div className="hs-top">
        <div className="hs-brand">
          {MK}
          <span className="wm">HEXLASH</span>
          <span className="season">SHOP</span>
        </div>
        <div className="hs-topr">
          <div className="hs-bal"><span className="dia"></span><b>2,480</b>&nbsp;<i>$HEX</i></div>
          <div className="sp-back">← BACK TO HOME</div>
        </div>
      </div>

      <div className="sp-wrap">
        <div className="sp-head">
          <div className="sp-h1">DECOR</div>
          <div className="sp-tabs">
            <span className="tb active">DECOR</span>
            <span className="tb">FIGHTER SKINS <i>SOON</i></span>
            <span className="tb">FX <i>SOON</i></span>
            <span className="tb">CORES <i>SOON</i></span>
          </div>
          <div className="sp-lede">Furnish your floor. Every piece is cut from the same low-poly stock as the arena — matte, dark, no neon. It’s your ground; mark it.</div>
        </div>

        <div className="sp-grid">
          <ShopCard kind="banner" featured />
          <div className="sp-col">
            <ShopCard kind="corePlinth" />
            <ShopCard kind="dais" />
          </div>
          <div className="sp-col">
            <ShopCard kind="crates" owned />
            <ShopCard kind="arch" />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ShopDecor });
