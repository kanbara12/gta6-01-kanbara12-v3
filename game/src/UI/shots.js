// Screenshot scenes for SUNCOAST: HEATLINE.
// One clear job: the ?shot= scenes. Each scene stages a genuine gameplay
// state — the same live simulation, just positioned and seeded
// deterministically — then the normal game loop runs it, so every
// screenshot is a real frame of the game, never a mockup.
//
// Scenes (5 prepared; the kit submits the best 4):
//   start   — hero open-world: beach road, boardwalk, ferris wheel, skyline.
//   play    — driving through traffic on an avenue, sunset ahead.
//   chase   — police pursuit at wanted 3, heli SKY-1 overhead with its
//             spotlight cone sweeping the road.
//   mission — on-foot combat at the crew yard, mission 4 in progress.
//   end     — the overlook after the final job, city and coast behind.
// Any other name behaves like start. ?seed= picks the stream.
//
// Staging rules: the hero must be BIG and MOVING in every driving shot
// (close chase cam + a held cruise speed — without input the car coasts
// to 0 KM/H), traffic must never occlude the hero, the heli must stay
// close with its searchlight reading, and the mission shot must show
// crew dialog + a weapon in hand. Speeds read 130+ KM/H on the dial.

import * as THREE from 'three';
import { mulberry32 } from '../core/config.js';
import { MISSION_POINTS, placeMarker, getMissionBrief } from '../missions/missions.js';
import { spawnPoliceCar } from '../AI/police.js';

function putPlayerOnFoot(G, x, z, yaw) {
  G.currentCar = null;
  G.player.visible = true;
  G.player.position.set(x, 0, z);
  G.player.rotation.y = yaw;
}

function putPlayerInCar(G, x, z, rotY, speed) {
  G.currentCar = G.playerCar;
  G.player.visible = false;
  G.playerCar.position.set(x, 0, z);
  G.playerCar.rotation.y = rotY;
  G.playerCar.userData.speed = speed;
}

/** Park a traffic car on a road: axis 'z' = an east-west road (z const),
 *  the car moves along x; axis 'x' = a north-south road (x const), the
 *  car moves along z. Rotation matches the movement, never sideways. */
function stageTrafficCar(G, i, x, z, axis, dir, speed) {
  const c = G.traffic[i % G.traffic.length];
  if (!c) return;
  c.position.set(x, 0, z);
  c.userData.axis = axis;
  c.userData.dir = dir;
  c.userData.speed = speed;
  c.userData.baseSpeed = speed;
  c.rotation.y = axis === 'z' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
}

/** Park a pedestrian and set its walking direction. */
function stagePed(G, i, x, z, dirX, dirZ) {
  const f = G.peds[i % G.peds.length];
  if (!f) return;
  f.position.set(x, 0, z);
  f.userData.dirX = dirX;
  f.userData.dirZ = dirZ;
  f.userData.flee = 0;
  f.rotation.y = Math.atan2(dirX, dirZ);
}

