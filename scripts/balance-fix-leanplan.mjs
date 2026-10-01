// balance-fix-leanplan.mjs — ПЛАН НАКЛОНОВ 60 КРИСТАЛЛОВ (TZ_balance_fix_v2, этап В): каждому кристаллу — наклон выбора намерения в смысле его текста,
// вес подбирается так, чтобы кристалл менял заметную долю решений (цель Ц4: ≥ 5%). Вес первого приближения считает лаборатория повтора; окончательный — по пересъёму.
// ЗАПУСК: node scripts/balance-fix-leanplan.mjs <тег записей решений> [--apply]   (без --apply только печатает таблицу весов)
//   запись: [ядро, ветвь+шаг, тег, намерение, условие, вершина?, целевая доля лаборатории %, вес-множитель (по умолчанию 1)]
import { openLab } from './balance-fix-replay-lab.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const P = 'press', ST = 'strike', SG = 'sting', H = 'hold', BR = 'break', C = 'catch';
export const PLAN = [
  // ── ONSLAUGHT: PRESS ведёт ≈ 99%; всё, что может перевесить, — STRIKE и HOLD вблизи. ───────────────────────────────────────────
  ['natisk', 'a2', 'guard_crush', ST, 'foeGuard'],         // RAM·2: проламывает поднятую защиту — рубит, когда враг закрылся
  ['natisk', 'a3', 'unshaken', H, 'foeSwing'],              // RAM·3: не сбить с замаха — стоит под ударом врага
  ['natisk', 'a4', 'close_damage_ramp', ST, 'close'],       // RAM·4: чем ближе, тем сильнее ломает
  ['natisk', 'a5', 'overload_strike', ST, 'foeHpLow', 1],   // RAM·5: вершина — добивает раненого
  ['natisk', 'b1', 'hard_entry', ST, 'always'],             // CHASE·1: резкий вход — входит с ударом
  ['natisk', 'b2', 'chase_strike', ST, 'foeQuiet'],         // CHASE·2: догоняет молчащего врага ударом
  ['natisk', 'b3', 'cut_off', H, 'close'],                  // CHASE·3: отрезает пути — держится вплотную
  ['natisk', 'b4', 'cling', H, 'foeGuard'],                 // CHASE·4: не стряхнуть — цепляется за закрывшегося врага
  ['natisk', 'b5', 'lockdown', H, 'close', 1],              // CHASE·5: вершина — прижал вплотную, держит
  ['natisk', 'c1', 'long_combo', ST, 'close'],              // FRENZY·1: длиннее серии
  ['natisk', 'c2', 'no_pause', ST, 'foeOpen'],              // FRENZY·2: короче паузы — бьёт в каждое открытие
  ['natisk', 'c3', 'hit_accel', ST, 'longFight'],           // FRENZY·3: разгон с длиной боя
  ['natisk', 'c4', 'no_breather', ST, 'foeQuiet'],          // FRENZY·4: не даёт перевести дух
  ['natisk', 'c5', 'rampage', ST, 'selfHpLow', 1],          // FRENZY·5: вершина — вразнос, когда прижали
  // ── RAIDER: ведёт STRIKE / STING / CATCH, всё близко. ──────────────────────────────────────────────────────────────────
  ['nalet', 'a1', 'quick_out', BR, 'close'],                // JAB·1: ударил — отскочил
  ['nalet', 'a2', 'pinpoint_entry', P, 'foeQuiet'],         // JAB·2: точный вход, пока враг молчит
  ['nalet', 'a4', 'clean_chain', SG, 'always'],             // JAB·4: чистый обмен ускоряет следующий укол
  ['nalet', 'a5', 'perfect_jab', SG, 'foeQuiet', 1],        // JAB·5: вершина — свободные тычки по пассивному
  ['nalet', 'b1', 'fake_in', BR, 'foeSwing'],               // FEINT·1: больше обманок — уходит с линии замаха
  ['nalet', 'b2', 'punish_reaction', P, 'foeGuard'],        // FEINT·2: клюнул на обманку — наказан
  ['nalet', 'b3', 'rhythm_break', BR, 'close'],             // FEINT·3: ломает ритм
  ['nalet', 'b4', 'feint_interrupt', SG, 'foeSwing'],       // FEINT·4: обманка сбивает замах врага
  ['nalet', 'b5', 'feint_combo', ST, 'close', 1],           // FEINT·5: вершина — обманка, окно, чистый удар
  ['nalet', 'c1', 'read_tell', C, 'foeSwing'],              // HUNT·1: изучает врага — выжидает
  ['nalet', 'c2', 'punish_exhausted', P, 'foeOpen'],        // HUNT·2: бьёт сильнее по открытому
  ['nalet', 'c3', 'charged_run', SG, 'always'],             // HUNT·3: копит заряд, кружа
  ['nalet', 'c4', 'hunt_reply', ST, 'foeSwing'],            // HUNT·4: чем напористее враг, тем больше платит
  ['nalet', 'c5', 'lethal_entry', P, 'foeHpLow', 1],        // HUNT·5: вершина — вход на добивание
  // ── BULWARK: CATCH ведёт ≈ 62%; перевесить могут HOLD и PRESS. ───────────────────────────────────────────────────────────
  ['skala', 'a1', 'tough_hide', H, 'close'],                // BASTION·1: крепче принимает удар
  ['skala', 'a2', 'steady_guard', H, 'foeSwing'],           // BASTION·2: ритм не сбить — стоит под замахом
  ['skala', 'a3', 'catch_breath', H, 'foeQuiet'],           // BASTION·3: переводит дух в затишье
  ['skala', 'a4', 'dig_in', H, 'close'],                    // BASTION·4: чем дольше держит землю, тем крепче
  ['skala', 'a5', 'fortress', H, 'always', 1],              // BASTION·5: вершина — несокрушим
  ['skala', 'b1', 'riposte', P, 'foeSwing'],                // BREAKER·1: после блока ответ кусается
  ['skala', 'b2', 'catch_punish', P, 'foeOpen'],            // BREAKER·2: поймал замах — наказал
  ['skala', 'b3', 'hard_meet', P, 'close'],                 // BREAKER·3: встречает жёстче
  ['skala', 'b4', 'retaliate_ramp', ST, 'hpDropped'],       // BREAKER·4: чем больше съел, тем жёстче ответ
  ['skala', 'b5', 'counter_trap', C, 'longFight', 1],       // BREAKER·5: вершина — стена, крепнущая с длиной боя
  ['skala', 'c1', 'body_shove', P, 'close'],                // VICE·1: давит корпусом
  ['skala', 'c2', 'heavy_slam', ST, 'close'],               // VICE·2: тяжёлый медленный удар
  ['skala', 'c3', 'no_way_around', H, 'foeGuard'],          // VICE·3: не даёт обойти
  ['skala', 'c4', 'pin', H, 'close'],                       // VICE·4: чем ближе, тем крепче хватка
  ['skala', 'c5', 'clinch', P, 'close', 1],                 // VICE·5: вершина — клинч
  // ── AMBUSH: CATCH ведёт ≈ 72%; перевесить могут STRIKE и STING — слабо, нужны большие веса. ───────────────────────────────────
  ['zasada', 'a1', 'hard_counter', ST, 'foeSwing'],         // TRAP·1: бьёт в ответ жёстче
  ['zasada', 'a2', 'slip_counter', ST, 'foeQuiet'],         // TRAP·2: ушёл с линии — мгновенный ответ
  ['zasada', 'a3', 'punish_aggression', ST, 'hpDropped'],   // TRAP·3: чем сильнее давят, тем жёстче ответ
  ['zasada', 'a4', 'punish_whiff', SG, 'foeQuiet'],         // TRAP·4: наказывает промах
  ['zasada', 'a5', 'perfect_trap', ST, 'foeQuiet', 1],      // TRAP·5: вершина — добивает переставшего сопротивляться
  ['zasada', 'b1', 'long_slip', SG, 'foeSwing'],            // SHADOW·1: уходит дальше — жалит с отходом
  ['zasada', 'b2', 'hard_to_reach', SG, 'longFight'],       // SHADOW·2: до него труднее достать
  ['zasada', 'b3', 'exhaust', SG, 'longFight'],             // SHADOW·3: изматывает с длиной боя
  ['zasada', 'b4', 'open_window', ST, 'foeOpen'],           // SHADOW·4: после ухода окно для своего входа
  ['zasada', 'b5', 'phantom', SG, 'hpDropped', 1],          // SHADOW·5: вершина — уходит из-под удара после попадания
  ['zasada', 'c1', 'loaded_hit', ST, 'charged'],            // STING·1: заряженный удар тяжелее
  ['zasada', 'c2', 'long_charge', SG, 'charged'],           // STING·2: ждёт дольше — бьёт сильнее
  ['zasada', 'c3', 'vulnerable_strike', ST, 'foeOpen'],     // STING·3: бьёт в уязвимый момент
  ['zasada', 'c4', 'pierce', ST, 'foeGuard'],               // STING·4: пробивает любую защиту
  ['zasada', 'c5', 'execute', ST, 'foeHpLow', 1],           // STING·5: вершина — казнь раненого
];

