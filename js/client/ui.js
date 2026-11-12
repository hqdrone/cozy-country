// Интерфейс поверх холста: минимум на экране, всё остальное — во всплывающих панелях.
import { ITEMS, itemName } from '../config/items.js';
import { RECIPES, TOOLS } from '../config/recipes.js';
import { BUILDABLE } from '../config/objects.js';
import { TUTORIAL, SHOP, STAGES, stageProgress } from '../config/story.js';
import { recipeVisible, canAutoCraft, canCapacity, shopOpen } from '../core/actions.js';
import { hasItems } from '../core/world.js';
import { clockText } from '../core/sim.js';
import { iconURL, imgHTML } from '../render/icons.js';
import { skyAt } from '../render/renderer.js';
import { toCode, fromCode, serialize } from '../core/save.js';

const $ = id => document.getElementById(id);
const ORDER = { crop: 0, food: 1, res: 2, seed: 3, place: 4 };

export class UI {
  constructor(game) {
    this.game = game;
    this.panel = null;      // что сейчас открыто
    this.dialog = [];       // реплики бабушки
    this.dialogT = 0;
    this.lastKey = '';
    $('coin-ico').src = iconURL('coin');
    $('btn-bag').innerHTML = imgHTML('backpack');
    $('btn-build').innerHTML = imgHTML('build');
    $('btn-gear').innerHTML = imgHTML('gear');
    $('stage-ico').src = iconURL('house');
    this.bindButtons();
    this.refresh(true);
  }

  get s() { return this.game.state; }
  get p() { return this.game.state.players[this.game.pid]; }

  bindButtons() {
    const g = this.game;
    const press = (el, fn) => el.addEventListener('click', e => { e.stopPropagation(); g.sound.unlock(); g.sound.play('pop'); fn(); });
    press($('btn-bag'), () => (this.panel === 'bag' ? this.close() : this.openBag()));
    press($('btn-build'), () => g.toggleBuild());
    press($('btn-gear'), () => this.openSettings());
    press($('btn-stage'), () => this.openStage());
    press($('hint'), () => this.nextLine());
    $('panel-wrap').addEventListener('click', e => { if (e.target.id === 'panel-wrap') this.close(); });
    $('panel').addEventListener('click', e => this.onPanelClick(e));
    $('buildbar').addEventListener('click', e => this.onBuildClick(e));
  }

  // ---------- HUD ----------
  refresh(force) {
    const s = this.s, p = this.p;
    $('coins').textContent = p.coins;
    const sky = skyAt(s.time);
    const icoKey = sky.dark > 0.3 ? 'moon' : 'sun';
    if (this._ico !== icoKey) { $('sun-ico').src = iconURL(icoKey); this._ico = icoKey; }
    $('clock').textContent = clockText(s.time);
    $('day').textContent = 'День ' + s.day;
    $('btn-bag').classList.toggle('hidden', !s.unlocks.backpack && s.tutorial.step < 3);
    $('btn-build').classList.toggle('hidden', !s.unlocks.build || p.scene !== 'outside');
    const prog = stageProgress(s);
    $('stage-bar').style.width = Math.round(prog * 100) + '%';
    $('stage-name').textContent = STAGES[s.stage || 0].name;
    // подсказка обучения
    this.updateHint();
    if (this.panel === 'bag' || this.panel === 'container' || this.panel === 'shop' || this.panel === 'stove') {
      const k = JSON.stringify(p.inv) + p.coins + JSON.stringify(p.tools) + (this.container ? JSON.stringify(this.container.items) : '');
      if (k !== this.lastKey || force) { this.lastKey = k; this['render_' + this.panel](); }
    }
    if (this.game.build) this.renderBuildbar();
  }

  pulse(target) {
    $('btn-bag').classList.toggle('pulse', target === 'backpack' && this.panel !== 'bag');
    $('btn-build').classList.toggle('pulse', target === 'build' && !this.game.build);
  }

