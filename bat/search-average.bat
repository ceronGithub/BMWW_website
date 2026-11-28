@echo off
REM ======================================================================
REM FILE    : search-average.bat
REM ANO     : Hinahanap ang keyword na Average sa bawat lote na nasa lot
REM           tracking file ng shift. May nahanap = OK. Wala = Onhold.
REM           Hinahanap lang kapag may sumunod nang lote sa lot tracking
REM           file, o kapag hindi na nagbabago ang file sa loob ng Search
REM           delay (Settings).
REM INPUT   : settings.ini sa tabi ng bat (gawa ng macro sa Start), at ang
REM           lot tracking file ng shift na isinusulat ng lot-tracking.bat
REM           sa Saving path. Binabasa ang file o folder mismo sa Data
REM           source 2 o 3 (Rule 7: basa lang).
REM OUTPUT  : remarks.txt sa shift folder ng Saving path. Isang linya kada
REM           lote: fileName, remarks (OK o Onhold), oras ng pagsusuri.
REM           Pinaghihiwalay ng pipe na character. Isang beses lang kada
REM           lote (walang duplicate). Kinokopya ito ng server-sync.bat sa
REM           server kasama ng shift folder.
REM           Sa tabi ng bat: search-average.alive (heartbeat).
REM STOP    : gumawa ng file na search-average.stop sa tabi ng bat. Kapag
REM           natapos ang shift, tatapusin muna ang mga nakabinbin (hanggang
REM           Search delay at kaunting dagdag), tapos titigil.
REM NOTE    : Folder ang lote: hinahanap ang Average sa lahat ng file sa
REM           loob nito. File: hinahanap sa mismong file; kailangang text
REM           ang file (hal. csv). Kapag hindi mabasa ang file (nakabukas
REM           o naka-lock), hindi magdedesisyon at uulitin sa susunod na
REM           cycle. Kapag wala na ang file sa Data source, nakabinbin
REM           ito hanggang matapos ang shift. Case-sensitive ang keyword.
REM           Ang pagsulat sa measure log ng Hold Lots ay nasa susunod na
REM           task.
REM VERSION: v1 | 2026-11-28 | Unang version (macro task 4)
REM ======================================================================

setlocal EnableExtensions DisableDelayedExpansion

REM ---- CONFIG: dito lang babaguhin ----
set "pollSeconds=10"
set "defaultSearchDelaySeconds=60"
set "searchKeyword=Average"
set "okText=OK"
set "holdText=Onhold"
set "graceExtraCycles=3"
set "lockRetryLimit=30"
REM ---- katapusan ng CONFIG ----

set "baseDir=%~dp0"
set "iniFile=%baseDir%settings.ini"
set "stopFile=%baseDir%search-average.stop"
set "aliveFile=%baseDir%search-average.alive"
set "lockFile=%baseDir%search-average.lock"
set "nowFile=%baseDir%search-average.now.tmp"
set "ageFile=%baseDir%search-average.age.tmp"
set "newRemarksFile=%baseDir%search-average.new.tmp"
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
echo May tumatakbo nang search-average.bat. Isinara ang pangalawa.
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
set "shiftEnded=0"
set "graceCyclesLeft=0"
set "pendingCount=0"
echo search-average nagsimula para sa %runShiftFolder%
goto :mainLoop

:noSettings
echo Walang settings.ini o kulang ito. Pindutin muna ang Start sa macro.
exit /b 0

:outsideShift
echo Labas ng shift. Walang susuriin.
exit /b 0

:mainLoop
>"%aliveFile%" echo running
if exist "%stopFile%" goto :stopRequested
call :readSettings
if errorlevel 1 goto :sleepCycle
if "%shiftEnded%"=="0" if not "%ini_shift_folder%"=="%runShiftFolder%" call :beginGrace
call :processPending
if "%shiftEnded%"=="0" goto :sleepCycle
if "%pendingCount%"=="0" goto :allDone
set /a graceCyclesLeft-=1
if %graceCyclesLeft% LEQ 0 goto :graceOver

