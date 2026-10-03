import fs from 'node:fs';
const TAG=process.argv[2]||'g2';
const j=JSON.parse(fs.readFileSync(`docs/balance-fix/out/${TAG}-F6/builds.json`,'utf8'));
const N={natisk:'ONSLAUGHT',nalet:'RAIDER',skala:'BULWARK',zasada:'AMBUSH'};
const f=(x)=>(x>=0?'+':'')+x.toFixed(1);
for(const field of ['bare','bot']){
  console.log(`\n**против ${field==='bare'?'поля голых ядер':'ботов'}**\n`);
  console.log('| ядро | набор | голое ядро, % | сильнейшая сборка | её доля побед, % | max Δ | min Δ | сильнейшая выше среднего остальных | хуже голого |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for(const c of Object.keys(N)) for(const s of [1,801]){
    const e=j[`${field}|${c}|s${s}`]; const rows=e.rows.filter(r=>r.name!=='голое');
    const best=rows.reduce((a,b)=>b.delta>a.delta?b:a);
    console.log(`| ${N[c]} | ${s===1?'1 (зёрна 1–800)':'2 (зёрна 801–1600)'} | ${e.sum.base.toFixed(1)} | ${best.name} | ${best.wr.toFixed(1)} | ${f(e.sum.maxDelta)} | ${f(e.sum.minDelta)} | ${e.sum.bestMinusMean.toFixed(1)} | ${e.sum.worstSig.length?e.sum.worstSig.join(','):'нет'} |`);
  }
}
