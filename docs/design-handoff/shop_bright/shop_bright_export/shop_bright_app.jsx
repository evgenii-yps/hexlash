// shop_bright_app.jsx — BRIGHT Hexlash SHOP. Three tabs: DECOR (live) ·
// CURRENCY · SPECIALS. Stage-2 surfaces (live wallet / real money / rewards)
// are honestly SOON when the flag is off, and come fully alive when it's on.
// Decor pieces are tuned to one of the four cores — colour = which core, the
// avant-garde translation of "rarity colour". Brand pink owns the chrome.
// Needs: home_stage (OBJECTS/drawObject), shop_art (Mark/HexPile),
// shop_bright_art (CORES/CoreGlyph/GlowProp/BrightHexPile).
// Exports: ShopBright, ShopBrightInteractive.

const { useState: ubState, useEffect: ubEffect } = React;

// ───────────────────────── data ─────────────────────────
// Each decor piece is one arena prop, tuned to one core (its colour + glow).
// The hero rotates with the featured core. Neutral pieces stay matte.
const DECOR_B = [
  { kind: 'banner',     core: 'onslaught', name: 'SENTRY BANNER', sub: 'Onslaught tuning · marks your ground',     price: 480, hero: true },
  { kind: 'dais',       core: 'bulwark',   name: 'HEX DAIS',      sub: 'Bulwark tuning · a stage of your own',      price: 420 },
  { kind: 'corePlinth', core: 'raider',    name: 'CORE PLINTH',   sub: 'Raider tuning · cradles a dormant core',    price: 540, isNew: true },
  { kind: 'arch',       core: 'ambush',    name: 'WARD ARCH',     sub: 'Ambush tuning · frames the entrance',       price: 760 },
  { kind: 'crates',     core: null,        name: 'SUPPLY CACHE',  sub: 'Neutral stock · honest clutter',            price: 240, owned: true },
  { kind: 'plinth',     core: null,        name: 'STEP PLINTH',   sub: 'Neutral base · pairs with anything',        price: 180 },
];

const SUBTABS_B = [
  { label: 'DECOR', on: true },
  { label: 'FIGHTER SKINS', soon: true },
  { label: 'FX', soon: true },
  { label: 'CORES', soon: true },
];

const CURRENCY_B = [
  { id: 'spark',   name: 'SPARK',     amount: 600,   bonus: 0,    price: '$0.99',  value: '100%', tier: 1 },
  { id: 'kit',     name: 'FIELD KIT', amount: 1300,  bonus: 100,  price: '$1.99',  value: '108%', tier: 2 },
  { id: 'cache',   name: 'CACHE',     amount: 3600,  bonus: 400,  price: '$4.99',  value: '116%', tier: 3 },
  { id: 'vault',   name: 'VAULT',     amount: 8200,  bonus: 1200, price: '$9.99',  value: '123%', tier: 4 },
  { id: 'arsenal', name: 'ARSENAL',   amount: 18000, bonus: 4000, price: '$19.99', value: '130%', tier: 5, best: true },
];

const SPECIALS_B = [
  { id: 'hot', kind: 'hot', name: 'ARENA CACHE', sub: 'Hot deal · resets every 24h',
    set: [{ hex: true, t: '2,000 $HEX' }, { t: 'SUPPLY CACHE — decor' }], was: '$6.99', price: '$3.99' },
  { id: 'daily', kind: 'free', name: 'DAILY DROP', sub: 'Claim once every 24h',
    reward: '+250 $HEX', note: 'Free login reward. Stacks a streak.' },
  { id: 'starter', kind: 'bundle', core: 'ambush', name: 'FIRST BLOOD KIT', sub: 'Starter bundle · best first buy',
    set: [{ hex: true, t: '2,500 $HEX' }, { core: true, t: 'WARD ARCH — Ambush decor' }], price: '$2.99' },
];

// helper: apply a core's CSS custom props to a card
function coreVars(core) {
  const c = CORES[core];
  if (!c) return {};
  return { '--c': c.main, '--c-sup': c.sup, '--c-rgb': c.rgb };
}

