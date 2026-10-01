// Подбор боёв ролика.
//
// Бои ролика — НАСТОЯЩИЕ бои движка игры. Мы ничего не подгоняем под нужный удар:
// прогоняем ряд настоящих боёв с разными зёрнами случайности (зерно определяет состав
// врагов, ядро противника и все броски боя), читаем журнал событий (кто кого ударил,
// когда легенда нажала клич или бафф) и берём ПЕРВОЕ зерно, при котором окно ролика
// содержит то, что сцена обещает. Числа боя, пороги легенды, HP и состав не трогаем.
//
// Результат — plan/fights.lock.json. Он привязан к «отпечатку цифр боя»
// (lib/provenance.mjs): если бой в игре изменился, отпечаток не совпадёт, и `build`
// сам подбирает зёрна заново — одной командой.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openSession } from './session.mjs';
import { combatFingerprint } from './provenance.mjs';
import { plans } from '../plan/trailer.plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LOCK = path.join(HERE, '../plan/fights.lock.json');
const SEARCH_SIZE = [480, 270];   // подбор идёт без снимков и в малом размере — быстрее в разы
const PARALLEL = 3;
const MAX_SEEDS = 60;
const SQUAD_POOL = 20;   // сначала 1–9; если ничего не подошло — дальше до 20 (правка владельца этапа 3: зерно 8 исключено)
const SQUAD_EXCLUDE = new Set([8]);   // SQUAD: смотрим ровно 9 зёрен и берём то, где легенда действует РАНЬШЕ всех (бой короче — рендер быстрее)

export const readLock = () => (existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : null);
export const writeLock = (l) => writeFileSync(LOCK, JSON.stringify(l, null, 1) + '\n');

/** Нужен ли новый подбор: замка нет, или бой в игре изменился. */
export function lockStatus() {
  const l = readLock();
  if (!l) return { fresh: false, why: 'нет plan/fights.lock.json' };
  const fp = combatFingerprint();
  if (l.combat?.fingerprint !== fp) return { fresh: false, why: `цифры боя изменились (${l.combat?.fingerprint} → ${fp})` };
  return { fresh: true, lock: l };
}

/** Подставляет в план зёрна и окно из замка. */
export function resolvePlan(plan, lock = readLock()) {
  if (plan.kind !== 'arena') return plan;
  const f = lock?.fights?.[plan.fight];
  if (!f) throw new Error(`для плана ${plan.id} нет подобранного боя — запустите: node tools/showcase/cli.mjs fights`);
  return { ...plan, seedBuild: f.seedBuild, fightSeed: f.fightSeed, offset: f.offset };
}

// ───────────────────────── разбор журнала ─────────────────────────
export function analyze(journal) {
  const first = journal[0];
  const hero = first.side.indexOf('player');
  const hits = []; let ko = null;
  for (let i = 1; i < journal.length; i++) {
    const a = journal[i - 1], b = journal[i];
    for (let u = 0; u < b.hp.length; u++) {
      const d = a.hp[u] - b.hp[u];
      if (d > 0.01) hits.push({ b: i, unit: u, onHero: b.side[u] === first.side[hero], dmg: +d.toFixed(2) });
      if (ko === null && b.dead[u] && !a.dead[u]) ko = { b: i, unit: u };
    }
  }
  // строки решений легенды: момент, когда появилась новая непустая строка
  const lines = []; let prev = '';
  for (let i = 0; i < journal.length; i++) {
    const t = journal[i].line;
    if (t && t !== prev) lines.push({ b: i, text: t });
    prev = t;
  }
  const togOn = journal.findIndex((r) => /legend\s*leads/i.test(r.tog));
  // одна из сторон выбыла целиком
  let wipe = null;
  const sides = [...new Set(first.side)];
  for (let i = 0; i < journal.length && wipe === null; i++) {
    for (const s of sides) { const idx = first.side.map((x, k) => (x === s ? k : -1)).filter((k) => k >= 0); if (idx.every((k) => journal[i].dead[k])) { wipe = i; break; } }
  }
  return { hero, hits, ko, lines, togOn, wipe, cores: first.core, sides: first.side };
}

const journalHash = (journal, n) => createHash('md5').update(JSON.stringify(journal.slice(0, n))).digest('hex').slice(0, 12);

// ───────────────────────── критерии ─────────────────────────
// DUEL: за окно ролика (10 с) герой наносит ≥2 удара, по герою проходит ≥1, бой не кончился.
const duelCheck = (a, plan) => {
  const w = plan.win ?? plan.len;   // окно, в котором ждём удары; хвост перехода (plan.len - win) бой тоже должен идти
  const heroHits = a.hits.filter((h) => h.onHero && h.b < w).length;
  const foeHits = a.hits.filter((h) => !h.onHero && h.b < w).length;
  const alive = a.ko === null || a.ko.b > plan.len + 30;
  const ok = foeHits >= 2 && heroHits >= 1 && alive;
  return { ok, heroHits, foeHits, ko: a.ko?.b ?? null, offset: 0, score: foeHits + heroHits };
};
// SQUAD с легендой: тумблер включён; в окне плана легенда сама действует ЯВНОЙ командой
// (натиск PUSH, ведро BUCKET или кубик DICE) — не меньше двух строк решений, и ни на одном
// кадре плана на экране нет строки со словом TOWEL (полотенце читается как «сдаюсь», 29.09 → правка
// владельца этапа 3). Окно начинается за 2 с до первой ЯВНОЙ команды, перед ним — голова
// перехода (plan.head), после него — хвост (plan.tail); бой идёт весь план.
const LEAD_IN = 120;
const ACTIVE = /\b(PUSH|BUCKET|DICE)\b/i;
const verbOf = (t) => (t.split('·')[1] || '').split('→')[0].trim();
const squadCheck = (a, plan, journal) => {
  if (a.togOn < 0 || a.lines.length === 0) return { ok: false, lines: a.lines.length, togOn: a.togOn, offset: null };
  const act = a.lines.find((l) => ACTIVE.test(verbOf(l.text)));
  if (!act) return { ok: false, lines: a.lines.length, noActive: true, first: a.lines[0].text, offset: null };
  const offset = Math.max(0, act.b - LEAD_IN - (plan.head || 0));
  const span = journal.slice(offset, offset + plan.len);
  const seen = []; let prev = '';
  span.forEach((r, i) => { if (r.line && r.line !== prev) seen.push({ b: offset + i, text: r.line }); prev = r.line; });
  const towel = span.some((r) => /TOWEL/i.test(r.line));
  const inWin = a.lines.filter((l) => l.b >= offset && l.b < offset + plan.len);
  const alive = a.wipe === null || a.wipe > offset + plan.len;
  const full = journal.length >= offset + plan.len;
  return { ok: !towel && inWin.length >= 2 && alive && full, towel, lines: a.lines.length, inWindow: inWin.length, offset, wipe: a.wipe, firstActive: act.text, shown: seen.map((x) => x.text) };
};

