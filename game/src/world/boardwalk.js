// The boardwalk for SUNCOAST: HEATLINE.
// One clear job: the waterfront strip — kiosks with roofs, signs and
// lights (never plain cubes), benches and string lights along the sand.

import * as THREE from 'three';
import { mulberry32 } from '../core/config.js';

const KIOSKS = [
  { name: 'TACO', color: 0xff5a5a, x: 152, z: -40 },
  { name: 'SURF', color: 0x4ecdc4, x: 152, z: -12 },
  { name: 'ICE', color: 0x7bdff2, x: 152, z: 16 },
  { name: 'ARCADE', color: 0xffd166, x: 152, z: 44 },
  { name: 'BAIT', color: 0xf7b267, x: 152, z: 72 },
];

export function buildBoardwalk(G) {
  const scene = G.scene;
  const rng = mulberry32(G.seed * 97 + 3);

  // Boardwalk deck along the sand, east of Beachfront Rd.
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.5, 300),
    new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 1 }),
  );
  deck.position.set(154, 0.25, 0);
  deck.receiveShadow = true;
  scene.add(deck);

  for (const k of KIOSKS) {
    const g = new THREE.Group();
    // Counter box with a striped awning roof and a glowing sign board.
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3, 4),
      new THREE.MeshStandardMaterial({ color: k.color, roughness: 0.8 }),
    );
    body.position.y = 1.5; body.castShadow = true;
    g.add(body);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 1.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.9 }),
    );
    roof.position.y = 3.8; roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 1, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    sign.position.set(0, 3.1, 2.1);
    g.add(sign);
    // Warm bulbs under the awning.
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 });
    for (let i = -1; i <= 1; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), bulbMat);
      bulb.position.set(i * 1.6, 2.9, 2.15);
      g.add(bulb);
    }
    // Counter shelf facing the deck.
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.25, 1),
      new THREE.MeshStandardMaterial({ color: 0x5d3a20, roughness: 1 }),
    );
    shelf.position.set(0, 1.1, 2.4);
    g.add(shelf);
    g.position.set(k.x, 0.5, k.z);
    scene.add(g);
    G.buildings.push({ x: k.x, z: k.z, hw: 2.8, hd: 2.5, h: 4.6 });
  }

  // Benches facing the ocean, every 24 m.
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  for (let z = -130; z <= 130; z += 24) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.8), benchMat);
    bench.position.set(157.5, 0.8, z + rng() * 4);
    scene.add(bench);
  }

  // String lights on poles above the deck.
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  for (let z = -140; z <= 140; z += 28) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6), poleMat);
    pole.position.set(151, 2.7, z);
    scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), bulbMat);
    bulb.position.set(151, 5, z);
    scene.add(bulb);
  }
}
