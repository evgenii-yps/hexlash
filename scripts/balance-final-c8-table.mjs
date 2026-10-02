import fs from 'node:fs';
const A=JSON.parse(fs.readFileSync('docs/balance-fix/out/final-B1/buffs.json','utf8')),B=JSON.parse(fs.readFileSync('docs/balance-fix/out/final-B2/buffs.json','utf8'));
const N={natisk:'ONSLAUGHT',nalet:'RAIDER',skala:'BULWARK',zasada:'AMBUSH'};
const f=x=>(x>=0?'+':'')+x.toFixed(1);
const L=['| ядро | набор | TOWEL | BUCKET | DICE (в среднем) | худшая грань | лучшая грань | все сразу | вразбивку | по правилу бота |','| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
const bad=[];
for(const c of Object.keys(N)) for(const [tag,S] of [['1 (зёрна 1–800)',A],['2 (зёрна 801–1600)',B]]){
  const g=n=>S[`${c}|${n}`].delta;
  const faces=[1,2,3,4,5,6].map(i=>g('dice#'+i));
  const w=Math.min(...faces),b=Math.max(...faces);
  const cell=(v,lo,hi,name)=>{const ok=v>=lo&&v<=hi; if(!ok)bad.push(`${N[c]} набор ${tag[0]}: ${name} ${f(v)} (цель ${lo}…${hi})`); return f(v)+(ok?'':' ❌');};
  L.push(`| ${N[c]} | ${tag} | ${cell(g('towel'),3,8,'TOWEL')} | ${cell(g('bucket'),3,8,'BUCKET')} | ${cell(g('dice'),3,8,'DICE')} | ${cell(w,0,15,'худшая грань')} | ${cell(b,0,15,'лучшая грань')} | ${cell(g('all-at-once'),-99,15,'все сразу')} | ${cell(g('spread'),-99,15,'вразбивку')} | ${cell(g('bot-rule'),-99,15,'по правилу бота')} |`);
}
console.log(L.join('\n')+'\n\nВне цели: '+(bad.length?bad.join('; '):'нет'));
// CI for spread
for(const c of Object.keys(N)) for(const [t,S] of [['1',A],['2',B]]){const e=S[`${c}|spread`]; if(e.delta>14) console.log(`  ${N[c]} вразбивку набор ${t}: ${f(e.delta)} [${f(e.ciLo)}…${f(e.ciHi)}]`);}
