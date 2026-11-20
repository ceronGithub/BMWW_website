/*
 * FILE    : js/core/xlsx-writer.js
 * PURPOSE : Gumagawa ng .xlsx (Excel) file nang walang library at offline: simpleng ZIP (store) + XML
 * DEPENDS : wala (window.BMWW lang)
 * VERSION : v2.8 | 2026-11-20 | bagong file (para sa Export to Excel ng Master Repeatability)
 * VERSION : v2.13 | 2026-11-21 | line chart sa worksheet (sheet.chart): drawing at chart XML
 */
(function () {
  'use strict';
  const root = window.BMWW;
  // Format constants ng .xlsx (hindi setting ng app).
  const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const CHART_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
  const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const DRAWINGML_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  // Index ng style sa styles.xml (ang mga ito ang ginagamit ng nagtatawag).
  const STYLE = Object.freeze({ normal: 0, header: 1, bold: 2, number: 3, green: 4, yellow: 5, red: 6 });
  const encoder = new TextEncoder();

  // CRC32 table (para sa ZIP).
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
      table[index] = value >>> 0;
    }
    return table;
  })();

  // CRC32 ng isang byte array.
  function computeCrc(bytes) {
    let crc = 0xFFFFFFFF;
    for (let index = 0; index < bytes.length; index += 1) crc = crcTable[(crc ^ bytes[index]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // Titik ng column: 0 -> A, 26 -> AA.
  function columnLetter(columnIndex) {
    let number = columnIndex + 1;
    let letters = '';
    while (number > 0) {
      const remainder = (number - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      number = Math.floor((number - 1) / 26);
    }
    return letters;
  }

  // Escape ng text para sa XML (tinatanggal ang control characters).
  function escapeXml(text) {
    return String(text)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Isang cell: numero (n), text (inlineStr) o blangko na may style. cell = value | { v, s }.
  function buildCell(cell, rowIndex, columnIndex) {
    const isObject = cell !== null && typeof cell === 'object';
    const value = isObject ? cell.v : cell;
    const style = isObject && cell.s ? cell.s : 0;
    const isEmpty = value === null || value === undefined || value === '';
    if (isEmpty && !style) return '';
    const reference = columnLetter(columnIndex) + (rowIndex + 1);
    const styleAttribute = style ? ' s="' + style + '"' : '';
    if (isEmpty) return '<c r="' + reference + '"' + styleAttribute + '/>';
    if (typeof value === 'number' && Number.isFinite(value)) return '<c r="' + reference + '"' + styleAttribute + '><v>' + value + '</v></c>';
    return '<c r="' + reference + '"' + styleAttribute + ' t="inlineStr"><is><t xml:space="preserve">' + escapeXml(value) + '</t></is></c>';
  }

  // Freeze panes (rows sa taas, columns sa kaliwa).
  function buildSheetView(freeze) {
    if (!freeze || (!freeze.rows && !freeze.columns)) return '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
    const rows = freeze.rows || 0;
    const columns = freeze.columns || 0;
    const pane = columns && rows ? 'bottomRight' : rows ? 'bottomLeft' : 'topRight';
    const attributes = (columns ? ' xSplit="' + columns + '"' : '') + (rows ? ' ySplit="' + rows + '"' : '');
    return '<sheetViews><sheetView workbookViewId="0"><pane' + attributes + ' topLeftCell="' + columnLetter(columns) + (rows + 1) + '" activePane="' + pane + '" state="frozen"/></sheetView></sheetViews>';
  }

  // XML ng isang worksheet.
  function buildSheetXml(sheet, hasDrawing) {
    const columnXml = (sheet.columnWidths || []).map((width, index) => '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>').join('');
    const rowXml = sheet.rows.map((cellList, rowIndex) => {
      const cellXml = cellList.map((cell, columnIndex) => buildCell(cell, rowIndex, columnIndex)).join('');
      return cellXml ? '<row r="' + (rowIndex + 1) + '">' + cellXml + '</row>' : '';
    }).join('');
    return XML_HEADER + '<worksheet xmlns="' + MAIN_NS + '" xmlns:r="' + REL_NS + '">' + buildSheetView(sheet.freeze) + '<sheetFormatPr defaultRowHeight="15"/>' + (columnXml ? '<cols>' + columnXml + '</cols>' : '') + '<sheetData>' + rowXml + '</sheetData>' + (hasDrawing ? '<drawing r:id="rId1"/>' : '') + '</worksheet>';
  }

  // XML ng styles (index ayon sa STYLE). colorMap: header, green, yellow, red (hex na walang #).
  function buildStylesXml(colorMap) {
    const solidFill = (hex) => '<fill><patternFill patternType="solid"><fgColor rgb="FF' + hex + '"/><bgColor indexed="64"/></patternFill></fill>';
    const fontXml = (isBold, isWhite) => '<font>' + (isBold ? '<b/>' : '') + '<sz val="11"/>' + (isWhite ? '<color rgb="FFFFFFFF"/>' : '') + '<name val="Calibri"/></font>';
    const xf = (fontId, fillId, numberFormatId) => '<xf numFmtId="' + numberFormatId + '" fontId="' + fontId + '" fillId="' + fillId + '" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/>';
    return XML_HEADER + '<styleSheet xmlns="' + MAIN_NS + '">'
      + '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.000"/></numFmts>'
      + '<fonts count="3">' + fontXml(false, false) + fontXml(true, false) + fontXml(true, true) + '</fonts>'
      + '<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
      + solidFill(colorMap.header) + solidFill(colorMap.green) + solidFill(colorMap.yellow) + solidFill(colorMap.red) + '</fills>'
      + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="7">' + xf(0, 0, 0) + xf(1, 2, 0) + xf(1, 0, 0) + xf(0, 0, 164) + xf(2, 3, 164) + xf(1, 4, 164) + xf(2, 5, 164) + '</cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  // Absolute na reference ng cell, hal. (1, 2) -> $B$3.
  function absoluteRef(columnIndex, rowIndex) {
    return '$' + columnLetter(columnIndex) + '$' + (rowIndex + 1);
  }

  // Sheet name na may quote para sa formula ng chart.
  function quoteSheetName(name) {
    return "'" + String(name).replace(/'/g, "''") + "'";
  }

  // Cache ng text (para makita agad ng viewer ang chart).
  function buildStringCache(valueList) {
    return '<c:strCache><c:ptCount val="' + valueList.length + '"/>' + valueList.map((value, index) => '<c:pt idx="' + index + '"><c:v>' + escapeXml(value) + '</c:v></c:pt>').join('') + '</c:strCache>';
  }

  // Cache ng numero (walang pt kapag blangko).
  function buildNumberCache(valueList) {
    return '<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="' + valueList.length + '"/>'
      + valueList.map((value, index) => (typeof value === 'number' && Number.isFinite(value) ? '<c:pt idx="' + index + '"><c:v>' + value + '</c:v></c:pt>' : '')).join('') + '</c:numCache>';
  }

  // XML ng isang linya (series) ng chart.
  function buildSeriesXml(series, index, sheetRef, chart) {
    const fill = '<a:solidFill><a:srgbClr val="' + series.color + '"/></a:solidFill>';
    const rangeText = (row) => sheetRef + '!' + absoluteRef(chart.firstColumn, row) + ':' + absoluteRef(chart.lastColumn, row);
    return '<c:ser><c:idx val="' + index + '"/><c:order val="' + index + '"/>'
      + '<c:tx><c:strRef><c:f>' + sheetRef + '!' + absoluteRef(chart.nameColumn, series.row) + '</c:f>' + buildStringCache([series.name]) + '</c:strRef></c:tx>'
      + '<c:spPr><a:ln w="' + series.width + '" cap="rnd">' + fill + '<a:round/></a:ln></c:spPr>'
      + '<c:marker><c:symbol val="circle"/><c:size val="' + series.markerSize + '"/><c:spPr>' + fill + '<a:ln><a:noFill/></a:ln></c:spPr></c:marker>'
      + '<c:cat><c:strRef><c:f>' + rangeText(chart.categoryRow) + '</c:f>' + buildStringCache(chart.categoryList) + '</c:strRef></c:cat>'
      + '<c:val><c:numRef><c:f>' + rangeText(series.row) + '</c:f>' + buildNumberCache(series.values) + '</c:numRef></c:val>'
      + '<c:smooth val="0"/></c:ser>';
  }

  // XML ng line chart: bawat series ay isang linya; categories = barcode.
  function buildChartXml(sheetName, chart) {
    const sheetRef = quoteSheetName(sheetName);
    const titleXml = '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1400" b="1"/><a:t>' + escapeXml(chart.title) + '</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>';
    const axisTitle = (text) => (text ? '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1000" b="0"/><a:t>' + escapeXml(text) + '</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>' : '');
    return XML_HEADER + '<c:chartSpace xmlns:c="' + CHART_NS + '" xmlns:a="' + DRAWINGML_NS + '" xmlns:r="' + REL_NS + '"><c:roundedCorners val="0"/><c:chart>' + titleXml + '<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>'
      + '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' + chart.seriesList.map((series, index) => buildSeriesXml(series, index, sheetRef, chart)).join('') + '<c:marker val="1"/><c:axId val="50010"/><c:axId val="50020"/></c:lineChart>'
      + '<c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>' + axisTitle(chart.xTitle) + '<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
      + '<c:valAx><c:axId val="50020"/><c:scaling><c:orientation val="minMax"/>' + (chart.yMax !== undefined ? '<c:max val="' + chart.yMax + '"/><c:min val="' + chart.yMin + '"/>' : '') + '</c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/>' + axisTitle(chart.yTitle) + '<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>'
      + '</c:plotArea><c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>';
  }

  // XML ng drawing: saan nakalagay ang chart sa sheet (anchor: column, row, columnSpan, rowSpan).
  function buildDrawingXml(anchor) {
    const point = (tag, column, row) => '<xdr:' + tag + '><xdr:col>' + column + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + row + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:' + tag + '>';
    return XML_HEADER + '<xdr:wsDr xmlns:xdr="' + DRAWING_NS + '" xmlns:a="' + DRAWINGML_NS + '"><xdr:twoCellAnchor>'
      + point('from', anchor.column, anchor.row) + point('to', anchor.column + anchor.columnSpan, anchor.row + anchor.rowSpan)
      + '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>'
      + '<a:graphic><a:graphicData uri="' + CHART_NS + '"><c:chart xmlns:c="' + CHART_NS + '" xmlns:r="' + REL_NS + '" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
  }

  // Relationships file na may isang target.
  function buildRelsXml(type, target) {
    return XML_HEADER + '<Relationships xmlns="' + PACKAGE_REL_NS + '"><Relationship Id="rId1" Type="' + REL_NS + '/' + type + '" Target="' + target + '"/></Relationships>';
  }

  // Lahat ng bahagi ng .xlsx package bilang { name, bytes }.
  function buildPackageEntries(sheetList, colorMap) {
    const sheetCount = sheetList.length;
    const chartSheetList = sheetList.filter((sheet) => sheet.chart);
    const contentTypes = XML_HEADER + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + sheetList.map((sheet, index) => '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')
      + chartSheetList.map((sheet, index) => '<Override PartName="/xl/drawings/drawing' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>').join('')
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    const packageRels = XML_HEADER + '<Relationships xmlns="' + PACKAGE_REL_NS + '"><Relationship Id="rId1" Type="' + REL_NS + '/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const workbook = XML_HEADER + '<workbook xmlns="' + MAIN_NS + '" xmlns:r="' + REL_NS + '"><sheets>'
      + sheetList.map((sheet, index) => '<sheet name="' + escapeXml(sheet.name) + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>').join('') + '</sheets></workbook>';
    const workbookRels = XML_HEADER + '<Relationships xmlns="' + PACKAGE_REL_NS + '">'
      + sheetList.map((sheet, index) => '<Relationship Id="rId' + (index + 1) + '" Type="' + REL_NS + '/worksheet" Target="worksheets/sheet' + (index + 1) + '.xml"/>').join('')
      + '<Relationship Id="rId' + (sheetCount + 1) + '" Type="' + REL_NS + '/styles" Target="styles.xml"/></Relationships>';
    const entryList = [
      { name: '[Content_Types].xml', text: contentTypes }, { name: '_rels/.rels', text: packageRels },
      { name: 'xl/workbook.xml', text: workbook }, { name: 'xl/_rels/workbook.xml.rels', text: workbookRels },
      { name: 'xl/styles.xml', text: buildStylesXml(colorMap) }
    ];
    let chartNumber = 0;
    sheetList.forEach((sheet, index) => {
      entryList.push({ name: 'xl/worksheets/sheet' + (index + 1) + '.xml', text: buildSheetXml(sheet, Boolean(sheet.chart)) });
      if (!sheet.chart) return;
      chartNumber += 1;
      entryList.push({ name: 'xl/worksheets/_rels/sheet' + (index + 1) + '.xml.rels', text: buildRelsXml('drawing', '../drawings/drawing' + chartNumber + '.xml') });
      entryList.push({ name: 'xl/drawings/drawing' + chartNumber + '.xml', text: buildDrawingXml(sheet.chart.anchor) });
      entryList.push({ name: 'xl/drawings/_rels/drawing' + chartNumber + '.xml.rels', text: buildRelsXml('chart', '../charts/chart' + chartNumber + '.xml') });
      entryList.push({ name: 'xl/charts/chart' + chartNumber + '.xml', text: buildChartXml(sheet.name, sheet.chart) });
    });
    return entryList.map((entry) => ({ name: entry.name, bytes: encoder.encode(entry.text) }));
  }

  // ZIP na walang compression (method 0).
  function buildZip(entryList) {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const localList = [];
    const centralList = [];
    let offset = 0;
    entryList.forEach((entry) => {
      const nameBytes = encoder.encode(entry.name);
      const size = entry.bytes.length;
      const crc = computeCrc(entry.bytes);
      const local = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true); localView.setUint16(10, dosTime, true); localView.setUint16(12, dosDate, true);
      localView.setUint32(14, crc, true); localView.setUint32(18, size, true); localView.setUint32(22, size, true);
      localView.setUint16(26, nameBytes.length, true); localView.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      const central = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true); centralView.setUint16(10, 0, true); centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, size, true);
      centralView.setUint32(24, size, true); centralView.setUint16(28, nameBytes.length, true); centralView.setUint32(42, offset, true);
      central.set(nameBytes, 46);
      localList.push(local, entry.bytes);
      centralList.push(central);
      offset += local.length + size;
    });
    const centralSize = centralList.reduce((total, part) => total + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, entryList.length, true); endView.setUint16(10, entryList.length, true);
    endView.setUint32(12, centralSize, true); endView.setUint32(16, offset, true);
    return new Blob([...localList, ...centralList, end], { type: MIME_TYPE });
  }

  // sheetList: [{ name, rows: [[cell]], columnWidths, freeze: {rows, columns} }] -> Blob (.xlsx).
  function buildWorkbook(sheetList, colorMap) {
    return buildZip(buildPackageEntries(sheetList, colorMap));
  }

  root.xlsx = Object.freeze({ STYLE, buildWorkbook });
})();
