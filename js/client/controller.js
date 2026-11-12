// «Умное действие»: тап по клетке → герой сам идёт, сам выбирает инструмент, делает дело.
// Здесь только намерения игрока; изменения мира — через game.dispatch(action).
import { OBJECTS } from '../config/objects.js';
import { ITEMS } from '../config/items.js';
import { CROPS } from '../config/crops.js';
import { objAt, ground, walkable, defOf, findObj, doorTile } from '../core/world.js';
import { findPath, pathNear } from '../core/pathfind.js';
import { canCapacity } from '../core/actions.js';

const SPEED = 64;          // пикселей в секунду (4 клетки)
const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));

function around(x, y, w = 1, h = 1, includeSelf = false) {
  const res = [];
  for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) {
    const inside = xx >= x && xx < x + w && yy >= y && yy < y + h;
    if (inside && !includeSelf) continue;
    res.push([xx, yy]);
  }
  // сначала стороны, потом углы
  return res.sort((a, b) => {
    const ca = (a[0] < x || a[0] >= x + w) && (a[1] < y || a[1] >= y + h) ? 1 : 0;
    const cb = (b[0] < x || b[0] >= x + w) && (b[1] < y || b[1] >= y + h) ? 1 : 0;
    return ca - cb;
  });
}

export class Controller {
  constructor(game) {
    this.game = game;
    this.job = null;
    this.vis = { x: 0, y: 0 };
    this.anim = 0;
    this.pose = 'walk';
    this.tool = null; this.phase = 0;
    this.idle = 0;
    this.lastTile = null;
  }
  get p() { return this.game.state.players[this.game.pid]; }
  get scene() { return this.game.state.scenes[this.p.scene]; }
  syncVis() { this.vis = { x: this.p.x * 16, y: this.p.y * 16 }; this.dir = this.p.dir; this.job = null; this.pose = 'walk'; this.tool = null; }
  face(dir) { this.dir = dir; if (this.p.dir !== dir) this.game.dispatch({ type: 'face', dir }); }
  busy() { return !!this.job; }
  cancel() { this.job = null; this.pose = 'walk'; this.tool = null; }

  // ---------- планирование ----------
  pathTo(x, y) { return findPath(this.scene, this.p.x, this.p.y, x, y); }
  pathAdj(x, y, w = 1, h = 1, self = false) {
    const p = this.p;
    const adj = around(x, y, w, h, self);
    if (adj.some(([ax, ay]) => ax === p.x && ay === p.y)) return [];
    return pathNear(this.scene, p.x, p.y, adj);
  }
  start(steps) { this.job = { steps, i: 0, t: 0 }; this.idle = 0; }

