@echo off
rem Запуск игры на Windows: двойной щелчок по этому файлу.
cd /d "%~dp0"
set PORT=8123
start "" http://localhost:%PORT%/
python -m http.server %PORT% || py -m http.server %PORT%
