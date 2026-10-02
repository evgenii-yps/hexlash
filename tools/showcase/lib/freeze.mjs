// Проверка «нет стоп-кадров» на выходном файле: freezedetect (порог 0,0005, от 0,3 с) + счёт новых кадров по секундам.
// Неподвижность разрешена ТОЛЬКО в белом списке: чёрные окна переходов с титрами (t1–t3) и удержание логотипа (s10-logo).
// Любой другой стоп-кадр — ошибка с указанием секунды. Историю см. в отчёте этапа 4 (финал, исправление).
import { spawn, spawnSync } from 'node:child_process';
import { findFfmpeg } from './ffmpeg.mjs';
import { layout } from './assemble.mjs';
import { FPS } from '../plan/trailer.plan.mjs';

/** Белый список: окна (в секундах ролика), где неподвижность допустима. */
export function freezeWhitelist() {
  const { parts } = layout();
  return parts.filter((p) => !p.plan || p.plan.kind === 'title' || p.plan.kind === 'logo').map((p) => ({ id: p.id, from: p.start / FPS, to: (p.start + p.len) / FPS }));
}

export function detectFreezes(file, { noise = 0.0005, dur = 0.3 } = {}) {
  const r = spawnSync(findFfmpeg(), ['-hide_banner', '-loglevel', 'info', '-i', file, '-an', '-vf', `freezedetect=n=${noise}:d=${dur}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const out = (r.stderr || '').split('\n'); const res = []; let cur = null;
  for (const l of out) {
    let m = l.match(/freeze_start: ([0-9.]+)/); if (m) { cur = { start: Number(m[1]) }; continue; }
    m = l.match(/freeze_end: ([0-9.]+)/); if (m && cur) { cur.end = Number(m[1]); res.push(cur); cur = null; }
  }
  if (cur) res.push({ start: cur.start, end: Infinity });
  return res;
}

/** Новые (не повторяющие предыдущий) кадры по секундам: серый кадр 320×180, «новый» — если хоть один пиксель отличается от предыдущего. */
export function newFramesPerSecond(file, fps) {
  return new Promise((resolve, reject) => {
    const W = 320, H = 180, SZ = W * H;
    const p = spawn(findFfmpeg(), ['-v', 'error', '-i', file, '-an', '-vf', `scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = Buffer.alloc(0), prev = null, n = 0; const sec = []; const flags = [];
    p.stdout.on('data', (c) => {
      buf = buf.length ? Buffer.concat([buf, c]) : c;
      while (buf.length >= SZ) {
        const f = buf.subarray(0, SZ); buf = buf.subarray(SZ);
        let isNew = true;
        if (prev) { let s = 0; for (let i = 0; i < SZ; i++) s += Math.abs(f[i] - prev[i]); isNew = s > 0; }
        prev = Buffer.from(f);
        flags.push(isNew ? 1 : 0);
        const si = Math.floor(n / fps); sec[si] = (sec[si] || 0) + (isNew ? 1 : 0); n++;
      }
    });
    p.on('close', () => resolve({ perSecond: sec, frames: n, flags }));
    p.on('error', reject);
  });
}

/**
 * Полная проверка файла. Стоп-кадр = окно freezedetect (порог 0,0005, от 0,3 с) вне белого списка, в котором кадры ПОВТОРЯЮТСЯ (меньше половины новых).
 * Окно, где каждый кадр новый, но движение слабее порога (спокойная пауза между обменами ударов, камера почти стоит), — не стоп-кадр: это «тихий момент»,
 * он попадает в отчёт отдельным списком (`quiet`), сборку не роняет.
 */
export async function checkNoFreezes(file, fps) {
  const wl = freezeWhitelist(); const tol = 0.2;
  const freezes = detectFreezes(file);
  const stat = await newFramesPerSecond(file, fps);
  const outside = freezes.filter((z) => !wl.some((w) => z.start >= w.from - tol && z.end <= w.to + tol));
  const alive = (z) => { const a = Math.round(z.start * fps), b = Math.min(stat.frames, Math.round((Number.isFinite(z.end) ? z.end : stat.frames / fps) * fps)); let n = 0; for (let i = a; i < b; i++) n += stat.flags[i]; return (b - a) ? n / (b - a) : 1; };
  const problems = [], quiet = [];
  for (const z of outside) { const share = alive(z); (share >= 0.5 ? quiet : problems).push({ ...z, newShare: Number(share.toFixed(2)) }); }
  return { file, fps, whitelist: wl, freezes, quiet, problems, perSecond: stat.perSecond, frames: stat.frames, ok: problems.length === 0 };
}
