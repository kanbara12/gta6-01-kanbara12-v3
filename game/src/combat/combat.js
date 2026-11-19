// Combat for SUNCOAST: HEATLINE.
// One clear job: the four weapons, shooting, enemy damage and the $150
// bounty per target down. Click to shoot; 1-4 switch weapons; the BAT
// is a short-range swing.

import { WEAPONS, ECONOMY } from '../core/config.js';
import { scarePedestrians } from '../AI/pedestrians.js';

export function fireWeapon(G) {
  const w = WEAPONS[G.weaponIndex || 0];
  const now = performance.now() / 1000;
  if (G._lastShot && now - G._lastShot < w.rate) return;
  G._lastShot = now;
  scarePedestrians(G);
  if (G.audio) G.audio.playShot(w.name);
  G.muzzleFlash = 0.06;

  // Aim from the camera through the crosshair: nearest enemy or police
  // unit inside the weapon's range and a narrow cone ahead.
  const origin = G.actorPosition();
  const yaw = (G.currentCar || G.player).rotation.y;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  let best = null, bestScore = 1e9;
  const targets = [...(G.enemies || []), ...(G.police || [])];
  for (const t of targets) {
    if (t.userData && t.userData.alive === false) continue;
    const dx = t.position.x - origin.x, dz = t.position.z - origin.z;
    const d = Math.hypot(dx, dz);
    if (d > w.range) continue;
    const dot = (dx * fx + dz * fz) / (d || 1);
    if (dot < 0.86) continue; // ~30-degree cone
    const score = d + (1 - dot) * 20;
    if (score < bestScore) { bestScore = score; best = t; }
  }
  if (!best) return;
  const health = (best.userData.health ?? 2) - w.damage;
  best.userData.health = health;
  if (G.audio) G.audio.playHit();
  if (health <= 0) {
    if (best.userData.kind === 'police') {
      // Dropping a unit buys heat, not cash.
      G.heat = Math.min(100, G.heat + 15);
      best.userData.state = 'SEARCH';
      best.position.set(best.position.x + 60, 0, best.position.z + 60);
      best.userData.health = 2;
    } else {
      best.userData.alive = false;
      best.visible = false;
      G.kills = (G.kills || 0) + 1;
      G.money += ECONOMY.killBounty;
      G.showToast(`TARGET DOWN • +$${ECONOMY.killBounty}`);
    }
  }
}

/** Melee swing: the BAT hits anything within 3.2 m in front. */
export function swingBat(G) {
  const origin = G.actorPosition();
  const yaw = G.player.rotation.y;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const e of G.enemies || []) {
    if (!e.userData.alive) continue;
    const dx = e.position.x - origin.x, dz = e.position.z - origin.z;
    const d = Math.hypot(dx, dz);
    if (d < 3.2 && (dx * fx + dz * fz) / (d || 1) > 0.5) {
      e.userData.health -= 1;
      if (e.userData.health <= 0) {
        e.userData.alive = false;
        e.visible = false;
        G.kills = (G.kills || 0) + 1;
        G.money += ECONOMY.killBounty;
        G.showToast(`TARGET DOWN • +$${ECONOMY.killBounty}`);
      }
    }
  }
  if (G.audio) G.audio.playSwing();
}

/** Yard enemies close in and swing back when the player is near. */
export function updateEnemies(G, dt) {
  for (const e of G.enemies || []) {
    if (!e.userData.alive) continue;
    const p = G.actorPosition();
    const d = Math.hypot(e.position.x - p.x, e.position.z - p.z);
    if (d < 30) {
      const yaw = Math.atan2(p.x - e.position.x, p.z - e.position.z);
      e.rotation.y = yaw;
      if (d > 2) {
        e.position.x += Math.sin(yaw) * 3.2 * dt;
        e.position.z += Math.cos(yaw) * 3.2 * dt;
      } else if (!G.shotMode) {
        G.health = Math.max(0, G.health - 8 * dt);
      }
    }
  }
}
