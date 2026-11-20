<#
 FILE    : tools/file-watcher/install-watcher.ps1
 PURPOSE : Naglalagay ng shortcut sa Startup ng Windows para kusang tumakbo ang watcher, at pinapatakbo ito ngayon din
 VERSION : v1 | 2026-11-21 | bagong file
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$watcherScript = Join-Path $scriptDir 'watch-new-files.ps1'
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder 'BMWW File Watcher.lnk'
$arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $watcherScript + '"'

# Itigil muna ang lumang watcher (kung meron) para mabasa ang bagong config.
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like '*watch-new-files.ps1*' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $scriptDir
$shortcut.WindowStyle = 7
$shortcut.Description = 'BMWW File Watcher'
$shortcut.Save()

Start-Process 'powershell.exe' -ArgumentList $arguments -WindowStyle Hidden
Write-Host 'TAPOS: tumatakbo na ang watcher at tatakbo ito tuwing mag-log in sa Windows.'
Write-Host ('Shortcut: ' + $shortcutPath)
Write-Host ('Log: ' + (Join-Path $scriptDir 'watcher.log'))
