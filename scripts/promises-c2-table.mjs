import fs from 'node:fs';
const TAG=process.argv[2]||'g2';
const dir=`docs/balance-fix/out/${TAG}-F2/`;
const NAME={natisk:'ONSLAUGHT',nalet:'RAIDER',skala:'BULWARK',zasada:'AMBUSH'};
const BR={a:'BODY',b:'MIND',c:'WILL'};
const out=[];let ok=0,tot=0;
for(const c of Object.keys(NAME)){for(const b of ['a5','b5','c5']){
 const cell=[];let good=true;
 for(const s of [1,801]){
  const d=JSON.parse(fs.readFileSync(`${dir}raw-${c}-bare-s${s}.json`,'utf8')).builds;
  const w0=d['голое'].w,w1=d[b].w;const n=w0.length;
  const diff=w0.map((x,i)=>w1[i]-x);const m=diff.reduce((a,x)=>a+x,0)/n;
  const v=diff.reduce((a,x)=>a+(x-m)**2,0)/(n-1);const se=Math.sqrt(v/n);
  const dd=100*m,ci=196*se;cell.push({dd,ci,n});
  if(dd<15||dd>25)good=false;}
 tot++;if(good)ok++;
 out.push(`| ${NAME[c]} | ${BR[b[0]]} (${b}) | ${cell.map(x=>`${x.dd>=0?'+':''}${x.dd.toFixed(1)} [±${x.ci.toFixed(1)}]`).join(' | ')} | ${good?'да':'**НЕТ**'} |`);
}}
console.log('| ядро | грань | набор 1 (зёрна 1–800), п.п. | набор 2 (зёрна 801–1600), п.п. | в коридоре +15…+25 на обоих |\n| --- | --- | --- | --- | --- |\n'+out.join('\n')+`\n\nв коридоре: ${ok} из ${tot}`);
