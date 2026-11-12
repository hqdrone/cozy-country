// Иконки предметов и кнопок (16x16). icon(id) → canvas, iconURL(id) → картинка для интерфейса.
import { C, spr, R, P, blob, ellipse, line } from './pixel.js';
import { ITEMS } from '../config/items.js';
import { cropSprite } from './sprites_nature.js';
import { grannySprite } from './sprites_chars.js';
import * as B from './sprites_build.js';

const SEED_COL = { radish: '#d8466a', carrot: C.orange, potato: '#b08850', cucumber: '#4f8a3a', sunflower: C.yellow, pumpkin: C.orangeD };

function jar(g, fill, fillD, cover) {
  R(g, 4, 5, 8, 10, '#d8eef0'); R(g, 3, 6, 10, 8, '#d8eef0');
  if (fill) { R(g, 4, 7, 8, 7, fill); R(g, 3, 8, 10, 5, fill); R(g, 10, 8, 2, 6, fillD); }
  P(g, 4, 8, '#ffffff'); P(g, 4, 9, '#ffffff');
  if (cover) { R(g, 3, 2, 10, 4, cover); R(g, 2, 5, 12, 1, cover); R(g, 3, 4, 10, 1, C.redD); }
  else { R(g, 4, 3, 8, 2, C.metalL); R(g, 4, 4, 8, 1, C.metal); }
  if (fill) { R(g, 5, 10, 6, 3, C.white); R(g, 6, 11, 4, 1, fillD); }
}

