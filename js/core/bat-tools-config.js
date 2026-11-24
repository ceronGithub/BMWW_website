/*
 * FILE    : js/core/bat-tools-config.js
 * PURPOSE : Data at text ng mga card ng .bat tool sa Settings (kapareho ng itsura ng card ng File Watcher):
 *           card na "Kailangan bago mag-setup" at isang card kada tool (Ongoing Monitor, Local launcher,
 *           Check templates, Open handler, Desktop shortcut). Ang File Watcher ay may sariling card (watcher-install.js).
 * DEPENDS : walang. Binabasa ng js/pages/bat-card.js
 * VERSION : v1 | 2026-11-24 | bagong file (Batch K: v32)
 */
(function () {
  'use strict';
  const root = (window.BMWW = window.BMWW || {});

  // Uri ng hakbang: 'explorer' (buksan ang File Explorer), 'path' (path ng folder na may Copy). Ang iba ay text (parts).
  const STEP_KIND = Object.freeze({ explorer: 'explorer', path: 'path' });
  const EXPLORER_STEP = Object.freeze({ kind: STEP_KIND.explorer });
  const PATH_STEP = Object.freeze({ kind: STEP_KIND.path });

  const NO_ADMIN = 'Hindi kailangan ang "Run as administrator".';
  const PRESS_ANY_KEY = 'Pindutin ang kahit anong key para isara ito.';
  const STARTUP_COMMAND = 'shell:startup';
  const IT_WARNING_COMPANY = 'Sa company laptop: ipaalam o ipa-approve muna sa IT. Maaaring i-block ito ng antivirus o ng policy ng kumpanya.';
  const IT_WARNING_BLOCK = 'Kung may lumabas na block o babala ng Windows o antivirus, huwag itong lampasan. Itigil at sabihin sa IT.';
  const WARNING_NOT_BY_WEBSITE = 'Hindi ito mai-install ng website. Ikaw mismo ang magpapatakbo ng installer sa File Explorer.';

  // Gumagawa ng hakbang na text. Ang bawat bahagi ay string o { file: 'pangalan' } (lalabas na code).
  function step(...partList) {
    return { parts: partList };
  }

  // Pangalan ng file, command o folder sa loob ng hakbang.
  function file(name) {
    return { file: name };
  }

  root.batToolsConfig = Object.freeze({
    CARD_ID: 'bat-tools-card',
    SEPARATOR: '\\',
    COPY_STATUS_MS: 4000,
    STEP_KIND,

    TEXT: Object.freeze({
      requiresLabel: 'Kailangan:',
      openExplorer: 'Buksan ang File Explorer (pindutin ang Win + E).',
      pasteLabel: 'I-paste ang path na ito sa address bar sa taas, tapos pindutin ang Enter:',
      warningTitle: 'Babala bago mag-install',
      acknowledge: 'Naiintindihan ko ang babala at gusto kong magpatuloy.',
      closeButton: 'Isara',
      pathLabel: 'Path ng folder ng tool',
      commandLabel: 'Command na kokopyahin',
      copyButton: 'Copy',
      copied: 'Na-copy.',
      copyManual: 'Hindi nakopya nang kusa. Napili na ang text; pindutin ang Ctrl + C.',
      pathNotExact: 'Hindi mahulaan ang eksaktong path dahil hindi double-click (file) ang pagbukas ng website. Hanapin ang folder na ito sa loob ng folder ng website.'
    }),

    // Card na "Kailangan bago mag-setup" (para sa bagong PC).
    SETUP: Object.freeze({
      id: 'setup',
      title: 'Kailangan bago mag-setup',
      note: 'Para sa bagong PC. Walang internet o Administrator na kailangan, at walang ibang program na kailangang i-install maliban sa nakalista dito. Nasa folder na tools ng BMWW ang lahat ng .bat; i-double-click ito sa File Explorer. Dapat lumabas ang salitang TAPOS sa dulo. Kapag wala, kunan ng screenshot ang itim na window bago pindutin ang anumang key.',
      needList: Object.freeze([
        { label: 'Windows PowerShell', text: 'kasama na sa Windows. Kailangan ito ng lahat ng .bat (kasama ang File Watcher) maliban sa Check templates.' },
        { label: 'Chrome o Edge', text: 'kailangan ng BMWW para sa folder access. Chrome 122 pataas para sa "Allow on every visit" sa localhost.' },
        { label: 'Microsoft Excel', text: 'para mabuksan ang "Open latest repeatability file" at "Open latest correl file" (Open handler).' },
        { label: 'Node.js (nodejs.org)', text: 'para sa Check templates lang (developer). Hindi ito kailangan ng ibang tool.' },
        { label: 'Folder ng BMWW', text: 'ilagay ang BUONG BMWW folder sa permanenteng lokal na folder (hal. C:\\BMWW_App\\), hindi sa ZIP, Downloads o network drive. Kapag inilipat, patakbuhin ulit ang install .bat.' },
        { label: 'Galing sa ZIP', text: 'right-click ang ZIP > Properties > Unblock, bago i-extract.' },
        { label: 'Company laptop', text: 'ipaalam muna sa IT; maaaring i-block ng antivirus o policy ang .bat at PowerShell. Kung may babala ng Windows o antivirus, huwag itong lampasan.' }
      ]),
      footnote: 'Hindi pa nasubukan sa totoong Windows ang mga bagong .bat. Ang unang test ay sa PC mo.'
    }),

    TOOL_LIST: Object.freeze([
      {
        id: 'ongoing-monitor',
        title: 'Ongoing Monitor (optional)',
        audience: 'Sender PC lang',
        purpose: 'Tuloy-tuloy na binabasa ang Data source 1, 2, 3 kahit SARADO ang website. Isinusulat ang status ng machine (ongoing / done / idle) sa <Server path>\\queue\\<machine>.json para ma-update ang Dashboard ng LEAD PC, at binubuksan ang website sa Dashboard kapag may pagbabago. Basa lang ang Data source.',
        requires: 'Windows PowerShell (kasama na sa Windows) at Chrome o Edge. Naka-Save na sa Settings sa itaas ang Machine name, Saving path, Server path at Data source 1, 2, 3.',
        limitation: '',
        folder: 'tools\\ongoing-monitor',
        panelList: Object.freeze([
          {
            id: 'install',
            button: 'Install Ongoing Monitor',
            title: 'Gawin ito sa File Explorer',
            warningList: Object.freeze([
              'Ang installer ay magpapatakbo ng PowerShell script na tumatakbo nang naka-hide at kusang magsisimula tuwing mag-log in sa Windows.',
              'Basa lang ang Data source 1, 2, 3. Ang isinusulat lang nito ay ang status file ng machine sa Server path\\queue. Wala itong binubura.',
              IT_WARNING_COMPANY,
              IT_WARNING_BLOCK,
              WARNING_NOT_BY_WEBSITE
            ]),
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('ongoing-monitor-config.txt'), ' (magbubukas sa Notepad) at ilagay ang ', file('SavingPath='), ' (hal. ', file('SavingPath=C:\\Users\\Name\\Desktop\\BMWW'), '). Tingnan din ang Browser at Page. I-save at isara. Kapag blangko ang SavingPath, lalabas ang BABALA; ilagay muna ito at patakbuhin ulit ang installer.'),
              step('I-double-click ang ', file('install-ongoing-monitor.bat'), '. ' + NO_ADMIN),
              step('Dapat lumabas sa itim na window ang "TAPOS: tumatakbo na ang Ongoing Monitor at tatakbo ito tuwing mag-log in sa Windows." ' + PRESS_ANY_KEY),
              step('Kapag nagbago ang config, patakbuhin ulit ang ', file('install-ongoing-monitor.bat'), '.')
            ])
          },
          {
            id: 'test',
            button: 'Paano i-test',
            title: 'Pang-test (may nakikitang console)',
            stepList: Object.freeze([
              step('Kung naka-install na, i-uninstall muna (para hindi dalawa ang tumatakbo).'),
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('run-ongoing-monitor.bat'), '. Dapat lumabas ang "Settings: <machine> (user-input)".'),
              step('Isara ang website, tapos mag-save o gumawa ng file sa Data source 1, 2 o 3. Dapat lumabas ang "Pagbabago sa sourceN" at bumukas ang website sa Dashboard.'),
              step('Isara ang console window para itigil.')
            ])
          },
          {
            id: 'uninstall',
            button: 'Paano i-uninstall',
            title: 'Paano tanggalin ang Ongoing Monitor',
            intro: 'Ligtas ito. Titigil ang monitor at hindi na ito kusang tatakbo sa pag-log in. Hindi nito binubura ang project folder, ang config, ang ongoing-monitor.log o ang mga status file sa Server path\\queue.',
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('uninstall-ongoing-monitor.bat'), '. ' + NO_ADMIN),
              step('Dapat lumabas sa itim na window ang "Natanggal ang shortcut sa Startup." (o "Walang shortcut sa Startup." kung wala pa), "Itinigil ang Ongoing Monitor." kung may tumatakbo, at "TAPOS." ' + PRESS_ANY_KEY),
              step('Para makasiguro: pindutin ang Win + R, i-type ang ', file(STARTUP_COMMAND), ', tapos Enter. Dapat wala nang "', file('BMWW Ongoing Monitor'), '" sa folder na bubukas.')
            ]),
            manual: {
              title: 'Kung hindi gumana o naka-block ang .bat',
              parts: ['Pindutin ang Win + R, i-type ang ', file(STARTUP_COMMAND), ', Enter, tapos burahin ang "', file('BMWW Ongoing Monitor'), '" sa folder na bubukas. Hindi na ito kusang tatakbo sa susunod na pag-log in. Titigil ang kasalukuyang tumatakbo kapag nag-restart o nag-sign out ka. Kung company laptop, sabihin sa IT kung bakit na-block.']
            }
          }
        ])
      },
      {
        id: 'local-launcher',
        title: 'Local launcher (optional)',
        audience: '',
        purpose: 'Binubuksan ang BMWW sa http://localhost:8765/index.html (hindi sa double-click na file://). Sa localhost, puwedeng piliin ng Chrome o Edge ang "Allow on every visit" para hindi na magtanong ng permission ng folder. Maliit na local server ito (127.0.0.1 lang, hindi abot ng ibang PC). Walang install.',
        requires: 'Windows PowerShell (kasama na sa Windows) at Chrome o Edge (Chrome 122 pataas para sa "Allow on every visit").',
        limitation: 'Limitasyon: port 8765 lang. Kapag napalitan ang port, magbabago ang address at kailangang piliin ulit ang mga folder.',
        folder: 'tools\\local-launcher',
        panelList: Object.freeze([
          {
            id: 'run',
            button: 'Paano patakbuhin',
            title: 'Gawin ito sa File Explorer',
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('start-bmww-local.bat'), '. ' + NO_ADMIN),
              step('Lalabas ang itim na window na "BMWW local server - HUWAG ISARA". Magbubukas ang Chrome (o Edge) sa localhost.'),
              step('Sa Settings, piliin ulit ang BMWW, Server path at Data source (isang beses lang; ibang "address" ang localhost kaysa sa file://).'),
              step('Kapag nagtanong ang browser ng edit access, piliin ang "Allow on every visit" kung nandoon.'),
              step('Pang-araw-araw: right-click ang .bat > Send to > Desktop, o ilagay ang shortcut sa Startup (Win + R > ', file(STARTUP_COMMAND), ').'),
              step('Para gumana sa Ongoing Monitor: ilagay sa config nito ang ', file('WebsiteUrl=http://localhost:8765/index.html'), ', tapos patakbuhin ulit ang install-ongoing-monitor.bat.')
            ])
          },
          {
            id: 'uninstall',
            button: 'Paano itigil at tanggalin',
            title: 'Paano itigil at tanggalin ang Local launcher',
            intro: 'Walang uninstall .bat at walang naiiwan sa PC maliban sa shortcut na ginawa mo.',
            stepList: Object.freeze([
              step('Isara ang itim na window (o pindutin ang Ctrl + C).'),
              step('Tanggalin ang shortcut sa Desktop o Startup, kung gumawa ka.'),
              {
                parts: ['Kung kusa itong sinimulan nang tago ng Ongoing Monitor: buksan ang PowerShell (Win + X) at i-paste ang command na ito, tapos burahin ang WebsiteUrl sa config at i-install ulit ang monitor:'],
                command: 'Get-CimInstance Win32_Process -Filter "Name = \'powershell.exe\'" | Where-Object { $_.CommandLine -like \'*start-bmww-local.ps1*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }'
              }
            ])
          }
        ])
      },
      {
        id: 'check-templates',
        title: 'Check templates (optional)',
        audience: 'Developer',
        purpose: 'Sinusuri kung magkapareho ang pages\\*.html at ang kopya nito sa js\\templates\\*.template.js. Kapag DRIFT, maaaring iba ang lumalabas sa double-click na bersyon. Basa lang; walang binabago.',
        requires: 'Node.js (nodejs.org). Kapag wala, lalabas ang mensahe at hihinto ito. Ito lang ang tool na nangangailangan ng Node.js.',
        limitation: '',
        folder: 'tools\\check-templates',
        panelList: Object.freeze([
          {
            id: 'run',
            button: 'Paano patakbuhin',
            title: 'Gawin ito sa File Explorer',
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('run-check-templates.bat'), '. ' + NO_ADMIN),
              step('Lalabas ang MATCH o DRIFT kada page. Kapag may DRIFT, ipakita ang output sa developer. ' + PRESS_ANY_KEY)
            ])
          },
          {
            id: 'uninstall',
            button: 'Paano i-uninstall',
            title: 'Paano tanggalin ang Check templates',
            intro: 'Walang i-uninstall; walang naiiwan sa PC. Ang Node.js (kung na-install mo) ay hiwalay na program at puwedeng tanggalin sa Windows Settings > Apps.',
            stepList: Object.freeze([])
          }
        ])
      },
      {
        id: 'open-handler',
        title: 'Open handler',
        audience: '',
        purpose: 'Para gumana ang "Open latest repeatability file" at "Open latest correl file" (binubuksan sa Excel; hindi kaya ng website mismo). Tumatakbo lang ito kapag pinindot ang button.',
        requires: 'Windows PowerShell (kasama na sa Windows), Chrome o Edge, at Microsoft Excel. FULL PATH ang Saving path sa Settings sa itaas (hal. C:\\BMWW) at naka-Save.',
        limitation: '',
        folder: 'tools\\open-handler',
        panelList: Object.freeze([
          {
            id: 'install',
            button: 'Install Open handler',
            title: 'Gawin ito sa File Explorer',
            warningList: Object.freeze([
              'Magsusulat ang installer sa HKCU\\Software\\Classes\\bmww-open (registry ng user mo lang; walang admin).',
              'Tumatakbo lang ang handler kapag pinindot mo ang Open latest ... file. Hindi ito tumatakbo nang kusa.',
              IT_WARNING_COMPANY,
              IT_WARNING_BLOCK,
              WARNING_NOT_BY_WEBSITE
            ]),
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('install-open-handler.bat'), '. ' + NO_ADMIN),
              step('Dapat lumabas sa itim na window ang "TAPOS: naka-install ang bmww-open (para sa user mo lang)." ' + PRESS_ANY_KEY),
              step('Sa unang pindot ng Open latest ... file sa Master page, magtatanong ang browser: i-tick ang "Always allow" at pindutin ang Open.')
            ])
          },
          {
            id: 'uninstall',
            button: 'Paano i-uninstall',
            title: 'Paano tanggalin ang Open handler',
            intro: 'Ligtas ito. Tatanggalin lang ang bmww-open sa registry ng user mo. Hindi nito binubura ang website o ang mga file mo. Log: open-handler.log sa folder ng tool.',
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('uninstall-open-handler.bat'), '. ' + NO_ADMIN),
              step('Dapat lumabas sa itim na window ang "Natanggal ang bmww-open." (o "Walang naka-install na bmww-open." kung wala pa) at "TAPOS." ' + PRESS_ANY_KEY)
            ]),
            manual: {
              title: 'Kung naka-block ang .bat',
              parts: ['Sabihin sa IT. Ang tinatanggal ng uninstaller ay ang key na ', file('HKCU\\Software\\Classes\\bmww-open'), ' lang.']
            }
          }
        ])
      },
      {
        id: 'desktop-shortcut',
        title: 'Desktop shortcut (optional)',
        audience: '',
        purpose: 'Gumagawa ng shortcut na "BMWW" sa Desktop na nagbubukas ng index.html sa Chrome (o Edge). Huwag kopyahin ang index.html sa Desktop; shortcut lang.',
        requires: 'Windows PowerShell (kasama na sa Windows) at Chrome o Edge (kapag wala, lalabas ang ERROR). Buo at na-extract na BMWW folder sa permanenteng lokal na folder.',
        limitation: '',
        folder: 'tools\\desktop-shortcut',
        panelList: Object.freeze([
          {
            id: 'install',
            button: 'Gumawa ng shortcut',
            title: 'Gawin ito sa File Explorer',
            stepList: Object.freeze([
              EXPLORER_STEP,
              PATH_STEP,
              step('I-double-click ang ', file('create-desktop-shortcut.bat'), '. ' + NO_ADMIN),
              step('Dapat lumabas sa itim na window ang "TAPOS: nagawa ang shortcut na BMWW sa Desktop." at may bagong icon na BMWW sa Desktop. ' + PRESS_ANY_KEY),
              step('Kapag inilipat ang project folder, patakbuhin ulit ang ', file('create-desktop-shortcut.bat'), '.')
            ])
          },
          {
            id: 'uninstall',
            button: 'Paano i-uninstall',
            title: 'Paano tanggalin ang shortcut',
            intro: 'Ligtas ito. Shortcut lang ang nawawala; hindi nito binubura ang website.',
            stepList: Object.freeze([
              step('Sa Desktop, i-right-click ang icon na ', file('BMWW'), ' (', file('BMWW.lnk'), ') at piliin ang Delete.'),
              step('Walang ibang naiwan.')
            ])
          }
        ])
      }
    ])
  });
})();
