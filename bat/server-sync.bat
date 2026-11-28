@echo off
REM ======================================================================
REM FILE    : server-sync.bat
REM ANO     : Tuloy-tuloy na kumokopya ng lahat ng nasa Saving path papunta
REM           sa Server path (Saving papuntang Server LAMANG, walang
REM           binubura sa server). Sinusubukan din ang Server path kada
REM           cycle, isinusulat ang status, at nagsusulat ng heartbeat ng
REM           machine sa server para sa Dashboard.
REM INPUT   : settings.ini sa tabi ng bat (gawa ng macro sa Start).
REM           Optional: machine-local.status sa tabi ng bat. Mga linyang
REM           key at value; ang mga key na macro_version, state, operator,
REM           mc_type, mc_file, mc_since, lots_today ay papalitan ang
REM           kinukuwenta ng bat. Para sa VBA at master-calib.bat sa
REM           hinaharap.
REM           Binabasa rin ang lot-tracking.live at lot-tracking.alive.
REM OUTPUT  : Sa tabi ng bat:
REM             server-sync.status  = state, checked, last_copy,
REM                                   last_copy_result, clock_diff_seconds,
REM                                   clock_warning
REM             server-sync.alive   = heartbeat ng bat na ito
REM           Sa Server path:
REM             lot tracking\machines\MACHINE.status  (heartbeat)
REM             lot tracking\sync\MACHINE.probe       (pagsubok ng server)
REM             at kopya ng lahat ng nasa Saving path
REM STOP    : gumawa ng file na server-sync.stop sa tabi ng bat. Hindi ito
REM           humihinto sa katapusan ng shift o sa Stop ng lot tracking,
REM           kasi ito ang nagpapakita ng Shift off at Stopped manually sa
REM           Dashboard. Binubura ng bat ang lumang stop file sa simula.
REM NOTE    : Basa lang sa source (Rule 7); ang Saving at Server path lang
REM           ang sinusulatan. Kapag Not connected ang server, tuloy ang
REM           pagsubok. Pagbalik ng connection, o pagpalit ng shift, o
REM           nang pumalya ang huling kopya, buong pass ang gagawin
REM           (lahat ng wala pa sa server). Sa karaniwang cycle, mga file
REM           na binago sa nakaraang recentDays na araw lang.
REM           Ang oras ng server ay kinukuha sa LastWriteTime ng probe file
REM           na kasisulat lang sa server.
REM VERSION: v1 | 2026-11-28 | Unang version (macro task 2)
REM ======================================================================

setlocal EnableExtensions DisableDelayedExpansion

REM ---- CONFIG: dito lang babaguhin ----
set "defaultHeartbeatSeconds=15"
set "defaultSyncSeconds=60"
set "recentDays=2"
set "clockWarnSeconds=60"
set "lotAliveMaxSeconds=30"
set "lockRetryLimit=4"
REM ---- katapusan ng CONFIG ----

set "baseDir=%~dp0"
set "iniFile=%baseDir%settings.ini"
set "stopFile=%baseDir%server-sync.stop"
set "selfAliveFile=%baseDir%server-sync.alive"
set "lockFile=%baseDir%server-sync.lock"
set "statusFile=%baseDir%server-sync.status"
set "statusTempFile=%baseDir%server-sync.status.tmp"
set "localOverrideFile=%baseDir%machine-local.status"
set "lotAliveFile=%baseDir%lot-tracking.alive"
set "lotLiveFile=%baseDir%lot-tracking.live"
set "clockFile=%baseDir%server-sync.clock.tmp"
set "hbLocalFile=%baseDir%server-sync.hb.tmp"
set /a pingCount=defaultHeartbeatSeconds+1
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
echo May tumatakbo nang server-sync.bat. Isinara ang pangalawa.
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
set "needFull=1"
set "cyclesSinceCopy=0"
set "copyFailed=0"
set "prevConnected=0"
set "prevShiftFolder="
set "lastCopyTime="
set "lastCopyResult=Not yet"
echo server-sync nagsimula para sa %ini_machine_name%
goto :mainLoop

