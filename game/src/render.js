// Rendering: the three.js renderer, the golden-hour sun, the warm fill and
// the long shadows that make the city read as a place, not a diorama.
import * as THREE from 'three';

export function createRender(canvas, hour) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xff9e5e, 120, 420);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

  // The sun: low, warm and long-shadowed at golden hour; high and white at noon.
  const sun = new THREE.DirectionalLight(0xffb36b, 2.6);
  sun.position.set(-90, 42, -60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
  sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x3a2a3a, 0.9);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0x7fb3ff, 0.35);
  fill.position.set(80, 60, 90);
  scene.add(fill);

  function setHour(h) {
    if (h < 16) {
      sun.color.set(0xfff2d0); sun.intensity = 3.0;
      sun.position.set(40, 120, 30);
      hemi.intensity = 1.1;
      scene.fog.color.set(0xbfe8ff);
    } else if (h < 19.5) {
      sun.color.set(0xffb36b); sun.intensity = 2.6;
      sun.position.set(-90, 42, -60);
      hemi.intensity = 1.15;
      scene.fog.color.set(0xff9e5e);
    } else {
      sun.color.set(0x8fa8ff); sun.intensity = 0.7;
      sun.position.set(30, 80, -40);
      hemi.intensity = 0.45;
      scene.fog.color.set(0x2a1a4a);
    }
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function followTarget(target) {
    sun.target.position.copy(target);
    sun.target.updateMatrixWorld();
  }

  resize();
  window.addEventListener('resize', resize);
  setHour(hour);

  return { renderer, scene, camera, setHour, resize, followTarget };
}
