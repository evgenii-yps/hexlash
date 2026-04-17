import * as THREE from 'three';
import { createAtmosphereRenderer } from '@/three/helpers/atmosphereScene.js';
import { makeFighterLowPoly, addArchetypeGlow } from '@/three/helpers/fighterLowPoly.js';
import { archColor } from '@/three/helpers/archetypeColors.js';
import { buildArena, RING_HEIGHT } from './pitArena.js';
import { buildEnvironment, buildInteractiveObjects } from './pitEnvironment.js';

const ZOOM_DEFAULT = Math.sqrt(11 * 11 + 16 * 16);
const ZOOM_MIN = 7;
const ZOOM_MAX = 32;

export function initPitScene(canvas, options) {
  const { onObjectClick, agents, badgeWarden, badgePredator, worldHint, hoverLabels } = options;

  // Renderer + scene + camera
  const { renderer, scene, camera } = createAtmosphereRenderer(canvas);

  // Arena (octagon, posts, ropes, cage)
  scene.add(buildArena());

  // Environment (walls, ceiling, beams, lamps, crowd)
  const { env: envGroup, crowdGroup } = buildEnvironment();
  scene.add(envGroup);

  // Interactive objects
  const { env: objGroup, objects } = buildInteractiveObjects();
  scene.add(objGroup);

  // Fighters
  const wardenContainer = new THREE.Group();
  wardenContainer.position.set(-1.8, RING_HEIGHT, 0.6);
  wardenContainer.rotation.y = Math.atan2(1.8 - (-1.8), -0.6 - 0.6);
  scene.add(wardenContainer);

  const predatorContainer = new THREE.Group();
  predatorContainer.position.set(1.8, RING_HEIGHT, -0.6);
  predatorContainer.rotation.y = Math.atan2(-1.8 - 1.8, 0.6 - (-0.6));
  scene.add(predatorContainer);

  wardenContainer.userData = { isClickable: true, id: 'warden' };
  predatorContainer.userData = { isClickable: true, id: 'predator' };

  const hasAgents = agents && agents.length > 0;
  if (hasAgents) {
    const w = makeFighterLowPoly();
    wardenContainer.add(w);
    addArchetypeGlow(wardenContainer, archColor('warden'));
    if (agents.length >= 2) {
      const p = makeFighterLowPoly();
      predatorContainer.add(p);
      addArchetypeGlow(predatorContainer, archColor('predator'));
    }
  }

  // Dust particles
  const dustCount = 240;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 1] = Math.random() * 7 + 0.3;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
    color: 0xffd9c8, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  // Lighting
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.35));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));
  const key = new THREE.SpotLight(0xfff0e8, 2.4, 28, Math.PI * 0.22, 0.55, 1.4);
  key.position.set(0, 12, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0003;
  scene.add(key, key.target);

  const rimL = new THREE.SpotLight(0xff066f, 1.1, 22, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-9, 3.5, -2);
  rimL.target.position.set(0, 1.5, 0);
  scene.add(rimL, rimL.target);

  const rimR = new THREE.SpotLight(0x4dd9ff, 0.6, 22, Math.PI * 0.45, 0.9, 1.6);
  rimR.position.set(9, 3.0, 2);
  rimR.target.position.set(0, 1.5, 0);
  scene.add(rimR, rimR.target);

  scene.add(Object.assign(new THREE.PointLight(0x202838, 0.6, 18, 2), { position: new THREE.Vector3(0, 2, 8) }));

  // Light shafts
  function makeLightShaft(x, z, color, opacity) {
    const shaft = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 11, 24, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    shaft.position.set(x, 5.5, z);
    return shaft;
  }
  scene.add(makeLightShaft(0, 0, 0xfff0e8, 0.04));
  const shaftPink = makeLightShaft(-3, -1, 0xff066f, 0.025);
  shaftPink.rotation.z = 0.3;
  scene.add(shaftPink);

  // Camera state
  let camAngle = 0, camTarget = 0;
  let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartAngle = 0, dragMoved = false;
  let zoomDist = ZOOM_DEFAULT, zoomTarget = ZOOM_DEFAULT;
  let isPinching = false, pinchStartDist = 0, pinchStartZoom = 0;

  function updateCam() {
    zoomDist += (zoomTarget - zoomDist) * 0.10;
    const r = zoomDist;
    camera.position.x = Math.sin(camAngle) * r;
    camera.position.z = Math.cos(camAngle) * r;
    const heightRatio = (r - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
    camera.position.y = 2.2 + heightRatio * 4.5 + Math.sin(camAngle * 2) * 0.3;
    camera.lookAt(0, 1.6 + heightRatio * 0.6, 0);
  }

  function setZoom(target) { zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, target)); }
  function nudgeZoom(delta) { setZoom(zoomTarget + delta); }

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredObject = null;

  function getClickableTargets() {
    const targets = [objects.heavyBag, objects.terminal, objects.newFighter, objects.scoreboard, objects.clanBanner, objects.shopLocker];
    if (hasAgents) targets.push(wardenContainer);
    if (agents && agents.length >= 2) targets.push(predatorContainer);
    return targets;
  }

  function pickAt(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets = getClickableTargets();
    const intersects = raycaster.intersectObjects(targets, true);
    if (intersects.length === 0) return null;
    let obj = intersects[0].object;
    while (obj && !targets.includes(obj)) obj = obj.parent;
    return obj || null;
  }

  function onPointerMoveHover(clientX, clientY) {
    if (isDragging) return;
    const hit = pickAt(clientX, clientY);
    if (hit !== hoveredObject) {
      if (hoveredObject) hoveredObject.userData.hoverScale = 1.0;
      hoveredObject = hit;
      if (hit) {
        document.body.style.cursor = 'pointer';
        hit.userData.hoverScale = 1.04;
        const label = hoverLabels[hit.userData?.id] || (hit === wardenContainer ? 'View Fighter' : hit === predatorContainer ? 'View Fighter' : '');
        if (label && worldHint) { worldHint.textContent = label; worldHint.classList.add('show'); }
      } else {
        document.body.style.cursor = '';
        if (worldHint) worldHint.classList.remove('show');
      }
    }
    if (hoveredObject && worldHint && worldHint.classList.contains('show')) {
      worldHint.style.left = clientX + 'px';
      worldHint.style.top = clientY + 'px';
    }
  }

  let _zoomBeforePunch = null;
  function handleClickAt(clientX, clientY) {
    const hit = pickAt(clientX, clientY);
    if (!hit) return;
    const key = hit.userData?.id;
    if (!key) return;
    _zoomBeforePunch = _zoomBeforePunch || zoomTarget;
    const objWorld = new THREE.Vector3();
    hit.getWorldPosition(objWorld);
    camTarget = Math.atan2(objWorld.x, objWorld.z);
    setZoom(11);
    setTimeout(() => {
      onObjectClick(key);
      if (_zoomBeforePunch) { setZoom(_zoomBeforePunch); _zoomBeforePunch = null; }
    }, 280);
  }

  // Input handlers
  const onMouseDown = (e) => { isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; dragStartAngle = camTarget; dragMoved = false; };
  const onMouseMove = (e) => {
    if (isDragging) {
      if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 5) dragMoved = true;
      camTarget = dragStartAngle + ((e.clientX - dragStartX) / window.innerWidth) * Math.PI * 0.6;
    } else { onPointerMoveHover(e.clientX, e.clientY); }
  };
  const onMouseUp = (e) => { if (isDragging && !dragMoved) handleClickAt(e.clientX, e.clientY); isDragging = false; };
  const onWheel = (e) => { e.preventDefault(); nudgeZoom(Math.sign(e.deltaY) * (e.shiftKey ? 0.5 : 1.4)); };
  const onTouchStart = (e) => {
    if (e.touches.length === 2) { isPinching = true; isDragging = false; pinchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); pinchStartZoom = zoomTarget; }
    else if (e.touches.length === 1) { isDragging = true; dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY; dragStartAngle = camTarget; dragMoved = false; }
  };
  const onTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) { const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setZoom(pinchStartZoom * (pinchStartDist / Math.max(dist, 1))); }
    else if (isDragging && e.touches.length === 1) { if (Math.hypot(e.touches[0].clientX - dragStartX, e.touches[0].clientY - dragStartY) > 8) dragMoved = true; camTarget = dragStartAngle + ((e.touches[0].clientX - dragStartX) / window.innerWidth) * Math.PI * 0.6; }
  };
  const onTouchEnd = (e) => {
    if (isPinching && e.touches.length < 2) isPinching = false;
    if (isDragging && !dragMoved && e.changedTouches.length > 0 && !isPinching) handleClickAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (e.touches.length === 0) isDragging = false;
  };
  const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); };

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('resize', onResize);

  // Badge tracking helper
  const _v = new THREE.Vector3();
  function projectToScreen(obj3d, headOffsetY) {
    obj3d.getWorldPosition(_v);
    _v.y += headOffsetY || 2.3;
    _v.project(camera);
    return { x: (_v.x * 0.5 + 0.5) * window.innerWidth, y: (-_v.y * 0.5 + 0.5) * window.innerHeight, visible: _v.z < 1 };
  }

  // Animation loop
  const t0 = performance.now();
  let animFrame = null;
  const wardenBaseRotY = wardenContainer.rotation.y;
  const predatorBaseRotY = predatorContainer.rotation.y;

  function tick() {
    const t = (performance.now() - t0) / 1000;
    camAngle += (camTarget - camAngle) * 0.06;
    if (!isDragging) camTarget += Math.sin(t * 0.15) * 0.0008;
    updateCam();

    // Fighter idle sway
    wardenContainer.position.y = RING_HEIGHT + Math.sin(t * 1.2) * 0.015;
    predatorContainer.position.y = RING_HEIGHT + Math.sin(t * 1.2 + 1.5) * 0.015;
    wardenContainer.rotation.y = wardenBaseRotY + Math.sin(t * 0.6) * 0.04;
    predatorContainer.rotation.y = predatorBaseRotY + Math.sin(t * 0.6 + 2) * 0.04;

    // Dust drift
    const positions = dustGeom.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3 + 1] += 0.003 + Math.sin(t + i) * 0.001;
      if (positions[i * 3 + 1] > 7.5) positions[i * 3 + 1] = 0.3;
    }
    dustGeom.attributes.position.needsUpdate = true;

    shaftPink.rotation.y = t * 0.05;
    rimL.intensity = 1.0 + Math.sin(t * 1.1) * 0.15;

    // Hover scale lerp
    getClickableTargets().forEach(g => {
      const target = g.userData.hoverScale || 1.0;
      const next = g.scale.x + (target - g.scale.x) * 0.15;
      g.scale.set(next, next, next);
    });

    // Crowd breathing
    crowdGroup.children.forEach((figure, i) => {
      const phase = i * 0.37;
      figure.position.y = Math.sin(t * 0.8 + phase) * 0.025;
      figure.rotation.z = Math.sin(t * 0.5 + phase * 1.3) * 0.02;
    });

    // Heavy bag sway
    objects.heavyBag.rotation.x = Math.sin(t * 0.7) * 0.025;
    objects.heavyBag.rotation.z = Math.cos(t * 0.55) * 0.018;

    // Terminal cursor blink
    const screen = objects._screenTex;
    const sctx = objects._sctx;
    if (screen && sctx) {
      const blink = Math.floor(t * 2);
      if (blink !== screen._lastBlink) {
        screen._lastBlink = blink;
        sctx.fillStyle = '#1a0612'; sctx.fillRect(28, 195, 18, 22);
        if (blink % 2 === 0) { sctx.fillStyle = '#FF066F'; sctx.fillRect(32, 200, 12, 14); }
        screen.needsUpdate = true;
      }
    }

    // Glow pulse
    [wardenContainer, predatorContainer].forEach(c => {
      c.children.forEach(ch => {
        if (ch.userData?.isArchGlow && ch.material) ch.material.opacity = 0.85 + Math.sin(t * 1.5) * 0.1;
      });
    });

    // Badge tracking
    if (badgeWarden && hasAgents) {
      const ws = projectToScreen(wardenContainer, 2.3);
      badgeWarden.style.left = ws.x + 'px'; badgeWarden.style.top = ws.y + 'px'; badgeWarden.style.opacity = ws.visible ? '1' : '0';
    }
    if (badgePredator && agents && agents.length >= 2) {
      const ps = projectToScreen(predatorContainer, 2.3);
      badgePredator.style.left = ps.x + 'px'; badgePredator.style.top = ps.y + 'px'; badgePredator.style.opacity = ps.visible ? '1' : '0';
    }

    renderer.render(scene, camera);
    animFrame = requestAnimationFrame(tick);
  }
  tick();

  // Cleanup
  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    document.body.style.cursor = '';
  }

  return { cleanup, renderer, scene, camera };
}
