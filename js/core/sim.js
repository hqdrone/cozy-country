// Течение времени. tick вызывается клиентом (позже — сервером).
import { DAY_END, findObj, addObj, removeObj, canFit } from './world.js';
import { shopOpen } from './actions.js';
import { PLACES } from './mapgen.js';

export function tick(state, dtMinutes) {
  state.time += dtMinutes;
  // Автолавка приезжает и уезжает
  const out = state.scenes.outside;
  const van = findObj(out, o => o.type === 'van');
  const open = shopOpen(state);
  const ev = [];
  if (open && !van && canFit(out, 'van', PLACES.van.x, PLACES.van.y)) {
    addObj(out, { type: 'van', x: PLACES.van.x, y: PLACES.van.y });
    ev.push({ t: 'vanArrive' });
  } else if (!open && van) {
    removeObj(out, van);
  }
  if (state.time >= DAY_END) ev.push({ t: 'tooLate' });
  return ev;
}

export function clockText(time) {
  const m = Math.floor(time) % (24 * 60);
  const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(Math.floor(mm / 10) * 10).padStart(2, '0');
}
