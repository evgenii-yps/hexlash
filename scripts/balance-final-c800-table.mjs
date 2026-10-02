import fs from 'node:fs';
const D='docs/balance-fix/out/final-C800/';
const cells=[['natisk','c5','ONSLAUGHT WILL/5 Rampage'],['zasada','b3',"AMBUSH MIND/3 Run 'Em Ragged"]];
const L=[];
for(const [core,cell,nm] of cells){
  const row=[];
  for(const from of [1,801]){
    const z=JSON.parse(fs.readFileSync(`${D}zero-${core}-${from}.json`)).foes;
    const s=JSON.parse(fs.readFileSync(`${D}solo-${core}-${cell}-${from}.json`)).foes;
    const diff=[];
    for(const f of Object.keys(z)){const a=z[f].w,b=s[f].w;for(let i=0;i<a.length;i++)diff.push(b[i]-a[i]);}
    const n=diff.length,m=diff.reduce((p,x)=>p+x,0)/n,v=diff.reduce((p,x)=>p+(x-m)**2,0)/(n-1),se=Math.sqrt(v/n);
    row.push(`${m>=0?'+':''}${(100*m).toFixed(1)} [${(100*(m-1.96*se)).toFixed(1)}…${(100*(m+1.96*se)).toFixed(1)}]`);
  }
  L.push(`| ${nm} | ${row.join(' | ')} |`);
}
console.log('| кристалл в одиночку | набор 1 (зёрна 1–800), п.п. [95%] | набор 2 (зёрна 801–1600), п.п. [95%] |\n| --- | --- | --- |\n'+L.join('\n'));