// ───────────────────────── decor card ─────────────────────────
function DecorCardB({ item, idx, onBuy }) {
  const c = CORES[item.core];
  const hero = item.hero;
  return (
    <div className={`dcard sb-anim${hero ? ' hero' : ''}${item.core ? '' : ' neutral'}`}
      style={{ ...coreVars(item.core), animationDelay: `${0.05 + idx * 0.06}s` }}>
      <div className="dframe">
        <span className={`dcore${item.core ? '' : ' neutral'}`}>
          {item.core ? <><CoreGlyph core={item.core} size={hero ? 15 : 13} />{c.name}</> : 'NEUTRAL'}
        </span>
        {hero
          ? <span className="dtag feat">FEATURED</span>
          : item.isNew
            ? <span className="dtag new">NEW</span>
            : item.owned
              ? <span className="dtag">OWNED</span>
              : null}
        <GlowProp kind={item.kind} core={item.core} scale={hero ? 1.18 : 1.02} lvl={hero ? 'hero' : 'rest'} />
      </div>
      <div className="dmeta">
        {hero && <div className="hero-eye">FEATURED TUNING · {c.name}</div>}
        <div className="dname">{item.name}</div>
        <div className="dsub">{item.sub}</div>
        <div className="buy-row">
          <div className="price"><span className="hx-dia"></span><b>{item.price.toLocaleString()}</b><i>$HEX</i></div>
          {item.owned
            ? <div className="btn owned">OWNED</div>
            : <button className="btn buy" onClick={() => onBuy && onBuy(item)}>BUY<span aria-hidden="true">→</span></button>}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── currency card ─────────────────────────
function CurrencyCardB({ pack, idx, showLadder, live, onPrice }) {
  const best = pack.best;
  return (
    <div className={`ccard sb-anim${best ? ' best' : ''}${best && !live ? ' soon' : ''}`}
      style={{ animationDelay: `${0.05 + idx * 0.05}s` }}>
      {best && <span className="cc-ribbon">BEST VALUE</span>}
      <div className="cc-top">
        <div className="cc-frame"><BrightHexPile tier={pack.tier} best={best} /></div>
        <div className="cc-body">
          <div className="cc-amt"><b>{pack.amount.toLocaleString()}</b><i>$HEX</i></div>
          {pack.bonus > 0
            ? <div className="cc-bonus"><em>+{pack.bonus.toLocaleString()} free</em> included</div>
            : <div className="cc-bonus">base rate</div>}
          {showLadder && <span className="cval">VALUE <b>{pack.value}</b></span>}
        </div>
      </div>
      <div className="buy-row">
        <button className="btn soon" onClick={() => onPrice && onPrice(pack)}>
          {pack.price}{!live && <span className="sbadge">SOON</span>}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── specials card ─────────────────────────
function TimerB({ live }) {
  const [t, setT] = ubState(23 * 3600 + 14 * 60 + 8);
  ubEffect(() => {
    if (!live) return;
    const id = setInterval(() => setT(p => (p <= 0 ? 24 * 3600 : p - 1)), 1000);
    return () => clearInterval(id);
  }, [live]);
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return <span className="timer">{h}:{m}:{s}</span>;
}

function GiftIconB() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="13" width="22" height="14" />
      <path d="M3 13h26v4H3z" fill="rgba(255,255,255,0.04)" />
      <path d="M16 9v18M16 9c-3-4-7-1-4 2 M16 9c3-4 7-1 4 2" />
    </svg>
  );
}

function SpecialCardB({ sp, idx, live, onPrice, onClaim }) {
  const isHot = sp.kind === 'hot', isFree = sp.kind === 'free', isBundle = sp.kind === 'bundle';
  return (
    <div className={`scard sb-anim ${sp.kind}${live ? ' live' : ''}`}
      style={{ ...coreVars(sp.core), animationDelay: `${0.05 + idx * 0.06}s` }}>
      <div className="sc-head">
        <span className={`sc-kind ${sp.kind}`}>
          {(isHot || isBundle) && <span className="dot"></span>}
          {isHot ? 'HOT DEAL' : isFree ? 'FREE CLAIM' : 'BUNDLE'}
        </span>
        {isHot && <TimerB live={live} />}
      </div>
      <div className="sc-body">
        <div className="sc-name">{sp.name}</div>
        {isFree ? (
          <div className="sc-set" style={{ flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
            <div className="sc-free-art"><GiftIconB /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div className="sc-line" style={{ color: '#fff', fontWeight: 700 }}>{sp.reward}</div>
              <div className="sc-note">{sp.note}</div>
            </div>
          </div>
        ) : (
          <div className="sc-set">
            {sp.set.map((l, i) => (
              <div className="sc-line" key={i}>
                <span className="pl">{i === 0 ? '┌' : '└'}</span>
                {l.hex && <span className="hx-dia"></span>}
                {l.core && <span className="cdia"></span>}
                <span>{l.t}</span>
              </div>
            ))}
            <div className="sc-note">{sp.sub}</div>
          </div>
        )}
        <div className="buy-row">
          {sp.was && <div className="price"><span className="was">{sp.was}</span><b>{sp.price}</b></div>}
          {isFree
            ? <button className={`btn claim${live ? ' live' : ''}`} onClick={() => onClaim && onClaim(sp)}>CLAIM{!live && <span className="sbadge">SOON</span>}</button>
            : <button className="btn soon" onClick={() => onPrice && onPrice(sp)}>{sp.price}{!live && <span className="sbadge">SOON</span>}</button>}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── modals ─────────────────────────
function BuyModalB({ item, balance, stage, onConfirm, onClose }) {
  const c = CORES[item.core];
  if (stage === 'done') {
    return (
      <div className="sb-scrim" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()}>
          <span className="sh-bk tl"></span><span className="sh-bk tr"></span>
          <div className="sh-ok"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></div>
          <div className="sh-title">UNLOCKED</div>
          <div className="sh-sub">{item.name} is yours. Place it from <b>ARRANGE MODE</b> on your floor.</div>
          <div className="sh-rows"><div className="sh-r"><span>New balance</span><b><span className="hx-dia"></span>{(balance - item.price).toLocaleString()} $HEX</b></div></div>
          <div className="sh-actions"><button className="btn buy" onClick={onClose}>DONE</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="sb-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <span className="sh-bk tl"></span><span className="sh-bk tr"></span>
        <div className="sh-eye">CONFIRM PURCHASE</div>
        <div className="sh-title">{item.name}</div>
        <div className="sh-sub">{c ? `${c.name} tuning` : 'Neutral piece'}. Cosmetic only — it never touches the fight.</div>
        <div className="sh-rows">
          <div className="sh-r"><span>Price</span><b><span className="hx-dia"></span>{item.price.toLocaleString()} $HEX</b></div>
          <div className="sh-r"><span>Balance</span><b><span className="hx-dia"></span>{balance.toLocaleString()} $HEX</b></div>
          <div className="sh-r neg"><span>Balance after</span><b><span className="hx-dia"></span>{(balance - item.price).toLocaleString()} $HEX</b></div>
        </div>
        <div className="sh-actions">
          <button className="btn ghost" onClick={onClose}>CANCEL</button>
          <button className="btn buy" onClick={onConfirm}>CONFIRM<span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
  );
}

function WalletModalB({ onClose }) {
  return (
    <div className="sb-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <span className="sh-bk tl"></span><span className="sh-bk tr"></span>
        <div className="sh-eye">CONNECT WALLET</div>
        <div className="sh-title">TOP UP $HEX</div>
        <div className="sh-sub">Real-money top-ups need a connected wallet on Base. This goes live in <b>Stage 2</b> — wiring shown for layout only.</div>
        <div className="wprov">
          <div className="wrow"><span className="wic">◇</span>Base Wallet</div>
          <div className="wrow"><span className="wic">▣</span>MetaMask</div>
          <div className="wrow"><span className="wic">○</span>Other wallets</div>
        </div>
        <div className="sh-actions">
          <button className="btn ghost" onClick={onClose}>CLOSE</button>
          <button className="btn soon" style={{ flex: 1 }} disabled>CONNECT<span className="sbadge">SOON</span></button>
        </div>
        <div className="sh-stage"><span className="hx-dia"></span>Stage 2 · live wallet + real money</div>
      </div>
    </div>
  );
}

function ClaimModalB({ onClose }) {
  return (
    <div className="sb-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <span className="sh-bk tl"></span><span className="sh-bk tr"></span>
        <div className="sh-eye">DAILY DROP</div>
        <div className="sh-title">NOT YET LIVE</div>
        <div className="sh-sub">Daily rewards turn on with the <b>Stage-2</b> economy. Win fights and log in daily to build a streak — then claim here.</div>
        <div className="sh-actions"><button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>GOT IT</button></div>
        <div className="sh-stage"><span className="hx-dia"></span>Stage 2 · rewards economy</div>
      </div>
    </div>
  );
}

// ───────────────────────── views ─────────────────────────
function DecorViewB({ onBuy }) {
  return (
    <>
      <div className="sub-tabs">
        {SUBTABS_B.map(s => (
          <span className={`sub-tab${s.on ? ' on' : ''}`} key={s.label}>
            {s.label}{s.soon && <i>SOON</i>}
          </span>
        ))}
      </div>
      <div className="grid decor">
        {DECOR_B.map((it, i) => <DecorCardB key={it.kind} item={it} idx={i} onBuy={onBuy} />)}
      </div>
    </>
  );
}

function CurrencyViewB({ showLadder, live, onPrice }) {
  return (
    <div className="grid currency">
      <div className="cur-info">
        <div className="ci-l">
          <div className="ci-h"><span className="hx-dia"></span>WHAT IS $HEX</div>
          <p>The arena's currency. Stack it, then spend it on decor and cosmetics.</p>
        </div>
        <div className="ci-rule"><b>Cosmetics never touch the fight.</b> $HEX buys how your floor looks — never an edge in the cage.</div>
      </div>
      {CURRENCY_B.map((p, i) => <CurrencyCardB key={p.id} pack={p} idx={i} showLadder={showLadder} live={live} onPrice={onPrice} />)}
    </div>
  );
}

function SpecialsViewB({ live, onPrice, onClaim }) {
  return (
    <div className="grid specials">
      {SPECIALS_B.map((sp, i) => <SpecialCardB key={sp.id} sp={sp} idx={i} live={live} onPrice={onPrice} onClaim={onClaim} />)}
    </div>
  );
}

// ───────────────────────── shell ─────────────────────────
const TAB_LABEL_B = { decor: 'DECOR', currency: 'CURRENCY', specials: 'SPECIALS' };
const LEDE_B = {
  decor: 'Furnish your floor. Each piece is cut from the same low-poly stock as the arena — but now it carries the light of the core it\u2019s tuned to. Colour tells you which core; it never buys you an edge.',
  currency: 'Top up $HEX. Bigger packs carry more free $HEX and a better rate — the value ladder rewards going large.',
  specials: 'Rotating deals, a free daily drop and a starter bundle. Timers and rewards run on the Stage-2 economy.',
};

function ShopBright({
  layout = 'mobile', tab = 'decor', onTab,
  balance = 2480, showLadder = true, stageTwoLive = false,
  modal = null, onBuy, onPrice, onClaim, onConfirm, onCloseModal,
}) {
  const tabs = ['decor', 'currency', 'specials'];
  const live = stageTwoLive;
  return (
    <div className={`shopb shopb-${layout}`}>
      <div className="sb-bg"></div>
      <span className="sb-bk tl"></span><span className="sb-bk tr"></span>
      <span className="sb-bk bl"></span><span className="sb-bk br"></span>

      <div className="sb-head">
        <div className="sb-top">
          {layout === 'desktop'
            ? <div className="sb-brand"><Mark className="mk" /><span className="wm">HEXLASH</span><span className="sea">SHOP</span></div>
            : <button className="sb-back">← BACK TO HOME</button>}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="sb-bal"><span className="hx-dia"></span><b>{balance.toLocaleString()}</b>&nbsp;<i>$HEX</i></div>
            <div className="sb-cab"><span className="av">◇</span>NOVA·7</div>
          </div>
        </div>

        {layout === 'mobile'
          ? <div className="sb-brand" style={{ gap: '12px' }}><Mark className="mk" style={{ width: '30px', height: '30px' }} /><h1 className="sb-h1">SHOP</h1></div>
          : <h1 className="sb-h1">{TAB_LABEL_B[tab]}</h1>}

        <div className="sb-tabs">
          {tabs.map(t => (
            <button className={`sb-tab${t === tab ? ' on' : ''}`} key={t} onClick={() => onTab && onTab(t)}>{TAB_LABEL_B[t]}</button>
          ))}
        </div>
      </div>

      <div className="sb-body">
        <span className="sb-creed"><span className="dot"></span>COSMETIC ONLY · NO PAY-TO-WIN</span>
        <div className="sb-lede">{LEDE_B[tab]}</div>
        {tab === 'decor' && <DecorViewB onBuy={onBuy} />}
        {tab === 'currency' && <CurrencyViewB showLadder={showLadder} live={live} onPrice={onPrice} />}
        {tab === 'specials' && <SpecialsViewB live={live} onPrice={onPrice} onClaim={onClaim} />}
      </div>

      {modal && modal.type === 'buy' && <BuyModalB item={modal.item} balance={balance} stage={modal.stage} onConfirm={onConfirm} onClose={onCloseModal} />}
      {modal && modal.type === 'wallet' && <WalletModalB onClose={onCloseModal} />}
      {modal && modal.type === 'claim' && <ClaimModalB onClose={onCloseModal} />}
    </div>
  );
}

// ───────────────────────── interactive ─────────────────────────
function ShopBrightInteractive({ tweaks = {} }) {
  const { funded = true, ladder = true, stageTwoLive = false, startTab = 'decor' } = tweaks;
  const [tab, setTab] = ubState(startTab);
  const [modal, setModal] = ubState(null);
  ubEffect(() => { setTab(startTab); }, [startTab]);
  const balance = funded ? 2480 : 0;

  return (
    <ShopBright
      layout="mobile" tab={tab} onTab={setTab}
      balance={balance} showLadder={ladder} stageTwoLive={stageTwoLive}
      modal={modal}
      onBuy={item => setModal({ type: 'buy', item, stage: 'confirm' })}
      onConfirm={() => setModal(m => ({ ...m, stage: 'done' }))}
      onPrice={() => setModal({ type: 'wallet' })}
      onClaim={() => stageTwoLive ? setModal({ type: 'claim' }) : setModal({ type: 'claim' })}
      onCloseModal={() => setModal(null)}
    />
  );
}

Object.assign(window, { ShopBright, ShopBrightInteractive });
