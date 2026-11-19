// Arcade driving for SUNCOAST: HEATLINE.
// One clear job: move the hero car — acceleration, steering that grips
// with speed, handbrake drift that pays out, and building collision.

import { clamp } from '../core/config.js';
import { collideBuildings } from '../world/world.js';

const TOP_SPEED = 40;       // ~144 KM/H — the winners' dials read 111-168
const ACCEL = 16;
const BRAKE = 26;
const DRAG = 0.4;

export function updateDriving(G, dt) {
  const car = G.currentCar;
  if (!car) return;
  const input = G.input.axis();
  const u = car.userData;
  const handbrake = G.input.isDown(' ');
  const speed = u.speed || 0;

  // Throttle / brake / coast.
  let accel = 0;
  if (input.forward > 0) accel = ACCEL;
  else if (input.forward < 0) accel = speed > 0.5 ? -BRAKE : -ACCEL * 0.55;
  let next = speed + accel * dt;
  next -= next * DRAG * dt * (handbrake ? 0.4 : 1);
  next = clamp(next, -12, TOP_SPEED);

  // Steering grips less at speed; the handbrake loosens the rear.
  const steerAuthority = clamp(1 - Math.abs(next) / (TOP_SPEED * 1.4), 0.35, 1);
  const steerRate = 2.1 * steerAuthority * (handbrake ? 1.7 : 1);
  const dir = next >= 0 ? 1 : -1;
  car.rotation.y -= input.steer * steerRate * dt * dir;

  // Drift: sideways slide + payout while the handbrake is held at speed.
  if (handbrake && Math.abs(next) > 12 && input.steer !== 0) {
    G.driftTime = (G.driftTime || 0) + dt;
    if (G.driftTime > 0.8) {
      G.money += 12 * dt;
      G.driftScore = (G.driftScore || 0) + 12 * dt;
    }
    if (G.audio && !G.audio.driftPlaying) G.audio.playDrift();
  } else {
    G.driftTime = 0;
  }

  const yaw = car.rotation.y;
  car.position.x += Math.sin(yaw) * next * dt;
  car.position.z += Math.cos(yaw) * next * dt;
  collideBuildings(G, car.position, 1.6);
  u.speed = next;

  // Wheels spin; brake lights glow under braking.
  const wheels = car.userData.wheels || [];
  for (const w of wheels) w.rotation.x += next * dt * 2.2;
  if (car.userData.brakeMat) {
    car.userData.brakeMat.color.setHex(input.forward < 0 || handbrake ? 0xff5544 : 0xff2211);
  }
  G.speedKmh = Math.abs(next) * 3.6;
}

/** On-foot movement: WASD walks the player, colliding with buildings. */
export function updateOnFoot(G, dt) {
  const input = G.input.axis();
  if (input.forward === 0 && input.steer === 0) return;
  const yaw = G.player.rotation.y;
  // Camera-relative: forward is where the player faces; A/D strafe-turn.
  const turn = input.steer * 2.4 * dt;
  G.player.rotation.y -= turn;
  const fwd = input.forward;
  const speed = 6;
  G.player.position.x += Math.sin(G.player.rotation.y) * fwd * speed * dt;
  G.player.position.z += Math.cos(G.player.rotation.y) * fwd * speed * dt;
  collideBuildings(G, G.player.position, 0.6);
  // Walk bob.
  G.player.position.y = Math.abs(Math.sin(performance.now() * 0.012)) * 0.06;
}