if (process.argv[1] && process.argv[1].endsWith('balance-fix-leanplan.mjs')) {
  const tag = process.argv[2]; const apply = process.argv.includes('--apply');
  const TARGET = Number((process.argv.find((a) => a.startsWith('--target=')) || '--target=14').split('=')[1]) / 100;
  const lab = await openLab(tag);
  const { chooseIntentionSpinal } = await lab.load('/src/data/intentions.js');
  const { startProfile, AXIS_IDS } = await lab.load('/src/data/behavior.js');
  const n01 = (a) => Object.fromEntries(AXIS_IDS.map((k) => [k, Math.max(0, Math.min(100, a[k])) / 100]));
  // условия — как в intentions.js (foeGuard — новое: враг блокирует/уклоняется)
  const conds = (r) => {
    const s = r.self, f = r.foe, m = r.memory, fi = r.fight;
    const foeThreat = m.some((e) => e.type === 'attack' && fi.t - e.t < 1.5); let last = -Infinity; for (const e of m) if (e.type === 'attack' && e.t > last) last = e.t;
    let peak = s.hp01; for (const h of s.hpHist || []) if (fi.t - h.t <= 6 && h.hp01 > peak) peak = h.hp01;
    return { always: true, close: f.has && f.inStrike, foeOpen: f.phase === 'recovery' || f.phase === 'stagger', foeSwing: foeThreat || f.phase === 'windup' || f.phase === 'commit', foeGuard: !!f.reacting, charged: s.charge01 >= 0.5, selfHpLow: s.hp01 < 0.5, foeHpLow: f.hp01 != null && f.hp01 < 0.4, longFight: fi.elapsed > 30, foeQuiet: (last === -Infinity ? fi.elapsed : fi.t - last) > 3, hpDropped: peak - s.hp01 >= 0.15 };
  };
  const rows = []; const out = {};
  for (const core of lab.CORES.map((c) => c.id)) {
    const recs = lab.snaps[core]; const bare = n01(startProfile(core));
    const base = recs.map((r) => ({ r, c: conds(r), act: chooseIntentionSpinal({ ...r.self, ax01: bare, leans: null, side: 'player' }, r.foe, r.memory, r.fight) }));
    const flip = (X, cnd, w) => { let ch = 0; for (const b of base) { if (!b.c[cnd]) continue; if (chooseIntentionSpinal({ ...b.r.self, ax01: bare, leans: [{ i: X, w, when: 'always' }], side: 'player' }, b.r.foe, b.r.memory, b.r.fight) !== b.act) ch++; } return ch / base.length; };
    for (const [c, id, tg, X, cnd, vtx] of PLAN.filter((p) => p[0] === core)) {
      const target = vtx ? TARGET * 1.3 : TARGET;
      let lo = 0.02, hi = 0.6, w = hi;
      if (flip(X, cnd, hi) < target) w = hi; // недостижимо — потолок
      else { for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (flip(X, cnd, mid) >= target) hi = mid; else lo = mid; } w = hi; }
      w = Math.round(w * 100) / 100;
      const got = flip(X, cnd, w);
      rows.push(`| ${core} | ${id} | ${tg} | ${X} | ${cnd}${vtx ? ' ★' : ''} | ${w.toFixed(2)} | ${(100 * got).toFixed(1)} |`);
      out[tg] = [X, cnd, !!vtx, w];
    }
  }
  console.log('| ядро | шаг | тег | намерение | условие | вес | оценка лаборатории, % |\n| --- | --- | --- | --- | --- | --- | --- |\n' + rows.join('\n'));
  writeFileSync(`/tmp/bf/leanplan-${tag}.json`, JSON.stringify(out, null, 1));
  await lab.close();
}
