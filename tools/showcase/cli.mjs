#!/usr/bin/env node
// Командная строка рендера ролика.
//
//   node tools/showcase/cli.mjs build                 весь ролик одной командой: подбор боёв (если цифры боя
//                                                     изменились) → кадры всех планов → выборочная сверка
//                                                     повторяемости → шкала → mp4, дорожка меток, стоп-кадры
//   node tools/showcase/cli.mjs fights [duel|squad]   подбор боёв заново (зёрна, окна) → plan/fights.lock.json
//   node tools/showcase/cli.mjs plan <id> [опции]     один план
//   node tools/showcase/cli.mjs verify <id>           ПОЛНАЯ сверка: второй рендер всех кадров и сравнение побайтно
//   node tools/showcase/cli.mjs excerpts [--size 1920x1080]  отрывки переходов T1–T3 и финала (по умолчанию 1080p, 30 кадр/с)
//   node tools/showcase/cli.mjs music                 звук под готовую шкалу (out/trailer/stage3-draft-*.mp4): монтаж по долям, ~−14 LUFS,
//                                                     две версии — со звуком и без; карта долей и метки ↔ доли
//   node tools/showcase/cli.mjs guard [ref]           снимки игры «до» (ref, по умолчанию origin/main) и «после» (рабочая копия)
//   node tools/showcase/cli.mjs regress [ref]         регрессионный снимок боя и обе контрольные суммы: ref против рабочей копии
//
// Опции: --size 1280x720  --every 2 (каждый n-й кадр; 2 = черновик 30 кадр/с)  --range a-b  --only id,id
//        --no-verify (без выборочной сверки)  --out <папка>
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { execFileSync } from 'node:child_process';
import { startServer, REPO } from './lib/server.mjs';
import { openSession, warm } from './lib/session.mjs';
import { encode } from './lib/ffmpeg.mjs';
import { provenance } from './lib/provenance.mjs';
import { lockStatus, refreshFights, resolvePlan, readLock, analyze, journalHash } from './lib/fights.mjs';
import { encodeTimeline, encodeExcerpt, buildMarks, writeMarks, copyStills, layout, fmt } from './lib/assemble.mjs';
import { plans, excerpts, FPS, music, musicVariants } from './plan/trailer.plan.mjs';
import { musicTimes, buildMix, checkLoudness, muxVideo, writeBeatReports, buildContinuous, muxOnly } from './lib/audio.mjs';
import { findFfmpeg } from './lib/ffmpeg.mjs';
import { readFileSync as readFile } from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { values: o, positionals: [cmd = 'help', arg] } = parseArgs({
  allowPositionals: true,
  options: {
    range: { type: 'string' }, size: { type: 'string', default: '1280x720' }, every: { type: 'string', default: '2' },
    crf: { type: 'string' }, preset: { type: 'string' }, tag: { type: 'string' }, out: { type: 'string' }, only: { type: 'string' }, name: { type: 'string' }, video: { type: 'string' }, bamgain: { type: 'string' }, 'no-verify': { type: 'boolean', default: false }, reuse: { type: 'boolean', default: false },
  },
});
const size = o.size.split('x').map(Number);
const every = Number(o.every);
const outRoot = o.out || path.join(HERE, 'out');
const pick = (id) => { const p = plans.find((x) => x.id === id); if (!p) throw new Error('нет плана ' + id + '; есть: ' + plans.map((x) => x.id).join(', ')); return p; };
const SAMPLE = 10;   // выборочная сверка: каждый 10-й кадр плана

/** События для дорожки меток из журнала боя. */
function fightEvents(journal, plan) {
  if (!journal || !journal.length) return [];
  const a = analyze(journal); const ev = [];
  const off = plan.offset || 0;
  for (const h of a.hits) ev.push({ f: h.b - off, kind: 'fight', name: h.onHero ? `удар по герою (−${h.dmg} HP)` : `удар по врагу (−${h.dmg} HP)` });
  if (a.ko) ev.push({ f: a.ko.b - off, kind: 'fight', name: `выбывание бойца ${a.ko.unit}` });
  if (a.togOn >= 0) ev.push({ f: a.togOn - off, kind: 'legend', name: 'тумблер: ВЕДЁТ ЛЕГЕНДА включён' });
  for (const l of a.lines) ev.push({ f: l.b - off, kind: 'legend', name: `легенда: ${l.text}` });
  return ev;
}