  // Тап по клетке (и, возможно, по существу)
  tap(tx, ty, ent) {
    const g = this.game, p = this.p, sc = this.scene;
    if (ent) return this.tapEntity(ent);
    const o = objAt(sc, tx, ty);
    const d = o ? defOf(o) : {};
    const gr = ground(sc, tx, ty);
    if (gr === null) return;

    // Внутри дома
    if (sc.indoor) {
      if (o && d.kind === 'exit') return this.go(this.pathTo(o.x, o.y), [{ t: 'do', fn: () => g.dispatch({ type: 'exit' }) }]);
      if (o && d.kind === 'bed') return this.goAdj(o, [{ t: 'do', fn: () => g.ui.openSleep() }]);
      if (o && d.kind === 'stove') return this.goAdj(o, [{ t: 'do', fn: () => g.ui.openStove() }]);
      if (o && d.kind === 'radio') return this.goAdj(o, [{ t: 'do', fn: () => g.toggleRadio() }]);
      if (o && d.kind === 'samovar') return this.goAdj(o, [{ t: 'do', fn: () => { g.sound.play('tea'); g.fx.sparkle(o.x * 16 + 24, o.y * 16); g.fx.bubble(this.vis.x + 8, this.vis.y - 4, 'heart'); } }]);
      return this.walkTo(tx, ty);
    }

    if (o) {
      switch (d.kind) {
        case 'tree': return this.goAdj(o, [this.workStep(d.tool, d.hits, o, { type: 'gather', x: o.x, y: o.y }, 'chop')]);
        case 'rock': return this.goAdj(o, [this.workStep(d.tool, d.hits, o, { type: 'gather', x: o.x, y: o.y }, 'mine')]);
        case 'bush':
          if (!o.berries) return this.goAdj(o, [{ t: 'bubble', id: 'clock' }]);
          return this.goAdj(o, [{ t: 'work', tool: null, dur: 0.6, face: o, act: { type: 'gather', x: o.x, y: o.y }, sfx: 'pick' }]);
        case 'stump': return this.goAdj(o, [{ t: 'bubble', id: 'clock' }]);
        case 'soil': return this.tapSoil(o);
        case 'house': {
          const dt = doorTile(o);
          return this.go(this.pathTo(dt.x, dt.y), [{ t: 'face', dir: 'up' }, { t: 'do', fn: () => g.dispatch({ type: 'enter' }) }]);
        }
        case 'granny_house': return this.goAdj(o, [{ t: 'bubble', id: 'granny' }]);
        case 'well': return this.goAdj(o, [{ t: 'work', tool: 'can', dur: 0.8, face: o, act: { type: 'refill', x: o.x, y: o.y } }]);
        case 'sellbox': return this.goAdj(o, [{ t: 'do', fn: () => g.ui.openContainer(o) }]);
        case 'chest': return this.goAdj(o, [{ t: 'do', fn: () => g.ui.openContainer(o) }]);
        case 'shop': return this.goAdj(o, [{ t: 'do', fn: () => g.ui.openShop() }]);
        case 'gate': return this.walkTo(tx, ty);
      }
      if (!d.solid) return this.walkTo(tx, ty);
      return this.goAdj(o, []);
    }
    if (gr === 'p') {
      const lvl = p.tools.shovel || 1;
      return this.goAdjTile(tx, ty, [{ t: 'work', tool: 'shovel', dur: lvl > 1 ? 0.45 : 0.7, face: { x: tx, y: ty }, act: { type: 'till', x: tx, y: ty }, sfx: 'dig' }]);
    }
    if (gr === 'w') return this.goAdjTile(tx, ty, [{ t: 'work', tool: 'can', dur: 0.8, face: { x: tx, y: ty }, act: { type: 'refill', x: tx, y: ty } }]);
    return this.walkTo(tx, ty);
  }

  tapSoil(o) {
    const g = this.game, p = this.p;
    if (o.granny) return this.goAdj(o, [{ t: 'bubble', id: 'granny' }], true);
    if (o.crop) {
      const c = CROPS[o.crop.id];
      if (o.crop.growth >= c.days) return this.goAdj(o, [{ t: 'work', tool: null, dur: 0.4, face: o, act: { type: 'harvest', x: o.x, y: o.y }, sfx: 'harvest' }], true);
      if (o.watered) return this.goAdj(o, [{ t: 'bubble', id: 'clock' }], true);
      return this.waterPlan(o);
    }
    // посадить
    const seeds = Object.keys(p.inv).filter(id => ITEMS[id] && ITEMS[id].cat === 'seed');
    if (!seeds.length) return this.goAdj(o, [{ t: 'bubble', id: 'question' }], true);
    let seed = p.seed && p.inv[p.seed] ? p.seed : null;
    if (!seed && seeds.length === 1) seed = seeds[0];
    if (!seed) return g.ui.openSeedPicker(seeds, s => this.tapSoil(o), o);
    return this.goAdj(o, [{ t: 'work', tool: null, dur: 0.35, face: o, act: { type: 'plant', x: o.x, y: o.y, seed }, sfx: 'plant' }], true);
  }

