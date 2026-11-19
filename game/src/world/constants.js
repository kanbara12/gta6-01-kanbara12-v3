// District and street names for SUNCOAST: HEATLINE.
// One clear job: the city's geography as data — districts, streets, the
// road grid — so the world, HUD minimap and missions all agree on it.

export const DISTRICTS = [
  { name: 'DOWNTOWN', cx: 0, cz: -20, r: 70, color: '#ffd166' },
  { name: 'BOARDWALK', cx: 140, cz: 0, r: 45, color: '#4ecdc4' },
  { name: 'MARINA', cx: 120, cz: 100, r: 40, color: '#7bdff2' },
  { name: 'NORTH BEACH', cx: 140, cz: -130, r: 40, color: '#f7b267' },
  { name: 'INDUSTRIAL YARD', cx: 75, cz: -75, r: 35, color: '#ff6b6b' },
  { name: 'OLD TOWN', cx: -70, cz: 60, r: 45, color: '#b8f2e6' },
];

export const STREETS = [
  { name: 'Sunset Ave', axis: 'z', at: 36 },
  { name: 'Palm Row', axis: 'z', at: -36 },
  { name: 'Marina Blvd', axis: 'z', at: 108 },
  { name: 'North Shore Rd', axis: 'z', at: -108 },
  { name: 'Central Ave', axis: 'x', at: 0 },
  { name: 'Harbor St', axis: 'x', at: 72 },
  { name: 'Old Town Rd', axis: 'x', at: -72 },
  { name: 'Beachfront Rd', axis: 'x', at: 140 },
];

// Road centre-lines: avenues run north-south (x = const), streets run
// east-west (z = const). Grid spacing 36, matching the street list.
export const GRID_X = [-144, -108, -72, -36, 0, 36, 72, 108, 140];
export const GRID_Z = [-144, -108, -72, -36, 0, 36, 72, 108, 144];

export function districtAt(x, z) {
  let best = null, bestD = 1e9;
  for (const d of DISTRICTS) {
    const dd = Math.hypot(x - d.cx, z - d.cz);
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return bestD < best.r ? best : DISTRICTS[0];
}

export function streetAt(x, z) {
  // Nearest named road to a point.
  let best = null, bestD = 1e9;
  for (const s of STREETS) {
    const d = s.axis === 'z' ? Math.abs(z - s.at) : Math.abs(x - s.at);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
