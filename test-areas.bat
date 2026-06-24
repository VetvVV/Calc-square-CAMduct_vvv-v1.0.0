@echo off
setlocal
set "ROOT=%~dp0"
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "CODEX_NODE_MODULES=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules"
set "CODEX_PNPM_MODULES=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules"
if exist "%CODEX_NODE%" ( set "NODE_EXE=%CODEX_NODE%" ) else ( set "NODE_EXE=node" )
set "NODE_PATH=%CODEX_NODE_MODULES%;%CODEX_PNPM_MODULES%;%NODE_PATH%"
"%NODE_EXE%" "%ROOT%scripts\test-areas.js" %*
if errorlevel 1 (
    echo.
    echo Area tests failed.
    exit /b 1
)
echo.
echo Area tests passed.
exit /b 0
