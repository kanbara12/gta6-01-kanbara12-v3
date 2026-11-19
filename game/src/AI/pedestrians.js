// Pedestrians for SUNCOAST: HEATLINE.
// One clear job: the 20 walkers on the sidewalks — walking paths, idle
// pauses, and scattering away from speeding cars and gunfire.

import * as THREE from 'three';
import { mulberry32 } from '../core/config.js';
import { GRID_X, GRID_Z } from '../world/constants.js';

const PED_COUNT = 20;
const SHIRT_COLORS = [0xff5a5a, 0xffd166, 0x4ecdc4, 0x7bdff2, 0xf7b267, 0xff8fa3, 0x9b7ede, 0x8ac926];

export function spawnPedestrians(G) {
  const rng = mulberry32(G.seed * 71 + 5);
  G.peds = [];
  for (let i = 0; i < PED_COUNT; i++) {
    const p = new THREE.Group();
    const shirt = SHIRT_COLORS[i % SHIRT_COLORS.length];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.9, 0.35),
      new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.9 }),
    );
    body.position.y = 1.05;
    p.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.8 }),
    );
    head.position.y = 1.75;
    p.add(head);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.9 });
    for (const sx of [-0.14, 0.14]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), legMat);
      leg.position.set(sx, 0.35, 0);
      p.add(leg);
    }
    p.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    // Start on a sidewalk beside a random road.
    const axis = rng() < 0.5 ? 'x' : 'z';
    const road = axis === 'x' ? GRID_X[Math.floor(rng() * GRID_X.length)] : GRID_Z[Math.floor(rng() * GRID_Z.length)];
    const along = -140 + rng() * 280;
    if (axis === 'x') p.position.set(road + 6.5, 0, along);
    else p.position.set(along, 0, road + 6.5);
    p.userData.dirX = axis === 'x' ? 0 : (rng() < 0.5 ? 1 : -1);
    p.userData.dirZ = axis === 'x' ? (rng() < 0.5 ? 1 : -1) : 0;
    p.userData.speed = 1.2 + rng() * 0.8;
    p.userData.flee = 0;
    p.userData.pause = rng() * 2;
    p.rotation.y = Math.atan2(p.userData.dirX, p.userData.dirZ);
    G.scene.add(p);
    G.peds.push(p);
  }
}

export function updatePedestrians(G, dt) {
  const hero = G.actorPosition();
  const heroSpeed = G.currentCar ? Math.abs(G.currentCar.userData.speed || 0) : 0;
  for (const p of G.peds) {
    const u = p.userData;
    const dHero = Math.hypot(p.position.x - hero.x, p.position.z - hero.z);
    // Scatter: a speeding car nearby, or a gunshot, sends them running.
    if ((heroSpeed > 14 && dHero < 12) || G.gunshotFlee > 0) {
      if (u.flee <= 0) {
        const away = Math.atan2(p.position.x - hero.x, p.position.z - hero.z);
        u.dirX = Math.sin(away); u.dirZ = Math.cos(away);
        u.flee = 2.5;
      }
    }
    if (u.flee > 0) {
      u.flee -= dt;
      p.position.x += u.dirX * 4.5 * dt;
      p.position.z += u.dirZ * 4.5 * dt;
      p.rotation.y = Math.atan2(u.dirX, u.dirZ);
    } else if (u.pause > 0) {
      u.pause -= dt;
    } else {
      p.position.x += u.dirX * u.speed * dt;
      p.position.z += u.dirZ * u.speed * dt;
      p.rotation.y = Math.atan2(u.dirX, u.dirZ);
      // Turn at the block ends; occasionally pause to look around.
      if (p.position.x > 155 || p.position.x < -155 || p.position.z > 155 || p.position.z < -155) {
        u.dirX *= -1; u.dirZ *= -1;
      }
      if (Math.random() < dt * 0.05) u.pause = 1 + Math.random() * 2;
    }
    p.position.x = Math.max(-156, Math.min(156, p.position.x));
    p.position.z = Math.max(-156, Math.min(156, p.position.z));
    // Walk bob.
    p.position.y = Math.abs(Math.sin(performance.now() * 0.008 + p.position.x)) * 0.04;
  }
  if (G.gunshotFlee > 0) G.gunshotFlee -= dt;
}

/** Called by combat: every nearby pedestrian scatters. */
export function scarePedestrians(G) {
  G.gunshotFlee = 2;
}