async function renderPlan(base, planIn, dir, { ranges, every: ev = every, sz = size, capture = true, blurSpan = 0.5 * every } = {}) {   // blurSpan: ширина затвора в кадрах симуляции — по ВЫХОДНОЙ частоте, а не по шагу сверки
  const plan = resolvePlan(planIn);
  const t0 = Date.now();
  const s = await openSession({ base, plan, size: sz, log: () => {} });
  const { hashes, journal } = await s.run({
    outDir: dir, every: ev, capture, ranges, blurSpan, blur: !process.env.SHOWCASE_NOBLUR,
    onFrame: (f, n) => { if (f % 60 === 0) process.stdout.write(`  ${plan.id} кадр ${f}/${n}\r`); },
  });
  const net = s.net(); const marks = s.marks;
  await s.close();
  return { plan, hashes, journal, marks, net, events: fightEvents(journal, plan), sec: Math.round((Date.now() - t0) / 1000) };
}

/** Выборочная сверка: второй независимый рендер, снимаем только каждый SAMPLE-й кадр. */
async function verifySample(base, plan, first, { sz = size } = {}) {
  const dir = path.join(outRoot, '_verify', plan.id);
  const second = await renderPlan(base, plan, dir, { every: SAMPLE, sz });
  const fs = Object.keys(second.hashes);
  const bad = fs.filter((f) => first.hashes[f] !== undefined && first.hashes[f] !== second.hashes[f]);
  const compared = fs.filter((f) => first.hashes[f] !== undefined).length;
  if (bad.length === 0) rmSync(dir, { recursive: true, force: true });   // при расхождении снимки второго рендера остаются для разбора
  return { compared, mismatched: bad.length, firstBad: bad[0] ?? null, net: second.net };
}

const sumNet = (list) => list.reduce((a, n) => ({
  blocked: a.blocked + n.blockedTotal, analytics: a.analytics + n.analyticsBlocked, ws: a.ws + n.websocketsBlocked, sent: a.sent + n.sentOutside,
  hosts: { ...a.hosts, ...Object.fromEntries(Object.entries(n.blockedByHost).map(([h, c]) => [h, (a.hosts[h] || 0) + c])) },
}), { blocked: 0, analytics: 0, ws: 0, sent: 0, hosts: {} });

// ───────────────────────── контрольные снимки игры ─────────────────────────
const GUARD_SCENES = [
  ['home', { route: '/play/home', align: 150, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }, { callsign: 'CINDER', core: 'skala' }, { callsign: 'ASH', core: 'zasada' }] } }],
  ['gate', { route: '/play/gate', align: 150, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }, { callsign: 'CINDER', core: 'skala' }, { callsign: 'ASH', core: 'zasada' }] } }],
  ['forge', { route: '/play/pve', align: 150, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }, { callsign: 'CINDER', core: 'skala' }, { callsign: 'ASH', core: 'zasada' }] } }],
  // БОЙ: дуэль с зажатыми зёрнами; снимок на 300-м кадре боя
  ['arena-bout', { kind: 'arena', route: '/play/arena', seedBuild: 7, fightSeed: 9007, offset: 0, len: 300, world: { roster: [{ callsign: 'HAWK', core: 'natisk', lit: { a: [1, 2, 3] } }], squad: [0], mode: 'duel', n: 1 } }],
];
const GUARD_LAYOUTS = [[390, 844], [844, 390], [1280, 720], [1920, 1080]];
async function shootAll(root, port) {
  const s = await startServer({ root, port });
  const hashes = {}; const bufs = {};
  try {
    await warm(s.base, GUARD_SCENES.map((x) => x[1]), [1280, 720]);
    for (const [id, pl] of GUARD_SCENES) for (const lay of GUARD_LAYOUTS) {
      const sess = await openSession({ base: s.base, plan: pl, size: lay, log: () => {} });
      if (pl.kind === 'arena') await sess.run({ capture: false, frames: 300 }); else await sess.pump(30);
      const png = await sess.snapshot();
      bufs[`${id}@${lay.join('x')}`] = png;
      hashes[`${id}@${lay.join('x')}`] = createHash('md5').update(png).digest('hex').slice(0, 12);
      await sess.close();
      process.stdout.write(`  ${id}@${lay.join('x')}\r`);
    }
  } finally { await s.stop(); }
  return { hashes, bufs };
}
function refWorktree(ref) {
  const wt = path.join(HERE, '.cache/ref-worktree');
  rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['-C', REPO, 'worktree', 'prune']);
  execFileSync('git', ['-C', REPO, 'worktree', 'add', '--detach', wt, ref], { stdio: 'ignore' });
  symlinkSync(path.join(REPO, 'node_modules'), path.join(wt, 'node_modules'));
  return wt;
}
function dropWorktree(wt) {
  rmSync(path.join(wt, 'node_modules'), { force: true });
  execFileSync('git', ['-C', REPO, 'worktree', 'remove', '--force', wt], { stdio: 'ignore' });
}
const sha = (root) => execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();