const DRAW = {
  wood: g => { R(g, 2, 6, 11, 6, C.wood); R(g, 2, 6, 11, 1, C.woodL); R(g, 2, 11, 11, 1, C.woodD); ellipse(g, 12.5, 9, 2.5, 3, '#d8b98a'); P(g, 12, 9, '#a87c4f'); R(g, 5, 8, 4, 1, C.woodD); },
  stone: g => blob(g, 8, 9, 5.5, 4.5, 3, [C.stoneL, C.stone, C.stoneD, C.stoneDD], 0.2),
  currant: g => { line(g, 8, 2, 8, 6, C.greenD); blob(g, 11, 4, 2.5, 1.5, 2, [C.greenL, C.green, C.greenD], 0.1);
    for (const [x, y] of [[5, 7], [9, 7], [7, 10], [11, 10], [5, 12], [9, 13]]) { ellipse(g, x + 0.5, y + 0.5, 2, 2, '#3a2b4a'); P(g, x - 1, y - 1, '#7a6a9a'); } },
  raspberry: g => { blob(g, 8, 9, 5, 5, 4, ['#f28a9a', '#d6475e', '#a8304a'], 0.1);
    for (let y = 6; y < 14; y += 2) for (let x = 5 + (y % 4 ? 1 : 0); x < 12; x += 2) P(g, x, y, '#f28a9a');
    R(g, 6, 3, 4, 2, C.green); P(g, 8, 2, C.greenD); },
  radish: g => { ellipse(g, 8, 10, 4.5, 4, '#d8466a'); P(g, 6, 8, '#f07a96'); P(g, 7, 8, '#f07a96'); R(g, 8, 14, 1, 2, C.white); R(g, 6, 2, 2, 5, C.green); R(g, 9, 1, 2, 5, C.greenL); },
  carrot: g => { for (let i = 0; i < 9; i++) R(g, 4 + i, 4 + i, Math.max(1, 5 - (i >> 1)), 2, i % 3 ? C.orange : C.orangeD); R(g, 2, 2, 3, 3, C.green); R(g, 4, 1, 2, 2, C.greenL); P(g, 1, 4, C.greenL); },
  potato: g => { blob(g, 8, 9, 6, 4.5, 8, ['#d8b880', '#b8945a', '#946e3a'], 0.15); P(g, 6, 8, '#6a4a2a'); P(g, 10, 10, '#6a4a2a'); P(g, 8, 11, '#6a4a2a'); },
  cucumber: g => { for (let i = 0; i < 10; i++) R(g, 3 + i, 11 - i, 3, 3, i % 2 ? '#4f8a3a' : '#5a9a44'); line(g, 4, 11, 12, 3, '#7aaa5a'); P(g, 6, 10, '#c8e0a0'); P(g, 10, 6, '#c8e0a0'); },
  sunflower: g => { ellipse(g, 8, 8, 6.5, 6.5, C.yellow); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; P(g, Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), C.yellowD); } ellipse(g, 8, 8, 3.5, 3.5, '#6a4426'); P(g, 7, 7, '#8a5a36'); },
  pumpkin: g => { blob(g, 8, 10, 6.5, 5, 9, ['#f8a85a', C.orange, C.orangeD, '#a05418'], 0.1); R(g, 5, 6, 1, 8, C.orangeD); R(g, 11, 6, 1, 8, C.orangeD); R(g, 8, 2, 2, 4, C.greenD); },
  jar: g => jar(g, null),
  jam_currant: g => jar(g, '#4a2a4a', '#2e1a30', '#e8dcc0'),
  jam_raspberry: g => jar(g, '#c0304a', '#8a2034', '#e8dcc0'),
  pickles: g => { jar(g, '#9ab86a', '#7a9a4a'); R(g, 5, 8, 2, 6, '#4f8a3a'); R(g, 9, 7, 2, 7, '#4f8a3a'); P(g, 7, 6, '#3a6a2a'); },
  pie: g => { ellipse(g, 8, 10, 7, 4, '#c8843a'); ellipse(g, 8, 9, 6, 3, '#e0a454'); P(g, 5, 8, '#f8d088'); P(g, 6, 8, '#f8d088'); line(g, 4, 10, 12, 10, '#b06a2a'); },
  coin: g => { ellipse(g, 8, 8, 6, 6, C.yellowD); ellipse(g, 8, 7.5, 5, 5, C.yellow); R(g, 7, 5, 2, 5, C.yellowD); P(g, 5, 5, C.glowL); P(g, 6, 4, C.glowL); },
  axe: g => { line(g, 4, 14, 11, 3, C.woodD, 2); R(g, 9, 1, 5, 6, C.stone); R(g, 13, 2, 1, 4, C.stoneL); R(g, 9, 1, 5, 1, C.stoneL); },
  pickaxe: g => { line(g, 4, 14, 10, 4, C.woodD, 2); line(g, 3, 4, 8, 1, C.stone, 2); line(g, 8, 1, 14, 5, C.stone, 2); P(g, 3, 5, C.stoneD); P(g, 14, 6, C.stoneD); },
  shovel: g => { line(g, 4, 13, 11, 2, C.woodD, 1); R(g, 3, 11, 5, 4, C.metalL); R(g, 4, 14, 3, 1, C.metal); R(g, 10, 1, 3, 1, C.woodD); },
  can: g => { R(g, 4, 6, 8, 8, '#6a9aa8'); R(g, 4, 6, 8, 1, '#8ab8c4'); R(g, 11, 7, 1, 7, '#4a7a88'); line(g, 12, 9, 15, 5, '#6a9aa8'); R(g, 14, 4, 2, 2, '#4a7a88'); line(g, 5, 6, 8, 2, '#4a7a88'); line(g, 8, 2, 11, 6, '#4a7a88'); },
  fence: g => { R(g, 0, 7, 16, 2, '#97805c'); R(g, 0, 11, 16, 2, '#97805c'); for (let x = 1; x < 16; x += 5) { R(g, x, 3, 3, 12, '#d8c69e'); R(g, x + 2, 3, 1, 12, '#b6a37c'); P(g, x + 1, 2, '#d8c69e'); } },
  gate: g => g.drawImage(B.gateSprite('h', false), 0, -4),
  path: g => g.drawImage(B.pathSprite(0), 0, 0),
  gardenbed: g => { R(g, 1, 3, 14, 11, C.soil); for (const y of [5, 8, 11]) R(g, 2, y, 12, 1, C.soilD); R(g, 0, 2, 16, 2, C.plank); R(g, 0, 13, 16, 2, C.plankD); R(g, 0, 2, 2, 13, C.plank); R(g, 14, 2, 2, 13, C.plankD); P(g, 6, 6, C.greenL); P(g, 10, 9, C.greenL); },
  chest: g => g.drawImage(B.chestSprite(), 0, -1),
  flowerbed: g => g.drawImage(B.flowerbedSprite(0), 0, -2),
  bench: g => g.drawImage(B.benchSprite(), 0, -2),
  lantern: g => { g.drawImage(B.lanternSprite(true), 0, 0, 16, 32, 4, 0, 8, 16); },
  birdhouse: g => { g.drawImage(B.birdhouseSprite(), 0, 0, 16, 32, 4, 0, 8, 16); },
  scarecrow: g => { g.drawImage(B.scarecrowSprite(), 0, 0, 16, 32, 4, 0, 8, 16); },
  geranium: g => g.drawImage(B.geraniumSprite(), 0, 0),
  sellbox: g => g.drawImage(B.sellboxSprite(), 0, -3),
  van: g => g.drawImage(B.vanSprite(), 0, 0, 48, 40, 0, 2, 16, 13),

  // кнопки интерфейса
  backpack: g => { R(g, 3, 4, 10, 11, '#a0683c'); R(g, 3, 4, 10, 1, '#c08550'); R(g, 12, 5, 1, 10, '#7d4e2c'); R(g, 3, 4, 10, 5, '#b8783e'); R(g, 3, 9, 10, 1, '#7d4e2c'); R(g, 7, 8, 2, 3, C.brass); R(g, 5, 1, 6, 3, '#7d4e2c'); R(g, 6, 2, 4, 2, 'rgba(0,0,0,0)'); g.clearRect(6, 2, 4, 2); R(g, 4, 11, 8, 3, '#94603a'); },
  build: g => { line(g, 3, 14, 10, 7, C.woodD, 2); R(g, 8, 2, 7, 4, C.metal); R(g, 8, 2, 7, 1, C.metalL); R(g, 13, 1, 2, 6, C.metalD); },
  gear: g => { ellipse(g, 8, 8, 6, 6, C.metal); for (const [x, y] of [[7, 0], [7, 14], [0, 7], [14, 7], [2, 2], [12, 2], [2, 12], [12, 12]]) R(g, x, y, 2, 2, C.metal); ellipse(g, 8, 8, 2.5, 2.5, '#efe6d0'); },
  close: g => { line(g, 3, 3, 12, 12, '#7a4a3a', 2); line(g, 12, 3, 3, 12, '#7a4a3a', 2); },
  check: g => { line(g, 2, 8, 6, 12, '#4a8a3a', 2); line(g, 6, 12, 13, 3, '#4a8a3a', 2); },
  music: g => { R(g, 5, 3, 2, 9, C.ink); R(g, 11, 2, 2, 9, C.ink); R(g, 5, 2, 8, 2, C.ink); ellipse(g, 4.5, 12, 2.5, 2, C.ink); ellipse(g, 10.5, 11, 2.5, 2, C.ink); },
  music_off: g => { DRAW.music(g); line(g, 1, 14, 14, 1, C.red, 2); },
  sound: g => { R(g, 2, 6, 3, 4, C.ink); for (let i = 0; i < 4; i++) R(g, 5 + i, 5 - i, 1, 6 + i * 2, C.ink); line(g, 11, 5, 12, 8, C.ink); line(g, 12, 8, 11, 11, C.ink); line(g, 13, 3, 15, 8, C.ink); line(g, 15, 8, 13, 13, C.ink); },
  sound_off: g => { DRAW.sound(g); line(g, 1, 14, 14, 1, C.red, 2); },
  moon: g => { ellipse(g, 8, 8, 6, 6, '#f2e2a0'); ellipse(g, 11, 6, 5, 5, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; ellipse(g, 11, 6, 4.5, 4.5, '#000'); g.globalCompositeOperation = 'source-over'; },
  sun: g => { ellipse(g, 8, 8, 4, 4, C.yellow); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(g, Math.round(8 + Math.cos(a) * 6.5), Math.round(8 + Math.sin(a) * 6.5), C.yellow); } P(g, 7, 6, C.glowL); },
  bed: g => { R(g, 1, 7, 14, 6, '#e0b860'); R(g, 1, 5, 5, 4, C.white); R(g, 1, 13, 1, 2, C.metalD); R(g, 14, 13, 1, 2, C.metalD); R(g, 0, 3, 1, 12, C.metalD); },
  granny: g => { g.drawImage(grannySprite('down', 0), 0, 0, 16, 12, 0, 2, 16, 12); },
  heart: g => { for (const [x, y, w] of [[3, 4, 4], [9, 4, 4], [2, 5, 12], [2, 6, 12], [3, 8, 10], [4, 10, 8], [6, 12, 4], [7, 13, 2]]) R(g, x, y, w, y === 6 ? 3 : 2, '#e05a6a'); P(g, 4, 5, '#f8a0a8'); },
  house: g => { R(g, 3, 8, 10, 7, C.wood); R(g, 3, 8, 10, 1, C.woodL); for (let i = 0; i < 6; i++) R(g, 2 + i, 7 - i, 12 - i * 2, 1, '#b0503c'); R(g, 7, 11, 2, 4, C.woodDD); R(g, 4, 10, 2, 2, C.glow); R(g, 10, 10, 2, 2, C.glow); },
  question: g => { R(g, 5, 3, 6, 2, C.ink); R(g, 10, 4, 2, 4, C.ink); R(g, 7, 7, 3, 2, C.ink); R(g, 7, 9, 2, 2, C.ink); R(g, 7, 12, 2, 2, C.ink); },
  clock: g => { ellipse(g, 8, 8, 6.5, 6.5, C.white); ellipse(g, 8, 8, 5.5, 5.5, '#fbf6e6'); R(g, 8, 4, 1, 5, C.ink); R(g, 8, 8, 3, 1, C.ink); },
  water: g => { for (let y = 0; y < 10; y++) { const w = Math.round(Math.sin(y / 10 * Math.PI) * 4 + (y > 4 ? 1 : 0)); R(g, 8 - w, 3 + y, w * 2, 1, '#5aa0d0'); } P(g, 6, 9, '#b0e0f8'); },
  hand: g => { R(g, 5, 6, 7, 7, C.skin); for (let i = 0; i < 4; i++) R(g, 5 + i * 2, 2 + (i === 0 ? 2 : 0), 1, 5, C.skin); R(g, 11, 5, 2, 3, C.skin); R(g, 5, 12, 7, 1, C.skinD); },
  cat: g => { g.drawImage(spriteCatIcon(), 0, 2); },
};

