<#
 FILE    : tools/file-watcher/watch-new-files.ps1
 PURPOSE : Binabantayan ang mga folder (CLO1A, CLO1A1). Kapag may bagong file o folder, binubuksan ang BM Analyzer website.
           Sa mga folder sa ModifiedWatchPaths (hal. Data source 1), kasama rin ang file na na-modify (na-save ulit).
 INPUT   : watcher-config.txt (nasa tabi ng file na ito)
 OUTPUT  : watcher.log (nasa tabi ng file na ito); nagbubukas ng browser
 NOTE    : Basa lang ang mga folder; walang isinusulat o binubura doon.
 USAGE   : install-watcher.bat (tumatakbo nang tago sa Startup) o run-watcher-visible.bat (may console, pang-test)
 VERSION : v1 | 2026-11-21 | bagong file
 VERSION : v1.1 | 2026-11-21 | ModifiedWatchPaths (hal. Data source 1): kasama ang na-modify na file, hindi lang bago; DebounceSeconds
#>
param([switch]$Visible)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configFile = Join-Path $scriptDir 'watcher-config.txt'
$logFile = Join-Path $scriptDir 'watcher.log'

# Sumusulat ng linya sa log (at sa console kung -Visible). Pinuputol ang log kapag lumampas sa 1 MB.
function Write-Log([string]$message) {
    $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $message
    if ($Visible) { Write-Host $line }
    try {
        if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 1048576)) { Remove-Item $logFile -Force }
        Add-Content -Path $logFile -Value $line -Encoding UTF8
    } catch { }
}

# Binabasa ang watcher-config.txt (key=value). May default kung kulang.
function Read-Config {
    $config = @{
        WatchPaths = 'C:\BM-Logging\CLO1A;C:\BM-Logging\CLO1A1'
        Browser = 'edge'
        Page = '#file-search'
        IndexPath = ''
        SettleSeconds = '3'
        CooldownSeconds = '120'
        SkipIfOpen = 'yes'
        IgnorePrefixes = '~$;.~'
        IgnoreSuffixes = '.tmp;.crdownload'
        ModifiedWatchPaths = ''
        DebounceSeconds = '5'
    }
    if (Test-Path $configFile) {
        foreach ($line in (Get-Content $configFile)) {
            $text = $line.Trim()
            if ($text -eq '' -or $text.StartsWith('#')) { continue }
            $index = $text.IndexOf('=')
            if ($index -lt 1) { continue }
            $config[$text.Substring(0, $index).Trim()] = $text.Substring($index + 1).Trim()
        }
    }
    return $config
}

