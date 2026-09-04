<template>
  <!-- ══════════════════════════════════════════════════════════════════════
       HEXLASH 404 — ported from Claude Design handoff (design_handoff_hexlash_404).
       Self-contained: every selector scoped under #hx-404 with the .hx4-* prefix
       and local CSS vars — zero collision with the app shell. The fixed full-
       viewport overlay (z-index above the App.vue header/toasts) renders the
       screen full-bleed, exactly like the handoff and the loading splash.
       Fonts (Saira Condensed / JetBrains Mono) are loaded globally — no per-page
       <link>; system fallbacks below keep it legible the instant it paints.
       ══════════════════════════════════════════════════════════════════════ -->
  <main id="hx-404">
    <div class="hx4-glow" aria-hidden="true"></div>

    <div class="hx4-hud" aria-hidden="true">
      <i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>
    </div>

    <header class="hx4-top">
      <router-link class="hx4-lock" to="/" aria-label="Hexlash home">
        <HexlashMark :size="96" class="hx4-mark" />
        <span class="hx4-word">HEXLASH</span>
      </router-link>
    </header>

    <section class="hx4-mid">
      <h1 class="hx4-sr">{{ t.errors.notFoundSr }}</h1>

      <div class="hx4-num hx4-rise hx4-d1" aria-hidden="true">
        <span class="ghost">404</span>
        <span class="solid">404</span>
      </div>

      <div class="hx4-creed hx4-rise hx4-d3">{{ t.errors.notFoundCreedLead }} <b>{{ t.errors.notFoundCreedAccent }}</b></div>

      <p class="hx4-sub hx4-rise hx4-d4">{{ t.errors.notFoundSub }}</p>

      <div class="hx4-cta hx4-rise hx4-d5">
        <router-link class="hx4-btn" to="/">
          <span class="hx4-btn-bg"></span>
          <span>{{ t.errors.notFoundBack }}</span>
        </router-link>
        <router-link class="hx4-ghost" to="/play">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5L8 5.5Z"/></svg>
          <span>{{ t.errors.notFoundPlay }}</span>
        </router-link>
      </div>
    </section>

    <footer class="hx4-foot">
      <div class="hx4-note">
        <span class="lbl">{{ t.errors.notFoundNoteLabel }}</span>
        <span class="txt">{{ t.errors.notFoundNote }}</span>
      </div>
    </footer>
  </main>
</template>

<script setup>
import {t} from '@/locales/index.js';
import {HexlashMark} from '@/components/brand/hexlashMark.js';
</script>

<!--
  Non-scoped on purpose: the handoff stylesheet is already fully namespaced
  under #hx-404 with the .hx4-* prefix and local CSS vars, so nothing leaks
  past the screen. A plain block ports it verbatim — keyframes, ::selection,
  the universal reset and clip-paths all survive untouched.
