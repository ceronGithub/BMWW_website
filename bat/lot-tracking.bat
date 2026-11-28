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
del /q "%aliveFile%" "%scanFile%" "%newLinesFile%" "%newProcessedFile%" "%newSkippedFile%" "%liveTempFile%" >nul 2>&1
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
