// Epic 3A — Fighter Detail branch column builder.
// Step 5: one column (base + shaft + cap + accent + floor disc + point light).
// Used by FighterDetailScene.js for Speed / Power / Technique pillars behind
// the podium fighter.
//
// Source: prototype hexlash_v24.html lines 7472-7540.

/**
 * @param {*} THREE — three.js namespace
 * @param {{ id:string, name:string, color:number, level:number, x:number, z:number }} branch
 * @param {{ COL_R:number, COL_BASE_H:number, COL_PER_LVL:number }} opts
 * @returns {{ group: import('three').Group, height: number }}
 */
export function buildBranchColumn(THREE, branch, opts) {
  const { COL_R, COL_BASE_H, COL_PER_LVL } = opts;

  const g = new THREE.Group();
  g.position.set(branch.x, 0, branch.z);
  g.userData.branchId = branch.id;

  const h = COL_BASE_H + branch.level * COL_PER_LVL;

  // ---- base block ----
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(COL_R * 2.4, 0.10, COL_R * 2.4),
    new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.9 })
  );
  base.position.y = 0.05;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);

  // ---- shaft (8-sided low-poly, emissive in branch color) ----
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(COL_R, COL_R, h, 8),
    new THREE.MeshStandardMaterial({
      color: 0x222228, roughness: 0.5, metalness: 0.4,
      emissive: branch.color, emissiveIntensity: 0.45,
      flatShading: true,
    })
  );
  shaft.position.y = 0.10 + h / 2;
  shaft.castShadow = true;
  g.add(shaft);

  // ---- glowing top cap ----
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(COL_R * 0.85, COL_R, 0.08, 8),
    new THREE.MeshBasicMaterial({ color: branch.color })
  );
  cap.position.y = 0.10 + h + 0.04;
  g.add(cap);

  // ---- accent strip on the side facing the fighter (toward origin) ----
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, h - 0.1, 0.025),
    new THREE.MeshBasicMaterial({ color: branch.color })
  );
  const dirToFighter = new THREE.Vector2(-branch.x, -branch.z).normalize();
  accent.position.set(
    dirToFighter.x * (COL_R + 0.015),
    0.10 + h / 2,
    dirToFighter.y * (COL_R + 0.015)
  );
  g.add(accent);

  // ---- floor light disc (canvas radial gradient in branch color) ----
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const cx = cv.getContext('2d');
  const r  = (branch.color >> 16) & 255;
  const gr = (branch.color >> 8) & 255;
  const bl = branch.color & 255;
  const grad = cx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0,   `rgba(${r},${gr},${bl},0.7)`);
  grad.addColorStop(0.5, `rgba(${r},${gr},${bl},0.25)`);
  grad.addColorStop(1,   `rgba(${r},${gr},${bl},0)`);
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.005;
  g.add(disc);

  // ---- small point light at the cap — illuminates fighter's back ----
  const pl = new THREE.PointLight(branch.color, 0.35, 4.5, 2);
  pl.position.set(0, 0.10 + h + 0.4, 0);
  g.add(pl);

  return { group: g, height: h };
}
