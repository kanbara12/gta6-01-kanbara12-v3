// Boot and main loop for SUNCOAST: HEATLINE.
// One clear job: build the shared state G, wire every system together,
// and run the frame — input, driving, traffic, police, missions, HUD.

import * as THREE from 'three';
import { ECONOMY, WORLD } from './config.js';
import { createInput } from './input.js';
import { createRendering } from './rendering.js';
import { resolveQuality, autoQuality } from './settings.js';
import { buildWorld } from '../world/world.js';
import { buildBoardwalk } from '../world/boardwalk.js';
import { buildGarage, updateGarage } from '../world/garage.js';
import { buildSafehouse, updateSafehouse } from '../world/safehouse.js';
import { buildStashes, updateStashes } from '../world/stash.js';
import { spawnHeroCar, handleEnterExit } from '../vehicles/vehicles.js';
import { updateDriving, updateOnFoot } from '../vehicles/driving.js';
import { spawnTraffic, updateTraffic } from '../vehicles/traffic.js';
import { updatePolice } from '../AI/police.js';
import { spawnHelicopter, updateHelicopter } from '../AI/helicopter.js';
import { spawnPedestrians, updatePedestrians } from '../AI/pedestrians.js';
import { fireWeapon, swingBat, updateEnemies } from '../combat/combat.js';
import { buildPlayer, spawnCrew, spawnYardEnemies } from '../characters/characters.js';
import { onStageStart, updateMissions } from '../missions/missions.js';
import { buildHud, updateHud, showScorePopup } from '../UI/hud.js';
import { createDialog, updateDialog } from '../UI/dialog.js';
import { createPause } from '../UI/pause.js';
import { stageShot } from '../UI/shots.js';
import { createAbilities, updateAbilities, useAbility, boostActive } from '../UI/abilities.js';
import { createAudio } from '../audio/audio.js';
import { createRadio } from '../audio/radio.js';
import { saveGame, loadGame, hasSave } from '../save/save.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SEED = parseInt(params.get('seed') || '1', 10) || 1;

export function boot() {
  const canvas = document.getElementById('gameCanvas');
  const quality = resolveQuality(autoQuality());
  const R = createRendering(canvas, quality);

  const G = {
    scene: R.scene, camera: R.camera, renderer: R.renderer,
    seed: SEED, frame: 0,
    money: ECONOMY.startMoney, health: 100, heat: 0, wanted: 0,
    rep: 0, fuel: 100, driftScore: 0, driftTime: 0,
    missionIndex: 0, jobsCompleted: 0, kills: 0, weaponIndex: 0,
    gameStarted: false, gameOver: false, paused: false,
    shotMode: false, shotCruise: 0, shotWrap: null,
    shotCamDist: 0, shotCamHeight: 0, shotCamera: null,
    sunDir: new THREE.Vector3(-0.7, 0.35, -0.6).normalize(),
    timeOfDay: 'golden', speedKmh: 0, gunshotFlee: 0,
    _stageElapsed: 0, _lastShot: 0, _toastTimer: 0,
    setTimeOfDay: (t) => { G.timeOfDay = t; R.setTimeOfDay(t, true); },
    actorPosition() {
      const a = G.currentCar || G.player;
      return a ? a.position : new THREE.Vector3();
    },
  };

  G.input = createInput();
  G.audio = createAudio();
  G.radio = createRadio(G.audio);
  G.radio.playing = true;

  // --- World ------------------------------------------------------------
  buildWorld(G);
  buildBoardwalk(G);
  buildGarage(G);
  buildSafehouse(G);
  buildStashes(G);

  // --- Actors -----------------------------------------------------------
  buildPlayer(G);
  spawnCrew(G);
  spawnHeroCar(G);
  spawnTraffic(G);
  spawnPedestrians(G);
  G.police = [];
  spawnHelicopter(G);
  spawnYardEnemies(G);

  // --- Mission marker: gold beam + pulsing ring -------------------------
  const marker = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 30, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 15;
  marker.add(beam);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.25, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  marker.add(ring);
  marker.visible = false;
  G.scene.add(marker);
  G.marker = marker;

  // --- UI ---------------------------------------------------------------
  buildHud(G);
  createDialog(G);
  createPause(G);
  createAbilities(G);

  G.showToast = (text) => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.classList.remove('hidden');
    G._toastTimer = 3;
  };
  G.showScorePopup = (text, kind) => showScorePopup(G, text, kind);

  // Start card.
  const startCard = document.getElementById('startCard');
  const btnStart = document.getElementById('btnStart');
  const startGame = () => {
    G.gameStarted = true;
    G.audio.ensure();
    if (startCard) startCard.classList.add('hidden');
    onStageStart(G, G.missionIndex);
    G.showToast('WELCOME TO SUNCOAST • MEET RAE AT THE MARKER');
  };
  if (btnStart) btnStart.addEventListener('click', startGame);
  const btnContinue = document.getElementById('btnContinue');
  if (btnContinue) {
    btnContinue.classList.toggle('hidden', !hasSave());
    btnContinue.addEventListener('click', () => {
      loadGame(G);
      startGame();
      G.showToast('SAVE LOADED • WELCOME BACK');
    });
  }
  const btnRespawn = document.getElementById('btnRespawn');
  if (btnRespawn) btnRespawn.addEventListener('click', () => window.location.reload());

  // Screenshot mode: skip the start card, stage the scene, run live.
  if (SHOT) {
    stageShot(SHOT, G);
    window.__shotName = SHOT;
  } else {
    onStageStart(G, 0);
    G.gameStarted = false; // waits for ENTER THE CITY
    G.marker.visible = true;
  }

  // --- Frame loop --------------------------------------------------------
  const clock = new THREE.Clock();
  let fpsFrames = 0, fpsTime = 0;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    G.frame += 1;
    fpsFrames += 1; fpsTime += dt;
    if (fpsTime >= 1) { G.fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
    if (G.paused) { G.renderer.render(G.scene, G.camera); G.input.endFrame(); return; }
    if (G.gameStarted && !G.gameOver) tick(G, dt);
    else if (G.shotMode) tick(G, dt); // shot mode runs without the start tap
    // Idle attract: slow orbit around the hero car before start.
    if (!G.gameStarted && !G.shotMode) {
      const t = performance.now() * 0.0001;
      G.camera.position.set(
        G.playerCar.position.x + Math.sin(t) * 14,
        6,
        G.playerCar.position.z + Math.cos(t) * 14,
      );
      G.camera.lookAt(G.playerCar.position.x, 1.5, G.playerCar.position.z);
    }
    animateWorld(G, dt);
    R.updateSun(G);
    G.renderer.render(G.scene, G.camera);
    updateHud(G);
    updateDialog(G, dt);
    G.input.endFrame();
  }
  frame();

  window.__suncoast = G; // debuggable from the console
  return G;
}

