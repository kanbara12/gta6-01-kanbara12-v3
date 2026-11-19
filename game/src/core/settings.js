// Quality presets for SUNCOAST: HEATLINE.
// One clear job: the LOW / MEDIUM / HIGH switch (shadows, pixel ratio).

export const QUALITY_LEVELS = {
  low: { pixelRatio: 1, shadows: false, antialias: false },
  medium: { pixelRatio: 1.5, shadows: true, antialias: true },
  high: { pixelRatio: 2, shadows: true, antialias: true },
};

export function resolveQuality(name) {
  return QUALITY_LEVELS[name] || QUALITY_LEVELS.medium;
}

/** Pick a safe default: high-end desktops get HIGH, anything else MEDIUM. */
export function autoQuality() {
  const cores = (navigator.hardwareConcurrency || 4);
  const mem = (navigator.deviceMemory || 4);
  return cores >= 8 && mem >= 8 ? 'high' : 'medium';
}
