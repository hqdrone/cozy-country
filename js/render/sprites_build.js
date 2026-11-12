// Постройки, декор и мебель.
import { C, spr, R, P, blob, ellipse, line, hash2 } from './pixel.js';

// ---------- Дом с резными наличниками (80x100, низ = низ участка 5x4) ----------
const HOUSE_STYLES = {
  house: { roof: ['#c86b52', '#b0503c', '#8e3e2f'], shutter: [C.blue, C.blueD], log: [C.woodL, C.wood, C.woodD] },
  granny_house: { roof: ['#86a670', '#6f8f5a', '#557448'], shutter: ['#5e9a6a', '#467a50'], log: ['#b07a4a', '#93613a', '#704626'] },
};

export function houseSprite(type, lit) {
  return spr(`${type}-${lit}`, 80, 100, g => {
    const st = HOUSE_STYLES[type];
    // стены из брёвен
    for (let i = 0; i < 8; i++) {
      const y = 60 + i * 5;
      R(g, 3, y, 74, 5, st.log[1]); R(g, 3, y, 74, 1, st.log[0]); R(g, 3, y + 4, 74, 1, st.log[2]);
      // торцы брёвен
      ellipse(g, 2.5, y + 2.5, 2.5, 2.5, '#c8935e'); P(g, 2, y + 2, '#a87444');
      ellipse(g, 77.5, y + 2.5, 2.5, 2.5, '#c8935e'); P(g, 77, y + 2, '#a87444');
    }
    R(g, 4, 96, 72, 4, C.stoneD); R(g, 4, 96, 72, 1, C.stone);
    // крыша
    for (let y = 8; y < 58; y++) {
      const t = (y - 8) / 50;
      const x0 = Math.round(4 - t * 4), x1 = Math.round(76 + t * 4);
      for (let x = x0; x < x1; x++) {
        let c = (x % 5 === 0) ? st.roof[2] : (x % 5 === 1 ? st.roof[0] : st.roof[1]);
        if (y < 12) c = st.roof[2];
        if (y === 12) c = st.roof[0];
        P(g, x, y, c);
      }
    }
    R(g, 6, 6, 68, 3, st.roof[2]); R(g, 8, 5, 64, 1, st.roof[1]);
    // резной подзор
    R(g, 0, 56, 80, 4, C.white);
    for (let x = 0; x < 80; x += 4) { P(g, x + 1, 59, C.whiteD); P(g, x + 2, 59, C.whiteD); P(g, x + 2, 58, C.whiteD); P(g, x + 1, 60, C.white); P(g, x + 2, 60, C.white); }
    R(g, 0, 56, 80, 1, C.whiteD);
    // труба
    R(g, 56, 0, 9, 22, C.brick); R(g, 55, 0, 11, 3, C.brickD);
    for (let y = 4; y < 22; y += 3) { R(g, 56, y, 9, 1, C.brickD); P(g, 58 + (y % 2) * 3, y + 1, C.brickD); }
    R(g, 64, 3, 1, 19, C.brickD);
    // окна с наличниками и ставнями
    for (const wx of [10, 54]) {
      const sh = st.shutter;
      R(g, wx - 4, 67, 4, 17, sh[0]); R(g, wx + 16, 67, 4, 17, sh[0]);
      for (let y = 69; y < 83; y += 3) { R(g, wx - 4, y, 4, 1, sh[1]); R(g, wx + 16, y, 4, 1, sh[1]); }
      P(g, wx - 2, 75, C.white); P(g, wx + 17, 75, C.white);
      // стекло
      R(g, wx + 2, 67, 12, 17, lit ? C.glow : C.glass);
      if (lit) { R(g, wx + 4, 70, 8, 10, C.glowL); }
      else { line(g, wx + 3, 82, wx + 12, 69, C.glassL); line(g, wx + 6, 82, wx + 12, 75, C.glassL); R(g, wx + 2, 67, 12, 2, C.glassD); }
      // кружевные занавески
      for (let y = 67; y < 73; y++) for (let x = 0; x < 4 - (y - 67) / 2; x++) {
        if ((x + y) % 2 === 0) { P(g, wx + 2 + x, y, C.white); P(g, wx + 13 - x, y, C.white); }
      }
      // рама
      R(g, wx + 7, 67, 2, 17, C.white); R(g, wx + 2, 74, 12, 2, C.white);
      R(g, wx, 66, 2, 19, C.white); R(g, wx + 14, 66, 2, 19, C.white);
      // кокошник сверху
      R(g, wx - 1, 64, 18, 3, C.white);
      R(g, wx + 1, 63, 14, 1, C.white); R(g, wx + 4, 62, 8, 1, C.white); R(g, wx + 6, 61, 4, 1, C.white);
      P(g, wx + 7, 63, sh[0]); P(g, wx + 8, 63, sh[0]); P(g, wx + 2, 65, C.whiteD); P(g, wx + 13, 65, C.whiteD);
      // подоконник с «капельками»
      R(g, wx - 1, 84, 18, 2, C.white); R(g, wx - 1, 85, 18, 1, C.whiteD);
      for (let x = wx; x < wx + 16; x += 3) P(g, x, 86, C.white);
    }
    // дверь
    R(g, 33, 69, 14, 2, C.white); R(g, 33, 69, 2, 27, C.white); R(g, 45, 69, 2, 27, C.white);
    R(g, 35, 71, 10, 25, C.woodD);
    for (let x = 35; x < 45; x += 3) R(g, x, 71, 1, 25, C.woodDD);
    R(g, 35, 76, 10, 1, C.woodDD); R(g, 35, 89, 10, 1, C.woodDD);
    P(g, 43, 83, C.brassL); P(g, 43, 84, C.brass);
    // крылечко
    R(g, 30, 96, 20, 4, C.plank); R(g, 30, 96, 20, 1, C.plankL); R(g, 30, 99, 20, 1, C.plankD);
  });
}

