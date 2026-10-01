// Честное сравнение цвета «стенд ↔ экран владельца»: игра БЕЗ режиссёрской камеры, штатная камера, окно ≈ как у эталонов (2560×1300).
// Так различие камеры и кадрирования не примешивается: меряется то, что отдаёт сам рендерер.
//   node tools/showcase/color/refmatch.mjs [outDir]
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer } from '../lib/server.mjs';
import { openSession, warm } from '../lib/session.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(HERE, '../out/color');
mkdirSync(out, { recursive: true });
const SIZE = [2560, 1300];
const roster3 = [{ callsign: 'HAWK', core: 'natisk' }, { callsign: 'CINDER', core: 'skala' }, { callsign: 'ASH', core: 'zasada' }];
const SCENES = [
  ['island', { route: '/play/home', align: 150, world: { roster: roster3 } }],
  ['arena', { kind: 'arena', route: '/play/arena', seedBuild: 1, fightSeed: 9001, offset: 0, len: 200, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }], squad: [0], mode: 'duel', n: 1 } }],
  ['hall', { route: '/play/pve', align: 150, world: { roster: roster3 } }],
];
const s = await startServer({ port: 5197 });
try {
  await warm(s.base, SCENES.map((x) => x[1]), [1280, 720]);
  for (const [id, pl] of SCENES) {
    const sess = await openSession({ base: s.base, plan: pl, size: SIZE, log: () => {} });
    if (pl.kind === 'arena') await sess.run({ capture: false, frames: 200 }); else await sess.pump(30);
    writeFileSync(path.join(out, `rig-${id}-2560.png`), await sess.snapshot());
    await sess.close(); console.log('✓', id);
  }
} finally { await s.stop(); }
