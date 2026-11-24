/*
 * FILE     : js/core/settings-type-config.js
 * PURPOSE  : Constants ng "Select 1 type only" (Sender / LEAD PC), mga path na itinatago sa LEAD PC, at text ng instruction card sa Settings
 * DEPENDS  : js/core/config.js
 * USED BY  : js/core/settings-type.js, js/pages/settings.js
 * VERSION  : v21 | 2026-11-24 | bagong file (Batch A: Task 1, 2, 3, 4)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.settingsTypeConfig = Object.freeze({
    // Mga field na isinasave sa settings ng machine (Saving path at Server path, dahil iisang settings object ang isinusulat sa dalawa).
    FIELD: { selectOneTypeOnly: 'selectOneTypeOnly', userInputName: 'userInputName' },
    // Mga path na hindi kailangan ng LEAD PC (nakatago; hindi binubura ang laman nila).
    LEAD_HIDDEN_KEYS: ['source1', 'source2', 'source3'],
    SELECTOR: { toggleHost: '#settings-type-lock', guideHost: '#settings-guide-card' },
    ID: { toggle: 'settings-type-toggle' },
    CSS: { switchRow: 'type-lock-row', switchInput: 'type-lock-input', switchTrack: 'type-lock-track', guideList: 'guide-list' },
    TEXT: {
      toggleLabel: 'Select 1 type only',
      toggleNoteOn: 'NAKA-ON: ang uri (Sender o LEAD PC) ay nakalock na pagkatapos ma-save. Patayin muna ito kung gusto mong magpalit ng uri.',
      toggleNoteOff: 'NAKA-OFF: puwede kang magpalit-palit ng Sender at LEAD PC. Hindi buburahin ang naka-save na file ng kabilang uri.',
      toggleAria: 'Select 1 type only (Sender o LEAD PC)',
      leadNoSource: 'LEAD PC: hindi kailangan ang Data source 1, 2 at 3, kaya nakatago ang mga ito.',
      guideTitle: 'Paano i-setup ang mga folder (unang beses lang)',
      guideNote: 'Sundin nang isa-isa. Hindi mababasa ng browser ang buong path, kaya kokopyahin mo ito sa File Explorer.',
      guideStepList: [
        'Sa File Explorer: Desktop > right click > New > Folder, pangalanan ng BMWW. Ito ang Saving path.',
        'Buksan ang BMWW folder, i-click ang address bar sa taas at pindutin ang Ctrl+C para makopya ang path (hal. C:\\Users\\Name\\Desktop\\BMWW).',
        'Sa Settings, pindutin ang Piliin sa Saving path (BMWW), piliin ang BMWW folder, at pindutin ang Select Folder. Kung nakopya mo na ang path, awtomatikong mailalagay ito sa Full path (kapag pinayagan ng browser ang clipboard).',
        'Kapag nagtanong ang browser kung puwedeng i-edit ang files, piliin ang Allow. Kung may pagpipiliang "Allow on every visit" (Chrome/Edge), piliin ito para hindi na magtanong ulit.',
        'Ulitin ang hakbang 2 at 3 para sa Server path at, kung Sender, sa Data source 1, 2 at 3. Ang LEAD PC ay hindi na nangangailangan ng Data source.',
        'Pindutin ang Save settings. Kung mali ang awtomatikong Full path, baguhin ito bago mag-save.'
      ],
      fullPathFromClipboard: 'Awtomatikong inilagay ang full path mula sa na-copy mo: ',
      fullPathFromClipboardHint: ' | Tingnan kung tama, tapos pindutin ang Save settings.'
    }
  });
})();
