// Поиск пути A* по клеткам (8 направлений, без срезания углов).
import { walkable } from './world.js';

export function findPath(scene, sx, sy, tx, ty, opts = {}) {
  const W = scene.w, H = scene.h;
  const ok = (x, y) => (x === tx && y === ty && opts.allowGoal) || walkable(scene, x, y, opts);
  if (sx === tx && sy === ty) return [];
  if (!ok(tx, ty)) return null;
  const N = W * H;
  const gScore = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const heap = []; // [f, idx]
  const push = (f, i) => {
    heap.push([f, i]);
    let c = heap.length - 1;
    while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last; let c = 0;
      for (;;) {
        const l = c * 2 + 1, r = l + 1; let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m;
      }
    }
    return top;
  };
  const h = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
  const s = sy * W + sx;
  gScore[s] = 0; push(h(sx, sy), s);
  let iter = 0;
  while (heap.length && iter++ < 6000) {
    const [, cur] = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % W, cy = (cur / W) | 0;
    if (cx === tx && cy === ty) {
      const path = []; let c = cur;
      while (c !== s) { path.push([c % W, (c / W) | 0]); c = came[c]; }
      return path.reverse();
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !ok(nx, ny)) continue;
      if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
      const ni = ny * W + nx;
      if (closed[ni]) continue;
      const g = gScore[cur] + (dx && dy ? 1.41 : 1);
      if (g < gScore[ni]) { gScore[ni] = g; came[ni] = cur; push(g + h(nx, ny), ni); }
    }
  }
  return null;
}

// Путь к любой клетке рядом с целью (для деревьев, камней, домов)
export function pathNear(scene, sx, sy, tiles, opts = {}) {
  // tiles: список клеток, на которые можно встать; выбираем ближайший достижимый путь
  let best = null;
  const sorted = tiles
    .filter(([x, y]) => walkable(scene, x, y, opts))
    .sort((a, b) => (Math.hypot(a[0] - sx, a[1] - sy) - Math.hypot(b[0] - sx, b[1] - sy)));
  for (const [x, y] of sorted.slice(0, 4)) {
    if (x === sx && y === sy) return [];
    const p = findPath(scene, sx, sy, x, y, opts);
    if (p && (!best || p.length < best.length)) best = p;
    if (best && best.length <= Math.hypot(x - sx, y - sy) + 1) break;
  }
  return best;
}