-->
<style>
  #hx-404{
    /* Локальная копия палитры и шрифтов убрана — всё приходит из tokens.css,
       включая запасные начертания. */

    position:fixed; inset:0; z-index:var(--z-load); overflow:hidden;
    color:var(--ink); font-family:var(--font-mono);
    -webkit-font-smoothing:antialiased; user-select:none;
    /* Solid base + ONE radial ember wash. No images, no video, no filters. */
    background:radial-gradient(130% 80% at 50% 120%, var(--carbon) 0%, var(--void) 46%, var(--void) 82%);
  }
  #hx-404 *{ box-sizing:border-box; margin:0; }
  #hx-404 a{ color:inherit; text-decoration:none; }
  #hx-404 ::selection{ background:var(--pink); color:var(--ink); }

  /* Breathing accent glow behind the impact moment */
  .hx4-glow{ position:absolute; left:50%; top:48%; transform:translate(-50%,-50%);
    width:min(70vw,860px); height:min(70vw,860px); pointer-events:none; z-index:0;
    background:radial-gradient(circle, rgba(var(--pink-rgb),.16) 0%, rgba(var(--pink-rgb),.045) 42%, transparent 68%);
    opacity:.72; }

  /* HUD corner brackets — brandbook furniture */
  .hx4-hud i{ position:absolute; width:5vmin; height:5vmin; min-width:30px; min-height:30px;
    border:0 solid rgba(var(--pink-rgb),.55); z-index:5; }
  .hx4-hud i.tl{ top:4vmin; left:4vmin; border-left-width:1.6px; border-top-width:1.6px; }
  .hx4-hud i.tr{ top:4vmin; right:4vmin; border-right-width:1.6px; border-top-width:1.6px; }
  .hx4-hud i.bl{ bottom:4vmin; left:4vmin; border-left-width:1.6px; border-bottom-width:1.6px; }
  .hx4-hud i.br{ bottom:4vmin; right:4vmin; border-right-width:1.6px; border-bottom-width:1.6px; }

  /* Top lockup: mark + wordmark — same monochrome lockup as the loading screen */
  .hx4-top{ position:absolute; top:5vmin; left:0; right:0; z-index:5;
    display:flex; justify-content:center; }
  /* Vertical lock-up — mark above, word below. Ratios measured off
     docs/design-handoff/hexlash_mark/assets/hexlash-lockup-vertical.svg (word cap
     = 35.3% of the mark's ink, gap = 68.8% of it), driven by the single --word
     knob so the pair scales together. Same construction as the loading screen. */
  .hx4-lock{ --word:5vmin;
    display:flex; flex-direction:column; align-items:center; }
  .hx4-mark{ width:calc(var(--word) * 2.29); height:calc(var(--word) * 2.29);
    display:block; margin-bottom:calc(var(--word) * 1.18); color:var(--ink); }
  .hx4-word{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
    font-size:var(--word); line-height:1; letter-spacing: var(--ls-tight); }

  /* ── Centerpiece ─────────────────────────────────────────────── */
  .hx4-mid{ position:absolute; inset:0; z-index:4;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:clamp(12px,2vmin,24px); text-align:center; padding:12vmin 6vw; }

  /* Telemetry tag — blinking live dot */
  .hx4-tag{ display:inline-flex; align-items:center; gap:1.4vmin;
    border:1px solid rgba(var(--pink-rgb),.34); background:rgba(var(--pink-rgb),.05);
    padding:.85vmin 2vmin; font-size:clamp(10px,1.35vmin,13px); letter-spacing: var(--ls-wide);
    text-transform:uppercase; color:var(--ink-soft); }
  .hx4-tag i{ width:8px; height:8px; border-radius: var(--r-round); background:var(--pink); }

  /* The 404 — impact moment. Ghost stroke behind, solid face in front.
     Свечение снято: единственное свечение в Hexlash — разлом арены. */
  .hx4-num{ position:relative; display:inline-block;
    font-family:var(--font-display); font-weight:900; line-height:.82;
    font-size:clamp(100px,min(28vw,30vh),300px); letter-spacing: var(--ls-tight);
    font-variant-numeric:tabular-nums; }
  .hx4-num .ghost{ position:absolute; left:0; right:0; top:0; color:transparent;
    -webkit-text-stroke:1.6px rgba(var(--pink-rgb),.45); transform:translateY(-1.4vmin) scale(1.012);
    opacity:.6; }
  .hx4-num .solid{ position:relative; color:var(--ink); }

  /* Creed — brand voice, second word carries the pink charge */
  .hx4-creed{ font-family:var(--font-display); font-weight:800; text-transform:uppercase;
    font-size:clamp(38px,6.6vw,92px); line-height:1; letter-spacing: var(--ls-tight);
    color:var(--ink); white-space:nowrap; }
  /* Второе слово несёт розовый заряд цветом, а не свечением. */
  .hx4-creed b{ color:var(--pink); }

  /* Supporting line */
  .hx4-sub{ font-family:var(--font-mono); font-weight:500; text-transform:uppercase;
    font-size:clamp(12px,1.7vmin,16px); letter-spacing: var(--ls-wide); color:var(--ink-dim);
    margin-top:.6vmin; max-width:46ch; }

  /* CTA row */
  .hx4-cta{ display:flex; gap:18px; margin-top:2.4vmin; flex-wrap:wrap; align-items:center; justify-content:center; }

  .hx4-btn{ position:relative; display:inline-flex; align-items:center; gap:13px;
    padding:17px 38px; font-weight:700; font-size:16px; letter-spacing: var(--ls-wide); color:var(--ink);
    text-transform:uppercase; isolation:isolate; overflow:hidden; cursor:pointer;
    clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px); }
  /* Правка 1.1 §5: кнопка возврата несёт glow-hero. Экран без свечения в
     проекте ровно один — загрузка; 404 к нему не относится (Документ Б, экран
     9). Свечение снято только с цифр, знака процента и слова в девизе — там
     его быть не должно, оно там и не заявлено. */
  /* Единственная петля на этом экране — пульсация кнопки возврата (Правка 1.2
     §3). 404 тупиковый: его единственная задача — вернуть игрока, поэтому всё
     остальное движение здесь было шумом и снято. Ушли: дыхание свечения за
     цифрами, мигание точки в метке, мерцание самих цифр и пробегающий блик по
     кнопке. Осталась одна пульсация, и она указывает на выход. */
  .hx4-btn-bg{ position:absolute; inset:0; z-index:-1; background:var(--pink);
    box-shadow:var(--glow-hero);
    animation:hx4Pulse var(--d-loop) ease-in-out infinite;
    transition:filter var(--d-hover) var(--e-weight), box-shadow var(--d-hover) var(--e-weight); }
  @keyframes hx4Pulse{ 0%,100%{ box-shadow:var(--glow-hero); }
    50%{ box-shadow:0 0 26px rgba(var(--pink-rgb),.75), 0 0 56px rgba(var(--pink-rgb),.5); } }
  .hx4-btn-arrow{ display:flex; transform:translateX(-2px); opacity:.85;
    transition:transform var(--d-hover) var(--e-weight), opacity var(--d-hover) var(--e-weight); }
  .hx4-btn:hover .hx4-btn-bg{ filter:brightness(1.08); }
  .hx4-btn:hover .hx4-btn-arrow{ transform:translateX(4px); opacity:1; }
  .hx4-btn:active{ transform:translateY(1px); transition-duration:var(--d-press); }

  /* Ghost / secondary — corner ticks reveal on hover */
  .hx4-ghost{ position:relative; display:inline-flex; align-items:center; gap:11px;
    padding:16px 28px; font-family:var(--font-mono); font-weight:500; font-size:13.5px;
    letter-spacing: var(--ls-meta); text-transform:uppercase; color:var(--ink-soft);
    border:1px solid var(--line-strong); background:var(--fill-1);
    transition:color .3s, border-color .3s, background .3s; cursor:pointer; }
  .hx4-ghost svg{ width:18px; height:18px; }
  .hx4-ghost::before,.hx4-ghost::after{ content:""; position:absolute; width:9px; height:9px;
    border-color:var(--pink); opacity:0; transition:opacity .3s; }
  .hx4-ghost::before{ top:-1px; left:-1px; border-top:2px solid; border-left:2px solid; }
  .hx4-ghost::after{ bottom:-1px; right:-1px; border-bottom:2px solid; border-right:2px solid; }
  .hx4-ghost:hover{ color:var(--ink); border-color:rgba(var(--pink-rgb),.4); background:rgba(var(--pink-rgb),.06); }
  .hx4-ghost:hover::before,.hx4-ghost:hover::after{ opacity:1; }

  /* Footer field-note — brandbook microtext */
  .hx4-foot{ position:absolute; left:0; right:0; bottom:6vmin; z-index:5;
    display:flex; justify-content:center; padding:0 6vw; }
  .hx4-note{ display:inline-flex; align-items:center; gap:2vmin; max-width:92vw; }
  .hx4-note .lbl{ flex:none; font-size:clamp(9px,1.3vmin,12px); letter-spacing: var(--ls-meta); color:var(--pink);
    border:1px solid rgba(var(--pink-rgb),.4); padding:.7vmin 1.5vmin; text-transform:uppercase; }
  .hx4-note .txt{ font-size:clamp(10px,1.45vmin,13px); letter-spacing: var(--ls-meta); color:var(--ink-dim); text-transform:uppercase; }

  /* Visually-hidden accessible heading */
  .hx4-sr{ position:absolute; width:1px; height:1px; padding:0; overflow:hidden;
    clip:rect(0 0 0 0); white-space:nowrap; border:0; }

  /* Entrance — transform-only reveal. Base state stays visible so print,
     PDF, reduced-motion and static snapshots always show the content. */
  .hx4-rise{ animation:hx4Rise .7s cubic-bezier(.2,.8,.2,1) both; }
  .hx4-d1{ animation-delay:.04s; } .hx4-d2{ animation-delay:.13s; } .hx4-d3{ animation-delay:.22s; }
  .hx4-d4{ animation-delay:.31s; } .hx4-d5{ animation-delay:.4s; }
  @keyframes hx4Rise{ from{ transform:translateY(14px); } to{ transform:none; } }

  /* ── Portrait / mobile (≤430px is comfortably inside this) ──────── */
  @media (max-aspect-ratio: 1/1){
    .hx4-mid{ padding:18vmin 7vw; gap:clamp(10px,1.6vmin,20px); }
    .hx4-num{ font-size:clamp(110px,min(48vw,30vh),320px); }
    .hx4-creed{ font-size:clamp(38px,11vw,76px); }
    .hx4-lock{ --word:7vmin; }
    .hx4-hud i{ width:6.5vmin; height:6.5vmin; }
  }
  @media (max-width: 560px){
    .hx4-cta{ flex-direction:column; width:100%; max-width:340px; }
    .hx4-btn, .hx4-ghost{ width:100%; justify-content:center; }
    .hx4-note{ flex-direction:column; gap:1.4vmin; text-align:center; }
  }

  /* ── Respect reduced-motion — static fallback ──────────────────── */
  @media (prefers-reduced-motion: reduce){
    #hx-404 *{ animation:none !important; }
    .hx4-rise{ transform:none !important; }
  }
</style>
