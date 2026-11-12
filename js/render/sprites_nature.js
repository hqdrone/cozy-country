// Природа и огород: тайлы земли, деревья, камни, кусты, растения.
import { C, spr, R, P, blob, ellipse, hash2, line } from './pixel.js';

// ---------- Тайлы земли (рисуются в большую подложку один раз) ----------
const MEADOW = ['#ffffff', '#ffffff', '#7a9ae0', '#e88aa8', '#f2d24a'];

export function drawGroundTile(g, sc, x, y, seed) {
  const t = sc.ground[y * sc.w + x];
  const ox = x * 16, oy = y * 16;
  const h = (i) => hash2(x * 16 + (i % 16), y * 16 + ((i / 16) | 0), seed);
  const speck = (base, cols, n) => {
    R(g, ox, oy, 16, 16, base);
    for (let i = 0; i < n; i++) {
      const r = hash2(x, y, seed + i * 7);
      const px = (r * 256) | 0;
      P(g, ox + (px % 16), oy + ((px / 16) | 0), cols[i % cols.length]);
    }
  };
  switch (t) {
    case 'g': {
      speck(C.grass, [C.grassD, C.grassD, C.grassL, C.grassD], 22);
      // травинки
      for (let i = 0; i < 4; i++) {
        const r = hash2(x + 31, y + i * 13, seed);
        const px = ox + 1 + ((r * 14) | 0), py = oy + 2 + ((hash2(x, y + i, seed + 5) * 12) | 0);
        P(g, px, py, C.grassDD); P(g, px, py - 1, C.grassD);
      }
      // цветы на лугу
      if (hash2(x, y, seed + 99) < 0.09) {
        const col = MEADOW[(hash2(x, y, seed + 3) * MEADOW.length) | 0];
        const px = ox + 4 + ((hash2(x, y, 11) * 8) | 0), py = oy + 4 + ((hash2(x, y, 12) * 8) | 0);
        P(g, px - 1, py, col); P(g, px + 1, py, col); P(g, px, py - 1, col); P(g, px, py + 1, col);
        P(g, px, py, col === '#ffffff' ? C.yellow : C.white);
      }
      break;
    }
    case 'd': speck(C.dirt, [C.dirtD, C.dirtL, C.dirtD], 20);
      if (hash2(x, y, seed + 4) < 0.3) { const px = ox + 3 + ((hash2(x, y, 5) * 10) | 0); P(g, px, oy + 9, C.stone); P(g, px + 1, oy + 9, C.stoneL); }
      break;
    case 'p': speck(C.plot, [C.plotD, C.plotL, C.plotD], 26); break;
    case 's': speck(C.sand, [C.sandD, C.sandL], 14); break;
    case 'f': speck(C.wheatDD, [C.wheatD, '#97773a'], 30); break;
    case 'w': R(g, ox, oy, 16, 16, C.water); break;
    case 'b': {
      R(g, ox, oy, 16, 16, C.water);
      for (let i = 0; i < 4; i++) {
        R(g, ox + i * 4, oy, 4, 16, i % 2 ? C.plank : C.plankL);
        R(g, ox + i * 4 + 3, oy, 1, 16, C.plankDD);
        P(g, ox + i * 4 + 1, oy + 4 + (hash2(x, i, 3) * 8 | 0), C.plankD);
      }
      if (sc.ground[(y - 1) * sc.w + x] !== 'b') { R(g, ox, oy, 16, 2, C.woodD); R(g, ox, oy, 16, 1, C.wood); }
      if (sc.ground[(y + 1) * sc.w + x] !== 'b') { R(g, ox, oy + 14, 16, 2, C.woodD); R(g, ox, oy + 14, 16, 1, C.wood); }
      break;
    }
    case 'o': { // доски пола
      for (let r = 0; r < 4; r++) {
        R(g, ox, oy + r * 4, 16, 4, (r + y) % 2 ? C.plank : C.plankL);
        R(g, ox, oy + r * 4 + 3, 16, 1, C.plankD);
        const sx = (((y * 4 + r) * 7 + x * 16) % 24);
        if (sx < 16) R(g, ox + sx, oy + r * 4, 1, 3, C.plankD);
      }
      break;
    }
    case 'W': { // обои в цветочек
      R(g, ox, oy, 16, 16, '#ead6ad');
      for (let i = 0; i < 16; i += 8) for (let j = 0; j < 16; j += 8) {
        const sx = ox + i + ((y % 2) * 4), sy = oy + j + 3;
        P(g, sx + 2, sy, '#c98e6a'); P(g, sx + 1, sy + 1, '#c98e6a'); P(g, sx + 3, sy + 1, '#c98e6a'); P(g, sx + 2, sy + 2, '#c98e6a');
        P(g, sx + 2, sy + 1, '#e8b860'); P(g, sx + 2, sy + 3, '#9fb07a');
      }
      R(g, ox, oy + 6, 16, 1, '#dcc597');
      if (sc.ground[(y + 1) * sc.w + x] !== 'W') { R(g, ox, oy + 13, 16, 3, C.woodD); R(g, ox, oy + 13, 16, 1, C.wood); }
      if (y === 0) { R(g, ox, oy, 16, 2, C.woodD); }
      break;
    }
  }
  // Мягкие края травы на соседних клетках
  if (t !== 'g' && t !== 'w' && t !== 'b' && t !== 'o' && t !== 'W') {
    const nb = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of nb) {
      const n = sc.ground[(y + dy) * sc.w + (x + dx)];
      if (n !== 'g' || x + dx < 0 || y + dy < 0 || x + dx >= sc.w || y + dy >= sc.h) continue;
      for (let i = 0; i < 16; i++) {
        const d = 1 + (hash2(x * 16 + i, y * 16 + dx * 3 + dy * 5, seed) < 0.4 ? 1 : 0) + (hash2(i, x + y, 7) < 0.12 ? 1 : 0);
        for (let k = 0; k < d; k++) {
          const px = dx === 0 ? ox + i : (dx < 0 ? ox + k : ox + 15 - k);
          const py = dy === 0 ? oy + i : (dy < 0 ? oy + k : oy + 15 - k);
          P(g, px, py, k === d - 1 ? C.grassD : C.grass);
        }
      }
    }
  }
}