  waterPlan(o) {
    const p = this.p;
    const waterStep = { t: 'work', tool: 'can', dur: 0.6, face: o, act: { type: 'water', x: o.x, y: o.y }, sfx: 'water' };
    if (p.water > 0) return this.goAdj(o, [waterStep], true);
    // Лейка пустая: сначала сами сходим к воде
    const src = this.nearestWater();
    if (!src) return this.goAdj(o, [{ t: 'bubble', id: 'water' }], true);
    const steps = [
      { t: 'work', tool: 'can', dur: 0.8, face: src, act: { type: 'refill', x: src.x, y: src.y } },
      { t: 'replan', fn: () => this.waterPlan(o) },
    ];
    return this.go(this.pathAdj(src.x, src.y), steps);
  }

  nearestWater() {
    const sc = this.scene, p = this.p;
    const cands = [];
    const well = findObj(sc, q => q.type === 'well');
    if (well) cands.push({ x: well.x, y: well.y, d: Math.hypot(well.x - p.x, well.y - p.y) });
    for (let y = p.y - 15; y <= p.y + 15; y++) for (let x = p.x - 15; x <= p.x + 15; x++) {
      if (ground(sc, x, y) !== 'w') continue;
      if (around(x, y).some(([ax, ay]) => walkable(sc, ax, ay))) cands.push({ x, y, d: Math.hypot(x - p.x, y - p.y) });
    }
    cands.sort((a, b) => a.d - b.d);
    for (const c of cands.slice(0, 5)) if (this.pathAdj(c.x, c.y)) return c;
    return null;
  }

  tapEntity(e) {
    const g = this.game;
    const tx = Math.round(e.x / 16), ty = Math.round(e.y / 16);
    if (e.kind === 'granny') {
      g.granny.hold = 8;
      return this.goAdjTile(tx, ty, [{ t: 'faceEnt', ent: e }, { t: 'do', fn: () => g.dispatch({ type: 'talk', npc: 'granny' }) }]);
    }
    if (e.kind === 'cat') {
      g.cat.hold = 4;
      return this.goAdjTile(tx, ty, [{ t: 'faceEnt', ent: e }, { t: 'do', fn: () => { g.dispatch({ type: 'pet', x: e.x + 8, y: e.y }); g.sound.play(Math.random() < 0.5 ? 'meow' : 'purr'); } }]);
    }
  }

  workStep(tool, hits, o, act, sfx) {
    const lvl = this.p.tools[tool] || 1;
    const per = lvl > 1 ? 0.32 : 0.48;
    return { t: 'work', tool, dur: per * hits, hits, face: o, act, sfx, shake: o };
  }

  goAdj(o, steps, self = false) {
    const d = OBJECTS[o.type] || {};
    return this.go(this.pathAdj(o.x, o.y, d.w || 1, d.h || 1, self), steps);
  }
  goAdjTile(x, y, steps) { return this.go(this.pathAdj(x, y, 1, 1, false), steps); }
  walkTo(x, y) {
    let path = walkable(this.scene, x, y) ? this.pathTo(x, y) : this.pathAdj(x, y);
    if (!path) path = this.pathAdj(x, y);
    this.go(path, []);
  }
  go(path, steps) {
    if (!path) { this.game.sound.play('no'); this.game.fx.bubble(this.vis.x + 8, this.vis.y - 4, 'question'); return; }
    this.start([{ t: 'walk', path: path.slice() }, ...steps]);
  }

  // ---------- клавиатура ----------
  stepDir(dx, dy) {
    if (this.job) return;
    const p = this.p;
    const nx = p.x + dx, ny = p.y + dy;
    if (walkable(this.scene, nx, ny) && (!dx || !dy || (walkable(this.scene, p.x + dx, p.y) && walkable(this.scene, p.x, p.y + dy)))) {
      this.start([{ t: 'walk', path: [[nx, ny]] }]);
    } else {
      this.face(dirOf(dx, dy));
    }
  }
  actFront() {
    const p = this.p;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
    const fx = p.x + d[0], fy = p.y + d[1];
    const ent = this.game.entityAtTile(fx, fy);
    if (ent) return this.tap(fx, fy, ent);
    const o = objAt(this.scene, fx, fy);
    if (o || ground(this.scene, fx, fy) === 'p' || ground(this.scene, fx, fy) === 'w') return this.tap(fx, fy);
    const here = objAt(this.scene, p.x, p.y);
    if (here) return this.tap(p.x, p.y);
  }

