// Police helicopter SKY-1 for SUNCOAST: HEATLINE.
// One clear job: the eye in the sky at wanted 3 and up — a tight orbit
// above the player, rotor spinning, spotlight cone sweeping the road,
// close enough to read in a screenshot (never a HUD-only entry).

import { buildHelicopter } from '../vehicles/models.js';

export function spawnHelicopter(G) {
  const heli = buildHelicopter();
  heli.position.set(0, 42, -40);
  G.scene.add(heli);
  G.heli = { group: heli, angle: 0, active: false };
  return G.heli;
}

export function updateHelicopter(G, dt) {
  if (!G.heli) return;
  const h = G.heli;
  const active = G.wanted >= 3;
  h.active = active;
  h.group.visible = active || G.shotMode;
  if (!h.group.visible) return;

  // Tight, LOW orbit: 30 m out, 16 m up, drifting slowly — far enough
  // ahead to sit fully in frame, close enough to read (never HUD-only).
  h.angle += dt * 0.12;
  const p = G.actorPosition();
  const r = 30;
  h.group.position.set(
    p.x + Math.cos(h.angle) * r,
    16 + Math.sin(performance.now() * 0.001) * 1.5,
    p.z + Math.sin(h.angle) * r,
  );
  // Nose toward the player; the spotlight aims at the road below.
  h.group.rotation.y = Math.atan2(p.x - h.group.position.x, p.z - h.group.position.z);
  // Rotor spin + disc shimmer.
  const rotor = h.group.userData.rotor;
  if (rotor) rotor.rotation.y += dt * 22;
  // Spotlight sweeps: the cone swings across the road ahead of the car.
  const spot = h.group.userData.spot;
  const cone = h.group.userData.cone;
  if (spot) {
    const sweep = Math.sin(performance.now() * 0.0009) * 8;
    spot.target.position.set(sweep, -16, 6 + Math.cos(performance.now() * 0.0007) * 5);
    spot.target.updateMatrixWorld();
  }
  if (cone) {
    cone.rotation.z = Math.sin(performance.now() * 0.0009) * 0.25;
  }
}