# Hinahati ang listahan na pinaghihiwalay ng ; (walang blangko).
function Split-List([string]$value) {
    return @($value.Split(';') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
}

# Dapat bang laktawan ang pangalan (pansamantalang file)?
function Test-Ignored([string]$name, $prefixList, $suffixList) {
    foreach ($prefix in $prefixList) { if ($name.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
    foreach ($suffix in $suffixList) { if ($name.EndsWith($suffix, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
    return $false
}

# Gumagawa ng FileSystemWatcher para sa folder (bagong file/folder at pagpapalit ng pangalan).
function New-Watcher([string]$path, [bool]$includeModified) {
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $path
    $watcher.IncludeSubdirectories = $true
    if ($includeModified) { $watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, DirectoryName, LastWrite' }
    else { $watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, DirectoryName' }
    $watcher.InternalBufferSize = 65536
    $null = Register-ObjectEvent $watcher 'Created' -SourceIdentifier ('BMWW.Created.' + $path)
    $null = Register-ObjectEvent $watcher 'Renamed' -SourceIdentifier ('BMWW.Renamed.' + $path)
    if ($includeModified) { $null = Register-ObjectEvent $watcher 'Changed' -SourceIdentifier ('BMWW.Changed.' + $path) }
    $null = Register-ObjectEvent $watcher 'Error' -SourceIdentifier ('BMWW.Error.' + $path)
    $watcher.EnableRaisingEvents = $true
    return $watcher
}

# Isinasara ang watcher at ang mga subscription nito.
function Remove-Watcher([string]$path, $watcher) {
    foreach ($kind in 'Created', 'Renamed', 'Changed', 'Error') {
        Unregister-Event -SourceIdentifier ('BMWW.' + $kind + '.' + $path) -ErrorAction SilentlyContinue
    }
    if ($watcher) { $watcher.EnableRaisingEvents = $false; $watcher.Dispose() }
}

# May bukas na bang window ng website? (pamagat na "BM Analyzer" sa Edge o Chrome)
function Test-WebsiteOpen {
    $processList = Get-Process -Name msedge, chrome -ErrorAction SilentlyContinue
    foreach ($process in $processList) {
        if ($process.MainWindowTitle -like '*BM Analyzer*') { return $true }
    }
    return $false
}

# Binubuksan ang website sa napiling browser.
function Open-Website($config) {
    $indexPath = $config.IndexPath
    if ($indexPath -eq '') { $indexPath = Join-Path (Split-Path -Parent (Split-Path -Parent $scriptDir)) 'index.html' }
    if (-not (Test-Path $indexPath)) { Write-Log ('HINDI MAHANAP ang index.html: ' + $indexPath + ' (ayusin ang IndexPath sa watcher-config.txt)'); return $false }
    $url = ([Uri]$indexPath).AbsoluteUri + $config.Page
    try {
        switch ($config.Browser.ToLower()) {
            'edge' { Start-Process 'msedge.exe' -ArgumentList $url }
            'chrome' { Start-Process 'chrome.exe' -ArgumentList $url }
            default { Start-Process $indexPath }
        }
        Write-Log ('Binuksan ang website: ' + $url)
        return $true
    } catch {
        Write-Log ('Hindi mabuksan ang browser (' + $config.Browser + '): ' + $_.Exception.Message)
        return $false
    }
}

# --- Simula ---
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, 'Local\BMWW_FileWatcher', [ref]$createdNew)
if (-not $createdNew) { Write-Log 'May tumatakbo nang watcher. Itinigil ang bago.'; exit 0 }

$config = Read-Config
$pathList = @(Split-List $config.WatchPaths)
$modifiedList = @(Split-List $config.ModifiedWatchPaths)
$modifiedMap = @{}
foreach ($modifiedPath in $modifiedList) { $modifiedMap[$modifiedPath] = $true }
$pathList = @(@($pathList) + @($modifiedList) | Select-Object -Unique)
$prefixList = @(Split-List $config.IgnorePrefixes)
$suffixList = @(Split-List $config.IgnoreSuffixes)
$settleSeconds = [int]$config.SettleSeconds
$cooldownSeconds = [int]$config.CooldownSeconds
$debounceSeconds = [int]$config.DebounceSeconds
$recentMap = @{}
$watcherMap = @{}
$lastOpen = [DateTime]::MinValue
Write-Log ('Simula ng watcher. Binabantayan: ' + ($pathList -join ', '))

while ($true) {
    # Subukang i-attach ang mga folder na wala pang watcher (hal. naputol ang network kanina).
    foreach ($path in $pathList) {
        if ($watcherMap.ContainsKey($path)) { continue }
        if (Test-Path $path) {
            try {
                $watcherMap[$path] = New-Watcher $path ([bool]$modifiedMap.ContainsKey($path))
                if ($modifiedMap.ContainsKey($path)) { Write-Log ('Nababantayan na (kasama ang na-modify na file): ' + $path) }
                else { Write-Log ('Nababantayan na: ' + $path) }
            }
            catch { Write-Log ('Hindi mabantayan: ' + $path + ' - ' + $_.Exception.Message) }
        }
    }

    $queuedEvent = Wait-Event -Timeout 10
    if (-not $queuedEvent) { continue }
    $eventName = $queuedEvent.SourceIdentifier
    $changeInfo = $queuedEvent.SourceEventArgs
    Remove-Event -EventIdentifier $queuedEvent.EventIdentifier -ErrorAction SilentlyContinue

    if ($eventName -like 'BMWW.Error.*') {
        # Nawala ang koneksyon o napuno ang buffer: isara at subukan ulit sa susunod na ikot.
        $watchedPath = $eventName.Substring('BMWW.Error.'.Length)
        Write-Log ('Error sa pagbabantay ng ' + $watchedPath + '. Susubukan ulit.')
        if ($watcherMap.ContainsKey($watchedPath)) { Remove-Watcher $watchedPath $watcherMap[$watchedPath]; $watcherMap.Remove($watchedPath) }
        Start-Sleep -Seconds 5
        continue
    }

    $itemName = [string]$changeInfo.Name
    if (Test-Ignored ([System.IO.Path]::GetFileName($itemName)) $prefixList $suffixList) { continue }
    if ($eventName -like 'BMWW.Changed.*') {
        # Ang Changed ay lumalabas din sa folder at maraming beses kada save: file lang, at isang beses sa loob ng DebounceSeconds.
        if (-not (Test-Path -LiteralPath $changeInfo.FullPath -PathType Leaf)) { continue }
        $lastSeen = $recentMap[$changeInfo.FullPath]
        if ($lastSeen -and (((Get-Date) - $lastSeen).TotalSeconds -lt $debounceSeconds)) { continue }
        $recentMap[$changeInfo.FullPath] = Get-Date
        Write-Log ('Na-modify na file: ' + $changeInfo.FullPath)
    } else {
        # Ang bagong item ay nagpapatahimik din sa Changed na kasunod nito (habang sinusulat ang file).
        $recentMap[$changeInfo.FullPath] = Get-Date
        Write-Log ('Bagong item: ' + $changeInfo.FullPath)
    }
    if ($recentMap.Count -gt 500) { $recentMap.Clear() }

    if (((Get-Date) - $lastOpen).TotalSeconds -lt $cooldownSeconds) { Write-Log 'Laktawan: nasa cooldown pa.'; continue }
    Start-Sleep -Seconds $settleSeconds
    if ($config.SkipIfOpen -eq 'yes' -and (Test-WebsiteOpen)) { Write-Log 'Laktawan: bukas na ang website.'; $lastOpen = Get-Date; continue }
    if (Open-Website $config) { $lastOpen = Get-Date }
}
