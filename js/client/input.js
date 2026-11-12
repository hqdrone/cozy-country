// Ввод: касания и мышь (тап = действие), перетаскивание в режиме стройки, клавиатура.
export class Input {
  constructor(game, canvas) {
    this.game = game;
    this.cv = canvas;
    this.keys = new Set();
    this.down = null;
    this.stepT = 0;
    this.pts = new Map();   // активные касания (для щипка)
    this.pinch = null;
    this.wheelAcc = 0;
    canvas.addEventListener('pointerdown', e => this.onDown(e));
    canvas.addEventListener('pointermove', e => this.onMove(e));
    canvas.addEventListener('pointerup', e => this.onUp(e));
    canvas.addEventListener('pointercancel', e => { this.pts.delete(e.pointerId); this.down = null; this.pinch = null; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    // Safari: свой жест масштаба страницы — отключаем, зумим игру сами
    for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault());
    window.addEventListener('keydown', e => this.onKey(e, true));
    window.addEventListener('keyup', e => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
  }

  zoom(d) {
    const g = this.game;
    if (g.renderer.zoomStep(d)) { if (!g.build) g.snapCam(); g.sound.play('pop'); }
  }

  onDown(e) {
    this.game.sound.unlock();
    try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* не критично */ }
    this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pts.size === 2) {
      // второй палец — начинаем щипок, тап отменяется
      const [a, b] = [...this.pts.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
      this.down = null;
      return;
    }
    if (this.pts.size > 2) return;
    this.down = { x: e.clientX, y: e.clientY, moved: false, cam: this.game.build ? { ...this.game.build.cam } : null };
  }
  onMove(e) {
    const g = this.game;
    if (this.pts.has(e.pointerId)) this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.pts.size >= 2) {
      const [a, b] = [...this.pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      // шаг масштаба, когда пальцы разошлись/сошлись заметно
      const step = 1 + 0.6 / Math.max(1, g.renderer.scale * 0.5);
      if (d > this.pinch.d * step) { this.zoom(1); this.pinch.d = d; }
      else if (d < this.pinch.d / step) { this.zoom(-1); this.pinch.d = d; }
      return;
    }
    if (g.build && e.pointerType === 'mouse') {
      const w = g.renderer.screenToWorld(e.clientX, e.clientY);
      g.buildHover(Math.floor(w.x / 16), Math.floor(w.y / 16));
    }
    if (!this.down) return;
    const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
    if (Math.hypot(dx, dy) > 12) this.down.moved = true;
    if (g.build && this.down.moved) {
      const k = g.renderer.worldPerCss();
      g.build.cam.x = this.down.cam.x - dx * k;
      g.build.cam.y = this.down.cam.y - dy * k;
      const sc = g.state.scenes[g.p.scene];
      g.build.cam.x = Math.max(0, Math.min(sc.w * 16, g.build.cam.x));
      g.build.cam.y = Math.max(0, Math.min(sc.h * 16, g.build.cam.y));
    }
  }
  onUp(e) {
    this.pts.delete(e.pointerId);
    if (this.pinch) { if (this.pts.size < 2) this.pinch = null; this.down = null; return; }
    if (!this.down) return;
    const d = this.down;
    this.down = null;
    if (d.moved) return;
    const w = this.game.renderer.screenToWorld(e.clientX, e.clientY);
    this.game.tapWorld(w.x, w.y);
  }
  onWheel(e) {
    e.preventDefault();
    // колесо мыши и щипок на тачпаде (ctrlKey) — масштаб
    this.wheelAcc += e.deltaY * (e.ctrlKey ? 3 : 1);
    if (this.wheelAcc > 60) { this.zoom(-1); this.wheelAcc = 0; }
    else if (this.wheelAcc < -60) { this.zoom(1); this.wheelAcc = 0; }
  }

  onKey(e, isDown) {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    const k = e.key.toLowerCase();
    const code = e.code;
    const g = this.game;
    if (isDown) {
      g.sound.unlock();
      if (code === 'KeyE' || code === 'Space' || code === 'Enter') { e.preventDefault(); if (!g.ui.panel && !g.build) g.ctrl.actFront(); return; }
      if (code === 'KeyI') { g.ui.panel === 'bag' ? g.ui.close() : (!g.build && g.ui.openBag()); return; }
      if (code === 'KeyB') { g.ui.close(); g.toggleBuild(); return; }
      if (code === 'Escape') { if (g.ui.panel) g.ui.close(); else if (g.build) g.toggleBuild(); return; }
      if (code === 'KeyM') { g.sound.setMusic(!g.sound.musicOn); return; }
      if (k === '+' || k === '=' || code === 'NumpadAdd') { this.zoom(1); return; }
      if (k === '-' || k === '_' || code === 'NumpadSubtract') { this.zoom(-1); return; }
    }
    const dirKey = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' }[code];
    if (dirKey) {
      e.preventDefault();
      if (isDown) this.keys.add(dirKey); else this.keys.delete(dirKey);
    }
  }

  update(dt) {
    const g = this.game;
    if (!this.keys.size) return;
    let dx = 0, dy = 0;
    if (this.keys.has('l')) dx--; if (this.keys.has('r')) dx++;
    if (this.keys.has('u')) dy--; if (this.keys.has('d')) dy++;
    if (!dx && !dy) return;
    if (g.build) {
      g.build.cam.x += dx * 160 * dt; g.build.cam.y += dy * 160 * dt;
      return;
    }
    if (g.ui.panel) return;
    // клавиши прерывают текущий поход
    const job = g.ctrl.job;
    if (job && job.steps[job.i] && job.steps[job.i].t === 'walk' && job.steps.length > 1) g.ctrl.cancel();
    if (!g.ctrl.busy()) g.ctrl.stepDir(dx, dy);
  }
}
