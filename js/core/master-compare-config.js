/*
 * FILE    : js/core/master-compare-config.js
 * PURPOSE : Constants ng Compare vs previous (Master Correl ngayon laban sa nakaraan): lookback, threshold, subfolder, selector, kulay, text
 * DEPENDS : js/core/config.js, js/core/master-export-config.js
 * VERSION : v3.5 | 2026-11-21 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.compareConfig = Object.freeze({
    // Ilang araw ang pinakamalayong titingnan para sa previous record (bago ang napiling Date).
    LOOKBACK_DAYS: 7,
    // Lumalala kapag tumaas ang |actual - master| nang ganito o higit, O bumaba ang level (green -> yellow -> red).
    WORSEN_MIN: 0.3,
    ROUND_DIGITS: 6,
    DISPLAY_DIGITS: 3,
    // Ranggo ng level; mas mataas = mas malala.
    LEVEL_RANK: { 'level-green': 0, 'level-yellow': 1, 'level-red': 2 },
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
      columnBarcode: 'Barcode', columnPrevious: 'Previous diff', columnToday: 'Today diff', columnChange: 'Change', columnTrend: 'Trend'
    },
    TREND_TEXT: { worse: 'Lumalala', better: 'Gumaganda', same: 'Pareho', unknown: 'Walang previous' },
    TEXT: {
      working: 'Hinahanap ang nakaraang record...',
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
