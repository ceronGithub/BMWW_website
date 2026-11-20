@echo off
rem BMWW File Watcher: tanggalin sa Startup at itigil
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall-watcher.ps1"
pause
