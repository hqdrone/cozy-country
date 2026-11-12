// Звук и музыка на Web Audio API — всё синтезируется, без файлов.
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// До мажор: ступени для мелодии (MIDI), аккорды для вальса
const CHORDS = {
  C: [48, 52, 55], F: [53, 57, 60], G: [55, 59, 62], Am: [57, 60, 64], Dm: [50, 53, 57], E: [52, 56, 59],
};
const PROGS = [
  ['C', 'F', 'G', 'C'], ['C', 'Am', 'Dm', 'G'], ['Am', 'Dm', 'E', 'Am'], ['F', 'G', 'C', 'C'], ['C', 'E', 'Am', 'G'],
];
const SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
const RHYTHMS = [[2, 1], [1, 1, 1], [3], [1, 2], [1, 1, 1], [2, 1]];

export class Sound {
  constructor() {
    this.ctx = null;
    const pref = JSON.parse(localStorage.getItem('hutor-audio') || '{"music":true,"sfx":true}');
    this.musicOn = pref.music; this.sfxOn = pref.sfx;
    this.nextBar = 0; this.bar = 0; this.prog = PROGS[0]; this.lastNote = 64;
    this.night = false; this.indoor = false;
    this.ambT = 0; this.lastRoosterDay = -1;
  }
  savePref() { localStorage.setItem('hutor-audio', JSON.stringify({ music: this.musicOn, sfx: this.sfxOn })); }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);
    this.mus = ctx.createGain(); this.mus.gain.value = this.musicOn ? 0.5 : 0; this.mus.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxOn ? 0.8 : 0; this.sfx.connect(this.master);
    this.amb = ctx.createGain(); this.amb.gain.value = this.sfxOn ? 0.5 : 0; this.amb.connect(this.master);
    // общий фильтр «из дома»
    this.muffle = ctx.createBiquadFilter(); this.muffle.type = 'lowpass'; this.muffle.frequency.value = 20000;
    this.muffle.connect(this.amb);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.nextBar = ctx.currentTime + 0.3;
    this.timer = setInterval(() => this.schedule(), 120);
  }

  setMusic(on) { this.musicOn = on; this.savePref(); if (this.mus) this.mus.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.3); }
  setSfx(on) {
    this.sfxOn = on; this.savePref();
    if (this.sfx) { this.sfx.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.1); this.amb.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.1); }
  }

  // ---------- базовые «инструменты» ----------
  env(g, t, a, peak, dur, rel = 0.08) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  osc(type, f, t, dur, vol, out, f2) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    this.env(g, t, 0.005, vol, dur, dur * 0.6);
    o.connect(g); g.connect(out || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  nz(t, dur, vol, type, f, q = 1, out, f2) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true;
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    this.env(g, t, 0.005, vol, dur, dur * 0.7);
    s.connect(fl); fl.connect(g); g.connect(out || this.sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // ---------- звуковые эффекты ----------
  play(name) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'chop': this.nz(t, 0.09, 0.5, 'bandpass', 900, 2); this.osc('sine', 160, t, 0.12, 0.4, null, 70); break;
      case 'mine': this.osc('square', 1400, t, 0.05, 0.12, null, 900); this.nz(t, 0.06, 0.3, 'highpass', 2500); this.osc('triangle', 2200, t + 0.01, 0.15, 0.08); break;
      case 'fell': this.nz(t, 0.6, 0.45, 'lowpass', 900, 1, null, 120); this.osc('sine', 90, t + 0.15, 0.3, 0.4, null, 50); break;
      case 'break': this.nz(t, 0.3, 0.4, 'lowpass', 2000, 1, null, 300); this.osc('square', 300, t, 0.08, 0.1, null, 120); break;
      case 'pick': this.osc('sine', 500, t, 0.08, 0.3, null, 900); this.nz(t, 0.12, 0.15, 'bandpass', 3000, 1); break;
      case 'dig': this.nz(t, 0.18, 0.5, 'lowpass', 600, 1, null, 200); break;
      case 'water': this.nz(t, 0.5, 0.25, 'bandpass', 2500, 1.5, null, 800); break;
      case 'refill': this.nz(t, 0.35, 0.3, 'bandpass', 600, 2, null, 1500); this.osc('sine', 300, t, 0.2, 0.1, null, 600); break;
      case 'plant': this.osc('sine', 300, t, 0.08, 0.25, null, 500); this.nz(t, 0.08, 0.15, 'lowpass', 800); break;
      case 'harvest': this.osc('sine', 600, t, 0.07, 0.3, null, 1000); this.osc('triangle', 1200, t + 0.07, 0.12, 0.15, null, 1600); break;
      case 'coin': this.osc('sine', 1320, t, 0.08, 0.2); this.osc('sine', 1760, t + 0.08, 0.2, 0.2); break;
      case 'craft': [523, 659, 784].forEach((f, i) => this.osc('triangle', f, t + i * 0.08, 0.15, 0.2)); break;
      case 'place': this.osc('sine', 240, t, 0.12, 0.4, null, 110); this.nz(t, 0.06, 0.2, 'lowpass', 1200); break;
      case 'remove': this.osc('sine', 300, t, 0.12, 0.3, null, 700); break;
      case 'pop': this.osc('sine', 520, t, 0.06, 0.25, null, 820); break;
      case 'open': this.osc('triangle', 440, t, 0.08, 0.2, null, 660); break;
      case 'close': this.osc('triangle', 660, t, 0.08, 0.2, null, 440); break;
      case 'no': this.osc('sine', 260, t, 0.1, 0.2, null, 200); this.osc('sine', 200, t + 0.1, 0.12, 0.18); break;
      case 'door': this.osc('sine', 120, t, 0.15, 0.4, null, 80); this.nz(t, 0.1, 0.2, 'lowpass', 500); break;
      case 'gate': {
        const o = this.osc('sawtooth', 320, t, 0.5, 0.05, null, 260);
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        lfo.frequency.value = 18; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.6);
        break;
      }
      case 'meow': {
        const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(950, t + 0.15); o.frequency.linearRampToValueAtTime(550, t + 0.45);
        f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1800, t + 0.2); f.Q.value = 3;
        this.env(g, t, 0.04, 0.25, 0.5, 0.2); o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.55);
        break;
      }
      case 'purr': for (let i = 0; i < 8; i++) this.nz(t + i * 0.09, 0.07, 0.25, 'lowpass', 220); break;
      case 'sleep': [784, 659, 523, 392].forEach((f, i) => this.osc('sine', f, t + i * 0.25, 0.4, 0.15)); break;
      case 'morning': [523, 659, 784, 1046].forEach((f, i) => this.osc('triangle', f, t + i * 0.12, 0.25, 0.15)); break;
      case 'horn': this.osc('square', 440, t, 0.25, 0.06); this.osc('square', 370, t + 0.3, 0.3, 0.06); break;
      case 'quest': [659, 784, 988, 1318].forEach((f, i) => this.osc('triangle', f, t + i * 0.1, 0.2, 0.15)); break;
      case 'rooster': this.rooster(t); break;
      case 'tea': this.nz(t, 0.8, 0.12, 'bandpass', 3000, 3, null, 1500); break;
      case 'fanfare': [[523, 0], [659, 0.15], [784, 0.3], [1046, 0.45], [784, 0.7], [1046, 0.85]].forEach(([f, d]) => { this.osc('square', f, t + d, 0.22, 0.06); this.osc('triangle', f / 2, t + d, 0.25, 0.12); }); break;
    }
  }

  rooster(t) {
    const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth';
    const seq = [[620, 0], [700, 0.14], [820, 0.28], [900, 0.45], [960, 0.75], [700, 1.2]];
    for (const [fr, at] of seq) o.frequency.linearRampToValueAtTime(fr, t + at);
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.03); g.gain.setValueAtTime(0.12, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.14); g.gain.exponentialRampToValueAtTime(0.12, t + 0.17);
    g.gain.setValueAtTime(0.12, t + 0.26); g.gain.exponentialRampToValueAtTime(0.03, t + 0.29); g.gain.exponentialRampToValueAtTime(0.14, t + 0.33);
    g.gain.setValueAtTime(0.14, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o.connect(f); f.connect(g); g.connect(this.muffle);
    o.start(t); o.stop(t + 1.35);
  }

  // ---------- фоновые звуки природы ----------
  ambient(dt, hour, indoor, day) {
    if (!this.ctx || !this.sfxOn) return;
    this.indoor = indoor;
    this.muffle.frequency.setTargetAtTime(indoor ? 700 : 20000, this.ctx.currentTime, 0.2);
    if (hour >= 6 && hour < 6.6 && this.lastRoosterDay !== day) { this.lastRoosterDay = day; this.rooster(this.ctx.currentTime + 0.5); }
    this.ambT -= dt;
    if (this.ambT > 0) return;
    const t = this.ctx.currentTime + 0.02;
    const out = this.muffle;
    const night = hour >= 21.5 || hour < 5;
    if (indoor && Math.random() < 0.5) {
      // треск печки
      for (let i = 0; i < 3; i++) this.nz(t + Math.random() * 0.3, 0.02, 0.12 + Math.random() * 0.1, 'highpass', 2500, 1, this.amb);
    }
    if (!night && hour >= 5.5 && hour < 20) {
      // птички
      if (Math.random() < 0.7) {
        const base = 2600 + Math.random() * 1800, n = 2 + (Math.random() * 4 | 0);
        for (let i = 0; i < n; i++) this.osc('sine', base * (1 + (Math.random() - 0.5) * 0.3), t + i * 0.11, 0.07, 0.05, out, base * (1.1 + Math.random() * 0.3));
      }
      if (Math.random() < 0.04) this.moo(t + 0.5);
      this.ambT = 1.5 + Math.random() * 3;
    } else if (night || hour >= 20) {
      // сверчки
      const f = 4200 + Math.random() * 400;
      for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) this.osc('sine', f, t + k * 0.35 + i * 0.045, 0.03, 0.03, out);
      if (hour >= 19.5 && hour < 23 && Math.random() < 0.08) this.mosquito(t + 0.2);
      this.ambT = 0.8 + Math.random() * 0.8;
    } else this.ambT = 2;
  }
  moo(t) {
    const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(115, t); o.frequency.linearRampToValueAtTime(135, t + 0.4); o.frequency.linearRampToValueAtTime(100, t + 1.3);
    f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(900, t + 0.5); f.frequency.linearRampToValueAtTime(350, t + 1.3);
    this.env(g, t, 0.15, 0.07, 1.4, 0.4); o.connect(f); f.connect(g); g.connect(this.muffle); o.start(t); o.stop(t + 1.5);
  }
  mosquito(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(560, t); o.frequency.linearRampToValueAtTime(620, t + 0.8); o.frequency.linearRampToValueAtTime(540, t + 1.6);
    this.env(g, t, 0.4, 0.008, 1.8, 0.6);
    o.connect(g);
    if (p) { p.pan.setValueAtTime(-0.8, t); p.pan.linearRampToValueAtTime(0.8, t + 1.8); g.connect(p); p.connect(this.muffle); } else g.connect(this.muffle);
    o.start(t); o.stop(t + 1.9);
  }

  // ---------- музыка ----------
  setMood(night) { this.night = night; }
  setParty(on) { this.party = on; }
  schedule() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.nextBar < now) this.nextBar = now + 0.05;
    while (this.nextBar < now + 0.5) { this.playBar(this.nextBar); }
  }
  playBar(t) {
    const party = this.party, night = this.night && !party;
    const beat = party ? 0.4 : night ? 0.78 : 0.6;
    if (this.bar % 16 === 0) this.prog = PROGS[(Math.random() * PROGS.length) | 0];
    const chordName = this.prog[(this.bar >> 2) % 4];
    const ch = CHORDS[chordName];
    const out = this.mus;
    if (this.musicOn) {
      // пауза-вздох каждые 32 такта
      const rest = this.bar % 32 >= 30;
      if (!night) {
        // «ум-па-па»: бас и аккорд
        this.osc('triangle', NOTE(ch[0] - 12), t, beat * 0.9, 0.16, out);
        for (const b of [1, 2]) for (const n of ch) this.osc('triangle', NOTE(n), t + b * beat, beat * 0.4, 0.035, out);
      } else {
        this.osc('sine', NOTE(ch[0] - 12), t, beat * 2.5, 0.1, out);
      }
      if (!rest) {
        const rh = RHYTHMS[(Math.random() * RHYTHMS.length) | 0];
        let pos = 0;
        for (const len of rh) {
          const n = this.pickNote(ch, pos === 0);
          if (night) this.musicBox(n + 12, t + pos * beat, len * beat);
          else this.accordion(n, t + pos * beat, len * beat * 0.95);
          pos += len;
        }
      }
    }
    this.bar++;
    this.nextBar = t + beat * 3;
  }
  pickNote(ch, strong) {
    const chordTones = SCALE.filter(n => ch.some(c => (n - c) % 12 === 0));
    const pool = strong || Math.random() < 0.6 ? chordTones : SCALE;
    const near = pool.filter(n => Math.abs(n - this.lastNote) <= 5);
    const arr = near.length ? near : pool;
    const n = arr[(Math.random() * arr.length) | 0];
    this.lastNote = n;
    return n;
  }
  accordion(n, t, dur) {
    const c = this.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 1700; f.Q.value = 0.7;
    this.env(g, t, 0.04, 0.05, dur, Math.min(0.15, dur * 0.4));
    f.connect(g); g.connect(this.mus);
    for (const det of [-6, 6]) {
      const o = c.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 5.2; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.detune);
      o.connect(f); o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    }
  }
  musicBox(n, t, dur) {
    this.osc('sine', NOTE(n), t, Math.max(0.6, dur), 0.07, this.mus);
    this.osc('sine', NOTE(n + 12), t, 0.3, 0.02, this.mus);
  }
}
