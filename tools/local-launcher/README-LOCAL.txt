FILE    : tools/local-launcher/README-LOCAL.txt
PURPOSE : paano gamitin ang local launcher (Task 5 at 9)
VERSION : v1 | 2026-11-24 | bagong file (Batch F)

BAKIT: sa double-click (file://) hindi nagtatagal ang permission ng folder. Sa http://localhost,
puwedeng piliin ng Chrome/Edge ang "Allow on every visit", kaya hindi na magtatanong ulit.

HAKBANG
1. I-double-click ang start-bmww-local.bat (huwag isara ang itim na window habang gumagamit).
2. Magbubukas ang Chrome/Edge sa http://localhost:8765/index.html
3. Settings: piliin ulit ang BMWW, Server path at Data source (isang beses lang, dahil ibang
   "address" ang localhost kaysa sa double-click, kaya hindi dala ang dating napili).
4. Kapag nagtanong ang browser ng edit access, piliin ang "Allow on every visit" kung nandoon.
5. Sunod na bukas: dapat hindi na magtatanong. Kung nagtanong pa rin, sabihin mo kung ano ang
   eksaktong lumabas sa tanong.

PARA SA ARAW-ARAW: gumawa ng shortcut ng start-bmww-local.bat sa Desktop (right click > Send to > Desktop),
o ilagay sa Startup folder (Win+R > shell:startup).

LIMITASYON (tapat)
- Hindi pa nasubukan sa totoong Windows at Chrome/Edge; hindi ko mapatakbo ang PowerShell dito.
- Kailangang Chrome/Edge na bago (Chrome 122 pataas ang may Allow on every visit).
- Ang port ay 8765; kapag napalitan, magbabago ang address at kailangang piliin ulit ang mga folder.
- 127.0.0.1 lang ang server (hindi abot ng ibang PC). Hindi naseserve ang tools at .git.
- Ang ongoing-monitor ay bubukas pa rin ng website sa lumang file:// address (ang IndexPath nito ay file path lang, hindi URL). Para sa localhost, kailangan itong baguhin sa susunod na batch (kailangan ang permission mo sa ongoing-monitor.ps1).