:sleepCycle
ping -n %pingCount% 127.0.0.1 >nul
goto :mainLoop

:allDone
echo Tapos na ang shift at wala nang nakabinbin. Titigil ang search-average.
goto :exitLoop

:graceOver
echo Tapos na ang shift pero may nakabinbin pa (hindi mabasa o wala na ang file). Titigil ang search-average.
goto :exitLoop

:stopRequested
echo Stop requested. Titigil ang search-average.
goto :exitLoop

:exitLoop
del /q "%aliveFile%" "%nowFile%" "%ageFile%" "%newRemarksFile%" >nul 2>&1
exit /b 0

REM ======================================================================
REM :beginGrace - natapos ang shift. Ilang cycle pa ang ibibigay para
REM matapos ang mga nakabinbin: Search delay at kaunting dagdag.
REM ======================================================================
:beginGrace
set "shiftEnded=1"
call :computeSearchDelay
set /a graceCyclesLeft=(searchDelay/pollSeconds)+graceExtraCycles
echo Tapos na ang shift. Tatapusin muna ang mga nakabinbin.
exit /b 0

:computeSearchDelay
set "searchDelay=%defaultSearchDelaySeconds%"
if defined ini_search_delay set /a searchDelay=ini_search_delay
if %searchDelay% LSS 1 set "searchDelay=%defaultSearchDelaySeconds%"
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
set "ini_shift_folder="
set "ini_search_delay="
for /f "usebackq delims=" %%A in ("%iniFile%") do call :storeSetting "%%A"
if not defined ini_data_source_2 exit /b 1
if not defined ini_data_source_3 exit /b 1
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
if "%settingKey%"=="data_source_2" set "ini_data_source_2=%settingValue%"
if "%settingKey%"=="data_source_3" set "ini_data_source_3=%settingValue%"
if "%settingKey%"=="saving_path" set "ini_saving_path=%settingValue%"
if "%settingKey%"=="machine_name" set "ini_machine_name=%settingValue%"
if "%settingKey%"=="shift_folder" set "ini_shift_folder=%settingValue%"
if "%settingKey%"=="search_delay" set "ini_search_delay=%settingValue%"
exit /b 0

REM ======================================================================
REM :processPending - binabasa ang lot tracking file ng shift at sinusuri
REM ang bawat lote na wala pa sa remarks.txt. Itinatakda ang pendingCount
REM (ilang lote ang wala pang remarks).
REM ======================================================================
:processPending
set "pendingCount=0"
call :computeSearchDelay
set "shiftDate=%runShiftFolder:~0,10%"
set "shiftName=%runShiftFolder:~11%"
set "savingRoot=%ini_saving_path%"
if "%savingRoot:~-1%"=="\" set "savingRoot=%savingRoot:~0,-1%"
set "shiftDir=%savingRoot%\%runShiftFolder%"
set "trackingFile=%savingRoot%\lot tracking\lot tracking\%ini_machine_name%_%shiftDate%_%shiftName%_lottracking.txt"
set "remarksFile=%shiftDir%\remarks.txt"
if not exist "%trackingFile%" exit /b 0
if not exist "%shiftDir%\" exit /b 0

call :queryNow
set "totalLines=0"
for /f "delims=" %%N in ('find /c /v "" ^< "%trackingFile%"') do set "totalLines=%%N"
>"%newRemarksFile%" type nul
set "lineNumber=0"
for /f "usebackq tokens=1-3 delims=|" %%A in ("%trackingFile%") do call :checkEntry "%%B" "%%C"

set "newRemarksSize=0"
for %%S in ("%newRemarksFile%") do set "newRemarksSize=%%~zS"
if "%newRemarksSize%"=="0" exit /b 0
call :appendWithTemp "%remarksFile%" "%newRemarksFile%"
if errorlevel 1 set "pendingCount=1"
exit /b 0

