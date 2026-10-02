// Сборка аниматика: куски → шкала с чёрными паузами и затемнениями → mp4,
// дорожка меток, стоп-кадры.
//
// Вход — папки кадров, уже снятые `renderPlan` (имена 00000.png…, каждый every-й кадр).
// Шкала — в кадрах при 60 кадр/с; выходная частота = 60 / every.
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, rmSync, linkSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findFfmpeg } from './ffmpeg.mjs';
import { plans, timeline, FPS, FADE, grade } from '../plan/trailer.plan.mjs';
import { gradeFilter } from './grade.mjs';

// Цвет в файле: кадры RGB → YUV по BT.709 (HD), диапазон ТВ, и ЯВНЫЕ метки. Без них плеер сам решает, какую матрицу взять, и розовый уходит в оттенке
// (замер на кнопке FIGHT: без меток G +20 у обычного плеера). Метки пишутся и в x264, и в контейнер.
export const COLOR_TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const TO_YUV = 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p';

/** Раскладывает шкалу: { id, plan|null, start, len } для каждого участка. */
export function layout() {
  let t = 0; const out = [];
  for (const item of timeline) {
    if (item.plan) {
      // trim — съём кадров с головы/хвоста только в шкале (рендер плана не меняется): сцены подрезаются под окна титров на долях музыки
      const p = plans.find((x) => x.id === item.plan); const head = p.trim?.head ?? 0, tail = p.trim?.tail ?? 0;
      const len = p.len - head - tail;
      out.push({ id: p.id, plan: p, start: t, len, head }); t += len;
    }
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
export function encodeTimeline({ root, every, out, crf = 16, preset = 'medium', size = [1280, 720], blend30 = false, doGrade = true }) {
  const ff = findFfmpeg();
  const { parts: allParts } = layout(); const parts = process.env.SHOWCASE_PARTS ? allParts.slice(0, Number(process.env.SHOWCASE_PARTS)) : allParts;   // SHOWCASE_PARTS=n — отладка: только первые n кусков
  const [W, H] = size;
  const outFps = (FPS / every) / (blend30 ? 2 : 1);   // blend30: снимали 60 кадр/с, в файл — 30, каждый кадр = среднее двух соседних (как затвор 180° при 30)
  const inFps = FPS / every;
  const tmp = path.resolve(path.dirname(out), '_parts-' + path.basename(out, '.mp4')); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const run = (args) => { const r = spawnSync(ff, ['-y', '-hide_banner', '-loglevel', process.env.SHOWCASE_FFLOG || 'error', ...args], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg не собрал шкалу'); };
  // Каждый кусок кодируется БЕЗ потерь (ffv1, RGB) в свой файл и склеивается демуксером concat. Фильтр concat на длинных кусках с разной длиной
  // терял кадры на 60 кадр/с (общая длина выходила ≈ половиной), а демуксер склеивает кусок за куском по их собственным меткам времени.
  const files = [];
  parts.forEach((p, i) => {
    const input = p.plan
      ? ['-framerate', String(inFps), '-start_number', String(p.head / every), '-i', path.join(root, p.plan.id, 'frames', '%05d.png')]
      : ['-f', 'lavfi', '-t', String(p.len / FPS), '-i', `color=c=black:s=${W}x${H}:r=${outFps}`];
    if (p.plan && p.head % every) throw new Error(`trim.head плана ${p.id} должен быть кратен every=${every}`);
    const len = p.len / FPS;
    let f = `scale=${W}:${H},setsar=1,fps=${inFps}`;
    if (p.plan) {
      // цветокоррекция — на игровые кадры; титры и логотип (графика бренда с заданными цветами) не трогаем
      if (doGrade && p.plan.kind !== 'title' && p.plan.kind !== 'logo') f += gradeFilter(grade.params);
      if (blend30) f += `,tmix=frames=2:weights='1 1',select='mod(n,2)',setpts=N/(${outFps}*TB)`;
      // затемнения на стыках: по умолчанию FADE кадров; у планов переходов T1–T3 свои (fadeIn / fadeOut)
      const fin = (p.plan.fadeIn ?? FADE) / FPS, fout = (p.plan.fadeOut ?? FADE) / FPS;
      if (fin > 0) f += `,fade=t=in:st=0:d=${fin}`;
      if (fout > 0) f += `,fade=t=out:st=${Math.max(0, len - fout)}:d=${fout}`;
    }
    const file = path.join(tmp, `part${String(i).padStart(2, '0')}.nut`);
    run([...input, '-vf', `${f},fps=${outFps},format=rgb24`, '-r', String(outFps), '-frames:v', String(p.len / every / (blend30 ? 2 : 1)), '-c:v', 'ffv1', '-level', '3', '-threads', '4', '-an', file]);
    // каждый кусок обязан получиться ровно нужной длины: недобор молча добивался бы повтором последнего кадра (стоп-кадр в ролике)
    const want = p.len / every / (blend30 ? 2 : 1);
    const probe = spawnSync(ff, ['-hide_banner', '-stats', '-i', file, '-map', '0:v:0', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const got = Number(((probe.stderr || '').replace(/\r/g, '\n').match(/frame=\s*(\d+)/g) || []).pop()?.replace(/\D/g, ''));
    if (got !== want) throw new Error(`кусок ${p.id}: в файл попало ${got} кадров из ${want} — недобор, ролик бы получил стоп-кадр`);
    files.push(file);
  });
  const list = path.join(tmp, 'list.txt'); writeFileSync(list, files.map((x, i) => `file '${path.resolve(x)}'\nduration ${(parts[i].len / every / (blend30 ? 2 : 1) / outFps).toFixed(6)}`).join('\n') + '\n');
  const args = ['-f', 'concat', '-safe', '0', '-i', list, '-vf', TO_YUV, '-r', String(outFps), '-fps_mode', 'cfr',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', ...COLOR_TAGS, '-movflags', '+faststart', out];
  if (process.env.SHOWCASE_PRINT) console.log(JSON.stringify(args));
  run(args);
  if (!process.env.SHOWCASE_KEEP) rmSync(tmp, { recursive: true, force: true });
}

/** Дорожка меток: действия из планов + события боя из журналов + границы кусков. */
export function buildMarks({ results }) {
  const { parts, total } = layout();
  const marks = [];
  for (const p of parts) {
    marks.push({ t: p.start, time: fmt(p.start), name: p.plan ? `▶ ${p.plan.title}` : `переход ${p.id} (затемнение, пока чёрный)`, kind: 'segment' });
    if (!p.plan) continue;
    const r = results[p.plan.id] || {};
    // кадр плана → кадр шкалы: за вычетом съёмного куска головы; метки, попавшие в съём, — в начало куска только для переходов
    const at = (f) => p.start + f - p.head;
    for (const m of [...(r.marks || []), ...((p.plan.marks || []).map((x) => ({ ...x })))]) if (m.f >= p.head - (m.kind === 'transition' ? 1e9 : 0) && m.f - p.head < p.len) marks.push({ t: at(Math.max(m.f, p.head)), time: fmt(at(Math.max(m.f, p.head))), name: m.name, kind: m.kind || 'action' });
    for (const e of r.events || []) if (e.f >= p.head && e.f - p.head < p.len) marks.push({ t: at(e.f), time: fmt(at(e.f)), name: e.name, kind: e.kind });
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
      inputs.push('-framerate', String(outFps), '-start_number', String(Math.round(p.from / every)), '-t', String(n / outFps), '-i', path.join(root, p.plan, 'frames', '%05d.png'));
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
