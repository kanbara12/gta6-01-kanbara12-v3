// The HUD for SUNCOAST: HEATLINE.
// One clear job: every panel the player reads — mission card with STAGE,
// NEXT and timer, named police panel (with AIR-1 SPOTLIGHT when SKY-1
// is up), radio with station + song, weapon slots, REP bar, round
// minimap with district and street names, money, big speedometer with
// fuel gauge and car condition, crew-ability panel, and floating
// drift / near-miss score popups.

import { WEAPONS } from '../core/config.js';
import { districtAt, streetAt } from '../world/constants.js';
import { getMissionProgress } from '../missions/missions.js';
import { abilityState, eyesUpActive } from './abilities.js';

function el(id) { return document.getElementById(id); }

export function buildHud(G) {
  G.hud = { lastUpdate: 0, popups: [] };
  // Floating score popups live in a layer over the canvas.
  let layer = el('popupLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'popupLayer';
    document.body.appendChild(layer);
  }
  G.hud.popupLayer = layer;
}

/** A floating score popup: "+$50 NEAR MISS" drifting up and fading. */
export function showScorePopup(G, text, kind) {
  const layer = G.hud && G.hud.popupLayer;
  if (!layer) return;
  const d = document.createElement('div');
  d.className = `scorePopup ${kind || ''}`;
  d.textContent = text;
  d.style.left = `${42 + Math.random() * 16}%`;
  d.style.top = `${38 + Math.random() * 10}%`;
  layer.appendChild(d);
  setTimeout(() => d.remove(), 1600);
  if (G.hud.popups.length > 12) G.hud.popups.shift();
  G.hud.popups.push(d);
}

export function updateHud(G) {
  const now = performance.now();
  if (now - G.hud.lastUpdate < 120) return; // 8 Hz is plenty for text
  G.hud.lastUpdate = now;
  const p = getMissionProgress(G);
  const mm = (id, txt) => { const e = el(id); if (e) e.textContent = txt; };

  mm('hudMoney', `$${Math.floor(G.money).toLocaleString('en-US')}`);
  mm('hudRep', `REP ${G.rep || 0}`);
  mm('hudHealth', `HP ${Math.round(G.health)}`);
  mm('hudWanted', '★'.repeat(G.wanted) + '☆'.repeat(5 - G.wanted));
  mm('hudMissionTitle', `JOB ${p.stageLabel} • ${p.title.toUpperCase()}`);
  mm('hudMissionObj', p.objective);
  mm('hudMissionNext', p.stage + 1 < 8 ? `NEXT: ${['A Favor in the Heat','Loose Cargo','The Quiet Exit','Street Sweep','No Witnesses','Last Light','Saltwater Exchange','Northlight Run'][p.stage + 1].toUpperCase()}` : 'NEXT: NEW CONTRACT');
  mm('hudMissionTimer', `⏱ ${p.elapsed}s / PAR ${p.parTime}s${p.elapsed > p.parTime ? ' — OVER PAR' : ''}`);
  mm('hudMissionDist', p.type === 'combat' ? `TARGETS ${p.killsDone}/${p.killsNeeded}` : `MARKER ${p.distanceToMarker}m`);
  mm('hudRadio', `${G.radio.station()} • ${G.radio.currentSong().title}`);
  mm('hudSpeed', `${Math.round(G.speedKmh || 0)}`);
  mm('hudSpeedUnit', 'KM/H');
  mm('hudFuel', `FUEL ${Math.round(G.fuel || 0)}%`);
  mm('hudCondition', `COND ${Math.round(G.health)}%`);
  const pos = G.actorPosition();
  const d = districtAt(pos.x, pos.z);
  const s = streetAt(pos.x, pos.z);
  mm('hudDistrict', `${d.name} • ${s.name}`);
  mm('hudClock', `${G.timeOfDay.toUpperCase()} • ${G.jobsCompleted || 0} JOBS DONE`);

  // Police panel: named units in play + AIR-1 when the heli is up.
  const units = (G.police || []).map((c) => c.userData.callsign).join('  ');
  const air = G.heli && G.heli.active ? '  •  AIR-1 SKY-1 SPOTLIGHT' : '';
  const eyes = eyesUpActive(G) ? '  •  EYES UP' : '';
  mm('hudPolice', G.wanted > 0 ? `POLICE: ${units || '—'}${air}${eyes}` : 'POLICE: CLEAR');

  // Weapon slots: 4, current highlighted.
  const slots = el('hudWeapons');
  if (slots) {
    slots.innerHTML = WEAPONS.map((w, i) =>
      `<span class="wslot${i === G.weaponIndex ? ' active' : ''}">${i + 1} ${w.name}</span>`).join('');
  }

  // Crew abilities: portrait dot + name + cooldown or READY.
  const ab = el('hudAbilities');
  if (ab) {
    ab.innerHTML = abilityState(G).map((a) =>
      `<div class="ability${a.ready ? ' ready' : ''}"><span class="aport" style="background:${a.color}">${a.crew[0]}</span><span class="akey">${a.key}</span><span class="aname">${a.name}</span><span class="acd">${a.ready ? 'READY' : a.remaining + 's'}</span></div>`).join('');
  }

  // REP bar width.
  const repBar = el('hudRepBar');
  if (repBar) repBar.style.width = `${Math.min(100, (G.rep || 0))}%`;
  const fuelBar = el('hudFuelBar');
  if (fuelBar) fuelBar.style.width = `${Math.max(0, G.fuel || 0)}%`;
  fuelBar.className = 'fuelFill' + ((G.fuel || 0) < 20 ? ' low' : '');

  drawMinimap(G);
}

