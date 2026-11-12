// Объекты на карте: природа, постройки, мебель.
// solid — нельзя пройти; w/h — размер в клетках (якорь — левый верхний угол);
// kind — как с объектом взаимодействовать; item — какой предмет вернётся при уборке;
// layer: 'ground' — рисуется на земле под всеми; light — радиус света ночью.
export const OBJECTS = {
  birch:    { solid: true, kind: 'tree', tool: 'axe', hits: 3, drop: { wood: [2, 3] }, regrow: 3 },
  spruce:   { solid: true, kind: 'tree', tool: 'axe', hits: 4, drop: { wood: [3, 4] }, regrow: 4 },
  stump:    { solid: true, kind: 'stump' },
  rock:     { solid: true, kind: 'rock', tool: 'pickaxe', hits: 3, drop: { stone: [2, 3] }, regrow: 4 },
  bush_currant:   { solid: true, kind: 'bush', berry: 'currant',   drop: [3, 5], regrow: 2 },
  bush_raspberry: { solid: true, kind: 'bush', berry: 'raspberry', drop: [3, 5], regrow: 2 },

  soil:      { solid: false, kind: 'soil', layer: 'ground', item: 'gardenbed' },
  path:      { solid: false, layer: 'ground', item: 'path' },
  fence:     { solid: true, item: 'fence', kind: 'fence' },
  gate:      { solid: false, item: 'gate', kind: 'gate' },
  chest:     { solid: true, item: 'chest', kind: 'chest' },
  flowerbed: { solid: true, item: 'flowerbed' },
  bench:     { solid: true, item: 'bench' },
  lantern:   { solid: true, item: 'lantern', light: 3.5 },
  birdhouse: { solid: true, item: 'birdhouse' },
  scarecrow: { solid: true, item: 'scarecrow' },
  geranium:  { solid: true, item: 'geranium' },

  house:        { solid: true, w: 5, h: 4, kind: 'house', door: [2, 4], light: 2 },
  granny_house: { solid: true, w: 5, h: 4, kind: 'granny_house', door: [2, 4], light: 2 },
  well:         { solid: true, kind: 'well' },
  sellbox:      { solid: true, kind: 'sellbox' },
  haystack:     { solid: true, w: 2, h: 2 },
  van:          { solid: true, w: 3, h: 2, kind: 'shop' },

  // Деревня. door — клетка перед дверью относительно левого верхнего угла.
  cottage: { solid: true, w: 4, h: 3, kind: 'cottage', item: 'cottage', door: [1, 3], light: 2, big: true },
  selpo:   { solid: true, w: 4, h: 3, kind: 'selpo', item: 'selpo', door: [2, 3], light: 2, big: true },
  banya:   { solid: true, w: 3, h: 3, kind: 'banya', item: 'banya', door: [1, 3], light: 1.5, big: true },
  club:    { solid: true, w: 5, h: 3, kind: 'club', item: 'club', door: [2, 3], light: 3, big: true },

  // Внутри дома
  stove:     { solid: true, w: 3, h: 3, kind: 'stove', light: 3 },
  bed:       { solid: true, w: 3, h: 2, kind: 'bed' },
  table:     { solid: true, w: 3, h: 2, kind: 'samovar' },
  sideboard: { solid: true, w: 2, h: 1 },
  radio:     { solid: true, kind: 'radio' },
  rug:       { solid: false, w: 3, h: 2, layer: 'ground' },
  exit:      { solid: false, kind: 'exit', layer: 'ground' },
};

// Что можно ставить в режиме стройки (порядок в ленте)
export const BUILDABLE = ['cottage', 'selpo', 'banya', 'club', 'fence', 'gate', 'path', 'gardenbed', 'flowerbed', 'bench', 'lantern', 'chest', 'birdhouse', 'scarecrow', 'geranium'];
