// Жители деревни. Приезжают по одному в построенные избы (на следующее утро).
// look — как выглядит (рисуется кодом), likes — что любит просить,
// gifts — подарки по числу сердечек дружбы.
export const VILLAGERS = {
  mitya: {
    name: 'Дед Митяй',
    look: { hair: '#e8e4dc', style: 'cap', hat: '#6a6a72', beard: '#f0ece4', top: '#7a9ac0', topD: '#5a7aa0', bottom: 'pants', bottomC: '#4a4a52' },
    roof: ['#8a9aa8', '#6e7e8c', '#55626e'], shutter: ['#e8e4d0', '#c8c4b0'],
    likes: ['wood', 'potato', 'cucumber', 'pickles'],
    hello: ['Здорово, сосед!', 'Клюёт сегодня, чую!', 'Эх, хорошо-то как!'],
    gifts: { 2: { give: { bench: 1 } }, 4: { give: { scarecrow: 1 }, coins: 50 } },
  },
  valya: {
    name: 'Тётя Валя',
    look: { hair: '#8a4a2a', style: 'perm', top: '#d07a8a', topD: '#a85a6a', bottom: 'dress', bottomC: '#d07a8a', apron: true },
    roof: ['#c87a5a', '#a85a40', '#86442e'], shutter: ['#5e9a6a', '#467a50'],
    likes: ['jam_raspberry', 'raspberry', 'carrot', 'radish'],
    hello: ['Ой, здравствуй, милый!', 'Чайку попьём?', 'Красота у нас!'],
    gifts: { 2: { give: { geranium: 1 } }, 4: { give: { flowerbed: 2 }, coins: 50 } },
  },
  kolya: {
    name: 'Дядя Коля',
    look: { hair: '#4a3a2a', style: 'cap', hat: '#3a5a8a', mustache: '#4a3a2a', top: '#3a5a8a', topD: '#2a4a70', bottom: 'pants', bottomC: '#3a5a8a', overalls: true },
    roof: ['#9aa86a', '#7a8a50', '#5e6c3c'], shutter: [ '#5a86b6', '#41658f'],
    likes: ['stone', 'pumpkin', 'wood', 'potato'],
    hello: ['Привет, хозяин!', 'Трактор починил!', 'Работа кипит!'],
    gifts: { 2: { give: { lantern: 2 } }, 4: { give: { chest: 1 }, coins: 50 } },
  },
  masha: {
    name: 'Маша',
    kid: true,
    look: { hair: '#d8a050', style: 'bows', bow: '#e05a6a', top: '#f0d070', topD: '#d8b050', bottom: 'dress', bottomC: '#f0d070' },
    roof: ['#d89a6a', '#b87a4a', '#946036'], shutter: ['#e07a8a', '#b85a6a'],
    likes: ['currant', 'raspberry', 'sunflower', 'pie'],
    hello: ['Привет! А котик где?', 'Пошли на речку!', 'Смотри, бабочка!'],
    gifts: { 2: { give: { birdhouse: 1 } }, 4: { give: { geranium: 2 }, coins: 30 } },
  },
};
export const VILLAGER_ORDER = ['mitya', 'valya', 'kolya', 'masha'];

// Сельпо работает каждый день
export const SELPO = {
  open: 8 * 60, close: 20 * 60,
  stock: [
    { item: 'seed_radish', price: 4 }, { item: 'seed_carrot', price: 8 }, { item: 'seed_potato', price: 8 },
    { item: 'seed_cucumber', price: 12 }, { item: 'seed_sunflower', price: 12 }, { item: 'seed_pumpkin', price: 25 },
    { item: 'jar', price: 4 }, { item: 'pie', price: 20 },
  ],
};
