/*
 * FILE    : js/core/master-compare-config.js
 * PURPOSE : Constants ng Compare vs previous (Master Correl ngayon laban sa nakaraan): lookback, threshold, subfolder, selector, kulay, text
 * DEPENDS : js/core/config.js, js/core/master-export-config.js
 * VERSION : v7.1 | 2026-11-21 | AUTO_RUN (false): hindi na kusang tumatakbo ang compare pagkatapos ng Master Correl; sa card na Compare sliders na ito pinipindot
 * VERSION : v3.5 | 2026-11-21 | bagong file
 * VERSION : v7 | 2026-11-21 | detect ng worst slider (DETECT), sync sa Server path (SYNC), CLASS, bagong LABEL at TEXT (mas malinis na screen)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.compareConfig = Object.freeze({
    // false = hindi kusang tumatakbo ang compare pagkatapos ng Master Correl; pinipindot ang Compare vs previous sa card na Compare sliders. true = ibalik ang dating kusang takbo.
    AUTO_RUN: false,
    // Ilang araw ang pinakamalayong titingnan para sa previous record (bago ang napiling Date).
    LOOKBACK_DAYS: 7,
    // Lumalala kapag tumaas ang |actual - master| nang ganito o higit, O bumaba ang level (green -> yellow -> red).
    WORSEN_MIN: 0.3,
    ROUND_DIGITS: 6,
    DISPLAY_DIGITS: 3,
    // Ranggo ng level; mas mataas = mas malala.
    LEVEL_RANK: { 'level-green': 0, 'level-yellow': 1, 'level-red': 2 },
    // Worst slider ay "na-detect" kapag ang level nito ay ganito o mas malala (yellow o red). Green lahat = walang compare.
    DETECT: { MIN_LEVEL: 'level-yellow' },
    LEVEL_TEXT: { 'level-green': 'GREEN', 'level-yellow': 'YELLOW', 'level-red': 'RED' },
    // File sa Server path para sa LEAD PC: <Server path>\compare\<machine name>.json (isang file kada machine).
    SYNC: { SUBFOLDER: 'compare', FILE_VERSION: 1, SLIDER_MAX: 200, TEXT_MAX: 60, FILE_MAX_BYTES: 262144, MAX_FILES: 200 },
    // Class ng mga elementong ginagawa ng code (hindi id).
    CLASS: { banner: 'compare-banner', sync: 'compare-sync', filter: 'compare-filter', tableBox: 'compare-table-box', worstRow: 'is-worst', masterChanged: 'master-changed', groupStart: 'group-start', ok: 'compare-ok' },
    TREND: { worse: 'worse', better: 'better', same: 'same', unknown: 'unknown' },
    TREND_CLASS: { worse: 'trend-worse', better: 'trend-better', same: 'trend-same', unknown: 'trend-unknown' },
    TREND_SYMBOL: { worse: '\u25B2', better: '\u25BC', same: '=', unknown: '-' },
    // Subfolder sa loob ng Saving path (BMWW), hiwalay sa master-correl at master-repeatability.
    SUBFOLDER: 'master-compare',
    FILE_PREFIX: 'master-compare',
    FILE_EXTENSION: '.xlsx',
    SELECTOR: { runButton: '#compare-run', exportButton: '#compare-export', status: '#compare-status', result: '#compare-result' },
    SHEET: { compare: 'Compare', chart: 'Chart' },
    // Kulay ng linya: sa screen (colorIndex ng palette sa master.css) at sa Excel (hex, walang #). Magkapareho ang kulay.
    CHART: {
      PREVIOUS_COLOR_INDEX: 2, TODAY_COLOR_INDEX: 0,
      PREVIOUS_COLOR: 'D97706', TODAY_COLOR: '2563EB', LINE_WIDTH: 28575, MARKER_SIZE: 7,
      GAP_COLUMNS: 1, WIDTH_PIXELS: 900, HEIGHT_PIXELS: 520, Y_PAD_RATIO: 1.2, Y_MIN_MAX: 1
    },
    LABEL: {
      title: 'MASTER CORREL COMPARE', todayDate: 'Today record', previousDate: 'Previous record', todayFile: 'Today file', previousFile: 'Previous file',
      rSquaredToday: 'R Square (today)', rSquaredPrevious: 'R Square (previous)', rSquaredChange: 'R Square change',
      statusToday: 'Status (today)', statusPrevious: 'Status (previous)', worstToday: 'Worst slider (today)', worstPrevious: 'Worst slider (previous)',
      biggestIncrease: 'Biggest increase', worseCount: 'Lumalala', betterCount: 'Gumaganda', sameCount: 'Pareho', unknownCount: 'Walang previous',
      status: 'Status', dataSource: 'Data source', exportedAt: 'Exported', rule: 'Rule',
      columnBarcode: 'Barcode', columnPrevious: 'Previous diff', columnToday: 'Today diff', columnChange: 'Change', columnTrend: 'Trend',
      columnActual: 'Actual', columnMaster: 'Master', columnDiff: 'Diff', groupPrevious: 'Previous', groupToday: 'Today',
      previousActual: 'Prev Actual', previousMaster: 'Prev Master', previousDiff: 'Prev Diff', todayActual: 'Today Actual', todayMaster: 'Today Master', todayDiff: 'Today Diff',
      worstSlider: 'Worst slider', level: 'Level', rowActual: 'Actual', rowMaster: 'Master', rowDiff: 'Diff (|Actual - Master|)'
    },
    TREND_TEXT: { worse: 'Lumalala', better: 'Gumaganda', same: 'Pareho', unknown: 'Walang previous' },
    TEXT: {
      working: 'Hinahanap ang nakaraang record...',
      banner: 'WORST SLIDER: {barcode}',
      bannerLine: 'Diff ngayon {today} ({level}). Previous: {previous}. {trend}',
      bannerNoPrevious: 'Diff ngayon {today} ({level}). Walang previous na mapaghahambing.',
      noWorstTitle: 'Walang worst slider na na-detect',
      noWorstNote: 'Lahat ng slider ay green (diff {max} o mas mababa), kaya hindi na gagawa ng Compare vs previous.',
      statRSquared: 'R Square', statStatus: 'Status', statCounts: 'Lumalala / Gumaganda / Pareho', statPrevious: 'Previous record',
      showAll: 'Ipakita lahat ng slider ({total})',
      attentionNote: 'Ipinapakita ang {shown} sa {total} slider: hindi green o lumalala.',
      allNote: 'Ipinapakita ang lahat ng {total} slider.',
      masterChangedNote: '* Nagbago ang Master mula sa previous record, kaya ang Diff ay laban sa sarili nitong Master.',
      noPreviousNote: 'Walang naunang record na mapaghahambing, kaya ang worst slider lang ngayon ang ipinapakita.',
      sync: {
        pending: 'LEAD PC: ina-update...',
        ok: 'LEAD PC: na-update ({time})',
        cleared: 'LEAD PC: na-update, walang worst slider ({time})',
        skippedLead: 'LEAD PC: hindi isinulat sa Server (ito mismo ang LEAD PC).',
        noName: 'LEAD PC: hindi na-update, walang machine name sa Settings.',
        noFolder: 'LEAD PC: hindi na-update, wala pang Server path sa Settings.',
        noPermission: 'LEAD PC: hindi na-update, kailangan ng pahintulot sa Server folder. Pindutin ang Compare vs previous para subukan ulit.',
        unsupported: 'LEAD PC: hindi na-update, hindi suportado ng browser ang folder access (gamitin ang Chrome o Edge).',
        error: 'LEAD PC: hindi na-update. Pindutin ang Compare vs previous para subukan ulit.'
      },
      progress: 'Binabasa: ',
      resultTitle: 'Compare vs previous',
      chartTitle: 'Diff vs Master: Previous at Today',
      seriesPrevious: 'Previous', seriesToday: 'Today',
      verdictWorse: '{n} slider ang lumalala', verdictOk: 'Walang slider na lumalala',
      ruleNote: 'Lumalala = tumaas ang |actual - master| nang {min} o higit, o bumaba ang level (green, yellow, red). Ang Diff ay |actual - master| ng bawat record laban sa sarili nitong master.',
      gapNote: 'Walang record sa araw bago ang napiling Date. Ang ginamit na previous ay ang record noong {date}.',
      noBiggest: '-', arrow: ' \u2192 ',
      exporting: 'Sine-save ang Excel file ng Compare...',
      saved: 'Na-save ang Excel file: ',
      error: {
        noCurrent: 'Patakbuhin muna ang Master Correl bago mag-compare.',
        noPreviousRecord: 'Walang naunang master record sa nakaraang {n} araw bago ang napiling Date.',
        noResult: 'Pindutin muna ang Compare vs previous bago mag-export.',
        exportFail: 'Hindi na-save ang Excel file ng Compare. Subukan ulit.'
      }
    }
  });
})();
