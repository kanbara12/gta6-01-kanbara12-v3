// Crew abilities for SUNCOAST: HEATLINE (scout differentiator, Nov 2026).
// One clear job: the Z / X / C crew calls — each with a portrait, a
// cooldown, and a real effect on the run. The HUD panel shows them;
// the loop ticks the cooldowns down.
//
//   Z — RAE (FIXER): "Clean Slate" — drops heat by 40, wanted falls.
//   X — SABLE (LOOKOUT): "Eyes Up" — police and the marker show on the
//       minimap for 12 s, and the next 10 s of heat gain is halved.
//   C — MARLO (DRIVER): "Pit Stop" — refuels to full, repairs the car
//       paint (heat -10) and gives a 6 s speed boost.

import { CREW } from '../core/config.js';

export const ABILITIES = [
  { key: 'z', crew: 'rae', name: 'CLEAN SLATE', cooldown: 45, desc: 'Rae calls in a favour — heat drops fast.' },
  { key: 'x', crew: 'sable', name: 'EYES UP', cooldown: 30, desc: 'Sable marks every patrol on your map.' },
  { key: 'c', crew: 'marlo', name: 'PIT STOP', cooldown: 40, desc: 'Marlo refuels and tunes the GT mid-run.' },
];

export function createAbilities(G) {
  G.abilities = ABILITIES.map((a) => ({ ...a, remaining: 0 }));
  G.eyesUpUntil = 0;
  G.boostUntil = 0;
}

export function updateAbilities(G, dt, now) {
  for (const a of G.abilities) {
    if (a.remaining > 0) a.remaining = Math.max(0, a.remaining - dt);
  }
  void now;
}

export function useAbility(G, key) {
  const a = G.abilities.find((x) => x.key === key);
  if (!a || a.remaining > 0) return false;
  a.remaining = a.cooldown;
  const now = performance.now() / 1000;
  if (key === 'z') {
    G.heat = Math.max(0, G.heat - 40);
    G.showToast('RAE • CLEAN SLATE — HEAT DOWN');
  } else if (key === 'x') {
    G.eyesUpUntil = now + 12;
    G.showToast('SABLE • EYES UP — PATROLS MARKED 12s');
  } else if (key === 'c') {
    G.fuel = 100;
    G.heat = Math.max(0, G.heat - 10);
    G.boostUntil = now + 6;
    G.showToast('MARLO • PIT STOP — FUEL FULL, BOOST 6s');
  }
  if (G.audio) G.audio.playAbility();
  return true;
}

export function abilityState(G) {
  const now = performance.now() / 1000;
  return G.abilities.map((a) => ({
    key: a.key.toUpperCase(),
    name: a.name,
    crew: CREW[a.crew].name,
    color: CREW[a.crew].css,
    ready: a.remaining <= 0,
    remaining: Math.ceil(a.remaining),
    cooldown: a.cooldown,
  }));
}

export function eyesUpActive(G) {
  return (performance.now() / 1000) < (G.eyesUpUntil || 0);
}

export function boostActive(G) {
  return (performance.now() / 1000) < (G.boostUntil || 0);
}
