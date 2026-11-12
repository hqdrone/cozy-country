// ВСЕ изменения мира идут только через действия: applyAction(state, {type, pid, ...}).
// Функция не знает ни про экран, ни про звук: возвращает список событий fx,
// которые клиент превращает в анимации и звуки. Позже этот же код будет на сервере.
import { OBJECTS } from '../config/objects.js';
import { ITEMS } from '../config/items.js';
import { CROPS } from '../config/crops.js';
import { RECIPES, recipeById, TOOLS } from '../config/recipes.js';
import { TUTORIAL, QUESTS, DAILY_ASKS, GRANNY_LINES, SHOP } from '../config/story.js';
import { rand, randInt } from './rng.js';
import {
  DAY_START, objAt, addObj, removeObj, walkable, ground, canFit, defOf,
  addItems, hasItems, findObj, doorTile,
} from './world.js';
import { HOME_ENTRY, HOME_WAKE, PLACES } from './mapgen.js';

const H = {};

export function applyAction(state, a) {
  const fx = [];
  const p = state.players[a.pid];
  const h = H[a.type];
  if (!p || !h) return { ok: false, fx };
  const ok = h(state, p, a, fx) !== false;
  if (ok) tutorialCheck(state, fx);
  return { ok, fx };
}

const stat = (s, k, n = 1) => { s.stats[k] = (s.stats[k] || 0) + n; };
const sceneOf = (s, p) => s.scenes[p.scene];
function gain(p, items, fx, at) {
  addItems(p, items);
  for (const id in items) fx.push({ t: 'gain', item: id, n: items[id], x: at.x, y: at.y });
}
export const canCapacity = p => TOOLS.can.capacity[p.tools.can] || 8;

export function shopOpen(s) {
  return s.day === s.shop.day && s.time >= SHOP.open && s.time < SHOP.close;
}

// ---------- Движение и сцены ----------
H.move = (s, p, a) => {
  if (!walkable(sceneOf(s, p), a.x, a.y)) return false;
  if (Math.abs(a.x - p.x) > 1 || Math.abs(a.y - p.y) > 1) return false;
  p.x = a.x; p.y = a.y;
  if (a.dir) p.dir = a.dir;
};
H.face = (s, p, a) => { p.dir = a.dir; };
H.selectSeed = (s, p, a) => { if (!ITEMS[a.seed] || ITEMS[a.seed].cat !== 'seed') return false; p.seed = a.seed; };

H.enter = (s, p, a, fx) => {
  if (p.scene !== 'outside') return false;
  p.scene = 'home'; p.x = HOME_ENTRY.x; p.y = HOME_ENTRY.y; p.dir = 'up';
  fx.push({ t: 'scene', scene: 'home' });
};
H.exit = (s, p, a, fx) => {
  if (p.scene !== 'home') return false;
  const house = findObj(s.scenes.outside, o => o.type === 'house');
  const d = doorTile(house);
  p.scene = 'outside'; p.x = d.x; p.y = d.y; p.dir = 'down';
  fx.push({ t: 'scene', scene: 'outside' });
};

// ---------- Добыча ----------
H.gather = (s, p, a, fx) => {
  const sc = sceneOf(s, p);
  const o = objAt(sc, a.x, a.y);
  if (!o) return false;
  const d = defOf(o);
  if (d.kind === 'tree') {
    removeObj(sc, o);
    addObj(sc, { type: 'stump', x: o.x, y: o.y, tree: o.type, v: o.v, regrowOn: s.day + d.regrow });
    const n = randInt(s, d.drop.wood[0], d.drop.wood[1]);
    gain(p, { wood: n }, fx, o);
    stat(s, 'chopped');
    fx.push({ t: 'fell', x: o.x, y: o.y, tree: o.type });
  } else if (d.kind === 'rock') {
    removeObj(sc, o);
    s.respawns.push({ scene: p.scene, type: 'rock', x: o.x, y: o.y, v: o.v, on: s.day + d.regrow });
    gain(p, { stone: randInt(s, d.drop.stone[0], d.drop.stone[1]) }, fx, o);
    stat(s, 'mined');
    fx.push({ t: 'break', x: o.x, y: o.y });
  } else if (d.kind === 'bush') {
    if (!o.berries) return false;
    o.berries = false; o.regrowOn = s.day + d.regrow;
    gain(p, { [d.berry]: randInt(s, d.drop[0], d.drop[1]) }, fx, o);
    stat(s, 'picked');
    fx.push({ t: 'pick', x: o.x, y: o.y });
  } else return false;
};

