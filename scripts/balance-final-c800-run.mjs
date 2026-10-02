import { spawn } from 'node:child_process';
const WT='/tmp/bf/wt-cr-final-C', OUT='/home/user/hexlash/docs/balance-fix/out/final-C800/';
const CORES=['natisk','nalet','skala','zasada'];
const cells=[['natisk','c',5],['zasada','b',3]];
const jobs=[];
for(const [from,to] of [[1,800],[801,1600]]){
  for(const c of new Set(cells.map(x=>x[0]))) jobs.push({kind:'zero',core:c,seedFrom:from,seedTo:to,foes:CORES,out:`${OUT}zero-${c}-${from}.json`});
  for(const [c,b,i] of cells) jobs.push({kind:'solo',core:c,branch:b,idx:i,amp:1,seedFrom:from,seedTo:to,foes:CORES,out:`${OUT}solo-${c}-${b}${i}-${from}.json`});
}
let next=0,run=0;
await new Promise(res=>{const go=()=>{while(run<4&&next<jobs.length){const j=jobs[next++];run++;const p=spawn('node',['scripts/crystal-remeasure-worker.mjs',JSON.stringify(j)],{cwd:WT,stdio:['ignore','ignore','inherit']});p.on('exit',()=>{run--;console.error(`done ${next-run}/${jobs.length}`);if(next>=jobs.length&&!run)res();else go();});}};go();});
