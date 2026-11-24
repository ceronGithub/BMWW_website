<#
 FILE    : tools/ongoing-monitor/uninstall-ongoing-monitor.ps1
 PURPOSE : Tinatanggal ang shortcut sa Startup at itinitigil ang Ongoing Monitor
 VERSION : v25 | 2026-11-24 | bagong file (Batch E: Task 7)
#>
$ErrorActionPreference = 'Stop'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'BMWW Ongoing Monitor.lnk'
if (Test-Path $shortcutPath) { Remove-Item $shortcutPath -Force; Write-Host 'Natanggal ang shortcut sa Startup.' }
else { Write-Host 'Walang shortcut sa Startup.' }
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like '*ongoing-monitor.ps1*' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host 'Itinigil ang Ongoing Monitor.' }
Write-Host 'TAPOS.'
