/* Working upgrade tree — build it, read it, save it small.
   Shared by everything that owns a tree (today: a roster fighter).

   TWO SHAPES, on purpose:
     • working tree — a deep copy of CRYSTALS[core] with face.state flipped to
       'lit'. This is what the UI walks and what the fight resolver reads.
     • lit ids — { crystalId: [faceId, …] }. This is what goes to storage: ~40
       bytes instead of ~3.5 KB, and it keeps working when the facet content in
       upgradeData.js changes (a facet that no longer exists is simply dropped,
       never resurrected as a stale copy). */
import { CRYSTALS, RESOURCE } from './upgradeData.js';

/** Lit faces of a working tree, as { crystalId: [faceId, …] }. Empty → {}. */
export function litIdsOf(tree) {
  const out = {};
  for (const cr of tree || []) {
    const ids = cr.faces.filter((f) => f.state === 'lit').map((f) => f.id);
    if (ids.length) out[cr.id] = ids;
  }
  return out;
}

/** How many points a tree has spent (one per lit facet). */
export function countLit(tree) {
  let n = 0;
  for (const cr of tree || []) for (const f of cr.faces) if (f.state === 'lit') n += 1;
  return n;
}

/**
 * A working tree for `coreId`, with `lit` re-applied on top.
 * Both caps are re-applied here — the per-crystal limit and the global RESOURCE
 * pool — so saved data can never over-spend, however it was written. A facet
 * that is locked in the current content stays locked. Unknown ids are ignored.
 * Returns null for an unknown core.
 */
export function buildTree(coreId, lit) {
  const source = CRYSTALS[coreId];
  if (!source) return null;

  const tree = JSON.parse(JSON.stringify(source));
  if (!lit || typeof lit !== 'object') return tree;

  let spent = 0;
  for (const cr of tree) {
    const ids = Array.isArray(lit[cr.id]) ? lit[cr.id] : [];
    let inCrystal = 0;
    for (const f of cr.faces) {
      if (spent >= RESOURCE) break;
      if (inCrystal >= cr.limit) break;
      if (f.state !== 'open') continue;
      if (!ids.includes(f.id)) continue;
      f.state = 'lit';
      spent += 1;
      inCrystal += 1;
    }
  }
  return tree;
}
