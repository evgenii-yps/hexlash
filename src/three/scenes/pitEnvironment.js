import * as THREE from 'three';
import { makeConcreteTexture, makeMetalTexture } from '@/three/helpers/textures.js';
import { makeCrowdFigure } from '@/three/helpers/crowdSilhouette.js';

const ROOM_RADIUS = 18;
const ROOM_WALL_HEIGHT = 9;

export function buildEnvironment() {
  const env = new THREE.Group();

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.95, metalness: 0.0 });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * ROOM_RADIUS, z1 = Math.sin(a1) * ROOM_RADIUS;
    const x2 = Math.cos(a2) * ROOM_RADIUS, z2 = Math.sin(a2) * ROOM_RADIUS;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallLen, ROOM_WALL_HEIGHT), wallMat);
    wall.position.set((x1 + x2) / 2, ROOM_WALL_HEIGHT / 2, (z1 + z2) / 2);
    wall.lookAt(0, ROOM_WALL_HEIGHT / 2, 0);
    wall.receiveShadow = true;
    env.add(wall);
  }

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS + 2, 32),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.9, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_WALL_HEIGHT;
  env.add(ceiling);

  // Beams
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.7, metalness: 0.5 });
  function makeBeam(length) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.4), beamMat);
    top.position.y = 0.2;
    const bot = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.4), beamMat);
    bot.position.y = -0.2;
    const web = new THREE.Mesh(new THREE.BoxGeometry(length, 0.4, 0.06), beamMat);
    g.add(top, bot, web);
    return g;
  }
  for (let i = -1; i <= 1; i += 2) {
    const bx = makeBeam(ROOM_RADIUS * 2);
    bx.position.set(0, ROOM_WALL_HEIGHT - 0.4, i * 5);
    env.add(bx);
    const bz = makeBeam(ROOM_RADIUS * 2);
    bz.position.set(i * 5, ROOM_WALL_HEIGHT - 0.4, 0);
    bz.rotation.y = Math.PI / 2;
    env.add(bz);
  }

  // Hanging lamps
  const lampSpots = [];
  function makeHangingLamp(x, z, intensity, color) {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.6, metalness: 0.4 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), stemMat);
    stem.position.set(x, ROOM_WALL_HEIGHT - 1.1, z);
    env.add(stem);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.55, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.7, metalness: 0.6, side: THREE.DoubleSide })
    );
    shade.position.set(x, ROOM_WALL_HEIGHT - 2.3, z);
    shade.rotation.x = Math.PI;
    env.add(shade);
    const shadeInside = new THREE.Mesh(
      new THREE.ConeGeometry(0.43, 0.50, 16, 1, true),
      new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: true, opacity: 0.4 })
    );
    shadeInside.position.set(x, ROOM_WALL_HEIGHT - 2.3, z);
    shadeInside.rotation.x = Math.PI;
    env.add(shadeInside);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 8), new THREE.MeshBasicMaterial({ color }));
    bulb.position.set(x, ROOM_WALL_HEIGHT - 2.45, z);
    env.add(bulb);
    const spot = new THREE.SpotLight(color, intensity, 14, Math.PI * 0.35, 0.6, 1.4);
    spot.position.set(x, ROOM_WALL_HEIGHT - 2.4, z);
    spot.target.position.set(x, 0, z);
    env.add(spot, spot.target);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, ROOM_WALL_HEIGHT - 2.4, 24, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    cone.position.set(x, (ROOM_WALL_HEIGHT - 2.4) / 2, z);
    env.add(cone);
    lampSpots.push(spot);
  }
  makeHangingLamp(0, 0, 1.4, 0xfff0e0);
  makeHangingLamp(-3.5, 1, 0.8, 0xffe0c0);
  makeHangingLamp(3.5, -1, 0.8, 0xffe0c0);

  // Drainage grate
  const grateMat = new THREE.MeshStandardMaterial({ color: 0x06060c, roughness: 1.0 });
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const r = 5.35;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.12), grateMat);
    slot.position.set(Math.cos(a) * r, 0.005, Math.sin(a) * r);
    slot.rotation.y = -a;
    env.add(slot);
  }

  // Crowd
  const crowdAnchors = [
    { ang: -2.6, r: 8.5 }, { ang: -2.3, r: 9.0 }, { ang: -2.0, r: 8.2 },
    { ang: -1.7, r: 9.3 }, { ang: -1.4, r: 8.6 }, { ang: -1.1, r: 8.9 },
    { ang: -0.8, r: 9.1 }, { ang: -0.4, r: 8.4 }, { ang: 0.0, r: 9.2 },
    { ang: 0.4, r: 8.7 }, { ang: 0.8, r: 9.0 }, { ang: 1.1, r: 8.5 },
    { ang: 1.4, r: 8.8 }, { ang: 1.7, r: 9.4 }, { ang: 2.0, r: 8.3 },
    { ang: 2.3, r: 9.1 }, { ang: 2.6, r: 8.6 }, { ang: 3.0, r: 9.0 }
  ];
  const crowdGroup = new THREE.Group();
  crowdAnchors.forEach(p => {
    const x = Math.cos(p.ang) * p.r + (Math.random() - 0.5) * 0.6;
    const z = Math.sin(p.ang) * p.r + (Math.random() - 0.5) * 0.6;
    const scale = 0.9 + Math.random() * 0.25;
    crowdGroup.add(makeCrowdFigure(x, z, scale));
  });
  env.add(crowdGroup);

  // Ground fog
  const gfGeom = new THREE.BufferGeometry();
  const gfPos = new Float32Array(80 * 3);
  for (let i = 0; i < 80; i++) {
    gfPos[i * 3] = (Math.random() - 0.5) * 22;
    gfPos[i * 3 + 1] = Math.random() * 0.6;
    gfPos[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  gfGeom.setAttribute('position', new THREE.BufferAttribute(gfPos, 3));
  env.add(new THREE.Points(gfGeom, new THREE.PointsMaterial({
    color: 0x665570, size: 0.25, transparent: true, opacity: 0.35, depthWrite: false
  })));

  return { env, crowdGroup };
}

export function buildInteractiveObjects() {
  const objects = {};
  const env = new THREE.Group();

  // Heavy Bag
  const heavyBag = new THREE.Group();
  const chainMat = new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.5, metalness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 6, 12), chainMat);
    link.position.y = 3.6 - i * 0.12;
    link.rotation.x = (i % 2) * Math.PI / 2;
    heavyBag.add(link);
  }
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.85, metalness: 0.15 });
  const bagBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.5, 24), bagMat);
  bagBody.position.y = 2.25; bagBody.castShadow = true;
  heavyBag.add(bagBody);
  const bagTop = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), bagMat);
  bagTop.position.y = 3.0; bagTop.castShadow = true;
  heavyBag.add(bagTop);
  const bagBot = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bagMat);
  bagBot.position.y = 1.5; bagBot.castShadow = true;
  heavyBag.add(bagBot);
  heavyBag.position.set(-8, 0, 3);
  heavyBag.userData = { isClickable: true, id: 'training' };
  env.add(heavyBag);
  const bagLight = new THREE.SpotLight(0xfff5e8, 1.0, 7, Math.PI * 0.35, 0.6, 1.2);
  bagLight.position.set(-8, 5.5, 3);
  bagLight.target.position.set(-8, 1.5, 3);
  env.add(bagLight, bagLight.target);
  objects.heavyBag = heavyBag;

  // Terminal
  const terminal = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.8, metalness: 0.3 });
  const terminalStand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.7), standMat);
  terminalStand.position.set(0, 0.5, 0);
  terminalStand.castShadow = true;
  terminal.add(terminalStand);
  const crtBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.6, metalness: 0.3 }));
  crtBody.position.y = 1.35; crtBody.castShadow = true;
  terminal.add(crtBody);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256; screenCanvas.height = 256;
  const sctx = screenCanvas.getContext('2d');
  sctx.fillStyle = '#1a0612'; sctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) { sctx.fillStyle = 'rgba(255,6,111,0.15)'; sctx.fillRect(0, y, 256, 1); }
  sctx.fillStyle = '#FF066F'; sctx.font = 'bold 22px monospace'; sctx.fillText('SEARCHING...', 32, 90);
  sctx.fillStyle = '#ff4488'; sctx.font = '14px monospace';
  sctx.fillText('OPPONENTS:  3', 32, 130); sctx.fillText('RANGE: ±100', 32, 152); sctx.fillText('TIME: 00:14', 32, 174);
  sctx.fillStyle = '#FF066F'; sctx.fillRect(32, 200, 12, 14);
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.55), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.set(0, 1.35, 0.43);
  terminal.add(screen);
  const screenGlow = new THREE.PointLight(0xff066f, 0.6, 3.5, 2);
  screenGlow.position.set(0, 1.4, 1.0);
  terminal.add(screenGlow);
  terminal.position.set(8, 0, -2.5);
  terminal.rotation.y = -Math.PI / 4;
  terminal.userData = { isClickable: true, id: 'matchmaking' };
  env.add(terminal);
  objects.terminal = terminal;
  objects._screenTex = screenTex;
  objects._sctx = sctx;

  // New Fighter Plinth
  const newFighter = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.50, 16),
    new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.85, metalness: 0.2 }));
  plinth.position.y = 0.25; plinth.castShadow = true;
  newFighter.add(plinth);
  const plusMat = new THREE.MeshBasicMaterial({ color: 0xff066f });
  const plusH = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.06, 0.10), plusMat);
  plusH.position.y = 0.55; newFighter.add(plusH);
  const plusV = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.50), plusMat);
  plusV.position.y = 0.55; newFighter.add(plusV);
  const slotShaft = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.5, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff066f, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  slotShaft.position.y = 2.25; slotShaft.rotation.x = Math.PI;
  newFighter.add(slotShaft);
  newFighter.position.set(-5.5, 0, 5.5);
  newFighter.userData = { isClickable: true, id: 'create' };
  env.add(newFighter);
  objects.newFighter = newFighter;

  // Scoreboard
  const scoreboard = new THREE.Group();
  const sbBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.75, metalness: 0.35 }));
  sbBack.castShadow = true; scoreboard.add(sbBack);
  const sbCv = document.createElement('canvas'); sbCv.width = 400; sbCv.height = 250;
  const sbCtx = sbCv.getContext('2d');
  sbCtx.fillStyle = '#0b0b14'; sbCtx.fillRect(0, 0, 400, 250);
  for (let y = 0; y < 250; y += 3) { sbCtx.fillStyle = 'rgba(255,210,98,0.10)'; sbCtx.fillRect(0, y, 400, 1); }
  sbCtx.fillStyle = '#D4A843'; sbCtx.font = 'bold 22px monospace'; sbCtx.fillText('LEADERBOARD', 20, 40);
  const sbScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.88), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sbCv) }));
  sbScreen.position.z = 0.045; scoreboard.add(sbScreen);
  scoreboard.position.set(10, 2.2, -5);
  scoreboard.lookAt(0, 2.2, 0);
  scoreboard.userData = { isClickable: true, id: 'ratings' };
  env.add(scoreboard);
  objects.scoreboard = scoreboard;

  // Clan Banner
  const clanBanner = new THREE.Group();
  const cbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.55, metalness: 0.7 }));
  cbPole.position.y = 1.4; cbPole.castShadow = true;
  clanBanner.add(cbPole);
  const cbClothCv = document.createElement('canvas'); cbClothCv.width = 128; cbClothCv.height = 256;
  const cbCtx = cbClothCv.getContext('2d');
  cbCtx.fillStyle = '#2a0914'; cbCtx.fillRect(0, 0, 128, 256);
  cbCtx.fillStyle = '#ff066f'; cbCtx.fillRect(0, 90, 128, 24);
  cbCtx.fillStyle = '#D4A843'; cbCtx.font = 'bold 16px monospace'; cbCtx.fillText('CLAN', 38, 40);
  const cbCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cbClothCv), roughness: 0.85, side: THREE.DoubleSide }));
  cbCloth.position.set(0.36, 1.9, 0);
  clanBanner.add(cbCloth);
  clanBanner.position.set(-7, 0, 4.5);
  clanBanner.userData = { isClickable: true, id: 'clan' };
  env.add(clanBanner);
  objects.clanBanner = clanBanner;

  // Shop Locker
  const shopLocker = new THREE.Group();
  const slBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.7, metalness: 0.35, map: makeMetalTexture() }));
  slBody.position.y = 1.1; slBody.castShadow = true;
  shopLocker.add(slBody);
  const slDisplayCv = document.createElement('canvas'); slDisplayCv.width = 256; slDisplayCv.height = 384;
  const slCtx = slDisplayCv.getContext('2d');
  slCtx.fillStyle = '#0a0a12'; slCtx.fillRect(0, 0, 256, 384);
  slCtx.fillStyle = '#FFD262'; slCtx.font = 'bold 22px monospace'; slCtx.fillText('LOCKER', 80, 50);
  slCtx.fillStyle = '#ff066f'; slCtx.font = 'bold 14px monospace'; slCtx.fillText('COSMETICS', 84, 74);
  const slDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.72), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(slDisplayCv) }));
  slDisplay.position.set(0, 1.15, 0.291);
  shopLocker.add(slDisplay);
  shopLocker.position.set(-8.5, 0, 3.5);
  shopLocker.rotation.y = Math.PI / 5;
  shopLocker.userData = { isClickable: true, id: 'shop' };
  env.add(shopLocker);
  objects.shopLocker = shopLocker;

  return { env: env, objects };
}
