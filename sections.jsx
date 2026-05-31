// sections.jsx — NEVER GIVE UP, GAMEPLAY, $HEX, ROADMAP, STAY UPDATED, Footer.
// Exports each to window. Scroll-reveal driven by [data-reveal] + IntersectionObserver (in app.jsx).
const { useState: useS } = React;

function Eyebrow({ children }) {
  return (
    <div className="eyebrow" data-reveal>
      <span className="eyebrow-line" />
      <span>{children}</span>
    </div>
  );
}

/* ============ NEVER GIVE UP ============ */
const PILLARS = [
  { n: "01", k: "TRAIN", d: "Drill the cage. Master every angle before the bell." },
  { n: "02", k: "FIGHT", d: "Step in. Read your rival. Commit to the strike." },
  { n: "03", k: "RISE", d: "Climb the ranks. Earn the name they'll remember." },
];

function NeverGiveUp() {
  return (
    <section className="sec sec-code" id="manifesto">
      <div className="wrap">
        <Eyebrow>THE CODE</Eyebrow>
        <h2 className="big-title code-title" data-reveal data-d="1">
          <span className="ghost">NEVER GIVE UP</span>
          <span className="solid">NEVER GIVE UP</span>
        </h2>
        <p className="code-sub" data-reveal data-d="2">TRAIN<i>.</i> FIGHT<i>.</i> RISE<i>.</i></p>
        <div className="pillars">
          {PILLARS.map((p, i) => (
            <div className="pillar" data-reveal data-d={i + 3} key={p.k}>
              <span className="pillar-n">{p.n}</span>
              <span className="pillar-k">{p.k}</span>
              <span className="pillar-d">{p.d}</span>
              <span className="pillar-bar" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ GAMEPLAY ============ */
function Gameplay() {
  return (
    <section className="sec sec-gameplay" id="gameplay">
      <div className="wrap">
        <Eyebrow>FIRST LOOK</Eyebrow>
        <h2 className="big-title" data-reveal data-d="1">GAMEPLAY</h2>
        <div className="player" data-reveal data-d="2">
          <span className="player-hex-bg" />
          <span className="player-scan" />
          <span className="hud-c tl" /><span className="hud-c tr" />
          <span className="hud-c bl" /><span className="hud-c br" />
          <button className="play-hex" aria-label="Video incoming">
            <span className="play-hex-shape"><PlayIcon /></span>
          </button>
          <span className="player-label">VIDEO INCOMING</span>
          <span className="player-bar"><i /></span>
          <span className="player-rec"><b />REC · STANDBY</span>
        </div>
        <p className="player-cap" data-reveal data-d="3">First match recordings drop with the next release.</p>
      </div>
    </section>
  );
}

/* ============ $HEX ============ */
const HEX_FACTS = [
  { k: "BUILT ON BASE", d: "Low fees, fast finality." },
  { k: "FAIR LAUNCH", d: "No insiders. No presale." },
  { k: "FUELS THE ARENA", d: "Entry, rewards, governance." },
];

function HexToken() {
  return (
    <section className="sec sec-hex" id="hex">
      <div className="wrap">
        <Eyebrow>THE TOKEN</Eyebrow>
        <h2 className="hex-word" data-reveal data-d="1">
          $HEX<span className="sheen" />
        </h2>
        <p className="hex-status" data-reveal data-d="2">COMING SOON</p>
        <p className="hex-chain" data-reveal data-d="3">LAUNCHING ON BASE</p>

        <div className="chips" data-reveal data-d="4">
          {HEX_FACTS.map((f) => (
            <div className="chip" key={f.k}>
              <span className="chip-k">{f.k}</span>
              <span className="chip-d">{f.d}</span>
            </div>
          ))}
        </div>

        <div className="contract" data-reveal data-d="5">
          <span className="contract-l">CONTRACT</span>
          <span className="contract-addr">0x•••••••••••••••••••••••••••••••••••••••••</span>
          <button className="contract-btn" disabled><CopyIcon />REVEALING SOON</button>
        </div>
      </div>
    </section>
  );
}

/* ============ ROADMAP ============ */
const PHASES = [
  { n: "01", k: "FOUNDATION", d: "Arena online. The community forms.", s: "IN PROGRESS", live: true },
  { n: "02", k: "$HEX LAUNCH", d: "Token goes live on Base.", s: "COMING SOON" },
  { n: "03", k: "RANKED SEASONS", d: "Competitive ladders & rewards.", s: "COMING SOON" },
  { n: "04", k: "THE LEAGUE", d: "Tournaments & partnerships.", s: "COMING SOON" },
];

function Roadmap() {
  return (
    <section className="sec sec-roadmap" id="roadmap">
      <div className="wrap">
        <Eyebrow>THE PATH</Eyebrow>
        <h2 className="big-title" data-reveal data-d="1">ROADMAP</h2>
        <div className="timeline" data-reveal data-d="2">
          <span className="timeline-track"><span className="timeline-fill" /></span>
          <div className="phases">
            {PHASES.map((p, i) => (
              <div className={"phase" + (p.live ? " live" : "")} data-reveal data-d={i + 2} key={p.n}>
                <span className="phase-node" />
                <span className="phase-n">{p.n}</span>
                <span className="phase-k">{p.k}</span>
                <span className="phase-d">{p.d}</span>
                <span className={"phase-s" + (p.live ? " on" : "")}>{p.s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="partners" data-reveal data-d="3">
          <span className="partners-l">STRATEGIC PARTNERSHIPS</span>
          <span className="partners-v">TBA</span>
        </div>
      </div>
    </section>
  );
}

/* ============ STAY UPDATED ============ */
function StayUpdated() {
  const [email, setEmail] = useS("");
  const [status, setStatus] = useS("idle"); // idle | error | done
  function submit(e) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setStatus(ok ? "done" : "error");
  }
  return (
    <section className="sec sec-join" id="join">
      <div className="wrap">
        <Eyebrow>DON'T MISS THE DROP</Eyebrow>
        <h2 className="big-title" data-reveal data-d="1">STAY UPDATED</h2>
        <p className="join-sub" data-reveal data-d="2">Be first when the arena opens.</p>

        {status === "done" ? (
          <div className="join-done" data-reveal data-d="3">
            <span className="join-check">✓</span> YOU'RE ON THE LIST. SEE YOU IN THE CAGE.
          </div>
        ) : (
          <form className={"join-form" + (status === "error" ? " err" : "")} onSubmit={submit} data-reveal data-d="3">
            <input
              type="email"
              className="join-input"
              placeholder="enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
            />
            <button type="submit" className="join-btn">
              <span className="join-btn-bg" />
              <span>SUBSCRIBE</span>
            </button>
          </form>
        )}
        {status === "error" && <p className="join-err" data-reveal>Enter a valid email to join.</p>}
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer() {
  const socials = [
    { i: <TelegramIcon />, l: "Telegram", h: "#telegram" },
    { i: <XIcon />, l: "X", h: "#x" },
    { i: <YoutubeIcon />, l: "YouTube", h: "#youtube" },
    { i: <DiscordIcon />, l: "Discord", h: "#discord" },
    { i: <InstagramIcon />, l: "Instagram", h: "#instagram" },
  ];
  return (
    <footer className="footer">
      <div className="footer-top">
        <a className="footer-brand" href="#top">
          <LogoMark />
          <span className="footer-word">HEXLASH</span>
        </a>
        <span className="footer-tag">NEVER GIVE UP</span>
      </div>
      <div className="footer-social">
        {socials.map((s) => (
          <a key={s.l} href={s.h} aria-label={s.l}>{s.i}</a>
        ))}
      </div>
      <div className="footer-bottom">
        <nav className="footer-links">
          <a href="#privacy">Privacy</a><span>·</span>
          <a href="#rules">Rules</a><span>·</span>
          <a href="#help">Help</a>
        </nav>
        <span className="footer-copy">© 2026 HEXLASH — ALL RIGHTS RESERVED</span>
      </div>
    </footer>
  );
}

Object.assign(window, { NeverGiveUp, Gameplay, HexToken, Roadmap, StayUpdated, Footer });
