// The city of Suncoast for SUNCOAST: HEATLINE.
// One clear job: build the world — ground, roads, ocean, beach, dense
// varied-height buildings with lit windows and signs, palms, the pier,
// the ferris wheel and the lighthouse. Every building registers an AABB
// in G.buildings so cars, police and pedestrians collide with it.

import * as THREE from 'three';
import { mulberry32, WORLD } from '../core/config.js';
import { GRID_X, GRID_Z } from './constants.js';
import { buildingTexture, roadTexture, sandTexture, boardwalkTexture } from './textures.js';

const PALETTE = ['#3a4a63', '#5a3d5e', '#2f5d62', '#6e4a3a', '#44546a', '#7a5a3a', '#37474f', '#8a6d3b'];

function canvasTex(canvas, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildWorld(G) {
  const scene = G.scene;
  const rng = mulberry32(G.seed * 31 + 7);
  G.buildings = [];

  // --- Ground: city slab + sand strip + ocean plane -------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({ color: 0x565d68, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 700),
    new THREE.MeshStandardMaterial({ map: canvasTex(sandTexture(), 6, 40), roughness: 1 }),
  );
  sand.rotation.x = -Math.PI / 2; sand.position.set(WORLD.beachX + 18, 0.02, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 700),
    new THREE.MeshStandardMaterial({ color: 0x1a6f8e, roughness: 0.25, metalness: 0.35 }),
  );
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(WORLD.oceanX + 200, -0.4, 0);
  scene.add(ocean);
  G.ocean = ocean;

  // Animated foam strip where the waves meet the sand.
  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 700),
    new THREE.MeshBasicMaterial({ color: 0xdff3f7, transparent: true, opacity: 0.55 }),
  );
  foam.rotation.x = -Math.PI / 2; foam.position.set(WORLD.beachX + 34, 0.05, 0);
  scene.add(foam);
  G.foam = foam;

  // --- Roads: dark asphalt ribbons on the grid -------------------------
  const roadMat = new THREE.MeshStandardMaterial({ map: canvasTex(roadTexture(), 1, 24), roughness: 0.95 });
  for (const x of GRID_X) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(9, 340), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.0, 0); r.receiveShadow = true;
    scene.add(r);
  }
  for (const z of GRID_Z) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(320, 9), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.0, z); r.receiveShadow = true;
    scene.add(r);
  }

  // --- Buildings: dense, varied heights, lit windows, rooftop signs ---
  const facadeMats = PALETTE.map((base, i) => new THREE.MeshStandardMaterial({
    map: canvasTex(buildingTexture(100 + i * 17, base, 0.42), 1, 1), roughness: 0.85,
  }));
  const signColors = [0xff5a5a, 0xffd166, 0x4ecdc4, 0x7bdff2, 0xf7b267, 0xff8fa3];
  const signGeo = new THREE.BoxGeometry(1, 1, 1);
  let placed = 0;
  // Four buildings per block (one in each quadrant) — the city must read
  // dense, not like a few towers on an empty grid.
  const QUADS = [[-13, -13], [-13, 13], [13, -13], [13, 13]];
  for (const gx of GRID_X) {
    for (const gz of GRID_Z) {
      // Skip road intersections, the yard, the marina and the beach road.
      if (Math.abs(gx - 140) < 1) continue;
      if (gx === 72 && gz === -72) continue; // crew yard
      if (gx >= 108 && gz >= 96) continue; // marina
      for (const [ox, oz] of QUADS) {
        if (rng() < 0.18) continue; // plaza gaps, not empty blocks
        const cx = gx + ox;
        const cz = gz + oz;
      if (Math.abs(cx) > 155 || Math.abs(cz) > 155) continue;
      const w = 9 + rng() * 8, d = 9 + rng() * 8;
      // Height varies by district: downtown towers, low old-town roofs.
      const downtown = Math.abs(cx) < 60 && Math.abs(cz) < 60;
      const h = downtown ? 22 + rng() * 46 : 8 + rng() * 16;
      const mat = facadeMats[Math.floor(rng() * facadeMats.length)];
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(cx, h / 2, cz);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      // Rooftop box + parapet so skylines read as varied, not flat.
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.45, 1.6, d * 0.45),
        new THREE.MeshStandardMaterial({ color: 0x22282f, roughness: 1 }),
      );
      roof.position.set(cx, h + 0.8, cz);
      scene.add(roof);
      // One glowing sign on some towers — the city reads at dusk.
      if (rng() < 0.4) {
        const sign = new THREE.Mesh(
          signGeo,
          new THREE.MeshBasicMaterial({ color: signColors[Math.floor(rng() * signColors.length)] }),
        );
        sign.scale.set(w * 0.7, 1.1, 0.4);
        sign.position.set(cx, h * (0.55 + rng() * 0.3), cz + d / 2 + 0.25);
        scene.add(sign);
      }
      G.buildings.push({ x: cx, z: cz, hw: w / 2, hd: d / 2, h });
      placed += 1;
      }
    }
  }
  G.buildingCount = placed;

  // --- Palms along the beach road and the avenues ----------------------
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.9, side: THREE.DoubleSide });
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.35, 7, 6);
  const leafGeo = new THREE.ConeGeometry(2.6, 1.4, 6);
  for (let i = 0; i < 46; i++) {
    const alongBeach = i < 24;
    const x = alongBeach ? 148 + (rng() - 0.5) * 4 : GRID_X[Math.floor(rng() * GRID_X.length)] + 7;
    const z = alongBeach ? -150 + i * 13 + rng() * 5 : -150 + rng() * 300;
    if (Math.abs(x) > 158) continue;
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.5; trunk.castShadow = true;
    palm.add(trunk);
    for (let l = 0; l < 5; l++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 7.2;
      leaf.rotation.z = 1.1;
      leaf.rotation.y = (l / 5) * Math.PI * 2;
      leaf.position.x = Math.cos((l / 5) * Math.PI * 2) * 1.1;
      leaf.position.z = Math.sin((l / 5) * Math.PI * 2) * 1.1;
      palm.add(leaf);
    }
    palm.position.set(x, 0, z);
    palm.rotation.z = (rng() - 0.5) * 0.12;
    scene.add(palm);
  }

  // --- Pier, ferris wheel and lighthouse --------------------------------
  buildPier(G);
  buildFerrisWheel(G);
  buildLighthouse(G);

  // --- Street lights along the avenues ----------------------------------
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c313a, roughness: 0.6, metalness: 0.6 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 });
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 6, 6);
  const lampGeo = new THREE.SphereGeometry(0.35, 8, 6);
  for (const gx of GRID_X) {
    for (const gz of [-108, 0, 108]) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(gx + 5.2, 3, gz);
      scene.add(pole);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(gx + 5.2, 6.1, gz);
      scene.add(lamp);
    }
  }
}

