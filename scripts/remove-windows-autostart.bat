@echo off
title THE CLEVER TRADER - WINDOWS AUTO-START REMOVER
color 0c
cls
echo ==============================================================================
echo        THE CLEVER TRADER — WINDOWS AUTO-START UNINSTALLER
echo ==============================================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_DIR%\StartCleverTrader.vbs"

if exist "%VBS_FILE%" (
    del /f /q "%VBS_FILE%"
    echo [SUCCESS] Windows Auto-Start launcher has been removed:
    echo %VBS_FILE%
    echo.
    echo The Clever Trader will no longer start automatically upon Windows boot.
) else (
    echo [INFO] Auto-start launcher was not installed. Nothing to remove.
)

echo.
pause
