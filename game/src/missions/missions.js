// The eight-contract story chain for SUNCOAST: HEATLINE.
// One clear job: the missions — titles, objectives, crew lines, rewards,
// stage triggers and the loop reset after the final job.
//
// Economy: rewards sum to $20,750 on a $1,250 start, plus $150 per kill
// in the yard (3 kills = $450 bounty), landing at $22,450 total.

import * as THREE from 'three';
import { clamp } from '../core/config.js';
import { spawnYardEnemies } from '../characters/characters.js';

export const GANG_ZONE = new THREE.Vector3(72, 0, -72);

export const MISSION_POINTS = [
  new THREE.Vector3(8.5, 0, 8.5),    // fixer (sidewalk corner)
  new THREE.Vector3(44.5, 0, 8.5),   // package pickup
  new THREE.Vector3(-48, 0, 56),     // safehouse delivery
  GANG_ZONE.clone(),                  // crew yard
  new THREE.Vector3(14, 0, 92),      // garage
  new THREE.Vector3(-72, 0, -72),    // overlook (final run)
  new THREE.Vector3(132, 0, 96),     // marina dock (case swap)
  new THREE.Vector3(148, 0, -142),   // lighthouse breakwater
];

export const MISSION_COUNT = MISSION_POINTS.length;

const TITLES = [
  'A Favor in the Heat', 'Loose Cargo', 'The Quiet Exit', 'Street Sweep',
  'No Witnesses', 'Last Light', 'Saltwater Exchange', 'Northlight Run',
];

const OBJECTIVES = [
  'Meet the fixer at the glowing marker.',
  'Pick up the sealed package at the next marker.',
  'Deliver the package to the safehouse. Keep moving.',
  'Clear the hostile crew in the industrial yard.',
  'Reach the garage and lose the heat.',
  'Final run: reach the overlook.',
  'Meet Marlo at the marina dock and swap the case.',
  'Run the north beach road to the lighthouse breakwater.',
];

const REWARDS = [2500, 2500, 3000, 3500, 4250, 2000, 1500, 1500];

const STAGES = [
  { type: 'meet', radius: 5, parTime: 60, speaker: 'rae', name: 'Rae', role: 'FIXER', line: 'You came. Good. One package, no questions, and we both get paid.' },
  { type: 'pickup', radius: 5, parTime: 90, speaker: 'rae', name: 'Rae', role: 'FIXER', line: 'The package is two blocks east. Grab it and do not stop for anyone.' },
  { type: 'deliver', radius: 6, parTime: 120, speaker: 'sable', name: 'Sable', role: 'LOOKOUT', line: 'Safehouse road is clear from my roof. Move before the patrol turns the corner.' },
  { type: 'combat', radius: 6, parTime: 180, speaker: 'marlo', name: 'Marlo', role: 'DRIVER', line: 'The yard crew skimmed our cut. I keep the engine running — you handle the yard.' },
  { type: 'evade', radius: 6, parTime: 150, speaker: 'sable', name: 'Sable', role: 'LOOKOUT', line: 'Heat is on you. Garage, north side — sit quiet and I will tell you when the street is clear.' },
  { type: 'final', radius: 6, parTime: 120, speaker: 'rae', name: 'Rae', role: 'FIXER', line: 'Last run. Overlook at the north-west edge. After this, you are a ghost with money.' },
  { type: 'meet', radius: 6, parTime: 150, speaker: 'marlo', name: 'Marlo', role: 'DRIVER', line: 'Marina dock, by the finger piers. Case for case — swap it and go, no detours.' },
  { type: 'final', radius: 6, parTime: 180, speaker: 'sable', name: 'Sable', role: 'LOOKOUT', line: 'North beach road to the lighthouse. I will watch the tail — you just drive.' },
];

