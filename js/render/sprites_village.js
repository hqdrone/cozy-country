// Деревня: изба жителя, сельпо, баня, клуб и сами жители.
import { C, spr, R, P, ellipse, line, hash2 } from './pixel.js';
import { VILLAGERS } from '../config/villagers.js';

// Маленький пиксельный шрифт 3x5 для вывесок
const GLYPH = {
  'С': ['111', '100', '100', '100', '111'], 'Е': ['111', '100', '110', '100', '111'],
  'Л': ['011', '101', '101', '101', '101'], 'Ь': ['100', '100', '111', '101', '111'],
  'П': ['111', '101', '101', '101', '101'], 'О': ['111', '101', '101', '101', '111'],
  'К': ['101', '110', '100', '110', '101'], 'У': ['101', '101', '111', '001', '111'],
  'Б': ['111', '100', '111', '101', '111'], 'А': ['010', '101', '111', '101', '101'],
  'Н': ['101', '101', '111', '101', '101'], 'Я': ['111', '101', '111', '011', '101'],
};
export function pixelText(g, text, x, y, col) {
  for (const ch of text) {
    const gl = GLYPH[ch];
    if (gl) gl.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') P(g, x + i, y + j, col); }));
    x += 4;
  }
}

function logs(g, x0, y0, w, h, ramp, ends = true) {
  for (let y = y0; y < y0 + h; y += 5) {
    const hh = Math.min(5, y0 + h - y);
    R(g, x0, y, w, hh, ramp[1]); R(g, x0, y, w, 1, ramp[0]); if (hh === 5) R(g, x0, y + 4, w, 1, ramp[2]);
    if (ends) { ellipse(g, x0 - 0.5, y + 2.5, 2.2, 2.2, '#c8935e'); ellipse(g, x0 + w + 0.5, y + 2.5, 2.2, 2.2, '#c8935e'); }
  }
}
function roof(g, x0, x1, y0, y1, ramp) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / (y1 - y0);
    for (let x = Math.round(x0 + 3 - t * 3); x < Math.round(x1 - 3 + t * 3); x++)
      P(g, x, y, y < y0 + 3 ? ramp[2] : (x % 5 === 0 ? ramp[2] : x % 5 === 1 ? ramp[0] : ramp[1]));
  }
}
function windowNal(g, wx, wy, lit, shutter) {
  R(g, wx - 4, wy + 1, 4, 14, shutter[0]); R(g, wx + 14, wy + 1, 4, 14, shutter[0]);
  for (let y = wy + 3; y < wy + 15; y += 3) { R(g, wx - 4, y, 4, 1, shutter[1]); R(g, wx + 14, y, 4, 1, shutter[1]); }
  R(g, wx, wy, 14, 16, C.white);
  R(g, wx + 2, wy + 2, 10, 12, lit ? C.glow : C.glass);
  if (lit) R(g, wx + 4, wy + 4, 6, 8, C.glowL); else line(g, wx + 3, wy + 12, wx + 10, wy + 4, C.glassL);
  R(g, wx + 6, wy + 2, 2, 12, C.white); R(g, wx + 2, wy + 7, 10, 2, C.white);
  R(g, wx - 1, wy - 3, 16, 3, C.white); R(g, wx + 2, wy - 4, 10, 1, C.white); R(g, wx + 5, wy - 5, 4, 1, C.white);
  P(g, wx + 6, wy - 3, shutter[0]); P(g, wx + 7, wy - 3, shutter[0]);
  R(g, wx - 1, wy + 16, 16, 2, C.white); for (let x = wx; x < wx + 14; x += 3) P(g, x, wy + 18, C.white);
}
function door(g, x, y, w, h, col = C.woodD) {
  R(g, x - 1, y - 2, w + 2, 2, C.white); R(g, x - 1, y, 1, h, C.white); R(g, x + w, y, 1, h, C.white);
  R(g, x, y, w, h, col);
  for (let i = x + 2; i < x + w; i += 3) R(g, i, y, 1, h, C.woodDD);
  P(g, x + w - 2, y + Math.floor(h / 2), C.brassL);
}

