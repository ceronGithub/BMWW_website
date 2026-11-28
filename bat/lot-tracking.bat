@echo off
REM ======================================================================
REM FILE    : lot-tracking.bat
REM ANO     : Tuloy-tuloy na binabasa ang Data source 2 at 3. Kada bagong
REM           file o folder na pasok sa pattern ng Lot Unit, halimbawa
REM           4A25C20A_261020134704, isinusulat ang isang linya sa lot
REM           tracking file ng shift at sa lot monitoring file ng araw.
REM           Kapag may bagong lote at sarado ang macro, bubuksan ito.
REM INPUT   : settings.ini sa tabi ng bat. Gawa ito ng macro tuwing Start.
REM OUTPUT  : Sa Saving path:
REM             lot tracking\lot tracking\MACHINE_yyyy-mm-dd_SHIFT_lottracking.txt
REM             lot tracking\lot monitoring\MACHINE_yyyy-mm-dd_lotmonitoring.txt
REM             SHIFTFOLDER\processed.txt at skipped.log
REM           Sa tabi ng bat:
REM             lot-tracking.live  = ongoing, location, start measure
REM             lot-tracking.alive = heartbeat; ang oras ng huling pagbabago
REM                                  ng file ang palatandaan na tumatakbo
REM LINYA   : startMeasure, location, fileName, lotUnit, wafer, rowbar,
REM           blk, machine, shift. Pinaghihiwalay ng pipe na character.
REM           Ang startMeasure ay CREATION TIME ng file.
REM STOP    : gumawa ng file na lot-tracking.stop sa tabi ng bat, o
REM           matapos ang shift. Binubura ng bat ang lumang stop file sa
REM           bawat simula.
REM NOTE    : Ang start ng macro ay may 9 na nul para hindi mamana ng Excel
REM           ang lock handle ng bat (kung hindi, mabo-block ang susunod
REM           na simula ng bat habang bukas ang Excel).
REM           Binabasa lang ang Data source 2 at 3 (Rule 7). Ang
REM           paglilipat sa Server path ay trabaho ng server-sync.bat.
REM           Ang creation time ay kinukuha ng PowerShell, kasi hindi
REM           pare-pareho ang format ng dir sa bawat PC.
REM MEASURE: Kapag may Remarks (OK o Onhold) na sa remarks.txt ng shift
REM           folder at wala pa sa measured.txt, isang linya ang idadagdag sa
REM             <saving>\lot tracking\measures\<machine>_measures_yyyy-mm.txt
REM           event_time | written_time | machine | lot unit | wafer |
REM           file name | measurement # | remarks | operator
REM           event_time = creation time ng file. Ang measurement # ay
REM           binibilang mula sa measure logs (sariling Saving at kopya sa
REM           Server) at marks logs, ng LAHAT ng machine, mula sa huling Mark.
REM           Basa lang ang Server (Rule 7). Kapag offline ang Server, lokal
REM           lang ang bilang. Blangko ang operator hanggang isulat ng macro
REM           ang inputs.txt.
REM VERSION: v2 | 2026-11-28 | Measure log (macro task 1, Hold Lots)
REM VERSION: v1 | 2026-11-28 | Unang version (macro task 1)
REM ======================================================================

setlocal EnableExtensions DisableDelayedExpansion

REM ---- CONFIG: dito lang babaguhin ----
set "workbookName=MACHINE_MACRO.xlsm"
set "pollSeconds=5"
set "relaunchWaitCycles=12"
set "lockRetryLimit=4"
set "namePattern=^[A-Za-z0-9]{8}_[0-9]{12}$"
REM ---- katapusan ng CONFIG ----

set "baseDir=%~dp0"
set "iniFile=%baseDir%settings.ini"
set "stopFile=%baseDir%lot-tracking.stop"
set "aliveFile=%baseDir%lot-tracking.alive"
set "liveFile=%baseDir%lot-tracking.live"
set "lockFile=%baseDir%lot-tracking.lock"
set "scanFile=%baseDir%lot-tracking.scan.tmp"
set "newLinesFile=%baseDir%lot-tracking.new.tmp"
set "newProcessedFile=%baseDir%lot-tracking.proc.tmp"
set "newSkippedFile=%baseDir%lot-tracking.skip.tmp"
set "liveTempFile=%baseDir%lot-tracking.live.tmp"
set "measureNewFile=%baseDir%lot-tracking.measure.tmp"
set "measureCountFile=%baseDir%lot-tracking.count.tmp"
set /a pingCount=pollSeconds+1
set "lockTries=0"
set "mainRan="