function tick(G, dt) {
  const input = G.input;

  // Edge-triggered keys.
  if (input.wasPressed('e')) handleEnterExit(G);
  if (input.wasPressed('r')) { G.radio.nextStation(); G.showToast(`RADIO • ${G.radio.station()}`); }
  if (input.wasPressed('m')) { G.audio.setMuted(!G.audio.muted); G.showToast(G.audio.muted ? 'SOUND OFF' : 'SOUND ON'); }
  if (input.wasPressed('p') || input.wasPressed('escape')) G.setPaused(!G.paused);
  if (input.wasPressed('t')) cycleTimeOfDay(G);
  if (input.wasPressed('z')) useAbility(G, 'z');
  if (input.wasPressed('x')) useAbility(G, 'x');
  if (input.wasPressed('c')) useAbility(G, 'c');
  if (input.wasPressed('1')) G.weaponIndex = 0;
  if (input.wasPressed('2')) G.weaponIndex = 1;
  if (input.wasPressed('3')) G.weaponIndex = 2;
  if (input.wasPressed('4')) G.weaponIndex = 3;

  // Shooting: click fires; BAT swings on click too.
  if (input.mouseDown && !G.currentCar) {
    if (G.weaponIndex === 3) swingBat(G);
    else fireWeapon(G);
  }

  // Driving / walking.
  if (G.currentCar) {
    if (G.shotCruise) {
      // Shot mode: hold the cruise speed so the hero never coasts to 0.
      G.currentCar.userData.speed = G.shotCruise;
      const yaw = G.currentCar.rotation.y;
      G.currentCar.position.x += Math.sin(yaw) * G.shotCruise * dt;
      G.currentCar.position.z += Math.cos(yaw) * G.shotCruise * dt;
      G.speedKmh = G.shotCruise * 3.6;
      if (G.shotWrap) {
        const w = G.shotWrap;
        const v = w.axis === 'x' ? G.currentCar.position.x : G.currentCar.position.z;
        if (v > w.max) { if (w.axis === 'x') G.currentCar.position.x = w.min; else G.currentCar.position.z = w.min; }
        if (v < w.min) { if (w.axis === 'x') G.currentCar.position.x = w.max; else G.currentCar.position.z = w.max; }
      }
    } else {
      updateDriving(G, dt);
    }
    // Fuel: driving burns it; empty tank caps the car to a crawl.
    const spd = Math.abs(G.currentCar.userData.speed || 0);
    if (spd > 1) G.fuel = Math.max(0, G.fuel - dt * 0.45);
    if (G.fuel <= 0 && G.currentCar.userData.speed > 8) G.currentCar.userData.speed = 8;
    // Marlo boost: +25% top speed for 6 s.
    if (boostActive(G) && G.currentCar.userData.speed > 0) {
      G.currentCar.userData.speed = Math.min(48, G.currentCar.userData.speed + 14 * dt);
    }
    G.audio.setEngine(spd / 40, true);
  } else {
    updateOnFoot(G, dt);
    G.speedKmh = 0;
    G.audio.setEngine(0, false);
  }

  // Near-miss: fast pass within 3.2 m of a traffic car pays $50 + popup.
  if (G.currentCar && Math.abs(G.currentCar.userData.speed || 0) > 20) {
    const h = G.currentCar.position;
    for (const c of G.traffic) {
      const d = Math.hypot(c.position.x - h.x, c.position.z - h.z);
      const now = performance.now() / 1000;
      if (d < 3.2 && (!c.userData.lastNearMiss || now - c.userData.lastNearMiss > 4)) {
        c.userData.lastNearMiss = now;
        G.money += 50;
        G.rep += 1;
        showScorePopup(G, '+$50 NEAR MISS', 'near');
        if (G.audio) G.audio.playPickup();
      }
    }
  }

  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  updatePolice(G, dt);
  updateHelicopter(G, dt);
  updateMissions(G, dt);
  updateEnemies(G, dt);
  updateGarage(G, dt);
  updateSafehouse(G, dt);
  updateStashes(G);
  updateAbilities(G, dt);
  G.radio.update(dt);

  // Garage refuels the car while parked inside.
  if (G.garage && G.garage.inside) {
    G.fuel = Math.min(100, G.fuel + dt * 20);
  }

  // REP: jobs, kills and drift all feed it.
  G.rep = (G.jobsCompleted || 0) * 10 + (G.kills || 0) * 2 + Math.floor((G.driftScore || 0) / 50);

  // Drift popups: every $25 of drift banked shows once.
  const driftMark = Math.floor((G.driftScore || 0) / 25);
  if (driftMark > (G._driftMark || 0)) {
    G._driftMark = driftMark;
    showScorePopup(G, `DRIFT +$${Math.floor(G.driftScore)}`, 'drift');
  }

  // Camera.
  if (G.shotCamera) {
    G.camera.position.copy(G.shotCamera.pos);
    G.camera.lookAt(G.shotCamera.look);
  } else {
    updateChaseCamera(G, dt);
  }

  // Toast timer.
  if (G._toastTimer > 0) {
    G._toastTimer -= dt;
    if (G._toastTimer <= 0) {
      const t = document.getElementById('toast');
      if (t) t.classList.add('hidden');
    }
  }

  // Death / busted.
  if (G.health <= 0 && !G.gameOver) {
    G.gameOver = true;
    const over = document.getElementById('gameOverCard');
    if (over) over.classList.remove('hidden');
    saveGame(G);
  }
}