// Изба жителя 4x3 (64x80)
export function cottageSprite(who, lit) {
  return spr(`cottage-${who}-${lit}`, 64, 80, g => {
    const v = VILLAGERS[who] || {};
    const rf = v.roof || ['#c86b52', '#b0503c', '#8e3e2f'], sh = v.shutter || [C.blue, C.blueD];
    logs(g, 3, 46, 58, 30, [C.woodL, C.wood, C.woodD]);
    R(g, 3, 76, 58, 4, C.stoneD); R(g, 3, 76, 58, 1, C.stone);
    roof(g, 0, 64, 6, 46, rf);
    R(g, 0, 44, 64, 3, C.white); for (let x = 0; x < 64; x += 4) { P(g, x + 1, 47, C.white); P(g, x + 2, 47, C.white); P(g, x + 2, 48, C.white); }
    R(g, 46, 0, 7, 16, C.brick); R(g, 45, 0, 9, 2, C.brickD); for (let y = 4; y < 16; y += 3) R(g, 46, y, 7, 1, C.brickD);
    door(g, 19, 56, 10, 20);
    windowNal(g, 39, 54, lit, sh);
    R(g, 15, 76, 18, 4, C.plank); R(g, 15, 76, 18, 1, C.plankL);
    // скамеечка у крыльца
    R(g, 4, 70, 11, 2, C.plank); R(g, 5, 72, 1, 4, C.woodD); R(g, 13, 72, 1, 4, C.woodD);
  });
}

// Сельпо 4x3 (64x78)
export function selpoSprite(lit) {
  return spr('selpo-' + lit, 64, 78, g => {
    R(g, 2, 34, 60, 40, '#a8c8d0');
    for (let x = 4; x < 62; x += 4) R(g, x, 34, 1, 40, '#88a8b4');
    R(g, 2, 74, 60, 4, C.stoneD); R(g, 2, 74, 60, 1, C.stone);
    // крыша
    for (let y = 8; y < 32; y++) { const t = (y - 8) / 24; R(g, Math.round(4 - t * 4), y, Math.round(56 + t * 8), 1, y % 3 ? '#8a949c' : '#6e787f'); }
    R(g, 4, 6, 56, 3, '#5e676e');
    // вывеска
    R(g, 10, 22, 44, 11, C.white); R(g, 10, 32, 44, 1, C.whiteD); R(g, 11, 23, 42, 1, '#d8d0bc');
    pixelText(g, 'СЕЛЬПО', 21, 25, C.red);
    // витрина с товарами
    R(g, 5, 42, 24, 20, C.white); R(g, 7, 44, 20, 16, lit ? C.glow : '#cfe6ec');
    R(g, 7, 52, 20, 1, C.white);
    R(g, 9, 47, 4, 5, '#d89a50'); R(g, 15, 46, 3, 6, '#5a8a4a'); R(g, 20, 47, 4, 5, C.red); P(g, 21, 46, C.white);
    R(g, 9, 55, 3, 5, C.orange); R(g, 14, 56, 5, 4, '#e8dcc0'); R(g, 21, 55, 4, 5, '#d8466a');
    R(g, 3, 62, 28, 2, C.white);
    door(g, 35, 46, 10, 28, '#5a86b6');
    R(g, 37, 50, 6, 8, lit ? C.glow : '#cfe6ec');
    R(g, 31, 74, 18, 4, C.stone); R(g, 31, 74, 18, 1, C.stoneL);
    // ящики у входа
    R(g, 50, 64, 9, 10, C.plank); R(g, 50, 68, 9, 1, C.plankD); R(g, 51, 61, 3, 3, C.orange); R(g, 55, 62, 3, 2, '#d8466a');
  });
}

