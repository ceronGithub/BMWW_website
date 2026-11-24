/*
 * FILE    : tools/check-templates/check-templates.js
 * PURPOSE : Sinusuri kung magkapareho ang pages/*.html at ang kopya nito sa js/templates/*.template.js (at components/sidebar.html)
 * DEPENDS : Node.js (kahit anong bagong bersyon); walang ibang package
 * USED BY : run-check-templates.bat o: node tools/check-templates/check-templates.js
 * OUTPUT  : MATCH o DRIFT kada page, may unang linyang magkaiba; exit code 1 kapag may DRIFT. Basa lang, walang binabago.
 * VERSION : v1 | 2026-11-24 | bagong file (Batch H: Task 15)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PAGE_MARKER = '<!-- PAGE:';
const SIDEBAR_NAME = 'sidebar';

// Binabasa ang file bilang text na LF lang ang linya.
function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

// Kinukuha ang laman ng template string sa template.js (sa pagitan ng unang ` pagkatapos ng registerTemplate at ng huling `).
function extractTemplate(source) {
  const callIndex = source.indexOf('registerTemplate(');
  if (callIndex < 0) return null;
  const start = source.indexOf('`', callIndex);
  const end = source.lastIndexOf('`');
  if (start < 0 || end <= start) return null;
  // Binabalik ang escape ng template literal (\` \\ \${) sa orihinal na text.
  return source.slice(start + 1, end).replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/\\\\/g, '\\');
}

// Pinuputol ang header comment ng HTML file; ang nilalaman ay nagsisimula sa <!-- PAGE: (kung wala, buong file).
function stripHeader(html) {
  const index = html.indexOf(PAGE_MARKER);
  if (index >= 0) return html.slice(index).trim();
  // Walang PAGE marker (404, sidebar): tinatanggal ang unang comment sa itaas kung nagsisimula ang file sa <!--.
  const trimmed = html.trim();
  const commentEnd = trimmed.startsWith('<!--') ? trimmed.indexOf('-->') : -1;
  return (commentEnd >= 0 ? trimmed.slice(commentEnd + 3) : trimmed).trim();
}

// Hinahambing ang dalawang text; ibinibigay ang unang magkaibang linya (o null kung pareho).
function firstDifference(left, right) {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const count = Math.max(leftLines.length, rightLines.length);
  for (let index = 0; index < count; index += 1) {
    if ((leftLines[index] || '').trimEnd() !== (rightLines[index] || '').trimEnd()) {
      return { line: index + 1, html: leftLines[index] || '(wala)', template: rightLines[index] || '(wala)' };
    }
  }
  return null;
}

// Sinusuri ang isang pares; ibinibigay ang resulta.
function checkPair(name, htmlPath, templatePath) {
  if (!fs.existsSync(htmlPath)) return { name, status: 'MISSING', note: 'walang ' + path.relative(ROOT, htmlPath) };
  if (!fs.existsSync(templatePath)) return { name, status: 'MISSING', note: 'walang ' + path.relative(ROOT, templatePath) };
  const template = extractTemplate(readText(templatePath));
  if (template === null) return { name, status: 'UNREADABLE', note: 'hindi mabasa ang template string' };
  const diff = firstDifference(stripHeader(readText(htmlPath)), template.trim());
  return diff ? { name, status: 'DRIFT', note: 'linya ' + diff.line + ' | html: ' + diff.html.trim().slice(0, 90) + ' | template: ' + diff.template.trim().slice(0, 90) } : { name, status: 'MATCH', note: '' };
}

// Pangunahing takbo.
function main() {
  const templateDir = path.join(ROOT, 'js', 'templates');
  const nameList = fs.readdirSync(templateDir).filter((file) => file.endsWith('.template.js')).map((file) => file.replace('.template.js', '')).sort();
  const resultList = nameList.map((name) => {
    const htmlPath = name === SIDEBAR_NAME ? path.join(ROOT, 'components', 'sidebar.html') : path.join(ROOT, 'pages', name + '.html');
    return checkPair(name, htmlPath, path.join(templateDir, name + '.template.js'));
  });
  resultList.forEach((result) => process.stdout.write(result.status.padEnd(10) + result.name + (result.note ? '  ' + result.note : '') + '\n'));
  const badCount = resultList.filter((result) => result.status !== 'MATCH').length;
  process.stdout.write('\n' + (badCount ? badCount + ' ang may problema.' : 'Lahat ay magkapareho.') + '\n');
  process.exitCode = badCount ? 1 : 0;
}

main();