// ---------- Деревья (24x36, основание ствола в (12,35)) ----------
export function treeSprite(type, v) {
  return {
    trunk: spr(`trunk-${type}-${v}`, 24, 36, g => {
      if (type === 'birch') {
        R(g, 11, 16, 2, 20, C.birch); R(g, 12, 16, 1, 20, C.birchD);
        R(g, 10, 33, 4, 3, C.birch); P(g, 13, 34, C.birchD); P(g, 13, 35, C.birchD);
        const marks = [[11, 19], [12, 22], [11, 25], [12, 28], [11, 31], [12, 34]];
        for (const [mx, my] of marks) { P(g, mx, my + (v % 2), C.bark); }
        P(g, 10, 26, C.bark); P(g, 13, 30, C.bark);
        line(g, 12, 18, 16, 14, C.birchD); line(g, 11, 20, 7, 16, C.birchD);
      } else {
        R(g, 11, 29, 2, 7, C.woodD); P(g, 12, 33, C.woodDD); R(g, 10, 34, 4, 2, C.woodD);
      }
    }),
    crown: spr(`crown-${type}-${v}`, 24, 36, g => {
      const s = 100 + v * 17 + (type === 'birch' ? 0 : 50);
      if (type === 'birch') {
        const ramp = [C.leafL, C.leaf, C.leafD, C.leafDD];
        blob(g, 12, 10, 7.5, 6.5, s, ramp, 0.5);
        blob(g, 7 + (v % 2), 15, 5, 4, s + 1, ramp, 0.55);
        blob(g, 17 - (v % 3 === 0 ? 1 : 0), 15, 5, 4, s + 2, ramp, 0.55);
        blob(g, 12, 5, 5, 3.5, s + 3, ramp, 0.5);
        // свисающие веточки
        for (let i = 0; i < 6; i++) {
          const x = 4 + ((hash2(i, v, s) * 16) | 0), y0 = 14 + ((hash2(v, i, s) * 4) | 0);
          P(g, x, y0, C.leafD); P(g, x, y0 + 1, C.leaf); if (i % 2) P(g, x, y0 + 2, C.leafD);
        }
      } else {
        for (let y = 1; y <= 31; y++) {
          const t = (y - 1) / 30;
          const tier = (y - 1) % 6;
          const base = 1.2 + t * 9.5;
          let hw = base * (0.5 + 0.5 * tier / 5);
          for (let x = 0; x < 24; x++) {
            const dx = x + 0.5 - 12;
            const j = (hash2(x, y, s) - 0.5) * 1.6;
            if (Math.abs(dx) > hw + j) continue;
            let c = C.spruce;
            if (tier === 5 || (tier === 4 && Math.abs(dx) > hw - 1.5)) c = C.spruceD;
            if (dx < -hw * 0.3 && tier < 3) c = C.spruceL;
            if (dx > hw * 0.45) c = tier > 2 ? C.spruceDD : C.spruceD;
            P(g, x, y, c);
          }
        }
        P(g, 11, 0, C.spruce);
      }
    }),
  };
}

