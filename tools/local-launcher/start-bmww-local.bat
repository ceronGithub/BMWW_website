@echo off
rem FILE    : tools/local-launcher/start-bmww-local.bat
rem PURPOSE : binubuksan ang BMWW sa http://localhost:8765 para mas tumagal ang permission ng folder (Allow on every visit)
rem DEPENDS : start-bmww-local.ps1, Windows PowerShell, Chrome o Edge
rem VERSION : v1 | 2026-11-24 | bagong file (Batch F: Task 5 at 9)
title BMWW local server - HUWAG ISARA
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-bmww-local.ps1"
pause
