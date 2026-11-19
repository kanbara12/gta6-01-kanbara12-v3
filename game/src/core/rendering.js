// Renderer, camera and the day cycle for SUNCOAST: HEATLINE.
// One clear job: make the picture — WebGL renderer, chase camera, sun,
// sky colour and the four times of day (golden hour, midday, dusk, night).

import * as THREE from 'three';
import { clamp, lerp } from './config.js';

export const TIMES_OF_DAY = {
  golden: { sun: 0xffb36b, sky: 0xff9e64, fog: 0xe88a5a, ambient: 0.55, sunI: 1.9, hemiI: 1.0 },
  midday: { sun: 0xfff2d0, sky: 0x7ec8e3, fog: 0x9fd4e8, ambient: 0.8, sunI: 2.1, hemiI: 1.1 },
  dusk: { sun: 0xff7a4d, sky: 0x5a3d6e, fog: 0x6e4a6e, ambient: 0.4, sunI: 1.3, hemiI: 0.6 },
  night: { sun: 0x9db8ff, sky: 0x0b1026, fog: 0x11182e, ambient: 0.25, sunI: 0.6, hemiI: 0.4 },
};

export function createRendering(canvas, quality) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.antialias });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(TIMES_OF_DAY.golden.sky);
  scene.fog = new THREE.Fog(TIMES_OF_DAY.golden.fog, 90, 420);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(0, 8, -18);

  const sun = new THREE.DirectionalLight(TIMES_OF_DAY.golden.sun, TIMES_OF_DAY.golden.sunI);
  sun.position.set(-60, 40, -80);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -180; sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180;
  sun.shadow.camera.far = 500;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffd9a0, 0x2a3f55, TIMES_OF_DAY.golden.hemiI));

  // A visible sun disc + a few soft clouds, so the sky is never a flat
  // colour: the winners' frames all show the sun sitting on the horizon.
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(20, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }),
  );
  scene.add(sunDisc);
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(34, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.35, fog: false }),
  );
  scene.add(sunGlow);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffe8d8, transparent: true, opacity: 0.55, fog: false });
  const clouds = [];
  const cloudSeed = [[-120, 70, -260], [40, 85, -300], [180, 65, -240], [-40, 95, 260], [120, 75, 280], [-180, 80, 120], [220, 90, -80], [0, 70, 60]];
  for (const [cx, cy, cz] of cloudSeed) {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(70, 14), cloudMat);
    cloud.position.set(cx, cy, cz);
    scene.add(cloud);
    clouds.push(cloud);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const R = { renderer, scene, camera, sun, timeOfDay: 'golden' };

  R.setTimeOfDay = (name, instant) => {
    const t = TIMES_OF_DAY[name] || TIMES_OF_DAY.golden;
    R.timeOfDay = name;
    scene.background.setHex(t.sky);
    scene.fog.color.setHex(t.fog);
    sun.color.setHex(t.sun);
    sun.intensity = t.sunI;
    const hemi = scene.children.find((c) => c.isHemisphereLight);
    if (hemi) hemi.intensity = t.hemiI;
    void instant;
  };

  /** Low chase camera: close and slightly to the side, so the hero car
   *  fills the frame instead of sitting small in the middle distance. */
  R.updateChaseCamera = (G, dt) => {
    const target = G.currentCar || G.player;
    const yaw = target.rotation.y;
    const dist = G.shotCamDist || (G.currentCar ? 8.2 : 6.0);
    const height = G.shotCamHeight || (G.currentCar ? 3.0 : 2.6);
    const side = G.currentCar ? 1.1 : 0.0; // offset to the side for cars
    const bx = Math.sin(yaw), bz = Math.cos(yaw);
    const px = -Math.cos(yaw), pz = Math.sin(yaw); // right vector
    const want = new THREE.Vector3(
      target.position.x - bx * dist + px * side,
      target.position.y + height,
      target.position.z - bz * dist + pz * side,
    );
    const k = 1 - Math.exp(-dt * 7);
    camera.position.lerp(want, k);
    const look = new THREE.Vector3(
      target.position.x + bx * 4,
      target.position.y + 1.4,
      target.position.z + bz * 4,
    );
    camera.lookAt(look);
  };

  R.updateSun = (G) => {
    // Sun direction is staged per scene; default golden-hour west sun.
    const d = G.sunDir || new THREE.Vector3(-0.7, 0.35, -0.6).normalize();
    sun.position.set(d.x * 160, Math.max(d.y, 0.08) * 160, d.z * 160);
    // Sun disc + glow sit far along the same direction, facing the camera.
    sunDisc.position.set(d.x * 380, Math.max(d.y, 0.06) * 380, d.z * 380);
    sunGlow.position.copy(sunDisc.position);
    sunDisc.lookAt(camera.position);
    sunGlow.lookAt(camera.position);
    for (const c of clouds) c.lookAt(camera.position);
  };

  return R;
}
