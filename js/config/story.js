// Обучение (бабушка Нюра ведёт по шагам), задания, автолавка, развитие поселения.

// Шаги обучения. say — коротко, 3-6 слов. icon — картинка рядом с текстом.
// target — что подсветить. done(state, p) — когда шаг выполнен.
// start — что дать/открыть, когда шаг начинается.
export const TUTORIAL = [
  { say: 'Здравствуй! Срубишь берёзку?', icon: 'axe', target: { obj: 'birch' },
    done: s => s.stats.chopped >= 1 },
  { say: 'Теперь набери камешков', icon: 'pickaxe', target: { obj: 'rock' },
    done: s => s.stats.mined >= 1 },
  { say: 'Собери ягодки с куста', icon: 'currant', target: { kind: 'bush' },
    done: s => s.stats.picked >= 1 },
  { say: 'Сделай заборчик в рюкзаке', icon: 'fence', target: { ui: 'backpack' },
    start: { unlock: ['backpack'] }, done: s => s.stats.crafted >= 1 },
  { say: 'Поставь заборчик', icon: 'build', target: { ui: 'build' },
    start: { unlock: ['build'] }, done: s => s.stats.built >= 1 },
  { say: 'Вскопай грядку', icon: 'shovel', target: { ground: 'p' },
    start: { recipes: ['gate', 'path', 'gardenbed'] }, done: s => s.stats.tilled >= 1 },
  { say: 'Вот семена. Посади редиску!', icon: 'seed_radish', target: { soil: 'empty' },
    start: { give: { seed_radish: 6 } }, done: s => s.stats.planted >= 1 },
  { say: 'Полей водичкой', icon: 'can', target: { soil: 'dry' },
    done: s => s.stats.watered >= 1 },
  { say: 'Лишнее — в ящик у калитки', icon: 'sellbox', target: { kind: 'sellbox' },
    done: s => s.stats.boxed >= 1 },
  { say: 'Ночью продастся. Поспи в доме', icon: 'bed', target: { kind: 'house' },
    done: s => s.day >= 2 },
  { say: 'Заходи ко мне в гости!', icon: 'granny', target: { npc: 'granny' },
    start: { recipes: ['chest', 'bench', 'flowerbed', 'shovel2', 'jam_currant', 'jam_raspberry'], give: { jar: 3 } },
    done: s => s.stats.talks >= 1 },
];

// Задания бабушки — по порядку. need — что принести, reward — награда.
export const QUESTS = [
  { say: 'Принеси 3 редиски к обеду', need: { radish: 3 }, reward: { give: { seed_carrot: 5 }, coins: 10 } },
  { say: 'Нужны дрова для печки', need: { wood: 10 }, reward: { give: { seed_potato: 6 } } },
  { say: 'Свари варенья на печке', need: { jam_currant: 1 }, reward: { give: { seed_cucumber: 4, jar: 3 }, recipes: ['pickles'] } },
  { say: 'Помоги выкопать картошку', need: { potato: 6 }, reward: { give: { seed_sunflower: 3, seed_pumpkin: 2 }, coins: 20 } },
  { say: 'Морковки бы для супа', need: { carrot: 4 }, reward: { recipes: ['lantern'], give: { lantern: 1 } } },
  { say: 'Угости огурчиками солёными', need: { pickles: 1 }, reward: { give: { birdhouse: 1 }, coins: 30 } },
  { say: 'Покажи большую тыкву!', need: { pumpkin: 1 }, reward: { coins: 100, give: { geranium: 1 } } },
];
// После списка бабушка просит что-то простое каждый день
export const DAILY_ASKS = ['radish', 'carrot', 'potato', 'cucumber', 'currant', 'raspberry', 'wood', 'stone'];

export const GRANNY_LINES = {
  hello: ['Здравствуй, внучек!', 'Доброе утречко!', 'Ой, кто пришёл!'],
  pie: 'Держи пирожок с капустой',
  thanks: 'Спасибо, золотце!',
  later: 'Заходи завтра, поболтаем',
};

// Автолавка: приезжает в день shopFirst, затем раз в shopEvery дней, с 8:00 до 19:00.
export const SHOP = {
  first: 2, every: 3, open: 8 * 60, close: 19 * 60,
  stock: [
    { item: 'seed_radish', price: 4 }, { item: 'seed_carrot', price: 8 },
    { item: 'seed_potato', price: 8 }, { item: 'seed_cucumber', price: 12 },
    { item: 'seed_sunflower', price: 12 }, { item: 'seed_pumpkin', price: 25 },
    { item: 'jar', price: 4 },
    { tool: ['can', 2], price: 60, name: 'Большая лейка' },
    { item: 'geranium', price: 25 }, { item: 'birdhouse', price: 40 }, { item: 'scarecrow', price: 40 },
  ],
};

// Развитие поселения. Цель — либо счётчик stat, либо функция count(state).
const countObj = type => s => Object.values(s.scenes.outside.objects).filter(o => o.type === type).length;
export const STAGES = [
  { id: 'hutor', name: 'Хутор', goals: [
    { stat: 'earned', n: 300, icon: 'coin' },
    { stat: 'harvested', n: 30, icon: 'radish' },
    { stat: 'built', n: 20, icon: 'fence' },
    { stat: 'quests', n: 5, icon: 'granny' },
  ],
    // что открывается при переходе на следующую стадию
    next: { recipes: ['cottage', 'selpo', 'banya', 'club'] } },
  { id: 'derevnya', name: 'Деревня', goals: [
    { count: s => Object.values(s.villagers || {}).filter(v => v.home).length, n: 4, icon: 'cottage' },
    { count: s => (countObj('selpo')(s) ? 1 : 0) + (countObj('banya')(s) ? 1 : 0) + (countObj('club')(s) ? 1 : 0), n: 3, icon: 'club' },
    { stat: 'earned', n: 1500, icon: 'coin' },
    { count: s => Object.values(s.villagers || {}).reduce((a, v) => a + (v.hearts || 0), 0), n: 12, icon: 'heart' },
  ] },
  { id: 'selo', name: 'Село' },
  { id: 'pgt', name: 'Посёлок' },
];

export const goalValue = (state, g) => (g.count ? g.count(state) : (state.stats[g.stat] || 0));

export function stageProgress(state) {
  const st = STAGES[state.stage || 0];
  if (!st.goals) return 0;
  let sum = 0;
  for (const g of st.goals) sum += Math.min(1, goalValue(state, g) / g.n);
  return sum / st.goals.length;
}
// Можно ли перейти на следующую стадию (у следующей стадии должны быть свои цели — иначе она ещё «в будущем»)
export function canStageUp(state) {
  const nx = STAGES[(state.stage || 0) + 1];
  return !!(nx && nx.goals && stageProgress(state) >= 1);
}

export const GRANNY_VILLAGE = {
  ready: 'Пора нам деревней становиться!',
  build: 'Построй избу — приедут жители',
};
