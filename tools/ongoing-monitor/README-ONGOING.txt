BMWW ONGOING MONITOR (v25 | 2026-11-24)
Para sa SENDER lang. Tuloy-tuloy na binabasa ang Data source 1, 2, 3 kahit SARADO ang website, at:
  1. Isinusulat ang status ng machine (ongoing / done / idle) sa <Server path>\queue\<machine>.json, kaya nag-a-update ang Dashboard ng LEAD PC.
  2. Kapag may pagbabago sa alinman sa 3 Data source, binubuksan ang website sa Dashboard (para ma-update ang Dashboard ng Sender).
Basa lang ang Data source. Ang tanging sinusulat ay ang status file sa Server path\queue (parehong format ng website).

PAANO I-INSTALL (isang beses)
1. Sa website, Settings: ilagay at i-Save ang Machine name (Sender), Saving path, Server path, Data source 1, 2, 3 (may Full path ang bawat isa).
2. Buksan ang tools\ongoing-monitor\ongoing-monitor-config.txt (Notepad). Ilagay ang SavingPath (hal. SavingPath=C:\Users\Name\Desktop\BMWW).
   Tingnan din ang Browser (edge o chrome) at Page (#dashboard).
3. I-double-click ang install-ongoing-monitor.bat. Dapat lumabas ang "TAPOS". Tatakbo na ito tuwing mag-log in sa Windows, walang window.

PANG-TEST
1. I-double-click ang run-ongoing-monitor.bat (may console). Dapat lumabas ang "Settings: <machine> (user-input)".
2. Isara ang website. Mag-save o gumawa ng file sa Data source 1, 2 o 3.
   DAPAT: "Pagbabago sa sourceN", "Status: ..." at bumukas ang website sa Dashboard. Sa LEAD PC, dapat lumabas ang bagong status ng machine sa loob ng ilang segundo.
3. Isara ang console para itigil. (Kung naka-install na, patakbuhin muna ang uninstall-ongoing-monitor.bat.)

PAANO GUMAGANA ANG ONGOING
- Source 1 (Calibration/Master): anumang pagbabago = ONGOING; walang aktibidad sa loob ng Source1TimeoutSeconds (300) = idle.
- Source 2 (Online) at Source 3 (Offline): bagong file = DONE; ibang pagbabago = ONGOING; idle pagkatapos ng 1800 segundo.
- Kapareho ito ng monitor ng website (js/core/monitor.js). Ang bagong file na kasusulat pa lang ay may SettleSeconds (30).
- Kapag ang website ang kakasulat lang ng status sa loob ng WebAliveSeconds (45), ang website ang masusunod; hindi susulat ang script at hindi magbubukas ng bagong tab.

TANDAAN
- Pagkabukas ng website, maaaring kailangan pang pindutin ang Payagan sa folder (patakaran ng browser; hindi ito malalampasan ng script).
- Hindi magbubukas ulit sa loob ng CooldownSeconds (120) at kapag bukas na ang website.
- Ang pagtingin sa "bukas na" ay sa pamagat ng window na "BM Analyzer" at sa status file ng website.
- Hindi ginagawa ng script ang Master Correl, Calibration o Trend; ang website ang gumagawa nito kapag nabuksan.
- Kapag nagbago ang config: patakbuhin ulit ang install-ongoing-monitor.bat. Kapag nagbago ang settings ng machine (Save sa website), awtomatikong binabasa ito ng script.
- Kung walang nangyayari: tingnan ang ongoing-monitor.log (nasa tabi ng script).
- Ang Master at Calibration na pagkilala (15 headers = Master) ay binabasa ang unang 2 linya ng pinakabagong CSV; kung may kuwit sa loob ng header, maaaring magkamali.

PAANO TANGGALIN
I-double-click ang uninstall-ongoing-monitor.bat.

HINDI PA NASUBUKAN sa totoong Windows: nasubukan lang sa PowerShell 7 sa Linux (gawa-gawang folder). Ang unang test ay sa PC mo.

LOCALHOST (v27, Batch G)
- Kung gumagamit ka ng tools\local-launcher (http://localhost:8765), ilagay sa ongoing-monitor-config.txt: WebsiteUrl=http://localhost:8765/index.html
  tapos patakbuhin ulit ang install-ongoing-monitor.bat.
- Kapag may laman ang WebsiteUrl, iyon ang bubuksan (hindi ang IndexPath). Kung hindi tumatakbo ang local server, kusa itong sisimulan nang tago
  (start-bmww-local.ps1 -NoBrowser). Nananatiling tumatakbo ito hanggang mag-log off ka o patayin sa Task Manager (powershell.exe).
- Ang launcher ay port 8765 lang; kung ibang port ang ilalagay sa WebsiteUrl, hindi ito masisimulan ng script.
- Hindi pa nasubukan sa totoong Windows.
