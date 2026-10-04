@echo off
title THE CLEVER TRADER — Master All-In-One Launcher
color 0A

echo =====================================================================
echo    THE CLEVER TRADER — LAUNCHING TERMINAL DASHBOARD & BOT
echo =====================================================================
echo.
echo [*] Launching Next.js Institutional Trading Terminal Dashboard...
start "CLEVER TRADER - DASHBOARD" cmd /k "call START_TERMINAL.bat"

timeout /t 4 /nobreak >nul

echo [*] Launching MetaTrader 5 Node Bridge Bot...
start "CLEVER TRADER - MT5 BOT BRIDGE" cmd /k "call START_MT5_NODE_BRIDGE.bat"

echo.
echo =====================================================================
echo [SUCCESS] Both Terminal Dashboard and MT5 Bot Bridge are launching!
echo Dashboard URL: http://localhost:3000
echo =====================================================================
echo.
pause
