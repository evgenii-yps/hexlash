// klich-reach-tags-run.mjs — драйвер «клич против наклонов кристаллов»: WT=/копия/с/tags-probe.patch node scripts/klich-reach-tags-run.mjs push:0.45,fallback:0.75,hold:0.3
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const WT = process.env.WT; if (!WT) throw new Error('задайте WT');
const REPO = new URL('..', import.meta.url).pathname;
const weights = Object.fromEntries((process.argv[2] || '').split(',').map((x) => x.split(':')).map(([k, v]) => [k, Number(v)]));
copyFileSync(join(REPO, 'scripts/klich-reach-tags-worker.mjs'), join(WT, 'scripts/klich-reach-tags-worker.mjs'));
mkdirSync(join(REPO, 'docs/klich-reach/out/raw'), { recursive: true });
await Promise.all(['natisk', 'nalet', 'skala', 'zasada'].map((core) => new Promise((res, rej) => {
  const spec = { core, weights, seedFrom: 1, seedTo: 200, out: join(REPO, `docs/klich-reach/out/raw/tags-${core}.json`) };
  const p = spawn('node', ['scripts/klich-reach-tags-worker.mjs', JSON.stringify(spec)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
  p.on('exit', (c) => (c ? rej(new Error(core + ' упала')) : res()));
})));
console.error('готово');
