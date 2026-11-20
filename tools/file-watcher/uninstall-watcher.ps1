<#
 FILE    : tools/file-watcher/uninstall-watcher.ps1
 PURPOSE : Tinatanggal ang shortcut sa Startup at itinitigil ang watcher
 VERSION : v1 | 2026-11-21 | bagong file
#>
$ErrorActionPreference = 'Stop'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'BMWW File Watcher.lnk'
if (Test-Path $shortcutPath) { Remove-Item $shortcutPath -Force; Write-Host 'Natanggal ang shortcut sa Startup.' }
else { Write-Host 'Walang shortcut sa Startup.' }
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like '*watch-new-files.ps1*' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host 'Itinigil ang watcher.' }
Write-Host 'TAPOS.'