:acquireLock
set /a lockTries+=1
2>nul (9>>"%lockFile%" call :main)
if defined mainRan goto :finish
if %lockTries% GEQ %lockRetryLimit% goto :alreadyRunning
ping -n 6 127.0.0.1 >nul
goto :acquireLock

:alreadyRunning
echo May tumatakbo nang lot-tracking.bat. Isinara ang pangalawa.
goto :finish

:finish
endlocal
exit /b 0

REM ======================================================================
REM :main - ang buong takbo. Laging exit /b 0 ang labas.
REM ======================================================================
:main
set "mainRan=1"
if exist "%stopFile%" del /q "%stopFile%" >nul 2>&1
call :readSettings
if errorlevel 1 goto :noSettings
if not defined ini_shift_folder goto :outsideShift
set "runShiftFolder=%ini_shift_folder%"
set "macroWaitCycles=0"
echo lot-tracking nagsimula para sa %runShiftFolder%
goto :mainLoop

:noSettings
echo Walang settings.ini o kulang ito. Pindutin muna ang Start sa macro.
exit /b 0

:outsideShift
echo Labas ng shift. Walang imo-monitor.
exit /b 0

:mainLoop
>"%aliveFile%" echo running
if exist "%stopFile%" goto :stopRequested
call :readSettings
if errorlevel 1 goto :sleepCycle
if not "%ini_shift_folder%"=="%runShiftFolder%" goto :shiftEnded

set "shiftDate=%runShiftFolder:~0,10%"
set "shiftName=%runShiftFolder:~11%"
if /i "%shiftName%"=="night" (set "shiftStartTime=%ini_night_start%") else (set "shiftStartTime=%ini_morning_start%")
set "shiftStart=%shiftDate% %shiftStartTime%"

set "savingRoot=%ini_saving_path%"
if "%savingRoot:~-1%"=="\" set "savingRoot=%savingRoot:~0,-1%"
set "shiftDir=%savingRoot%\%runShiftFolder%"
set "trackingDir=%savingRoot%\lot tracking\lot tracking"
set "monitoringDir=%savingRoot%\lot tracking\lot monitoring"
set "trackingFile=%trackingDir%\%ini_machine_name%_%shiftDate%_%shiftName%_lottracking.txt"
set "monitoringFile=%monitoringDir%\%ini_machine_name%_%shiftDate%_lotmonitoring.txt"
set "processedFile=%shiftDir%\processed.txt"
set "skippedFile=%shiftDir%\skipped.log"
set "remarksFile=%shiftDir%\remarks.txt"
set "measuredFile=%shiftDir%\measured.txt"
set "measuresDir=%savingRoot%\lot tracking\measures"
set "marksDir=%savingRoot%\lot tracking\marks"
set "serverMeasuresDir="
set "serverMarksDir="
if defined ini_server_path call :buildServerDirs

if not exist "%shiftDir%\" mkdir "%shiftDir%" >nul 2>&1
if not exist "%trackingDir%\" mkdir "%trackingDir%" >nul 2>&1
if not exist "%monitoringDir%\" mkdir "%monitoringDir%" >nul 2>&1
if not exist "%shiftDir%\" goto :sleepCycle
if not exist "%trackingDir%\" goto :sleepCycle
if not exist "%monitoringDir%\" goto :sleepCycle

>"%newLinesFile%" type nul
>"%newProcessedFile%" type nul
>"%newSkippedFile%" type nul
>"%liveTempFile%" type nul

set "scanLocation=DS2"
set "scanDir=%ini_data_source_2%"
call :scanSource
set "scanLocation=DS3"
set "scanDir=%ini_data_source_3%"
call :scanSource

set "newLinesSize=0"
set "newProcessedSize=0"
set "liveSize=0"
for %%S in ("%newLinesFile%") do set "newLinesSize=%%~zS"
for %%S in ("%newProcessedFile%") do set "newProcessedSize=%%~zS"
for %%S in ("%liveTempFile%") do set "liveSize=%%~zS"

if "%newProcessedSize%"=="0" goto :afterCommit
if "%newLinesSize%"=="0" goto :commitProcessed
call :appendWithTemp "%trackingFile%" "%newLinesFile%"
if errorlevel 1 goto :afterCommit
call :appendWithTemp "%monitoringFile%" "%newLinesFile%"
if errorlevel 1 goto :afterCommit

