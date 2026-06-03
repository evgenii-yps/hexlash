// Procedural CanvasTextures for the arena platform.
// Kept tiny + procedural (no image assets) so the scene loads instantly on
// mobile. Each factory returns a THREE.CanvasTexture; callers own .dispose().
import * as THREE from 'three';

/**
 * Hex-grid overlay for the platform's top face. Thin muted lines that fade
 * toward the far edge (top of the texture → atmospheric depth). Transparent
 * background so only the lines read over the dark platform material.
 */
export function makeHexGridTexture() {
  const W = 768;
  const H = 512; // 768:512 ≈ 6:4, matches the platform footprint
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';

  const size = 30; // hex radius (center → corner), flat-top
  const hStep = size * 1.5; // horizontal column spacing
  const vStep = size * Math.sqrt(3); // vertical row spacing

  // Build one flat-top hexagon path at (cx, cy).
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
      // Atmospheric fade: top of canvas (far edge) → lines bleach out.
      const depth = cy / H; // 0 far … 1 near
      const alpha = 0.05 + 0.22 * depth;
      ctx.strokeStyle = `rgba(150, 172, 205, ${alpha})`;
      hexPath(cx, cy);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Soft pink glow disc (radial gradient → transparent). Reused for the
 * under-platform float glow and the centre-divider bloom. `tint` is the
 * core colour; edges always fade to fully transparent.
 */
export function makeGlowTexture(tint = '#FF066F') {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, hexToRgba(tint, 0.85));
  g.addColorStop(0.35, hexToRgba(tint, 0.4));
  g.addColorStop(1, hexToRgba(tint, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Linear pink strip (bright centre line → transparent at both ends along V).
 * Laid flat across the platform's mid-line to fake bloom around the divider.
 */
export function makeDividerGlowTexture(tint = '#FF066F') {
  const W = 256;
  const H = 64;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, hexToRgba(tint, 0));
  g.addColorStop(0.5, hexToRgba(tint, 0.7));
  g.addColorStop(1, hexToRgba(tint, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
