@echo off
rem BMWW: gumawa ng shortcut sa Desktop na nagbubukas ng index.html sa Chrome o Edge
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-desktop-shortcut.ps1"
pause
