// Procedural canvas textures for SUNCOAST: HEATLINE.
// One clear job: every texture the city wears, painted on canvas at boot
// so the game ships zero image files and zero network requests.

export function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

/** Lit-window facade: warm windows on a dusk gradient, seeded. */
export function buildingTexture(seed, base, litRatio) {
  const rng = mulberry32Local(seed);
  const c = makeCanvas(128, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, shade(base, 1.25));
    grad.addColorStop(1, shade(base, 0.8));
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let y = 12; y < h - 12; y += 22) {
      for (let x = 10; x < w - 10; x += 18) {
        const lit = rng() < litRatio;
        g.fillStyle = lit ? '#ffd98a' : '#1d2733';
        g.globalAlpha = lit ? 0.95 : 0.85;
        g.fillRect(x, y, 11, 14);
      }
    }
    g.globalAlpha = 1;
  });
  return c;
}

/** Asphalt with a centre line and edge wear. */
export function roadTexture() {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#3a3f47'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#43484f';
    for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    g.fillStyle = '#e8c85a';
    g.fillRect(w / 2 - 2, 0, 4, h);
    g.fillStyle = '#dfe6ee';
    g.fillRect(4, 0, 3, h); g.fillRect(w - 7, 0, 3, h);
  });
}

/** Sand with speckle and a wet band near the waterline. */
export function sandTexture() {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#e6c98f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = Math.random() < 0.5 ? '#d9b878' : '#f2dcae';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

/** Boardwalk planks, warm wood with gaps. */
export function boardwalkTexture() {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#8a5a33'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = y % 32 === 0 ? '#96683c' : '#7d4f2c';
      g.fillRect(0, y, w, 14);
      g.fillStyle = '#5d3a20'; g.fillRect(0, y + 14, w, 2);
    }
  });
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

function mulberry32Local(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
