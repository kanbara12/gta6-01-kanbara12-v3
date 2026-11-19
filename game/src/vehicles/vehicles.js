// The hero car and car theft for SUNCOAST: HEATLINE.
// One clear job: spawn the HEATLINE GT, enter/exit it, and steal parked
// traffic cars (stealing adds 1 wanted). The car itself is built in
// models.js; the driving feel lives in driving.js.

import { buildHeroCar } from './models.js';

export const HERO_SPAWN = { x: 8.5, z: 8.5, yaw: Math.PI / 2 };

export function spawnHeroCar(G) {
  const car = buildHeroCar();
  car.position.set(HERO_SPAWN.x, 0, HERO_SPAWN.z);
  car.rotation.y = HERO_SPAWN.yaw;
  G.scene.add(car);
  G.playerCar = car;
  return car;
}

/** Nearest drivable car to a point (hero or traffic), within range. */
export function nearestCar(G, pos, range) {
  let best = null, bestD = range;
  const cars = [G.playerCar, ...(G.traffic || [])].filter(Boolean);
  for (const c of cars) {
    if (c === G.currentCar) continue;
    const d = Math.hypot(c.position.x - pos.x, c.position.z - pos.z);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Enter the nearest car; stealing a traffic car adds wanted. */
export function enterCar(G, car) {
  if (!car) return false;
  G.currentCar = car;
  G.player.visible = false;
  if (car.userData.kind === 'traffic') {
    car.userData.kind = 'stolen';
    G.wanted = Math.min(5, G.wanted + 1);
    G.heat = Math.min(100, G.heat + 20);
    G.showToast('CAR STOLEN • WANTED +1');
    if (G.audio) G.audio.playSirenBlip();
  }
  if (G.audio) G.audio.playDoor();
  return true;
}

export function exitCar(G) {
  if (!G.currentCar) return;
  const car = G.currentCar;
  const yaw = car.rotation.y;
  const px = car.position.x + Math.sin(yaw + Math.PI / 2) * 2.5;
  const pz = car.position.z + Math.cos(yaw + Math.PI / 2) * 2.5;
  G.player.position.set(px, 0, pz);
  G.player.rotation.y = yaw;
  G.player.visible = true;
  G.currentCar = null;
  if (G.audio) G.audio.playDoor();
}

/** E key: enter the nearest car, or step out of the one you are in. */
export function handleEnterExit(G) {
  if (G.currentCar) { exitCar(G); return; }
  const car = nearestCar(G, G.player.position, 4.5);
  if (car) enterCar(G, car);
}
