/*
 * FILE    : js/core/preview-tab-style.js
 * PURPOSE : CSS ng pahina ng Preview tab (inilalagay sa loob ng nabuong HTML, dahil hindi makapag-link ng CSS file ang tab na galing sa blob)
 * DEPENDS : js/core/registry.js (window.BMWW)
 * OUTPUT  : root.previewTabStyle (string)
 * VERSION : v8.9 | 2026-11-21 | bagong file (style ng bagong tab: buod, chart, grid ng Excel; light at dark)
 */
(function () {
  'use strict';
  const root = window.BMWW;

  root.previewTabStyle = `
:root { color-scheme: light dark; --bg: #f3f4f6; --surface: #ffffff; --text: #111827; --muted: #6b7280; --border: #d1d5db; --primary: #2563eb; --danger: #dc2626;
  --chart-1: #2563eb; --chart-2: #16a34a; --chart-3: #d97706; --chart-4: #9333ea; --level-green: #16a34a; --level-yellow: #eab308; --level-red: #dc2626;
  --pass: #166534; --pass-bg: #dcfce7; --warn: #92400e; --warn-bg: #fef3c7; --fail: #991b1b; --fail-bg: #fee2e2; }
@media (prefers-color-scheme: dark) { :root { --bg: #111827; --surface: #1f2937; --text: #f3f4f6; --muted: #9ca3af; --border: #374151; --pass: #bbf7d0; --pass-bg: #14532d; --warn: #fde68a; --warn-bg: #78350f; --fail: #fecaca; --fail-bg: #7f1d1d; } }
* { box-sizing: border-box; }
body { margin: 0; padding: 1rem; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
.tab-main { max-width: 72rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
.tab-head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem; }
.tab-title { margin: 0; font-size: 1.5rem; overflow-wrap: anywhere; }
.tab-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border: 2px solid currentColor; border-radius: 0.5rem; font-weight: 800; }
.tab-badge.is-pass { color: var(--pass); background: var(--pass-bg); }
.tab-badge.is-warning { color: var(--warn); background: var(--warn-bg); }
.tab-badge.is-fail { color: var(--fail); background: var(--fail-bg); }
.tab-note { margin: 0; color: var(--muted); font-size: 0.875rem; overflow-wrap: anywhere; }
.tab-card { padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.tab-heading { margin: 0 0 0.75rem; font-size: 1.125rem; }
.tab-stats { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 0; }
.tab-stats dt { color: var(--muted); }
.tab-stats dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.chart-box { width: 100%; max-width: 52rem; margin: 0 auto; }
.chart-svg { display: block; width: 100%; height: auto; }
.chart-text { fill: var(--text); stroke: none; font-size: 16px; }
.chart-title { font-size: 21px; font-weight: 700; }
.chart-axis-title { font-size: 17px; font-weight: 600; }
.chart-equation { font-size: 16px; font-weight: 700; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
line.chart-grid { stroke: var(--border); stroke-width: 1; }
.chart-axis { stroke: var(--muted); stroke-width: 1.5; }
.chart-point { fill: var(--chart-1); fill-opacity: 0.95; stroke: var(--surface); stroke-width: 1.5; }
.chart-point.level-green, .chart-dot.level-green { fill: var(--level-green); }
.chart-point.level-yellow, .chart-dot.level-yellow { fill: var(--level-yellow); }
.chart-point.level-red, .chart-dot.level-red { fill: var(--level-red); }
.chart-trend { stroke: var(--danger); stroke-width: 2; stroke-dasharray: 6 4; }
.chart-line { fill: none; stroke: currentColor; stroke-width: 2; }
.chart-dot { fill: currentColor; stroke: var(--surface); stroke-width: 1; }
.chart-series-0 { color: var(--chart-1); }
.chart-series-1 { color: var(--chart-2); }
.chart-series-2 { color: var(--chart-3); }
.chart-series-3 { color: var(--chart-4); }
.chart-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 0.5rem 0 0; padding: 0; list-style: none; }
.chart-legend-item { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; }
.chart-legend-item::before { content: ""; width: 1.25rem; height: 0.25rem; background: currentColor; border-radius: 2px; }
.sheet-wrap { max-height: 70vh; overflow: auto; border: 1px solid var(--border); border-radius: 0.5rem; }
.sheet { border-collapse: collapse; width: 100%; font-size: 0.875rem; font-variant-numeric: tabular-nums; }
.sheet th, .sheet td { padding: 0.25rem 0.75rem; border: 1px solid var(--border); white-space: nowrap; text-align: left; }
.sheet thead th { position: sticky; top: 0; background: var(--bg); z-index: 1; text-align: center; }
.sheet tbody th { background: var(--bg); color: var(--muted); font-weight: 400; text-align: center; }
.sheet td.num { text-align: right; }
@media (min-width: 768px) { body { padding: 1.5rem; } .tab-stats { grid-template-columns: max-content 1fr max-content 1fr; } }
`;
})();
