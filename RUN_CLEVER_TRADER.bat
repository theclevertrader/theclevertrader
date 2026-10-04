@echo off
title THE CLEVER TRADER — ONE-CLICK LAUNCH
cd /d "%~dp0"
:: If we're launched from Desktop, navigate to project
if not exist "START_BOT.bat" (
    cd /d "C:\Users\Dell\clever trader"
)
call START_BOT.bat
exit
