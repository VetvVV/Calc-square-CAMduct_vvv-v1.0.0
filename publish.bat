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
        echo Role check failed. Publication stopped.
        pause
        exit /b 1
    )
    echo.
)

git status --short
echo.
for /f "usebackq delims=" %%M in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$status=git status --short; $files=($status | ForEach-Object { if($_.Length -gt 3){ $_.Substring(3) } else { $_ } }) -join ';'; $parts=@(); if($files -match 'assets|home\.html|modules|scripts|publish\.bat'){$parts+='Update Calc Square'}; if($files -match 'PUBLISH_CHECKLIST\.md|README\.md|docs'){$parts+='Update docs'}; if($files -match 'index\.html'){$parts+='Update site entry page'}; if($parts.Count -eq 0){$parts+='Publish Calc Square'}; (($parts | Select-Object -Unique) -join '; ')"`) do set "AUTO_MSG=%%M"
set "DEFAULT_MSG=%AUTO_MSG% - %BUILD_LABEL%"
echo Suggested commit message:
echo %DEFAULT_MSG%
echo.
set /p "MSG=Enter publication description (Enter = suggested message): "

if "%MSG%"=="" (
    set "MSG=%DEFAULT_MSG%"
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
git commit -m "%MSG%"
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
echo https://vetvvv.github.io/calc-square-camduct-stspetsmontazh-v1/home.html
start "" "https://vetvvv.github.io/calc-square-camduct-stspetsmontazh-v1/home.html?v=published"
pause
