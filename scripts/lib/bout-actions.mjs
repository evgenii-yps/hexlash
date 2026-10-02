// bout-actions.mjs — РЫЧАГИ ТРЕНЕРА В МГНОВЕННОМ БОЮ (клич и баффы), общие для регрессий и замеров баланса.
// Игровой код не трогает: зовёт те же методы бойца и читает те же числа (data/klichBalance.js, data/buffBalance.js), что services/klich.js и
// services/buffs.js. Если у клича/баффа поменяется механика в бойце, правится ТОЛЬКО это место — и обе регрессии (fight-regression-klich.mjs,
// fight-regression-buffs.mjs) получают новый эталон.
export function makeActions(H, mods) {
  const { INSTANT_DT, strike } = H;
  const { KLICH_BALANCE } = mods.klich;
  const { BUFF_BALANCE: B, rollDie } = mods.buff;

  /** Бросить клич на бойца (как services/klich.js). */
  const castKlich = (f, id) => {
    f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec);
    f.setKlichId(id);
  };

  /** Драйвер баффов одной стороны — те же вызовы бойца и числа, что services/buffs.js (applyBuff / buffTick / tickBot).
   *  rule: 'bot' (правило бота) | 'fixed' (kit[0] в момент fixedAt) | 'script' (plan:[{at,id}]). face — зафиксировать грань DICE; rollRng — генератор броска DICE (как dieRng в services/buffs.js), иначе общий Math.random. */
  function makeBuffDriver({ side = 'player', kit, rule = 'bot', fixedAt = 10, plan = null, face = null, rollRng = null }) {
    const items = [...kit]; let lastThrow = -1e9, eff = null, planIdx = 0;
    const log = []; const d = { log, healed: 0 };
    d.step = (now, alive) => {
      const me = alive.find((u) => u.sideId === side); const other = alive.find((u) => u !== me);
      if (eff && me) {
        const f = me.f;
        if (eff.id === 'towel') {
          d.healed += f.heal(eff.rate * INSTANT_DT);
          const st = f.isStaggered(); if (st && !eff.sh) { f.shortenStagger(B.towel.staggerRecoverMul); eff.sh = true; } if (!st && eff.sh) eff.sh = false;
        }
        if (eff.id === 'dice' && !strike.diceChargeOf(f)) eff = null;
        else if (eff && now >= eff.until) { if (eff.id === 'bucket') { f.setBuffPace(1); f.setBuffReact(false); } if (eff.id === 'dice') strike.clearDiceCharge(f); eff = null; }
      }
      if (!me || !other || eff || !items.length) return;
      const f = me.f;
      const hp01 = f.getHp() / f.maxHp, foeHp01 = other.f.getHp() / other.f.maxHp, gap = f.group.position.distanceTo(other.f.group.position);
      let pick = null;
      if (rule === 'bot') {
        if (now - lastThrow < B.bot.minGapSec) return;
        if (items.includes('towel') && hp01 < B.bot.towelHpBelow) pick = 'towel';
        else if (items.includes('bucket') && now >= B.bot.bucketAfterSec && gap < B.bot.bucketNearDist) pick = 'bucket';
        else if (items.includes('dice') && (foeHp01 < B.bot.diceFoeHpBelow || now >= B.bot.diceLateSec)) pick = 'dice';
      } else if (rule === 'fixed') { if (now >= fixedAt) pick = items[0]; }
      else if (rule === 'script') {
        while (planIdx < plan.length && !items.includes(plan[planIdx].id)) planIdx++;
        if (planIdx < plan.length && now >= plan[planIdx].at) { pick = plan[planIdx].id; planIdx++; }
      }
      if (!pick) return;
      items.splice(items.indexOf(pick), 1); lastThrow = now;
      const rec = { id: pick, t: Math.round(now * 100) / 100, hp01: Math.round(hp01 * 1000) / 1000 };
      if (pick === 'towel') { eff = { id: 'towel', until: now + B.towel.durationSec, rate: B.towel.healFracOfMax / B.towel.durationSec, sh: false }; if (f.isStaggered()) { f.shortenStagger(B.towel.staggerRecoverMul); eff.sh = true; } }
      else if (pick === 'bucket') { f.setBuffPace(B.bucket.paceMul); f.setBuffReact(true); eff = { id: 'bucket', until: now + B.bucket.durationSec }; }
      else { const fc = face || rollDie(rollRng || undefined); const row = B.dice.faces[fc]; strike.armDiceCharge(f, row.mul, row.hits); eff = { id: 'dice', until: Infinity }; rec.face = fc; }
      log.push(rec);
    };
    return d;
  }
  return { castKlich, makeBuffDriver };
}
