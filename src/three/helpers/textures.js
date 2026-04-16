import * as THREE from 'three';

export function makeNoiseTexture(size, scale, contrast) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    let v = Math.random();
    v = (v + Math.random() + Math.random()) / 3;
    v = Math.pow(v, contrast);
    const g = Math.floor(v * 255);
    img.data[i] = g; img.data[i+1] = g; img.data[i+2] = g; img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}

export function makeConcreteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 30 + Math.random() * 80;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.5;
    g.addColorStop(0, dark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i+1] = Math.max(0, Math.min(255, img.data[i+1] + n));
    img.data[i+2] = Math.max(0, Math.min(255, img.data[i+2] + n));
  }
  ctx.putImageData(img, 0, 0);
  const wear = ctx.createRadialGradient(256, 256, 30, 256, 256, 200);
  wear.addColorStop(0, 'rgba(0,0,0,0.35)');
  wear.addColorStop(0.6, 'rgba(0,0,0,0.15)');
  wear.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, 512, 512);
  ctx.save();
  ctx.translate(256, 256);
  ctx.strokeStyle = 'rgba(255,6,111,0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * 90, y = Math.sin(a) * 90;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeMetalTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1c24';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