// Баня 3x3 (48x72)
export function banyaSprite(lit) {
  return spr('banya-' + lit, 48, 72, g => {
    logs(g, 4, 40, 40, 28, ['#8a6040', '#6e4a2e', '#52341e']);
    R(g, 4, 68, 40, 4, C.stoneD);
    for (let y = 10; y < 40; y++) { const t = (y - 10) / 30; R(g, Math.round(2 - t * 2), y, Math.round(44 + t * 4), 1, y % 4 ? '#8a8478' : '#6e695f'); }
    R(g, 3, 8, 42, 3, '#5a554c');
    // железная труба
    R(g, 34, 0, 4, 14, C.metal); R(g, 33, 0, 6, 2, C.metalD); R(g, 37, 2, 1, 12, C.metalD);
    door(g, 18, 48, 9, 20, '#5a3a22');
    // окошко
    R(g, 32, 48, 8, 7, C.white); R(g, 33, 49, 6, 5, lit ? C.glow : C.glass); R(g, 35, 49, 1, 5, C.white);
    // веник и тазик
    line(g, 9, 47, 12, 56, C.woodD); for (let i = 0; i < 4; i++) line(g, 12, 56, 9 + i * 2, 62, i % 2 ? C.green : C.greenD);
    ellipse(g, 38, 66, 4, 2, C.metalL); R(g, 34, 64, 8, 2, C.metal);
    // поленница
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ellipse(g, 7 + i * 4, 64 - j * 4, 2, 2, '#c8935e');
  });
}

// Клуб 5x3 (80x88)
export function clubSprite(lit, party) {
  return spr(`club-${lit}-${party}`, 80, 88, g => {
    R(g, 4, 44, 72, 40, '#d8b060');
    for (let y = 46; y < 84; y += 4) R(g, 4, y, 72, 1, '#c09848');
    R(g, 4, 84, 72, 4, C.stoneD); R(g, 4, 84, 72, 1, C.stone);
    // крыша с фронтоном
    for (let y = 14; y < 46; y++) { const t = (y - 14) / 32; R(g, Math.round(2 - t * 2), y, Math.round(76 + t * 4), 1, y % 3 ? '#6f8f5a' : '#557448'); }
    for (let y = 0; y < 26; y++) { const hw = Math.round(y * 1.3); R(g, 40 - hw, 16 + y, hw * 2, 1, y % 4 ? '#e8d8b0' : '#d8c8a0'); }
    line(g, 40, 15, 6, 42, C.white, 2); line(g, 40, 15, 74, 42, C.white, 2);
    ellipse(g, 40, 30, 4, 4, C.white); ellipse(g, 40, 30, 3, 3, lit ? C.glow : C.glass);
    // вывеска
    R(g, 26, 44, 28, 9, '#a83a34'); R(g, 26, 52, 28, 1, '#7a2a24');
    pixelText(g, 'КЛУБ', 33, 46, C.white);
    // окна
    for (const wx of [9, 59]) { R(g, wx, 56, 12, 16, C.white); R(g, wx + 2, 58, 8, 12, lit ? C.glow : C.glass); R(g, wx + 5, 58, 2, 12, C.white); R(g, wx + 2, 63, 8, 1, C.white); }
    // крыльцо с колоннами
    R(g, 26, 56, 28, 2, C.white);
    R(g, 27, 58, 3, 26, C.white); R(g, 50, 58, 3, 26, C.white); R(g, 29, 58, 1, 26, C.whiteD); R(g, 52, 58, 1, 26, C.whiteD);
    door(g, 35, 62, 10, 22, '#7a4a2a');
    R(g, 24, 84, 32, 4, C.plank); R(g, 24, 84, 32, 1, C.plankL);
    // афиша
    R(g, 64, 74, 10, 10, C.white); R(g, 65, 75, 8, 5, '#7a9ac8'); R(g, 66, 77, 3, 2, C.yellow); R(g, 65, 81, 8, 1, C.ink);
    // гирлянда
    const cols = [C.red, C.yellow, '#6ac06a', '#6a9ae0', C.orange];
    for (let x = 4; x < 77; x += 5) {
      const y = 43 + Math.round(Math.sin(x / 5) * 1.5);
      P(g, x, y - 1, '#4a3a2a');
      R(g, x, y, 2, 2, party ? cols[(x / 5 | 0) % cols.length] : '#8a8070');
      if (party) P(g, x, y, '#ffffff');
    }
  });
}

