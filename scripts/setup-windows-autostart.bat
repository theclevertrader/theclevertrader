@echo off
title THE CLEVER TRADER - WINDOWS AUTO-START INSTALLER
color 0a
cls
echo ==============================================================================
echo        THE CLEVER TRADER — WINDOWS AUTO-START & RESILIENCE INSTALLER
echo ==============================================================================
echo.
echo This utility configures your PC so that whenever Windows boots or restarts
echo (after a power outage, update, or reboot), Clever Trader starts automatically!
echo.

set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%"
set "PROJECT_DIR=%CD%"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_DIR%\StartCleverTrader.vbs"

echo [1/3] Target Project Path: %PROJECT_DIR%
echo [2/3] Windows Startup Directory: %STARTUP_DIR%
echo [3/3] Generating background launch script...

echo ' THE CLEVER TRADER - AUTONOMOUS STARTUP LAUNCHER > "%VBS_FILE%"
echo Set WshShell = CreateObject("WScript.Shell"^) >> "%VBS_FILE%"
echo WshShell.CurrentDirectory = "%PROJECT_DIR%" >> "%VBS_FILE%"
echo WshShell.Run "cmd.exe /c START_CLEVER_TRADER.bat", 1, False >> "%VBS_FILE%"

if exist "%VBS_FILE%" (
    echo.
    echo ==============================================================================
    echo [SUCCESS] Windows Auto-Start has been permanently enabled!
    echo File created: %VBS_FILE%
    echo.
    echo Next time your computer boots or restarts, The Clever Trader terminal,
    echo MT5 bridge, and autonomous quantitative scanner will launch hands-free.
    echo ==============================================================================
) else (
    echo [ERROR] Failed to write to Startup folder. Please check permissions.
)

echo.
pause
