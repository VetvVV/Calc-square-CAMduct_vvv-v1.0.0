@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

echo Calc Square publication helper
echo Workspace: %CD%
echo.

echo Updating build number...
for /f "usebackq delims=" %%B in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-build.ps1"`) do set "BUILD_LABEL=%%B"
if errorlevel 1 (
    echo.
    echo Build update failed. Publication stopped.
    pause
    exit /b 1
)
echo %BUILD_LABEL%
echo.

echo Running publication validation...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\validate-publish.ps1"
if errorlevel 1 (
    echo.
    echo Publication validation failed. Publication stopped.
    pause
    exit /b 1
)
echo.

git --version >nul 2>nul
if errorlevel 1 (
    echo Git was not found. Publication stopped.
    pause
    exit /b 1
)

if exist "check-roles.bat" (
    echo Running role checks...
    call "check-roles.bat" "--build=%BUILD_LABEL%"
    if errorlevel 1 (
        echo.
        echo [предупреждение] Проверка ролей не прошла или Playwright не установлен - публикую дальше.
    )
    echo.
)

if exist "test-areas.bat" (
    echo Running area regression tests...
    call "test-areas.bat"
    if errorlevel 1 (
        echo.
        echo [предупреждение] Тест площадей не прошёл или Playwright не установлен - публикую дальше.
    )
    echo.
)

git status --short
echo.
if exist "PUBLISH_CHECKLIST.md" (
    echo Quick reminder before publishing:
    echo  - Local home page opens
    echo  - Guest/User/Client/Admin basics checked after major UI changes
    echo  - Saved file and language switch checked after localization/import changes
    echo  - GitHub page hard-refresh if an old build is still visible
    echo.
)
set "COMMIT_MSG_FILE=%TEMP%\CALC_SQUARE_COMMIT_MESSAGE.txt"
for /f "usebackq delims=" %%M in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\make-commit-message.ps1" -BuildLabel "%BUILD_LABEL%" -OutputPath "%COMMIT_MSG_FILE%"`) do set "DEFAULT_MSG=%%M"
if errorlevel 1 (
    echo.
    echo Commit message generation failed. Publication stopped.
    pause
    exit /b 1
)
echo Automatic commit message:
type "%COMMIT_MSG_FILE%"
echo.
set /p "PUBLISH_CONFIRM=Press Enter to publish with this message, type another title, or C to cancel: "

if /I "%PUBLISH_CONFIRM%"=="C" (
    echo Publication cancelled.
    pause
    exit /b 0
)

if not "%PUBLISH_CONFIRM%"=="" (
    > "%COMMIT_MSG_FILE%" echo %PUBLISH_CONFIRM%
    >> "%COMMIT_MSG_FILE%" echo.
    >> "%COMMIT_MSG_FILE%" echo %BUILD_LABEL%
)

echo.
echo Staging changes...
git add -A
if errorlevel 1 (
    echo.
    echo Staging failed. Publication stopped.
    pause
    exit /b 1
)

git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes to publish.
    pause
    exit /b 0
)

echo.
git status --short
echo.
echo Creating commit...
git commit -F "%COMMIT_MSG_FILE%"
if errorlevel 1 (
    echo.
    echo Commit failed. Publication stopped.
    pause
    exit /b 1
)

echo.
echo Updating local branch from GitHub...
git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo Pull/rebase failed. Resolve the conflict, then run publish.bat again.
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo Push failed. Publication stopped.
    pause
    exit /b 1
)

echo.
echo Publication complete.
echo Site:
echo https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html
start "" "https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?v=published"
pause
