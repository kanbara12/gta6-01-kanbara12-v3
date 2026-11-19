// The safehouse for SUNCOAST: HEATLINE.
// One clear job: the delivery destination that heals — stand by the door
// and health comes back. Also the stage-3 delivery point.

import * as THREE from 'three';

export const SAFEHOUSE_POS = { x: -48, z: 56 };

export function buildSafehouse(G) {
  const scene = G.scene;
  const g = new THREE.Group();
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(12, 6, 9),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9 }),
  );
  house.position.y = 3;
  house.castShadow = true;
  g.add(house);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8.5, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0x8a4a3a, roughness: 0.9 }),
  );
  roof.position.y = 7.5; roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 }),
  );
  door.position.set(0, 1.5, 4.6);
  g.add(door);
  // Porch light: the warm dot the player aims for at night.
  const porch = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe6a3 }),
  );
  porch.position.set(1.6, 3.4, 4.7);
  g.add(porch);
  g.position.set(SAFEHOUSE_POS.x, 0, SAFEHOUSE_POS.z);
  scene.add(g);
  G.buildings.push({ x: SAFEHOUSE_POS.x, z: SAFEHOUSE_POS.z, hw: 6, hd: 4.5, h: 6 });
  G.safehouse = { pos: SAFEHOUSE_POS };
}

/** Heal while standing near the safehouse door. */
export function updateSafehouse(G, dt) {
  if (!G.safehouse) return;
  const p = G.actorPosition();
  const d = Math.hypot(p.x - SAFEHOUSE_POS.x, p.z - (SAFEHOUSE_POS.z + 6));
  if (d < 7 && G.health < 100) {
    G.health = Math.min(100, G.health + dt * 12);
  }
}
