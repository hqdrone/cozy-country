// Базовые инструменты пиксельного рисования и палитра «старая открытка».
import { hash2 } from '../core/rng.js';

export const C = {
  grass: '#8db35b', grassD: '#79a04c', grassL: '#a3c56c', grassDD: '#628a40',
  dirt: '#c9a56d', dirtD: '#b28c59', dirtL: '#d9bb87',
  plot: '#8a5d3b', plotD: '#764d30', plotL: '#9b6d48',
  soil: '#6a4430', soilD: '#52331f', soilL: '#7f5639', soilW: '#4b2f20', soilWD: '#36211a', soilWL: '#5f4232',
  sand: '#e6d39f', sandD: '#d3bd86', sandL: '#f1e3b8',
  water: '#5b9bb3', waterD: '#4b88a1', waterL: '#86bfcf', foam: '#c9e6e8',
  wood: '#a26b3d', woodD: '#7d4e2c', woodDD: '#5a361e', woodL: '#c08550', woodLL: '#d8a46c',
  plank: '#b98a57', plankD: '#9c6f42', plankL: '#cfa06a', plankDD: '#7a5233',
  stone: '#a8a299', stoneD: '#857f77', stoneL: '#c8c2b8', stoneDD: '#625d57',
  birch: '#efe9da', birchD: '#cfc6b2', bark: '#3a3330',
  leaf: '#93b44f', leafD: '#729440', leafL: '#b5cf6a', leafDD: '#587a33',
  spruce: '#4a7a50', spruceD: '#355e3c', spruceL: '#649361', spruceDD: '#264a2e',
  white: '#f4efe2', whiteD: '#d9d1bf', blue: '#5a86b6', blueD: '#41658f', blueL: '#86a9d0',
  glass: '#8fbccc', glassD: '#6f9fb2', glassL: '#bfe0e6', glow: '#ffd47a', glowL: '#fff0b8', glowD: '#e8a850',
  skin: '#f2c49c', skinD: '#d9a07a', ink: '#3a2a22', cheek: '#ec9c8c',
  red: '#c6463a', redD: '#9a3028', redL: '#e0705a', yellow: '#f2c84a', yellowD: '#d4a02e',
  orange: '#e88a3a', orangeD: '#c06a24', pink: '#e98a9a', purple: '#7a5a9a',
  wheat: '#e2c46e', wheatD: '#c9a650', wheatL: '#f0d88a', wheatDD: '#a8873c',
  brick: '#a8503e', brickD: '#7a382c',
  metal: '#6a6a74', metalL: '#9a9aa6', metalD: '#4a4a52',
  brass: '#d6a644', brassL: '#f2cf72', brassD: '#a8772a',
  green: '#5e8a4a', greenD: '#466c36', greenL: '#7eaa5e',
};

export function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function ctx2d(c) {
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return g;
}
export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };

const memo = new Map();
// Создать (один раз) спрайт по ключу
export function spr(keyName, w, h, fn) {
  let c = memo.get(keyName);
  if (!c) { c = cv(w, h); fn(ctx2d(c), c); memo.set(keyName, c); }
  return c;
}

// Круглый «комок» с объёмной заливкой: ramp = [светлый, основной, тёмный, самый тёмный]
export function blob(g, cx, cy, rx, ry, seed, ramp, rough = 0.3) {
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
    for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const d = dx * dx + dy * dy;
      const n = hash2(x, y, seed);
      if (d > 1 - rough * 0.5 + n * rough) continue;
      const l = -dx * 0.5 - dy * 0.8 + (n - 0.5) * 0.5;
      let c = ramp[1];
      if (l > 0.45) c = ramp[0];
      else if (l < -0.75 && ramp[3]) c = ramp[3];
      else if (l < -0.3) c = ramp[2];
      P(g, x, y, c);
    }
}

// Линия (Брезенхем)
export function line(g, x0, y0, x1, y1, c, w = 1) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    R(g, x0, y0, w, w, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Залитый эллипс
export function ellipse(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) P(g, x, y, c);
    }
}

export { hash2 };
