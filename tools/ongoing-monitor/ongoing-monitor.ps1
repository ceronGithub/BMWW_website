<#
 FILE    : tools/ongoing-monitor/ongoing-monitor.ps1
 PURPOSE : Tuloy-tuloy na pagbasa ng Data source 1, 2, 3 ng Sender (kahit sarado ang website). Isinusulat ang status ng machine
           sa <Server path>\queue\<machine>.json para ma-update ang Dashboard ng LEAD PC, at binubuksan ang website kapag may pagbabago
           para ma-update ang Dashboard ng Sender.
 INPUT   : ongoing-monitor-config.txt (nasa tabi ng file na ito); settings ng machine (<Saving path>\settings\machines\sender\<machine>.json)
 OUTPUT  : <Server path>\queue\<machine>.json; ongoing-monitor.log (nasa tabi ng file na ito); nagbubukas ng browser
 NOTE    : Basa lang ang Data source. Ang sinusulat lang ay ang status file sa Server path\queue (parehong format ng website).
           Kapag ang website ang kakasulat lang ng status (WebAliveSeconds), hindi ito susulat para hindi magbanggaan.
 USAGE   : install-ongoing-monitor.bat (tumatakbo nang tago sa Startup) o run-ongoing-monitor.bat (may console, pang-test)
 VERSION : v25 | 2026-11-24 | bagong file (Batch E: Task 6 at 7)
#>
param([switch]$Visible, [string]$ConfigPath = '')

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configFile = if ($ConfigPath -ne '') { $ConfigPath } else { Join-Path $scriptDir 'ongoing-monitor-config.txt' }
$logFile = Join-Path $scriptDir 'ongoing-monitor.log'
$sourceKeyList = @('source1', 'source2', 'source3')
$epoch = New-Object DateTime 1970, 1, 1, 0, 0, 0, ([DateTimeKind]::Utc)

# ===== LOG AT CONFIG =====
# Sumusulat ng linya sa log (at sa console kung -Visible). Pinuputol ang log kapag lumampas sa 1 MB.
function Write-Log([string]$message) {
    $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $message
    if ($Visible) { Write-Host $line }
    try {
        if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 1048576)) { Remove-Item $logFile -Force }
        Add-Content -Path $logFile -Value $line -Encoding UTF8
    } catch { }
}