// ---------- Огород ----------
H.till = (s, p, a, fx) => {
  const sc = sceneOf(s, p);
  if (ground(sc, a.x, a.y) !== 'p' || objAt(sc, a.x, a.y)) return false;
  addObj(sc, { type: 'soil', x: a.x, y: a.y, watered: false, crop: null });
  stat(s, 'tilled');
  fx.push({ t: 'dig', x: a.x, y: a.y });
};

H.plant = (s, p, a, fx) => {
  const o = objAt(sceneOf(s, p), a.x, a.y);
  const it = ITEMS[a.seed];
  if (!o || o.type !== 'soil' || o.crop || o.granny || !it || it.cat !== 'seed' || !p.inv[a.seed]) return false;
  o.crop = { id: it.crop, growth: 0 };
  addItems(p, { [a.seed]: -1 });
  p.seed = a.seed;
  stat(s, 'planted');
  fx.push({ t: 'plant', x: a.x, y: a.y });
};

H.water = (s, p, a, fx) => {
  const o = objAt(sceneOf(s, p), a.x, a.y);
  if (!o || o.type !== 'soil' || o.watered || o.granny || p.water <= 0) return false;
  o.watered = true; p.water--;
  stat(s, 'watered');
  fx.push({ t: 'water', x: a.x, y: a.y });
};

H.refill = (s, p, a, fx) => {
  p.water = canCapacity(p);
  fx.push({ t: 'refill', x: a.x, y: a.y });
};

H.harvest = (s, p, a, fx) => {
  const o = objAt(sceneOf(s, p), a.x, a.y);
  if (!o || o.type !== 'soil' || !o.crop || o.granny) return false;
  const c = CROPS[o.crop.id];
  if (o.crop.growth < c.days) return false;
  const n = randInt(s, c.yield[0], c.yield[1]);
  const got = { [o.crop.id]: n };
  if (rand(s) < c.seedChance) got[c.seed] = 1;
  gain(p, got, fx, o);
  stat(s, 'harvested', n);
  fx.push({ t: 'harvest', x: a.x, y: a.y, crop: o.crop.id });
  if (c.regrow) o.crop.growth = c.days - c.regrow; else o.crop = null;
};

// ---------- Крафт и готовка ----------
export function recipeVisible(s, p, r) {
  if (!s.recipes.includes(r.id)) return false;
  if (r.tool && (p.tools[r.tool[0]] || 0) >= r.tool[1]) return false;
  return true;
}

function doCraft(s, p, r, fx) {
  if (!recipeVisible(s, p, r) || !hasItems(p, r.in)) return false;
  addItems(p, r.in, -1);
  if (r.out) addItems(p, r.out);
  if (r.tool) {
    p.tools[r.tool[0]] = r.tool[1];
    if (r.tool[0] === 'can') p.water = canCapacity(p);
  }
  stat(s, 'crafted');
  if (r.where === 'stove') stat(s, 'cooked');
  fx.push({ t: 'craft', recipe: r.id, x: p.x, y: p.y });
  return true;
}

H.craft = (s, p, a, fx) => {
  const r = recipeById(a.recipe);
  if (!r) return false;
  if (r.where === 'stove' && p.scene !== 'home') return false;
  return doCraft(s, p, r, fx);
};

// ---------- Стройка ----------
export function placeCheck(s, p, item, x, y) {
  const it = ITEMS[item];
  if (!it || !it.place || p.scene !== 'outside') return false;
  const sc = sceneOf(s, p);
  const type = it.place;
  if (!canFit(sc, type, x, y)) return false;
  const g = ground(sc, x, y);
  if (g === 'd' && type !== 'path' && type !== 'gate') return false; // дороги оставляем свободными
  if (g === 'f' && type !== 'path') return false;
  if (OBJECTS[type].solid) {
    for (const id in s.players) {
      const q = s.players[id];
      if (q.scene === p.scene && q.x === x && q.y === y) return false;
    }
  }
  return true;
}

export function canAutoCraft(s, p, item) {
  const r = RECIPES.find(r => r.out && r.out[item] && !r.where);
  return r && recipeVisible(s, p, r) && hasItems(p, r.in) ? r : null;
}