// ---------- Колодец-журавль (48x48, клетка колодца в x 8..23) ----------
export function wellSprite() {
  return spr('well', 48, 48, g => {
    ellipse(g, 16, 45, 9, 3, 'rgba(0,0,0,0.18)');
    // сруб
    R(g, 9, 34, 14, 4, C.woodD);
    R(g, 11, 35, 10, 3, '#22323a'); P(g, 13, 36, '#4a6a78'); P(g, 17, 37, '#4a6a78');
    for (let i = 0; i < 3; i++) {
      const y = 38 + i * 3;
      R(g, 9, y, 14, 3, C.wood); R(g, 9, y, 14, 1, C.woodL); R(g, 9, y + 2, 14, 1, C.woodD);
      P(g, 8, y + 1, '#c8935e'); P(g, 23, y + 1, '#c8935e');
    }
    // столб и рычаг
    R(g, 32, 13, 2, 33, '#8a7458'); R(g, 33, 13, 1, 33, '#6a5640'); P(g, 31, 12, '#8a7458'); P(g, 34, 12, '#8a7458');
    line(g, 14, 2, 46, 18, '#9b8462', 2);
    line(g, 15, 4, 46, 19, '#6f5d44');
    R(g, 41, 16, 6, 6, C.stoneD); R(g, 41, 16, 6, 1, C.stone);
    // верёвка (шест) и ведро
    R(g, 15, 3, 1, 27, '#7a6a50');
    R(g, 13, 29, 5, 5, C.metal); R(g, 13, 29, 5, 1, C.metalL); R(g, 17, 30, 1, 4, C.metalD);
  });
}

export function sellboxSprite() {
  return spr('sellbox', 16, 20, g => {
    ellipse(g, 8, 18, 7, 2, 'rgba(0,0,0,0.18)');
    R(g, 2, 9, 12, 10, C.plank);
    for (const y of [11, 14, 17]) R(g, 2, y, 12, 1, C.plankD);
    R(g, 2, 9, 1, 10, C.plankL); R(g, 13, 9, 1, 10, C.plankDD);
    R(g, 1, 6, 14, 3, C.woodD); R(g, 1, 6, 14, 1, C.wood);
    ellipse(g, 8, 14, 2.5, 2.5, C.yellow); P(g, 7, 13, C.glowL); P(g, 9, 15, C.yellowD);
  });
}

