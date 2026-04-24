// Epic 5 — Sub-Epic 5D Step 4.
// Clan flag totem — a pole + base + canvas-texture cloth with accent emblem
// and 3-letter label. Parameterized factory; ClanScene instantiates three
// (PRED pink / IRW gold / ANA cyan) at posX -3.5 / 0 / 3.5.
//
// Source: prototype hexlash_v24.html lines 10911-10963 (makeClanFlag).
//
// Separate module per "one object = one module" codebase convention — same
// pattern as clanBanner.js (hub) / createPodium.js / matchmakingTerminal.js.
// No colorSpace / sRGB override on CanvasTexture — matches codebase
// convention (15+ CanvasTexture sites, none set encoding).

/**
 * Build one clan flag totem.
 * @param {import('three')} THREE
 * @param {string} accentHex — CSS hex string, e.g. '#ff066f'
 * @param {number} posX — X position of the totem in world space
 * @param {string} labelText — 3-letter clan tag, e.g. 'PRED'
 * @returns {import('three').Group}
 */
export function makeClanFlag(THREE, accentHex, posX, labelText) {
  const g = new THREE.Group();

  // Pole — thin dark cylinder 4.0 tall, anchored by y=2.0 (mid-height).
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 4.0, 12),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a34, roughness: 0.5, metalness: 0.75,
    }),
  );
  pole.position.y = 2.0;
  g.add(pole);

  // Concrete base at the foot — no shared texture, single-purpose material.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.14, 12),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a22, roughness: 0.85, metalness: 0.2,
    }),
  );
  base.position.y = 0.07;
  g.add(base);

  // Canvas texture — bg + accent stripe + emblem circle + label + grunge.
  // 128×256 matches prototype; PlaneGeometry is 0.7×1.4 (1:2 aspect) so the
  // texture reads pixel-for-pixel with the world-space plane.
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#0e0e18';
  ctx.fillRect(0, 0, 128, 256);

  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 80, 128, 20);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(64, 160, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 14px monospace';
  const labelW = ctx.measureText(labelText).width;
  ctx.fillText(labelText, 64 - labelW / 2, 36);

  // Grunge — 150 faint dark dots scattered across the cloth.
  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 256, 2, 2);
  }

  const tex = new THREE.CanvasTexture(cv);
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1.4),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  cloth.position.set(0.36, 2.7, 0);
  g.add(cloth);

  g.position.x = posX;
  return g;
}