  updateHint() {
    const h = $('hint');
    if (this.dialog.length) return;
    const s = this.s;
    const st = TUTORIAL[s.tutorial.step];
    if (!st || this.game.build) { h.classList.add('hidden'); this.pulse(null); return; }
    const html = `${imgHTML('granny', 'face')}<span>${st.say}</span>${imgHTML(st.icon)}`;
    if (h.dataset.html !== html) { h.innerHTML = html; h.dataset.html = html; h.classList.remove('hidden'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
    h.classList.remove('hidden');
    this.pulse(st.target.ui);
  }

  // Реплики бабушки: показываем по очереди
  say(lines) {
    this.dialog = lines.slice();
    this.showLine();
  }
  showLine() {
    const h = $('hint');
    const l = this.dialog[0];
    if (!l) { h.dataset.html = ''; this.updateHint(); return; }
    let extra = '';
    if (l.need) extra = Object.entries(l.need).map(([id, n]) => `<span class="need ${(this.p.inv[id] || 0) >= n ? 'ok' : ''}">${imgHTML(id)}<b>${Math.min(this.p.inv[id] || 0, n)}/${n}</b></span>`).join('');
    else if (l.icon) extra = imgHTML(l.icon);
    h.innerHTML = `${imgHTML('granny', 'face')}<span>${l.text}</span>${extra}`;
    h.dataset.html = '';
    h.classList.remove('hidden'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
    this.dialogT = l.need ? 5 : 3;
  }
  nextLine() { if (this.dialog.length) { this.dialog.shift(); this.showLine(); } }
  tick(dt) {
    if (this.dialog.length) { this.dialogT -= dt; if (this.dialogT <= 0) this.nextLine(); }
  }

  toast(html, time = 2.2) {
    const t = $('toast');
    t.innerHTML = html;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('show'), time * 1000);
  }

  morning(f) {
    let html = `<div class="big">${imgHTML('sun')} День ${f.day}</div>`;
    if (f.coins) html += `<div>${Object.entries(f.sold).map(([id, n]) => imgHTML(id) + '<b>' + n + '</b>').join(' ')}</div><div class="big">+${f.coins} ${imgHTML('coin')}</div>`;
    if (f.shop) html += `<div>${imgHTML('van')} Сегодня приедет автолавка!</div>`;
    this.toast(html, 4);
  }

  // ---------- панели ----------
  open(name, cls = '') {
    this.panel = name;
    $('panel').className = cls;
    $('panel-wrap').classList.remove('hidden');
    this.game.sound.play('open');
    this.lastKey = '';
    this['render_' + name] && this['render_' + name]();
    this.pulse(null);
  }
  close() {
    if (!this.panel) return;
    this.panel = null; this.container = null; this.seedCb = null;
    $('panel-wrap').classList.add('hidden');
    this.game.sound.play('close');
  }
  head(icon, title, extra = '') {
    return `<header>${imgHTML(icon)}<h2>${title}</h2>${extra}<button class="x" data-close>${imgHTML('close')}</button></header>`;
  }

  // Рюкзак: вещи + что можно сделать
  openBag() { this.open('bag'); }
  render_bag() {
    const p = this.p, s = this.s;
    const tools = Object.keys(TOOLS).map(t => {
      const lvl = p.tools[t] || 1;
      const sub = t === 'can' ? `<small>${p.water}/${canCapacity(p)}</small>` : `<small>${'★'.repeat(lvl)}</small>`;
      return `<div class="tool" title="${TOOLS[t].name}">${imgHTML(t)}${sub}</div>`;
    }).join('');
    const items = this.sortedInv();
    const grid = items.length ? items.map(([id, n]) => `<button class="cell ${p.seed === id ? 'sel' : ''}" data-item="${id}">${imgHTML(id)}<b>${n}</b></button>`).join('')
      : `<div class="empty">${imgHTML('backpack')}</div>`;
    const recs = RECIPES.filter(r => !r.where && recipeVisible(s, p, r));
    $('panel').innerHTML = this.head('backpack', 'Рюкзак') +
      `<div class="tools">${tools}</div><div class="iname" id="iname">&nbsp;</div><div class="grid">${grid}</div>` +
      (recs.length ? `<h3>${imgHTML('build')} Сделать</h3><div class="recipes">${recs.map(r => this.recipeCard(r)).join('')}</div>` : '');
  }
  sortedInv() {
    return Object.entries(this.p.inv).filter(([, n]) => n > 0)
      .sort((a, b) => (ORDER[ITEMS[a[0]]?.cat] ?? 9) - (ORDER[ITEMS[b[0]]?.cat] ?? 9));
  }
  recipeCard(r) {
    const p = this.p;
    const ok = hasItems(p, r.in);
    const outId = r.tool ? r.tool[0] : Object.keys(r.out)[0];
    const outN = r.out ? r.out[outId] : 0;
    const name = r.tool ? (r.tool[1] > 1 ? 'Каменн. ' : '') + TOOLS[r.tool[0]].name.toLowerCase() : itemName(outId);
    const ins = Object.entries(r.in).map(([id, n]) => `<span class="${(p.inv[id] || 0) >= n ? 'have' : 'miss'}">${imgHTML(id)}<b>${n}</b></span>`).join('');
    return `<button class="rc ${ok ? 'ok' : 'no'}" data-recipe="${r.id}">
      <div class="out">${imgHTML(outId, 'ico big')}${r.tool ? '<i class="up">▲</i>' : ''}${outN > 1 ? `<i>×${outN}</i>` : ''}</div>
      <div class="nm">${name}</div><div class="ins">${ins}</div>${ok ? '<span class="do">Сделать</span>' : ''}</button>`;
  }

  // Печка: варенье и соленья
  openStove() { this.open('stove'); }
  render_stove() {
    const recs = RECIPES.filter(r => r.where === 'stove' && recipeVisible(this.s, this.p, r));
    $('panel').innerHTML = this.head('jam_raspberry', 'Печка') +
      (recs.length ? `<div class="recipes">${recs.map(r => this.recipeCard(r)).join('')}</div>` : `<div class="empty">${imgHTML('granny', 'face')} …</div>`);
  }

  // Ящик у калитки и сундук
  openContainer(o) { this.container = o; this.open('container'); }
  render_container() {
    const o = this.container, p = this.p;
    const isBox = o.type === 'sellbox';
    const inside = Object.entries(o.items || {});
    let sum = 0;
    for (const [id, n] of inside) sum += (ITEMS[id]?.price || 1) * n;
    const cell = (id, n, dir) => `<div class="cellw"><button class="cell" data-move="${dir}" data-item="${id}">${imgHTML(id)}<b>${n}</b></button>${n > 1 ? `<button class="all" data-move="${dir}" data-all="1" data-item="${id}">все</button>` : ''}</div>`;
    const inv = this.sortedInv().filter(([id]) => !isBox || ITEMS[id]?.cat !== 'seed');
    $('panel').innerHTML = this.head(isBox ? 'sellbox' : 'chest', isBox ? 'Ящик' : 'Сундук', isBox && sum ? `<span class="sum">+${sum} ${imgHTML('coin')}</span>` : '') +
      (isBox ? `<div class="note">${imgHTML('moon')} → ${imgHTML('coin')}</div>` : '') +
      `<div class="grid box">${inside.length ? inside.map(([id, n]) => cell(id, n, 'out')).join('') : `<div class="empty">${imgHTML(isBox ? 'sellbox' : 'chest')}</div>`}</div>` +
      `<h3>${imgHTML('backpack')} Рюкзак</h3><div class="grid">${inv.map(([id, n]) => cell(id, n, 'in')).join('')}</div>`;
  }

  // Автолавка
  openShop() { if (!shopOpen(this.s)) return; this.open('shop'); }
  render_shop() {
    const p = this.p;
    const cards = SHOP.stock.map((e, i) => {
      if (e.tool && (p.tools[e.tool[0]] || 0) >= e.tool[1]) return '';
      const id = e.item || e.tool[0];
      const ok = p.coins >= e.price;
      return `<button class="rc ${ok ? 'ok' : 'no'}" data-buy="${i}"><div class="out">${imgHTML(id, 'ico big')}${e.tool ? '<i class="up">▲</i>' : ''}</div><div class="nm">${e.name || itemName(id)}</div><div class="price">${e.price} ${imgHTML('coin')}</div></button>`;
    }).join('');
    $('panel').innerHTML = this.head('van', 'Автолавка', `<span class="sum">${p.coins} ${imgHTML('coin')}</span>`) + `<div class="recipes shop">${cards}</div>`;
  }

  openSleep() { this.open('sleep', 'small'); }
  render_sleep() {
    $('panel').innerHTML = this.head('bed', 'Спать?') + `<div class="center"><button class="bigbtn" data-sleep>${imgHTML('moon', 'ico big')}</button></div>`;
  }

  openSeedPicker(seeds, cb) { this.seeds = seeds; this.seedCb = cb; this.open('seeds', 'small'); }
  render_seeds() {
    $('panel').innerHTML = this.head('question', 'Что посадить?') +
      `<div class="grid">${this.seeds.map(id => `<button class="cell" data-seed="${id}">${imgHTML(id)}<b>${this.p.inv[id]}</b></button>`).join('')}</div>`;
  }

  openStage() { this.open('stage', 'small'); }
  render_stage() {
    const s = this.s, st = STAGES[s.stage || 0], nx = STAGES[(s.stage || 0) + 1];
    const goals = st.goals.map(g => {
      const v = Math.min(g.n, s.stats[g.stat] || 0);
      return `<div class="goal">${imgHTML(g.icon)}<div class="bar"><i style="width:${v / g.n * 100}%"></i></div><b>${v}/${g.n}</b></div>`;
    }).join('');
    const done = stageProgress(s) >= 1;
    $('panel').innerHTML = this.head('house', `${st.name} → ${nx ? nx.name : ''}`) + `<div class="goals">${goals}</div>` +
      (done ? `<div class="note big">${imgHTML('heart')} Скоро здесь будет ${nx.name}!</div>` : '');
  }

  openSettings() { this.open('settings', 'small'); }
  render_settings() {
    const snd = this.game.sound;
    $('panel').innerHTML = this.head('gear', 'Настройки') + `
      <div class="row"><button class="tog ${snd.musicOn ? 'on' : ''}" data-tog="music">${imgHTML(snd.musicOn ? 'music' : 'music_off')}</button>
      <button class="tog ${snd.sfxOn ? 'on' : ''}" data-tog="sfx">${imgHTML(snd.sfxOn ? 'sound' : 'sound_off')}</button></div>
      <h3>Сохранение</h3>
      <div class="row"><button class="txt" data-save="file">Экспорт в файл</button><button class="txt" data-save="code">Показать код</button></div>
      <div class="row"><button class="txt" data-save="load">Импорт из файла</button><button class="txt" data-save="paste">Вставить код</button></div>
      <textarea id="savecode" class="hidden" spellcheck="false"></textarea>
      <div class="row hidden" id="pasterow"><button class="txt" data-save="apply">Загрузить этот код</button></div>
      <div class="row"><button class="txt danger" data-save="new">Начать заново</button></div>
      <input type="file" id="savefile" accept=".json,application/json" class="hidden">`;
    $('savefile').addEventListener('change', e => this.importFile(e));
  }

  importFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => fromCode(t)).then(st => this.game.loadState(st)).catch(() => this.toast('Не получилось прочитать файл'));
  }

  onPanelClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    const g = this.game, d = b.dataset;
    g.sound.unlock();
    if ('close' in d) return this.close();
    if (d.recipe) {
      const r = g.dispatch({ type: 'craft', recipe: d.recipe });
      if (!r.ok) { g.sound.play('no'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); }
      return;
    }
    if (d.move) {
      const o = this.container;
      const from = d.move === 'in' ? this.p.inv : o.items;
      g.dispatch({ type: 'store', x: o.x, y: o.y, dir: d.move, item: d.item, n: d.all ? from[d.item] : 1 });
      g.sound.play('pop');
      return;
    }
    if (d.item) {
      $('iname').textContent = itemName(d.item) + (ITEMS[d.item] ? `  · ${ITEMS[d.item].price} мон.` : '');
      if (ITEMS[d.item]?.cat === 'seed') { g.dispatch({ type: 'selectSeed', seed: d.item }); this.render_bag(); $('iname').textContent = itemName(d.item); }
      return;
    }
    if (d.buy) {
      const r = g.dispatch({ type: 'buy', i: +d.buy });
      g.sound.play(r.ok ? 'coin' : 'no');
      return;
    }
    if ('sleep' in d) { this.close(); g.sleep(); return; }
    if (d.seed) { g.dispatch({ type: 'selectSeed', seed: d.seed }); const cb = this.seedCb; this.close(); cb && cb(d.seed); return; }
    if (d.tog) {
      if (d.tog === 'music') g.sound.setMusic(!g.sound.musicOn); else g.sound.setSfx(!g.sound.sfxOn);
      this.render_settings(); return;
    }
    if (d.save) return this.saveAction(d.save);
  }

  saveAction(what) {
    const g = this.game;
    const ta = $('savecode');
    if (what === 'file') {
      const blob = new Blob([serialize(g.state)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hutor-den${g.state.day}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } else if (what === 'code') {
      toCode(g.state).then(code => {
        ta.value = code; ta.classList.remove('hidden'); $('pasterow').classList.add('hidden');
        ta.select();
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => this.toast('Код скопирован'), () => {});
      });
    } else if (what === 'load') {
      $('savefile').click();
    } else if (what === 'paste') {
      ta.value = ''; ta.classList.remove('hidden'); $('pasterow').classList.remove('hidden'); ta.focus();
    } else if (what === 'apply') {
      fromCode(ta.value).then(st => g.loadState(st)).catch(() => this.toast('Код не подошёл'));
    } else if (what === 'new') {
      if (confirm('Начать игру заново? Текущий хутор пропадёт (сначала можно сделать экспорт).')) g.newGame();
    }
  }

  // ---------- лента стройки ----------
  renderBuildbar() {
    const p = this.p, s = this.s, b = this.game.build;
    const items = BUILDABLE.filter(id => (p.inv[id] || 0) > 0 || RECIPES.some(r => r.out && r.out[id] && !r.where && recipeVisible(s, p, r)));
    const key = items.map(id => id + (p.inv[id] || 0) + (canAutoCraft(s, p, id) ? 'c' : '')).join() + b.item;
    if (key === this._bbKey) return;
    this._bbKey = key;
    $('buildbar').innerHTML = `<div class="strip">${items.map(id => {
      const n = p.inv[id] || 0, c = !n && canAutoCraft(s, p, id);
      const r = !n && !c ? RECIPES.find(r => r.out && r.out[id]) : null;
      return `<button class="bcell ${b.item === id ? 'sel' : ''} ${n || c ? '' : 'no'}" data-b="${id}">${imgHTML(id)}${n ? `<b>${n}</b>` : c ? '<b class="c">+</b>' : ''}${r ? `<span class="need">${Object.entries(r.in).map(([i, k]) => imgHTML(i) + k).join('')}</span>` : ''}</button>`;
    }).join('')}</div><button class="done" data-done>${imgHTML('check')}</button>`;
  }
  onBuildClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    const g = this.game;
    g.sound.play('pop');
    if ('done' in b.dataset) return g.toggleBuild();
    if (b.dataset.b) { g.build.item = g.build.item === b.dataset.b ? null : b.dataset.b; this._bbKey = ''; this.renderBuildbar(); }
  }
  showBuild(on) {
    $('buildbar').classList.toggle('hidden', !on);
    $('br').classList.toggle('hidden', on);
    this._bbKey = '';
    if (on) this.renderBuildbar();
    this.updateHint();
  }
}
