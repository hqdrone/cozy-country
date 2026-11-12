// Отрисовка мира: пиксельный буфер → увеличение на экран целым масштабом.
import { C, cv, ctx2d, R, P, ellipse, hash2 } from './pixel.js';
import { OBJECTS } from '../config/objects.js';
import { cropStage } from '../config/crops.js';
import { defOf, objAt } from '../core/world.js';
import { riverX } from '../core/mapgen.js';
import { drawGroundTile, treeSprite, stumpSprite, rockSprite, bushSprite, soilSprite, cropSprite, drawWheat, drawTuft } from './sprites_nature.js';
import { kidSprite, grannySprite, catSprite } from './sprites_chars.js';
import * as B from './sprites_build.js';
import { icon } from './icons.js';
import { cottageSprite, selpoSprite, banyaSprite, clubSprite, villagerSprite } from './sprites_village.js';

// Освещение по времени суток: [час, темнота], [час, цвет оттенка, сила]
const DARK = [[0, 0.62], [4.5, 0.6], [5.5, 0.45], [6.5, 0.15], [7.5, 0], [18.5, 0], [19.5, 0.1], [20.5, 0.3], [21.5, 0.5], [22.5, 0.6], [26.5, 0.62]];
const TINT = [[0, [120, 140, 220], 0.2], [5, [200, 160, 210], 0.25], [6.2, [255, 180, 170], 0.28], [7.5, [255, 225, 200], 0.12], [9, [255, 255, 255], 0], [17, [255, 255, 255], 0],
  [18.5, [255, 200, 130], 0.3], [19.7, [255, 150, 90], 0.42], [20.7, [190, 120, 170], 0.35], [22, [120, 140, 220], 0.22], [26.5, [120, 140, 220], 0.2]];

function interp(keys, h, idx) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (h >= a[0] && h <= b[0]) {
      const k = (h - a[0]) / (b[0] - a[0]);
      const va = a[idx], vb = b[idx];
      if (Array.isArray(va)) return va.map((v, j) => v + (vb[j] - v) * k);
      return va + (vb - va) * k;
    }
  }
  return keys[keys.length - 1][idx];
}
export function skyAt(timeMin) {
  let h = timeMin / 60;
  if (h < 4) h += 24;
  return { dark: interp(DARK, h, 1), tint: interp(TINT, h, 1), tintA: interp(TINT, h, 2), hour: h };
}

