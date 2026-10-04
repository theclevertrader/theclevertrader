@echo off
title THE CLEVER TRADER — MT5 Real-Time Python Bridge
color 0A
echo =====================================================================
echo       THE CLEVER TRADER — METATRADER 5 REAL-TIME BRIDGE
echo =====================================================================
echo.
echo [*] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [-] Python is not installed or not in PATH!
    echo.
    echo Please install Python 3.11 from:
    echo https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe
    echo.
    echo Make sure to check "Add python.exe to PATH" during installation!
    echo.
    pause
    exit /b 1
)

echo [+] Python is ready.
echo [*] Starting bridge script...
echo.
python "%~dp0mt5_bridge.py"
pause
