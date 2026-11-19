// Marlo's garage for SUNCOAST: HEATLINE.
// One clear job: the repaint bay — drive in, sit quiet, heat bleeds off
// and the car comes out a new colour. Also the evade-stage destination.

import * as THREE from 'three';

export const GARAGE_POS = { x: 14, z: 92 };

export function buildGarage(G) {
  const scene = G.scene;
  const g = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(16, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a7d6b, roughness: 0.9 }),
  );
  walls.position.y = 3;
  g.add(walls);
  // Open bay door (dark recess) facing south, plus a lit sign.
  const bay = new THREE.Mesh(
    new THREE.BoxGeometry(8, 4.5, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 1 }),
  );
  bay.position.set(0, 2.25, 6.1);
  g.add(bay);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1.4, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x4ecdc4 }),
  );
  sign.position.set(0, 6.6, 6.1);
  g.add(sign);
  // Paint booth glow inside the bay.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4),
    new THREE.MeshBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.25 }),
  );
  glow.position.set(0, 2.2, 5.9);
  g.add(glow);
  g.position.set(GARAGE_POS.x, 0, GARAGE_POS.z);
  scene.add(g);
  G.buildings.push({ x: GARAGE_POS.x - 5, z: GARAGE_POS.z, hw: 3, hd: 6, h: 6 });
  G.buildings.push({ x: GARAGE_POS.x + 5, z: GARAGE_POS.z, hw: 3, hd: 6, h: 6 });
  G.garage = { pos: GARAGE_POS, inside: false };
}

/** True while the hero car sits inside the bay; heat drains meanwhile. */
export function updateGarage(G, dt) {
  if (!G.garage || !G.currentCar) { if (G.garage) G.garage.inside = false; return; }
  const p = G.currentCar.position;
  const inside = Math.abs(p.x - GARAGE_POS.x) < 5 && Math.abs(p.z - GARAGE_POS.z) < 6;
  G.garage.inside = inside;
  if (inside && G.heat > 0) {
    G.heat = Math.max(0, G.heat - dt * 3);
    if (G.heat === 0) G.wanted = 0;
  }
}