export class Renderer {
  constructor(canvas, effects) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.fx = effects;
    this.buf = cv(16, 16); this.bg = ctx2d(this.buf);
    this.light = cv(16, 16); this.lg = this.light.getContext('2d');
    this.ground = new Map();
    this.zoomOut = false;
    this.scale = 3;
    try { this.zoom = JSON.parse(localStorage.getItem('hutor-zoom')) || null; } catch (e) { this.zoom = null; }
    if (!this.zoom || !this.zoom.walk) this.zoom = { walk: 1, build: 0.55 };
    this.cam = { x: 0, y: 0 };
    this.view = { x: 0, y: 0, w: 0, h: 0 };
    this.smokeT = 0;
    this.resize();
  }

  // Размер экрана. Холст подгоняем под реально видимую область (на телефоне 100vh
  // выше экрана из-за адресной строки — из-за этого раньше были промахи по клеткам).
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const vv = window.visualViewport;
    const cssW = Math.round(vv ? vv.width : window.innerWidth), cssH = Math.round(vv ? vv.height : window.innerHeight);
    this.cv.style.width = cssW + 'px'; this.cv.style.height = cssH + 'px';
    const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
    this.cv.width = W; this.cv.height = H;
    this.dpr = dpr;
    const minSide = Math.min(W, H);
    // На телефоне ~11 клеток по короткой стороне, на большом экране — чуть больше
    const tiles = minSide > 900 * dpr * 0.9 && Math.max(W, H) > 1200 ? 14 : 11;
    const base = Math.max(2, Math.round(minSide / (16 * tiles)));
    this.baseScale = base;
    this.minScale = Math.max(1, Math.round(base * 0.35));
    this.maxScale = base * 2;
    this.applyScale();
  }
  applyScale() {
    const f = this.zoom[this.zoomOut ? 'build' : 'walk'];
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, Math.round(this.baseScale * f)));
    const W = this.cv.width, H = this.cv.height;
    this.buf.width = Math.ceil(W / this.scale) + 1;
    this.buf.height = Math.ceil(H / this.scale) + 1;
    this.light.width = this.buf.width; this.light.height = this.buf.height;
    this.bg = ctx2d(this.buf);
    this.g.imageSmoothingEnabled = false;
  }
  setZoomOut(z) { if (this.zoomOut !== z) { this.zoomOut = z; this.applyScale(); } }
  // Приблизить (+1) / отдалить (-1) на один шаг пиксельного масштаба
  zoomStep(d) {
    const s = Math.max(this.minScale, Math.min(this.maxScale, this.scale + d));
    if (s === this.scale) return false;
    this.zoom[this.zoomOut ? 'build' : 'walk'] = s / this.baseScale;
    localStorage.setItem('hutor-zoom', JSON.stringify(this.zoom));
    this.applyScale();
    return true;
  }

  groundFor(scene, seed) {
    let e = this.ground.get(scene.id);
    if (!e || e.rev !== (scene.groundRev || 0)) {
      const c = cv(scene.w * 16, scene.h * 16), g = ctx2d(c);
      for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) drawGroundTile(g, scene, x, y, seed);
      e = { c, rev: scene.groundRev || 0 };
      this.ground.set(scene.id, e);
    }
    return e.c;
  }

  // Камера: следить за точкой (мировые пиксели), с ограничением краями карты
  camTopLeft(scene) {
    const bw = this.buf.width, bh = this.buf.height;
    const mw = scene.w * 16, mh = scene.h * 16;
    let x = Math.round(this.cam.x - bw / 2), y = Math.round(this.cam.y - bh / 2);
    x = mw <= bw ? Math.round((mw - bw) / 2) : Math.max(0, Math.min(mw - bw, x));
    y = mh <= bh ? Math.round((mh - bh) / 2) : Math.max(0, Math.min(mh - bh, y));
    return { x, y };
  }
  // Экранные координаты (clientX/Y) → мировые пиксели, с учётом реального размера холста
  screenToWorld(px, py) {
    const r = this.cv.getBoundingClientRect();
    const kx = this.cv.width / (r.width || 1), ky = this.cv.height / (r.height || 1);
    return { x: (px - r.left) * kx / this.scale + this.view.x, y: (py - r.top) * ky / this.scale + this.view.y };
  }
  // Сколько мировых пикселей в одном CSS-пикселе (для перетаскивания)
  worldPerCss() { const r = this.cv.getBoundingClientRect(); return this.cv.width / (r.width || 1) / this.scale; }
  worldToScreen(wx, wy) {
    return { x: (wx - this.view.x) * this.scale / this.dpr, y: (wy - this.view.y) * this.scale / this.dpr };
  }

  render(v) {
    const { state, scene } = v;
    const g = this.bg, t = v.t;
    const tl = this.camTopLeft(scene);
    const ox = tl.x, oy = tl.y;
    this.view = { x: ox, y: oy, w: this.buf.width, h: this.buf.height };
    const bw = this.buf.width, bh = this.buf.height;
    const sky = skyAt(state.time);
    const night = sky.dark > 0.35;
    const indoor = !!scene.indoor;

    g.fillStyle = indoor ? '#2a1e18' : '#3a5a2a';
    g.fillRect(0, 0, bw, bh);
    g.drawImage(this.groundFor(scene, state.seed), -ox, -oy);

    const x0 = Math.max(0, Math.floor(ox / 16)), y0 = Math.max(0, Math.floor(oy / 16));
    const x1 = Math.min(scene.w - 1, Math.floor((ox + bw) / 16)), y1 = Math.min(scene.h - 1, Math.floor((oy + bh) / 16) + 2);

    // Живая вода, пшеница, травинки
    const wind = t * 1.6;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const gt = scene.ground[y * scene.w + x];
      const sx = x * 16 - ox, sy = y * 16 - oy;
      if (gt === 'w') this.drawWater(g, scene, x, y, sx, sy, t, night);
      else if (gt === 'f') drawWheat(g, sx, sy, x, y, wind);
      else if (gt === 'g' && hash2(x, y, 77) < 0.3 && !objAt(scene, x, y)) {
        drawTuft(g, sx + 3 + ((hash2(x, y, 78) * 9) | 0), sy + 6 + ((hash2(x, y, 79) * 8) | 0), Math.round(Math.sin(wind + x * 0.7 + y * 0.4) * 0.8));
      }
    }
    if (indoor) this.drawWalls(g, scene, ox, oy, sky, t);
    this.fx.drawPrints(g, ox, oy);

    // Объекты: сначала «плоские», потом всё по глубине
    const list = [];
    for (const k in scene.objects) {
      const o = scene.objects[k];
      const d = OBJECTS[o.type] || {};
      const w = d.w || 1, h = d.h || 1;
      if (o.x + w < x0 - 2 || o.x > x1 + 2 || o.y + h < y0 - 1 || o.y > y1 + 3) continue;
      if (d.layer === 'ground') {
        this.drawGroundObj(g, o, o.x * 16 - ox, o.y * 16 - oy, scene);
        if (o.type === 'soil' && o.crop) list.push({ y: o.y * 16 + 15.5, f: () => this.drawCrop(g, o, o.x * 16 - ox, o.y * 16 - oy, t) });
      } else {
        list.push({ y: (o.y + h) * 16 - 0.1, f: () => this.drawObj(g, o, o.x * 16 - ox, o.y * 16 - oy, v, sky, t) });
      }
    }
    v.kid = v.ents.find(e => e.kind === 'kid');
    for (const e of v.ents) list.push({ y: e.y + 16, f: () => this.drawEnt(g, e, ox, oy, t) });
    list.sort((a, b) => a.y - b.y);

    // Подсветка цели обучения (под объектами)
    if (v.highlight && v.highlight.scene === scene.id) this.drawHighlight(g, v.highlight, ox, oy, t, false);
    for (const it of list) it.f();
    if (v.highlight && v.highlight.scene === scene.id) this.drawHighlight(g, v.highlight, ox, oy, t, true);

    this.fx.draw(g, ox, oy);
    if (!indoor) this.fx.drawCritters(g, ox, oy);

    // Дымок из труб
    this.smokeT -= v.dt;
    if (this.smokeT <= 0 && !indoor) {
      this.smokeT = 0.35;
      for (const k in scene.objects) {
        const o = scene.objects[k];
        if (o.type === 'house' || o.type === 'granny_house') this.fx.smoke(o.x * 16 + 60, o.y * 16 - 36);
        else if (o.type === 'cottage' && o.who) this.fx.smoke(o.x * 16 + 49, o.y * 16 - 32);
        else if (o.type === 'banya' && (state.banyaDay === state.day || state.day % 7 === 6)) { this.fx.smoke(o.x * 16 + 36, o.y * 16 - 24); this.fx.smoke(o.x * 16 + 35, o.y * 16 - 22); }
      }
    }

    this.drawLight(g, v, sky, ox, oy, t, indoor);
    if (!indoor) this.drawFog(g, scene, ox, oy, state.time, t);
    if (v.build) this.drawBuild(g, v.build, scene, ox, oy, x0, y0, x1, y1, t);

    // На экран
    const S = this.scale;
    this.g.imageSmoothingEnabled = false;
    this.g.drawImage(this.buf, 0, 0, bw * S, bh * S);
    this.drawTexts(v);
  }

  drawWater(g, sc, x, y, sx, sy, t, night) {
    R(g, sx, sy, 16, 16, C.water);
    for (let i = 0; i < 3; i++) {
      const r = hash2(x, y, i + 40);
      const yy = Math.floor((r * 16 + t * (3 + i * 1.5)) % 16);
      const xx = (hash2(y, x, i + 41) * 11) | 0;
      R(g, sx + xx, sy + yy, 3 + (i % 2) * 2, 1, i === 1 ? C.waterD : C.waterL);
    }
    const nb = (dx, dy) => { const n = sc.ground[(y + dy) * sc.w + x + dx]; return n && n !== 'w' && n !== 'b'; };
    const wob = i => (Math.sin(t * 2 + (x * 16 + i) * 0.7 + y) > 0.3 ? 2 : 1);
    if (nb(-1, 0)) for (let i = 0; i < 16; i++) R(g, sx, sy + i, wob(i), 1, C.foam);
    if (nb(1, 0)) for (let i = 0; i < 16; i++) { const w = wob(i + 5); R(g, sx + 16 - w, sy + i, w, 1, C.foam); }
    if (nb(0, -1)) R(g, sx, sy, 16, 1, C.foam);
    if (nb(0, 1)) R(g, sx, sy + 15, 16, 1, C.foam);
    if (night) {
      // звёзды отражаются в речке
      for (let i = 0; i < 2; i++) {
        const r = hash2(x, y, i + 90);
        if (r < 0.5) {
          const tw = Math.sin(t * (1 + r * 3) + r * 20);
          if (tw > 0.2) P(g, sx + ((r * 31) | 0) % 14 + 1, sy + ((r * 57) | 0) % 14 + 1, tw > 0.8 ? '#ffffff' : '#c8d8f0');
        }
      }
    }
  }

  drawWalls(g, scene, ox, oy, sky, t) {
    // окно с кружевными занавесками и видом наружу
    const wx = 5 * 16 - ox + 2, wy = 4 - oy;
    const out = sky.dark > 0.35 ? '#1a2448' : sky.dark > 0.1 ? '#e8a080' : '#9fd0e8';
    R(g, wx - 2, wy - 2, 32, 24, C.white);
    R(g, wx, wy, 28, 20, out);
    if (sky.dark > 0.35) { for (let i = 0; i < 7; i++) { const r = hash2(i, 3, 5); if (Math.sin(t * 2 + i) > -0.3) P(g, wx + 1 + ((r * 26) | 0), wy + 1 + ((hash2(3, i, 5) * 12) | 0), '#ffffff'); } }
    else { R(g, wx, wy + 14, 28, 6, '#8db35b'); R(g, wx + 4, wy + 6, 3, 9, C.birch); ellipse(g, wx + 6, wy + 6, 5, 4, C.leaf); }
    R(g, wx + 13, wy, 2, 20, C.white); R(g, wx, wy + 9, 28, 2, C.white);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 5 - y / 3; x++) if ((x + y) % 2 === 0) { P(g, wx + x, wy + y, '#ffffff'); P(g, wx + 27 - x, wy + y, '#ffffff'); }
    R(g, wx - 4, wy - 4, 36, 2, C.woodD);
    R(g, wx - 3, wy + 21, 34, 2, C.white);
    // ковёр на стене над кроватью
    g.drawImage(B.wallCarpetSprite(), 8 * 16 - ox, 1 - oy);
    // часы-ходики с маятником
    const cx = 3 * 16 - ox + 8, cy = 6 - oy;
    R(g, cx - 4, cy, 8, 9, C.woodD); R(g, cx - 3, cy + 1, 6, 6, C.white); P(g, cx, cy + 2, C.ink); P(g, cx, cy + 3, C.ink); P(g, cx + 1, cy + 4, C.ink);
    R(g, cx - 5, cy - 1, 10, 2, C.wood);
    const sw = Math.round(Math.sin(t * 3.2) * 3);
    R(g, cx + sw, cy + 9, 1, 8, C.brassD); R(g, cx + sw - 1, cy + 16, 3, 3, C.brass);
    // фотографии в рамочках
    const fx = 1 * 16 - ox, fy = 6 - oy;
    R(g, fx, fy, 9, 11, C.woodD); R(g, fx + 1, fy + 1, 7, 9, '#d8c8a8'); R(g, fx + 3, fy + 3, 3, 3, '#8a7a6a'); R(g, fx + 2, fy + 6, 5, 4, '#6a5a4a');
    R(g, fx + 11, fy + 3, 8, 9, C.woodD); R(g, fx + 12, fy + 4, 6, 7, '#c8b898'); R(g, fx + 14, fy + 5, 2, 2, '#7a6a5a'); R(g, fx + 13, fy + 7, 4, 3, '#5a6a8a');
  }

  drawGroundObj(g, o, sx, sy, scene) {
    switch (o.type) {
      case 'soil': g.drawImage(soilSprite(!!o.watered, !!o.framed), sx, sy); break;
      case 'path': g.drawImage(B.pathSprite((o.x + o.y) % 2), sx, sy); break;
      case 'rug': g.drawImage(B.rugSprite(), sx, sy); break;
      case 'exit': g.drawImage(B.doormatSprite(), sx, sy); break;
    }
  }

  drawCrop(g, o, sx, sy, t) {
    const st = cropStage(o.crop);
    const c = cropSprite(o.crop.id, st);
    if (o.crop.id === 'sunflower' && st === 3) {
      const sw = Math.round(Math.sin(t * 1.4 + o.x) * 1);
      g.drawImage(c, 0, 0, 16, 14, sx + sw, sy - 12, 16, 14);
      g.drawImage(c, 0, 14, 16, 14, sx, sy + 2, 16, 14);
    } else g.drawImage(c, sx, sy - 12);
  }

  fenceParts(scene, o) {
    const is = (x, y) => { const n = objAt(scene, x, y); return n && (n.type === 'fence' || n.type === 'gate'); };
    const h = is(o.x - 1, o.y) || is(o.x + 1, o.y);
    const vv = is(o.x, o.y - 1) || is(o.x, o.y + 1);
    return { h: h || !vv, v: vv };
  }

  drawObj(g, o, sx, sy, v, sky, t) {
    const scene = v.scene;
    // герой за крышей большого дома — делаем дом полупрозрачным
    const d0 = OBJECTS[o.type];
    if (d0 && (d0.big || d0.w >= 5) && v.kid) {
      const kx = v.kid.x + 8, ky = v.kid.y + 12, top = o.y * 16 - 40;
      if (kx > o.x * 16 && kx < (o.x + d0.w) * 16 && ky > top && ky < o.y * 16 + 8) {
        g.globalAlpha = 0.5; this.drawObjInner(g, o, sx, sy, v, sky, t); g.globalAlpha = 1; return;
      }
    }
    this.drawObjInner(g, o, sx, sy, v, sky, t);
  }
  drawObjInner(g, o, sx, sy, v, sky, t) {
    const scene = v.scene;
    switch (o.type) {
      case 'birch': case 'spruce': {
        const s = treeSprite(o.type, o.v || 0);
        ellipse(g, sx + 8, sy + 14, 7, 2.5, 'rgba(0,0,0,0.16)');
        const shake = v.shake && v.shake.x === o.x && v.shake.y === o.y ? Math.round(Math.sin(t * 50)) : 0;
        g.drawImage(s.trunk, sx - 4 + shake, sy - 20);
        const sw = Math.round(Math.sin(t * 1.3 + o.x * 0.7 + o.y * 0.3) * 0.7);
        g.drawImage(s.crown, sx - 4 + sw + shake, sy - 20);
        break;
      }
      case 'stump': g.drawImage(stumpSprite(o.tree || 'birch'), sx, sy); break;
      case 'rock': {
        const shake = v.shake && v.shake.x === o.x && v.shake.y === o.y ? Math.round(Math.sin(t * 50)) : 0;
        g.drawImage(rockSprite(o.v || 0), sx + shake, sy); break;
      }
      case 'bush_currant': case 'bush_raspberry': {
        const shake = v.shake && v.shake.x === o.x && v.shake.y === o.y ? Math.round(Math.sin(t * 40)) : 0;
        g.drawImage(bushSprite(OBJECTS[o.type].berry, !!o.berries, (o.x + o.y) % 2), sx + shake, sy); break;
      }
      case 'house': case 'granny_house': {
        const lit = sky.dark > 0.2 && (o.type === 'house' || (state_hour(sky) < 23.5));
        g.drawImage(B.houseSprite(o.type, lit), sx, sy - 36);
        break;
      }
      case 'well': g.drawImage(B.wellSprite(), sx - 8, sy - 32); break;
      case 'sellbox': g.drawImage(B.sellboxSprite(), sx, sy - 4); break;
      case 'chest': g.drawImage(B.chestSprite(), sx, sy - 2); break;
      case 'fence': {
        const p = this.fenceParts(scene, o);
        if (p.v) g.drawImage(B.fenceSprite('v'), sx, sy - 6);
        if (p.h) g.drawImage(B.fenceSprite('h'), sx, sy - 6);
        if (o.catOn) {} // котик рисуется отдельно
        break;
      }
      case 'gate': {
        const p = this.fenceParts(scene, o);
        const open = v.ents.some(e => (e.kind === 'kid' || e.kind === 'granny') && Math.abs(e.x - o.x * 16) < 14 && Math.abs(e.y - o.y * 16) < 14);
        g.drawImage(B.gateSprite(p.v && !p.h ? 'v' : 'h', open), sx, sy - 6);
        break;
      }
      case 'flowerbed': g.drawImage(B.flowerbedSprite(o.v || 0), sx, sy - 2); break;
      case 'bench': g.drawImage(B.benchSprite(), sx, sy); break;
      case 'lantern': g.drawImage(B.lanternSprite(sky.dark > 0.2), sx, sy - 16); break;
      case 'birdhouse': g.drawImage(B.birdhouseSprite(), sx, sy - 16); break;
      case 'scarecrow': g.drawImage(B.scarecrowSprite(), sx, sy - 16); break;
      case 'geranium': g.drawImage(B.geraniumSprite(), sx, sy); break;
      case 'haystack': g.drawImage(B.haystackSprite(), sx, sy - 8); break;
      case 'van': g.drawImage(B.vanSprite(), sx, sy - 8); break;
      case 'cottage': g.drawImage(cottageSprite(o.who || 'none', sky.dark > 0.2 && !!o.who), sx, sy - 32); break;
      case 'selpo': g.drawImage(selpoSprite(sky.dark > 0.2), sx, sy - 30); break;
      case 'banya': g.drawImage(banyaSprite(sky.dark > 0.2 || v.state.banyaDay === v.state.day), sx, sy - 24); break;
      case 'club': g.drawImage(clubSprite(sky.dark > 0.2, !!v.party && Math.floor(t * 2) % 2 === 0), sx, sy - 40); break;
      case 'stove': {
        g.drawImage(B.stoveSprite(), sx, sy - 16);
        // огонь в печи
        const fx = sx + 14, fy = sy - 16 + 36;
        for (let i = 0; i < 6; i++) {
          const h = 3 + Math.round(Math.abs(Math.sin(t * 9 + i * 1.7)) * 7);
          R(g, fx + i * 3, fy + 12 - h, 3, h, i % 2 ? C.orange : C.red);
          R(g, fx + i * 3 + 1, fy + 12 - Math.max(1, h - 3), 1, Math.max(1, h - 3), C.yellow);
        }
        R(g, fx, fy + 10, 16, 2, '#6a2a1a');
        break;
      }
      case 'bed': g.drawImage(B.bedSprite(), sx, sy - 8); break;
      case 'table': {
        g.drawImage(B.tableSprite(), sx, sy - 8);
        if (Math.sin(t * 1.3) > 0.2) { const k = (t * 0.7) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; g.fillRect(sx + 23 + Math.round(Math.sin(t * 3)), sy - 10 - Math.round(k * 10), 2, 2); }
        break;
      }
      case 'sideboard': g.drawImage(B.sideboardSprite(), sx, sy - 24); break;
      case 'radio': g.drawImage(B.radioSprite(), sx, sy - 12); if (v.radioOn) { const k = (t * 1.2) % 1; g.fillStyle = `rgba(60,40,30,${1 - k})`; g.fillRect(sx + 12 + Math.round(k * 3), sy - 14 - Math.round(k * 8), 2, 1); g.fillRect(sx + 13 + Math.round(k * 3), sy - 16 - Math.round(k * 8), 1, 2); } break;
    }
  }

  drawEnt(g, e, ox, oy, t) {
    const x = Math.round(e.x - ox), y = Math.round(e.y - oy);
    if (e.kind === 'cat') {
      const s = catSprite(e.pose);
      const lift = e.pose === 'fence' ? 9 : 0;
      ellipse(g, x + 8, y + 15, 5, 1.6, 'rgba(0,0,0,0.18)');
      g.save();
      if (e.flip) { g.translate(x + 16, 0); g.scale(-1, 1); g.drawImage(s, 0, y + 4 - lift); }
      else g.drawImage(s, x, y + 4 - lift);
      g.restore();
      if (e.pose === 'sleep' && Math.random() < 0.01) this.fx.zzz(e.x + 10, e.y + 4);
      return;
    }
    ellipse(g, x + 8, y + 15, 5, 1.8, 'rgba(0,0,0,0.2)');
    const spr = e.kind === 'granny' ? grannySprite(e.dir, e.frame) : e.kind === 'villager' ? villagerSprite(e.id, e.dir, e.frame) : kidSprite(e.dir, e.frame, e.pose, e.look);
    const by = y - 4 + Math.round(e.bob || 0);
    if (e.tool && e.pose === 'work') {
      const behind = e.dir === 'up';
      if (behind) this.drawTool(g, e, x, by);
      g.drawImage(spr, x, by);
      if (!behind) this.drawTool(g, e, x, by);
    } else g.drawImage(spr, x, by);
  }

  drawTool(g, e, x, y) {
    const ic = icon(e.tool);
    const ph = e.phase || 0; // 0..1 замах→удар
    const dirSign = e.dir === 'left' ? -1 : 1;
    let ang, hx, hy;
    if (e.tool === 'can') { ang = -0.3 * dirSign + 0.5 * dirSign * Math.sin(ph * Math.PI); hx = x + 8 + dirSign * 5; hy = y + 12; }
    else { ang = dirSign * (-1.6 + ph * 2.4); hx = x + 8 + dirSign * 3; hy = y + 10; }
    g.save();
    g.translate(hx, hy);
    if (e.dir === 'left') g.scale(-1, 1);
    g.rotate(e.dir === 'left' ? -ang : ang);
    g.drawImage(ic, -4, -12, 12, 12);
    g.restore();
  }

  drawHighlight(g, h, ox, oy, t, top) {
    const pulse = (Math.sin(t * 4) + 1) / 2;
    const x = h.x * 16 - ox, y = h.y * 16 - oy, w = (h.w || 1) * 16, hh = (h.h || 1) * 16;
    if (!top) {
      g.fillStyle = `rgba(255,240,150,${0.15 + pulse * 0.2})`;
      g.fillRect(x - 1, y - 1, w + 2, hh + 2);
      return;
    }
    g.fillStyle = `rgba(255,250,210,${0.6 + pulse * 0.4})`;
    const L = 4;
    for (const [cx, cy, dx, dy] of [[x - 2, y - 2, 1, 1], [x + w + 1, y - 2, -1, 1], [x - 2, y + hh + 1, 1, -1], [x + w + 1, y + hh + 1, -1, -1]]) {
      g.fillRect(dx > 0 ? cx : cx - L + 1, cy, L, 1);
      g.fillRect(cx, dy > 0 ? cy : cy - L + 1, 1, L);
    }
    // цель за краем экрана — стрелка у края
    const cxm = x + w / 2, cym = y + hh / 2, W = this.buf.width, Hh = this.buf.height;
    if (cxm < 0 || cym < 0 || cxm > W || cym > Hh) {
      const mx = W / 2, my = Hh / 2, dx = cxm - mx, dy = cym - my;
      const k = Math.min((W / 2 - 14) / Math.abs(dx || 1e-6), (Hh / 2 - 14) / Math.abs(dy || 1e-6));
      const ex = mx + dx * k, ey = my + dy * k, a = Math.atan2(dy, dx), bob = Math.sin(t * 5) * 2;
      g.save(); g.translate(Math.round(ex + Math.cos(a) * bob), Math.round(ey + Math.sin(a) * bob)); g.rotate(a);
      g.fillStyle = '#7a4e2c';
      for (let i = 0; i < 7; i++) g.fillRect(-1 - i + 3, -i - 1, 2, i * 2 + 2);
      g.fillStyle = '#fff4c0';
      for (let i = 0; i < 5; i++) g.fillRect(1 - i + 3, -i, 1, i * 2);
      g.restore();
      return;
    }
    // прыгающая стрелочка
    const ay = y - (h.tall || 18) - Math.round(Math.abs(Math.sin(t * 4)) * 4);
    const ax = x + w / 2;
    g.fillStyle = '#fff4c0';
    for (let i = 0; i < 4; i++) g.fillRect(Math.round(ax - 4 + i), ay + i, 8 - i * 2, 1);
    g.fillRect(Math.round(ax - 1), ay - 4, 2, 4);
    g.fillStyle = '#c0703a';
    g.fillRect(Math.round(ax - 1), ay + 4, 2, 1);
  }

  drawFog(g, scene, ox, oy, time, t) {
    const h = time / 60;
    let a = 0;
    if (h < 4.5) a = 0; else if (h < 5.5) a = 0.6 * (h - 4.5); else if (h < 6.5) a = 0.6; else if (h < 9) a = 0.6 * (1 - (h - 6.5) / 2.5);
    if (h > 22) a = Math.min(0.3, (h - 22) * 0.15);
    if (a <= 0.01) return;
    for (let y = Math.floor(oy / 16) - 2; y < (oy + this.buf.height) / 16 + 2; y += 2) {
      const rx = riverX(y) * 16 + 8 + Math.sin(t * 0.3 + y) * 20;
      const gr = g.createRadialGradient(rx - ox, y * 16 - oy, 2, rx - ox, y * 16 - oy, 50);
      gr.addColorStop(0, `rgba(240,244,248,${a * 0.6})`);
      gr.addColorStop(0.5, `rgba(240,244,248,${a * 0.3})`);
      gr.addColorStop(1, 'rgba(240,244,248,0)');
      g.fillStyle = gr;
      g.fillRect(rx - ox - 50, y * 16 - oy - 50, 100, 100);
    }
  }

  drawBuild(g, b, scene, ox, oy, x0, y0, x1, y1, t) {
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = x0; x <= x1 + 1; x++) g.fillRect(x * 16 - ox, 0, 1, this.buf.height);
    for (let y = y0; y <= y1 + 1; y++) g.fillRect(0, y * 16 - oy, this.buf.width, 1);
    if (b.hover) {
      const { x, y, ok, remove } = b.hover;
      const W = (b.hover.w || 1) * 16, Hh = (b.hover.h || 1) * 16;
      const sx = x * 16 - ox, sy = y * 16 - oy;
      if (b.item && ok && !remove) { g.globalAlpha = 0.6; g.drawImage(icon(b.item), sx + W / 2 - 8, sy + Hh / 2 - 8); g.globalAlpha = 1; }
      const col = remove ? '255,190,90' : ok ? '140,230,120' : '240,100,90';
      g.fillStyle = `rgba(${col},${0.35 + Math.sin(t * 6) * 0.1})`;
      g.fillRect(sx, sy, W, Hh);
      g.fillStyle = `rgb(${col})`;
      g.fillRect(sx, sy, W, 1); g.fillRect(sx, sy + Hh - 1, W, 1); g.fillRect(sx, sy, 1, Hh); g.fillRect(sx + W - 1, sy, 1, Hh);
    }
  }

  drawLight(g, v, sky, ox, oy, t, indoor) {
    const dark = indoor ? sky.dark * 0.55 : sky.dark;
    const scene = v.scene;
    // оттенок (рассвет, закат)
    if (sky.tintA > 0.01 && !indoor) {
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = `rgba(${sky.tint.map(Math.round).join(',')},${sky.tintA})`;
      g.fillRect(0, 0, this.buf.width, this.buf.height);
      g.globalCompositeOperation = 'source-over';
    }
    if (dark < 0.02) return;
    const lg = this.lg, W = this.light.width, H = this.light.height;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, W, H);
    lg.fillStyle = indoor ? `rgba(30,18,10,${dark})` : `rgba(14,20,52,${dark})`;
    lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-out';
    const lights = [];
    const flick = 1 + Math.sin(t * 7) * 0.03 + Math.sin(t * 13) * 0.02;
    for (const k in scene.objects) {
      const o = scene.objects[k];
      const d = OBJECTS[o.type];
      if (!d || !d.light) continue;
      if (o.type === 'house' || o.type === 'granny_house') {
        lights.push([o.x * 16 + 18, o.y * 16 + 40, 26], [o.x * 16 + 62, o.y * 16 + 40, 26]);
      } else if (o.type === 'stove') lights.push([o.x * 16 + 22, o.y * 16 + 26, 70 * flick]);
      else if (d.big) { if (o.type !== 'cottage' || o.who) lights.push([o.x * 16 + d.w * 8, o.y * 16 + d.h * 16 - 14, d.light * 16 * flick]); }
      else lights.push([o.x * 16 + 8, o.y * 16 - 6, d.light * 16 * flick]);
    }
    if (indoor) lights.push([5 * 16 + 16, 40, 30]);
    const nWarm = lights.length;
    for (const c of this.fx.critters) if (c.kind === 'firefly') lights.push([c.x, c.y - 6, 3.5]);
    for (const [lx, ly, r] of lights) {
      const x = lx - ox, y = ly - oy;
      if (x < -r || y < -r || x > W + r || y > H + r) continue;
      const gr = lg.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr;
      lg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.drawImage(this.light, 0, 0);
    // тёплое свечение
    g.globalCompositeOperation = 'lighter';
    for (const [lx, ly, r] of lights.slice(0, nWarm)) {
      const x = lx - ox, y = ly - oy;
      if (x < -r || y < -r || x > W + r || y > H + r) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 0.7);
      gr.addColorStop(0, `rgba(255,170,60,${0.22 * dark})`); gr.addColorStop(1, 'rgba(255,170,60,0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }

  // Всплывающие надписи «+3» — чётким шрифтом поверх пикселей
  drawTexts(v) {
    const g = this.g;
    const fs = Math.round(8 * this.scale);
    g.font = `bold ${fs}px "Trebuchet MS", Verdana, sans-serif`;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    for (const tx of this.fx.texts) {
      const k = tx.t / tx.life;
      const sx = (tx.x - this.view.x) * this.scale, sy = (tx.y - this.view.y - 8 - k * 14) * this.scale;
      g.globalAlpha = Math.min(1, (1 - k) * 2.5);
      const ic = tx.icon ? icon(tx.icon) : null;
      const tw = g.measureText(tx.str).width;
      const iw = ic ? fs * 1.2 : 0;
      const x0 = sx - (tw + iw) / 2;
      g.lineWidth = Math.max(2, this.scale);
      g.strokeStyle = '#4a2e1e';
      g.strokeText(tx.str, x0, sy);
      g.fillStyle = '#fff6dc';
      g.fillText(tx.str, x0, sy);
      if (ic) { g.imageSmoothingEnabled = false; g.drawImage(ic, x0 + tw + fs * 0.1, sy - fs * 0.55, fs * 1.1, fs * 1.1); }
      g.globalAlpha = 1;
    }
  }
}

function state_hour(sky) { return sky.hour; }
