@echo off
title THE CLEVER TRADER — EMERGENCY STOP ALL ENGINES
color 0c
cls
echo ==============================================================================
echo        THE CLEVER TRADER — EMERGENCY STOP ^& CLEANUP
echo        [Kills all stealth background processes cleanly]
echo ==============================================================================
echo.
echo [*] Stopping all Clever Trader engines and bridges...

:: Kill Node.js processes (Next.js server)
echo [*] Stopping Web Engine (Node.js)...
taskkill /F /IM node.exe 2>nul
echo [+] Node.js processes terminated.

:: Kill Python MT5 Bridge processes
echo [*] Stopping MT5 Python Bridge...
powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'python.exe' -and ($_.CommandLine -match 'mt5_bridge') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>nul
echo [+] Python bridge processes terminated.

:: Kill any Cloudflare tunnel processes
echo [*] Stopping Cloudflare Tunnel...
taskkill /F /IM cloudflared.exe 2>nul
echo [+] Cloudflare tunnel terminated.

:: Kill lingering cmd windows from hidden processes
powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'cmd.exe' -and ($_.CommandLine -match 'mt5_bridge|npm start|START_TUNNEL') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>nul

:: Kill wscript orphans
taskkill /F /FI "WINDOWTITLE eq THE CLEVER TRADER*" 2>nul

echo.
echo ==============================================================================
echo [DONE] All Clever Trader engines stopped cleanly.
echo   Logs preserved in: logs\mt5_bridge.log, logs\server.log, logs\tunnel.log
echo ==============================================================================
timeout /t 2 /nobreak >nul
exit
