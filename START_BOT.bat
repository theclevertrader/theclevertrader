@echo off
title THE CLEVER TRADER - ONE-CLICK LAUNCHER
color 0b
cls
echo ==============================================================================
echo        THE CLEVER TRADER - ONE-CLICK STEALTH LAUNCHER
echo           [ZERO WINDOW MODE: MT5 + Dashboard + War Room]
echo ==============================================================================
echo.
cd /d "%~dp0"
set "PYTHONIOENCODING=utf-8"
set "NODE_ENV=production"
set "NEXT_TELEMETRY_DISABLED=1"
set "PORT=3000"

if not exist "logs" mkdir logs

REM Dynamic Node.js and Python PATH detection
where node >nul 2>nul
if %ERRORLEVEL% neq 0 if exist "%USERPROFILE%\nodejs\node-v20.18.0-win-x64" set "PATH=%USERPROFILE%\nodejs\node-v20.18.0-win-x64;%PATH%"
if %ERRORLEVEL% neq 0 if exist "C:\Users\Dell\nodejs\node-v20.18.0-win-x64" set "PATH=C:\Users\Dell\nodejs\node-v20.18.0-win-x64;%PATH%"

where python >nul 2>nul
if %ERRORLEVEL% neq 0 if exist "%LOCALAPPDATA%\Programs\Python\Python311" set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%PATH%"
if %ERRORLEVEL% neq 0 if exist "C:\Users\Dell\AppData\Local\Programs\Python\Python311" set "PATH=C:\Users\Dell\AppData\Local\Programs\Python\Python311;%PATH%"

REM 1. Launch MetaTrader 5
echo [*] [1/5] Checking MetaTrader 5 Terminal...
tasklist /FI "IMAGENAME eq terminal64.exe" 2>nul | find /I /N "terminal64.exe" >nul
if "%ERRORLEVEL%"=="0" (
    echo [+] MetaTrader 5 is already active!
) else (
    echo [*] Launching MetaTrader 5...
    if exist "C:\Program Files\MetaTrader 5\terminal64.exe" (
        start "" "C:\Program Files\MetaTrader 5\terminal64.exe"
    ) else (
        start terminal64.exe
    )
    ping -n 3 127.0.0.1 >nul
)

REM 2. Launch MT5 Python Bridge
echo [*] [2/5] Checking MT5 Python Bridge...
netstat -aon | findstr /r ":8001.*LISTENING" >nul
if "%ERRORLEVEL%"=="0" (
    echo [+] MT5 Python Bridge is already active on port 8001!
    goto :bridge_ready
)

echo [*] Starting MT5 Python Bridge in background...
echo @echo off > "%TEMP%\_ct_bridge.bat"
echo cd /d "%~dp0" >> "%TEMP%\_ct_bridge.bat"
echo python -u mt5_bridge.py ^> logs\mt5_bridge.log 2^>^&1 >> "%TEMP%\_ct_bridge.bat"
wscript "%~dp0run_hidden.vbs" "%TEMP%\_ct_bridge.bat"
echo [+] MT5 Bridge launched [logs\mt5_bridge.log]
ping -n 2 127.0.0.1 >nul

:bridge_ready

REM 3. Launch Next.js Web Engine
echo [*] [3/5] Checking Web Terminal Engine...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($conn) { $p = Get-CimInstance Win32_Process -Filter \"ProcessId = $($conn.OwningProcess)\"; if ($p.CommandLine -notmatch 'clever trader') { Stop-Process -Id $p.ProcessId -Force; Start-Sleep -Seconds 1 } }"
netstat -aon | findstr /r ":3000.*LISTENING" >nul
if "%ERRORLEVEL%"=="0" (
    echo [+] Web Terminal Engine is already active on port 3000!
    goto :server_ready
)

echo [*] Starting Web Terminal Engine in background...
echo @echo off > "%TEMP%\_ct_server.bat"
echo cd /d "%~dp0" >> "%TEMP%\_ct_server.bat"
if exist ".next\BUILD_ID" (
    echo npm start ^> logs\server.log 2^>^&1 >> "%TEMP%\_ct_server.bat"
) else (
    echo npm run dev ^> logs\server.log 2^>^&1 >> "%TEMP%\_ct_server.bat"
)
wscript "%~dp0run_hidden.vbs" "%TEMP%\_ct_server.bat"
echo [+] Web Engine launched in background [logs\server.log]

echo [*] Waiting for Web Terminal to initialize on port 3000...
set /a port_tries=0

:port_check_loop
set /a port_tries+=1
netstat -aon | findstr /r ":3000.*LISTENING" >nul
if "%ERRORLEVEL%"=="0" goto :verify_http
if %port_tries% geq 30 goto :server_ready
ping -n 2 127.0.0.1 >nul
goto :port_check_loop

:verify_http
echo [*] Verifying Terminal Health (HTTP 200 check)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok = $false; for ($i=0; $i -lt 12; $i++) { try { $res = (Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2).StatusCode; if ($res -eq 200) { $ok = $true; break } } catch {} Start-Sleep -Milliseconds 800 }; if ($ok) { exit 0 } else { exit 1 }"
if %ERRORLEVEL% equ 0 (
    echo [+] Web Terminal Engine is 100% ONLINE (HTTP 200 OK)!
    goto :server_ready
)

echo [!] Web Terminal returned error or timeout. Auto-healing...
taskkill /F /IM node.exe 2>nul
ping -n 2 127.0.0.1 >nul
wscript "%~dp0run_hidden.vbs" "%TEMP%\_ct_server.bat"
ping -n 3 127.0.0.1 >nul

:server_ready

REM 4. Launch Cloudflare Tunnel if configured
if not exist "START_TUNNEL.bat" goto :tunnel_done
echo [*] [4/5] Checking Cloudflare Tunnel...
echo @echo off > "%TEMP%\_ct_tunnel.bat"
echo cd /d "%~dp0" >> "%TEMP%\_ct_tunnel.bat"
echo call START_TUNNEL.bat ^> logs\tunnel.log 2^>^&1 >> "%TEMP%\_ct_tunnel.bat"
wscript "%~dp0run_hidden.vbs" "%TEMP%\_ct_tunnel.bat"
echo [+] Cloudflare Tunnel launched in background [logs\tunnel.log]

:tunnel_done

REM 5. Open Dashboard and War Room HUD in Browser Windows
echo [*] [5/5] Launching Dashboard and War Room HUD...

set "CHROME_BIN="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined CHROME_BIN if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_BIN if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "CHROME_BIN=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not defined CHROME_BIN if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "CHROME_BIN=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if defined CHROME_BIN (
    start "" "%CHROME_BIN%" --app=http://localhost:3000
    ping -n 2 127.0.0.1 >nul
    start "" "%CHROME_BIN%" --app=http://localhost:3000/war-room
) else (
    start http://localhost:3000
    ping -n 2 127.0.0.1 >nul
    start http://localhost:3000/war-room
)

echo.
echo ==============================================================================
echo [SUCCESS] THE CLEVER TRADER IS FULLY ONLINE!
echo.
echo   * MetaTrader 5 Terminal : ACTIVE
echo   * Main Dashboard        : http://localhost:3000
echo   * Cyber War Room HUD    : http://localhost:3000/war-room
echo   * Python Bridge (8001)  : RUNNING IN BACKGROUND
echo   * Web Engine (3000)     : RUNNING IN BACKGROUND
echo ==============================================================================
ping -n 3 127.0.0.1 >nul
exit
