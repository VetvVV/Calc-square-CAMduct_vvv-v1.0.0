@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=D:\CalcSquare\Calc-square-CAMduct_vvv-v1.0.0"
set "SITE_URL=https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html"

cd /d "%ROOT%" || exit /b 1

if not exist "logs" mkdir "logs"
set "LOG=%ROOT%\logs\publish-mobile.log"

for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH-mm-ss'"`) do set "STAMP=%%T"
set "COMMIT_MSG=Mobile publish - %STAMP%"
set "BUILD_LABEL="

call :log ""
call :log "========================================"
call :log "Mobile publish started: %STAMP%"
call :log "Workspace: %CD%"

if exist "scripts\update-build.ps1" (
    call :log "Updating build number..."
    set "BUILD_TMP=%TEMP%\calc-square-mobile-build-%RANDOM%.txt"
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\update-build.ps1" > "!BUILD_TMP!" 2>> "%LOG%"
    if errorlevel 1 (
        call :log "ERROR: Build update failed."
        if exist "!BUILD_TMP!" del "!BUILD_TMP!" >nul 2>&1
        exit /b 1
    )
    for /f "usebackq delims=" %%B in ("!BUILD_TMP!") do set "BUILD_LABEL=%%B"
    if exist "!BUILD_TMP!" del "!BUILD_TMP!" >nul 2>&1
    if defined BUILD_LABEL call :log "!BUILD_LABEL!"
) else (
    call :log "scripts\update-build.ps1 not found. Build update skipped."
)

if not exist "check-roles.bat" (
    call :log "ERROR: check-roles.bat not found."
    exit /b 1
)

call :log "Running role checks..."
if defined BUILD_LABEL (
    call "check-roles.bat" "--build=!BUILD_LABEL!" >> "%LOG%" 2>&1
) else (
    call "check-roles.bat" >> "%LOG%" 2>&1
)
if errorlevel 1 (
    call :log "ERROR: Role check failed. Publication stopped."
    exit /b 1
)
call :log "Role check passed."

call :log "Git status before staging:"
git status --short >> "%LOG%" 2>&1
if errorlevel 1 (
    call :log "ERROR: git status failed."
    exit /b 1
)

call :log "Staging changes..."
git add -A -- . ":(exclude)logs/**" >> "%LOG%" 2>&1
if errorlevel 1 (
    call :log "ERROR: git add failed."
    exit /b 1
)

git diff --cached --quiet >> "%LOG%" 2>&1
set "DIFF_EXIT=%ERRORLEVEL%"
if "%DIFF_EXIT%"=="0" (
    call :log "No staged changes to publish. Finished without error."
    exit /b 0
)
if not "%DIFF_EXIT%"=="1" (
    call :log "ERROR: git diff --cached failed."
    exit /b %DIFF_EXIT%
)

call :log "Creating commit: %COMMIT_MSG%"
git commit -m "%COMMIT_MSG%" >> "%LOG%" 2>&1
if errorlevel 1 (
    call :log "ERROR: git commit failed."
    exit /b 1
)

call :log "Pulling with rebase..."
git pull --rebase origin main >> "%LOG%" 2>&1
if errorlevel 1 (
    call :log "ERROR: git pull --rebase failed. Resolve conflicts and run again."
    exit /b 1
)

call :log "Pushing to GitHub..."
git push origin main >> "%LOG%" 2>&1
if errorlevel 1 (
    call :log "ERROR: git push failed."
    exit /b 1
)

call :log "Publication complete."
call :log "Site URL: %SITE_URL%"
exit /b 0

:log
echo %~1
>> "%LOG%" echo %~1
exit /b 0
