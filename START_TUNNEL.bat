@echo off
title THE CLEVER TRADER — CLOUDFLARE ULTRA-FAST WEBHOOK TUNNEL
color 0b
echo ==============================================================================
echo        THE CLEVER TRADER — CLOUDFLARE HIGH-SPEED WEBHOOK TUNNEL
echo ==============================================================================
echo Launching Cloudflare zero-timeout tunnel for TradingView alerts...
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%USERPROFILE%\nodejs\node-v20.18.0-win-x64" set "PATH=%USERPROFILE%\nodejs\node-v20.18.0-win-x64;%PATH%"
    if exist "C:\Users\Dell\nodejs\node-v20.18.0-win-x64" set "PATH=C:\Users\Dell\nodejs\node-v20.18.0-win-x64;%PATH%"
)
node cloudflare_tunnel.mjs
pause