// Жители: 16x20, ноги внизу
export function villagerSprite(id, dir, frame) {
  return spr(`vil-${id}-${dir}-${frame}`, 16, 20, g => {
    const v = VILLAGERS[id], L = v.look;
    const flip = dir === 'left';
    const X = x => (flip ? 15 - x : x);
    const px = (x, y, c) => P(g, X(x), y, c);
    const rect = (x, y, w, h, c) => { for (let i = 0; i < w; i++) R(g, X(x + i), y, 1, h, c); };
    const side = dir === 'left' || dir === 'right';
    const st = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const kid = !!v.kid;
    const hy = kid ? 6 : 4; // голова
    // ноги и обувь
    if (L.bottom === 'pants') {
      rect(5, 14, 6, 3, L.bottomC); if (!side) px(7, 16, '#2a2a30'); if (!side) px(8, 16, '#2a2a30');
      rect(5 + (st > 0 ? 0 : 0), 17, 2, 1, L.bottomC);
      rect(5 - (st > 0 ? 1 : 0), 18, 3, 1, C.woodDD); rect(9 + (st < 0 ? 1 : 0), 18, 3, 1, C.woodDD);
    } else {
      rect(6, 16, 1, 2, C.skin); rect(9, 16, 1, 2, C.skin);
      rect(5 - (st > 0 ? 1 : 0), 18, 2, 1, C.red); rect(9 + (st < 0 ? 1 : 0), 18, 2, 1, C.red);
      rect(4, 13, 8, 3, L.bottomC); rect(4, 15, 8, 1, L.topD || L.bottomC);
    }
    // туловище
    const by = kid ? 11 : 9;
    rect(5, by, 6, 14 - by, L.top); if (side) rect(10, by, 1, 14 - by, L.topD);
    if (L.overalls && !side) { rect(6, by, 1, 3, L.topD); rect(9, by, 1, 3, L.topD); rect(6, by + 3, 4, 2, L.topD); }
    if (L.overalls) rect(5, by, 6, 1, '#d8d0c0');
    if (L.apron && dir === 'down') { rect(6, by + 1, 4, 6, C.white); px(7, by + 3, '#e0a0a0'); }
    // руки
    if (!side) { rect(4, by, 1, 3, L.top); px(4, by + 3, C.skin); rect(11, by, 1, 3, L.top); px(11, by + 3, C.skin); }
    else { rect(7 + st, by + 1, 1, 2, L.topD); px(7 + st, by + 3, C.skin); }
    // голова
    if (dir === 'up') {
      rect(5, hy, 6, 4, L.hair);
    } else if (side) {
      rect(6, hy, 5, 4, C.skin); rect(5, hy, 2, 3, L.hair); px(9, hy + 1, C.ink); px(11, hy + 2, C.skin); px(10, hy + 2, C.cheek);
    } else {
      rect(5, hy, 6, 4, C.skin); px(6, hy + 1, C.ink); px(9, hy + 1, C.ink); px(5, hy + 2, C.cheek); px(10, hy + 2, C.cheek);
    }
    if (L.beard && dir !== 'up') { rect(side ? 7 : 6, hy + 2, side ? 4 : 4, 3, L.beard); px(side ? 8 : 7, hy + 5, L.beard); if (!side) px(8, hy + 5, L.beard); }
    if (L.mustache && dir !== 'up') rect(side ? 8 : 6, hy + 3, side ? 3 : 4, 1, L.mustache);
    // причёски и шапки
    if (L.style === 'cap') {
      rect(5, hy - 3, 6, 3, L.hat); rect(6, hy - 4, 4, 1, L.hat);
      if (dir === 'down') rect(4, hy - 1, 8, 1, L.hat);
      else if (side) rect(9, hy - 1, 4, 1, L.hat);
      px(4, hy, L.hair); px(11, hy, L.hair);
    } else if (L.style === 'perm') {
      rect(4, hy - 3, 8, 3, L.hair); rect(5, hy - 4, 6, 1, L.hair); rect(4, hy, 1, 3, L.hair); rect(11, hy, 1, 3, L.hair);
      px(5, hy - 2, '#a86a40'); px(8, hy - 3, '#a86a40'); px(10, hy - 1, '#a86a40');
    } else if (L.style === 'bows') {
      rect(5, hy - 2, 6, 2, L.hair); rect(4, hy - 1, 1, 4, L.hair); rect(11, hy - 1, 1, 4, L.hair);
      rect(3, hy + 2, 1, 3, L.hair); rect(12, hy + 2, 1, 3, L.hair);
      rect(2, hy + 1, 3, 2, L.bow); rect(11, hy + 1, 3, 2, L.bow);
    }
  });
}
