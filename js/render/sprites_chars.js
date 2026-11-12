// Персонажи: внучек (игрок), бабушка Нюра, рыжий котик. Всё рисуется кодом.
import { C, spr, R, P } from './pixel.js';

// Игрок: 16x20, ноги внизу. dir: down/up/left/right; frame 0..2; pose: walk/work
export function kidSprite(dir, frame, pose = 'walk', look = {}) {
  const shirt = look.shirt || C.white, stripe = look.stripe || '#4f74ad';
  const hat = look.hat || '#f1ead6', hatD = look.hatD || '#d6ccb2';
  const shorts = look.shorts || '#3f5f8f', hair = look.hair || '#9a6236';
  const k = `kid-${dir}-${frame}-${pose}-${shirt}-${hat}`;
  return spr(k, 16, 20, g => {
    const side = dir === 'left' || dir === 'right';
    const flip = dir === 'left';
    const X = x => (flip ? 15 - x : x);
    const px = (x, y, c) => P(g, X(x), y, c);
    const rect = (x, y, w, h, c) => { for (let i = 0; i < w; i++) R(g, X(x + i), y, 1, h, c); };
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    // ноги
    if (!side) {
      rect(6, 16, 1, 2 - (step > 0 ? 1 : 0), C.skin); rect(9, 16, 1, 2 - (step < 0 ? 1 : 0), C.skin);
      rect(5, 18 - (step > 0 ? 1 : 0), 2, 1, C.woodD); rect(9, 18 - (step < 0 ? 1 : 0), 2, 1, C.woodD);
    } else {
      if (step === 0) { rect(7, 16, 2, 2, C.skin); rect(7, 18, 3, 1, C.woodD); }
      else { rect(5, 16, 1, 2, C.skin); rect(10, 16, 1, 2, C.skin); rect(4, 18, 2, 1, C.woodD); rect(10, 18, 2, 1, C.woodD); }
    }
    // шорты
    rect(5, 14, 6, 2, shorts); if (!side) px(7, 15, '#2f4a70');
    // рубашка-тельняшка
    const by = 10;
    rect(5, by, 6, 4, shirt); rect(5, by + 1, 6, 1, stripe); rect(5, by + 3, 6, 1, stripe);
    if (side) { rect(10, by, 1, 4, C.whiteD); }
    // руки
    if (pose === 'work') {
      if (!side) { rect(4, by - 1, 1, 2, shirt); rect(11, by - 1, 1, 2, shirt); px(4, by - 2, C.skin); px(11, by - 2, C.skin); }
      else { rect(9, by, 2, 1, shirt); px(11, by, C.skin); }
    } else if (!side) {
      rect(4, by + (step > 0 ? 0 : 0), 1, 3, shirt); px(4, by + 3, C.skin);
      rect(11, by, 1, 3, shirt); px(11, by + 3, C.skin);
    } else {
      const ax = 7 + step;
      rect(ax, by + 1, 1, 2, C.whiteD); px(ax, by + 3, C.skin);
    }
    // голова
    const hy = 6;
    if (dir === 'down') {
      rect(5, hy, 6, 4, C.skin); px(4, hy, hair); px(11, hy, hair);
      px(6, hy + 1, C.ink); px(9, hy + 1, C.ink); px(5, hy + 2, C.cheek); px(10, hy + 2, C.cheek);
      px(7, hy + 3, C.skinD); px(8, hy + 3, C.skinD);
    } else if (dir === 'up') {
      rect(5, hy, 6, 4, hair); rect(5, hy + 3, 6, 1, '#7a4a26'); px(4, hy + 1, C.skin); px(11, hy + 1, C.skin);
    } else {
      rect(5, hy, 6, 4, C.skin); rect(5, hy, 2, 3, hair); px(9, hy + 1, C.ink); px(11, hy + 2, C.skin); px(10, hy + 2, C.cheek);
    }
    // панамка
    rect(5, 2, 6, 3, hat); rect(6, 1, 4, 1, hat); rect(3, 5, 10, 1, hat); rect(3, 5, 10, 1, hatD);
    rect(4, 4, 8, 1, hat); px(10, 3, hatD); px(10, 2, hatD);
    if (dir !== 'up') rect(5, 4, 6, 1, '#c96a50');
  });
}

