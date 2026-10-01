// balance-recon-assemble.mjs — склейка REPORT.md: берёт docs/balance-recon/REPORT.template.md и подставляет вместо строк вида
// <!--include:имя--> готовый раздел docs/balance-recon/out/имя.md. Ничего не считает. Запуск: node scripts/balance-recon-assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'balance-recon');
const tpl = fs.readFileSync(path.join(root, 'REPORT.template.md'), 'utf8');
const out = tpl.replace(/<!--include:([\w-]+)(?:#([^>]+?))?-->/g, (_, name, needle) => {
  const f = path.join(root, 'out', name + '.md');
  if (!fs.existsSync(f)) throw new Error('нет раздела ' + f);
  let text = fs.readFileSync(f, 'utf8');
  if (needle) {   // берём один раздел «## …needle…» до следующего «## »
    const parts = text.split(/^(?=## )/m);
    const hit = parts.find(x => x.startsWith('## ') && x.split('\n')[0].includes(needle));
    if (!hit) throw new Error('нет подраздела «' + needle + '» в ' + f);
    text = hit;
  }
  // заголовки подразделов опускаем на уровень, чтобы не ломать оглавление
  return text.replace(/^(#{2,5}) /gm, (m, h) => '#'.repeat(Math.min(h.length + 1, 6)) + ' ').trim();
});
fs.writeFileSync(path.join(root, 'REPORT.md'), out + '\n');
console.log('REPORT.md:', out.split('\n').length, 'строк');
