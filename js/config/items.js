// Все предметы игры. Чтобы добавить предмет — добавь запись здесь
// и (по желанию) нарисуй иконку в js/render/icons.js (иначе будет простая иконка).
// cat: res — сырьё, crop — урожай, seed — семена, food — заготовки, place — можно поставить.
export const ITEMS = {
  wood:       { name: 'Брёвнышко', cat: 'res', price: 2 },
  stone:      { name: 'Камешек', cat: 'res', price: 2 },
  currant:    { name: 'Смородина', cat: 'res', price: 3 },
  raspberry:  { name: 'Малина', cat: 'res', price: 4 },

  radish:     { name: 'Редиска', cat: 'crop', price: 9 },
  carrot:     { name: 'Морковка', cat: 'crop', price: 14 },
  potato:     { name: 'Картошка', cat: 'crop', price: 12 },
  cucumber:   { name: 'Огурец', cat: 'crop', price: 9 },
  sunflower:  { name: 'Подсолнух', cat: 'crop', price: 35 },
  pumpkin:    { name: 'Тыква', cat: 'crop', price: 70 },

  seed_radish:    { name: 'Семена редиски', cat: 'seed', crop: 'radish', price: 2 },
  seed_carrot:    { name: 'Семена моркови', cat: 'seed', crop: 'carrot', price: 4 },
  seed_potato:    { name: 'Семенная картошка', cat: 'seed', crop: 'potato', price: 4 },
  seed_cucumber:  { name: 'Семена огурцов', cat: 'seed', crop: 'cucumber', price: 6 },
  seed_sunflower: { name: 'Семечки', cat: 'seed', crop: 'sunflower', price: 6 },
  seed_pumpkin:   { name: 'Семена тыквы', cat: 'seed', crop: 'pumpkin', price: 12 },

  jar:            { name: 'Банка', cat: 'res', price: 2 },
  jam_currant:    { name: 'Варенье смородиновое', cat: 'food', price: 32 },
  jam_raspberry:  { name: 'Варенье малиновое', cat: 'food', price: 40 },
  pickles:        { name: 'Огурчики солёные', cat: 'food', price: 45 },
  pie:            { name: 'Пирожок', cat: 'food', price: 12 },

  fence:      { name: 'Штакетник', cat: 'place', place: 'fence', price: 1 },
  gate:       { name: 'Калитка', cat: 'place', place: 'gate', price: 2 },
  path:       { name: 'Дорожка', cat: 'place', place: 'path', price: 1 },
  gardenbed:  { name: 'Грядка', cat: 'place', place: 'soil', price: 2 },
  chest:      { name: 'Сундук', cat: 'place', place: 'chest', price: 8 },
  flowerbed:  { name: 'Клумба', cat: 'place', place: 'flowerbed', price: 4 },
  bench:      { name: 'Лавочка', cat: 'place', place: 'bench', price: 5 },
  lantern:    { name: 'Фонарь', cat: 'place', place: 'lantern', price: 5 },
  birdhouse:  { name: 'Скворечник', cat: 'place', place: 'birdhouse', price: 10 },
  scarecrow:  { name: 'Пугало', cat: 'place', place: 'scarecrow', price: 10 },
  geranium:   { name: 'Герань', cat: 'place', place: 'geranium', price: 8 },
};

export const itemName = id => (ITEMS[id] ? ITEMS[id].name : id);