export function stumpSprite(tree) {
  return spr('stump-' + tree, 16, 16, g => {
    const bark = tree === 'birch' ? C.birch : C.woodD;
    const barkD = tree === 'birch' ? C.birchD : C.woodDD;
    R(g, 4, 8, 8, 5, bark); R(g, 10, 8, 2, 5, barkD);
    if (tree === 'birch') { R(g, 9, 11, 2, 1, C.bark); }
    R(g, 3, 12, 2, 2, bark); R(g, 11, 12, 2, 2, barkD);
    ellipse(g, 8, 8, 4, 2, '#d8b98a');
    P(g, 8, 8, '#b88d5c'); P(g, 6, 8, '#c8a070'); P(g, 10, 8, '#c8a070');
    // росток
    P(g, 12, 6, C.leafL); P(g, 13, 5, C.leaf); P(g, 12, 7, C.leafD);
  });
}

export function rockSprite(v) {
  return spr('rock-' + v, 16, 16, g => {
    ellipse(g, 8, 13, 6, 2, 'rgba(0,0,0,0.18)');
    blob(g, 8, 9.5, v ? 5.5 : 6.5, v ? 4.5 : 4, 40 + v, [C.stoneL, C.stone, C.stoneD, C.stoneDD], 0.25);
    P(g, 7, 9, C.stoneDD); P(g, 8, 10, C.stoneDD); P(g, 9, 10, C.stoneD);
    if (v) { P(g, 5, 7, C.green); P(g, 6, 6, C.greenL); P(g, 6, 7, C.green); }
  });
}

export function bushSprite(berry, has, v = 0) {
  return spr(`bush-${berry}-${has}-${v}`, 16, 16, g => {
    ellipse(g, 8, 14, 6, 2, 'rgba(0,0,0,0.16)');
    const ramp = berry === 'currant' ? [C.greenL, C.green, C.greenD, '#365a2c'] : [C.leafL, '#86a84a', C.leafD, C.leafDD];
    blob(g, 8, 9, 6.5, 5.5, 70 + v, ramp, 0.4);
    if (!has) return;
    for (let i = 0; i < 7; i++) {
      const x = 3 + ((hash2(i, 3, 70 + v) * 10) | 0), y = 5 + ((hash2(i, 9, 71) * 8) | 0);
      if (berry === 'currant') {
        P(g, x, y, '#2e2340'); P(g, x + 1, y, '#3a2b4a'); P(g, x, y + 1, '#3a2b4a'); P(g, x, y, '#7a6a9a');
      } else {
        R(g, x, y, 2, 2, '#d6475e'); P(g, x, y, '#f28a9a'); P(g, x + 1, y + 1, '#a8304a');
      }
    }
  });
}