function updateChaseCamera(G, dt) {
  const target = G.currentCar || G.player;
  const yaw = target.rotation.y;
  const dist = G.shotCamDist || (G.currentCar ? 8.2 : 6.0);
  const height = G.shotCamHeight || (G.currentCar ? 3.0 : 2.6);
  const side = G.currentCar ? 0.5 : 0;
  const bx = Math.sin(yaw), bz = Math.cos(yaw);
  const px = -Math.cos(yaw), pz = Math.sin(yaw);
  const want = new THREE.Vector3(
    target.position.x - bx * dist + px * side,
    target.position.y + height,
    target.position.z - bz * dist + pz * side,
  );
  // In shot mode the camera snaps on the first frames: on a slow software
  // renderer the lerp would otherwise still be travelling at capture time.
  const k = G.shotMode && G.frame < 30 ? 1 : 1 - Math.exp(-dt * 7);
  G.camera.position.lerp(want, k);
  G.camera.lookAt(
    target.position.x + bx * 4,
    target.position.y + (G.shotLookHeight || 1.4),
    target.position.z + bz * 4,
  );
}

function cycleTimeOfDay(G) {
  const order = ['golden', 'midday', 'dusk', 'night'];
  const next = order[(order.indexOf(G.timeOfDay) + 1) % order.length];
  G.setTimeOfDay(next);
  G.showToast(`TIME • ${next.toUpperCase()}`);
}

/** Ambient motion: waves, foam, ferris wheel, lighthouse beam. */
function animateWorld(G, dt) {
  const t = performance.now() * 0.001;
  if (G.ocean) {
    G.ocean.position.y = -0.4 + Math.sin(t * 0.7) * 0.15;
    G.ocean.material.color.setHex(0x1a6f8e);
  }
  if (G.foam) {
    G.foam.position.x = WORLD.beachX + 34 + Math.sin(t * 0.5) * 2.5;
    G.foam.material.opacity = 0.4 + Math.sin(t * 0.9) * 0.18;
  }
  if (G.ferrisWheel) G.ferrisWheel.rotation.z += dt * 0.12;
  if (G.lighthouseBeam) G.lighthouseBeam.rotation.y = t * 0.4;
  if (G.marker && G.marker.visible) {
    const s = 1 + Math.sin(t * 3) * 0.12;
    G.marker.scale.set(s, 1, s);
  }
}

boot();
