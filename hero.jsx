// hero.jsx — Nav + Hero section. Exports window.Nav, window.Hero.
const { useState: useStateHero } = React;

function Nav({ scrolled }) {
  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")}>
      <a className="nav-logo" href="#top" aria-label="hexlash home"><LogoMark /></a>
      <nav className="nav-links">
        <a href="#gameplay"><span>GAMEPLAY</span></a>
        <a href="#hex"><span>$HEX</span></a>
        <a href="#roadmap"><span>ROADMAP</span></a>
      </nav>
      <div className="nav-social">
        <a href="#discord" aria-label="Discord"><DiscordIcon /></a>
        <a href="#x" aria-label="X"><XIcon /></a>
      </div>
    </header>
  );
}

function Hero({ t }) {
  return (
    <section className="hero" id="top">
      <div className="kicker reveal" data-d="2">
        <span className="kicker-dot" />
        <span className="kicker-txt">{t.kicker}</span>
      </div>

      <h1 className="headline">
        <span className="line reveal" data-d="3">{t.line1}</span>
        <span className="line accent flicker reveal" data-d="4">
          {t.line2}<span className="sheen" />
        </span>
      </h1>

      <p className="sub reveal" data-d="5">TRAIN<i>.</i> FIGHT<i>.</i> RISE<i>.</i></p>

      <div className="cta-row reveal" data-d="6">
        <a className="btn-play" href="#play">
          <span className="btn-play-bg" />
          <span className="btn-play-label">PLAY</span>
          <span className="btn-play-arrow"><ArrowIcon /></span>
        </a>
        <a className="btn-ghost" href="#discord">
          <DiscordIcon />
          <span>JOIN DISCORD</span>
        </a>
      </div>

      <a className="scrollcue reveal" data-d="7" href="#manifesto" aria-label="Scroll"><span /></a>
    </section>
  );
}

window.Nav = Nav;
window.Hero = Hero;
