// Рецепты. Крафт — в рюкзаке, готовка — у печки (where: 'stove').
// out — что получаем; tool — улучшение инструмента [имя, уровень].
// Рецепт доступен, если его id есть в state.recipes (открываются постепенно).
export const RECIPES = [
  { id: 'fence',     out: { fence: 2 },     in: { wood: 1 } },
  { id: 'axe2',      tool: ['axe', 2],      in: { wood: 2, stone: 3 } },
  { id: 'pick2',     tool: ['pickaxe', 2],  in: { wood: 2, stone: 3 } },
  { id: 'gate',      out: { gate: 1 },      in: { wood: 3 } },
  { id: 'path',      out: { path: 4 },      in: { stone: 2 } },
  { id: 'gardenbed', out: { gardenbed: 1 }, in: { wood: 2 } },
  { id: 'shovel2',   tool: ['shovel', 2],   in: { wood: 2, stone: 2 } },
  { id: 'chest',     out: { chest: 1 },     in: { wood: 6, stone: 1 } },
  { id: 'bench',     out: { bench: 1 },     in: { wood: 4 } },
  { id: 'flowerbed', out: { flowerbed: 1 }, in: { stone: 3 } },
  { id: 'lantern',   out: { lantern: 1 },   in: { wood: 2, stone: 3 } },

  { id: 'jam_currant',   where: 'stove', out: { jam_currant: 1 },   in: { currant: 5, jar: 1 } },
  { id: 'jam_raspberry', where: 'stove', out: { jam_raspberry: 1 }, in: { raspberry: 5, jar: 1 } },
  { id: 'pickles',       where: 'stove', out: { pickles: 1 },       in: { cucumber: 3, jar: 1 } },
];

export const recipeById = id => RECIPES.find(r => r.id === id);

// Инструменты: уровень 1 — деревянные, 2 — каменные. Уровень ускоряет работу.
export const TOOLS = {
  axe:     { name: 'Топор' },
  pickaxe: { name: 'Кирка' },
  shovel:  { name: 'Лопата' },
  can:     { name: 'Лейка', capacity: [0, 8, 20] },
};
