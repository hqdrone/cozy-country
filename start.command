#!/bin/bash
# Запуск игры на Mac: двойной щелчок по этому файлу.
cd "$(dirname "$0")"
PORT=8123
( sleep 1; open "http://localhost:$PORT/" ) &
echo "Хутор запущен: http://localhost:$PORT/  (закройте это окно, чтобы остановить)"
python3 -m http.server $PORT
