// Pause menu and statistics for SUNCOAST: HEATLINE.
// One clear job: P / Esc pauses the loop and shows stats — money, jobs,
// kills, drift earnings, REP, fuel, mission, controls — plus resume,
// save, load and restart buttons.

import { saveGame, loadGame } from '../save/save.js';

export function createPause(G) {
  G.paused = false;
  const menu = document.getElementById('pauseMenu');
  G.setPaused = (on) => {
    G.paused = on;
    if (menu) menu.classList.toggle('hidden', !on);
    if (on) renderPauseStats(G);
  };
  const resume = document.getElementById('btnResume');
  if (resume) resume.addEventListener('click', () => G.setPaused(false));
  const saveBtn = document.getElementById('btnSave');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    saveGame(G);
    G.showToast('GAME SAVED');
  });
  const loadBtn = document.getElementById('btnLoad');
  if (loadBtn) loadBtn.addEventListener('click', () => {
    if (loadGame(G)) { G.showToast('SAVE LOADED'); G.setPaused(false); }
    else G.showToast('NO SAVE FOUND');
  });
  const restartBtn = document.getElementById('btnRestart');
  if (restartBtn) restartBtn.addEventListener('click', () => window.location.reload());
}

export function renderPauseStats(G) {
  const set = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  set('statMoney', `$${Math.floor(G.money).toLocaleString('en-US')}`);
  set('statJobs', `${G.jobsCompleted || 0} jobs done • stage ${Math.min(G.missionIndex + 1, 8)}/8`);
  set('statKills', `${G.kills || 0} targets down`);
  set('statDrift', `$${Math.floor(G.driftScore || 0)} drift earnings`);
  set('statRep', `REP ${G.rep || 0}`);
  set('statFuel', `FUEL ${Math.round(G.fuel || 0)}%`);
  set('statWanted', `WANTED ${'★'.repeat(G.wanted)}${'☆'.repeat(5 - G.wanted)}`);
  set('statHealth', `HEALTH ${Math.round(G.health)}%`);
}