async function simulate(base, plan, seed, frames, stopWhen) {
  const p = { ...plan, kind: 'arena', seedBuild: seed, fightSeed: 9000 + seed, offset: 0, camera: undefined, actions: plan.actions, hide: [] };
  const s = await openSession({ base, plan: p, size: SEARCH_SIZE, log: () => {} });
  try {
    const { journal } = await s.run({ capture: false, frames, stopWhen });
    return { journal, marks: s.marks };
  } finally { await s.close(); }
}

/**
 * Подбор для одного боя. Идёт по зёрнам 1, 2, 3… пачками, берёт первое, прошедшее критерий.
 * @returns {object} запись для замка (включая таблицу всех прогнанных зёрен)
 */
export async function searchFight(base, kind, log = console.log) {
  const plan = plans.find((p) => p.fight === kind);
  const check = kind === 'duel' ? duelCheck : squadCheck;
  // Сколько кадров считать: duel — окно ролика; squad — до двух строк легенды после первой + окно.
  const stopWhen = kind === 'duel'
    ? (row, b) => b >= plan.len + 40
    : (row, b, j) => {
      const a = (b % 30 === 0) ? analyze(j) : null;
      if (!a) return false;
      if (a.wipe !== null) return true;
      const act = a.lines.find((l) => ACTIVE.test(verbOf(l.text)));
      if (act && b >= act.b - LEAD_IN - (plan.head || 0) + plan.len + 10) return true;
      return b >= 3200;
    };
  const frames = kind === 'duel' ? plan.len + 60 : 3200;
  const table = []; let chosen = null;
  const pool = kind === 'squad' ? SQUAD_POOL : MAX_SEEDS;
  for (let start = 1; start <= pool && (kind === 'duel' ? !chosen : !(chosen && start > 9)); start += PARALLEL) {
    const batch = Array.from({ length: PARALLEL }, (_, i) => start + i);
    const res = await Promise.all(batch.map((seed) => simulate(base, plan, seed, frames, stopWhen).then((r) => ({ seed, r }))));
    for (const { seed, r } of res) {
      const a = analyze(r.journal);
      const c = (kind === 'squad' && SQUAD_EXCLUDE.has(seed)) ? { ok: false, excluded: true, offset: null } : check(a, plan, r.journal);
      const row = { seed, ok: c.ok, ...c, cores: a.cores.join('/'), frames: r.journal.length };
      table.push(row);
      log(`  ${kind} зерно ${String(seed).padStart(2)}: ${c.ok ? 'ПОДХОДИТ' : 'нет'}  ${JSON.stringify({ ...c, ok: undefined })}  ядра ${row.cores}`);
      if (c.ok && (!chosen || (kind === 'squad' && c.offset < chosen.c.offset))) chosen = { seed, c, a, journal: r.journal };
    }
  }
  if (!chosen) throw new Error(`${kind}: за ${table.length} зёрен не нашлось подходящего боя`);
  const offset = chosen.c.offset ?? 0;
  return {
    seedBuild: chosen.seed, fightSeed: 9000 + chosen.seed, offset,
    tried: table.length, chosenIndex: table.findIndex((t) => t.seed === chosen.seed) + 1,
    rule: kind === 'duel'
      ? 'первое зерно, при котором за окно ролика герой наносит ≥2 удара, по герою проходит ≥1 и бой не кончается'
      : `из ${SQUAD_POOL} прогнанных зёрен — то, где при включённом «ВЕДЁТ ЛЕГЕНДА» легенда сама действует ≥2 раз за окно ролика (окно начинается за 2 с до первого её действия, бой идёт всё окно) и делает это РАНЬШЕ всех остальных подходящих`,
    cores: chosen.a.cores, stats: chosen.c,
    lines: chosen.a.lines.slice(0, 8), windowLines: chosen.c.shown || null,
    journalHash: journalHash(chosen.journal, offset + plan.len),
    table,
  };
}

export async function refreshFights(base, which = ['duel', 'squad'], log = console.log) {
  const prev = readLock();
  const fp = combatFingerprint();
  const lock = { combat: { fingerprint: fp }, generated: new Date().toISOString(), fights: prev && prev.combat?.fingerprint === fp ? { ...prev.fights } : {} };
  for (const k of which) { log(`▶ подбор боя «${k}»`); lock.fights[k] = await searchFight(base, k, log); }
  writeLock(lock);
  return lock;
}
