// Музыка ролика (шаг 2 правок v1): монтаж звука под готовую шкалу, громкость, две версии (со звуком и без).
//
// Всё берётся из данных сценария (`music` в plan/trailer.plan.mjs) и из шкалы (`layout`):
//   • якорь «возврат темы» ↔ первый кадр финала задаёт задержку музыки d;
//   • музыка идёт как есть до кадра обрыва (cut), потом провал, и на кадре bam — полнозвучный вход трека
//     (в треке это возврат всей фактуры после провала 71,5–74,3 с), дальше кода под логотипом и затухание;
//   • вход (fadeIn) — от начала музыки; затухание (fadeOut) — под удержанием логотипа;
//   • громкость — двухпроходный loudnorm до music.lufs, истинный пик ≤ music.tp.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FPS } from '../plan/trailer.plan.mjs';

const SR = 48000;
const n4 = (x) => Number(x).toFixed(4);

/** Кадр шкалы для {plan, f} (f — кадр плана; съём головы trim учтён). */
export function absFrame(parts, at) {
  const p = parts.find((x) => x.id === at.plan);
  if (!p) throw new Error(`music: нет плана ${at.plan}`);
  return p.start + at.f - (p.head || 0);
}

/** Времена монтажа в секундах ролика и трека. */
export function musicTimes(parts, total, music) {
  const tTheme = absFrame(parts, music.anchors.theme.at) / FPS;
  const tBam = absFrame(parts, music.anchors.bam.at) / FPS;
  const tCut = absFrame(parts, music.cut) / FPS;
  const dur = total / FPS;
  const d = tTheme - music.anchors.theme.track;               // трек t → ролик t + d (до обрыва)
  const dB = tBam - music.anchors.bam.track;                  // трек t → ролик t + dB (после обрыва)
  if (d < 0) throw new Error('music: возврат темы стоит в ролике раньше, чем в треке — нужен съём начала трека (не реализован)');
  return {
    d, dB, tTheme, tBam, tCut, dur,
    aEnd: tCut - d,                    // конец куска А в треке
    bStart: tCut - dB,                 // начало куска Б в треке
    bLen: dur - tCut,                  // длина куска Б
  };
}

