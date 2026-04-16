import * as THREE from 'three';
import { createAtmosphereRenderer } from '@/three/helpers/atmosphereScene.js';
import { makeConcreteTexture, makeMetalTexture } from '@/three/helpers/textures.js';
import { makeFighterLowPoly, addArchetypeGlow } from '@/three/helpers/fighterLowPoly.js';

const BRANCH_COLORS = {
  speed: 0x00E5FF,
  power: 0xFF066F,
  technique: 0xA855F7,
};

const BRANCH_POSITIONS = {
  speed: { x: -3.0, z: -1.6 },
  power: { x: 0.0, z: -2.4 },
  technique: { x: 3.0, z: -1.6 },
};

export function initFighterDetailScene(canvas, options) {
  const { agent, onBranchClick, branchLabels } = options;

  const { renderer, scene, camera } = createAtmosphereRenderer(canvas);
  scene.fog = new THREE.FogExp2(0x070811, 0.035);
  camera.fov = 38;
  camera.position.set(0, 2.4, 7.0);
  camera.lookAt(0, 1.6, 0);
  camera.updateProjectionMatrix();

  // Floor
  const concreteTex = makeConcreteTexture();
  concreteTex.repeat.set(4, 4);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 48),
    new THREE.MeshStandardMaterial({ map: concreteTex, color: 0x2c2c34, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Room walls (octagonal, dim)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.95 });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * 12, z1 = Math.sin(a1) * 12;
    const x2 = Math.cos(a2) * 12, z2 = Math.sin(a2) * 12;
    const len = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 6), wallMat);
    wall.position.set((x1 + x2) / 2, 3, (z1 + z2) / 2);
    wall.lookAt(0, 3, 0);
    scene.add(wall);
  }

  // Podium
  const podiumDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.5, 0.30, 32),
    new THREE.MeshStandardMaterial({ map: makeConcreteTexture(), color: 0xa8a8b0, roughness: 0.85 })
  );
  podiumDisc.position.set(0, 0.15, 1.0);
  podiumDisc.receiveShadow = true;
  podiumDisc.castShadow = true;
  scene.add(podiumDisc);

  const podiumRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.022, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x4a4d58, roughness: 0.4, metalness: 0.85, map: makeMetalTexture() })
  );
  podiumRing.rotation.x = Math.PI / 2;
  podiumRing.position.set(0, 0.30, 1.0);
  scene.add(podiumRing);

  // Fighter
  const fighterContainer = new THREE.Group();
  fighterContainer.position.set(0, 0.30, 1.0);
  scene.add(fighterContainer);

  const fighter = makeFighterLowPoly();
  fighterContainer.add(fighter);
  if (agent?.primaryModule) {
    const archColor = { predator: 0xFF066F, sentinel: 0x2ee07f, ghost: 0xA855F7, analyst: 0x4dd9ff, maverick: 0xFFA133, juggernaut: 0xD4A843 };
    addArchetypeGlow(fighterContainer, archColor[agent.primaryModule] || 0xFF066F);
  }

  // Branch columns
  const columns = {};
  const columnCaps = {};
  ['speed', 'power', 'technique'].forEach(branch => {
    const color = BRANCH_COLORS[branch];
    const pos = BRANCH_POSITIONS[branch];
    const level = 5;
    const height = 0.5 + level * 0.18;

    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.77, 0.10, 0.77),
      new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.8, metalness: 0.3 })
    );
    base.position.y = 0.05;
    group.add(base);

    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, height, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.6, flatShading: true })
    );
    shaft.position.y = 0.10 + height / 2;
    shaft.castShadow = true;
    group.add(shaft);

    // Cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.32, 0.08, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 })
    );
    cap.position.y = 0.10 + height;
    group.add(cap);
    columnCaps[branch] = cap;

    // Floor glow disc
    const discCv = document.createElement('canvas');
    discCv.width = discCv.height = 256;
    const dctx = discCv.getContext('2d');
    const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
    const grad = dctx.createRadialGradient(128, 128, 5, 128, 128, 128);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 256, 256);
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(discCv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.005;
    group.add(disc);

    // Point light
    const light = new THREE.PointLight(color, 0.35, 4.5, 2);
    light.position.y = 0.10 + height + 0.3;
    group.add(light);

    group.position.set(pos.x, 0, pos.z);
    group.userData = { isClickable: true, id: branch };
    scene.add(group);
    columns[branch] = group;
  });

  // Lighting
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.35));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));
  const key = new THREE.SpotLight(0xfff0e8, 2.0, 20, Math.PI * 0.25, 0.5, 1.4);
  key.position.set(0, 8, 4);
  key.target.position.set(0, 1.2, 1.0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);

  const rimL = new THREE.SpotLight(0xff066f, 0.8, 15, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-6, 3, 2);
  rimL.target.position.set(0, 1.5, 1);
  scene.add(rimL, rimL.target);

  const rimR = new THREE.SpotLight(0x4dd9ff, 0.4, 15, Math.PI * 0.45, 0.9, 1.6);
  rimR.position.set(6, 2.5, 2);
  rimR.target.position.set(0, 1.5, 1);
  scene.add(rimR, rimR.target);

  // Raycaster for column clicks
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredCol = null;

  function getColumnTargets() { return Object.values(columns); }

  function pickColumn(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(getColumnTargets(), true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    const targets = getColumnTargets();
    while (obj && !targets.includes(obj)) obj = obj.parent;
    return obj || null;
  }

  const onPointerMove = (e) => {
    const hit = pickColumn(e.clientX, e.clientY);
    if (hit !== hoveredCol) {
      if (hoveredCol) hoveredCol.userData.hoverScale = 1.0;
      hoveredCol = hit;
      if (hit) { document.body.style.cursor = 'pointer'; hit.userData.hoverScale = 1.06; }
      else document.body.style.cursor = '';
    }
  };

  let clickMoved = false, clickStartX = 0, clickStartY = 0;
  const onPointerDown = (e) => { clickStartX = e.clientX; clickStartY = e.clientY; clickMoved = false; };
  const onPointerUp = (e) => {
    if (Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY) > 5) return;
    const hit = pickColumn(e.clientX, e.clientY);
    if (hit && onBranchClick) onBranchClick(hit.userData.id);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove);

  // Shockwaves
  const shockwaves = [];
  function triggerLevelUp(branchId) {
    const col = columns[branchId];
    if (!col) return;
    const color = BRANCH_COLORS[branchId];
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.5, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(col.position);
    ring.position.y = 0.02;
    scene.add(ring);
    shockwaves.push({ mesh: ring, start: performance.now(), duration: 800 });
  }

  // Label tracking helper
  const _v = new THREE.Vector3();
  function projectToScreen(obj3d, addY) {
    obj3d.getWorldPosition(_v);
    _v.y += addY || 0;
    _v.project(camera);
    return { x: (_v.x * 0.5 + 0.5) * window.innerWidth, y: (-_v.y * 0.5 + 0.5) * window.innerHeight, visible: _v.z < 1 };
  }

  // Camera orbit
  let fdRotation = 0, fdRotTarget = 0;

  // Animation
  const t0 = performance.now();
  let animFrame = null;

  function tick() {
    const t = (performance.now() - t0) / 1000;

    // Auto-rotate
    fdRotTarget += 0.001;
    fdRotation += (fdRotTarget - fdRotation) * 0.08;
    camera.position.x = Math.sin(fdRotation) * 7.0;
    camera.position.z = Math.cos(fdRotation) * 7.0;
    camera.position.y = 2.4;
    camera.lookAt(0, 1.6, 0);

    // Fighter idle sway
    fighterContainer.position.y = 0.30 + Math.sin(t * 1.2) * 0.01;

    // Column hover lerp
    getColumnTargets().forEach(g => {
      const target = g.userData.hoverScale || 1.0;
      const next = g.scale.x + (target - g.scale.x) * 0.12;
      g.scale.set(next, next, next);
    });

    // Cap glow pulse
    Object.entries(columnCaps).forEach(([, cap]) => {
      if (cap.material) cap.material.emissiveIntensity = 0.45 + Math.sin(t * 1.5) * 0.15;
    });

    // Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      const elapsed = (performance.now() - sw.start) / sw.duration;
      if (elapsed >= 1) { scene.remove(sw.mesh); sw.mesh.geometry.dispose(); sw.mesh.material.dispose(); shockwaves.splice(i, 1); continue; }
      const s = 1 + elapsed * 8;
      sw.mesh.scale.set(s, s, s);
      sw.mesh.material.opacity = 0.9 * (1 - elapsed);
    }

    // Label tracking
    if (branchLabels) {
      ['speed', 'power', 'technique'].forEach(branch => {
        const el = branchLabels[branch];
        const col = columns[branch];
        if (!el || !col) return;
        const p = projectToScreen(col, 2.2);
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.opacity = p.visible ? '1' : '0';
      });
    }

    renderer.render(scene, camera);
    animFrame = requestAnimationFrame(tick);
  }
  tick();

  const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize);

  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    document.body.style.cursor = '';
  }

  return { cleanup, triggerLevelUp };
}
