BMWW FILE WATCHER (v1.1 | 2026-11-21)
Kusang nagbubukas ng BM Analyzer website (Search Files page) kapag may bagong file o folder sa CLO1A o CLO1A1.
Kasama rin ang Data source 1 (ModifiedWatchPaths sa watcher-config.txt): doon, binibilang din ang file na NA-MODIFY (na-save ulit), hindi lang bago.
Tumatakbo ito sa Windows, kahit nakasara ang browser. Basa lang ang mga folder.

PAANO I-INSTALL (isang beses)
1. Buksan ang tools\file-watcher\watcher-config.txt (Notepad). Tingnan ang WatchPaths (C:\BM-Logging\CLO1A at CLO1A1)
   at ang Browser (edge o chrome). Ayusin kung iba.
   Ilagay ang buong path ng Data source 1 sa ModifiedWatchPaths (hal. ModifiedWatchPaths=C:\BM-Logging\MASTER). Blangko = hindi ito babantayan.
2. I-double-click ang install-watcher.bat. Dapat lumabas ang "TAPOS".
3. Tapos na. Tatakbo na ito tuwing mag-log in sa Windows. Walang window na lalabas.

PANG-TEST
1. I-double-click ang run-watcher-visible.bat (may lalabas na console: "Nababantayan na: ...").
2. Gumawa ng bagong file sa CLO1A. Dapat lumabas sa console ang "Bagong item" at bumukas ang website.
   Para sa Data source 1: i-save ulit ang isang file doon. Dapat lumabas ang "Na-modify na file" (isang beses lang kada save, may DebounceSeconds).
3. Isara ang console window para itigil. (Kung naka-install na, itigil muna ang naka-install gamit ang uninstall-watcher.bat.)

TANDAAN
- Pagkabukas ng website, kailangan pa ring pindutin ang Allow sa folder (patakaran ng browser; hindi ito malalampasan ng script).
- Hindi magbubukas ulit sa loob ng CooldownSeconds (120) at kapag bukas na ang website (SkipIfOpen). Ang pagtingin sa "bukas na" ay sa pamagat ng window na "BM Analyzer"; kung ibang tab ang kasalukuyang bukas, maaaring magbukas pa rin ng bago.
- Kung hindi bumubukas: tingnan ang watcher.log (nasa tabi ng script). Karaniwang dahilan: mali ang WatchPaths, hindi nahanap ang index.html
  (ilagay ang buong path sa IndexPath), o naka-block ang script ng Windows (tingnan ang ExecutionPolicy; ang .bat ay gumagamit ng Bypass).
- Kung network drive ang folder at naputol ang koneksyon, susubukan ulit ng watcher na kumonekta.
- Kapag nagbago ang watcher-config.txt: patakbuhin ulit ang install-watcher.bat.

PAANO TANGGALIN
I-double-click ang uninstall-watcher.bat.

HINDI PA NASUBUKAN: isinulat ito nang hindi napapatakbo sa Windows. Ang unang test (run-watcher-visible.bat) ay sa PC mo.
- Ang na-modify na file ay nakikita sa pamamagitan ng oras ng huling pagsulat ng file. Sa network drive, minsan hindi ito agad naipapadala ng Windows; kung hindi lumabas ang "Na-modify na file", tingnan ang watcher.log.
- Ang cooldown (120 segundo) at SkipIfOpen ay pareho sa bago at na-modify na file. Ang website ay laging bubukas sa Page na nasa config (#file-search).
