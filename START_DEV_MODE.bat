@echo off
title THE CLEVER TRADER - DEV MODE
color 0e
echo Starting in Development Mode...
start "Clever Trader Dev" cmd /k "npm run dev"
start http://localhost:3000/vortex
exit
