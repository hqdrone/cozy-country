// Частицы и мелкие анимации: щепки, дым, капли, сердечки, бабочки, светлячки, следы.
import { C, R, P } from './pixel.js';
import { icon } from './icons.js';

export class Effects {
  constructor() {
    this.parts = [];   // частицы в мировых координатах (пиксели)
    this.texts = [];   // всплывающие «+3» (рисуются поверх, чётким шрифтом)
    this.prints = [];  // следы
    this.critters = []; // бабочки, светлячки
  }
  clear() { this.parts = []; this.texts = []; this.prints = []; this.critters = []; }

  add(p) { p.life = p.life || 1; p.t = 0; this.parts.push(p); return p; }

  burst(x, y, colors, n = 8, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opts.speed || 40) * (0.4 + Math.random());
      this.add({ kind: 'chip', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 40), g: opts.g ?? 160,
        col: colors[i % colors.length], life: 0.5 + Math.random() * 0.4, size: opts.size || 1 });
    }
  }
  smoke(x, y) { this.add({ kind: 'smoke', x, y, vx: 4 + Math.random() * 3, vy: -9 - Math.random() * 4, life: 3.5, r: 1.5 }); }
  hearts(x, y) { for (let i = 0; i < 3; i++) this.add({ kind: 'icon', id: 'heart', x: x + (i - 1) * 5, y: y - i * 3, vx: (i - 1) * 4, vy: -14, life: 1.3, delay: i * 0.15 }); }
  zzz(x, y) { this.add({ kind: 'z', x, y, vx: 3, vy: -6, life: 2.2 }); }
  drops(x, y) { for (let i = 0; i < 6; i++) this.add({ kind: 'chip', x: x + Math.random() * 8 - 4, y: y - 6, vx: Math.random() * 10 - 5, vy: 10 + Math.random() * 10, g: 120, col: i % 2 ? '#7ac0e0' : '#b8e4f4', life: 0.45 }); }
  sparkle(x, y) { for (let i = 0; i < 6; i++) this.add({ kind: 'spark', x: x + Math.random() * 14 - 7, y: y - Math.random() * 14, vx: 0, vy: -8, life: 0.9 + Math.random() * 0.4 }); }
  bubble(x, y, id) { this.add({ kind: 'bubble', id, x, y, vx: 0, vy: 0, life: 1.6 }); }
  text(x, y, str, iconId) { this.texts.push({ x, y, str, icon: iconId, t: 0, life: 1.6 }); }
  footprint(x, y, dark) { this.prints.push({ x, y, t: 0, dark }); if (this.prints.length > 60) this.prints.shift(); }

  update(dt) {
    for (const p of this.parts) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.g) p.vy += p.g * dt;
      if (p.kind === 'smoke') { p.r += dt * 1.6; p.vx += dt * 2; }
    }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const t of this.texts) t.t += dt;
    this.texts = this.texts.filter(t => t.t < t.life);
    for (const f of this.prints) f.t += dt;
    this.prints = this.prints.filter(f => f.t < 7);
  }

  drawPrints(g, ox, oy) {
    for (const f of this.prints) {
      const a = Math.max(0, 1 - f.t / 7) * (f.dark ? 0.35 : 0.18);
      g.fillStyle = `rgba(60,40,20,${a})`;
      g.fillRect(Math.round(f.x - ox), Math.round(f.y - oy), 2, 1);
    }
  }

  draw(g, ox, oy) {
    for (const p of this.parts) {
      if (p.delay > 0) continue;
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
      const k = 1 - p.t / p.life;
      switch (p.kind) {
        case 'chip': R(g, x, y, p.size, p.size, p.col); break;
        case 'smoke': {
          g.fillStyle = `rgba(225,225,225,${0.45 * k})`;
          const r = Math.round(p.r);
          g.fillRect(x - r, y - r, r * 2, r * 2);
          break;
        }
        case 'icon': g.globalAlpha = Math.min(1, k * 2); g.drawImage(icon(p.id), x - 4, y - 4, 8, 8); g.globalAlpha = 1; break;
        case 'z': g.globalAlpha = k; g.fillStyle = '#e8f0ff'; g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x, y + 2, 3, 1); g.globalAlpha = 1; break;
        case 'spark': g.fillStyle = `rgba(255,248,200,${k})`; g.fillRect(x, y, 1, 1); if (k > 0.5) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } break;
        case 'bubble': {
          const bob = Math.round(Math.sin(p.t * 6));
          R(g, x - 7, y - 18 + bob, 14, 13, '#fffaf0'); R(g, x - 8, y - 17 + bob, 16, 11, '#fffaf0');
          R(g, x - 1, y - 5 + bob, 2, 2, '#fffaf0');
          g.drawImage(icon(p.id), x - 6, y - 17 + bob, 12, 12);
          break;
        }
      }
    }
  }

  // Бабочки днём, светлячки ночью — вокруг камеры
  updateCritters(dt, view, night, indoor) {
    const want = indoor ? 0 : night ? 14 : 5;
    const kind = night ? 'firefly' : 'butterfly';
    this.critters = this.critters.filter(c => c.kind === kind && Math.abs(c.x - view.cx) < view.w && Math.abs(c.y - view.cy) < view.h);
    while (this.critters.length < want) {
      this.critters.push({ kind, x: view.cx + (Math.random() - 0.5) * view.w, y: view.cy + (Math.random() - 0.5) * view.h,
        a: Math.random() * 6, sp: 8 + Math.random() * 8, ph: Math.random() * 6,
        col: ['#ffffff', '#f2d24a', '#8ab8f0', '#f0a0c0'][(Math.random() * 4) | 0] });
    }
    for (const c of this.critters) {
      c.a += (Math.random() - 0.5) * dt * 3;
      c.x += Math.cos(c.a) * c.sp * dt; c.y += Math.sin(c.a) * c.sp * dt * 0.7;
      c.ph += dt * (kind === 'firefly' ? 2 : 14);
    }
  }
  drawCritters(g, ox, oy, lightG) {
    for (const c of this.critters) {
      const x = Math.round(c.x - ox), y = Math.round(c.y - oy);
      if (c.kind === 'butterfly') {
        const f = Math.sin(c.ph) > 0;
        P(g, x, y - 6, '#3a2a22');
        if (f) { P(g, x - 1, y - 7, c.col); P(g, x + 1, y - 7, c.col); P(g, x - 1, y - 6, c.col); P(g, x + 1, y - 6, c.col); }
        else { P(g, x - 1, y - 6, c.col); P(g, x + 1, y - 6, c.col); }
      } else {
        const a = 0.5 + 0.5 * Math.sin(c.ph);
        g.fillStyle = `rgba(230,255,140,${0.4 + a * 0.6})`;
        g.fillRect(x, y - 6, 1, 1);
      }
    }
  }
}