export function chestSprite() {
  return spr('chest', 16, 18, g => {
    ellipse(g, 8, 16, 7, 2, 'rgba(0,0,0,0.18)');
    R(g, 2, 8, 12, 8, C.wood); R(g, 2, 15, 12, 1, C.woodD);
    R(g, 2, 4, 12, 4, C.woodL); R(g, 3, 3, 10, 1, C.woodL); R(g, 2, 7, 12, 1, C.woodD);
    R(g, 4, 3, 1, 13, C.metal); R(g, 11, 3, 1, 13, C.metal);
    R(g, 7, 7, 2, 3, C.brass); P(g, 7, 7, C.brassL);
  });
}

// Штакетник: h — горизонтальный, v — вертикальный (16x22, низ = низ клетки)
export function fenceSprite(part) {
  return spr('fence-' + part, 16, 22, g => {
    const pk = '#d8c69e', pkD = '#b6a37c', rail = '#97805c';
    if (part === 'h') {
      R(g, 0, 11, 16, 2, rail); R(g, 0, 16, 16, 2, rail);
      for (let x = 1; x < 16; x += 4) {
        R(g, x, 5, 2, 15, pk); R(g, x + 1, 5, 1, 15, pkD); P(g, x, 4, pk);
      }
      R(g, 0, 20, 16, 1, 'rgba(0,0,0,0.15)');
    } else if (part === 'v') {
      R(g, 6, 0, 4, 22, rail);
      for (let y = 0; y < 22; y += 4) { R(g, 6, y, 4, 2, pk); R(g, 9, y, 1, 2, pkD); }
      R(g, 10, 2, 1, 20, 'rgba(0,0,0,0.15)');
    } else {
      // столбик
      R(g, 6, 4, 4, 17, pk); R(g, 9, 4, 1, 17, pkD); R(g, 6, 3, 3, 1, pk);
    }
  });
}

export function gateSprite(part, open) {
  return spr(`gate-${part}-${open}`, 16, 22, g => {
    const pk = '#d8c69e', pkD = '#b6a37c', post = '#8a6a48';
    if (part === 'h') {
      R(g, 0, 2, 2, 19, post); R(g, 14, 2, 2, 19, post); P(g, 0, 1, post); P(g, 15, 1, post);
      if (open) { R(g, 2, 5, 2, 15, pkD); R(g, 2, 5, 1, 15, pk); return; }
      for (let x = 2; x < 14; x += 3) { R(g, x, 6, 2, 13, pk); P(g, x + 1, 6, pkD); P(g, x, 5, pk); }
      R(g, 2, 9, 12, 1, post); R(g, 2, 15, 12, 1, post); line(g, 3, 15, 12, 9, post);
      P(g, 12, 12, C.brass);
    } else {
      R(g, 5, 0, 6, 4, post); R(g, 5, 18, 6, 4, post); R(g, 5, 0, 6, 1, '#a8885e'); R(g, 5, 18, 6, 1, '#a8885e');
      if (open) { R(g, 10, 4, 5, 2, pk); R(g, 10, 5, 5, 1, pkD); return; }
      R(g, 5, 4, 6, 14, pk); R(g, 10, 4, 1, 14, pkD);
      for (let y = 6; y < 18; y += 3) R(g, 5, y, 6, 1, pkD);
      P(g, 7, 11, C.brass); P(g, 8, 11, C.brass);
    }
  });
}

export function pathSprite(v) {
  return spr('path-' + v, 16, 16, g => {
    R(g, 0, 0, 16, 16, '#cdb88e');
    for (let i = 0; i < 12; i++) P(g, (hash2(i, v, 5) * 16) | 0, (hash2(v, i, 6) * 16) | 0, '#b9a37a');
    const stones = [[4, 4, 3.4, 2.6], [11, 4, 3, 2.6], [4, 11, 3, 2.6], [11.5, 11.5, 3.4, 2.8]];
    stones.forEach(([x, y, rx, ry], i) => {
      ellipse(g, x, y + 1, rx, ry, C.stoneD);
      ellipse(g, x, y, rx, ry, (i + v) % 2 ? C.stoneL : '#bdb7ac');
      P(g, Math.round(x - 1), Math.round(y - 1), '#ddd8cf');
    });
  });
}