H.place = (s, p, a, fx) => {
  if (!placeCheck(s, p, a.item, a.x, a.y)) return false;
  if (!p.inv[a.item]) {
    const r = canAutoCraft(s, p, a.item);
    if (!r || !doCraft(s, p, r, fx)) return false;
  }
  const type = ITEMS[a.item].place;
  const o = { type, x: a.x, y: a.y, placed: true };
  if (type === 'soil') Object.assign(o, { framed: true, watered: false, crop: null });
  if (type === 'chest') o.items = {};
  if (type === 'flowerbed') o.v = randInt(s, 0, 2);
  addObj(sceneOf(s, p), o);
  addItems(p, { [a.item]: -1 });
  stat(s, 'built');
  fx.push({ t: 'place', x: a.x, y: a.y, item: a.item });
};

export function removeCheck(s, p, x, y) {
  const o = objAt(sceneOf(s, p), x, y);
  if (!o || o.granny) return null;
  const d = defOf(o);
  if (!d.item) return null;
  if (o.type === 'soil' && (!o.framed || o.crop)) return null;
  return o;
}

H.remove = (s, p, a, fx) => {
  const o = removeCheck(s, p, a.x, a.y);
  if (!o) return false;
  if (o.items) addItems(p, o.items);
  removeObj(sceneOf(s, p), o);
  addItems(p, { [defOf(o).item]: 1 });
  fx.push({ t: 'pickup', x: o.x, y: o.y, item: defOf(o).item });
};

// ---------- Сундук и ящик для продажи ----------
H.store = (s, p, a, fx) => {
  const o = objAt(sceneOf(s, p), a.x, a.y);
  if (!o || !(o.type === 'chest' || o.type === 'sellbox')) return false;
  o.items = o.items || {};
  const from = a.dir === 'in' ? p.inv : o.items;
  const to = a.dir === 'in' ? o.items : p.inv;
  const n = Math.min(a.n || 1, from[a.item] || 0);
  if (n <= 0) return false;
  from[a.item] -= n; if (!from[a.item]) delete from[a.item];
  to[a.item] = (to[a.item] || 0) + n;
  if (o.type === 'sellbox' && a.dir === 'in') stat(s, 'boxed', n);
  fx.push({ t: 'store' });
};

// ---------- Автолавка ----------
H.buy = (s, p, a, fx) => {
  if (!shopOpen(s)) return false;
  const e = SHOP.stock[a.i];
  if (!e || p.coins < e.price) return false;
  if (e.tool && (p.tools[e.tool[0]] || 0) >= e.tool[1]) return false;
  p.coins -= e.price;
  if (e.item) addItems(p, { [e.item]: 1 });
  if (e.tool) { p.tools[e.tool[0]] = e.tool[1]; if (e.tool[0] === 'can') p.water = canCapacity(p); }
  stat(s, 'bought');
  fx.push({ t: 'buy', item: e.item || e.tool[0] });
};

// ---------- Бабушка ----------
function currentQuest(s) {
  if (s.quest.i < QUESTS.length) return QUESTS[s.quest.i];
  return s.quest.daily;
}

H.talk = (s, p, a, fx) => {
  const lines = [];
  stat(s, 'talks');
  tutorialCheck(s, fx);
  const tutorialDone = s.tutorial.step >= TUTORIAL.length;
  if (s.granny.greetDay !== s.day) {
    s.granny.greetDay = s.day;
    lines.push({ text: GRANNY_LINES.hello[s.day % GRANNY_LINES.hello.length], icon: 'granny' });
    if (tutorialDone) {
      lines.push({ text: GRANNY_LINES.pie, icon: 'pie' });
      gain(p, { pie: 1 }, fx, p);
    }
  }
  if (!tutorialDone) {
    const st = TUTORIAL[s.tutorial.step];
    lines.push({ text: st.say, icon: st.icon });
  } else {
    const q = currentQuest(s);
    let justDone = false;
    if (s.quest.active && q) {
      if (hasItems(p, q.need)) {
        addItems(p, q.need, -1);
        const rw = q.reward || {};
        if (rw.give) gain(p, rw.give, fx, p);
        if (rw.coins) { p.coins += rw.coins; s.stats.earned = (s.stats.earned || 0) + rw.coins; fx.push({ t: 'coins', n: rw.coins }); }
        if (rw.recipes) for (const r of rw.recipes) if (!s.recipes.includes(r)) { s.recipes.push(r); fx.push({ t: 'recipe', id: r }); }
        s.quest.active = false;
        if (s.quest.i < QUESTS.length) s.quest.i++; else s.quest.dailyDay = s.day;
        stat(s, 'quests');
        lines.push({ text: GRANNY_LINES.thanks, icon: 'heart' });
        fx.push({ t: 'questDone' });
        justDone = true;
      } else {
        lines.push({ text: q.say, need: q.need });
      }
    }
    if (s.quest.active) { /* уже сказали */ } else if (s.quest.i < QUESTS.length || s.quest.dailyDay !== s.day) {
      if (s.quest.i >= QUESTS.length) {
        const item = DAILY_ASKS[randInt(s, 0, DAILY_ASKS.length - 1)];
        const n = randInt(s, 3, 6);
        s.quest.daily = { say: 'Принеси, пожалуйста', need: { [item]: n }, reward: { coins: Math.ceil(ITEMS[item].price * n * 1.5) + 5 } };
      }
      s.quest.active = true;
      const nq = currentQuest(s);
      lines.push({ text: nq.say, need: nq.need });
    } else if (!justDone) {
      lines.push({ text: GRANNY_LINES.later, icon: 'granny' });
    }
  }
  fx.push({ t: 'say', who: 'granny', lines });
};

