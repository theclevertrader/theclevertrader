@echo off
title THE CLEVER TRADER — DEPLOY MODAL CLOUD SENTINEL (24/7 WATCHDOG)
color 0b
cls
echo ==============================================================================
echo        THE CLEVER TRADER - 24/7 MODAL CLOUD SENTINEL DEPLOYER
echo                  [FREE TIER - $30/MONTH CLOUD COMPUTE]
echo ==============================================================================
echo.
echo  * Target Platform: Modal.com Serverless Cloud
echo  * Architecture: 24/7 Autonomous Imbalance Watchdog + Live Webhook API
echo  * Status: Works continuously even when laptop is turned off!
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found in PATH!
    pause
    exit /b 1
)

:: 2. Check if modal is installed
python -c "import modal" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [1/3] Installing Modal SDK...
    pip install modal
) else (
    echo [1/3] Modal SDK verified!
)

:: 3. Check Authentication
echo.
echo [2/3] Checking Modal Cloud Authentication...
if not exist "%USERPROFILE%\.modal.toml" (
    echo.
    echo ------------------------------------------------------------------------------
    echo [ACTION REQUIRED] Modal link setup:
    echo A browser window will now open to link your 'shafaan2000' Modal account.
    echo Please click "Approve" or "Sign in" in your browser.
    echo ------------------------------------------------------------------------------
    echo.
    python -m modal setup
) else (
    echo [SUCCESS] Modal account already linked!
)

:: 4. Deploy to Modal Cloud
echo.
echo [3/3] Deploying Clever Trader Sentinel to 24/7 Serverless Cloud...
python -X utf8 -m modal deploy modal_sentinel.py

echo.
echo ==============================================================================
echo  CLOUD SENTINEL DEPLOYED SUCCESSFULLY!
echo  Your 24/7 Watchdog is now running serverless in the cloud.
echo  Dashboard: https://modal.com/apps/shafaan2000
echo ==============================================================================
echo.
pause
