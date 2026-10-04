@echo off
title THE CLEVER TRADER — MetaTrader 5 Node Bridge
color 0b
echo =====================================================================
echo       THE CLEVER TRADER — METATRADER 5 NODE.JS BRIDGE
echo =====================================================================
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%USERPROFILE%\nodejs\node-v20.18.0-win-x64" set "PATH=%USERPROFILE%\nodejs\node-v20.18.0-win-x64;%PATH%"
    if exist "C:\Users\Dell\nodejs\node-v20.18.0-win-x64" set "PATH=C:\Users\Dell\nodejs\node-v20.18.0-win-x64;%PATH%"
)
echo [*] Starting MetaTrader 5 Node Bridge...
echo [*] Connecting to local terminal at http://localhost:3000/api/mt5
echo.
node mt5_node_bridge.js
pause