// Побайтное сравнение снимков + разбор расхождения. Программный рендерер песочницы (SwiftShader)
// изредка (≈1 из 6 прогонов одного и того же кода) даёт единичные пиксели на 1–2 уровня яркости;
// поэтому для расхождений считаем: сколько пикселей и на сколько отличаются. «Совпало в допуске»
// — не более GUARD_TOL.levels уровней яркости на канал И не более GUARD_TOL.share доли пикселей кадра;
// больше — это расхождение, а не шум. Допуск зафиксирован решением владельца (01.10.2026) и действует
// ТОЛЬКО для снимков игры «до/после»: повторяемость кадров ролика и контрольные суммы боя — строго побайтно.
const GUARD_TOL = { levels: 2, share: 0.001 };
function pixelDiff(a, b) {
  const { PNG } = require('playwright-core/lib/utilsBundle');
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { pixels: Infinity, max: 255, share: 1 };
  let n = 0, mx = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    if (d) { n++; if (d > mx) mx = d; }
  }
  return { pixels: n, max: mx, share: n / (A.width * A.height) };
}

async function guard(ref) {
  const wt = refWorktree(ref);
  try {
    console.log('▶ эталон', ref, sha(wt));
    const A = await shootAll(wt, 5198);
    console.log('▶ рабочая копия', sha(REPO));
    const B = await shootAll(REPO, 5199);
    const keys = Object.keys(A.hashes); let exact = 0, noise = 0, bad = 0;
    for (const k of keys) {
      if (A.hashes[k] === B.hashes[k]) { exact++; console.log(`  ✓ ${k}  ${A.hashes[k]} ${B.hashes[k]}`); continue; }
      const d = pixelDiff(A.bufs[k], B.bufs[k]);
      const tol = d.share <= GUARD_TOL.share && d.max <= GUARD_TOL.levels;
      if (tol) noise++; else bad++;
      console.log(`  ${tol ? '≈' : '✗'} ${k}  ${A.hashes[k]} ${B.hashes[k]}  пикселей ${d.pixels} (${(d.share * 100).toFixed(3)} %), макс. разница ${d.max} из 255`);
    }
    console.log(`побайтно совпало ${exact} из ${keys.length}; в допуске (≤0,1 % пикселей и ≤2 уровней на канал) ещё ${noise}; настоящих расхождений ${bad}`);
    process.exitCode = bad ? 1 : 0;
  } finally { dropWorktree(wt); }
}

// ───────────────────────── регрессия боя ─────────────────────────
function runRegress(root, script) {
  const out = execFileSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'], timeout: 1_800_000 });
  const line = out.split('\n').find((l) => /checksum/i.test(l)) || '';
  const n = out.split('\n').filter((l) => l.trim()).length;
  return { checksum: line.trim(), lines: n, out };
}
async function regress(ref) {
  const wt = refWorktree(ref);
  try {
    const res = [];
    for (const script of ['fight-regression.mjs', 'fight-regression-builds.mjs']) {
      console.log(`▶ ${script}`);
      const a = runRegress(wt, script); console.log(`  ${ref} ${sha(wt)}: ${a.checksum}  (строк ${a.lines})`);
      const b = runRegress(REPO, script); console.log(`  рабочая копия ${sha(REPO)}: ${b.checksum}  (строк ${b.lines})`);
      const same = a.out === b.out;
      console.log(`  ${same ? '✓ вывод совпал построчно' : '✗ РАЗОШЛОСЬ'}`);
      res.push({ script, ref: a.checksum, work: b.checksum, same });
    }
    process.exitCode = res.every((r) => r.same) ? 0 : 1;
    return res;
  } finally { dropWorktree(wt); }
}