export function flowerbedSprite(v) {
  return spr('flowerbed-' + v, 16, 18, g => {
    const cols = [[C.red, '#f07a6a'], [C.yellow, '#f8e08a'], ['#d070b0', '#f0a0d8']][v % 3];
    ellipse(g, 8, 15, 7, 2.5, 'rgba(0,0,0,0.15)');
    ellipse(g, 8, 12, 7.5, 4.5, C.white);
    ellipse(g, 8, 11.5, 5.5, 3, C.soil);
    for (let x = 1; x < 15; x += 3) { P(g, x, 14, C.whiteD); P(g, x + 1, 15, C.whiteD); }
    R(g, 1, 12, 1, 2, C.whiteD);
    const fl = [[5, 8], [8, 6], [11, 8], [6, 11], [10, 11], [8, 9]];
    for (const [x, y] of fl) { P(g, x, y + 2, C.green); P(g, x - 1, y + 2, C.greenL); }
    fl.forEach(([x, y], i) => {
      const c = cols[i % 2];
      P(g, x, y - 1, c); P(g, x - 1, y, c); P(g, x + 1, y, c); P(g, x, y + 1, c); P(g, x, y, C.yellow);
    });
  });
}

export function benchSprite() {
  return spr('bench', 16, 16, g => {
    ellipse(g, 8, 14, 7, 2, 'rgba(0,0,0,0.18)');
    R(g, 2, 10, 2, 4, C.woodD); R(g, 12, 10, 2, 4, C.woodD);
    R(g, 1, 7, 14, 3, C.plank); R(g, 1, 7, 14, 1, C.plankL); R(g, 1, 9, 14, 1, C.plankD);
    R(g, 1, 10, 14, 1, 'rgba(0,0,0,0.2)');
  });
}

export function lanternSprite(lit) {
  return spr('lantern-' + lit, 16, 32, g => {
    ellipse(g, 8, 30, 4, 1.5, 'rgba(0,0,0,0.2)');
    R(g, 7, 12, 2, 19, C.woodD); R(g, 8, 12, 1, 19, C.woodDD);
    R(g, 5, 4, 6, 2, C.metalD); R(g, 6, 3, 4, 1, C.metal);
    R(g, 5, 6, 6, 6, C.metalD); R(g, 6, 7, 4, 4, lit ? C.glowL : '#d8d0b0'); if (lit) P(g, 7, 8, '#ffffff');
    R(g, 5, 12, 6, 1, C.metalD);
  });
}

export function birdhouseSprite() {
  return spr('birdhouse', 16, 32, g => {
    R(g, 7, 13, 2, 18, C.woodD); ellipse(g, 8, 30, 3, 1.5, 'rgba(0,0,0,0.2)');
    R(g, 4, 6, 8, 8, C.plank); R(g, 4, 6, 1, 8, C.plankL); R(g, 11, 6, 1, 8, C.plankD);
    for (let i = 0; i < 5; i++) R(g, 3 + i, 5 - i, 10 - i * 2, 1, C.roof || '#8e3e2f');
    R(g, 3, 5, 10, 1, '#8e3e2f'); R(g, 4, 4, 8, 1, '#b0503c'); R(g, 5, 3, 6, 1, '#b0503c'); R(g, 6, 2, 4, 1, '#c86b52');
    ellipse(g, 8, 9, 1.6, 1.6, C.woodDD); R(g, 7, 12, 3, 1, C.woodD);
  });
}

export function scarecrowSprite() {
  return spr('scarecrow', 16, 32, g => {
    ellipse(g, 8, 30, 4, 1.5, 'rgba(0,0,0,0.2)');
    R(g, 7, 8, 2, 23, C.woodD);
    R(g, 1, 13, 14, 2, C.wood);
    R(g, 4, 12, 8, 10, '#6a7a8a'); R(g, 2, 12, 2, 4, '#6a7a8a'); R(g, 12, 12, 2, 4, '#6a7a8a');
    R(g, 6, 15, 3, 3, '#a85a4a'); P(g, 10, 19, '#c8b070'); R(g, 4, 21, 8, 1, '#4a5a6a');
    P(g, 1, 15, C.wheat); P(g, 0, 16, C.wheat); P(g, 14, 15, C.wheat); P(g, 15, 16, C.wheat);
    R(g, 5, 5, 6, 7, '#d8c49a'); P(g, 6, 7, C.ink); P(g, 9, 7, C.ink); R(g, 6, 9, 4, 1, '#a88a5a');
    R(g, 3, 4, 10, 2, '#5a4a3a'); R(g, 5, 1, 6, 3, '#5a4a3a'); R(g, 5, 3, 6, 1, C.red);
  });
}

