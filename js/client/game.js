// Клиент игры: связывает состояние мира, ввод, отрисовку, звук и интерфейс.
import { applyAction, placeCheck, removeCheck } from '../core/actions.js';
import { tick } from '../core/sim.js';
import { newGame } from '../core/state.js';
import { saveLocal, loadLocal } from '../core/save.js';
import { MIN_PER_SEC, objAt, defOf, walkable, findObj, ground } from '../core/world.js';
import { findPath } from '../core/pathfind.js';
import { OBJECTS } from '../config/objects.js';
import { TUTORIAL } from '../config/story.js';
import { Renderer, skyAt } from '../render/renderer.js';
import { Effects } from '../render/effects.js';
import { setCatIconSource, imgHTML } from '../render/icons.js';
import { recipeById } from '../config/recipes.js';
import { catSprite } from '../render/sprites_chars.js';
import { Controller } from './controller.js';
import { UI } from './ui.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { HOME_ENTRY } from '../core/mapgen.js';

const GRANNY_SPOTS = [[37, 28], [39, 27], [41, 27], [39, 33], [36, 30], [34, 29], [38, 33], [33, 31]];

export class Game {
  constructor(canvas) {
    setCatIconSource(() => catSprite('sit'));
    this.pid = 'p1';
    this.state = loadLocal() || newGame();
    this.fx = new Effects();
    this.renderer = new Renderer(canvas, this.fx);
    this.sound = new Sound();
    this.ctrl = new Controller(this);
    this.ctrl.syncVis();
    this.initNPC();
    this.ui = new UI(this);
    this.input = new Input(this, canvas);
    this.build = null;
    this.paused = false;
    this.t = 0;
    this.saveT = 0;
    this.hlT = 0;
    this.highlight = null;
    this.shake = null;
    this.snapCam();
    window.addEventListener('resize', () => { this.renderer.resize(); this.snapCam(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    window.addEventListener('pagehide', () => this.save());
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  }

  get p() { return this.state.players[this.pid]; }

  initNPC() {
    this.granny = { x: 37 * 16, y: 28 * 16, path: [], wait: 1, hold: 0, dir: 'down', anim: 0 };
    const p = this.p;
    this.cat = { x: (p.x + 1) * 16, y: p.y * 16, scene: p.scene, path: [], pose: 'sit', flip: false, hold: 0, repath: 0, anim: 0, mode: 'follow', away: 0 };
  }

  // Единая точка изменения мира
  dispatch(a) {
    a.pid = this.pid;
    const r = applyAction(this.state, a);
    if (r.ok) { this.handleFx(r.fx); this.dirty = true; }
    return r;
  }

  handleFx(list) {
    const fx = this.fx, snd = this.sound, ui = this.ui;
    let refresh = false;
    for (const f of list) {
      const cx = (f.x ?? 0) * 16 + 8, cy = (f.y ?? 0) * 16;
      switch (f.t) {
        case 'gain': fx.text(cx, cy, '+' + f.n, f.item); refresh = true; break;
        case 'fell': fx.burst(cx, cy - 10, f.tree === 'birch' ? ['#b5cf6a', '#93b44f', '#efe9da'] : ['#4a7a50', '#355e3c', '#a26b3d'], 14, { up: 30 }); snd.play('fell'); break;
        case 'break': fx.burst(cx, cy + 8, ['#c8c2b8', '#a8a299', '#857f77'], 12); snd.play('break'); break;
        case 'pick': fx.burst(cx, cy + 6, ['#d6475e', '#3a2b4a', '#7aa957'], 8, { speed: 25 }); break;
        case 'dig': fx.burst(cx, cy + 10, ['#6a4430', '#8a5d3b', '#52331f'], 10, { speed: 30 }); break;
        case 'plant': fx.burst(cx, cy + 10, ['#7eaa5e', '#e8d8a8'], 5, { speed: 15 }); break;
        case 'water': fx.drops(cx, cy + 8); break;
        case 'refill': fx.drops(cx, cy + 6); snd.play('refill'); fx.text(this.ctrl.vis.x + 8, this.ctrl.vis.y, this.p.water + '', 'water'); break;
        case 'harvest': fx.sparkle(cx, cy + 8); break;
        case 'craft': fx.sparkle(this.ctrl.vis.x + 8, this.ctrl.vis.y + 4); snd.play('craft'); refresh = true; break;
        case 'place': fx.burst(cx, cy + 12, ['#d9bb87', '#c9a56d'], 6, { speed: 20, up: 10 }); snd.play('place'); refresh = true; break;
        case 'pickup': fx.burst(cx, cy + 12, ['#d9bb87', '#ffffff'], 6, { speed: 20, up: 10 }); snd.play('remove'); refresh = true; break;
        case 'store': refresh = true; break;
        case 'buy': refresh = true; break;
        case 'coins': fx.text(this.ctrl.vis.x + 8, this.ctrl.vis.y - 4, '+' + f.n, 'coin'); snd.play('coin'); refresh = true; break;
        case 'recipe': ui.toast(`Новый рецепт! ${this.recipeIcon(f.id)}`); break;
        case 'say': ui.say(f.lines); break;
        case 'hearts': fx.hearts(f.x, f.y); break;
        case 'scene': this.onScene(); snd.play('door'); break;
        case 'morning': this.ctrl.syncVis(); this.initNPC(); this.snapCam(); ui.morning(f); snd.play('morning'); this.save(); refresh = true; break;
        case 'tutorial': snd.play('quest'); refresh = true; this.hlT = 0; break;
        case 'questDone': snd.play('quest'); fx.hearts(this.ctrl.vis.x + 8, this.ctrl.vis.y); break;
      }
    }
    if (refresh) ui.refresh();
  }
  recipeIcon(id) {
    const r = recipeById(id);
    return imgHTML(r && r.out ? Object.keys(r.out)[0] : r && r.tool ? r.tool[0] : 'question');
  }

  onScene() {
    this.ctrl.syncVis();
    if (this.build) this.toggleBuild();
    this.snapCam();
    this.ui.refresh();
  }

  onStep(x, y) {
    const sc = this.state.scenes[this.p.scene];
    const o = objAt(sc, x, y);
    if (o && o.type === 'gate') this.sound.play('gate');
    const g = ground(sc, x, y);
    if (!sc.indoor && (g === 'd' || g === 's' || g === 'p')) this.fx.footprint(x * 16 + 6 + Math.random() * 3, y * 16 + 14, true);
    else if (!sc.indoor && g === 'g' && Math.random() < 0.5) this.fx.footprint(x * 16 + 7, y * 16 + 14, false);
  }

  onHit(st, n, hits) {
    if (st.sfx) this.sound.play(st.sfx);
    if (st.shake) { this.shake = { x: st.shake.x, y: st.shake.y, t: 0.15 }; }
    const fx = st.face ? st.face.x * 16 + 8 : 0, fy = st.face ? st.face.y * 16 + 8 : 0;
    if (st.tool === 'axe') this.fx.burst(fx, fy, ['#c08550', '#efe9da', '#d8b98a'], 4, { speed: 30 });
    if (st.tool === 'pickaxe') this.fx.burst(fx, fy, ['#c8c2b8', '#ffffff'], 4, { speed: 40 });
  }

  toggleRadio() {
    this.sound.setMusic(!this.sound.musicOn);
    this.fx.bubble(this.ctrl.vis.x + 8, this.ctrl.vis.y - 4, this.sound.musicOn ? 'music' : 'music_off');
  }

  sleep() {
    if (this.sleeping) return;
    this.sleeping = true;
    this.ctrl.cancel();
    const fade = document.getElementById('fade');
    fade.classList.add('on');
    this.sound.play('sleep');
    setTimeout(() => {
      this.dispatch({ type: 'sleep' });
      setTimeout(() => { fade.classList.remove('on'); this.sleeping = false; }, 600);
    }, 1200);
  }

  toggleBuild() {
    if (this.build) {
      this.build = null;
      this.renderer.setZoomOut(false);
      this.snapCam();
    } else {
      if (this.p.scene !== 'outside' || !this.state.unlocks.build) return;
      this.ctrl.cancel();
      this.ui.close();
      this.build = { item: null, hover: null, cam: { x: this.ctrl.vis.x + 8, y: this.ctrl.vis.y + 8 } };
      const firstHave = Object.keys(this.p.inv).find(id => OBJECTS[id] || ['fence', 'gate', 'path', 'gardenbed'].includes(id));
      this.build.item = this.p.inv.fence ? 'fence' : firstHave || 'fence';
      this.renderer.setZoomOut(true);
    }
    this.ui.showBuild(!!this.build);
    this.ui.refresh();
  }

  buildTap(tx, ty) {
    const b = this.build;
    if (removeCheck(this.state, this.p, tx, ty)) {
      this.dispatch({ type: 'remove', x: tx, y: ty });
      return;
    }
    if (!b.item) { this.sound.play('no'); return; }
    const r = this.dispatch({ type: 'place', item: b.item, x: tx, y: ty });
    if (!r.ok) this.sound.play('no');
  }
  buildHover(tx, ty) {
    if (!this.build) return;
    const rem = !!removeCheck(this.state, this.p, tx, ty);
    this.build.hover = { x: tx, y: ty, remove: rem, ok: rem || (this.build.item && placeCheck(this.state, this.p, this.build.item, tx, ty)) };
  }

  // ---------- ввод ----------
  entityAt(wx, wy) {
    for (const e of this.entities()) {
      if (e.kind === 'kid') continue;
      if (wx >= e.x - 2 && wx <= e.x + 18 && wy >= e.y - 6 && wy <= e.y + 16) return e;
    }
    return null;
  }
  entityAtTile(x, y) {
    return this.entities().find(e => e.kind !== 'kid' && Math.round(e.x / 16) === x && Math.round(e.y / 16) === y) || null;
  }
  tapWorld(wx, wy) {
    this.sound.unlock();
    if (this.sleeping) return;
    const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
    if (this.build) { this.buildTap(tx, ty); this.buildHover(tx, ty); return; }
    if (this.ui.panel) { this.ui.close(); return; }
    const ent = this.entityAt(wx, wy);
    // тап по высокому объекту (дерево, дом) — ищем по спрайту
    let x = tx, y = ty;
    if (!ent) {
      const sc = this.state.scenes[this.p.scene];
      if (!objAt(sc, x, y) || !defOf(objAt(sc, x, y)).solid) {
        for (const dy of [1, 2]) {
          const o = objAt(sc, x, y + dy);
          if (o && (o.type === 'birch' || o.type === 'spruce' || o.type === 'house' || o.type === 'granny_house' || o.type === 'well' || o.type === 'lantern' || o.type === 'stove' || o.type === 'sideboard')) {
            if (!objAt(sc, x, y)) { y = y + dy; break; }
          }
        }
      }
    }
    this.ctrl.tap(x, y, ent);
    this.tapMark = { x: tx, y: ty, t: 0.4 };
  }

  // ---------- NPC ----------
  updateGranny(dt) {
    const gr = this.granny, h = this.state.time / 60;
    gr.visible = h >= 7 && h < 21.5;
    if (!gr.visible) { gr.x = 37 * 16; gr.y = 27 * 16; gr.path = []; return; }
    if (gr.hold > 0) {
      gr.hold -= dt;
      const dx = this.ctrl.vis.x - gr.x, dy = this.ctrl.vis.y - gr.y;
      gr.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      gr.moving = false;
      return;
    }
    if (gr.path.length) {
      const [nx, ny] = gr.path[0];
      const dx = nx * 16 - gr.x, dy = ny * 16 - gr.y, d = Math.hypot(dx, dy), st = 26 * dt;
      gr.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d <= st) { gr.x = nx * 16; gr.y = ny * 16; gr.path.shift(); } else { gr.x += dx / d * st; gr.y += dy / d * st; }
      gr.moving = true; gr.anim += dt;
      return;
    }
    gr.moving = false;
    gr.wait -= dt;
    if (gr.wait <= 0) {
      gr.wait = 3 + Math.random() * 5;
      const [tx, ty] = GRANNY_SPOTS[(Math.random() * GRANNY_SPOTS.length) | 0];
      const path = findPath(this.state.scenes.outside, Math.round(gr.x / 16), Math.round(gr.y / 16), tx, ty);
      if (path) gr.path = path;
    }
  }

  updateCat(dt) {
    const c = this.cat, p = this.p, st = this.state;
    const sc = st.scenes[p.scene];
    c.anim += dt;
    if (c.scene !== p.scene) {
      c.away += dt;
      if (c.away > 1.2) {
        c.scene = p.scene; c.away = 0; c.path = [];
        const at = p.scene === 'home' ? HOME_ENTRY : { x: p.x, y: p.y + 1 };
        c.x = at.x * 16; c.y = at.y * 16;
        if (!walkable(sc, at.x, at.y)) { c.x = p.x * 16; c.y = p.y * 16; }
      }
      return;
    }
    if (c.hold > 0) { c.hold -= dt; c.pose = 'sit'; c.path = []; return; }
    const cx = Math.round(c.x / 16), cy = Math.round(c.y / 16);
    const dist = Math.hypot(cx - p.x, cy - p.y);
    const dark = skyAt(st.time).dark;
    let goal = null, mode = 'follow';
    if (sc.indoor) { goal = [3, 4]; mode = 'sleep'; }
    else if (dark > 0.45 && this.ctrl.idle > 4) { mode = 'sleep'; }
    else if (c.mode === 'fence' && dist < 6) { mode = 'fence'; goal = c.goal; }
    else if (this.ctrl.idle > 7 && dist < 8) {
      // поискать забор поблизости, чтобы посидеть на нём
      let best = null;
      for (let y = p.y - 5; y <= p.y + 5; y++) for (let x = p.x - 5; x <= p.x + 5; x++) {
        const o = objAt(sc, x, y);
        if (o && o.type === 'fence') { const d = Math.hypot(x - p.x, y - p.y); if (d > 1 && (!best || d < best.d)) best = { x, y, d }; }
      }
      if (best) { mode = 'fence'; goal = [best.x, best.y]; }
    }
    if (mode === 'follow' && dist > 2.2) goal = [p.x, p.y];
    c.mode = mode; c.goal = goal;

    c.repath -= dt;
    if (goal && c.repath <= 0) {
      c.repath = 0.7;
      const path = findPath(sc, cx, cy, goal[0], goal[1], { cat: true, allowGoal: true });
      c.path = path || [];
      if (mode === 'follow' && c.path.length) c.path.pop(); // не наступать на хозяина
    }
    if (c.path.length) {
      const [nx, ny] = c.path[0];
      const dx = nx * 16 - c.x, dy = ny * 16 - c.y, d = Math.hypot(dx, dy), sp = (dist > 5 ? 90 : 62) * dt;
      if (Math.abs(dx) > 0.5) c.flip = dx < 0;
      if (d <= sp) { c.x = nx * 16; c.y = ny * 16; c.path.shift(); } else { c.x += dx / d * sp; c.y += dy / d * sp; }
      c.pose = Math.floor(c.anim * 8) % 2 ? 'walk1' : 'walk0';
      return;
    }
    const onGoal = goal && cx === goal[0] && cy === goal[1];
    if (mode === 'sleep' && (onGoal || !goal)) c.pose = 'sleep';
    else if (mode === 'fence' && onGoal) c.pose = 'fence';
    else c.pose = 'sit';
  }

  entities() {
    const p = this.p, list = [];
    const c = this.ctrl;
    list.push({ kind: 'kid', x: c.vis.x, y: c.vis.y, dir: c.dir || p.dir, frame: c.frame(), pose: c.pose, tool: c.tool, phase: c.phase });
    if (p.scene === 'outside' && this.granny.visible) {
      const g = this.granny;
      list.push({ kind: 'granny', x: g.x, y: g.y, dir: g.dir, frame: g.moving ? 1 + (Math.floor(g.anim * 5) % 2) : 0 });
    }
    if (this.cat.scene === p.scene) list.push({ kind: 'cat', x: this.cat.x, y: this.cat.y, pose: this.cat.pose, flip: this.cat.flip });
    return list;
  }

  // ---------- подсветка цели обучения ----------
  computeHighlight() {
    const s = this.state, p = this.p;
    const st = TUTORIAL[s.tutorial.step];
    if (!st || this.ui.dialog.length) return null;
    const tg = st.target;
    if (tg.ui) return null;
    const home = s.scenes.home, out = s.scenes.outside;
    if (p.scene === 'home') {
      if (tg.kind === 'house') { const b = findObj(home, o => o.type === 'bed'); return { scene: 'home', x: b.x, y: b.y, w: 3, h: 2, tall: 18 }; }
      const ex = findObj(home, o => o.type === 'exit');
      return { scene: 'home', x: ex.x, y: ex.y, tall: 10 };
    }
    if (tg.npc) {
      const g = this.granny;
      if (!g.visible) { const h = findObj(out, o => o.type === 'granny_house'); return { scene: 'outside', x: h.x, y: h.y, w: 5, h: 4, tall: 44 }; }
      return { scene: 'outside', x: Math.round(g.x / 16), y: Math.round(g.y / 16), tall: 20 };
    }
    let best = null, bd = 1e9;
    const consider = (x, y, w = 1, h = 1, tall = 14) => {
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bd) { bd = d; best = { scene: 'outside', x, y, w, h, tall }; }
    };
    if (tg.ground) {
      for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) if (out.ground[y * out.w + x] === tg.ground && !objAt(out, x, y)) consider(x, y);
      return best;
    }
    for (const k in out.objects) {
      const o = out.objects[k], d = OBJECTS[o.type] || {};
      if (tg.obj && o.type === tg.obj) consider(o.x, o.y, 1, 1, d.kind === 'tree' ? 34 : 12);
      else if (tg.kind && d.kind === tg.kind && (tg.kind !== 'bush' || o.berries)) consider(o.x, o.y, d.w || 1, d.h || 1, tg.kind === 'house' ? 40 : 12);
      else if (tg.soil && o.type === 'soil' && !o.granny) {
        if (tg.soil === 'empty' && !o.crop) consider(o.x, o.y);
        if (tg.soil === 'dry' && o.crop && !o.watered) consider(o.x, o.y);
      }
    }
    return best;
  }

