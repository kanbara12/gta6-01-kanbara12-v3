// Street-cash stashes for SUNCOAST: HEATLINE.
// One clear job: the glowing cash cases hidden around the city — walk or
// drive over one and it pays $250, once each.

import * as THREE from 'three';
import { ECONOMY } from '../core/config.js';

const STASH_SPOTS = [
  { x: 136, z: 20 },   // by the dock, west of the beach road
  { x: -30, z: -30 },  // downtown alley
  { x: 60, z: 84 },    // marina walk
  { x: -120, z: -96 }, // north-west corner
  { x: 20, z: -120 },  // palm row
  { x: -90, z: 120 },  // old town
];

export function buildStashes(G) {
  const scene = G.scene;
  G.stashes = [];
  const caseGeo = new THREE.BoxGeometry(1.1, 0.7, 0.8);
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x2f6f4f, roughness: 0.5, metalness: 0.3 });
  const glowGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.15, 20);
  for (const s of STASH_SPOTS) {
    const g = new THREE.Group();
    const c = new THREE.Mesh(caseGeo, caseMat);
    c.position.y = 0.45; c.castShadow = true;
    g.add(c);
    const glow = new THREE.Mesh(
      glowGeo,
      new THREE.MeshBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.35 }),
    );
    glow.position.y = 0.1;
    g.add(glow);
    g.position.set(s.x, 0, s.z);
    scene.add(g);
    G.stashes.push({ group: g, x: s.x, z: s.z, taken: false });
  }
}

export function updateStashes(G) {
  if (!G.stashes) return;
  const p = G.actorPosition();
  for (const s of G.stashes) {
    if (s.taken) continue;
    if (Math.hypot(p.x - s.x, p.z - s.z) < 2.2) {
      s.taken = true;
      s.group.visible = false;
      G.money += ECONOMY.stashValue;
      G.showToast(`STASH FOUND • +$${ECONOMY.stashValue}`);
      if (G.audio) G.audio.playPickup();
    }
  }
}