# Binabasa ang ongoing-monitor-config.txt (key=value). May default kung kulang.
function Read-Config {
    $config = @{
        SavingPath = ''; SettingsFile = ''; PollSeconds = '5'; SettleSeconds = '30'; HeartbeatSeconds = '30'; WebAliveSeconds = '45'
        Source1TimeoutSeconds = '300'; Source2TimeoutSeconds = '1800'; Source3TimeoutSeconds = '1800'
        OpenWebsite = 'yes'; Browser = 'edge'; Page = '#dashboard'; IndexPath = ''; CooldownSeconds = '120'; SkipIfOpen = 'yes'
        MaxEntries = '5000'; MaxDepth = '5'; IgnorePrefixes = '~$'; IgnoreSuffixes = '.tmp;.temp;.part;.crdownload'
        MasterHeaderCount = '15'; HeaderRow = '1'; HeaderScanColumns = '300'
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

# ===== SETTINGS NG MACHINE =====
# Hinahanap ang settings file ng Sender: SettingsFile kung nakasulat; kung hindi, ang pinakabagong .json sa <SavingPath>\settings\machines\sender, huli ang lumang <SavingPath>\settings.
function Find-SettingsFile($config) {
    if ($config.SettingsFile -ne '') { if (Test-Path -LiteralPath $config.SettingsFile) { return $config.SettingsFile } else { return $null } }
    if ($config.SavingPath -eq '') { return $null }
    $folderList = @((Join-Path $config.SavingPath 'settings\machines\sender'), (Join-Path $config.SavingPath 'settings'))
    foreach ($folder in $folderList) {
        if (-not (Test-Path -LiteralPath $folder)) { continue }
        $found = Get-ChildItem -LiteralPath $folder -Filter '*.json' -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -ne 'settings.json' -and $_.Name -ne 'events.json' } |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    return $null
}

# Binabasa ang settings file: { machineName, machineMode, machineFile, folderPaths }. Null kung sira o walang machineName.
function Read-Machine([string]$file) {
    try {
        $data = Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
        if (-not $data.machineName) { return $null }
        $paths = @{ server = ''; source1 = ''; source2 = ''; source3 = '' }
        if ($data.folderPaths) { foreach ($key in $paths.Keys.Clone()) { if ($data.folderPaths.$key) { $paths[$key] = [string]$data.folderPaths.$key } } }
        return @{ Name = [string]$data.machineName; Mode = [string]$data.machineMode; File = [string]$data.machineFile; Paths = $paths }
    } catch { return $null }
}

# Ligtas na pangalan ng file ng machine (kapareho ng storage.toMachineFileName ng website).
function Get-QueueFileName($machine) {
    if ($machine.File -ne '') { return $machine.File }
    $baseName = ($machine.Name -replace '[<>:"/\\|?*\x00-\x1F]', '_') -replace '[. ]+$', ''
    $baseName = $baseName.Trim()
    if ($baseName -eq '') { $baseName = 'machine' }
    $fileName = $baseName + '.json'
    if ($baseName -match '^(con|prn|aux|nul|com[1-9]|lpt[1-9])$' -or @('settings.json', 'events.json') -contains $fileName.ToLower()) { $fileName = '_' + $fileName }
    return $fileName
}

# ===== SCAN AT DIFF =====
# Dapat bang laktawan ang pangalan (pansamantalang file)?
function Test-Ignored([string]$name, $config) {
    foreach ($prefix in (Split-List $config.IgnorePrefixes)) { if ($name.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
    foreach ($suffix in (Split-List $config.IgnoreSuffixes)) { if ($name.EndsWith($suffix, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
    return $false
}

# Binabasa (basa lang) ang folder at subfolder: { Map (path -> Kind, Mod ms, Size), Truncated }. Nagtatapon ng error kapag hindi mabasa ang mismong folder.
function Get-Snapshot([string]$rootPath, $config) {
    $map = @{}
    $truncated = $false
    $maxEntries = [int]$config.MaxEntries
    $maxDepth = [int]$config.MaxDepth
    $stack = New-Object System.Collections.Stack
    $stack.Push(@($rootPath, '', 1))
    while ($stack.Count -gt 0) {
        $item = $stack.Pop()
        try {
            foreach ($entry in (New-Object System.IO.DirectoryInfo($item[0])).EnumerateFileSystemInfos()) {
                if ($map.Count -ge $maxEntries) { $truncated = $true; break }
                if (Test-Ignored $entry.Name $config) { continue }
                $key = $item[1] + '/' + $entry.Name
                if ($entry -is [System.IO.FileInfo]) {
                    $map[$key] = @{ Kind = 'file'; Mod = [long](($entry.LastWriteTimeUtc - $epoch).TotalMilliseconds); Size = [long]$entry.Length }
                } else {
                    $map[$key] = @{ Kind = 'folder'; Mod = [long]0; Size = [long]0 }
                    if ($item[2] -lt $maxDepth) { $stack.Push(@($entry.FullName, $key, ($item[2] + 1))) }
                }
            }
        } catch {
            if ($item[1] -eq '') { throw }
        }
    }
    return @{ Map = $map; Truncated = $truncated }
}

# Ikinukumpara ang dalawang scan: bagong file, bagong folder, nabago (oras o laki), at nawala.
function Get-Diff($previous, $current) {
    $diff = @{ NewFiles = @(); NewFolders = @(); Changed = @(); Removed = @() }
    foreach ($key in $current.Keys) {
        $entry = $current[$key]
        if (-not $previous.ContainsKey($key)) {
            if ($entry.Kind -eq 'file') { $diff.NewFiles += $key } else { $diff.NewFolders += $key }
            continue
        }
        $before = $previous[$key]
        if ($entry.Kind -eq 'file' -and ($entry.Mod -ne $before.Mod -or $entry.Size -ne $before.Size)) { $diff.Changed += $key }
    }
    foreach ($key in $previous.Keys) { if (-not $current.ContainsKey($key)) { $diff.Removed += $key } }
    return $diff
}

# Ang bagong file na kasusulat pa lang ay patuloy na nagbabago; huwag itong ituring na bagong ongoing sa loob ng SettleSeconds.
function Update-Settle($recentNew, $diff, [long]$nowMs, [long]$settleMs) {
    $diff.Changed = @($diff.Changed | Where-Object { -not ($recentNew.ContainsKey($_) -and ($nowMs - $recentNew[$_]) -lt $settleMs) })
    foreach ($key in $diff.NewFiles) { $recentNew[$key] = $nowMs }
    foreach ($key in @($recentNew.Keys)) { if (($nowMs - $recentNew[$key]) -ge $settleMs) { $recentNew.Remove($key) } }
}

# Ang path na may pinakabagong oras sa listahan.
function Get-LatestPath($pathList, $map) {
    $best = ''
    foreach ($key in $pathList) { if ($best -eq '' -or $map[$key].Mod -ge $map[$best].Mod) { $best = $key } }
    return $best
}

# Hinahati ang pangalan (hal. 4A05520A) sa Wafer, Layer at Blk. Walang laman kung hindi tumama.
function Get-NameParts([string]$itemName) {
    if ($itemName -match '^([A-Z0-9]{5})([0-9]{1,3})([A-Z])') { return @{ Wafer = $Matches[1].ToUpper(); Layer = $Matches[2]; Blk = $Matches[3].ToUpper() } }
    return @{ Wafer = ''; Layer = ''; Blk = '' }
}

# ===== STATE (kapareho ng js/core/monitor.js) =====
# Walang laman na state ng isang source.
function New-SourceState {
    return @{ Snapshot = $null; RecentNew = @{}; State = 'idle'; Mode = 'idle'; StartedMs = [long]0; FinishedMs = [long]0; LastMs = [long]0; FileName = ''; Wafer = ''; Blk = ''; Layer = '' }
}

# Master (15 headers) o Calibration, ayon sa pinakabagong CSV sa Data source 1 (basa lang).
function Get-CalibMode([string]$folder, $config) {
    try {
        $newest = Get-ChildItem -LiteralPath $folder -Filter '*.csv' -File -ErrorAction Stop | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $newest) { return 'calibration' }
        $stream = [System.IO.File]::Open($newest.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        try {
            $reader = New-Object System.IO.StreamReader($stream)
            $lineList = @()
            for ($index = 0; $index -le [int]$config.HeaderRow; $index += 1) { $lineList += $reader.ReadLine() }
        } finally { $stream.Dispose() }
        $cells = ([string]$lineList[[int]$config.HeaderRow]).Split(',')
        $count = 0
        for ($index = 0; $index -lt [Math]::Min($cells.Count, [int]$config.HeaderScanColumns); $index += 1) { if ($cells[$index].Trim().Trim('"') -ne '') { $count += 1 } }
        if ($count -eq [int]$config.MasterHeaderCount) { return 'master' }
        return 'calibration'
    } catch { return 'calibration' }
}

# Ina-update ang state ng isang source. source2/3: bagong file = DONE; ibang pagbabago = ONGOING. source1: anumang pagbabago = ONGOING.
function Get-NextState([string]$key, $previous, $diff, $map, [long]$nowMs, [string]$detectedMode, [long]$timeoutMs) {
    $next = $previous.Clone()
    $hasNewFile = $diff.NewFiles.Count -gt 0
    $hasActivity = $hasNewFile -or $diff.NewFolders.Count -gt 0 -or $diff.Changed.Count -gt 0 -or $diff.Removed.Count -gt 0
    $mode = switch ($key) { 'source1' { if ($detectedMode -ne '') { $detectedMode } elseif ($previous.Mode -in 'calibration', 'master') { $previous.Mode } else { 'calibration' } } 'source2' { 'online' } default { 'offline' } }
    $wasOngoing = $previous.State -eq 'ongoing'
    if ($key -ne 'source1' -and $hasNewFile) {
        $name = ([string](Get-LatestPath $diff.NewFiles $map)).Split('/')[-1]
        $parts = Get-NameParts $name
        $next.State = 'done'; $next.Mode = $mode; $next.StartedMs = $(if ($wasOngoing) { $previous.StartedMs } else { $nowMs }); $next.FinishedMs = $nowMs; $next.LastMs = $nowMs
        $next.FileName = $name; $next.Wafer = $parts.Wafer; $next.Layer = $parts.Layer; $next.Blk = $parts.Blk
        return $next
    }
    if ($hasActivity) {
        $touched = if ($diff.Changed.Count -gt 0) { $diff.Changed } else { $diff.NewFiles }
        $name = if ($touched.Count -gt 0) { ([string](Get-LatestPath $touched $map)).Split('/')[-1] } else { $previous.FileName }
        $parts = Get-NameParts $name
        $next.State = 'ongoing'; $next.Mode = $mode; $next.StartedMs = $(if ($wasOngoing) { $previous.StartedMs } else { $nowMs }); $next.FinishedMs = [long]0; $next.LastMs = $nowMs
        $next.FileName = $name; $next.Wafer = $parts.Wafer; $next.Layer = $parts.Layer; $next.Blk = $parts.Blk
        return $next
    }
    if ($wasOngoing -and ($nowMs - $previous.LastMs) -gt $timeoutMs) { $next.State = 'idle'; $next.Mode = 'idle'; $next.StartedMs = [long]0; $next.FinishedMs = [long]0 }
    return $next
}

# Pinipili kung aling source ang ipapakita ng machine: ang pinakabagong ongoing; kung wala, ang pinakabagong done; kung wala, idle.
function Get-Overall($stateMap) {
    $idle = @{ mode = 'idle'; state = 'idle'; source = ''; fileName = ''; wafer = ''; blk = ''; layer = ''; barcode = ''; startedAt = ''; finishedAt = '' }
    $chosen = $null
    foreach ($wanted in 'ongoing', 'done') {
        foreach ($key in $sourceKeyList) {
            $item = $stateMap[$key]
            if ($item -and $item.State -eq $wanted -and (-not $chosen -or $item.LastMs -gt $chosen.Item.LastMs)) { $chosen = @{ Key = $key; Item = $item } }
        }
        if ($chosen) { break }
    }
    if (-not $chosen) { return $idle }
    $item = $chosen.Item
    return @{
        mode = $item.Mode; state = $item.State; source = $chosen.Key; fileName = $item.FileName; wafer = $item.Wafer; blk = $item.Blk; layer = $item.Layer; barcode = ''
        startedAt = $(if ($item.StartedMs -gt 0) { $epoch.AddMilliseconds($item.StartedMs).ToString('o') } else { '' })
        finishedAt = $(if ($item.FinishedMs -gt 0) { $epoch.AddMilliseconds($item.FinishedMs).ToString('o') } else { '' })
    }
}

# ===== QUEUE (status sa Server path) =====
# Ang website ba ang kakasulat lang ng status? (walang "writer" na field at bago ang oras ng file)
function Test-WebAlive([string]$queueFile, [int]$aliveSeconds) {
    if (-not (Test-Path -LiteralPath $queueFile)) { return $false }
    try {
        if (((Get-Date) - (Get-Item -LiteralPath $queueFile).LastWriteTime).TotalSeconds -ge $aliveSeconds) { return $false }
        $data = Get-Content -LiteralPath $queueFile -Raw -Encoding UTF8 | ConvertFrom-Json
        return -not ($data.PSObject.Properties.Name -contains 'writer')
    } catch { return $false }
}

# Sinusulat ang status (parehong format ng website, dagdag na "writer") sa <Server path>\queue\<machine>.json.
function Write-Queue($machine, $overall, [string]$queueFile) {
    $folder = Split-Path -Parent $queueFile
    if (-not (Test-Path -LiteralPath $folder)) { $null = New-Item -ItemType Directory -Path $folder -Force }
    $status = [ordered]@{
        version = 1; machineName = $machine.Name; machineMode = 'user-input'; mode = $overall.mode
        state = $(if ($overall.mode -eq 'idle') { 'idle' } else { $overall.state }); source = $overall.source
        fileName = $overall.fileName; wafer = $overall.wafer; blk = $overall.blk; layer = $overall.layer; barcode = ''
        startedAt = $overall.startedAt; finishedAt = $overall.finishedAt; updatedAt = (Get-Date).ToUniversalTime().ToString('o'); writer = 'ongoing-monitor'
    }
    $json = $status | ConvertTo-Json
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $tempFile = $queueFile + '.tmp'
    try {
        [System.IO.File]::WriteAllText($tempFile, $json, $utf8)
        Move-Item -LiteralPath $tempFile -Destination $queueFile -Force
    } catch {
        [System.IO.File]::WriteAllText($queueFile, $json, $utf8)
        Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
    }
}

# ===== WEBSITE =====
# May bukas na bang window ng website? (pamagat na "BM Analyzer" sa Edge o Chrome)
function Test-WebsiteOpen {
    $processList = Get-Process -Name msedge, chrome -ErrorAction SilentlyContinue
    foreach ($process in $processList) { if ($process.MainWindowTitle -like '*BM Analyzer*') { return $true } }
    return $false
}

# Binubuksan ang website sa napiling browser (Dashboard page).
function Open-Website($config) {
    $indexPath = $config.IndexPath
    if ($indexPath -eq '') { $indexPath = Join-Path (Split-Path -Parent (Split-Path -Parent $scriptDir)) 'index.html' }
    if (-not (Test-Path $indexPath)) { Write-Log ('HINDI MAHANAP ang index.html: ' + $indexPath + ' (ayusin ang IndexPath sa ongoing-monitor-config.txt)'); return $false }
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

# ===== SIMULA =====
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, 'Local\BMWW_OngoingMonitor', [ref]$createdNew)
if (-not $createdNew) { Write-Log 'May tumatakbo nang Ongoing Monitor. Itinigil ang bago.'; exit 0 }

$config = Read-Config
$settingsFile = $null
$settingsStamp = [DateTime]::MinValue
$machine = $null
$stateMap = @{}
$lastWriteMs = [long]0
$lastKey = ''
$lastOpen = [DateTime]::MinValue
$lastWarn = [DateTime]::MinValue
Write-Log 'Simula ng Ongoing Monitor.'

while ($true) {
    $nowMs = [long]((Get-Date).ToUniversalTime() - $epoch).TotalMilliseconds
    # Hanapin at basahin ang settings ng machine (nire-reload kapag nagbago ang file).
    $foundFile = Find-SettingsFile $config
    if (-not $foundFile) {
        if (((Get-Date) - $lastWarn).TotalSeconds -gt 60) { Write-Log 'Walang settings file ng Sender. Ilagay ang SavingPath sa ongoing-monitor-config.txt (at i-Save ang Settings sa website).'; $lastWarn = Get-Date }
        Start-Sleep -Seconds 10; continue
    }
    $stamp = (Get-Item -LiteralPath $foundFile).LastWriteTime
    if ($foundFile -ne $settingsFile -or $stamp -ne $settingsStamp) {
        $machine = Read-Machine $foundFile
        $settingsFile = $foundFile; $settingsStamp = $stamp
        $stateMap = @{}; $lastKey = ''; $lastWriteMs = [long]0
        if ($machine) { Write-Log ('Settings: ' + $machine.Name + ' (' + $machine.Mode + ')') } else { Write-Log ('Hindi mabasa ang settings: ' + $foundFile) }
    }
    if (-not $machine -or $machine.Mode -ne 'user-input') {
        if (((Get-Date) - $lastWarn).TotalSeconds -gt 300) { Write-Log 'Hindi Sender ang machine (o sira ang settings). Walang binabantayan.'; $lastWarn = Get-Date }
        Start-Sleep -Seconds 30; continue
    }

    $hasChange = $false
    foreach ($key in $sourceKeyList) {
        $path = $machine.Paths[$key]
        if (-not $stateMap.ContainsKey($key)) { $stateMap[$key] = New-SourceState }
        if ($path -eq '' -or -not (Test-Path -LiteralPath $path)) { continue }
        try {
            $scan = Get-Snapshot $path $config
            $previous = $stateMap[$key]
            if (-not $previous.Snapshot) { $previous.Snapshot = $scan.Map; continue }
            $diff = Get-Diff $previous.Snapshot $scan.Map
            Update-Settle $previous.RecentNew $diff $nowMs ([long]([int]$config.SettleSeconds * 1000))
            $isActive = $diff.NewFiles.Count -or $diff.NewFolders.Count -or $diff.Changed.Count -or $diff.Removed.Count
            $detected = if ($key -eq 'source1' -and $isActive) { Get-CalibMode $path $config } else { '' }
            $timeoutMs = [long]([int]$config.($key.Substring(0, 1).ToUpper() + $key.Substring(1) + 'TimeoutSeconds') * 1000)
            $next = Get-NextState $key $previous $diff $scan.Map $nowMs $detected $timeoutMs
            $next.Snapshot = $scan.Map
            $next.RecentNew = $previous.RecentNew
            $stateMap[$key] = $next
            if ($isActive) { $hasChange = $true; Write-Log ('Pagbabago sa ' + $key + ': bago ' + $diff.NewFiles.Count + ', folder ' + $diff.NewFolders.Count + ', nabago ' + $diff.Changed.Count + ', nawala ' + $diff.Removed.Count) }
        } catch {
            if (((Get-Date) - $lastWarn).TotalSeconds -gt 60) { Write-Log ('Hindi mabasa ang ' + $key + ': ' + $path + ' - ' + $_.Exception.Message); $lastWarn = Get-Date }
        }
    }

    # Status sa Server path (kapag ang website ang kakasulat lang, ito ang masusunod).
    $serverPath = $machine.Paths.server
    $queueFile = ''
    if ($serverPath -ne '') { $queueFile = Join-Path (Join-Path $serverPath 'queue') (Get-QueueFileName $machine) }
    $isWebAlive = $queueFile -ne '' -and (Test-WebAlive $queueFile ([int]$config.WebAliveSeconds))
    if ($queueFile -ne '' -and -not $isWebAlive) {
        $overall = Get-Overall $stateMap
        $overallKey = ($overall | ConvertTo-Json -Compress)
        if ($overallKey -ne $lastKey -or ($nowMs - $lastWriteMs) -ge ([long]([int]$config.HeartbeatSeconds * 1000))) {
            try {
                Write-Queue $machine $overall $queueFile
                if ($overallKey -ne $lastKey) { Write-Log ('Status: ' + $overall.state + ' ' + $overall.mode + ' ' + $overall.fileName) }
                $lastKey = $overallKey; $lastWriteMs = $nowMs
            } catch {
                if (((Get-Date) - $lastWarn).TotalSeconds -gt 60) { Write-Log ('Hindi masulat ang status sa Server path: ' + $_.Exception.Message); $lastWarn = Get-Date }
            }
        }
    }

    # Buksan ang website kapag may pagbabago (para ma-update ang Dashboard ng Sender).
    if ($hasChange -and $config.OpenWebsite -eq 'yes') {
        if (((Get-Date) - $lastOpen).TotalSeconds -lt [int]$config.CooldownSeconds) { Write-Log 'Laktawan: nasa cooldown pa.' }
        elseif ($config.SkipIfOpen -eq 'yes' -and ($isWebAlive -or (Test-WebsiteOpen))) { Write-Log 'Laktawan: bukas na ang website.'; $lastOpen = Get-Date }
        elseif (Open-Website $config) { $lastOpen = Get-Date }
    }
    Start-Sleep -Seconds ([int]$config.PollSeconds)
}
