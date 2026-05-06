// Epic 2 — pit-view hub. Step 2.
// Source: hexlash_v24.html lines 5136-5159 (makeMetalTexture).
// THREE passed as param (в прототипе был глобальный).

export function makeMetalTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#1a1c24';
  ctx.fillRect(0, 0, 256, 256);

  // brushed lines
  for (let y = 0; y < 256; y += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(0, y, 256, 1);
  }

  // scratches
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
