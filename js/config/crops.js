// Огородные культуры. days — сколько политых дней до урожая.
// regrow — после сбора растение остаётся и снова плодоносит через N дней.
export const CROPS = {
  radish:    { name: 'Редиска',   days: 2, yield: [1, 2], seed: 'seed_radish',    seedChance: 0.6 },
  carrot:    { name: 'Морковь',   days: 3, yield: [1, 2], seed: 'seed_carrot',    seedChance: 0.5 },
  potato:    { name: 'Картошка',  days: 4, yield: [2, 4], seed: 'seed_potato',    seedChance: 0.5 },
  cucumber:  { name: 'Огурцы',    days: 4, yield: [2, 3], seed: 'seed_cucumber',  seedChance: 0.2, regrow: 2 },
  sunflower: { name: 'Подсолнух', days: 5, yield: [1, 1], seed: 'seed_sunflower', seedChance: 1.0 },
  pumpkin:   { name: 'Тыква',     days: 7, yield: [1, 1], seed: 'seed_pumpkin',   seedChance: 0.7 },
};

// Стадия роста для отрисовки: 0 семечко, 1 росток, 2 подросло, 3 созрело
export function cropStage(crop) {
  const def = CROPS[crop.id];
  if (crop.growth >= def.days) return 3;
  if (crop.growth === 0) return 0;
  return crop.growth / def.days < 0.5 ? 1 : 2;
}
