// Генерация карты хутора 64x64 и интерьера дома.
import { hash2, mulberry32 } from './rng.js';
import { buildOcc, key } from './world.js';

export const MAP_W = 64, MAP_H = 64;

// Важные места на карте (используются и в логике, и в отрисовке)
export const PLACES = {
  house: { x: 19, y: 24 },
  granny: { x: 35, y: 23 },
  well: { x: 27, y: 25 },
  sellbox: { x: 26, y: 37 },
  van: { x: 27, y: 42 },
  spawn: { x: 21, y: 29 },
  bridgeY: 40,
};

function valueNoise(x, y, scale, seed) {
  const gx = x / scale, gy = y / scale;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed), b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed), d = hash2(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

export const riverX = y => 50 + Math.round(2.5 * Math.sin(y / 6) + Math.sin(y / 2.3));

export function generateOutside(seed) {
  const W = MAP_W, H = MAP_H;
  const g = new Array(W * H).fill('g');
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const get = (x, y) => g[y * W + x];
  const reserved = new Uint8Array(W * H);
  const reserve = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (x >= 0 && y >= 0 && x < W && y < H) reserved[y * W + x] = 1;
  };

  // Речка с песчаными бережками
  for (let y = 0; y < H; y++) {
    const cx = riverX(y);
    for (let x = cx - 1; x <= cx + 1; x++) set(x, y, 'w');
    if (hash2(cx - 2, y, seed) < 0.75) set(cx - 2, y, 's');
    if (hash2(cx + 2, y, seed) < 0.75) set(cx + 2, y, 's');
    reserve(cx - 3, y, cx + 3, y);
  }
  // Поле за речкой
  for (let y = 6; y <= 34; y++) for (let x = 55; x <= 62; x++) set(x, y, 'f');
  reserve(54, 5, 63, 35);

  // Дороги
  for (let y = 39; y < H; y++) { set(24, y, 'd'); set(25, y, 'd'); }
  for (let x = 24; x < W; x++) for (let y = 40; y <= 41; y++) {
    set(x, y, get(x, y) === 'w' ? 'b' : 'd');
  }
  reserve(22, 38, 27, 63); reserve(22, 38, 63, 43);
  // Площадка для автолавки
  for (let y = 42; y <= 44; y++) for (let x = 26; x <= 30; x++) set(x, y, 'd');
  reserve(25, 41, 31, 45);
  // Тропинки во дворе и к бабушке
  for (let y = 29; y <= 37; y++) set(24, y, 'd');
  for (let x = 21; x <= 24; x++) set(x, 28, 'd');
  for (let y = 27; y <= 39; y++) set(37, y, 'd');
  // Огород игрока и бабушкин огород
  for (let y = 30; y <= 35; y++) for (let x = 17; x <= 22; x++) set(x, y, 'p');
  for (let y = 28; y <= 31; y++) for (let x = 40; x <= 43; x++) set(x, y, 'p');
  reserve(14, 19, 33, 39); reserve(33, 20, 45, 34);

  const objects = {};
  const put = (type, x, y, extra = {}) => { objects[key(x, y)] = { type, x, y, ...extra }; };

  // Дом, колодец, ящик для продажи, стог
  put('house', PLACES.house.x, PLACES.house.y);
  put('granny_house', PLACES.granny.x, PLACES.granny.y);
  put('well', PLACES.well.x, PLACES.well.y);
  put('sellbox', PLACES.sellbox.x, PLACES.sellbox.y, { items: {} });
  put('haystack', 28, 32);
  put('birch', 29, 22, { v: 1 });
  put('stump', 30, 35, { tree: 'birch', v: 0, decor: true });

  // Забор-штакетник вокруг двора с калитками
  for (let x = 16; x <= 31; x++) {
    put('fence', x, 21);
    if (x === 24 || x === 25) put('gate', x, 38); else put('fence', x, 38);
  }
  for (let y = 22; y <= 37; y++) {
    if (y === 27) put('gate', 16, y); else put('fence', 16, y);
    if (y === 30) put('gate', 31, y); else put('fence', 31, y);
  }
  // Тропинка от боковой калитки к бабушке
  for (let x = 32; x <= 36; x++) set(x, 30, 'd');

  // Бабушкин двор: огород с картошкой, клумба, лавочка
  for (let y = 28; y <= 31; y++) for (let x = 40; x <= 43; x++)
    put('soil', x, y, { crop: { id: (x + y) % 3 ? 'potato' : 'carrot', growth: 9 }, watered: true, granny: true });
  put('flowerbed', 40, 25); put('bench', 34, 27); put('geranium', 41, 25);
  put('birch', 44, 23, { v: 2 });

  // Гарантированные ресурсы рядом с домом (для обучения)
  put('birch', 13, 26, { v: 0 });
  put('birch', 11, 23, { v: 1 });
  put('rock', 12, 33, { v: 0 }); put('rock', 30, 47, { v: 1 }); put('rock', 9, 30, { v: 1 });
  put('bush_currant', 13, 29, { berries: true }); put('bush_currant', 12, 30, { berries: true });
  put('bush_raspberry', 13, 36, { berries: true }); put('bush_raspberry', 34, 36, { berries: true });
  put('haystack', 57, 12); put('haystack', 59, 26);
  reserve(8, 22, 14, 37);

  // Лес по краям и рощицы, разбросанные деревья, камни, кусты
  const rnd = mulberry32(seed);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (reserved[i] || get(x, y) !== 'g' || objects[key(x, y)]) continue;
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    const n = valueNoise(x, y, 7, seed);
    const forest = edge < 3 + n * 5 || n > 0.72;
    const r = rnd();
    if (forest) {
      if (r < 0.62) {
        const spruceP = 0.3 + (y < 18 ? 0.35 : 0) + (x < 12 ? 0.15 : 0);
        put(rnd() < spruceP ? 'spruce' : 'birch', x, y, { v: Math.floor(rnd() * 3) });
      } else if (r < 0.68) put(rnd() < 0.5 ? 'bush_currant' : 'bush_raspberry', x, y, { berries: true });
      else if (r < 0.71) put('rock', x, y, { v: Math.floor(rnd() * 2) });
    } else {
      if (r < 0.035) put(rnd() < 0.7 ? 'birch' : 'spruce', x, y, { v: Math.floor(rnd() * 3) });
      else if (r < 0.05) put('rock', x, y, { v: Math.floor(rnd() * 2) });
      else if (r < 0.058) put(rnd() < 0.5 ? 'bush_currant' : 'bush_raspberry', x, y, { berries: true });
    }
  }

  const scene = { id: 'outside', w: W, h: H, ground: g, objects };
  buildOcc(scene);
  return scene;
}

// Интерьер дома: 11x9, верхние 2 ряда — стена
export function generateHome() {
  const w = 11, h = 9;
  const g = new Array(w * h).fill('o');
  for (let x = 0; x < w; x++) { g[x] = 'W'; g[w + x] = 'W'; }
  const objects = {};
  const put = (type, x, y, extra = {}) => { objects[key(x, y)] = { type, x, y, ...extra }; };
  put('stove', 0, 2);
  put('bed', 8, 2);
  put('table', 4, 4);
  put('sideboard', 4, 2);
  put('radio', 7, 2);
  put('rug', 4, 6);
  put('exit', 5, 8);
  const scene = { id: 'home', w, h, ground: g, objects, indoor: true };
  buildOcc(scene);
  return scene;
}

export const HOME_ENTRY = { x: 5, y: 7 };
export const HOME_WAKE = { x: 7, y: 3 };
