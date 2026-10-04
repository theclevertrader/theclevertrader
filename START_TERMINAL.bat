@echo off
title THE CLEVER TRADER — Institutional AI Hedge Fund Trading Terminal [PRODUCTION FAST LOCK]
color 0B

echo =====================================================================
echo   THE CLEVER TRADER — INSTITUTIONAL AI HEDGE FUND TRADING TERMINAL
echo               [HIGH-SPEED PRODUCTION ENGINE - ZERO LAG]
echo =====================================================================
echo.

:: Lock current directory to script location
cd /d "%~dp0"

:: Dynamic Node.js PATH discovery
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%USERPROFILE%\nodejs\node-v20.18.0-win-x64" set "PATH=%USERPROFILE%\nodejs\node-v20.18.0-win-x64;%PATH%"
    if exist "C:\Users\Dell\nodejs\node-v20.18.0-win-x64" set "PATH=C:\Users\Dell\nodejs\node-v20.18.0-win-x64;%PATH%"
)

set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=production
set PORT=3000

if not exist "node_modules" (
    echo [*] Installing dependencies first, please wait...
    call npm install
)

:: Pre-Flight Port 3000 Check
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":3000.*LISTENING"') do (
    echo [*] Clearing stale process on port 3000 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

:: Ensure Production Build Exists
if not exist ".next\BUILD_ID" (
    echo [*] Building optimized production engine (one-time fast build)...
    call npm run build
)

echo [*] Launching Terminal at http://localhost:3000...
start http://localhost:3000
npm start
pause
