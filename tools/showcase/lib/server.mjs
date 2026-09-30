// Поднимает dev-сервер игры (vite) из корня репозитория — или берёт уже
// запущенный, если задан SHOWCASE_BASE. Финальный рендер идёт ТОЛЬКО через dev-сервер:
// в prod-сборке `<script setup>` прячет состояние сцен, а оно нужно режиссёрской камере.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const ping = (url) => new Promise((res) => {
  const r = http.get(url, (x) => { x.resume(); res(x.statusCode < 500); });
  r.on('error', () => res(false)); r.setTimeout(1500, () => { r.destroy(); res(false); });
});

export async function startServer({ root = REPO, port = 5199 } = {}) {
  if (process.env.SHOWCASE_BASE) return { base: process.env.SHOWCASE_BASE, stop: async () => {} };
  const base = `http://127.0.0.1:${port}`;
  if (await ping(base + '/')) return { base, stop: async () => {} };
  const vite = path.join(root, 'node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [vite, '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { if (await ping(base + '/')) break; await new Promise((r) => setTimeout(r, 500)); }
  if (!(await ping(base + '/'))) { child.kill(); throw new Error('dev-сервер не поднялся'); }
  return { base, stop: async () => { child.kill(); } };
}
