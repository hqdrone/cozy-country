// Ввод: касания и мышь (тап = действие), перетаскивание в режиме стройки, клавиатура.
export class Input {
  constructor(game, canvas) {
    this.game = game;
    this.cv = canvas;
    this.keys = new Set();
    this.down = null;
    this.stepT = 0;
    canvas.addEventListener('pointerdown', e => this.onDown(e));
    canvas.addEventListener('pointermove', e => this.onMove(e));
    canvas.addEventListener('pointerup', e => this.onUp(e));
    canvas.addEventListener('pointercancel', () => { this.down = null; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => this.onKey(e, true));
    window.addEventListener('keyup', e => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
  }

  onDown(e) {
    this.game.sound.unlock();
    this.cv.setPointerCapture && this.cv.setPointerCapture(e.pointerId);
    this.down = { x: e.clientX, y: e.clientY, moved: false, cam: this.game.build ? { ...this.game.build.cam } : null };
  }
  onMove(e) {
    const g = this.game;
    if (g.build) {
      const w = g.renderer.screenToWorld(e.clientX, e.clientY);
      g.buildHover(Math.floor(w.x / 16), Math.floor(w.y / 16));
    }
    if (!this.down) return;
    const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
    if (Math.hypot(dx, dy) > 10) this.down.moved = true;
    if (g.build && this.down.moved) {
      const k = g.renderer.dpr / g.renderer.scale;
      g.build.cam.x = this.down.cam.x - dx * k;
      g.build.cam.y = this.down.cam.y - dy * k;
      const sc = g.state.scenes[g.p.scene];
      g.build.cam.x = Math.max(0, Math.min(sc.w * 16, g.build.cam.x));
      g.build.cam.y = Math.max(0, Math.min(sc.h * 16, g.build.cam.y));
    }
  }
  onUp(e) {
    if (!this.down) return;
    const d = this.down;
    this.down = null;
    if (d.moved) return;
    const w = this.game.renderer.screenToWorld(e.clientX, e.clientY);
    this.game.tapWorld(w.x, w.y);
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
