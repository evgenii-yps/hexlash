// balance-fix-changes.mjs — СПИСОК ИЗМЕНЁННЫХ ЧИСЕЛ «БЫЛО → СТАЛО» из git diff (TZ_balance_fix_v2, отчёт). Берёт diff данных боя между базовым коммитом и HEAD,
// склеивает удалённые и добавленные строки одного места в пары. Строки-комментарии пропускаются, если число в них не менялось (меняется только текст).
// ЗАПУСК: node scripts/balance-fix-changes.mjs <база> > docs/balance-fix/CHANGES.md
import { execSync } from 'node:child_process';
const base = process.argv[2] || 'd9327e02';
const FILES = ['src/data/combatBalance.js', 'src/data/behavior.js', 'src/data/upgradeData.js', 'src/data/branchThreshold.js', 'src/data/intentions.js', 'src/data/klichBalance.js', 'src/data/buffBalance.js', 'src/data/foeCompose.js', 'src/scene/buildFighter.js', 'src/services/buffs.js'];
const nums = (s) => (s.replace(/\/\/.*$/, '').match(/-?\d+(\.\d+)?/g) || []).join(' ');
const short = (s) => s.trim().replace(/\s+/g, ' ').slice(0, 230);
console.log(`# Все изменения данных и кода боя: ${base}..HEAD\n\nФормат: файл:строка (в новой версии) — было → стало. Пары собраны автоматически из \`git diff -U0\`; \`+\` без пары — новая запись, \`−\` без пары — удалённая.\n`);
for (const f of FILES) {
  const d = execSync(`git diff -U0 ${base}..HEAD -- ${f}`, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (!d) continue;
  console.log(`\n## ${f}\n`);
  let newLine = 0; const minus = [], plus = [];
  const flush = (ln) => {
    const n = Math.max(minus.length, plus.length);
    for (let i = 0; i < n; i++) {
      const a = minus[i], b = plus[i];
      if (a != null && b != null) { if (nums(a) === nums(b) && /^\s*\/\//.test(a)) continue; console.log(`- \`:${ln + i}\` — \`${short(a)}\` → \`${short(b)}\``); }
      else if (b != null) console.log(`- \`:${ln + i}\` + \`${short(b)}\``);
      else console.log(`- \`:${ln}\` − \`${short(a)}\``);
    }
    minus.length = 0; plus.length = 0;
  };
  let curStart = 0;
  for (const line of d.split('\n')) {
    const h = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (h) { flush(curStart); curStart = Number(h[1]); continue; }
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index')) continue;
    if (line.startsWith('-')) minus.push(line.slice(1)); else if (line.startsWith('+')) plus.push(line.slice(1));
  }
  flush(curStart);
}
