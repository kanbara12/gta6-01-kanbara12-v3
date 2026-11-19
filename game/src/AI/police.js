// Police pursuit for SUNCOAST: HEATLINE.
// One clear job: the wanted system and the named patrol units — PATROL,
// PURSUIT with building collision avoidance and line-of-sight checks,
// RAM, and SEARCH when the player breaks away.

import { mulberry32, POLICE_CALLSIGNS, clamp } from '../core/config.js';
import { buildPoliceCar } from '../vehicles/models.js';
import { collideBuildings } from '../world/world.js';

export function wantedFromHeat(heat) {
  if (heat <= 0) return 0;
  if (heat <= 20) return 1;
  if (heat <= 40) return 2;
  if (heat <= 60) return 3;
  if (heat <= 85) return 4;
  return 5;
}

export function spawnPoliceCar(scene, near, rng, used) {
  const free = POLICE_CALLSIGNS.filter((c) => !used.includes(c));
  const callsign = free.length ? free[Math.floor(rng() * free.length)] : POLICE_CALLSIGNS[0];
  const car = buildPoliceCar(callsign);
  car.position.set(near.x + (rng() - 0.5) * 60, 0, near.z + (rng() - 0.5) * 60);
  scene.add(car);
  return car;
}

export function updatePolice(G, dt) {
  G.wanted = wantedFromHeat(G.heat);
  const want = Math.min(G.wanted, 4);
  // Spawn units up to the wanted level; despawn the extras when heat drops.
  const rng = mulberry32(1234 + (G.frame || 0));
  while (G.police.length < want) {
    G.police.push(spawnPoliceCar(G.scene, G.actorPosition(), rng, G.police.map((c) => c.userData.callsign)));
  }
  while (G.police.length > want) {
    const c = G.police.pop();
    G.scene.remove(c);
  }
  const target = G.actorPosition();
  for (const c of G.police) {
    const u = c.userData;
    const d = Math.hypot(c.position.x - target.x, c.position.z - target.z);
    const sees = hasLineOfSight(G, c.position, target);
    if (G.wanted === 0) { u.state = 'SEARCH'; }
    else if (d < 6) { u.state = 'RAM'; }
    else if (sees || d < 40) { u.state = 'PURSUIT'; }
    else if (u.state === 'PURSUIT') { u.state = 'SEARCH'; }

    let speed = 0;
    if (u.state === 'PURSUIT') speed = 26 + G.wanted * 1.5;
    else if (u.state === 'RAM') speed = 30;
    else if (u.state === 'SEARCH') speed = 10;
    else speed = 8;

    // Steer toward the target (or a search wander point); avoid buildings
    // by steering around the AABB edge instead of driving into it.
    let tx = target.x, tz = target.z;
    if (u.state === 'SEARCH') {
      if (!u.searchX || Math.hypot(c.position.x - u.searchX, c.position.z - u.searchZ) < 8) {
        u.searchX = target.x + (Math.random() - 0.5) * 80;
        u.searchZ = target.z + (Math.random() - 0.5) * 80;
      }
      tx = u.searchX; tz = u.searchZ;
    }
    const desired = Math.atan2(tx - c.position.x, tz - c.position.z);
    // Building avoidance: if a building sits in the way, bias the heading.
    const ahead = buildingAhead(G, c.position, desired);
    const steerTo = ahead ? desired + ahead : desired;
    let dy = steerTo - c.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    c.rotation.y += clamp(dy, -2.2 * dt, 2.2 * dt);
    c.position.x += Math.sin(c.rotation.y) * speed * dt;
    c.position.z += Math.cos(c.rotation.y) * speed * dt;
    collideBuildings(G, c.position, 1.6);
    u.speed = speed;

    // Flash the light bar.
    const on = Math.floor(performance.now() / 280) % 2 === 0;
    if (u.redLight) u.redLight.material.color.setHex(on ? 0xff2222 : 0x550000);
    if (u.blueLight) u.blueLight.material.color.setHex(on ? 0x112266 : 0x2244ff);

    // Ram damage: touching the hero car at speed hurts.
    if (G.currentCar && d < 3.2 && u.state === 'RAM') {
      G.health = Math.max(0, G.health - 12 * dt);
      if (G.audio) G.audio.playCrash();
    }
  }

  // Heat decays when the player stays out of sight and out of trouble.
  if (G.wanted > 0 && !G.shotMode) {
    G.heat = Math.max(0, G.heat - dt * 0.55);
  }
}

/** Line of sight: sample the segment; a building AABB blocks it. */
export function hasLineOfSight(G, from, to) {
  for (let t = 0.1; t < 1; t += 0.1) {
    const x = from.x + (to.x - from.x) * t;
    const z = from.z + (to.z - from.z) * t;
    for (const b of G.buildings) {
      if (Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd) return false;
    }
  }
  return true;
}

/** +0.9 / -0.9 bias when a building blocks the heading, else 0. */
function buildingAhead(G, pos, heading) {
  const ax = pos.x + Math.sin(heading) * 10;
  const az = pos.z + Math.cos(heading) * 10;
  for (const b of G.buildings) {
    if (Math.abs(ax - b.x) < b.hw + 2 && Math.abs(az - b.z) < b.hd + 2) {
      // Steer to whichever side is clearer.
      const leftX = pos.x + Math.sin(heading - 0.8) * 12;
      const leftZ = pos.z + Math.cos(heading - 0.8) * 12;
      let leftClear = true;
      for (const b2 of G.buildings) {
        if (Math.abs(leftX - b2.x) < b2.hw + 2 && Math.abs(leftZ - b2.z) < b2.hd + 2) leftClear = false;
      }
      return leftClear ? -0.9 : 0.9;
    }
  }
  return 0;
}