let catIconSrc = null;
export function setCatIconSource(fn) { catIconSrc = fn; }
function spriteCatIcon() { return catIconSrc ? catIconSrc() : document.createElement('canvas'); }

export function icon(id) {
  return spr('icon-' + id, 16, 16, g => {
    const d = DRAW[id];
    if (d) return d(g);
    const it = ITEMS[id];
    if (it && it.cat === 'seed') {
      // пакетик семян
      R(g, 3, 2, 10, 13, '#efe4c8'); R(g, 3, 2, 10, 2, '#d8c8a0'); R(g, 12, 3, 1, 12, '#c8b890');
      for (let x = 3; x < 13; x += 2) P(g, x, 1, '#efe4c8');
      const col = SEED_COL[it.crop] || C.green;
      ellipse(g, 8, 9, 3.5, 3.5, col); P(g, 7, 8, 'rgba(255,255,255,0.6)');
      R(g, 4, 13, 8, 1, col);
      return;
    }
    // запасной вариант — кружок с буквой
    ellipse(g, 8, 8, 6, 6, C.plank);
  });
}

const urls = new Map();
export function iconURL(id, scale = 4) {
  const k = id + '@' + scale;
  if (!urls.has(k)) {
    const src = icon(id);
    const c = document.createElement('canvas');
    c.width = 16 * scale; c.height = 16 * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    urls.set(k, c.toDataURL());
  }
  return urls.get(k);
}

export function imgHTML(id, cls = 'ico') {
  return `<img class="${cls}" src="${iconURL(id)}" alt="" draggable="false">`;
}

export { cropSprite };
