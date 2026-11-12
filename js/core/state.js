// Создание нового мира. Состояние — обычный JSON-объект (легко сохранять и передавать по сети).
import { generateOutside, generateHome, PLACES } from './mapgen.js';
import { DAY_START } from './world.js';
import { SHOP } from '../config/story.js';
import { applyTutorialStart } from './actions.js';

export const SAVE_VERSION = 1;

export function newPlayer(id, name) {
  return {
    id, name,
    scene: 'outside', x: PLACES.spawn.x, y: PLACES.spawn.y, dir: 'down',
    coins: 20,
    inv: {},
    tools: { axe: 1, pickaxe: 1, shovel: 1, can: 1 },
    water: 8,
    seed: null,
  };
}

export function newGame(seed = (Math.random() * 1e9) | 0) {
  const state = {
    version: SAVE_VERSION,
    seed, rng: seed,
    day: 1, time: DAY_START + 60,
    scenes: { outside: generateOutside(seed), home: generateHome() },
    players: { p1: newPlayer('p1', 'Внучек') },
    stats: {},
    recipes: ['fence', 'axe2', 'pick2'],
    unlocks: {},
    tutorial: { step: 0 },
    quest: { i: 0, active: false, daily: null, dailyDay: 0 },
    granny: { greetDay: 0 },
    shop: { day: SHOP.first },
    respawns: [],
    stage: 0,
  };
  applyTutorialStart(state, 0);
  return state;
}
