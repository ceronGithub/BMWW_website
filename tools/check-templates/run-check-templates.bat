@echo off
rem FILE    : tools/check-templates/run-check-templates.bat
rem PURPOSE : sinusuri kung magkapareho ang pages/*.html at js/templates/*.template.js (kailangan ang Node.js)
rem DEPENDS : check-templates.js, Node.js
rem VERSION : v1 | 2026-11-24 | bagong file (Batch H: Task 15)
where node >nul 2>nul
if errorlevel 1 (
  echo Walang Node.js sa PC na ito. I-install muna mula sa nodejs.org, o laktawan ang checker na ito.
  pause
  exit /b 1
)
node "%~dp0check-templates.js"
pause
