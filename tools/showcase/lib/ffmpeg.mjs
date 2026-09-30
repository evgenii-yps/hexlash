// ffmpeg с H.264. В песочнице системный ffmpeg Playwright умеет только VP8, поэтому
// берём статическую сборку из pip-пакета imageio-ffmpeg (там есть libx264).
// На обычной машине достаточно любого ffmpeg с libx264 в PATH или FFMPEG=/путь.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CACHE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.cache');

function hasX264(bin) {
  try { return /libx264/.test(execFileSync(bin, ['-hide_banner', '-encoders'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch (_) { return false; }
}

export function findFfmpeg() {
  if (process.env.FFMPEG && hasX264(process.env.FFMPEG)) return process.env.FFMPEG;
  const dir = path.join(CACHE, 'imageio_ffmpeg/binaries');
  if (existsSync(dir)) {
    const f = readdirSync(dir).find((x) => x.startsWith('ffmpeg-'));
    if (f && hasX264(path.join(dir, f))) return path.join(dir, f);
  }
  if (hasX264('ffmpeg')) return 'ffmpeg';
  // обход: скачать колесо imageio-ffmpeg и распаковать
  mkdirSync(CACHE, { recursive: true });
  const r = spawnSync('pip', ['download', 'imageio-ffmpeg', '--no-deps', '-d', CACHE, '-q'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('нет ffmpeg с libx264: поставьте ffmpeg или задайте FFMPEG=/путь (см. README)');
  const wheel = readdirSync(CACHE).find((x) => x.startsWith('imageio_ffmpeg') && x.endsWith('.whl'));
  spawnSync('python3', ['-m', 'zipfile', '-e', path.join(CACHE, wheel), CACHE], { stdio: 'inherit' });
  const bin = readdirSync(dir).find((x) => x.startsWith('ffmpeg-'));
  chmodSync(path.join(dir, bin), 0o755);
  return path.join(dir, bin);
}

/** Собирает mp4 из пронумерованных кадров. fps — частота входных кадров; outFps — выходная (по умолчанию та же). */
export function encode({ frames, out, fps = 60, outFps = fps, crf = 14, preset = 'slow' }) {
  const ff = findFfmpeg();
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', frames,
    '-vf', outFps !== fps ? `fps=${outFps},format=yuv420p` : 'format=yuv420p',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-movflags', '+faststart', out];
  const r = spawnSync(ff, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg упал');
}