export function getMissionBrief(stage) {
  const i = clamp(stage | 0, 0, MISSION_COUNT - 1);
  const s = STAGES[i];
  return {
    stage: i, title: TITLES[i], objective: OBJECTIVES[i], hint: '',
    dialog: { name: s.name, role: s.role, portrait: s.speaker, text: s.line },
    type: s.type, radius: s.radius, reward: REWARDS[i], parTime: s.parTime,
  };
}

export function getMissionProgress(G) {
  const i = clamp(G.missionIndex | 0, 0, MISSION_COUNT - 1);
  const p = G.actorPosition();
  const target = MISSION_POINTS[i];
  return {
    stage: i, stageLabel: `${i + 1}/${MISSION_COUNT}`,
    title: TITLES[i], objective: G.objectiveText || OBJECTIVES[i],
    type: STAGES[i].type, reward: REWARDS[i],
    distanceToMarker: Math.round(Math.hypot(p.x - target.x, p.z - target.z)),
    killsNeeded: i === 3 ? 3 : 0,
    killsDone: i === 3 ? Math.min(G.kills || 0, 3) : 0,
    jobsCompleted: G.jobsCompleted || 0,
    parTime: STAGES[i].parTime, elapsed: Math.round(G._stageElapsed || 0),
  };
}

/** Move the glowing marker to a stage's point and show it. */
export function placeMarker(marker, stage) {
  const p = MISSION_POINTS[clamp(stage | 0, 0, MISSION_COUNT - 1)];
  marker.position.set(p.x, 0, p.z);
  marker.visible = true;
}

export function onStageStart(G, i) {
  const brief = getMissionBrief(i);
  G.missionIndex = i;
  G.objectiveText = brief.objective;
  G._stageElapsed = 0;
  placeMarker(G.marker, i);
  if (typeof G.showDialog === 'function') G.showDialog(brief.dialog);
  G.showToast(`JOB ${i + 1}/8 • ${brief.title.toUpperCase()} • $${brief.reward.toLocaleString('en-US')}`);
  if (i === 3) {
    if (G.enemies.length === 0) spawnYardEnemies(G);
    for (const e of G.enemies) { e.userData.alive = true; e.visible = true; e.userData.health = 2; }
    G.kills = 0;
  }
  if (i === 4 || i === 7) {
    G.heat = Math.max(G.heat, 40);
    G.wanted = Math.max(G.wanted, 2);
  }
}

function payReward(G, i, kind) {
  const reward = REWARDS[clamp(i, 0, MISSION_COUNT - 1)];
  G.money += reward;
  G.showToast(`${kind} • +$${reward.toLocaleString('en-US')}`);
}

export function advanceStage(G) {
  const i = G.missionIndex;
  if (i + 1 >= MISSION_COUNT) { completeStory(G); return; }
  payReward(G, i, 'STAGE PAY');
  onStageStart(G, i + 1);
}

export function completeStory(G) {
  payReward(G, MISSION_COUNT - 1, 'JOB COMPLETE');
  G.jobsCompleted = (G.jobsCompleted || 0) + 1;
  G.showToast('STORY LOOP COMPLETE • NEW CONTRACT AVAILABLE');
  G.missionIndex = 0;
  onStageStart(G, 0);
}

/** Per-frame mission logic: triggers, combat count, evade, timer. */
export function updateMissions(G, dt) {
  if (!G.gameStarted || G.gameOver) return;
  G._stageElapsed = (G._stageElapsed || 0) + dt;
  const i = clamp(G.missionIndex | 0, 0, MISSION_COUNT - 1);
  const p = G.actorPosition();
  const target = MISSION_POINTS[i];
  const d = Math.hypot(p.x - target.x, p.z - target.z);
  const stage = STAGES[i];
  if (i === 3) {
    if ((G.kills || 0) >= 3) advanceStage(G);
    return;
  }
  if (i === 4) {
    // Evade: reaching the garage with heat gone clears it.
    if (d < stage.radius && G.wanted === 0) { advanceStage(G); return; }
    return;
  }
  if (d < stage.radius) advanceStage(G);
}
