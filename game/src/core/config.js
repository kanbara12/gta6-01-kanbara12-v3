// SUNCOAST: HEATLINE — core constants, math helpers and the seeded RNG.
// One clear job: the numbers every other module shares, nothing else.

export const WORLD = {
  // Playable city bounds (metres, x east, z south). The beach road runs
  // along x ~ 140; the ocean starts at x ~ 165.
  minX: -160, maxX: 165, minZ: -160, maxZ: 165,
  oceanX: 168, beachX: 150,
  roadHalf: 4.5, sidewalkHalf: 7.5,
};

export const ECONOMY = {
  startMoney: 1250,
  stageRewards: [2500, 2500, 3000, 3500, 4250, 2000, 1500, 1500],
  stashValue: 250,
  killBounty: 150,
  driftPayoutPerSecond: 12,
  repaintCost: 0, // garage repaint is free: it costs time, not cash
  totalStory: 22450, // 1250 start + 20750 stage rewards + 450 yard bounties
};

export const WEAPONS = [
  { name: 'PISTOL', damage: 1, range: 55, rate: 0.28, spread: 0.012, auto: false },
  { name: 'SMG', damage: 1, range: 48, rate: 0.09, spread: 0.05, auto: true },
  { name: 'SHOTGUN', damage: 2, range: 26, rate: 0.7, spread: 0.11, auto: false },
  { name: 'BAT', damage: 1, range: 3.2, rate: 0.45, spread: 0, auto: false },
];

export const POLICE_CALLSIGNS = ['SNOOK-10', 'SNOOK-11', 'SNOOK-12', 'SNOOK-13'];
export const HELI_CALLSIGN = 'SKY-1';

export const CREW = {
  rae: { name: 'Rae', role: 'FIXER', color: 0xff5a5a, css: '#ff6b6b' },
  sable: { name: 'Sable', role: 'LOOKOUT', color: 0xffd166, css: '#ffd166' },
  marlo: { name: 'Marlo', role: 'DRIVER', color: 0x4ecdc4, css: '#4ecdc4' },
};

export const RADIO_STATIONS = [
  { name: 'SHORELINE 96.7', mood: 'sunset drive' },
  { name: 'PIER 102.5', mood: 'night cruise' },
  { name: 'DUNE 89.9', mood: 'desert wind' },
];

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
export function dist2D(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }

/** Deterministic stream for screenshot staging and world dressing. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