export function geraniumSprite() {
  return spr('geranium', 16, 16, g => {
    ellipse(g, 8, 15, 4, 1.5, 'rgba(0,0,0,0.2)');
    R(g, 5, 10, 6, 5, '#c0643a'); R(g, 4, 9, 8, 2, '#d8784a'); R(g, 10, 10, 1, 5, '#9a4a2a');
    blob(g, 8, 6, 5, 3.5, 9, [C.greenL, C.green, C.greenD], 0.3);
    for (const [x, y] of [[6, 3], [10, 4], [8, 6], [5, 6]]) { R(g, x, y, 2, 2, '#e04848'); P(g, x, y, '#f88080'); }
  });
}

export function haystackSprite() {
  return spr('haystack', 32, 40, g => {
    ellipse(g, 16, 37, 14, 3, 'rgba(0,0,0,0.18)');
    blob(g, 16, 23, 13, 15, 5, [C.wheatL, C.wheat, C.wheatD, C.wheatDD], 0.15);
    for (let i = 0; i < 18; i++) {
      const x = 5 + ((hash2(i, 1, 2) * 22) | 0), y = 12 + ((hash2(i, 2, 2) * 22) | 0);
      line(g, x, y, x + 2, y + 2, C.wheatD);
    }
    R(g, 15, 2, 2, 10, C.woodD);
    line(g, 6, 18, 26, 14, C.woodD);
  });
}

// Автолавка — фургончик с навесом (48x40)
export function vanSprite() {
  return spr('van', 48, 40, g => {
    ellipse(g, 24, 36, 23, 3, 'rgba(0,0,0,0.2)');
    R(g, 3, 8, 42, 26, '#a9cde0'); R(g, 3, 8, 42, 2, '#c9e3ee'); R(g, 3, 24, 42, 10, '#8ab4ca');
    R(g, 3, 23, 42, 1, C.white); R(g, 3, 6, 42, 3, '#7aa4ba'); R(g, 5, 5, 38, 1, '#7aa4ba');
    // кабина
    R(g, 3, 10, 11, 9, '#4a6a7a'); R(g, 4, 11, 9, 7, C.glass); line(g, 5, 17, 11, 11, C.glassL);
    R(g, 1, 26, 3, 3, C.glowL); R(g, 1, 30, 4, 2, C.metal);
    // окошко продавца с навесом
    R(g, 18, 12, 22, 10, '#5a4a3a'); R(g, 19, 13, 20, 8, '#e8dcc0');
    for (let x = 0; x < 24; x += 4) { R(g, 17 + x, 9, 2, 3, C.red); R(g, 19 + x, 9, 2, 3, C.white); }
    R(g, 20, 17, 3, 3, C.orange); R(g, 25, 16, 4, 4, '#d8a060'); R(g, 31, 17, 3, 3, C.green); R(g, 35, 16, 3, 4, C.red);
    R(g, 18, 22, 22, 2, C.plank);
    // колёса
    for (const wx of [10, 36]) { ellipse(g, wx, 34, 4, 4, '#2a2a2e'); ellipse(g, wx, 34, 1.6, 1.6, C.metalL); }
  });
}

// ---------- Мебель в доме ----------
export function stoveSprite() {
  return spr('stove', 48, 64, g => {
    R(g, 30, 0, 14, 12, '#ebe5d6'); R(g, 42, 0, 2, 12, '#d6cfbe');
    R(g, 2, 10, 44, 54, '#efe9dc'); R(g, 2, 10, 44, 2, '#f8f4ea');
    R(g, 40, 12, 6, 52, '#d6cfbe'); R(g, 2, 58, 44, 6, '#d6cfbe');
    R(g, 2, 18, 38, 1, '#d6cfbe');
    // роспись
    for (let x = 6; x < 38; x += 8) {
      P(g, x, 22, C.blue); P(g, x - 1, 23, C.blue); P(g, x + 1, 23, C.blue); P(g, x, 24, C.blue); P(g, x, 23, C.red);
      P(g, x + 3, 23, C.green); P(g, x + 4, 22, C.green);
    }
    // плита
    R(g, 8, 27, 26, 3, C.metalD); ellipse(g, 15, 28, 3, 1, C.metal); ellipse(g, 26, 28, 3, 1, C.metal);
    // устье печи
    R(g, 13, 34, 18, 14, '#3a2a22'); R(g, 15, 32, 14, 2, '#3a2a22'); R(g, 13, 48, 18, 2, '#c8c0b0');
    // печурки
    R(g, 5, 40, 5, 5, '#c8c0b0'); R(g, 6, 41, 3, 4, '#8a7a6a'); R(g, 34, 40, 5, 5, '#c8c0b0'); R(g, 35, 41, 3, 4, '#8a7a6a');
    // ухват и чугунок
    line(g, 36, 62, 42, 30, C.woodD); R(g, 40, 29, 4, 1, C.metalD);
  });
}