  // ---------- кадр ----------
  snapCam() {
    const r = this.renderer;
    r.cam.x = this.ctrl.vis.x + 8; r.cam.y = this.ctrl.vis.y + 8;
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const s = this.state;
    this.paused = !!this.ui.panel || this.sleeping;

    this.input.update(dt);
    if (!this.paused) {
      const ev = tick(s, dt * MIN_PER_SEC);
      for (const e of ev) {
        if (e.t === 'vanArrive') { this.sound.play('horn'); this.ui.toast(`${imgHTML('van')} Автолавка приехала!`); }
        if (e.t === 'tooLate') this.sleep();
      }
      this.ctrl.update(dt);
      this.updateGranny(dt);
      this.updateCat(dt);
    }
    this.ui.tick(dt);
    this.fx.update(dt);
    if (this.shake) { this.shake.t -= dt; if (this.shake.t <= 0) this.shake = null; }

    // камера
    const r = this.renderer;
    const tx = this.build ? this.build.cam.x : this.ctrl.vis.x + 8;
    const ty = this.build ? this.build.cam.y : this.ctrl.vis.y + 8;
    const k = this.build ? 1 : Math.min(1, dt * 6);
    r.cam.x += (tx - r.cam.x) * k; r.cam.y += (ty - r.cam.y) * k;

    const sc = s.scenes[this.p.scene];
    const sky = skyAt(s.time);
    this.fx.updateCritters(dt, { cx: r.cam.x, cy: r.cam.y, w: r.buf.width, h: r.buf.height }, sky.dark > 0.35, !!sc.indoor);
    this.sound.setMood(sky.dark > 0.35);
    this.sound.ambient(dt, sky.hour, !!sc.indoor, s.day);

    this.hlT -= dt;
    if (this.hlT <= 0) { this.hlT = 0.4; this.highlight = this.computeHighlight(); this.ui.refresh(); }

    r.render({
      state: s, scene: sc, ents: this.entities(), t: this.t, dt,
      highlight: this.build ? null : this.highlight,
      build: this.build, shake: this.shake, radioOn: this.sound.musicOn,
    });

    this.saveT += dt;
    if (this.saveT > 20 && this.dirty) { this.save(); }
    requestAnimationFrame(t => this.frame(t));
  }

  save() { this.saveT = 0; this.dirty = false; saveLocal(this.state); }

  loadState(st) {
    this.state = st;
    this.ui.close();
    if (this.build) this.toggleBuild();
    this.ctrl.syncVis();
    this.initNPC();
    this.renderer.ground.clear();
    this.snapCam();
    this.save();
    this.ui.refresh(true);
    this.ui.toast('Загружено!');
  }
  newGame() { this.loadState(newGame()); }
}
