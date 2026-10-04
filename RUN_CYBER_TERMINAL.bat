@echo off
title THE CLEVER TRADER — CYBER QUANT TERMINAL
color 0b
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python -X utf8 cyber_terminal.py
pause
