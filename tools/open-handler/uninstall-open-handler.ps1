<#
 FILE    : tools/open-handler/uninstall-open-handler.ps1
 PURPOSE : Tinatanggal ang protocol na bmww-open: sa Windows
 VERSION : v1 | 2026-11-21 | bagong file
#>
$ErrorActionPreference = 'Stop'
$baseKey = 'HKCU:\Software\Classes\bmww-open'
if (Test-Path $baseKey) { Remove-Item -Path $baseKey -Recurse -Force; Write-Host 'Natanggal ang bmww-open.' }
else { Write-Host 'Walang naka-install na bmww-open.' }
Write-Host 'TAPOS.'
