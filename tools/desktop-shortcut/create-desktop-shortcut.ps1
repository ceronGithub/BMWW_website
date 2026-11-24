<#
 FILE    : tools/desktop-shortcut/create-desktop-shortcut.ps1
 PURPOSE : Gumagawa ng shortcut na "BMWW" sa Desktop na direktang nagbubukas ng index.html ng project sa Chrome (o Edge kung walang Chrome)
 VERSION : v22 | 2026-11-24 | bagong file (Batch B: Task 10)
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = [System.IO.Path]::GetFullPath((Join-Path $scriptDir '..\..\index.html'))
$projectDir = Split-Path -Parent $indexPath

# Siguraduhing buo ang project folder (hindi index.html lang ang nakopya).
if (-not (Test-Path -LiteralPath $indexPath)) { Write-Host 'ERROR: Hindi makita ang index.html. Patakbuhin ang file na ito mula sa loob ng tools\desktop-shortcut ng BMWW project.'; exit 1 }
foreach ($folderName in @('css', 'js', 'pages')) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectDir $folderName))) {
        Write-Host ('ERROR: Kulang ang folder na ' + $folderName + ' sa ' + $projectDir + '. I-extract ang BUONG zip bago patakbuhin ito.')
        exit 1
    }
}
if ($projectDir -like '*\Temp\*') { Write-Host 'BABALA: nasa Temp folder ang project (hindi pa na-extract nang buo). I-extract muna sa permanenteng folder (hal. Desktop o Documents), tapos patakbuhin ulit ito.' }

# Hanapin ang Chrome, kung wala ay Edge.
$browserList = @(
    (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
    (Join-Path $env:LocalAppData 'Google\Chrome\Application\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe')
)
$browserPath = $browserList | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $browserPath) { Write-Host 'ERROR: Walang nakitang Chrome o Edge. Mag-install ng Chrome o Edge.'; exit 1 }

# Ang file URL ay ginagawang tama ang espasyo at special na character.
$fileUrl = ([System.Uri]$indexPath).AbsoluteUri
$desktopFolder = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopFolder 'BMWW.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $browserPath
$shortcut.Arguments = '"' + $fileUrl + '"'
$shortcut.WorkingDirectory = $projectDir
$shortcut.IconLocation = $browserPath + ',0'
$shortcut.Description = 'BM Analyzer (BMWW)'
$shortcut.Save()

Write-Host 'TAPOS: nagawa ang shortcut na BMWW sa Desktop.'
Write-Host ('Browser : ' + $browserPath)
Write-Host ('Bubuksan: ' + $fileUrl)
Write-Host ('Shortcut: ' + $shortcutPath)
Write-Host 'Kapag inilipat mo ang BMWW project folder, patakbuhin ulit ang create-desktop-shortcut.bat.'
