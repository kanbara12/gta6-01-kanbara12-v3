// People for SUNCOAST: HEATLINE.
// One clear job: the characters — the player on foot, the crew (Rae,
// Sable, Marlo) standing at their spots, and the three yard enemies.

import * as THREE from 'three';
import { CREW } from '../core/config.js';

export function buildPlayer(G) {
  const p = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.95, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.85 }),
  );
  body.position.y = 1.05;
  p.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.8 }),
  );
  head.position.y = 1.8;
  p.add(head);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.27, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 }),
  );
  cap.position.y = 1.98;
  p.add(cap);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.9 });
  for (const sx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.24), legMat);
    leg.position.set(sx, 0.35, 0);
    p.add(leg);
  }
  // Right arm holds the current weapon (a small gun block, swapped by HUD).
  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.3, metalness: 0.8 }),
  );
  gun.position.set(0.42, 1.15, 0.3);
  p.add(gun);
  p.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  p.position.set(8.5, 0, 12);
  p.rotation.y = Math.PI / 2;
  G.scene.add(p);
  G.player = p;
  return p;
}

/** A crew member standing at a mission point, coloured by their role. */
export function spawnCrewMember(G, key, x, z) {
  const c = CREW[key];
  const p = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.95, 0.38),
    new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.85 }),
  );
  body.position.y = 1.05;
  p.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.8 }),
  );
  head.position.y = 1.8;
  p.add(head);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.9 });
  for (const sx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.24), legMat);
    leg.position.set(sx, 0.35, 0);
    p.add(leg);
  }
  p.position.set(x, 0, z);
  p.rotation.y = Math.PI;
  p.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  G.scene.add(p);
  return p;
}

export function spawnCrew(G) {
  G.crew = {
    rae: spawnCrewMember(G, 'rae', 8.5, 8.5),
    sable: spawnCrewMember(G, 'sable', 44.5, 8.5),
    marlo: spawnCrewMember(G, 'marlo', 132, 96),
  };
}

/** The three hostile yard crew for the Street Sweep stage. */
export function spawnYardEnemies(G) {
  G.enemies = [];
  const spots = [
    { x: 76, z: -68 }, { x: 68, z: -74 }, { x: 80, z: -78 },
  ];
  for (const s of spots) {
    const e = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.95, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x6b2d2d, roughness: 0.9 }),
    );
    body.position.y = 1.05;
    e.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xc9a184, roughness: 0.8 }),
    );
    head.position.y = 1.8;
    e.add(head);
    const bat = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.9 }),
    );
    bat.position.set(0.4, 1.2, 0.3);
    e.add(bat);
    e.position.set(s.x, 0, s.z);
    e.userData.alive = true;
    e.userData.health = 2;
    e.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    G.scene.add(e);
    G.enemies.push(e);
  }
  return G.enemies;
}

export function createCharacter(G, key, x, z) {
  return spawnCrewMember(G, key, x, z);
}
