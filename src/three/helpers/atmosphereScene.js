import * as THREE from 'three';

/**
 * Create a renderer with v23 atmosphere settings.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function createAtmosphereRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  renderer.setClearColor(0x070811, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070811, 0.028);

  const camera = new THREE.PerspectiveCamera(
    45, (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight), 0.1, 200
  );
  camera.position.set(11, 5.5, 16);
  camera.lookAt(0, 1.8, 0);

  return { renderer, scene, camera };
}