:commitProcessed
>>"%processedFile%" type "%newProcessedFile%"
>>"%skippedFile%" type "%newSkippedFile%"
if not "%liveSize%"=="0" move /y "%liveTempFile%" "%liveFile%" >nul 2>&1
if "%newLinesSize%"=="0" goto :afterCommit
if %macroWaitCycles% GTR 0 goto :afterCommit
if exist "%baseDir%~$%workbookName%" goto :afterCommit
if not exist "%baseDir%%workbookName%" goto :afterCommit
start "" "%baseDir%%workbookName%" 9>nul
set "macroWaitCycles=%relaunchWaitCycles%"

:afterCommit
if %macroWaitCycles% GTR 0 set /a macroWaitCycles-=1
call :writeMeasures

:sleepCycle
ping -n %pingCount% 127.0.0.1 >nul
goto :mainLoop

:stopRequested
echo Stop requested. Titigil ang lot-tracking.
goto :exitLoop

:shiftEnded
echo Tapos na ang shift. Titigil ang lot-tracking.
goto :exitLoop

:exitLoop
del /q "%aliveFile%" "%scanFile%" "%newLinesFile%" "%newProcessedFile%" "%newSkippedFile%" "%liveTempFile%" "%measureNewFile%" "%measureCountFile%" >nul 2>&1
exit /b 0

REM ======================================================================
REM :readSettings - binabasa ang settings.ini sa mga variable na ini_...
REM Errorlevel 1 kapag walang file o kulang ang kailangang key.
REM ======================================================================
:readSettings
if not exist "%iniFile%" exit /b 1
set "ini_data_source_2="
set "ini_data_source_3="
set "ini_saving_path="
set "ini_machine_name="
set "ini_morning_start="
set "ini_night_start="
set "ini_shift_folder="
set "ini_server_path="
for /f "usebackq delims=" %%A in ("%iniFile%") do call :storeSetting "%%A"
if not defined ini_data_source_2 exit /b 1
if not defined ini_data_source_3 exit /b 1
if not defined ini_saving_path exit /b 1
if not defined ini_machine_name exit /b 1
if not defined ini_morning_start exit /b 1
if not defined ini_night_start exit /b 1
exit /b 0

REM Isang linya ng settings.ini (key=value). Ang value ay ang lahat ng
REM nasa kanan ng unang equals sign, kaya ayos lang kahit blangko.
:storeSetting
set "settingLine=%~1"
set "settingKey="
for /f "tokens=1 delims==" %%K in ("%settingLine%") do set "settingKey=%%K"
set "settingValue=%settingLine:*==%"
if "%settingKey%"=="data_source_2" set "ini_data_source_2=%settingValue%"
if "%settingKey%"=="data_source_3" set "ini_data_source_3=%settingValue%"
if "%settingKey%"=="saving_path" set "ini_saving_path=%settingValue%"
if "%settingKey%"=="machine_name" set "ini_machine_name=%settingValue%"
if "%settingKey%"=="morning_start" set "ini_morning_start=%settingValue%"
if "%settingKey%"=="night_start" set "ini_night_start=%settingValue%"
if "%settingKey%"=="shift_folder" set "ini_shift_folder=%settingValue%"
if "%settingKey%"=="server_path" set "ini_server_path=%settingValue%"
exit /b 0

REM ======================================================================
REM :scanSource - inililista ang laman ng scanDir (file at folder) na
REM nagawa mula sa simula ng shift, pinakaluma muna. Bawat isa ay
REM ipinapasa sa :handleEntry. Ginagamit ang scanDir, scanLocation,
REM shiftStart, at namePattern.
REM ======================================================================
:scanSource
if not exist "%scanDir%\" exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[datetime]::ParseExact($env:shiftStart,'yyyy-MM-dd HH:mm:ss',[Globalization.CultureInfo]::InvariantCulture); Get-ChildItem -LiteralPath $env:scanDir -Force -ErrorAction SilentlyContinue | Where-Object { -not ($_.Attributes -band 6) -and $_.CreationTime -ge $t } | Sort-Object CreationTime | ForEach-Object { if($_.PSIsContainer){$n=$_.Name;$k='D'}else{$n=$_.BaseName;$k='F'}; $ok=if($n -match $env:namePattern){'1'}else{'0'}; $_.CreationTime.ToString('yyyy-MM-dd HH:mm:ss',[Globalization.CultureInfo]::InvariantCulture)+'|'+$n+'|'+$k+'|'+$ok }" >"%scanFile%" 2>nul
for /f "usebackq tokens=1-4 delims=|" %%A in ("%scanFile%") do call :handleEntry "%%A" "%%B" "%%C" "%%D"
exit /b 0