export function bedSprite() {
  return spr('bed', 48, 40, g => {
    R(g, 3, 36, 2, 4, C.metalD); R(g, 42, 36, 2, 4, C.metalD);
    // подзор (кружево)
    R(g, 2, 30, 40, 7, C.white);
    for (let x = 2; x < 42; x += 3) { P(g, x, 36, C.whiteD); P(g, x + 1, 35, C.whiteD); P(g, x + 1, 33, C.whiteD); }
    // одеяло лоскутное
    R(g, 2, 10, 40, 22, C.white);
    const pc = ['#c86a5a', '#e0b860', '#7a9ac8', '#9ab86a', '#d890a8'];
    for (let y = 12; y < 30; y += 6) for (let x = 2; x < 30; x += 6) R(g, x, y, 6, 6, pc[((x + y) / 6 | 0) % pc.length]);
    R(g, 2, 12, 28, 1, 'rgba(255,255,255,0.4)');
    // спинка
    R(g, 42, 2, 2, 34, C.metalD); R(g, 46, 2, 2, 34, C.metalD); R(g, 42, 6, 6, 2, C.metal); R(g, 42, 20, 6, 2, C.metal);
    ellipse(g, 43, 2, 1.6, 1.6, C.brassL); ellipse(g, 47, 2, 1.6, 1.6, C.brassL);
    // подушки горкой
    R(g, 31, 20, 11, 10, C.white); R(g, 31, 29, 11, 1, C.whiteD);
    R(g, 32, 13, 9, 8, '#fbf8f0'); R(g, 32, 20, 9, 1, C.whiteD);
    R(g, 33, 7, 7, 7, C.white); R(g, 33, 13, 7, 1, C.whiteD);
    for (let x = 33; x < 40; x += 2) P(g, x, 6, C.whiteD);
    for (let y = 8; y < 29; y += 3) { P(g, 31, y + 12 > 29 ? 29 : y + 12, '#e8e0d0'); }
  });
}

export function tableSprite() {
  return spr('table', 48, 40, g => {
    R(g, 4, 30, 3, 10, C.woodD); R(g, 41, 30, 3, 10, C.woodD);
    // клеёнка в клетку
    for (let y = 12; y < 31; y += 3) for (let x = 2; x < 46; x += 3) R(g, x, y, 3, 3, ((x + y) / 3) % 2 ? '#ece4d4' : '#d88a7a');
    R(g, 2, 30, 44, 2, '#b86a5a');
    // самовар
    ellipse(g, 24, 27, 7, 2, C.brassD);
    R(g, 22, 22, 4, 5, C.brassD);
    ellipse(g, 24, 16, 7, 7, C.brass); R(g, 19, 12, 2, 7, C.brassL); P(g, 21, 11, C.brassL);
    R(g, 29, 12, 1, 8, C.brassD);
    R(g, 15, 13, 3, 1, C.ink); R(g, 30, 13, 3, 1, C.ink);
    R(g, 16, 18, 3, 1, C.brassD); P(g, 15, 19, C.brassD);
    R(g, 21, 6, 6, 3, C.brassD);
    // чайник на конфорке
    ellipse(g, 24, 4, 4, 3, C.white); P(g, 23, 3, C.blue); P(g, 25, 4, C.red); R(g, 23, 0, 2, 1, C.whiteD); R(g, 28, 3, 2, 1, C.white);
    // чашки
    for (const cx of [9, 38]) { ellipse(g, cx, 22, 3.5, 1.4, C.white); R(g, cx - 2, 19, 4, 3, C.white); R(g, cx - 1, 19, 2, 1, '#a0602a'); P(g, cx + 2, 20, C.white); }
    // пирожки на тарелке
    ellipse(g, 12, 27, 4, 1.8, C.white); ellipse(g, 11, 26, 2, 1, '#d89a50'); ellipse(g, 14, 26, 2, 1, '#c88a40');
  });
}

