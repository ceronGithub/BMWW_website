BMWW OPEN HANDLER (v1.3 | 2026-11-21)
Para sa mga button na "Open latest repeatability file" at "Open latest correl file" sa Master page: binubuksan nito sa Excel ang pinakabagong na-export na file, walang download.

BAKIT KAILANGAN ITO
Hindi kayang magpatakbo ng Excel ang website mismo (hindi pinapayagan ng browser). Kaya may maliit na handler sa Windows na tatanggap ng utos mula sa website.

PAANO I-INSTALL (isang beses, walang admin)
1. I-double-click ang install-open-handler.bat. Dapat lumabas ang "TAPOS".
2. Sa Settings ng website, siguraduhing nakalagay ang FULL PATH ng Saving path (hal. C:\BMWW), hindi lang pangalan ng folder.
3. Pindutin ang Open latest repeatability file. Sa unang beses, magtatanong ang browser (Open BMWW...?): i-tick ang "Always allow" at pindutin ang Open.

PAANO I-UNINSTALL
I-double-click ang uninstall-open-handler.bat.

SAFETY
- Dalawa lang ang kaya nitong buksan: .xlsx na nagsisimula sa master-repeatability at nasa master-repeatability\<petsa>\, o nagsisimula sa master-correl at nasa master-correl\<petsa>\ o master-correl\<machine>\<petsa>\ (kopya sa Server path, para sa Preview button ng LEAD PC). Ang iba ay hindi bubuksan.
- Kung naka-install ka na ng v1, ipalit lang ang open-file.ps1 (hindi na kailangang i-install ulit).
- Hindi nagbabago, hindi nagbubura ng file. Walang tumatakbong program sa background; tumatakbo lang ito kapag pinindot ang button.
- Log: open-handler.log (sa folder na ito). Doon makikita kung bakit hindi nabuksan.
- Sa company laptop, ipaalam muna sa IT (nagsusulat ito sa HKCU\Software\Classes\bmww-open).
