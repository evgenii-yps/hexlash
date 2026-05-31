// app.jsx — assembles the full hexlash landing page + Tweaks + scroll behavior.
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff0069",
  "intensity": 8,
  "shape": "shard",
  "line1": "BIGGER FIGHTS",
  "line2": "INCOMING",
  "kicker": "SEASON 0 — TEASER LIVE",
  "grain": true,
  "scanlines": true,
  "marquee": true
}/*EDITMODE-END*/;

function Ticker({ items }) {
  return (
    <div className="ticker-strip">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <div className="marquee-group" key={dup} aria-hidden={dup === 1}>
            {items.map((it, i) => (
              <React.Fragment key={i}>
                <span className="m-item">{it}</span>
                <span className="m-sep">◆</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [isIn, setIsIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rgb = hexToRgb(t.accent);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-rgb", rgb.join(","));
  }, [t.accent]);

  // hero load entrance
  useEffect(() => {
    const id = setTimeout(() => setIsIn(true), 90);
    return () => clearTimeout(id);
  }, []);

  // sticky-nav state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll-reveal for sections
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-inview", "1"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-inview", "1");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    // safety net: reveal anything still hidden after a beat (covers throttled observers)
    const safety = setTimeout(() => els.forEach((el) => el.setAttribute("data-inview", "1")), 2600);
    return () => { io.disconnect(); clearTimeout(safety); };
  });

  const tickerItems = [t.line1 + " " + t.line2, "$HEX LAUNCHING ON BASE", "NEVER GIVE UP", "TRAIN · FIGHT · RISE"];

  return (
    <div className={"app" + (isIn ? " is-in" : "")}>
      {/* fixed background */}
      <div className="bg-fixed">
        <div className="bg-base" />
        <HexGrid accent={rgb} intensity={t.intensity} shape={t.shape} />
        <div className="bg-glow" />
        <div className="vignette" />
        {t.scanlines && <div className="scanlines" />}
        {t.grain && <div className="grain" />}
      </div>

      {/* persistent HUD frame */}
      <div className="hud-frame" aria-hidden="true">
        <span className="hud tl" /><span className="hud tr" />
        <span className="hud bl" /><span className="hud br" />
      </div>

      <Nav scrolled={scrolled} />

      <main className="page">
        <Hero t={t} />
        {t.marquee && <Ticker items={tickerItems} />}
        <NeverGiveUp />
        <Gameplay />
        <HexToken />
        <Roadmap />
        <StayUpdated />
        <Footer />
      </main>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["#ff0069", "#00e5ff", "#b026ff", "#39ff14"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSlider label="Animation" value={t.intensity} min={0} max={10} step={1}
          onChange={(v) => setTweak("intensity", v)} />
        <TweakSelect label="Backdrop" value={t.shape}
          options={[
            { label: "Shards", value: "shard" },
            { label: "Hexagons", value: "hex" },
            { label: "Triangles", value: "triangle" },
            { label: "Rings", value: "ring" },
          ]}
          onChange={(v) => setTweak("shape", v)} />

        <TweakSection label="Headline" />
        <TweakText label="Line 1" value={t.line1} onChange={(v) => setTweak("line1", v)} />
        <TweakText label="Line 2" value={t.line2} onChange={(v) => setTweak("line2", v)} />
        <TweakText label="Kicker" value={t.kicker} onChange={(v) => setTweak("kicker", v)} />

        <TweakSection label="Atmosphere" />
        <TweakToggle label="Grain" value={t.grain} onChange={(v) => setTweak("grain", v)} />
        <TweakToggle label="Scanlines" value={t.scanlines} onChange={(v) => setTweak("scanlines", v)} />
        <TweakToggle label="Ticker" value={t.marquee} onChange={(v) => setTweak("marquee", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