:noSettings
echo Walang settings.ini o kulang ito. Pindutin muna ang Start sa macro.
exit /b 0

:mainLoop
>"%selfAliveFile%" echo running
if exist "%stopFile%" goto :stopRequested
call :readSettings
if errorlevel 1 goto :sleepCycle
call :computeIntervals
call :runCycle

:sleepCycle
ping -n %pingCount% 127.0.0.1 >nul
goto :mainLoop

:stopRequested
echo Stop requested. Titigil ang server-sync.
del /q "%selfAliveFile%" "%clockFile%" "%hbLocalFile%" "%statusTempFile%" >nul 2>&1
exit /b 0

REM ======================================================================
REM :readSettings - binabasa ang settings.ini sa mga variable na ini_...
REM Errorlevel 1 kapag walang file o kulang ang kailangang key.
REM ======================================================================
:readSettings
if not exist "%iniFile%" exit /b 1
set "ini_server_path="
set "ini_saving_path="
set "ini_machine_name="
set "ini_shift_folder="
set "ini_heartbeat_interval="
set "ini_sync_interval="
for /f "usebackq delims=" %%A in ("%iniFile%") do call :storeSetting "%%A"
if not defined ini_server_path exit /b 1
if not defined ini_saving_path exit /b 1
if not defined ini_machine_name exit /b 1
exit /b 0

REM Isang linya ng settings.ini (key=value). Ang value ay ang lahat ng
REM nasa kanan ng unang equals sign, kaya ayos lang kahit blangko.
:storeSetting
set "settingLine=%~1"
set "settingKey="
for /f "tokens=1 delims==" %%K in ("%settingLine%") do set "settingKey=%%K"
set "settingValue=%settingLine:*==%"
if "%settingKey%"=="server_path" set "ini_server_path=%settingValue%"
if "%settingKey%"=="saving_path" set "ini_saving_path=%settingValue%"
if "%settingKey%"=="machine_name" set "ini_machine_name=%settingValue%"
if "%settingKey%"=="shift_folder" set "ini_shift_folder=%settingValue%"
if "%settingKey%"=="heartbeat_interval" set "ini_heartbeat_interval=%settingValue%"
if "%settingKey%"=="sync_interval" set "ini_sync_interval=%settingValue%"
exit /b 0

REM ======================================================================
REM :computeIntervals - cycleSeconds (heartbeat), syncSeconds, at kung
REM ilang cycle bago ang susunod na karaniwang kopya. Default kapag wala
REM o mali ang laman ng settings.ini.
REM ======================================================================
:computeIntervals
set "cycleSeconds=%defaultHeartbeatSeconds%"
if defined ini_heartbeat_interval set /a cycleSeconds=ini_heartbeat_interval
if %cycleSeconds% LSS 1 set "cycleSeconds=%defaultHeartbeatSeconds%"
set "syncSeconds=%defaultSyncSeconds%"
if defined ini_sync_interval set /a syncSeconds=ini_sync_interval
if %syncSeconds% LSS 1 set "syncSeconds=%defaultSyncSeconds%"
set /a copyEveryCycles=(syncSeconds+cycleSeconds-1)/cycleSeconds
set /a pingCount=cycleSeconds+1
exit /b 0

