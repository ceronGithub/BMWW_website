<#
 FILE    : tools/open-handler/open-file.ps1
 PURPOSE : Binubuksan sa Excel ang na-export na Repeatability file kapag pinindot ang "Open latest repeatability file" sa website (protocol bmww-open:)
 INPUT   : bmww-open:<full path na naka-encode> (galing sa Windows, via registry ng install-open-handler.ps1)
 SAFETY  : Basa lang. Binubuksan LANG ang .xlsx na ang pangalan ay nagsisimula sa master-repeatability o master-correl at nasa loob ng folder na
           master-repeatability\<petsa>\ o master-correl\<petsa>\ (magkapareho ang pangalan ng folder at ng simula ng file). Ang iba (exe, bat, folder, UNC path, "..") ay HINDI bubuksan.
 VERSION : v1 | 2026-11-21 | bagong file
 VERSION : v1.1 | 2026-11-21 | pinapayagan din ang master-correl (Master Correl export)
#>
param(
    [Parameter(Position = 0)][string]$Url = '',
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $scriptDir 'open-handler.log'
$allowedNameList = @('master-repeatability', 'master-correl')
$requiredExtension = '.xlsx'
$protocolPrefix = 'bmww-open:'

# Sumusulat sa log (para malaman kung bakit hindi nabuksan).
function Write-Log([string]$message) {
    try { Add-Content -Path $logPath -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $message) } catch { }
}

# Ginagawang tunay na path ang laman ng URL; $null kung hindi tama ang anyo.
function Get-PathFromUrl([string]$text) {
    if (-not $text.StartsWith($protocolPrefix, [StringComparison]::OrdinalIgnoreCase)) { return $null }
    $encoded = $text.Substring($protocolPrefix.Length).TrimStart('/').TrimEnd('/')
    try { return [Uri]::UnescapeDataString($encoded) } catch { return $null }
}

# Tama ba ang path (tingnan ang SAFETY sa taas)? Ibinabalik ang dahilan kung hindi; blangko kung tama.
function Test-AllowedPath([string]$path) {
    if ([string]::IsNullOrWhiteSpace($path)) { return 'walang path' }
    if ($path.StartsWith('\\') -or $path.StartsWith('//')) { return 'UNC path ay hindi pinapayagan' }
    if (-not [IO.Path]::IsPathRooted($path)) { return 'hindi full path' }
    if (($path -split '[\\/]') -contains '..') { return 'may ".." sa path' }
    if ([IO.Path]::GetExtension($path).ToLowerInvariant() -ne $requiredExtension) { return 'hindi .xlsx' }
    $leaf = [IO.Path]::GetFileName($path)
    $dateFolder = [IO.Path]::GetDirectoryName($path)
    $parentFolder = if ($dateFolder) { [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($dateFolder)) } else { '' }
    $isAllowed = $false
    foreach ($allowedName in $allowedNameList) {
        if ($parentFolder -ieq $allowedName -and $leaf.StartsWith($allowedName, [StringComparison]::OrdinalIgnoreCase)) { $isAllowed = $true }
    }
    if (-not $isAllowed) { return 'hindi Repeatability o Correl file, o wala sa master-repeatability\<petsa> / master-correl\<petsa>' }
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return 'walang file sa path' }
    return ''
}

$targetPath = Get-PathFromUrl $Url
if ($null -eq $targetPath) { Write-Log ('Hindi tamang URL: ' + $Url); exit 1 }
$reason = Test-AllowedPath $targetPath
if ($reason) { Write-Log ('Hindi binuksan (' + $reason + '): ' + $targetPath); exit 1 }
if ($DryRun) { Write-Output ('OK: ' + $targetPath); exit 0 }
Start-Process -FilePath $targetPath
Write-Log ('Binuksan: ' + $targetPath)
