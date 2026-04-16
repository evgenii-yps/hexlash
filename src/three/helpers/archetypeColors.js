/**
 * Archetype color map for Three.js scenes.
 * Mirrors --hex-arch-* CSS tokens from hexlash-ui.css (v23 palette).
 * Hex format: 0xRRGGBB (Three.js native).
 */

export const ARCHETYPE_HEX = {
  predator:   0xFF066F,
  sentinel:   0x2ee07f,
  ghost:      0xA855F7,
  analyst:    0x4dd9ff,
  maverick:   0xFFA133,
  juggernaut: 0xD4A843,
  // Warden = Juggernaut alias (per CLAUDE.md)
  warden:     0xD4A843,
};

/**
 * Resolve archetype id to hex color.
 * Falls back to predator (--hex-primary) for unknown/missing.
 */
export function archColor(id) {
  if (!id) return ARCHETYPE_HEX.predator;
  return ARCHETYPE_HEX[id] || ARCHETYPE_HEX.predator;
}