function buildPier(G) {
  const scene = G.scene;
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.8, 90),
    new THREE.MeshStandardMaterial({ map: canvasTex(boardwalkTexture(), 1, 12), roughness: 1 }),
  );
  deck.position.set(172, 0.6, -20);
  deck.receiveShadow = true;
  scene.add(deck);
  const railMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5, metalness: 0.5 });
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 90), railMat);
    rail.position.set(172 + sx * 4.8, 1.4, -20);
    scene.add(rail);
  }
  // Pier-end bait shack with a lit sign.
  const shack = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 5),
    new THREE.MeshStandardMaterial({ color: 0x4a7a8c, roughness: 0.9 }),
  );
  shack.position.set(172, 2.6, -58);
  scene.add(shack);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(5, 1.2, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
  );
  sign.position.set(172, 5, -58);
  scene.add(sign);
}

function buildFerrisWheel(G) {
  const scene = G.scene;
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(14, 0.5, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0xff5a5a, roughness: 0.4, metalness: 0.4 }),
  );
  wheel.add(rim);
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5, metalness: 0.5 });
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 28, 6), spokeMat);
    spoke.rotation.z = (i / 8) * Math.PI;
    wheel.add(spoke);
  }
  const cabinColors = [0xffd166, 0x4ecdc4, 0x7bdff2, 0xff8fa3];
  const cabinGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cabin = new THREE.Mesh(
      cabinGeo,
      new THREE.MeshStandardMaterial({ color: cabinColors[i % 4], roughness: 0.5 }),
    );
    cabin.position.set(Math.cos(a) * 14, Math.sin(a) * 14, 0);
    wheel.add(cabin);
  }
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2, 12),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 }),
  );
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  // Twin support legs.
  const legMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.6 });
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 17, 8), legMat);
    leg.position.set(sx * 5, 8, 0);
    leg.rotation.z = sx * 0.3;
    wheel.add(leg);
  }
  wheel.position.set(150, 17, -60);
  scene.add(wheel);
  G.ferrisWheel = wheel;
  // Wheel sits on the sand by the boardwalk, fully framed from Beachfront Rd.
}

function buildLighthouse(G) {
  const scene = G.scene;
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.2, 26, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.8 }),
  );
  tower.position.set(148, 13, -142);
  tower.castShadow = true;
  scene.add(tower);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.9, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 }),
  );
  band.position.set(148, 18, -142);
  scene.add(band);
  const lampRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 3, 12),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.6 }),
  );
  lampRoom.position.set(148, 27.5, -142);
  scene.add(lampRoom);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(3, 30, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(163, 27.5, -142);
  scene.add(beam);
  G.lighthouseBeam = beam;
  G.buildings.push({ x: 148, z: -142, hw: 3.5, hd: 3.5, h: 29 });
}

/** Slide a circle out of every building AABB it overlaps (x/z only). */
export function collideBuildings(G, pos, radius) {
  for (const b of G.buildings) {
    const dx = pos.x - b.x, dz = pos.z - b.z;
    const ox = b.hw + radius - Math.abs(dx);
    const oz = b.hd + radius - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) pos.x = b.x + Math.sign(dx || 1) * (b.hw + radius);
      else pos.z = b.z + Math.sign(dz || 1) * (b.hd + radius);
    }
  }
  pos.x = Math.max(-158, Math.min(200, pos.x));
  pos.z = Math.max(-158, Math.min(158, pos.z));
}
