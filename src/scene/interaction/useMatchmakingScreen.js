// Epic 3Bb Step 5 — Matchmaking CRT screen renderer + typeLog animation.
// Source: prototype 10475-10497 (refreshScreen), 10682-10734 (startSearchLogAnimation).
//
// refreshScreen — pulls from mmState every time a filter changes or a new
// log line lands. Draws BG + scan lines + title + filters summary + up to
// 14 log lines, then marks the CanvasTexture dirty.
//
// startSearchLogAnimation — setTimeout-driven typing of 6 canned lines,
// with animated dots on the "pinging arena nodes" step. Each step also has
// a 35% chance to bump searchProgress. Returns a cancel handle — callers
// must invoke on unmount, otherwise stale timers mutate mmState after the
// scene is disposed.

import { mmState, getEloRange } from '@/scene/interaction/useMatchmakingState.js';

const MAX_LOG_LINES = 14;

export function refreshScreen(ctx, tex) {
  // BG + scan lines
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, 512, 320);
  for (let y = 0; y < 320; y += 3) {
    ctx.fillStyle = 'rgba(0,229,200,0.06)';
    ctx.fillRect(0, y, 512, 1);
  }

  // Title (cyan bold)
  ctx.fillStyle = '#00E5C8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('> HEXLASH // MATCHMAKER v3.1', 16, 28);

  // Filters line (cyan-dim). Prototype prints range via mmState.eloRange
  // getter — no ±prefix on screen (HUD shows that separately).
  ctx.font = '12px monospace';
  ctx.fillStyle = '#6ee8d5';
  ctx.fillText(
    '> elo_range: ' + getEloRange()
      + '  arch: ' + mmState.archFilter
      + '  belt: ' + mmState.beltFilter,
    16, 50,
  );

  // Log lines — newest at index 0 (cyan), older dim.
  ctx.font = '11px monospace';
  const lines = mmState.searchLog;
  const n = Math.min(lines.length, MAX_LOG_LINES);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i === 0 ? '#00E5C8' : '#4aa89a';
    ctx.fillText(lines[i], 16, 82 + i * 16);
  }

  tex.needsUpdate = true;
}

const LINES_STEPS = [
  '> init matchmaker...',
  '> pinging arena nodes [', // animated dots appended in tick
  '> querying eligibility...',
  '> filtering by elo_range',
  '> filtering by archetype',
  '> collecting candidates...',
];

export function startSearchLogAnimation(ctx, tex, onComplete) {
  mmState.searchLog = [];
  mmState.searchProgress = 0;
  let step = 0;
  let dots = 0;
  let found = 0;
  let timer = null;
  let cancelled = false;

  function tick() {
    if (cancelled) return;
    if (mmState.phase !== 'search') return;

    if (step < LINES_STEPS.length) {
      const base = LINES_STEPS[step];
      let line = base;
      if (base.includes('[')) {
        // "[", "[.", "[..", "[..." then close bracket and move on
        line = base + '.'.repeat(dots % 4) + ']';
        dots++;
        if (dots > 3) {
          dots = 0;
          step++;
        }
      } else {
        step++;
      }

      mmState.searchLog.unshift(line);
      if (mmState.searchLog.length > MAX_LOG_LINES) mmState.searchLog.pop();
      refreshScreen(ctx, tex);

      // 35% chance to find a candidate on each step — same rng ratio as
      // prototype 10720-10723. searchProgress drives the HUD counter.
      if (Math.random() < 0.35) {
        found++;
        mmState.searchProgress = found;
      }

      timer = setTimeout(tick, 340);
    } else {
      // Final line placeholder — Step 8 replaces with actual candidate count
      // once generateCandidates lands.
      mmState.searchLog.unshift('> ready. awaiting results...');
      refreshScreen(ctx, tex);
      timer = setTimeout(() => {
        if (cancelled) return;
        if (mmState.phase !== 'search') return;
        if (onComplete) onComplete();
      }, 600);
    }
  }

  timer = setTimeout(tick, 400);

  return {
    cancel() {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