// ───────────────────────── команды ─────────────────────────
const needsServer = !['guard', 'regress', 'help'].includes(cmd);
const srv = needsServer ? await startServer() : { base: '', stop: async () => {} };
try {
  if (cmd === 'fights') {
    const which = arg ? [arg] : ['duel', 'squad'];
    const lock = await refreshFights(srv.base, which);
    console.log('✓ замок записан:', path.relative(REPO, path.join(HERE, 'plan/fights.lock.json')), JSON.stringify(Object.fromEntries(Object.entries(lock.fights).map(([k, v]) => [k, { seed: v.seedBuild, tried: v.tried, offset: v.offset }]))));
  } else if (cmd === 'plan') {
    const plan = pick(arg);
    const dir = path.join(outRoot, plan.id, 'frames');
    const [a, b] = o.range ? o.range.split('-').map(Number) : [0, plan.len];
    await warm(srv.base, [resolvePlan(plan)], size);
    const r = await renderPlan(srv.base, plan, dir, { ranges: o.range ? [[a, b]] : undefined });
    const out = path.join(outRoot, plan.id, `${plan.id}.mp4`);
    if (!o.range) encode({ frames: path.join(dir, '%05d.png'), out, fps: FPS / every });
    console.log(`  ${plan.id}: ${r.sec} с, сеть: заблокировано ${r.net.blockedTotal}, аналитика ${r.net.analyticsBlocked}, ушло ${r.net.sentOutside}  → ${out}`);
  } else if (cmd === 'verify') {
    const plan = pick(arg);
    const h = [];
    for (const tag of ['run-a', 'run-b']) h.push((await renderPlan(srv.base, plan, path.join(outRoot, plan.id, tag), { every: 1 })).hashes);
    const keys = Object.keys(h[0]); const bad = keys.filter((k) => h[0][k] !== h[1][k]);
    console.log(bad.length === 0 ? `✓ ${keys.length} кадров совпали побайтно` : `✗ расхождений: ${bad.length} из ${keys.length}, первый кадр ${bad[0]}`);
    process.exitCode = bad.length ? 1 : 0;
  } else if (cmd === 'build') {
    const t0 = Date.now();
    const prov = provenance();
    console.log(`▶ main ${prov.main?.slice(0, 8)} «${prov.mainSubject}» · ветка ${prov.head.slice(0, 8)} · снят с main ${prov.mergeBase?.slice(0, 8)}, правок игры относительно него: ${prov.gameFilesChangedVsMergeBase} (origin/main впереди: ${prov.behindMain} коммитов) · цифры боя ${prov.combatFingerprint}`);
    // одна команда: цифры боя изменились → бои пересобираются от нового журнала, зёрна подбираются заново
    const ls = lockStatus();
    if (!ls.fresh) { console.log(`⚠ ${ls.why} — подбираю бои заново`); await refreshFights(srv.base); }
    const lock = readLock();
    const only = o.only ? o.only.split(',') : null;
    const list = plans.filter((p) => !only || only.includes(p.id));
    await warm(srv.base, list.filter((p) => p.kind !== 'logo' && p.kind !== 'title').map((p) => resolvePlan(p)), size);
    const results = {}; const verify = {}; const nets = [];
    for (const plan of list) {
      const dir = path.join(outRoot, plan.id, 'frames');
      const r = await renderPlan(srv.base, plan, dir, {});
      results[plan.id] = r; nets.push(r.net);
      console.log(`  ✓ ${plan.id}: ${r.sec} с, кадров снято ${Object.keys(r.hashes).length}, сеть: заблокировано ${r.net.blockedTotal}, ушло ${r.net.sentOutside}`);
      // бой, снятый в ролик, — тот же, что подобран (подбор идёт в малом размере окна): хэш журнала снятого боя против замка
      if (plan.kind === 'arena') {
        const rp = resolvePlan(plan), want = lock.fights[plan.fight]?.journalHash, got = journalHash(r.journal, rp.offset + plan.len);
        console.log(`    бой «${plan.fight}»: журнал ${got} ${got === want ? '= замку ✓' : `≠ замок ${want} ✗ (бой в кадре не тот, что подобран)`}`);
        if (got !== want) process.exitCode = 1;
      }
      if (!o['no-verify']) {
        const v = await verifySample(srv.base, plan, r);
        nets.push(v.net); verify[plan.id] = { compared: v.compared, mismatched: v.mismatched, firstBad: v.firstBad };
        console.log(`    сверка (каждый ${SAMPLE}-й кадр, второй рендер): ${v.compared} кадров, расхождений ${v.mismatched}${v.firstBad !== null ? ", первый кадр " + v.firstBad : ""}`);
        if (v.mismatched) process.exitCode = 1;
      }
    }
    // шкала
    const dir = path.join(outRoot, 'trailer'); mkdirSync(dir, { recursive: true });
    if (!only) {
      const mp4 = path.join(dir, `stage3-draft-${size[1]}p${FPS / every}.mp4`);
      encodeTimeline({ root: outRoot, every, out: mp4, size, crf: Number(o.crf || 16), preset: o.preset || 'medium' });
      // 60 кадр/с сняты → веб-версия 30 кадр/с собирается из тех же кадров (каждый кадр = среднее двух соседних, как затвор 180° при 30)
      if (every === 1) encodeTimeline({ root: outRoot, every, out: path.join(dir, `stage3-draft-${size[1]}p30.mp4`), size, crf: Number(o.crf || 18), preset: o.preset || 'medium', blend30: true });
      writeMarks(dir, buildMarks({ results }));
      const stills = copyStills({ root: outRoot, every, dir: path.join(dir, 'stills') });
      writeFileSync(path.join(dir, 'stills.json'), JSON.stringify(stills, null, 1));
      console.log('  → ', mp4);
    }
    const net = sumNet(nets);
    const info = { provenance: prov, lock: { fingerprint: lock.combat.fingerprint, fights: Object.fromEntries(Object.entries(lock.fights).map(([k, v]) => [k, { seedBuild: v.seedBuild, fightSeed: v.fightSeed, offset: v.offset, tried: v.tried, cores: v.cores }])) },
      size, every, timeline: layout().parts.map((p) => ({ id: p.id, start: p.start, len: p.len })), seconds: Math.round((Date.now() - t0) / 1000) };
    writeFileSync(path.join(dir, 'build-info.json'), JSON.stringify(info, null, 1));
    writeFileSync(path.join(dir, 'net-report.json'), JSON.stringify({ total: net, perPlan: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.net])) }, null, 1));
    writeFileSync(path.join(dir, 'verify-report.json'), JSON.stringify(verify, null, 1));
    console.log(`✓ готово за ${info.seconds} с. Сеть за весь прогон: заблокировано ${net.blocked} запросов (из них аналитика ${net.analytics}), WebSocket ${net.ws}, УШЛО НАРУЖУ: ${net.sent}`);
  } else if (cmd === 'excerpts') {
    // каждый план рендерится один раз, снимаются только нужные куски всех отрывков
    const sz = o.size === '1280x720' ? [1920, 1080] : size; const root = path.join(outRoot, 'excerpts');
    const need = {};
    for (const ex of excerpts) for (const p of ex.parts) if (p.plan) (need[p.plan] ||= []).push([p.from, p.to]);
    if (!o.reuse) await warm(srv.base, Object.keys(need).map((id) => resolvePlan(pick(id))).filter((p) => p.kind !== 'logo' && p.kind !== 'title'), sz);
    for (const [id, ranges] of o.reuse ? [] : Object.entries(need)) {   // --reuse: кадры уже сняты, только собрать видео
      const r = await renderPlan(srv.base, pick(id), path.join(root, id, 'frames'), { ranges, sz });
      console.log(`  ✓ ${id}: ${r.sec} с, кадров ${Object.keys(r.hashes).length}, сеть: ушло ${r.net.sentOutside}`);
    }
    for (const ex of excerpts) {
      const out = path.join(root, `${ex.id}-${sz[1]}p${FPS / every}.mp4`);
      encodeExcerpt({ root, every, size: sz, parts: ex.parts, out });
      console.log('  →', out);
    }
  } else if (cmd === 'music') {
    // звук под готовую шкалу: по умолчанию вариант B (выбор владельца) — сплошной кусок трека БЕЗ склейки, BAM на входе коды 74,41 с трека.
    // Вариант A (со склейкой) оставлен в истории и доступен как --variant A, в выходе его нет.
    const dir = path.join(outRoot, 'trailer'); const name = o.name || 'v1-final'; const vid = (o.variant || 'B').toUpperCase();
    const video = o.video || path.join(dir, `stage3-draft-${size[1]}p${FPS / every}.mp4`);
    const ffm = findFfmpeg(); const { parts, total } = layout();
    const t = musicTimes(parts, total, music);
    const mp3 = path.join(HERE, music.file);
    const beatmap = JSON.parse(readFile(path.join(HERE, 'audio/beatmap.json'), 'utf8'));
    const marks = JSON.parse(readFile(path.join(dir, 'marks.json'), 'utf8'));
    const wav = path.join(dir, `${name}-mix.wav`);
    const v = musicVariants[vid]; let m0 = null, mix;
    if (v.kind === 'splice') {
      console.log(`▶ музыка (вариант A, со склейкой): задержка ${t.d.toFixed(3)} с · обрыв ${t.tCut.toFixed(3)} с · вход на BAM ${t.tBam.toFixed(3)} с`);
      mix = buildMix({ ffmpeg: ffm, mp3, t, music, outWav: wav });
    } else {
      m0 = v.trackAtBam - t.tBam;
      console.log(`▶ музыка (вариант ${vid}, сплошной кусок): трек ${m0.toFixed(3)}–${(m0 + t.dur).toFixed(3)} с · BAM ${t.tBam.toFixed(3)} с ролика ↔ ${v.trackAtBam.toFixed(2)} с трека`);
      mix = buildContinuous({ ffmpeg: ffm, mp3, m0, dur: t.dur, music, boost: v.boost ? { ...v.boost, at: t.tBam } : null, outWav: wav });
    }
    const chk = checkLoudness({ ffmpeg: ffm, wav });
    const tag = o.tag || `${size[1]}p${FPS / every}`;
    const outSound = path.join(dir, `${name}-music-draft-${tag}.mp4`), outSilent = path.join(dir, `${name}-silent-draft-${tag}.mp4`);
    muxVideo({ ffmpeg: ffm, video, wav, outSound, outSilent, bitrate: music.bitrate, dur: t.dur });
    const rep = writeBeatReports({ dir, beatmap, t, marks, music, m0 });
    writeFileSync(path.join(dir, 'music-info.json'), JSON.stringify({ variant: vid, times: t, loudness: { measuredBeforeNorm: mix.measured, check: chk, target: { I: music.lufs, TP: music.tp } }, ...rep.info }, null, 1));
    console.log('  громкость готового звука:', JSON.stringify(chk));
    console.log('  →', outSound, '\n  →', outSilent);
  } else if (cmd === 'music-variants') {
    // три варианта музыки на ОДНОМ видео (без пересъёмки): --video <тихое видео> --out <папка>
    const dir = o.out || path.join(outRoot, 'trailer'); mkdirSync(dir, { recursive: true });
    const video = o.video; if (!video) throw new Error('нужно --video <mp4 без звука>');
    const ffm = findFfmpeg(); const { parts, total } = layout();
    const t = musicTimes(parts, total, music); const mp3 = path.join(HERE, music.file);
    const report = {};
    for (const [id, v] of Object.entries(musicVariants)) {
      const wav = path.join(dir, `variant-${id}.wav`); const outMp4 = path.join(dir, `v1-step3-music-${id}-720p30.mp4`);
      let desc;
      if (v.kind === 'splice') {
        buildMix({ ffmpeg: ffm, mp3, t, music, outWav: wav });
        desc = `куски трека 0:00,0–${t.aEnd.toFixed(2)} (в ролике с ${t.d.toFixed(2)} с) и ${t.bStart.toFixed(2)}–${(t.bStart + t.bLen).toFixed(2)}; склейка на ${t.tCut.toFixed(2)} с ролика; BAM (${t.tBam.toFixed(2)} с) — на вход коды 74,41 с трека`;
      } else {
        const m0 = v.trackAtBam - t.tBam;
        if (m0 < 0) throw new Error('m0 < 0');
        buildContinuous({ ffmpeg: ffm, mp3, m0, dur: t.dur, music, boost: v.boost ? { ...v.boost, at: t.tBam } : null, outWav: wav });
        desc = `сплошной кусок трека ${m0.toFixed(2)}–${(m0 + t.dur).toFixed(2)} с (видео t ↔ трек t + ${m0.toFixed(2)}); BAM (${t.tBam.toFixed(2)} с) — на ${v.trackAtBam.toFixed(2)} с трека`;
      }
      const chk = checkLoudness({ ffmpeg: ffm, wav });
      muxOnly({ ffmpeg: ffm, video, wav, out: outMp4, bitrate: music.bitrate, dur: t.dur });
      report[id] = { title: v.title, file: path.basename(outMp4), desc, loudness: chk };
      console.log(`  ${id}: ${desc}\n     громкость ${JSON.stringify(chk)}`);
    }
    writeFileSync(path.join(dir, 'music-variants.json'), JSON.stringify(report, null, 1));
  } else if (cmd === 'guard') {
    await guard(arg || 'origin/main');
  } else if (cmd === 'regress') {
    await regress(arg || 'origin/main');
  } else {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 17).join('\n'));
  }
} finally { await srv.stop(); }
