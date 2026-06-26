@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo === Calc Square — быстрая публикация (надёжная) ===
echo.
echo [1/4] Обновляю номер сборки и кэш-токены...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-build.ps1" >nul 2>nul
echo [2/4] Готовлю коммит...
git add -A
git commit -m "publish %date% %time%" >nul 2>nul
echo [3/4] Синхронизируюсь с GitHub...
git pull --rebase origin main
if errorlevel 1 (
    echo     Конфликт rebase — откатываю и тяну обычным способом...
    git rebase --abort >nul 2>nul
    git pull --no-rebase origin main
)
echo [4/4] Отправляю на сайт...
git push origin main
if errorlevel 1 (
    echo.
    echo [!] Push не прошёл. Проверьте: вход в GitHub, интернет, что это ваш репозиторий.
    pause
    exit /b 1
)
echo.
echo Готово! Открываю ваш сайт...
start "" "https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?v=published"
echo.
echo Если на сайте всё ещё старая версия — нажмите Ctrl+Shift+R
echo (GitHub Pages обновляется 1-2 минуты).
pause