REM ======================================================================
REM :handleEntry - isang file o folder. Kapag nakita na sa processed.txt,
REM laktaw. Kapag hindi tumama sa pattern, sa skipped.log. Kapag tama,
REM isang linya sa new.tmp at update ng live.
REM Mga argumento: oras ng creation, pangalan, F o D, 1 o 0 kung tama.
REM ======================================================================
:handleEntry
set "entryTime=%~1"
set "entryName=%~2"
set "entryKind=%~3"
set "entryValid=%~4"
setlocal EnableDelayedExpansion
findstr /x /l /c:"!entryName!" "%processedFile%" >nul 2>&1
if not errorlevel 1 exit /b 0
findstr /x /l /c:"!entryName!" "%newProcessedFile%" >nul 2>&1
if not errorlevel 1 exit /b 0
>>"%newProcessedFile%" echo(!entryName!
if "!entryValid!"=="0" goto :entrySkipped
set "lotUnit=!entryName:~0,8!"
set "waferCode=!entryName:~0,5!"
set "rowbarNumber=!entryName:~5,2!"
set "blockLetter=!entryName:~7,1!"
set "lineText=!entryTime!|%scanLocation%|!entryName!|!lotUnit!|!waferCode!|!rowbarNumber!|!blockLetter!|%ini_machine_name%|%shiftName%"
set "liveText=!entryName!|%scanLocation%|!entryTime!"
>>"%newLinesFile%" echo(!lineText!
>"%liveTempFile%" echo(!liveText!
exit /b 0

:entrySkipped
set "skipText=!entryTime!|%scanLocation%|!entryKind!|!entryName!"
>>"%newSkippedFile%" echo(!skipText!
exit /b 0

REM ======================================================================
REM :buildServerDirs - ang measures at marks folder sa Server path (basa
REM lang). Walang laman kung blangko ang server_path.
REM ======================================================================
:buildServerDirs
set "serverRootDir=%ini_server_path%"
if "%serverRootDir:~-1%"=="\" set "serverRootDir=%serverRootDir:~0,-1%"
set "serverMeasuresDir=%serverRootDir%\lot tracking\measures"
set "serverMarksDir=%serverRootDir%\lot tracking\marks"
exit /b 0

REM ======================================================================
REM :writeMeasures - bawat lote sa remarks.txt na wala pa sa measured.txt
REM ay isinusulat sa measure log. Isang beses lang kada lote (walang
REM duplicate). Kapag kulang ang kailangan, laktaw at uulitin sa susunod.
REM ======================================================================
:writeMeasures
if not exist "%remarksFile%" exit /b 0
if not exist "%measuresDir%\" mkdir "%measuresDir%" >nul 2>&1
if not exist "%measuresDir%\" exit /b 0
for /f "usebackq tokens=1,2 delims=|" %%A in ("%remarksFile%") do call :measureEntry "%%A" "%%B"
exit /b 0

REM ======================================================================
REM :measureEntry - isang lote. Mga argumento: file name at remarks (OK o
REM Onhold). Kinukuha ang creation time at lot unit sa lot tracking file,
REM kinukuwenta ang measurement #, at isinusulat ang linya sa measure log.
REM ======================================================================
:measureEntry
set "measureName=%~1"
set "measureRemark=%~2"
if not defined measureName exit /b 0
if not defined measureRemark exit /b 0
findstr /x /l /c:"%measureName%" "%measuredFile%" >nul 2>&1
if not errorlevel 1 exit /b 0

set "measureStart="
set "measureLot="
set "measureWafer="
for /f "usebackq tokens=1-9 delims=|" %%a in (`findstr /l /c:"|%measureName%|" "%trackingFile%"`) do call :storeTrackingLine "%%a" "%%d" "%%e"
if not defined measureStart exit /b 0
if not defined measureLot exit /b 0

set "mLot=%measureLot%"
set "mEvent=%measureStart%"
set "mMachine=%ini_machine_name%"
set "mOwnMeasures=%measuresDir%"
set "mServerMeasures=%serverMeasuresDir%"
set "mOwnMarks=%marksDir%"
set "mServerMarks=%serverMarksDir%"
if exist "%measureCountFile%" del /q "%measureCountFile%" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { $ci=[Globalization.CultureInfo]::InvariantCulture; $fmt='yyyy-MM-dd HH:mm:ss'; $lot=$env:mLot; $evt=[datetime]::ParseExact($env:mEvent,$fmt,$ci); $mons=@((Get-Date).ToString('yyyy-MM',$ci),(Get-Date).AddMonths(-1).ToString('yyyy-MM',$ci)); function Rd($dir,$mid){ if($dir -and (Test-Path -LiteralPath $dir)){ foreach($m in $mons){ foreach($f in @(Get-ChildItem -LiteralPath $dir -Filter ('*'+$mid+$m+'.txt') -File -ErrorAction SilentlyContinue)){ Get-Content -LiteralPath $f.FullName -ErrorAction SilentlyContinue } } } }; $seen=@{}; $byFile=@{}; foreach($l in (@(Rd $env:mOwnMeasures '_measures_')+@(Rd $env:mServerMeasures '_measures_'))){ try { $f=$l.Split('|'); if($f.Count -ge 6){ $t=[datetime]::ParseExact($f[0].Trim(),$fmt,$ci); $byFile[$f[5].Trim()]=$t; if($f[3].Trim() -eq $lot){ $seen[$f[2].Trim()+'|'+$f[5].Trim()]=$t } } } catch {} }; $ev=@(); foreach($l in (@(Rd $env:mOwnMarks '_marks_')+@(Rd $env:mServerMarks '_marks_'))){ try { $f=$l.Split('|'); if($f.Count -ge 5 -and $f[2].Trim() -eq $lot){ $ev+=[pscustomobject]@{T=[datetime]::ParseExact($f[0].Trim(),$fmt,$ci);F=$f[3].Trim();E=$f[4].Trim().ToUpper()} } } catch {} }; $marked=@{}; foreach($e in ($ev | Sort-Object T)){ if($e.E -eq 'MARK'){ $marked[$e.F]=1 } elseif($e.E -eq 'UNMARK'){ $marked.Remove($e.F) } }; $mt=[datetime]::MinValue; foreach($k in @($marked.Keys)){ $ft=$null; if($byFile.ContainsKey($k)){ $ft=$byFile[$k] } elseif($k.Length -ge 21){ try { $ft=[datetime]::ParseExact($k.Substring(9,12),'yyMMddHHmmss',$ci) } catch {} }; if($ft -ne $null -and $ft -le $evt -and $ft -gt $mt){ $mt=$ft } }; $n=1; foreach($v in $seen.Values){ if($v -ge $mt -and $v -lt $evt){ $n++ } }; $n.ToString()+'|'+(Get-Date).ToString($fmt,$ci) } catch {}" >"%measureCountFile%" 2>nul
set "measureResult="
if exist "%measureCountFile%" set /p measureResult=<"%measureCountFile%"
if not defined measureResult exit /b 0

set "measureNumber="
set "writtenTime="
for /f "tokens=1,2 delims=|" %%a in ("%measureResult%") do (set "measureNumber=%%a" & set "writtenTime=%%b")
if not defined measureNumber exit /b 0
if not defined writtenTime exit /b 0

set "measureLog=%measuresDir%\%ini_machine_name%_measures_%measureStart:~0,7%.txt"
setlocal EnableDelayedExpansion
set "measureLine=!measureStart! | !writtenTime! | !ini_machine_name! | !measureLot! | !measureWafer! | !measureName! | !measureNumber! | !measureRemark! | "
>"!measureNewFile!" echo(!measureLine!
call :appendWithTemp "!measureLog!" "!measureNewFile!"
if errorlevel 1 (endlocal & exit /b 0)
>>"!measuredFile!" echo(!measureName!
endlocal
exit /b 0

REM Isang linya ng lot tracking file: oras ng creation (token a), lot unit
REM (token d), at wafer (token e).
:storeTrackingLine
if defined measureStart exit /b 0
set "measureStart=%~1"
set "measureLot=%~2"
set "measureWafer=%~3"
exit /b 0

REM ======================================================================
REM :appendWithTemp - dinadagdagan ang target ng laman ng source. Isinusulat
REM muna sa .tmp, tapos nire-rename, para hindi mabasa ang kalahating file.
REM Errorlevel 1 kapag pumalya.
REM ======================================================================
:appendWithTemp
if exist "%~1" (copy /b /y "%~1"+"%~2" "%~1.tmp" >nul 2>&1) else (copy /b /y "%~2" "%~1.tmp" >nul 2>&1)
if errorlevel 1 exit /b 1
move /y "%~1.tmp" "%~1" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0
