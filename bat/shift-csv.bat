@echo off
REM ======================================================================
REM FILE    : shift-csv.bat
REM ANO     : Gumagawa ng CSV ng RESULT ng isang shift (ang tunay na record;
REM           ang Excel ay pormat lang nito). Hindi tuloy-tuloy: tumatakbo,
REM           gumagawa, at humihinto.
REM           Ang CSV ay isinusulat sa shift folder ng Saving path:
REM             <saving>\yyyy-mm-dd_<shift>\yyyy-mm-dd_<shift>_monitoring.csv
REM           Kokopyahin ito ng server-sync.bat sa Server path gaya ng ibang
REM           file sa Saving path.
REM PAGGAMIT:
REM             shift-csv.bat
REM               Kinukuha ang mga shift (huling 2 araw) na TAPOS NA at wala
REM               pang CSV. Ito ang ginagamit sa katapusan ng shift at bilang
REM               panghabol kapag walang nagawa noon.
REM             shift-csv.bat yyyy-mm-dd_morning   (o _night)
REM               Gumagawa para sa shift na iyon kahit hindi pa tapos, at
REM               pinapalitan ang kasalukuyang CSV. Pang-test ito. Kapag hindi
REM               pa tapos ang shift, ongoing ang huling lote at blangko ang
REM               End Measure nito.
REM INPUT   : settings.ini sa tabi ng bat (gawa ng macro tuwing Start). Mula
REM           sa Saving path, para sa shift na iyon:
REM             lot tracking\lot tracking\<machine>_<date>_<shift>_lottracking.txt
REM             <shift folder>\remarks.txt           (Remarks)
REM             <shift folder>\inputs.txt            (Operator, Previous, Next;
REM                                                   kung meron)
REM             lot tracking\measures\<machine>_measures_yyyy-mm.txt
REM                                                  (Measurement #)
REM             lot tracking\marks\<machine>_marks_yyyy-mm.txt   (Mark)
REM OUTPUT  : isang CSV (UTF-8 na may BOM, para tama ang basa ng Excel). Ang
REM           mga column ay ang RESULT ng Lot Tracking: Date, Lot Unit,
REM           Wafer, Rowbar No., Blk, Measurement #, Mark, Start Measure,
REM           End Measure, Status, Machine name, Operator, Previous Process,
REM           Next Process, Remarks. Isang row kada measurement, pinakauna
REM           ang pinakamaaga.
REM PANUNTUNAN (Lot Tracking spec v3.1, seksyon 7 at 12):
REM           - End Measure = Start Measure ng SUSUNOD na file; done ito.
REM           - Ang huling file: End = End ng shift (kapag tapos na ang shift).
REM           - Walang duplicate: kapag may CSV na, hindi na ginagawa ulit
REM             (maliban sa may pangalan ng shift sa command line).
REM           - Isinusulat muna sa .tmp, tapos nire-rename.
REM           - BASA LANG ang lahat ng pinagkukunan (Rule 7).
REM NOTE    : Kapag walang inputs.txt, blangko ang Operator, Previous at
REM           Next. (Ang pagsulat ng inputs.txt ay hiwalay na macro task.)
REM           Ang Measurement # ay kinukuha sa measure log kung nandoon na;
REM           blangko kung wala pa.
REM           Ang PowerShell code ay nasa ibaba ng file na ito, pagkatapos
REM           ng marker line; binabasa ito ng bat at pinapatakbo.
REM VERSION: v1 | 2026-11-28 | Unang version (macro task 2A, end-of-shift CSV)
REM ======================================================================

setlocal EnableExtensions DisableDelayedExpansion

REM ---- CONFIG: dito lang babaguhin ----
set "catchUpDays=2"
REM ---- katapusan ng CONFIG ----

set "baseDir=%~dp0"
set "shiftArg=%~1"
set "scriptFile=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:scriptFile); $i=$s.IndexOf('#'+'PS_BEGIN'); if($i -lt 0){exit 2}; Invoke-Expression $s.Substring($i)"
set "psExit=%errorlevel%"
echo %cmdcmdline% | find /i "%~nx0" >nul 2>&1
if not errorlevel 1 pause
exit /b %psExit%
#PS_BEGIN
$ErrorActionPreference = 'Stop'
$ci = [Globalization.CultureInfo]::InvariantCulture
$fmt = 'yyyy-MM-dd HH:mm:ss'
$base = $env:baseDir
$shiftArg = $env:shiftArg
$catchUpDays = 2
if ($env:catchUpDays -match '^\d+$') { $catchUpDays = [int]$env:catchUpDays }

# Pinagdudugtong ang mga bahagi ng path (tama ang separator sa kahit anong PC).
function Join-Parts([string]$root, [string[]]$parts) {
    $p = $root
    foreach ($x in $parts) { $p = Join-Path $p $x }
    return $p
}

# Binabasa ang settings.ini (key=value).
function Read-Ini([string]$path) {
    $h = @{}
    foreach ($l in (Get-Content -LiteralPath $path)) {
        $i = $l.IndexOf('=')
        if ($i -gt 0) { $h[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim() }
    }
    return $h
}

# Simula at katapusan ng isang shift folder (yyyy-mm-dd_morning o _night).
# Ang Night na tumatawid ng hatinggabi ay nasa petsa ng simula nito.
function Get-ShiftWindow([string]$folder, $ini) {
    if ($folder -notmatch '^(\d{4}-\d{2}-\d{2})_(morning|night)$') { return $null }
    $date = $Matches[1]; $name = $Matches[2]
    $s = [datetime]::ParseExact($date + ' ' + $ini[$name + '_start'], $fmt, $ci)
    $e = [datetime]::ParseExact($date + ' ' + $ini[$name + '_end'], $fmt, $ci)
    if ($e -le $s) { $e = $e.AddDays(1) }
    return [pscustomobject]@{ Folder = $folder; Date = $date; Shift = $name; Start = $s; End = $e }
}

# Isang field ng CSV: may quote kapag may kuwit, quote, o bagong linya.
function Q([string]$v) {
    if ($null -eq $v) { return '' }
    if ($v -match '[,"\r\n]' -or $v -ne $v.Trim()) { return '"' + $v.Replace('"', '""') + '"' }
    return $v
}

# Binabasa ang lahat ng linya ng mga log file ng machine para sa mga buwan.
function Read-MonthLogs([string]$dir, [string]$machine, [string]$middle, [string[]]$months) {
    $out = @()
    if (-not (Test-Path -LiteralPath $dir)) { return $out }
    foreach ($m in $months) {
        $f = Join-Path $dir ($machine + $middle + $m + '.txt')
        if (Test-Path -LiteralPath $f) { $out += @(Get-Content -LiteralPath $f -ErrorAction SilentlyContinue) }
    }
    return $out
}

# Gumagawa ng CSV ng isang shift. Ibinabalik ang 'created', 'skipped', o 'none'.
function Build-ShiftCsv($w, $ini, [datetime]$now, [bool]$force) {
    $saving = $ini['saving_path'].TrimEnd('\', '/')
    $machine = $ini['machine_name']
    $shiftDir = Join-Path $saving $w.Folder
    $csvName = $w.Folder + '_monitoring.csv'
    $csvPath = Join-Path $shiftDir $csvName
    if ((-not $force) -and (Test-Path -LiteralPath $csvPath)) { return 'skipped' }

    $trackFile = Join-Parts $saving @('lot tracking', 'lot tracking', ($machine + '_' + $w.Date + '_' + $w.Shift + '_lottracking.txt'))
    if (-not (Test-Path -LiteralPath $trackFile)) { return 'none' }

    # --- mga row ng lot tracking file ---
    $rows = @(); $seen = @{}
    foreach ($l in (Get-Content -LiteralPath $trackFile)) {
        $f = $l.Split('|')
        if ($f.Count -lt 9) { continue }
        $name = $f[2].Trim()
        if ($seen.ContainsKey($name)) { continue }
        $seen[$name] = 1
        try { $t = [datetime]::ParseExact($f[0].Trim(), $fmt, $ci) } catch { continue }
        $rows += [pscustomobject]@{ Start = $t; Name = $name; Lot = $f[3].Trim(); Wafer = $f[4].Trim(); Rowbar = $f[5].Trim(); Blk = $f[6].Trim(); Machine = $f[7].Trim() }
    }
    if ($rows.Count -eq 0) { return 'none' }
    $rows = @($rows | Sort-Object Start, Name)

    # --- Remarks (remarks.txt: file name|remark|oras) ---
    $remarks = @{}
    $remarksFile = Join-Path $shiftDir 'remarks.txt'
    if (Test-Path -LiteralPath $remarksFile) {
        foreach ($l in (Get-Content -LiteralPath $remarksFile)) {
            $f = $l.Split('|')
            if ($f.Count -ge 2) { $remarks[$f[0].Trim()] = $f[1].Trim() }
        }
    }

    # --- Operator, Previous, Next (inputs.txt: file name | operator | previous | next) ---
    $inputs = @{}
    $inputsFile = Join-Path $shiftDir 'inputs.txt'
    if (Test-Path -LiteralPath $inputsFile) {
        foreach ($l in (Get-Content -LiteralPath $inputsFile)) {
            $f = $l.Split('|')
            if ($f.Count -ge 4) { $inputs[$f[0].Trim()] = @($f[1].Trim(), $f[2].Trim(), $f[3].Trim()) }
        }
    }

    # --- mga buwan na babasahin sa logs ---
    $months = @{}
    foreach ($r in $rows) {
        $months[$r.Start.ToString('yyyy-MM', $ci)] = 1
        $months[$r.Start.AddMonths(1).ToString('yyyy-MM', $ci)] = 1
    }
    $months[$now.ToString('yyyy-MM', $ci)] = 1
    $monthList = @($months.Keys)
    $ownMonths = @($rows | ForEach-Object { $_.Start.ToString('yyyy-MM', $ci) } | Sort-Object -Unique)

    # --- Measurement # at operator sa measure log (event_time | written | machine | lot | wafer | file | # | remarks | operator) ---
    $measureNo = @{}; $measureOp = @{}
    $measuresDir = Join-Parts $saving @('lot tracking', 'measures')
    foreach ($l in @(Read-MonthLogs $measuresDir $machine '_measures_' $ownMonths)) {
        $f = $l.Split('|')
        if ($f.Count -ge 7) {
            $k = $f[5].Trim()
            $measureNo[$k] = $f[6].Trim()
            if ($f.Count -ge 9) { $measureOp[$k] = $f[8].Trim() }
        }
    }

    # --- Mark (event_time | machine | lot | file | MARK/UNMARK | operator | note); ang huling event ang mananaig ---
    $events = @()
    $marksDir = Join-Parts $saving @('lot tracking', 'marks')
    foreach ($l in @(Read-MonthLogs $marksDir $machine '_marks_' $monthList)) {
        $f = $l.Split('|')
        if ($f.Count -ge 5) {
            try { $events += [pscustomobject]@{ T = [datetime]::ParseExact($f[0].Trim(), $fmt, $ci); File = $f[3].Trim(); Ev = $f[4].Trim().ToUpper() } } catch { }
        }
    }
    $marked = @{}
    foreach ($e in ($events | Sort-Object T)) {
        if ($e.Ev -eq 'MARK') { $marked[$e.File] = 1 }
        elseif ($e.Ev -eq 'UNMARK') { $marked.Remove($e.File) }
    }

    # --- buuin ang CSV ---
    $headers = @('Date', 'Lot Unit', 'Wafer', 'Rowbar No.', 'Blk', 'Measurement #', 'Mark', 'Start Measure', 'End Measure', 'Status', 'Machine name', 'Operator', 'Previous Process', 'Next Process', 'Remarks')
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append(($headers | ForEach-Object { Q $_ }) -join ',')
    [void]$sb.Append("`r`n")
    for ($i = 0; $i -lt $rows.Count; $i++) {
        $r = $rows[$i]
        $endText = ''; $status = 'ongoing'
        if ($i -lt ($rows.Count - 1)) {
            $endT = $rows[$i + 1].Start
            $endText = $endT.ToString($fmt, $ci); $status = 'done'
        } elseif ($now -ge $w.End) {
            $endT = $w.End
            if ($endT -lt $r.Start) { $endT = $r.Start }
            $endText = $endT.ToString($fmt, $ci); $status = 'done'
        }
        $op = ''; $prev = ''; $next = ''
        if ($inputs.ContainsKey($r.Name)) { $op = $inputs[$r.Name][0]; $prev = $inputs[$r.Name][1]; $next = $inputs[$r.Name][2] }
        if ($op -eq '' -and $measureOp.ContainsKey($r.Name)) { $op = $measureOp[$r.Name] }
        $no = ''; if ($measureNo.ContainsKey($r.Name)) { $no = $measureNo[$r.Name] }
        $mark = ''; if ($marked.ContainsKey($r.Name)) { $mark = 'New count' }
        $rem = ''; if ($remarks.ContainsKey($r.Name)) { $rem = $remarks[$r.Name] }
        $cells = @($w.Date, $r.Lot, $r.Wafer, $r.Rowbar, $r.Blk, $no, $mark, $r.Start.ToString($fmt, $ci), $endText, $status, $r.Machine, $op, $prev, $next, $rem)
        [void]$sb.Append((($cells | ForEach-Object { Q ([string]$_) }) -join ','))
        [void]$sb.Append("`r`n")
    }

    # --- isulat sa .tmp, tapos i-rename ---
    if (-not (Test-Path -LiteralPath $shiftDir)) { New-Item -ItemType Directory -Path $shiftDir -Force | Out-Null }
    $tmp = $csvPath + '.tmp'
    [IO.File]::WriteAllText($tmp, $sb.ToString(), (New-Object System.Text.UTF8Encoding($true)))
    Move-Item -LiteralPath $tmp -Destination $csvPath -Force
    Write-Host ('Nagawa: ' + $csvPath + ' (' + $rows.Count + ' row)')
    return 'created'
}

# ---------------- MAIN ----------------
try {
    $iniPath = Join-Path $base 'settings.ini'
    if (-not (Test-Path -LiteralPath $iniPath)) { Write-Host 'Walang settings.ini. Pindutin muna ang Start sa macro.'; exit 1 }
    $ini = Read-Ini $iniPath
    foreach ($k in @('saving_path', 'machine_name', 'morning_start', 'morning_end', 'night_start', 'night_end')) {
        if (-not $ini[$k]) { Write-Host ('Kulang ang ' + $k + ' sa settings.ini.'); exit 1 }
    }
    $saving = $ini['saving_path'].TrimEnd('\', '/')
    if (-not (Test-Path -LiteralPath $saving)) { Write-Host 'Hindi makita ang Saving path.'; exit 1 }
    $now = Get-Date
    if ($env:shiftNow) { $now = [datetime]::ParseExact($env:shiftNow, $fmt, $ci) }   # pang-test lang

    if ($shiftArg) {
        $w = Get-ShiftWindow $shiftArg $ini
        if ($null -eq $w) { Write-Host 'Mali ang pangalan ng shift. Halimbawa: 2026-11-28_morning'; exit 1 }
        $res = Build-ShiftCsv $w $ini $now $true
        if ($res -eq 'none') { Write-Host ('Walang lote sa lot tracking file ng ' + $shiftArg + '.') }
    } else {
        $made = 0
        foreach ($d in (Get-ChildItem -LiteralPath $saving -Directory -ErrorAction SilentlyContinue)) {
            $w = Get-ShiftWindow $d.Name $ini
            if ($null -eq $w) { continue }
            if ($w.End -gt $now) { continue }
            if ($w.End -lt $now.AddDays(-$catchUpDays)) { continue }
            if ((Build-ShiftCsv $w $ini $now $false) -eq 'created') { $made++ }
        }
        if ($made -eq 0) { Write-Host 'Walang kailangang gawing CSV ngayon.' }
    }
    exit 0
} catch {
    Write-Host 'May problema sa paggawa ng CSV. Subukan ulit; kung ganoon pa rin, tingnan ang settings.ini at ang Saving path.'
    exit 1
}