  // ---------- кадр ----------
  update(dt) {
    const g = this.game, p = this.p;
    this.anim += dt;
    if (!this.job) {
      this.idle += dt;
      this.pose = 'walk'; this.tool = null;
      return;
    }
    this.idle = 0;
    const job = this.job;
    const st = job.steps[job.i];
    if (!st) { this.cancel(); return; }
    const next = () => { job.i++; job.t = 0; if (job.i >= job.steps.length) this.cancel(); };
    switch (st.t) {
      case 'walk': {
        if (!st.path.length) { next(); break; }
        const [nx, ny] = st.path[0];
        const tx = nx * 16, ty = ny * 16;
        const dx = tx - this.vis.x, dy = ty - this.vis.y;
        const dist = Math.hypot(dx, dy);
        const dir = dirOf(nx - p.x, ny - p.y);
        this.dir = dir;
        const stepLen = SPEED * dt;
        if (dist <= stepLen || dist < 0.01) {
          this.vis.x = tx; this.vis.y = ty;
          const r = g.dispatch({ type: 'move', x: nx, y: ny, dir });
          if (!r.ok) { this.cancel(); this.vis.x = p.x * 16; this.vis.y = p.y * 16; break; }
          st.path.shift();
          g.onStep(nx, ny);
        } else {
          this.vis.x += dx / dist * stepLen;
          this.vis.y += dy / dist * stepLen;
        }
        break;
      }
      case 'face': this.face(st.dir); next(); break;
      case 'faceEnt': this.face(dirOf(st.ent.x / 16 - p.x, st.ent.y / 16 - p.y)); next(); break;
      case 'bubble': g.fx.bubble(this.vis.x + 8, this.vis.y - 4, st.id); g.sound.play('pop'); next(); break;
      case 'do': st.fn(); next(); break;
      case 'replan': this.cancel(); st.fn(); break;
      case 'work': {
        if (job.t === 0 && st.face) {
          const fx = st.face.x + ((OBJECTS[st.face.type] || {}).w || 1) / 2 - 0.5;
          const fy = st.face.y + ((OBJECTS[st.face.type] || {}).h || 1) / 2 - 0.5;
          if (fx !== p.x || fy !== p.y) this.face(dirOf(fx - p.x, fy - p.y));
          if (st.act.type === 'refill' && p.water >= canCapacity(p) && !st.force) { g.fx.bubble(this.vis.x + 8, this.vis.y - 4, 'water'); }
        }
        const hits = st.hits || 1;
        const per = st.dur / hits;
        const before = Math.floor(job.t / per);
        job.t += dt;
        const after = Math.floor(job.t / per);
        this.pose = st.tool ? 'work' : 'walk';
        this.tool = st.tool;
        this.phase = (job.t % per) / per;
        if (after > before && after <= hits) g.onHit(st, after, hits);
        if (st.tool === 'can' && st.act.type === 'water' && Math.random() < 0.3) g.fx.drops(st.face.x * 16 + 8, st.face.y * 16 + 6);
        if (job.t >= st.dur) {
          this.pose = 'walk'; this.tool = null;
          const r = g.dispatch(st.act);
          if (!r.ok) g.sound.play('no');
          next();
        }
        break;
      }
    }
  }

  frame() {
    if (this.job && this.job.steps[this.job.i] && this.job.steps[this.job.i].t === 'walk') return 1 + (Math.floor(this.anim * 7) % 2);
    return 0;
  }
}