REM ======================================================================
REM :runCycle - isang cycle: subukan ang server, kopya kung kailangan,
REM heartbeat sa server, at lokal na status.
REM ======================================================================
:runCycle
set "serverRoot=%ini_server_path%"
if "%serverRoot:~-1%"=="\" set "serverRoot=%serverRoot:~0,-1%"
set "savingRoot=%ini_saving_path%"
if "%savingRoot:~-1%"=="\" set "savingRoot=%savingRoot:~0,-1%"
set "serverLotDir=%serverRoot%\lot tracking"
set "serverMachinesDir=%serverLotDir%\machines"
set "serverSyncDir=%serverLotDir%\sync"
set "probeFile=%serverSyncDir%\%ini_machine_name%.probe"
set "hbServerTemp=%serverMachinesDir%\%ini_machine_name%.status.tmp"
set "hbServerFinal=%serverMachinesDir%\%ini_machine_name%.status"
set "connected=0"
set "clockProbe="
if exist "%serverRoot%\" call :probeServer
if "%connected%"=="1" set "clockProbe=%probeFile%"
call :queryClock
if "%connected%"=="0" goto :cycleNotConnected

if not "%prevConnected%"=="1" set "needFull=1"
set "prevConnected=1"
if not "%prevShiftFolder%"=="%ini_shift_folder%" set "needFull=1"
set "prevShiftFolder=%ini_shift_folder%"

set /a cyclesSinceCopy+=1
set "doCopy=0"
if "%needFull%"=="1" set "doCopy=1"
if %cyclesSinceCopy% GEQ %copyEveryCycles% set "doCopy=1"
if "%doCopy%"=="1" call :copyPass

call :writeHeartbeat
if errorlevel 1 goto :cycleNotConnected
call :writeLocalStatus
exit /b 0

:cycleNotConnected
set "connected=0"
set "prevConnected=0"
call :writeLocalStatus
exit /b 0

REM ======================================================================
REM :probeServer - ginagawa ang mga folder sa server at sinusulatan ang
REM probe file. Connected=1 kapag nasulatan.
REM ======================================================================
:probeServer
if not exist "%serverMachinesDir%\" mkdir "%serverMachinesDir%" >nul 2>&1
if not exist "%serverSyncDir%\" mkdir "%serverSyncDir%" >nul 2>&1
if not exist "%serverMachinesDir%\" exit /b 1
if not exist "%serverSyncDir%\" exit /b 1
>"%probeFile%" echo probe
if errorlevel 1 exit /b 1
set "connected=1"
exit /b 0

REM ======================================================================
REM :queryClock - isang tawag sa PowerShell. Lumalabas: edad ng
REM lot-tracking.alive (segundo, o N), diperensya ng clock ng server at
REM ng PC na ito (segundo, o N), oras ngayon, at 1 kapag nagkakapatong
REM ang Saving path at Server path. Itinatakda ang lotAliveAge,
REM clockDiff, nowText, copyOverlap, clockWarning.
REM ======================================================================
:queryClock
set "lotAliveAge=N"
set "clockDiff=N"
set "nowText="
set "copyOverlap=0"
set "clockWarning=0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$n=Get-Date; $a='N'; if(Test-Path -LiteralPath $env:lotAliveFile){$a=[string][int]($n-(Get-Item -LiteralPath $env:lotAliveFile).LastWriteTime).TotalSeconds}; $c='N'; if($env:clockProbe -and (Test-Path -LiteralPath $env:clockProbe)){$c=[string][int]((Get-Item -LiteralPath $env:clockProbe).LastWriteTimeUtc-$n.ToUniversalTime()).TotalSeconds}; $sv=[IO.Path]::GetFullPath($env:serverRoot).TrimEnd('\')+'\'; $sa=[IO.Path]::GetFullPath($env:savingRoot).TrimEnd('\')+'\'; $o='0'; if($sv.StartsWith($sa,[StringComparison]::OrdinalIgnoreCase) -or $sa.StartsWith($sv,[StringComparison]::OrdinalIgnoreCase)){$o='1'}; $a+'|'+$c+'|'+$n.ToString('yyyy-MM-dd HH:mm:ss',[Globalization.CultureInfo]::InvariantCulture)+'|'+$o" >"%clockFile%" 2>nul
for /f "usebackq tokens=1-4 delims=|" %%A in ("%clockFile%") do (
  set "lotAliveAge=%%A"
  set "clockDiff=%%B"
  set "nowText=%%C"
  set "copyOverlap=%%D"
)
if "%clockDiff%"=="N" exit /b 0
set /a clockAbs=clockDiff
if %clockAbs% LSS 0 set /a clockAbs=-clockAbs
if %clockAbs% GTR %clockWarnSeconds% set "clockWarning=1"
exit /b 0

