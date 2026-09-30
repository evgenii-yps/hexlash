import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const ROOT = '/home/user/hexlash/src';
const seen = new Set();
const res = (from, spec) => {
  let p = spec.startsWith('@/') ? resolve(ROOT, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
  if (!p) return null;
  for (const c of [p, p + '.js', p + '.vue', p + '/index.js']) if (existsSync(c) && !c.endsWith('/')) { try { readFileSync(c); if (/\.(js|vue|mjs)$/.test(c)) return c; } catch {} }
  return null;
};
const walk = (f) => {
  if (seen.has(f)) return; seen.add(f);
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?:import|export)\s[^'"`]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g)) { const r = res(f, m[1] || m[2] || m[3]); if (r) walk(r); }
};
for (const e of process.argv.slice(2)) { seen.clear(); walk(resolve(ROOT, e)); const hit = [...seen].filter((x) => /combatBalance|data\/intentions/.test(x)); console.log(e, 'файлов в графе:', seen.size, '| intentions/combatBalance в графе:', hit.length ? hit.map((x) => x.replace(ROOT, 'src')).join(', ') : 'НЕТ'); }