/** Stage the named scene on the shared state G and return its label. */
export function stageShot(name, G) {
  const rng = mulberry32(G.seed * 7919 + 13);
  G.shotMode = true;
  G.gameStarted = true;
  G.gameOver = false;
  G.shotCamera = null;
  const startCard = document.getElementById('startCard');
  if (startCard) startCard.classList.add('hidden');
  const setTime = (t) => { if (typeof G.setTimeOfDay === 'function') G.setTimeOfDay(t, true); };
  const closeChase = (dist, height) => { G.shotCamDist = dist; G.shotCamHeight = height; };
  // Narrower lens for driving shots: the hero fills the frame.
  const setFov = (f) => { G.camera.fov = f; G.camera.updateProjectionMatrix(); };

  if (name === 'play') {
    // Driving WEST down Sunset Ave (z = 36) into the sunset: the sun disc
    // sits dead ahead, traffic ahead in both lanes, peds on the sidewalks.
    // Hero cruises at 130 KM/H and loops the x -60..60 stretch.
    setTime('golden');
    putPlayerInCar(G, 60, 36, -Math.PI / 2, 36);
    G.shotCruise = 36;
    G.shotWrap = { axis: 'x', min: -60, max: 60 };
    closeChase(6.8, 2.9);
    setFov(50);
    G.sunDir = new THREE.Vector3(-0.98, 0.14, 0.10).normalize();
    // Same-direction traffic AHEAD (west of the hero, slower, so it stays
    // ahead): at the capture the hero is near x 13 and these sit 15-40 m
    // ahead of it, in frame. Oncoming traffic in the far lane, also ahead.
    stageTrafficCar(G, 0, 20, 33.3, 'z', -1, 16);
    stageTrafficCar(G, 1, -5, 33.3, 'z', -1, 16);
    stageTrafficCar(G, 2, -30, 38.7, 'z', 1, 9);
    stageTrafficCar(G, 3, -55, 38.7, 'z', 1, 9);
    for (let i = 4; i < G.traffic.length; i += 1) {
      const c = G.traffic[i];
      c.position.set(-120 + i * 14, 0, -72 + (i % 3) * 36);
      c.userData.axis = 'z'; c.userData.dir = 1; c.userData.speed = 8; c.userData.baseSpeed = 8;
      c.rotation.y = Math.PI / 2;
    }
    stagePed(G, 0, 10, 27.5, -1, 0);
    stagePed(G, 1, 30, 44.5, 1, 0);
    stagePed(G, 2, -5, 27.5, 1, 0);
    G.missionIndex = 1;
    G.objectiveText = 'Pick up the sealed package at the next marker.';
    placeMarker(G.marker, G.missionIndex);
    G.markerTarget = MISSION_POINTS[G.missionIndex];
    return 'play';
  }

  if (name === 'chase') {
    // Police pursuit, southbound down the central avenue: wanted 3, three
    // units closing from ahead, heli SKY-1 tight overhead with a
    // searchlight that actually reads. Hero holds 137 KM/H.
    setTime('golden');
    putPlayerInCar(G, 0, -120, 0, 38);
    G.shotCruise = 38;
    closeChase(6.8, 2.9);
    setFov(50);
    // Slight upward tilt so SKY-1 sits in the upper third, not above it —
    // and the hero car stays in frame at the bottom.
    G.shotLookHeight = 2.6;
    G.sunDir = new THREE.Vector3(0.05, 0.25, 0.97).normalize();
    G.wanted = 3;
    G.heat = 60;
    while (G.police.length < 3) {
      const used = G.police.map((c) => c.userData.callsign);
      G.police.push(spawnPoliceCar(G.scene, G.actorPosition(), rng, used));
    }
    // Staged 50-90 m ahead down the avenue: they close at ~60 u/s, so at
    // the capture they are 0-60 m ahead of the hero, big in frame.
    // Staged farther they stay tiny; staged closer they meet the hero in
    // under a second and end up behind the camera, invisible.
    G.police[0].position.set(6, 0, -70);
    G.police[1].position.set(-6, 0, -50);
    G.police[2].position.set(10, 0, -30);
    for (const c of G.police) { c.userData.speed = 6 + rng() * 2; c.userData.state = 'PURSUIT'; }
    // Heli: parked ahead of the hero (south), close orbit, so it sits
    // centred over the road in frame at capture time.
    if (G.heli) {
      G.heli.angle = Math.PI / 2 - 0.28;
      const u = G.heli.group.userData;
      if (u.cone) u.cone.material.opacity = 0.25;
      if (u.spot) u.spot.intensity = 1600;
    }
    G.missionIndex = 4;
    G.objectiveText = 'Reach the garage and lose the heat.';
    placeMarker(G.marker, G.missionIndex);
    G.markerTarget = MISSION_POINTS[G.missionIndex];
    return 'chase';
  }

  if (name === 'mission') {
    // On foot at the crew yard, facing north into it: the closest enemy
    // 12 u ahead, the other two deeper in the yard, the player visibly
    // holding a pistol while Marlo's crew line stays on screen.
    setTime('golden');
    putPlayerOnFoot(G, 72, -56, Math.PI - 0.5);
    closeChase(5.0, 2.4);
    setFov(55);
    G.sunDir = new THREE.Vector3(-0.30, 0.20, -0.93).normalize();
    G.missionIndex = 3;
    G.kills = 2;
    G.weaponIndex = 0; // PISTOL selected in the HUD
    G.objectiveText = 'Clear the hostile crew in the industrial yard.';
    for (const e of G.enemies) {
      if (!e.userData.alive) { e.userData.alive = true; e.visible = true; e.userData.health = 2; }
    }
    const facePlayer = (e) => {
      e.rotation.y = Math.atan2(G.player.position.x - e.position.x, G.player.position.z - e.position.z);
    };
    if (G.enemies[0]) { G.enemies[0].position.set(76, 0, -68); facePlayer(G.enemies[0]); }
    if (G.enemies[1]) { G.enemies[1].position.set(68, 0, -74); facePlayer(G.enemies[1]); }
    if (G.enemies[2]) { G.enemies[2].position.set(80, 0, -78); facePlayer(G.enemies[2]); }
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.3, metalness: 0.8 }),
    );
    gun.position.set(-0.52, 1.1, 0.35);
    gun.rotation.y = 0.15;
    gun.castShadow = true;
    G.player.add(gun);
    G.showDialog(getMissionBrief(3).dialog);
    placeMarker(G.marker, G.missionIndex);
    G.markerTarget = MISSION_POINTS[G.missionIndex];
    return 'mission';
  }

  if (name === 'end') {
    setTime('golden');
    setFov(60);
    putPlayerOnFoot(G, MISSION_POINTS[5].x + 6, MISSION_POINTS[5].z + 8, Math.atan2(-6, -8));
    G.missionIndex = 0;
    G.money = 12750;
    G.wanted = 0;
    G.showToast('STORY LOOP COMPLETE • NEW CONTRACT AVAILABLE');
    placeMarker(G.marker, G.missionIndex);
    G.markerTarget = MISSION_POINTS[G.missionIndex];
    G.shotCamera = {
      pos: new THREE.Vector3(-60, 24, -150),
      look: new THREE.Vector3(148, 10, -142),
    };
    return 'end';
  }

  // start (default): hero shot — the HEATLINE GT close in frame on the
  // beach road, camera low behind it, skyline and sunset ahead. The car
  // cruises north at 130 KM/H past the boardwalk stalls and the ferris
  // wheel, looping the z -60..60 stretch so the frame holds.
  setTime('golden');
  putPlayerInCar(G, 142, 60, Math.PI, 36);
  G.shotCruise = 36;
  G.shotWrap = { axis: 'z', min: -60, max: 60 };
  closeChase(6.8, 2.9);
  setFov(50);
  G.sunDir = new THREE.Vector3(-0.30, 0.20, -0.93).normalize();
  // Oncoming traffic in the far lane (x 144.7, southbound); the wrap
  // keeps it cycling past the hero instead of driving away.
  stageTrafficCar(G, 0, 144.7, -40, 'x', 1, 8);
  stageTrafficCar(G, 1, 144.7, 0, 'x', 1, 8);
  stageTrafficCar(G, 2, 144.7, 40, 'x', 1, 8);
  // One northbound car far ahead, near the ferris wheel.
  stageTrafficCar(G, 3, 139.3, -90, 'x', -1, 8);
  for (let i = 4; i < G.traffic.length; i += 1) {
    const c = G.traffic[i];
    c.position.set(-108 + (i % 7) * 36, 0, -100 + i * 12);
    c.userData.axis = 'z'; c.userData.dir = 1; c.userData.speed = 8; c.userData.baseSpeed = 8;
    c.rotation.y = Math.PI / 2;
  }
  stagePed(G, 0, 133, -10, 0, -1);
  stagePed(G, 1, 133, 15, 0, 1);
  stagePed(G, 2, 158, 5, 0, -1);
  G.missionIndex = 0;
  G.objectiveText = 'Meet the fixer at the glowing marker.';
  placeMarker(G.marker, G.missionIndex);
  G.markerTarget = MISSION_POINTS[G.missionIndex];
  return 'start';
}

export const SHOT_NAMES = ['start', 'play', 'chase', 'mission', 'end'];