REM ======================================================================
REM :copyPass - robocopy ng Saving papunta Server. Walang /MIR o /PURGE,
REM kaya walang nabubura sa server. Buong pass kung needFull=1; kung
REM hindi, mga file na binago sa nakaraang recentDays na araw lang.
REM Ang exit code ng robocopy na 8 pataas ay pumalya.
REM ======================================================================
:copyPass
set "cyclesSinceCopy=0"
if "%copyOverlap%"=="1" goto :copyOverlapFound
set "ageSwitch="
if not "%needFull%"=="1" set "ageSwitch=/MAXAGE:%recentDays%"
robocopy "%savingRoot%" "%serverRoot%" /E /R:1 /W:1 /NP /NFL /NDL /NJH /NJS /FFT /XF *.tmp *.lock %ageSwitch% >nul 2>&1
if errorlevel 8 goto :copyFailedLabel
set "copyFailed=0"
set "needFull=0"
set "lastCopyTime=%nowText%"
set "lastCopyResult=OK"
exit /b 0

:copyFailedLabel
set "copyFailed=1"
set "needFull=1"
set "lastCopyResult=FAILED"
exit /b 0

:copyOverlapFound
set "copyFailed=1"
set "lastCopyResult=SKIPPED: nagkakapatong ang Saving path at Server path"
exit /b 0

REM ======================================================================
REM :readLocalOverride - binabasa ang machine-local.status (optional).
REM ======================================================================
:readLocalOverride
set "loc_macro_version="
set "loc_state="
set "loc_operator="
set "loc_mc_type="
set "loc_mc_file="
set "loc_mc_since="
set "loc_lots_today="
if not exist "%localOverrideFile%" exit /b 0
for /f "usebackq delims=" %%A in ("%localOverrideFile%") do call :storeLocal "%%A"
exit /b 0

:storeLocal
set "settingLine=%~1"
set "settingKey="
for /f "tokens=1 delims==" %%K in ("%settingLine%") do set "settingKey=%%K"
set "settingValue=%settingLine:*==%"
if "%settingKey%"=="macro_version" set "loc_macro_version=%settingValue%"
if "%settingKey%"=="state" set "loc_state=%settingValue%"
if "%settingKey%"=="operator" set "loc_operator=%settingValue%"
if "%settingKey%"=="mc_type" set "loc_mc_type=%settingValue%"
if "%settingKey%"=="mc_file" set "loc_mc_file=%settingValue%"
if "%settingKey%"=="mc_since" set "loc_mc_since=%settingValue%"
if "%settingKey%"=="lots_today" set "loc_lots_today=%settingValue%"
exit /b 0

REM ======================================================================
REM :writeHeartbeat - binubuo ang heartbeat sa tabi ng bat, isinusulat sa
REM server bilang .tmp (kaya ang oras ng file ay oras ng server), tapos
REM nire-rename sa MACHINE.status. Errorlevel 1 kapag hindi nasulatan.
REM state: Running, Stopped manually, o Shift off. Pansamantala, hinuhuli
REM ito ng bat: walang shift = Shift off; may sariwang lot-tracking.alive
REM = Running; kung hindi, Stopped manually. Mapapalitan ng state sa
REM machine-local.status.
REM ======================================================================
:writeHeartbeat
call :readLocalOverride
set "shiftName="
set "shiftDate="
if defined ini_shift_folder set "shiftName=%ini_shift_folder:~11%"
if defined ini_shift_folder set "shiftDate=%ini_shift_folder:~0,10%"

