<#
 FILE    : tools/ongoing-monitor/install-ongoing-monitor.ps1
 PURPOSE : Naglalagay ng shortcut sa Startup ng Windows para kusang tumakbo ang Ongoing Monitor, at pinapatakbo ito ngayon din
 VERSION : v25 | 2026-11-24 | bagong file (Batch E: Task 7)
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$monitorScript = Join-Path $scriptDir 'ongoing-monitor.ps1'
$configFile = Join-Path $scriptDir 'ongoing-monitor-config.txt'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'BMWW Ongoing Monitor.lnk'
$arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $monitorScript + '"'

# Paalala kung wala pang SavingPath (hindi malalaman ng script kung saan babasahin ang settings).
$hasSavingPath = $false
foreach ($line in (Get-Content $configFile)) {
    $text = $line.Trim()
    if ($text -match '^(SavingPath|SettingsFile)\s*=\s*\S+') { $hasSavingPath = $true }
}
if (-not $hasSavingPath) {
    Write-Host 'BABALA: blangko ang SavingPath sa ongoing-monitor-config.txt. Ilagay muna ito (hal. C:\Users\Name\Desktop\BMWW), tapos patakbuhin ulit ito.'
    exit 1
}

# Itigil muna ang lumang Ongoing Monitor (kung meron) para mabasa ang bagong config.
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like '*ongoing-monitor.ps1*' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $scriptDir
$shortcut.WindowStyle = 7
$shortcut.Description = 'BMWW Ongoing Monitor'
$shortcut.Save()

Start-Process 'powershell.exe' -ArgumentList $arguments -WindowStyle Hidden
Write-Host 'TAPOS: tumatakbo na ang Ongoing Monitor at tatakbo ito tuwing mag-log in sa Windows.'
Write-Host ('Shortcut: ' + $shortcutPath)
Write-Host ('Log: ' + (Join-Path $scriptDir 'ongoing-monitor.log'))