// Бабушка в платочке и фартуке
export function grannySprite(dir, frame) {
  return spr(`granny-${dir}-${frame}`, 16, 20, g => {
    const flip = dir === 'left';
    const X = x => (flip ? 15 - x : x);
    const px = (x, y, c) => P(g, X(x), y, c);
    const rect = (x, y, w, h, c) => { for (let i = 0; i < w; i++) R(g, X(x + i), y, 1, h, c); };
    const side = dir === 'left' || dir === 'right';
    const scarf = '#c0453a', dot = '#f4e6d0', dress = '#4b5a8a', dressD = '#3a4670', apron = '#ece4d2';
    // ноги
    const st = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    rect(5 + (st > 0 ? -1 : 0), 18, 2, 1, C.woodDD); rect(9 + (st < 0 ? 1 : 0), 18, 2, 1, C.woodDD);
    // платье колоколом
    rect(5, 10, 6, 3, dress); rect(4, 13, 8, 3, dress); rect(3, 16, 10, 2, dress); rect(3, 17, 10, 1, dressD);
    if (!side && dir === 'down') { rect(6, 11, 4, 6, apron); rect(6, 16, 4, 1, C.whiteD); px(7, 13, C.red); px(8, 14, C.red); }
    if (side) rect(9, 11, 2, 6, apron);
    // руки
    if (!side) { rect(4, 10, 1, 3, dress); px(4, 13, C.skin); rect(11, 10, 1, 3, dress); px(11, 13, C.skin); }
    else { rect(7 + st, 11, 1, 3, dressD); px(7 + st, 14, C.skin); }
    // голова и платок в горошек
    if (dir === 'down') {
      rect(6, 5, 4, 4, C.skin); px(6, 6, C.ink); px(9, 6, C.ink); px(6, 7, C.cheek); px(9, 7, C.cheek);
      px(7, 8, '#b06a5a'); px(8, 8, '#b06a5a');
      rect(5, 2, 6, 3, scarf); rect(4, 4, 1, 5, scarf); rect(11, 4, 1, 5, scarf); rect(6, 1, 4, 1, scarf);
      px(5, 4, scarf); px(10, 4, scarf); rect(7, 9, 2, 1, scarf); px(6, 10, scarf); px(9, 10, scarf);
      px(6, 2, dot); px(9, 3, dot); px(4, 6, dot); px(11, 7, dot); px(8, 1, dot);
      px(7, 4, '#c8c8c8'); px(8, 4, '#c8c8c8');
    } else if (dir === 'up') {
      rect(5, 2, 6, 7, scarf); rect(6, 1, 4, 1, scarf); rect(6, 9, 4, 2, scarf); px(7, 11, scarf); px(8, 12, scarf);
      px(6, 3, dot); px(9, 5, dot); px(7, 7, dot); px(10, 8, dot);
    } else {
      rect(7, 5, 4, 4, C.skin); px(9, 6, C.ink); px(10, 7, C.cheek); px(11, 6, C.skin);
      rect(5, 2, 6, 3, scarf); rect(5, 4, 3, 6, scarf); rect(6, 1, 4, 1, scarf); px(4, 9, scarf); px(4, 10, scarf);
      px(6, 3, dot); px(9, 2, dot); px(6, 7, dot);
    }
  });
}

// Котик: 16x12. pose: walk0/walk1/sit/sleep/fence; смотрит вправо (отражаем при отрисовке)
export function catSprite(pose) {
  return spr('cat-' + pose, 16, 12, g => {
    const o = '#e3984a', d = '#c07330', l = '#f6cf92', e = '#5a8a2a';
    if (pose === 'sleep') {
      // калачиком
      R(g, 3, 6, 10, 5, o); R(g, 4, 5, 8, 1, o); R(g, 2, 7, 1, 3, o); R(g, 13, 7, 1, 3, o);
      R(g, 5, 6, 1, 3, d); R(g, 8, 5, 1, 3, d); R(g, 11, 6, 1, 3, d);
      R(g, 3, 10, 10, 1, d);
      R(g, 9, 7, 4, 3, l); P(g, 10, 8, C.ink); P(g, 11, 8, C.ink); P(g, 9, 6, o); P(g, 12, 6, o); P(g, 9, 5, d); P(g, 12, 5, d);
      R(g, 2, 9, 7, 2, d); R(g, 3, 9, 5, 1, o);
      return;
    }
    if (pose === 'sit' || pose === 'fence') {
      // сидит боком, хвост обвит
      R(g, 5, 5, 6, 6, o); R(g, 6, 4, 4, 1, o); R(g, 6, 7, 3, 4, l);
      R(g, 9, 1, 5, 4, o); P(g, 9, 0, o); P(g, 13, 0, o); P(g, 10, 1, d); P(g, 12, 1, d);
      P(g, 12, 2, e); P(g, 10, 2, e); P(g, 11, 3, C.pink); R(g, 9, 4, 4, 1, l);
      R(g, 5, 6, 1, 2, d); R(g, 7, 5, 1, 1, d);
      R(g, 2, 10, 6, 1, o); P(g, 2, 9, o); P(g, 1, 8, d); R(g, 4, 10, 1, 1, d);
      R(g, 7, 11, 1, 1, l); R(g, 9, 11, 1, 1, l);
      return;
    }
    const f = pose === 'walk1';
    // идёт
    R(g, 3, 5, 9, 4, o); R(g, 4, 8, 7, 1, l);
    R(g, 5, 5, 1, 2, d); R(g, 7, 5, 1, 2, d); R(g, 9, 5, 1, 2, d);
    R(g, 10, 2, 5, 4, o); P(g, 10, 1, o); P(g, 14, 1, o); P(g, 11, 2, d);
    P(g, 13, 3, e); P(g, 14, 4, C.pink); R(g, 11, 5, 3, 1, l);
    // хвост
    P(g, 2, 5, o); P(g, 1, 4, o); P(g, 1, 3, d); P(g, 2, 2, o);
    // лапки
    if (f) { P(g, 4, 9, o); P(g, 4, 10, o); P(g, 7, 9, o); P(g, 9, 9, o); P(g, 9, 10, o); P(g, 11, 9, o); }
    else { P(g, 3, 9, o); P(g, 5, 9, o); P(g, 5, 10, o); P(g, 8, 9, o); P(g, 10, 9, o); P(g, 10, 10, o); }
  });
}