REM ======================================================================
REM :queryNow - oras ngayon (yyyy-mm-dd hh:nn:ss) sa nowText.
REM ======================================================================
:queryNow
set "nowText="
powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Date).ToString('yyyy-MM-dd HH:mm:ss',[Globalization.CultureInfo]::InvariantCulture)" >"%nowFile%" 2>nul
set /p nowText=<"%nowFile%"
exit /b 0

REM ======================================================================
REM :checkEntry - isang lote. Mga argumento: location (DS2 o DS3) at
REM file name. Ginagamit ang lineNumber, totalLines, searchDelay.
REM ======================================================================
:checkEntry
set /a lineNumber+=1
set "entryLocation=%~1"
set "entryName=%~2"
if not defined entryName exit /b 0
findstr /b /l /c:"%entryName%|" "%remarksFile%" >nul 2>&1
if not errorlevel 1 exit /b 0
findstr /b /l /c:"%entryName%|" "%newRemarksFile%" >nul 2>&1
if not errorlevel 1 exit /b 0
set /a pendingCount+=1

set "entryDir=%ini_data_source_2%"
if "%entryLocation%"=="DS3" set "entryDir=%ini_data_source_3%"
if "%entryDir:~-1%"=="\" set "entryDir=%entryDir:~0,-1%"

set "targetPath="
set "targetKind=F"
if exist "%entryDir%\%entryName%\" set "targetPath=%entryDir%\%entryName%"
if defined targetPath set "targetKind=D"
if not defined targetPath if exist "%entryDir%\%entryName%" set "targetPath=%entryDir%\%entryName%"
if not defined targetPath for %%F in ("%entryDir%\%entryName%.*") do if not defined targetPath set "targetPath=%%~fF"
if not defined targetPath exit /b 0

set "eligible=0"
if %lineNumber% LSS %totalLines% set "eligible=1"
if "%eligible%"=="0" call :checkQuiet
if "%eligible%"=="0" exit /b 0

call :searchKeyword
if not defined remarkText exit /b 0
>>"%newRemarksFile%" echo %entryName%^|%remarkText%^|%nowText%
set /a pendingCount-=1
exit /b 0

REM ======================================================================
REM :checkQuiet - eligible=1 kapag hindi na nagbabago ang file o folder sa
REM loob ng searchDelay segundo. Ang folder ay tinitingnan pati ang mga
REM file sa loob.
REM ======================================================================
:checkQuiet
set "quietAge="
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=$env:targetPath; $i=Get-Item -LiteralPath $p -ErrorAction SilentlyContinue; if(-not $i){'N'}else{$t=$i.LastWriteTime; if($i.PSIsContainer){Get-ChildItem -LiteralPath $p -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { if($_.LastWriteTime -gt $t){$t=$_.LastWriteTime} }}; [string][int]((Get-Date)-$t).TotalSeconds}" >"%ageFile%" 2>nul
set /p quietAge=<"%ageFile%"
if not defined quietAge exit /b 0
if "%quietAge%"=="N" exit /b 0
if %quietAge% GEQ %searchDelay% set "eligible=1"
exit /b 0

REM ======================================================================
REM :searchKeyword - hinahanap ang keyword. remarkText = OK o Onhold.
REM Blangko ang remarkText kapag hindi mabasa ang file (uulitin).
REM ======================================================================
:searchKeyword
set "remarkText="
if "%targetKind%"=="D" goto :searchFolder
findstr /m /l /c:"%searchKeyword%" "%targetPath%" >nul 2>&1
goto :searchDone

:searchFolder
findstr /s /m /l /c:"%searchKeyword%" "%targetPath%\*" >nul 2>&1

:searchDone
if errorlevel 2 exit /b 0
set "remarkText=%holdText%"
if not errorlevel 1 set "remarkText=%okText%"
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