export function sideboardSprite() {
  return spr('sideboard', 32, 40, g => {
    R(g, 1, 2, 30, 38, '#7a4a2a'); R(g, 1, 2, 30, 2, '#9a6a3a'); R(g, 29, 4, 2, 36, '#5a3420');
    R(g, 3, 6, 12, 15, '#bcd8dc'); R(g, 17, 6, 12, 15, '#bcd8dc');
    for (const sx of [3, 17]) {
      R(g, sx, 13, 12, 1, '#5a3420');
      ellipse(g, sx + 3, 10, 2.2, 2.6, C.white); P(g, sx + 3, 10, C.blue);
      ellipse(g, sx + 8, 10, 2.2, 2.6, C.white); P(g, sx + 8, 10, C.red);
      R(g, sx + 2, 16, 2, 4, '#e8f4f8'); R(g, sx + 6, 17, 2, 3, '#e8f4f8'); R(g, sx + 9, 15, 2, 5, '#d8eef4');
    }
    R(g, 3, 23, 12, 14, '#8a5a32'); R(g, 17, 23, 12, 14, '#8a5a32');
    R(g, 13, 29, 1, 3, C.brass); R(g, 18, 29, 1, 3, C.brass);
  });
}

export function radioSprite() {
  return spr('radio', 16, 28, g => {
    R(g, 3, 16, 10, 2, C.woodD); R(g, 4, 18, 1, 10, C.woodD); R(g, 11, 18, 1, 10, C.woodD);
    R(g, 2, 5, 12, 11, '#8a5a32'); R(g, 2, 5, 12, 1, '#a87444');
    R(g, 3, 7, 6, 7, '#d8c8a0'); for (let y = 8; y < 14; y += 2) R(g, 3, y, 6, 1, '#b8a880');
    ellipse(g, 11.5, 9, 1.6, 1.6, '#f0e0b0'); P(g, 11, 9, C.red);
    P(g, 10, 13, C.ink); P(g, 12, 13, C.ink);
  });
}

export function rugSprite() {
  return spr('rug', 48, 32, g => {
    const cols = ['#c05a4a', '#e0b860', '#5a7a9a', '#e8dcc0', '#9ab86a', '#c05a4a'];
    cols.forEach((c, i) => ellipse(g, 24, 16, 22 - i * 3.6, 13 - i * 2.2, c));
  });
}

export function doormatSprite() {
  return spr('doormat', 16, 16, g => {
    R(g, 2, 4, 12, 8, '#9a7a5a'); for (let x = 3; x < 14; x += 2) R(g, x, 4, 1, 8, '#7a5a3a');
    R(g, 0, 14, 16, 2, '#5a3420');
  });
}

// Ковёр на стене (48x30)
export function wallCarpetSprite() {
  return spr('wallcarpet', 48, 30, g => {
    R(g, 0, 0, 48, 30, '#9a2f34'); R(g, 2, 2, 44, 26, '#b83a3e');
    for (let x = 2; x < 46; x += 4) { P(g, x, 2, '#e0b050'); P(g, x + 2, 27, '#e0b050'); }
    R(g, 4, 4, 40, 1, '#e0b050'); R(g, 4, 25, 40, 1, '#e0b050'); R(g, 4, 4, 1, 22, '#e0b050'); R(g, 43, 4, 1, 22, '#e0b050');
    ellipse(g, 24, 15, 11, 8, '#2f4a6a'); ellipse(g, 24, 15, 8, 5.5, '#e8d8b0'); ellipse(g, 24, 15, 4, 3, '#b83a3e');
    for (const [x, y] of [[10, 9], [38, 9], [10, 21], [38, 21]]) { ellipse(g, x, y, 3, 2.5, '#2f4a6a'); P(g, x, y, '#e0b050'); }
    for (let x = 0; x < 48; x += 2) P(g, x, 29, '#e0b050');
  });
}