function ff(bin, args, opts = {}) {
  const r = spawnSync(bin, ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
  return r;
}

/** Граф монтажа → поток [m] (до громкости). */
function mixGraph(t, music, bamGain = 0) {
  const f = music.fadeIn, fo = music.fadeOut, edge = 0.03;
  // подъём громкости кода-входа: в треке полнозвучный вход после провала тише громкой части на ≈7 дБ, а BAM должен быть самым сильным
  // местом; уровень идёт с boost.db дБ на ударе и линейно в дБ спадает до нуля за boost.sec; пики прижимает мягкий лимитер
  const bo = music.boost ? `volume=volume='pow(10,(${music.boost.db}*max(0,1-t/${music.boost.sec}))/20)':eval=frame,alimiter=limit=0.9:attack=2:release=80:level=disabled,` : '';
  const dA = Math.round(t.d * SR), dBcut = Math.round(t.tCut * SR);
  return [
    `[0:a]aresample=${SR},asplit=2[a0][b0]`,
    `[a0]atrim=start=0:end=${n4(t.aEnd)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${n4(f)},afade=t=out:st=${n4(t.aEnd - edge)}:d=${edge},adelay=delays=${dA}S:all=1[A]`,
    `[b0]atrim=start=${n4(t.bStart)}:end=${n4(t.bStart + t.bLen)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.008,volume=${bamGain}dB,${bo}afade=t=out:st=${n4(t.bLen - fo - 0.1)}:d=${n4(fo)},adelay=delays=${dBcut}S:all=1[B]`,
    `[A][B]amix=inputs=2:duration=longest:normalize=0,apad=whole_dur=${n4(t.dur)},atrim=0:${n4(t.dur)},asetpts=PTS-STARTPTS[m]`,
  ].join(';');
}

/** Двухпроходная громкость. Возвращает { measured, final } и пишет wav 48 кГц стерео. */
export function buildMix({ ffmpeg, mp3, t, music, outWav, bamGain = 0 }) {
  const g = mixGraph(t, music, bamGain);
  const I = music.lufs, TP = music.tp;
  // проход 1 — измерение
  const r1 = ff(ffmpeg, ['-i', mp3, '-filter_complex', `${g};[m]loudnorm=I=${I}:TP=${TP}:LRA=11:print_format=json[o]`, '-map', '[o]', '-f', 'null', '-']);
  const j = /\{[^{}]*"input_i"[^{}]*\}/s.exec(r1.stderr);
  if (!j) throw new Error('loudnorm: не удалось измерить\n' + r1.stderr.slice(-800));
  const m = JSON.parse(j[0]);
  // проход 2 — линейная подгонка
  const ln = `loudnorm=I=${I}:TP=${TP}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json,aresample=${SR}`;
  const r2 = ff(ffmpeg, ['-y', '-i', mp3, '-filter_complex', `${g};[m]${ln}[o]`, '-map', '[o]', '-ac', '2', '-c:a', 'pcm_s16le', outWav]);
  if (r2.status !== 0) throw new Error('loudnorm: второй проход упал\n' + r2.stderr.slice(-800));
  const j2 = /\{[^{}]*"output_i"[^{}]*\}/s.exec(r2.stderr);
  const out = j2 ? JSON.parse(j2[0]) : null;
  return { measured: m, loudnorm: out };
}

/** Независимая проверка готового wav: интегральная громкость и истинный пик (ebur128) и пик по отсчётам (astats). */
export function checkLoudness({ ffmpeg, wav }) {
  const r = ff(ffmpeg, ['-i', wav, '-af', 'ebur128=peak=true,astats=measure_perchannel=Peak_level:measure_overall=Peak_level', '-f', 'null', '-']);
  const err = r.stderr;
  const sum = err.slice(err.lastIndexOf('Summary:'));
  const num = (re) => { const x = re.exec(sum); return x ? Number(x[1]) : null; };
  const samplePeak = [...err.matchAll(/Peak level dB:\s*(-?[\d.]+|-inf)/g)].map((x) => Number(x[1]));
  return {
    integratedLUFS: num(/I:\s+(-?[\d.]+) LUFS/), loudnessRange: num(/LRA:\s+(-?[\d.]+) LU/),
    truePeakDBTP: num(/Peak:\s+(-?[\d.]+) dBFS/), samplePeakDB: samplePeak.length ? Math.max(...samplePeak) : null,
  };
}

/** Мультиплекс: видео как есть + AAC. Вторая версия — то же видео без звука. */
export function muxVideo({ ffmpeg, video, wav, outSound, outSilent, bitrate, dur }) {
  mkdirSync(path.dirname(outSound), { recursive: true });
  const a = ff(ffmpeg, ['-y', '-i', video, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', bitrate, '-t', n4(dur), '-movflags', '+faststart', outSound]);
  if (a.status !== 0) throw new Error('mux: не собрался ролик со звуком\n' + a.stderr.slice(-600));
  const b = ff(ffmpeg, ['-y', '-i', video, '-map', '0:v:0', '-c:v', 'copy', '-an', '-movflags', '+faststart', outSilent]);
  if (b.status !== 0) throw new Error('mux: не собрался ролик без звука\n' + b.stderr.slice(-600));
}

/** Доли в времени ролика: для долей трека, попавших в смонтированные куски. */
export function beatsInVideo(beatmap, t) {
  const out = [];
  for (const b of beatmap.beats) {
    if (b.t >= 0 && b.t <= t.aEnd) out.push({ ...b, video: b.t + t.d, part: 'A' });
    else if (b.t >= t.bStart && b.t <= t.bStart + t.bLen) out.push({ ...b, video: b.t + t.dB, part: 'B' });
  }
  return out;
}

const ms = (x) => Math.round(x * 1000);
const fmtT = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;

/** Карта долей рядом с дорожкой меток: на какую долю село каждое событие ролика. */
export function writeBeatReports({ dir, beatmap, t, marks, music }) {
  mkdirSync(dir, { recursive: true });
  const beats = beatsInVideo(beatmap, t);
  const near = (sec) => { let best = null; for (const b of beats) { const dlt = sec - b.video; if (best === null || Math.abs(dlt) < Math.abs(best.dlt)) best = { b, dlt }; } return best; };
  // карта долей (в треке и в ролике)
  const csv1 = ['№;время в треке, с;время в ролике, с;кадр ролика (60/с);сила;кусок', ...beats.map((b, i) => `${i + 1};${b.t.toFixed(3)};${b.video.toFixed(3)};${Math.round(b.video * FPS)};${b.strength};${b.part === 'A' ? 'до обрыва' : 'после обрыва'}`)];
  writeFileSync(path.join(dir, 'beatmap.csv'), csv1.join('\n') + '\n');
  // метки ↔ доли
  const rows = [];
  for (const m of marks.marks) {
    const sec = m.t / FPS; const n = near(sec);
    rows.push({ ...m, sec, near: n });
  }
  const csv2 = ['кадр;время;тип;метка;ближайшая доля, с (ролик);сдвиг, мс (метка − доля);время доли в треке, с', ...rows.map((r) => `${r.t};${r.time};${r.kind};${r.name.replace(/;/g, ',')};${r.near ? r.near.b.video.toFixed(3) : ''};${r.near ? ms(r.near.dlt) : ''};${r.near ? r.near.b.t.toFixed(3) : ''}`)];
  writeFileSync(path.join(dir, 'marks-beats.csv'), csv2.join('\n') + '\n');
  const info = {
    delayMusicSec: Number(t.d.toFixed(4)), cutVideoSec: Number(t.tCut.toFixed(4)), bamVideoSec: Number(t.tBam.toFixed(4)),
    pieces: [
      { name: 'кусок А', track: [0, Number(t.aEnd.toFixed(3))], video: [Number(t.d.toFixed(3)), Number(t.tCut.toFixed(3))] },
      { name: 'кусок Б', track: [Number(t.bStart.toFixed(3)), Number((t.bStart + t.bLen).toFixed(3))], video: [Number(t.tCut.toFixed(3)), Number(t.dur.toFixed(3))] },
    ],
    anchors: music.anchors,
  };
  return { rows, info };
}

// ───────────── варианты музыки на одном видео (шаг 3, замечания владельца) ─────────────
// Сплошной кусок трека без склейки: видео t ↔ трек t + m0 (m0 ≥ 0). Вход — fadeIn от нуля, затухание — под удержанием логотипа.
// boost — подъём уровня на BAM: boost.db дБ на ударе, линейно (в дБ) спадает до нуля за boost.sec; перед ударом — короткий нарост 30 мс.
function continuousGraph({ m0, dur, music, boost }) {
  const f = music.fadeIn, fo = music.fadeOut;
  let bo = '';
  if (boost) {
    const a = boost.at - 0.03;
    bo = `volume=volume='pow(10,(${boost.db}*clip((t-${n4(a)})/0.03,0,1)*max(0,1-(t-${n4(boost.at)})/${boost.sec}))/20)':eval=frame,alimiter=limit=0.9:attack=2:release=80:level=disabled,`;
  }
  return `[0:a]aresample=${SR},atrim=start=${n4(m0)}:end=${n4(m0 + dur)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${n4(f)},${bo}afade=t=out:st=${n4(dur - fo - 0.1)}:d=${n4(fo)},apad=whole_dur=${n4(dur)},atrim=0:${n4(dur)},asetpts=PTS-STARTPTS[m]`;
}

/** Громкость двухпроходная — как в buildMix, но граф сплошного куска. */
export function buildContinuous({ ffmpeg, mp3, m0, dur, music, boost, outWav }) {
  const g = continuousGraph({ m0, dur, music, boost });
  const I = music.lufs, TP = music.tp;
  const r1 = ff(ffmpeg, ['-i', mp3, '-filter_complex', `${g};[m]loudnorm=I=${I}:TP=${TP}:LRA=11:print_format=json[o]`, '-map', '[o]', '-f', 'null', '-']);
  const j = /\{[^{}]*"input_i"[^{}]*\}/s.exec(r1.stderr);
  if (!j) throw new Error('loudnorm: не удалось измерить\n' + r1.stderr.slice(-800));
  const m = JSON.parse(j[0]);
  const ln = `loudnorm=I=${I}:TP=${TP}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json,aresample=${SR}`;
  const r2 = ff(ffmpeg, ['-y', '-i', mp3, '-filter_complex', `${g};[m]${ln}[o]`, '-map', '[o]', '-ac', '2', '-c:a', 'pcm_s16le', outWav]);
  if (r2.status !== 0) throw new Error('loudnorm: второй проход упал\n' + r2.stderr.slice(-800));
  return { measured: m };
}

/** Мультиплекс без повторного кодирования видео. */
export function muxOnly({ ffmpeg, video, wav, out, bitrate, dur }) {
  const a = ff(ffmpeg, ['-y', '-i', video, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', bitrate, '-t', n4(dur), '-movflags', '+faststart', out]);
  if (a.status !== 0) throw new Error('mux: не собрался ролик со звуком\n' + a.stderr.slice(-600));
}
