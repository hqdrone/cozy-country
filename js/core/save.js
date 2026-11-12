// Сохранение в localStorage, экспорт/импорт.
import { buildOcc } from './world.js';
import { SAVE_VERSION } from './state.js';

const KEY = 'hutor-save-v1';

export function serialize(state) {
  return JSON.stringify(state, (k, v) => (k.startsWith('_') ? undefined : v));
}

export function deserialize(text) {
  const s = JSON.parse(text);
  if (!s || !s.scenes || !s.players || !s.version) throw new Error('bad save');
  if (s.version > SAVE_VERSION) throw new Error('newer save');
  for (const id in s.scenes) buildOcc(s.scenes[id]);
  return s;
}

export function saveLocal(state) {
  try { localStorage.setItem(KEY, serialize(state)); return true; } catch (e) { return false; }
}
export function loadLocal() {
  try { const t = localStorage.getItem(KEY); return t ? deserialize(t) : null; } catch (e) { return null; }
}
export function clearLocal() { localStorage.removeItem(KEY); }

// Код сохранения для копирования: сжатый (deflate) и в base64, чтобы был покороче
const b64 = bytes => { let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const unb64 = str => Uint8Array.from(atob(str.replace(/\s+/g, '')), c => c.charCodeAt(0));
async function pipe(bytes, stream) {
  const res = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(res);
}

export async function toCode(state) {
  const bytes = new TextEncoder().encode(serialize(state));
  if (typeof CompressionStream !== 'undefined') {
    try { return 'HUTOR2:' + b64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* ниже — без сжатия */ }
  }
  return 'HUTOR1:' + b64(bytes);
}
export async function fromCode(code) {
  code = code.trim();
  if (code.startsWith('{')) return deserialize(code);
  let bytes;
  if (code.startsWith('HUTOR2:')) bytes = await pipe(unb64(code.slice(7)), new DecompressionStream('deflate-raw'));
  else bytes = unb64(code.replace(/^HUTOR1:/, ''));
  return deserialize(new TextDecoder().decode(bytes));
}