H.pet = (s, p, a, fx) => { stat(s, 'pets'); fx.push({ t: 'hearts', x: a.x, y: a.y }); };

// ---------- Сон и новый день ----------
H.sleep = (s, p, a, fx) => { endDay(s, fx); };

export function endDay(s, fx = []) {
  // Продажа из ящика у калитки
  const out = s.scenes.outside;
  const box = findObj(out, o => o.type === 'sellbox');
  let coins = 0; const sold = {};
  if (box && box.items) {
    for (const id in box.items) {
      coins += (ITEMS[id] ? ITEMS[id].price : 1) * box.items[id];
      sold[id] = box.items[id];
    }
    box.items = {};
  }
  const p = s.players.p1; // пока у ящика один хозяин
  if (p && coins) { p.coins += coins; s.stats.earned = (s.stats.earned || 0) + coins; }

  const nextDay = s.day + 1;
  // Рост растений и восстановление природы
  for (const k of Object.keys(out.objects)) {
    const o = out.objects[k];
    if (o.type === 'soil') {
      if (o.crop && o.watered && o.crop.growth < CROPS[o.crop.id].days) o.crop.growth++;
      if (!o.granny) o.watered = false;
    } else if (o.type === 'stump' && o.regrowOn && nextDay >= o.regrowOn) {
      removeObj(out, o);
      addObj(out, { type: o.tree, x: o.x, y: o.y, v: o.v });
    } else if (OBJECTS[o.type] && OBJECTS[o.type].kind === 'bush' && !o.berries && nextDay >= (o.regrowOn || 0)) {
      o.berries = true;
    }
  }
  s.respawns = s.respawns.filter(r => {
    if (nextDay < r.on) return true;
    const sc = s.scenes[r.scene];
    const busy = Object.values(s.players).some(q => q.scene === r.scene && q.x === r.x && q.y === r.y);
    if (busy || objAt(sc, r.x, r.y)) { r.on = nextDay + 1; return true; }
    addObj(sc, { type: r.type, x: r.x, y: r.y, v: r.v });
    return false;
  });

  s.day = nextDay;
  s.time = DAY_START;
  while (s.shop.day < s.day) s.shop.day += SHOP.every;
  for (const id in s.players) {
    const q = s.players[id];
    q.scene = 'home'; q.x = HOME_WAKE.x; q.y = HOME_WAKE.y; q.dir = 'down';
  }
  s.stats.days = (s.stats.days || 0) + 1;
  fx.push({ t: 'morning', day: s.day, coins, sold, shop: s.shop.day === s.day });
}

// ---------- Обучение ----------
export function applyTutorialStart(s, step) {
  const st = TUTORIAL[step];
  if (!st || !st.start) return;
  if (st.start.unlock) for (const u of st.start.unlock) s.unlocks[u] = true;
  if (st.start.recipes) for (const r of st.start.recipes) if (!s.recipes.includes(r)) s.recipes.push(r);
  if (st.start.give) for (const id in s.players) addItems(s.players[id], st.start.give);
}

function tutorialCheck(s, fx) {
  let changed = false;
  while (s.tutorial.step < TUTORIAL.length && TUTORIAL[s.tutorial.step].done(s)) {
    s.tutorial.step++;
    applyTutorialStart(s, s.tutorial.step);
    changed = true;
  }
  if (changed) {
    if (s.tutorial.step >= TUTORIAL.length) { s.unlocks.backpack = true; s.unlocks.build = true; }
    fx.push({ t: 'tutorial', step: s.tutorial.step });
  }
}

// Ящик и сундук — что лежит внутри (для интерфейса)
export const containerAt = (s, p, x, y) => objAt(sceneOf(s, p), x, y);
export { PLACES };
