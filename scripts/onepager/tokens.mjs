/* Чтение токенов из src/styles/tokens.css — единственного места, где они объявлены.
   Токен не найден или пуст — ошибка. Запасных значений здесь нет и быть не должно. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');

export function token(name) {
  const m = src.match(new RegExp('--' + name + '\\s*:\\s*([^;]+);'));
  const v = m && m[1].trim();
  if (!v) throw new Error(`[onepager] токен --${name} не найден или пуст в tokens.css`);
  return v;
}
