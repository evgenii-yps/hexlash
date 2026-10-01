// Сборка аниматика: куски → шкала с чёрными паузами и затемнениями → mp4,
// дорожка меток, стоп-кадры.
//
// Вход — папки кадров, уже снятые `renderPlan` (имена 00000.png…, каждый every-й кадр).
// Шкала — в кадрах при 60 кадр/с; выходная частота = 60 / every.
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, rmSync, linkSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findFfmpeg } from './ffmpeg.mjs';
import { plans, timeline, FPS, FADE } from '../plan/trailer.plan.mjs';

/** Раскладывает шкалу: { id, plan|null, start, len } для каждого участка. */
export function layout() {
  let t = 0; const out = [];
  for (const item of timeline) {
    if (item.plan) { const p = plans.find((x) => x.id === item.plan); out.push({ id: p.id, plan: p, start: t, len: p.len }); t += p.len; }
    else { out.push({ id: item.label, plan: null, start: t, len: item.gap }); t += item.gap; }
  }
  return { parts: out, total: t };
}

export const fmt = (frames) => { const s = frames / FPS; return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`; };

/**
 * @param {object} o
 * @param {string} o.root        корень вывода (внутри <root>/<planId>/frames)
 * @param {number} o.every       каждый n-й кадр снят (2 → 30 кадр/с)
 * @param {string} o.out         итоговый mp4
 */
export function encodeTimeline({ root, every, out, crf = 16 }) {
  const ff = findFfmpeg();
  const { parts } = layout();
  const outFps = FPS / every;
  const inputs = []; const filters = []; const labels = [];
  parts.forEach((p, i) => {
    if (p.plan) {
      const dir = path.join(root, p.plan.id, 'frames');
      inputs.push('-framerate', String(outFps), '-i', path.join(dir, '%05d.png'));
    } else {
      inputs.push('-f', 'lavfi', '-t', String(p.len / FPS), '-i', `color=c=black:s=1280x720:r=${outFps}`);
    }
    const len = p.len / FPS;
    let f = `[${i}:v]scale=1280:720,setsar=1,fps=${outFps}`;
    if (p.plan) {
      // затемнения на стыках: по умолчанию FADE кадров; у планов переходов T1–T3 свои (fadeIn / fadeOut)
      const fin = (p.plan.fadeIn ?? FADE) / FPS, fout = (p.plan.fadeOut ?? FADE) / FPS;
      if (fin > 0) f += `,fade=t=in:st=0:d=${fin}`;
      if (fout > 0) f += `,fade=t=out:st=${Math.max(0, len - fout)}:d=${fout}`;
    }
    f += `[v${i}]`;
    filters.push(f); labels.push(`[v${i}]`);
  });
  filters.push(`${labels.join('')}concat=n=${parts.length}:v=1:a=0,format=yuv420p[vout]`);
  const args = ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-movflags', '+faststart', out];
  const r = spawnSync(ff, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg не собрал шкалу');
}

/** Дорожка меток: действия из планов + события боя из журналов + границы кусков. */
export function buildMarks({ results }) {
  const { parts, total } = layout();
  const marks = [];
  for (const p of parts) {
    marks.push({ t: p.start, time: fmt(p.start), name: p.plan ? `▶ ${p.plan.title}` : `переход ${p.id} (затемнение, пока чёрный)`, kind: 'segment' });
    if (!p.plan) continue;
    const r = results[p.plan.id] || {};
    for (const m of [...(r.marks || []), ...((p.plan.marks || []).map((x) => ({ ...x })))]) if (m.f >= 0 && m.f < p.len) marks.push({ t: p.start + m.f, time: fmt(p.start + m.f), name: m.name, kind: m.kind || 'action' });
    for (const e of r.events || []) if (e.f >= 0 && e.f < p.len) marks.push({ t: p.start + e.f, time: fmt(p.start + e.f), name: e.name, kind: e.kind });
  }
  marks.sort((a, b) => a.t - b.t);
  return { fps: FPS, totalFrames: total, totalTime: fmt(total), marks };
}

export function writeMarks(dir, data) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'marks.json'), JSON.stringify(data, null, 1));
  const csv = ['кадр;время;тип;метка', ...data.marks.map((m) => `${m.t};${m.time};${m.kind};${m.name.replace(/;/g, ',')}`)].join('\n');
  writeFileSync(path.join(dir, 'marks.csv'), csv + '\n');
}

/** Стоп-кадры: по одному на план. */
export function copyStills({ root, every, dir }) {
  mkdirSync(dir, { recursive: true });
  const { parts } = layout(); const list = [];
  for (const p of parts) {
    if (!p.plan || p.plan.still === undefined) continue;
    const idx = Math.round(p.plan.still / every);
    const src = path.join(root, p.plan.id, 'frames', String(idx).padStart(5, '0') + '.png');
    if (!existsSync(src)) continue;
    const dst = path.join(dir, `${p.plan.id}.png`);
    copyFileSync(src, dst);
    list.push({ plan: p.plan.id, title: p.plan.title, frame: p.plan.still, time: fmt(p.start + p.plan.still), file: dst });
  }
  return list;
}

/**
 * Отрывок ролика (участки переходов и финала в 1080p): части — куски планов [from, to) и чёрные паузы.
 * Кадры планов сняты `run({ranges})` (имя файла = номер кадра / every). Затемнения — как в шкале:
 * вход применяется, только если кусок начинается с 0, выход — только если кончается на длине плана.
 */
export function encodeExcerpt({ root, every, size, parts, out, crf = 16 }) {
  const ff = findFfmpeg();
  const outFps = FPS / every; const [W, H] = size;
  const inputs = []; const filters = []; const labels = [];
  parts.forEach((p, i) => {
    if (p.gap !== undefined) {
      inputs.push('-f', 'lavfi', '-t', String(p.gap / FPS), '-i', `color=c=black:s=${W}x${H}:r=${outFps}`);
      filters.push(`[${i}:v]setsar=1,fps=${outFps}[v${i}]`);
    } else {
      const plan = plans.find((x) => x.id === p.plan);
      const n = Math.round((p.to - p.from) / every);
      inputs.push('-framerate', String(outFps), '-start_number', String(Math.round(p.from / every)), '-i', path.join(root, p.plan, 'frames', '%05d.png'), '-frames:v', String(n));
      let f = `[${i}:v]scale=${W}:${H},setsar=1,fps=${outFps}`;
      const len = (p.to - p.from) / FPS;
      const fin = p.from === 0 ? (plan.fadeIn ?? FADE) / FPS : 0, fout = p.to === plan.len ? (plan.fadeOut ?? FADE) / FPS : 0;
      if (fin > 0) f += `,fade=t=in:st=0:d=${fin}`;
      if (fout > 0) f += `,fade=t=out:st=${Math.max(0, len - fout)}:d=${fout}`;
      filters.push(f + `[v${i}]`);
    }
    labels.push(`[v${i}]`);
  });
  filters.push(`${labels.join('')}concat=n=${parts.length}:v=1:a=0,format=yuv420p[vout]`);
  const args = ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-movflags', '+faststart', out];
  const r = spawnSync(ff, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg не собрал отрывок');
}
