// Procedural CanvasTextures for the arena. Tiny + procedural (no image assets)
// so the scene loads instantly on mobile. Each factory returns a
// THREE.CanvasTexture; callers own .dispose().
//
// Discipline: monochrome surface/dust textures; the single pink accent
// (--pink, passed in) lives only in the rift-glow textures.
import * as THREE from 'three';

/**
 * Hex-grid overlay for the platform's top face — SEAMLESSLY TILEABLE so it can
 * be mapped with equal world-scale UVs (regular hexagons, not squashed). Uniform
 * alpha here; the far-edge fade is applied per-vertex by buildArena (a baked
 * gradient can't tile). RepeatWrapping + mipmaps + max anisotropy keep it crisp.
 *
 * The grid is flat-top with an integer number of column-pairs (2·nx) and rows
 * (ny) across a square canvas, so the pattern repeats with no seam.
 * @param {number} maxAniso renderer.capabilities.getMaxAnisotropy()
 */
export function makeHexGridTexture(maxAniso = 1) {
  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  // --- Faint monochrome micro-texture (material read). Scanlines tile exactly.
  ctx.fillStyle = 'rgba(150, 165, 195, 0.022)';
  for (let y = 0; y < S; y += 4) ctx.fillRect(0, y, S, 1);
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(170,185,210,${0.015 + Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 1, 1);
  }

  // --- Flat-top hex grid that tiles exactly: 2·nx columns, ny rows fit the
  //     canvas precisely. Steps are ~1% off perfectly-regular spacing (so the
  //     lattice tiles), which is imperceptible.
  const nx = 8; // → 16 columns
  const ny = 14;
  const hStep = S / (2 * nx); // 64
  const vStep = S / ny; // ~73.1
  const size = hStep / 1.5; // hex radius
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(160, 182, 218, 0.32)';

  const hexPath = (cx, cy) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i);
      const x = cx + size * Math.cos(a);
      const y = cy + size * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };

  for (let col = -1; col <= 2 * nx; col++) {
    const cx = col * hStep;
    const off = col & 1 ? vStep / 2 : 0;
    for (let row = -1; row <= ny; row++) hexPath(cx, row * vStep + off);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = maxAniso;
  return tex;
}

/** Soft radial disc, transparent at the rim. Used for the dark contact shadow
 *  and dust specks. */
export function makeRadialTexture(coreRgba, midRgba, midStop = 0.4) {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, coreRgba);
  g.addColorStop(midStop, midRgba);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Rift glow textures (torn-rift pass 3). The single accent colour `pink`
//     comes from the --pink token (passed in, never hard-coded). All
//     are tight gradients so the glow stays a narrow bright band, not a cloud.

/** Hot core ribbon: near-white centre → pink shoulders → transparent (narrow).
 *  Laid flat across the gap bottom, the bright centre reads as the molten seam. */
export function makeCoreBandTexture(pink) {
  return bandTexture([
    [0.0, 'rgba(255,255,255,0)'],
    [0.42, 'rgba(255,255,255,0)'],
    [0.46, hexToRgba(pink, 0.6)],
    [0.5, 'rgba(255,250,252,1)'],
    [0.54, hexToRgba(pink, 0.6)],
    [0.6, 'rgba(255,255,255,0)'],
    [1.0, 'rgba(255,255,255,0)'],
  ]);
}

/** Dense short pink halo around the core (fast falloff, no wide cloud). */
export function makeHaloBandTexture(pink) {
  return bandTexture([
    [0.0, hexToRgba(pink, 0)],
    [0.3, hexToRgba(pink, 0)],
    [0.42, hexToRgba(pink, 0.4)],
    [0.5, hexToRgba(pink, 0.95)],
    [0.58, hexToRgba(pink, 0.4)],
    [0.7, hexToRgba(pink, 0)],
    [1.0, hexToRgba(pink, 0)],
  ]);
}

/** Far-plate inner wall underlight: dark/transparent top → hot pink at the
 *  bottom chip (light rising from the chasm). Drawn so the canvas bottom (which
 *  maps to the plane's bottom via flipY) is hottest. */
export function makeWallGlowTexture(pink) {
  return bandTexture([
    [0.0, hexToRgba(pink, 0)], // canvas top → plane top → dark
    [0.5, hexToRgba(pink, 0.12)],
    [0.8, hexToRgba(pink, 0.5)],
    [0.95, hexToRgba(pink, 0.85)],
    [1.0, 'rgba(255,240,247,0.95)'], // canvas bottom → plane bottom → hot
  ]);
}

// Tiny vertical-gradient strip (uniform along its width). Shared by the rift
// band textures above.
function bandTexture(stops) {
  const W = 8;
  const H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [pos, color] of stops) g.addColorStop(pos, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
