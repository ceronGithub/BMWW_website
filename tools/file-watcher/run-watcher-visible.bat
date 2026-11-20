@echo off
rem BMWW File Watcher: may console (pang-test). Isara ang window para tumigil. Gumawa ng bagong file sa CLO1A para subukan.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0watch-new-files.ps1" -Visible
pause
