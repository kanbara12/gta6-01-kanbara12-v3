// Save and load for SUNCOAST: HEATLINE.
// One clear job: persist the run (money, mission, health, wanted, REP,
// jobs) to localStorage and restore it. Nothing else leaves the page.

const KEY = 'suncoast-heatline-save-v3';

export function saveGame(G) {
  try {
    const data = {
      money: G.money,
      missionIndex: G.missionIndex,
      jobsCompleted: G.jobsCompleted,
      health: G.health,
      rep: G.rep,
      kills: G.kills,
      fuel: G.fuel,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

export function loadGame(G) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    G.money = d.money ?? G.money;
    G.missionIndex = d.missionIndex ?? G.missionIndex;
    G.jobsCompleted = d.jobsCompleted ?? 0;
    G.health = d.health ?? 100;
    G.rep = d.rep ?? 0;
    G.kills = d.kills ?? 0;
    G.fuel = d.fuel ?? 100;
    return d;
  } catch (e) { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
}
