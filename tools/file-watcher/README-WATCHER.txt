BMWW FILE WATCHER (v1 | 2026-11-21)
Kusang nagbubukas ng BM Analyzer website (Search Files page) kapag may bagong file o folder sa CLO1A o CLO1A1.
Tumatakbo ito sa Windows, kahit nakasara ang browser. Basa lang ang mga folder.

PAANO I-INSTALL (isang beses)
1. Buksan ang tools\file-watcher\watcher-config.txt (Notepad). Tingnan ang WatchPaths (C:\BM-Logging\CLO1A at CLO1A1)
   at ang Browser (edge o chrome). Ayusin kung iba.
2. I-double-click ang install-watcher.bat. Dapat lumabas ang "TAPOS".
3. Tapos na. Tatakbo na ito tuwing mag-log in sa Windows. Walang window na lalabas.

PANG-TEST
1. I-double-click ang run-watcher-visible.bat (may lalabas na console: "Nababantayan na: ...").
2. Gumawa ng bagong file sa CLO1A. Dapat lumabas sa console ang "Bagong item" at bumukas ang website.
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
