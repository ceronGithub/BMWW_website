<#
 FILE    : tools/open-handler/install-open-handler.ps1
 PURPOSE : Nagrerehistro ng protocol na bmww-open: sa Windows (para sa user lang, HKCU, walang admin) para mabuksan ng website ang Repeatability Excel
 VERSION : v1 | 2026-11-21 | bagong file
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$openScript = Join-Path $scriptDir 'open-file.ps1'
$baseKey = 'HKCU:\Software\Classes\bmww-open'
$command = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $openScript + '" "%1"'

New-Item -Path $baseKey -Force | Out-Null
Set-ItemProperty -Path $baseKey -Name '(Default)' -Value 'URL:BMWW Open Repeatability'
Set-ItemProperty -Path $baseKey -Name 'URL Protocol' -Value ''
New-Item -Path ($baseKey + '\shell\open\command') -Force | Out-Null
Set-ItemProperty -Path ($baseKey + '\shell\open\command') -Name '(Default)' -Value $command

Write-Host 'TAPOS: naka-install ang bmww-open (para sa user mo lang).'
Write-Host ('Script: ' + $openScript)
Write-Host 'Sa unang pindot ng Open latest repeatability file, magtatanong ang browser: lagyan ng tick ang "Always allow" at pindutin ang Open.'
