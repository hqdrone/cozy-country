// Точка входа
import { Game } from './client/game.js';

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  try {
    window.game = new Game(canvas);
  } catch (e) {
    console.error(e);
    document.getElementById('nofile').innerHTML = '<p>Что-то пошло не так 😿</p><p><small>' + e.message + '</small></p>';
    document.getElementById('nofile').classList.remove('hidden');
  }
});
