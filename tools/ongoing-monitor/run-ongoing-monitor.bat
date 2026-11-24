@echo off
rem BMWW Ongoing Monitor: may console (pang-test). Isara ang window para tumigil.
rem Una: ilagay ang SavingPath sa ongoing-monitor-config.txt. Pagkatapos, gumawa o mag-save ng file sa Data source 1, 2 o 3.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ongoing-monitor.ps1" -Visible
pause