// ---------- Грядка и растения ----------
export function soilSprite(watered, framed) {
  return spr(`soil-${watered}-${framed}`, 16, 16, g => {
    const b = watered ? C.soilW : C.soil, d = watered ? C.soilWD : C.soilD, l = watered ? C.soilWL : C.soilL;
    R(g, 1, 1, 14, 14, b);
    for (const fy of [3, 7, 11]) { R(g, 2, fy, 12, 1, l); R(g, 2, fy + 1, 12, 1, d); }
    R(g, 1, 14, 14, 1, d);
    if (watered) { P(g, 4, 5, '#7a6a70'); P(g, 10, 9, '#7a6a70'); P(g, 6, 13, '#7a6a70'); }
    if (framed) {
      R(g, 0, 0, 16, 2, C.plank); R(g, 0, 14, 16, 2, C.plankD); R(g, 0, 0, 2, 16, C.plank); R(g, 14, 0, 2, 16, C.plankD);
      R(g, 0, 0, 16, 1, C.plankL);
    }
  });
}

// Растения: холст 16x28, низ = низ клетки
export function cropSprite(id, stage, frame = 0) {
  return spr(`crop-${id}-${stage}`, 16, 28, g => {
    const B = 27; // низ
    const leaf = (x, y, c1 = C.greenL, c2 = C.green) => { P(g, x, y, c1); P(g, x + 1, y, c2); };
    if (stage === 0) { P(g, 5, B - 7, '#e8d8a8'); P(g, 10, B - 7, '#e8d8a8'); P(g, 8, B - 11, '#e8d8a8'); return; }
    if (stage === 1) {
      P(g, 8, B - 6, C.green); P(g, 8, B - 7, C.green); P(g, 7, B - 8, C.greenL); P(g, 9, B - 8, C.greenL); P(g, 6, B - 8, C.green); P(g, 10, B - 9, C.green);
      return;
    }
    switch (id) {
      case 'radish':
        if (stage === 3) { R(g, 6, B - 6, 4, 3, '#d8466a'); P(g, 6, B - 6, '#f07a96'); P(g, 9, B - 4, '#a8304a'); P(g, 7, B - 3, C.white); }
        for (let i = 0; i < 3; i++) { line(g, 8, B - 6, 4 + i * 4, B - 12 - (i % 2) * 2, i % 2 ? C.green : C.greenL); }
        blob(g, 5, B - 12, 2, 2, 5, [C.greenL, C.green, C.greenD], 0.2);
        blob(g, 11, B - 12, 2, 2, 6, [C.greenL, C.green, C.greenD], 0.2);
        break;
      case 'carrot':
        if (stage === 3) { R(g, 6, B - 6, 4, 2, C.orange); P(g, 9, B - 5, C.orangeD); P(g, 6, B - 6, '#f8a85a'); }
        for (let i = 0; i < 9; i++) {
          const x = 4 + i, h = 6 + ((hash2(i, 1, 9) * (stage === 3 ? 6 : 3)) | 0);
          for (let k = 0; k < h; k += 2) P(g, x + ((k / 2) % 2), B - 7 - k, k % 4 ? C.greenL : C.green);
        }
        break;
      case 'potato':
        blob(g, 8, B - 9, stage === 3 ? 6 : 4, stage === 3 ? 5 : 3.5, 21, [C.greenL, C.green, C.greenD, '#365a2c'], 0.45);
        if (stage === 3) { P(g, 5, B - 13, C.white); P(g, 6, B - 13, '#d8c8f0'); P(g, 10, B - 12, C.white); P(g, 11, B - 14, '#d8c8f0'); P(g, 8, B - 15, C.white); }
        break;
      case 'cucumber':
        if (stage === 3) { R(g, 2, B - 20, 1, 18, C.woodD); R(g, 13, B - 20, 1, 18, C.woodD); R(g, 2, B - 16, 12, 1, C.wood); }
        blob(g, 8, B - (stage === 3 ? 11 : 7), stage === 3 ? 6 : 4, stage === 3 ? 7 : 3.5, 33, [C.greenL, C.green, C.greenD, '#365a2c'], 0.5);
        if (stage === 3) {
          R(g, 5, B - 9, 2, 4, '#4f8a3a'); P(g, 5, B - 9, '#7aaa5a'); R(g, 10, B - 12, 2, 4, '#4f8a3a'); P(g, 10, B - 12, '#7aaa5a');
          P(g, 7, B - 16, C.yellow); P(g, 11, B - 7, C.yellow); P(g, 4, B - 13, C.yellow);
        }
        break;
      case 'sunflower': {
        const top = stage === 3 ? B - 26 : B - 14;
        R(g, 7, top + 4, 2, B - top - 4, C.green); R(g, 8, top + 4, 1, B - top - 4, C.greenD);
        leaf(4, B - 8); leaf(5, B - 9); leaf(10, B - 11); leaf(9, B - 12, C.green, C.greenD);
        if (stage === 3) {
          leaf(4, B - 16); leaf(10, B - 18);
          ellipse(g, 8, top + 4, 5, 4.5, C.yellow);
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(g, Math.round(8 + Math.cos(a) * 5), Math.round(top + 4 + Math.sin(a) * 4.5), C.yellowD); }
          ellipse(g, 8, top + 4, 2.6, 2.4, '#6a4426'); P(g, 7, top + 3, '#8a5a36'); P(g, 9, top + 5, '#4a2a16');
        } else { blob(g, 8, top + 3, 2.5, 2, 3, [C.greenL, C.green, C.greenD], 0.2); }
        break;
      }
      case 'pumpkin':
        line(g, 2, B - 6, 14, B - 8, C.green);
        blob(g, 4, B - 9, 3, 2.5, 41, [C.greenL, C.green, C.greenD], 0.3);
        blob(g, 13, B - 10, 2.5, 2.5, 42, [C.greenL, C.green, C.greenD], 0.3);
        if (stage === 3) {
          blob(g, 8, B - 6, 5.5, 4.5, 43, ['#f8a85a', C.orange, C.orangeD, '#a05418'], 0.1);
          R(g, 6, B - 10, 1, 7, C.orangeD); R(g, 10, B - 10, 1, 7, C.orangeD);
          R(g, 8, B - 12, 1, 2, C.greenD);
        } else { ellipse(g, 8, B - 5, 2, 1.5, '#a8c050'); }
        break;
    }
  });
}

// Пшеница на поле — колоски с покачиванием (рисуются каждый кадр)
export function drawWheat(g, sx, sy, x, y, wind) {
  for (let i = 0; i < 5; i++) {
    const r = hash2(x, y, i + 300);
    const px = sx + 1 + ((i * 3 + (r * 3)) | 0), base = sy + 6 + ((hash2(x, y, i) * 10) | 0);
    const sw = Math.round(Math.sin(wind + x * 0.5 + y * 0.3 + i) * 1.2);
    R(g, px, base - 5, 1, 5, C.wheatD);
    R(g, px + sw, base - 8, 1, 3, C.wheatL);
    P(g, px + sw, base - 9, C.wheat);
  }
}

// Травинки, которые колышутся
export function drawTuft(g, sx, sy, sway) {
  P(g, sx, sy, C.grassDD); P(g, sx + 2, sy, C.grassDD);
  P(g, sx + sway, sy - 1, C.grassD); P(g, sx + 2 + sway, sy - 1, C.grassD);
  P(g, sx + 1 + sway, sy - 2, C.grassL);
}