/** Round minimap: roads, districts, marker, player, traffic, police. */
export function drawMinimap(G) {
  const cv = el('minimap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = cv.width;
  const R = S / 2;
  ctx.clearRect(0, 0, S, S);
  // Round face.
  ctx.save();
  ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#0e1420'; ctx.fillRect(0, 0, S, S);
  const toMap = (x, z) => [R + (x / 170) * R, R + (z / 170) * R];
  // Ocean + beach on the east edge.
  ctx.fillStyle = '#1a6f8e';
  ctx.fillRect(R + (150 / 170) * R, 0, S, S);
  ctx.fillStyle = '#e6c98f';
  ctx.fillRect(R + (138 / 170) * R, 0, (12 / 170) * R, S);
  // Roads.
  ctx.strokeStyle = '#3a4150'; ctx.lineWidth = 3;
  for (const x of [-144, -108, -72, -36, 0, 36, 72, 108, 140]) {
    const [mx] = toMap(x, 0);
    ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, S); ctx.stroke();
  }
  for (const z of [-144, -108, -72, -36, 0, 36, 72, 108, 144]) {
    const [, mz] = toMap(0, z);
    ctx.beginPath(); ctx.moveTo(0, mz); ctx.lineTo(S, mz); ctx.stroke();
  }
  // Buildings as dots.
  ctx.fillStyle = '#5a6b84';
  for (const b of G.buildings || []) {
    const [mx, mz] = toMap(b.x, b.z);
    ctx.fillRect(mx - 1, mz - 1, 2, 2);
  }
  // Mission marker: pulsing gold diamond.
  if (G.marker && G.marker.visible) {
    const [mx, mz] = toMap(G.marker.position.x, G.marker.position.z);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(mx, mz - 7); ctx.lineTo(mx + 6, mz); ctx.lineTo(mx, mz + 7); ctx.lineTo(mx - 6, mz);
    ctx.closePath(); ctx.fill();
  }
  // Traffic (grey) and police (red/blue) — police only when EYES UP or close.
  const showPolice = eyesUpActive(G) || G.wanted >= 3;
  for (const c of G.traffic || []) {
    const [mx, mz] = toMap(c.position.x, c.position.z);
    ctx.fillStyle = '#9aa5b1'; ctx.fillRect(mx - 1.5, mz - 1.5, 3, 3);
  }
  if (showPolice) {
    for (const c of G.police || []) {
      const [mx, mz] = toMap(c.position.x, c.position.z);
      ctx.fillStyle = '#ff4444';
      ctx.beginPath(); ctx.arc(mx, mz, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    if (G.heli && G.heli.active) {
      const [mx, mz] = toMap(G.heli.group.position.x, G.heli.group.position.z);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(mx, mz, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Player: white arrow.
  const pos = G.actorPosition();
  const [px, pz] = toMap(pos.x, pos.z);
  const yaw = (G.currentCar || G.player).rotation.y;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(px + Math.sin(yaw) * 6, pz + Math.cos(yaw) * 6);
  ctx.lineTo(px + Math.sin(yaw + 2.5) * 5, pz + Math.cos(yaw + 2.5) * 5);
  ctx.lineTo(px + Math.sin(yaw - 2.5) * 5, pz + Math.cos(yaw - 2.5) * 5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // Ring.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.stroke();
}