set "stateText=Stopped manually"
if not defined ini_shift_folder set "stateText=Shift off"
if defined ini_shift_folder if not "%lotAliveAge%"=="N" if %lotAliveAge% LEQ %lotAliveMaxSeconds% set "stateText=Running"
if defined loc_state set "stateText=%loc_state%"

set "liveName="
set "liveLocation="
set "liveSince="
if "%stateText%"=="Running" if exist "%lotLiveFile%" for /f "usebackq tokens=1-3 delims=|" %%A in ("%lotLiveFile%") do (
  set "liveName=%%A"
  set "liveLocation=%%B"
  set "liveSince=%%C"
)

set "lotsToday=0"
set "monitoringFile=%savingRoot%\lot tracking\lot monitoring\%ini_machine_name%_%shiftDate%_lotmonitoring.txt"
if defined ini_shift_folder if exist "%monitoringFile%" for /f "delims=" %%N in ('find /c /v "" ^< "%monitoringFile%"') do set "lotsToday=%%N"
if defined loc_lots_today set "lotsToday=%loc_lots_today%"

set "syncText=Connected"
if "%copyFailed%"=="1" set "syncText=Not connected"

>"%hbLocalFile%" type nul
call :addLine "%hbLocalFile%" "schema_version=1"
call :addLine "%hbLocalFile%" "machine=%ini_machine_name%"
call :addLine "%hbLocalFile%" "macro_version=%loc_macro_version%"
call :addLine "%hbLocalFile%" "state=%stateText%"
call :addLine "%hbLocalFile%" "shift=%shiftName%"
call :addLine "%hbLocalFile%" "shift_folder=%ini_shift_folder%"
call :addLine "%hbLocalFile%" "lot_file=%liveName%"
call :addLine "%hbLocalFile%" "lot_location=%liveLocation%"
call :addLine "%hbLocalFile%" "lot_since=%liveSince%"
call :addLine "%hbLocalFile%" "mc_type=%loc_mc_type%"
call :addLine "%hbLocalFile%" "mc_file=%loc_mc_file%"
call :addLine "%hbLocalFile%" "mc_since=%loc_mc_since%"
call :addLine "%hbLocalFile%" "operator=%loc_operator%"
call :addLine "%hbLocalFile%" "server_sync=%syncText%"
call :addLine "%hbLocalFile%" "lots_today=%lotsToday%"
call :addLine "%hbLocalFile%" "written_time=%nowText%"

>"%hbServerTemp%" type "%hbLocalFile%"
if errorlevel 1 exit /b 1
move /y "%hbServerTemp%" "%hbServerFinal%" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0

REM ======================================================================
REM :writeLocalStatus - server-sync.status sa tabi ng bat (temp muna,
REM tapos rename). Ito ang binabasa ng macro para sa Server status.
REM ======================================================================
:writeLocalStatus
set "stateWord=Not connected"
if "%connected%"=="1" set "stateWord=Connected"
>"%statusTempFile%" type nul
call :addLine "%statusTempFile%" "state=%stateWord%"
call :addLine "%statusTempFile%" "checked=%nowText%"
call :addLine "%statusTempFile%" "last_copy=%lastCopyTime%"
call :addLine "%statusTempFile%" "last_copy_result=%lastCopyResult%"
call :addLine "%statusTempFile%" "clock_diff_seconds=%clockDiff%"
call :addLine "%statusTempFile%" "clock_warning=%clockWarning%"
move /y "%statusTempFile%" "%statusFile%" >nul 2>&1
exit /b 0

REM ======================================================================
REM :addLine - nagdadagdag ng isang linya sa isang file. Unang argumento
REM ang file, pangalawa ang linya (naka-quote).
REM ======================================================================
:addLine
set "lineTarget=%~1"
set "lineText=%~2"
setlocal EnableDelayedExpansion
>>"!lineTarget!" echo(!lineText!
exit /b 0
