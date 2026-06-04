// Procedural CanvasTextures for the arena. Tiny + procedural (no image assets)
// so the scene loads instantly on mobile. Each factory returns a
// THREE.CanvasTexture; callers own .dispose().
//
// Discipline: monochrome surface/dust textures; the single pink accent
// (--hex-primary, passed in) lives only in the rift-glow textures.
import * as THREE from 'three';

/**
 * Hex-grid overlay for the platform's top face. Thin muted lines that fade
 * toward the far edge (top of canvas) plus a very faint monochrome scanline +
 * speckle micro-texture so the floor reads as a material, not a flat fill.
 *
 * Mipmaps + max anisotropy keep the grid crisp on the far half in perspective.
 * @param {number} maxAniso renderer.capabilities.getMaxAnisotropy()
 */
export function makeHexGridTexture(maxAniso = 1) {
  const W = 1024;
  const H = 683; // ≈ 6:4 platform footprint
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  // --- Micro surface texture: faint scanlines + speckle (monochrome).
  ctx.fillStyle = 'rgba(150, 165, 195, 0.022)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = `rgba(170,185,210,${0.015 + Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // --- Hex grid (flat-top), higher contrast than before but still thin.
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  const size = 40;
  const hStep = size * 1.5;
  const vStep = size * Math.sqrt(3);

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
  };

  let col = 0;
  for (let cx = -size; cx <= W + size; cx += hStep, col++) {
    const yOffset = col % 2 ? vStep / 2 : 0;
    for (let cy = -size + yOffset; cy <= H + size; cy += vStep) {
      const depth = cy / H; // 0 far … 1 near
      const alpha = 0.1 + 0.32 * depth; // higher contrast, fades to far edge
      ctx.strokeStyle = `rgba(160, 182, 218, ${alpha})`;
      hexPath(cx, cy);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
//     comes from the --hex-primary token (passed in, never hard-coded). All
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
