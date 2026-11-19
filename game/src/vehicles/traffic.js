// City traffic for SUNCOAST: HEATLINE.
// One clear job: the 18 cars looping the avenues — lane following, a
// slower car ahead, and a stop when something blocks the lane.

import { mulberry32 } from '../core/config.js';
import { GRID_X, GRID_Z } from '../world/constants.js';
import { buildTrafficCar } from './models.js';

const TRAFFIC_COLORS = [0x3a6ea5, 0xc9a227, 0x7a8a99, 0x8a5a3a, 0x4a6b4f, 0x9a9a9a, 0x5a3d5e, 0xb03030];
const TRAFFIC_COUNT = 18;

export function spawnTraffic(G) {
  const rng = mulberry32(G.seed * 53 + 11);
  G.traffic = [];
  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const car = buildTrafficCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
    const axis = rng() < 0.5 ? 'x' : 'z';
    const road = axis === 'x' ? GRID_X[Math.floor(rng() * GRID_X.length)] : GRID_Z[Math.floor(rng() * GRID_Z.length)];
    const along = -150 + rng() * 300;
    const dir = rng() < 0.5 ? 1 : -1;
    const lane = dir > 0 ? -2.7 : 2.7;
    if (axis === 'x') {
      car.position.set(road + lane, 0, along);
      car.rotation.y = dir > 0 ? 0 : Math.PI;
    } else {
      car.position.set(along, 0, road + lane);
      car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    car.userData.axis = axis;
    car.userData.dir = dir;
    car.userData.speed = 7 + rng() * 5;
    car.userData.baseSpeed = car.userData.speed;
    G.scene.add(car);
    G.traffic.push(car);
  }
}

export function updateTraffic(G, dt) {
  for (const c of G.traffic) {
    const u = c.userData;
    if (u.kind === 'stolen') continue; // driven by the player now
    // Slow for the car ahead in the same lane.
    let target = u.baseSpeed;
    for (const o of G.traffic) {
      if (o === c || o.userData.axis !== u.axis || o.userData.dir !== u.dir) continue;
      const gap = u.axis === 'x'
        ? (o.position.z - c.position.z) * u.dir
        : (o.position.x - c.position.x) * u.dir;
      if (gap > 0 && gap < 10) { target = 0; break; }
    }
    // Slow for the hero car blocking the lane.
    if (G.currentCar) {
      const h = G.currentCar.position;
      const gap = u.axis === 'x' ? (h.z - c.position.z) * u.dir : (h.x - c.position.x) * u.dir;
      const lateral = u.axis === 'x' ? Math.abs(h.x - c.position.x) : Math.abs(h.z - c.position.z);
      if (gap > 0 && gap < 9 && lateral < 3) target = 0;
    }
    u.speed += (target - u.speed) * Math.min(1, dt * 2);
    if (u.axis === 'x') {
      c.position.z += u.dir * u.speed * dt;
      if (c.position.z > 158) c.position.z = -158;
      if (c.position.z < -158) c.position.z = 158;
    } else {
      c.position.x += u.dir * u.speed * dt;
      if (c.position.x > 158) c.position.x = -158;
      if (c.position.x < -158) c.position.x = 158;
    }
    // In shot mode the staged traffic loops with the hero, so the
    // composition holds at any capture time instead of driving away.
    // A car moves along the axis its road does NOT name: axis 'x' cars
    // move along z, axis 'z' cars move along x.
    if (G.shotWrap) {
      const moveAxis = u.axis === 'x' ? 'z' : 'x';
      if (moveAxis === G.shotWrap.axis) {
        const w = G.shotWrap;
        if (w.axis === 'x') {
          if (c.position.x > w.max + 40) c.position.x = w.min - 40;
          if (c.position.x < w.min - 40) c.position.x = w.max + 40;
        } else {
          if (c.position.z > w.max + 40) c.position.z = w.min - 40;
          if (c.position.z < w.min - 40) c.position.z = w.max + 40;
        }
      }
    }
  }
}
