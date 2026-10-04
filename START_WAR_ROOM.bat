@echo off
title THE CLEVER TRADER — CYBER WAR ROOM HUD
cls
echo ==============================================================================
echo        THE CLEVER TRADER — CYBER WAR ROOM HUD (MATRIX RADAR TERMINAL)
echo ==============================================================================
cd /d "%~dp0"
if not exist "START_BOT.bat" cd /d "C:\Users\Dell\clever trader"

:: Check if port 3000 is active
netstat -aon | findstr /r ":3000.*LISTENING" >nul
if %ERRORLEVEL% neq 0 (
    echo [*] Port 3000 is offline. Initializing Clever Trader terminal engines...
    call START_BOT.bat
    exit /b 0
)

set "CHROME_BIN="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined CHROME_BIN (
    if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_BIN (
    if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_BIN (
    if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "CHROME_BIN=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

echo [*] Launching Cyber War Room HUD in Dedicated Application Window...
if defined CHROME_BIN (
    start "" "%CHROME_BIN%" --app=http://localhost:3000/war-room --disable-frame-rate-limit --disable-gpu-vsync --start-maximized
) else (
    start http://localhost:3000/war-room
)
