// Работа с картой: клетки, объекты, проходимость.
import { OBJECTS } from '../config/objects.js';

export const DAY_START = 6 * 60;   // 6:00
export const DAY_END = 26 * 60;    // 2:00 ночи — день заканчивается сам
export const MIN_PER_SEC = 1.8;    // ~11 минут реального времени на день

export const key = (x, y) => x + ',' + y;
export const defOf = o => OBJECTS[o.type] || {};

export function ground(scene, x, y) {
  if (x < 0 || y < 0 || x >= scene.w || y >= scene.h) return null;
  return scene.ground[y * scene.w + x];
}

// Индекс занятости клеток (не сохраняется, строится заново)
export function buildOcc(scene) {
  scene._occ = new Array(scene.w * scene.h).fill(null);
  for (const k in scene.objects) markObj(scene, k, k);
}
function markObj(scene, k, val) {
  const o = scene.objects[k];
  const d = defOf(o);
  for (let dy = 0; dy < (d.h || 1); dy++)
    for (let dx = 0; dx < (d.w || 1); dx++) {
      const x = o.x + dx, y = o.y + dy;
      if (x >= 0 && y >= 0 && x < scene.w && y < scene.h) scene._occ[y * scene.w + x] = val;
    }
}

export function objAt(scene, x, y) {
  if (x < 0 || y < 0 || x >= scene.w || y >= scene.h) return null;
  if (!scene._occ) buildOcc(scene);
  const k = scene._occ[y * scene.w + x];
  return k ? scene.objects[k] : null;
}

export function addObj(scene, o) {
  const k = key(o.x, o.y);
  scene.objects[k] = o;
  if (!scene._occ) buildOcc(scene);
  markObj(scene, k, k);
  scene.rev = (scene.rev || 0) + 1;
  return o;
}

export function removeObj(scene, o) {
  const k = key(o.x, o.y);
  if (!scene.objects[k]) return;
  markObj(scene, k, null);
  delete scene.objects[k];
  scene.rev = (scene.rev || 0) + 1;
}

export function canFit(scene, type, x, y) {
  const d = OBJECTS[type];
  for (let dy = 0; dy < (d.h || 1); dy++)
    for (let dx = 0; dx < (d.w || 1); dx++) {
      const g = ground(scene, x + dx, y + dy);
      if (!g || g === 'w' || g === 'W' || g === 'b') return false;
      if (objAt(scene, x + dx, y + dy)) return false;
    }
  return true;
}

export function walkable(scene, x, y, opts = {}) {
  const g = ground(scene, x, y);
  if (!g || g === 'w' || g === 'W') return false;
  const o = objAt(scene, x, y);
  if (o && defOf(o).solid) {
    if (opts.cat && (o.type === 'fence')) return true;
    return false;
  }
  return true;
}

export const getPlayer = (state, pid) => state.players[pid];
export const sceneOf = (state, p) => state.scenes[p.scene];

export function addItems(p, items, mult = 1) {
  for (const id in items) {
    p.inv[id] = (p.inv[id] || 0) + items[id] * mult;
    if (p.inv[id] <= 0) delete p.inv[id];
  }
}
export function hasItems(p, items) {
  for (const id in items) if ((p.inv[id] || 0) < items[id]) return false;
  return true;
}

// Дверь дома: клетка перед дверью
export function doorTile(o) {
  const d = defOf(o);
  return { x: o.x + d.door[0], y: o.y + d.door[1] };
}

export function findObj(scene, pred) {
  for (const k in scene.objects) if (pred(scene.objects[k])) return scene.objects[k];
  return null;
}
