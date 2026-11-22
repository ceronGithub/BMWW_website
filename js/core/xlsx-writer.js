/*
 * FILE    : js/core/xlsx-writer.js
 * PURPOSE : Gumagawa ng .xlsx (Excel) file nang walang library at offline: simpleng ZIP (store) + XML
 * DEPENDS : wala (window.BMWW lang)
 * VERSION : v9.5 | 2026-11-22 | maraming chart sa isang sheet (sheet.chartList; bawat chart may anchor at opsyonal na dataSheet; chart.byColumn = pababa ang data); ang sheet.chart (isa) ay pareho pa rin ang resulta
 * VERSION : v2.8 | 2026-11-20 | bagong file (para sa Export to Excel ng Master Repeatability)
 * VERSION : v2.13 | 2026-11-21 | line chart sa worksheet (sheet.chart): drawing at chart XML
 * VERSION : v2.21 | 2026-11-21 | scatter: opsyonal na chart.hideLegend (walang legend sa chart)
 * VERSION : v2.19 | 2026-11-21 | scatter: opsyonal na chart.pointSeriesList (isang series kada point, may sariling legend entry: kulay + text); tinatanggal ang legend entry ng trendline
 * VERSION : v2.16 | 2026-11-21 | scatter chart na may trendline (chart.kind = 'scatter', kulay kada point), STYLE.precise (4 decimal) at computeColumnWidths (autofit, galing sa master-export.js)
 * VERSION : v2.14 | 2026-11-21 | puting background ng lahat ng cell (may manipis na border), walang gridlines (sheet.showGridLines), chart na fixed ang laki (oneCellAnchor, hindi lumiliit kapag nag-autofit), puting chart area
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
  // 1 pixel = 9525 EMU (unit ng laki ng drawing sa Excel).
  const EMU_PER_PIXEL = 9525;
  const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  // Index ng style sa styles.xml (ang mga ito ang ginagamit ng nagtatawag).
  const STYLE = Object.freeze({ normal: 0, header: 1, bold: 2, number: 3, green: 4, yellow: 5, red: 6, precise: 7 });
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
  function buildSheetView(freeze, showGridLines) {
    const gridAttribute = showGridLines === false ? ' showGridLines="0"' : '';
    if (!freeze || (!freeze.rows && !freeze.columns)) return '<sheetViews><sheetView' + gridAttribute + ' workbookViewId="0"/></sheetViews>';
    const rows = freeze.rows || 0;
    const columns = freeze.columns || 0;
    const pane = columns && rows ? 'bottomRight' : rows ? 'bottomLeft' : 'topRight';
    const attributes = (columns ? ' xSplit="' + columns + '"' : '') + (rows ? ' ySplit="' + rows + '"' : '');
    return '<sheetViews><sheetView' + gridAttribute + ' workbookViewId="0"><pane' + attributes + ' topLeftCell="' + columnLetter(columns) + (rows + 1) + '" activePane="' + pane + '" state="frozen"/></sheetView></sheetViews>';
  }

  // XML ng isang worksheet.
  function buildSheetXml(sheet, hasDrawing) {
    const columnXml = (sheet.columnWidths || []).map((width, index) => '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>').join('');
    const rowXml = sheet.rows.map((cellList, rowIndex) => {
      const cellXml = cellList.map((cell, columnIndex) => buildCell(cell, rowIndex, columnIndex)).join('');
      return cellXml ? '<row r="' + (rowIndex + 1) + '">' + cellXml + '</row>' : '';
    }).join('');
    return XML_HEADER + '<worksheet xmlns="' + MAIN_NS + '" xmlns:r="' + REL_NS + '">' + buildSheetView(sheet.freeze, sheet.showGridLines) + '<sheetFormatPr defaultRowHeight="15"/>' + (columnXml ? '<cols>' + columnXml + '</cols>' : '') + '<sheetData>' + rowXml + '</sheetData>' + (hasDrawing ? '<drawing r:id="rId1"/>' : '') + '</worksheet>';
  }

  // XML ng styles (index ayon sa STYLE). colorMap: header, cell, border, green, yellow, red (hex na walang #).
  // Lahat ng cell ay may solid na puting fill (cell) at manipis na border; ang green / yellow / red lang ang may kulay.
  function buildStylesXml(colorMap) {
    const solidFill = (hex) => '<fill><patternFill patternType="solid"><fgColor rgb="FF' + hex + '"/><bgColor indexed="64"/></patternFill></fill>';
    const fontXml = (isBold, isWhite) => '<font>' + (isBold ? '<b/>' : '') + '<sz val="11"/>' + (isWhite ? '<color rgb="FFFFFFFF"/>' : '') + '<name val="Calibri"/></font>';
    const xf = (fontId, fillId, numberFormatId) => '<xf numFmtId="' + numberFormatId + '" fontId="' + fontId + '" fillId="' + fillId + '" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>';
    const side = (name) => '<' + name + ' style="thin"><color rgb="FF' + colorMap.border + '"/></' + name + '>';
    return XML_HEADER + '<styleSheet xmlns="' + MAIN_NS + '">'
      + '<numFmts count="2"><numFmt numFmtId="164" formatCode="0.000"/><numFmt numFmtId="165" formatCode="0.0000"/></numFmts>'
      + '<fonts count="3">' + fontXml(false, false) + fontXml(true, false) + fontXml(true, true) + '</fonts>'
      + '<fills count="7"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
      + solidFill(colorMap.header) + solidFill(colorMap.green) + solidFill(colorMap.yellow) + solidFill(colorMap.red) + solidFill(colorMap.cell) + '</fills>'
      + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>' + side('left') + side('right') + side('top') + side('bottom') + '<diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="8">' + xf(0, 6, 0) + xf(1, 2, 0) + xf(1, 6, 0) + xf(0, 6, 164) + xf(2, 3, 164) + xf(1, 4, 164) + xf(2, 5, 164) + xf(0, 6, 165) + '</cellXfs>'
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
    // [v9.5] chart.byColumn: pababa ang data (series.column; pangalan sa chart.headerRow; categories sa chart.categoryColumn; chart.firstRow hanggang chart.lastRow). Kung wala, pakanan ang data gaya ng dati.
    const rangeText = chart.byColumn
      ? (column) => sheetRef + '!' + absoluteRef(column, chart.firstRow) + ':' + absoluteRef(column, chart.lastRow)
      : (row) => sheetRef + '!' + absoluteRef(chart.firstColumn, row) + ':' + absoluteRef(chart.lastColumn, row);
    const nameRef = chart.byColumn ? absoluteRef(series.column, chart.headerRow) : absoluteRef(chart.nameColumn, series.row);
    const seriesKey = chart.byColumn ? series.column : series.row;
    const categoryKey = chart.byColumn ? chart.categoryColumn : chart.categoryRow;
    return '<c:ser><c:idx val="' + index + '"/><c:order val="' + index + '"/>'
      + '<c:tx><c:strRef><c:f>' + sheetRef + '!' + nameRef + '</c:f>' + buildStringCache([series.name]) + '</c:strRef></c:tx>'
      + '<c:spPr><a:ln w="' + series.width + '" cap="rnd">' + fill + '<a:round/></a:ln></c:spPr>'
      + '<c:marker><c:symbol val="circle"/><c:size val="' + series.markerSize + '"/><c:spPr>' + fill + '<a:ln><a:noFill/></a:ln></c:spPr></c:marker>'
      + '<c:cat><c:strRef><c:f>' + rangeText(categoryKey) + '</c:f>' + buildStringCache(chart.categoryList) + '</c:strRef></c:cat>'
      + '<c:val><c:numRef><c:f>' + rangeText(seriesKey) + '</c:f>' + buildNumberCache(series.values) + '</c:numRef></c:val>'
      + '<c:smooth val="0"/></c:ser>';
  }

  // Pamagat ng chart.
  function buildChartTitleXml(text) {
    return '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1400" b="1"/><a:t>' + escapeXml(text) + '</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>';
  }

  // Pamagat ng axis (blangko kung walang text).
  function buildAxisTitleXml(text) {
    return text ? '<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1000" b="0"/><a:t>' + escapeXml(text) + '</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>' : '';
  }

  // Saklaw ng cell ng isang column (patayo), hal. Sheet!$B$14:$B$20.
  function columnRangeText(sheetRef, columnIndex, firstRow, lastRow) {
    return sheetRef + '!' + absoluteRef(columnIndex, firstRow) + ':' + absoluteRef(columnIndex, lastRow);
  }

  // Style ng isang value axis ng scatter (x sa ibaba, y sa kaliwa).
  function buildScatterAxisXml(axisId, crossId, position, title, minValue, maxValue) {
    const scaling = '<c:scaling><c:orientation val="minMax"/>' + (maxValue !== undefined ? '<c:max val="' + maxValue + '"/><c:min val="' + minValue + '"/>' : '') + '</c:scaling>';
    return '<c:valAx><c:axId val="' + axisId + '"/>' + scaling + '<c:delete val="0"/><c:axPos val="' + position + '"/><c:majorGridlines/>' + buildAxisTitleXml(title)
      + '<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="' + crossId + '"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx>';
  }

  // XML ng scatter chart: x = master, y = actual; may linear trendline (equation at R squared); kulay ng bawat point ayon sa level.
  // chart: { title, xTitle, yTitle, nameRef:{column,row,text}, xRange:{column,firstRow,lastRow}, yRange:{...}, xValues, yValues,
  //          pointColorList, pointColor, markerSize, trendColor, trendWidth, xMin, xMax, yMin, yMax, anchor,
  //          pointSeriesList (opsyonal): [{ name, color, x, y, xColumn, yColumn, row }] }
  function buildScatterChartXml(sheetName, chart) {
    const sheetRef = quoteSheetName(sheetName);
    const fill = (hex) => '<a:solidFill><a:srgbClr val="' + hex + '"/></a:solidFill>';
    const pointXml = (color, index) => '<c:dPt><c:idx val="' + index + '"/><c:marker><c:symbol val="circle"/><c:size val="' + chart.markerSize + '"/><c:spPr>' + fill(color) + '<a:ln><a:noFill/></a:ln></c:spPr></c:marker><c:bubble3D val="0"/><c:spPr>' + fill(color) + '<a:ln><a:noFill/></a:ln></c:spPr></c:dPt>';
    const trendline = '<c:trendline><c:spPr><a:ln w="' + chart.trendWidth + '">' + fill(chart.trendColor) + '<a:prstDash val="dash"/></a:ln></c:spPr><c:trendlineType val="linear"/><c:dispRSqr val="1"/><c:dispEq val="1"/></c:trendline>';
    // Per-point na series (para may sariling legend entry ang bawat point: kulay + text). Kapag wala, isang series lang na may dPt.
    const pointSeriesList = chart.pointSeriesList || null;
    const pointCount = pointSeriesList ? pointSeriesList.length : 0;
    const pointSeriesXml = (pointSeriesList || []).map((item, index) => '<c:ser><c:idx val="' + index + '"/><c:order val="' + index + '"/>'
      + '<c:tx><c:v>' + escapeXml(item.name) + '</c:v></c:tx>'
      + '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>'
      + '<c:marker><c:symbol val="circle"/><c:size val="' + chart.markerSize + '"/><c:spPr>' + fill(item.color) + '<a:ln><a:noFill/></a:ln></c:spPr></c:marker>'
      + '<c:xVal><c:numRef><c:f>' + columnRangeText(sheetRef, item.xColumn, item.row, item.row) + '</c:f>' + buildNumberCache([item.x]) + '</c:numRef></c:xVal>'
      + '<c:yVal><c:numRef><c:f>' + columnRangeText(sheetRef, item.yColumn, item.row, item.row) + '</c:f>' + buildNumberCache([item.y]) + '</c:numRef></c:yVal>'
      + '<c:smooth val="0"/></c:ser>').join('');
    const baseMarker = pointSeriesList
      ? '<c:marker><c:symbol val="none"/></c:marker>'
      : '<c:marker><c:symbol val="circle"/><c:size val="' + chart.markerSize + '"/><c:spPr>' + fill(chart.pointColor) + '<a:ln><a:noFill/></a:ln></c:spPr></c:marker>';
    const series = pointSeriesXml + '<c:ser><c:idx val="' + pointCount + '"/><c:order val="' + pointCount + '"/>'
      + '<c:tx><c:strRef><c:f>' + sheetRef + '!' + absoluteRef(chart.nameRef.column, chart.nameRef.row) + '</c:f>' + buildStringCache([chart.nameRef.text]) + '</c:strRef></c:tx>'
      + '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>'
      + baseMarker
      + (pointSeriesList ? '' : (chart.pointColorList || []).map((color, index) => pointXml(color, index)).join(''))
      + trendline
      + '<c:xVal><c:numRef><c:f>' + columnRangeText(sheetRef, chart.xRange.column, chart.xRange.firstRow, chart.xRange.lastRow) + '</c:f>' + buildNumberCache(chart.xValues) + '</c:numRef></c:xVal>'
      + '<c:yVal><c:numRef><c:f>' + columnRangeText(sheetRef, chart.yRange.column, chart.yRange.firstRow, chart.yRange.lastRow) + '</c:f>' + buildNumberCache(chart.yValues) + '</c:numRef></c:yVal>'
      + '<c:smooth val="0"/></c:ser>';
    // Legend: sa per-point mode, tinatanggal ang entry ng base series (pang-trendline lang) at ng trendline.
    const legendXml = chart.hideLegend ? '' : pointSeriesList
      ? '<c:legend><c:legendPos val="r"/><c:legendEntry><c:idx val="' + pointCount + '"/><c:delete val="1"/></c:legendEntry><c:legendEntry><c:idx val="' + (pointCount + 1) + '"/><c:delete val="1"/></c:legendEntry><c:overlay val="0"/></c:legend>'
      : '<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>';
    return XML_HEADER + '<c:chartSpace xmlns:c="' + CHART_NS + '" xmlns:a="' + DRAWINGML_NS + '" xmlns:r="' + REL_NS + '"><c:roundedCorners val="0"/><c:chart>' + buildChartTitleXml(chart.title) + '<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>'
      + '<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>' + series + '<c:axId val="60010"/><c:axId val="60020"/></c:scatterChart>'
      + buildScatterAxisXml(60010, 60020, 'b', chart.xTitle, chart.xMin, chart.xMax) + buildScatterAxisXml(60020, 60010, 'l', chart.yTitle, chart.yMin, chart.yMax)
      + '</c:plotArea>' + legendXml + '<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>'
      + '<c:spPr>' + fill('FFFFFF') + '<a:ln><a:noFill/></a:ln></c:spPr></c:chartSpace>';
  }

  // XML ng line chart: bawat series ay isang linya; categories = barcode.
  function buildChartXml(sheetName, chart) {
    if (chart.kind === 'scatter') return buildScatterChartXml(sheetName, chart);
    const sheetRef = quoteSheetName(sheetName);
    const titleXml = buildChartTitleXml(chart.title);
    const axisTitle = buildAxisTitleXml;
    return XML_HEADER + '<c:chartSpace xmlns:c="' + CHART_NS + '" xmlns:a="' + DRAWINGML_NS + '" xmlns:r="' + REL_NS + '"><c:roundedCorners val="0"/><c:chart>' + titleXml + '<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>'
      + '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' + chart.seriesList.map((series, index) => buildSeriesXml(series, index, sheetRef, chart)).join('') + '<c:marker val="1"/><c:axId val="50010"/><c:axId val="50020"/></c:lineChart>'
      + '<c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>' + axisTitle(chart.xTitle) + '<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
      + '<c:valAx><c:axId val="50020"/><c:scaling><c:orientation val="minMax"/>' + (chart.yMax !== undefined ? '<c:max val="' + chart.yMax + '"/><c:min val="' + chart.yMin + '"/>' : '') + '</c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/>' + axisTitle(chart.yTitle) + '<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>'
      + '</c:plotArea><c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr></c:chartSpace>';
  }

  // XML ng drawing: saan nakalagay ang chart sa sheet. anchor: { column, row, widthPixels, heightPixels }.
  // oneCellAnchor = fixed ang laki (hindi lumiliit o lumalaki kapag binago ang lapad ng column o taas ng row).
  // [v9.5] Isang anchor ng chart (index = pang-ilan sa sheet, 0 = una) para sa drawing na may isa o maraming chart.
  function buildAnchorXml(anchor, index) {
    const widthEmu = Math.round(anchor.widthPixels * EMU_PER_PIXEL);
    const heightEmu = Math.round(anchor.heightPixels * EMU_PER_PIXEL);
    return '<xdr:oneCellAnchor>'
      + '<xdr:from><xdr:col>' + anchor.column + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + anchor.row + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
      + '<xdr:ext cx="' + widthEmu + '" cy="' + heightEmu + '"/>'
      + '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="' + (index + 2) + '" name="Chart ' + (index + 1) + '"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="' + widthEmu + '" cy="' + heightEmu + '"/></xdr:xfrm>'
      + '<a:graphic><a:graphicData uri="' + CHART_NS + '"><c:chart xmlns:c="' + CHART_NS + '" xmlns:r="' + REL_NS + '" r:id="rId' + (index + 1) + '"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor>';
  }

  // XML ng drawing ng isang sheet: isa o maraming anchor. Kapag isa lang ang chart, kapareho ng dati ang resulta.
  function buildDrawingXml(anchorList) {
    return XML_HEADER + '<xdr:wsDr xmlns:xdr="' + DRAWING_NS + '" xmlns:a="' + DRAWINGML_NS + '">' + anchorList.map(buildAnchorXml).join('') + '</xdr:wsDr>';
  }

  // Relationships file: isang Relationship kada target (rId1, rId2, ...).
  function buildRelsXml(type, targetList) {
    return XML_HEADER + '<Relationships xmlns="' + PACKAGE_REL_NS + '">'
      + targetList.map((target, index) => '<Relationship Id="rId' + (index + 1) + '" Type="' + REL_NS + '/' + type + '" Target="' + target + '"/>').join('') + '</Relationships>';
  }

  // [v9.5] Mga chart ng sheet: sheet.chartList (maraming chart) o sheet.chart (isa, gaya ng dati).
  function getSheetCharts(sheet) {
    return sheet.chartList || (sheet.chart ? [sheet.chart] : []);
  }

  // Lahat ng bahagi ng .xlsx package bilang { name, bytes }.
  function buildPackageEntries(sheetList, colorMap) {
    const sheetCount = sheetList.length;
    const chartSheetList = sheetList.filter((sheet) => getSheetCharts(sheet).length);
    const totalChartCount = sheetList.reduce((total, sheet) => total + getSheetCharts(sheet).length, 0);
    const contentTypes = XML_HEADER + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + sheetList.map((sheet, index) => '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')
      + chartSheetList.map((sheet, index) => '<Override PartName="/xl/drawings/drawing' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>').join('')
      + Array.from({ length: totalChartCount }, (unused, index) => '<Override PartName="/xl/charts/chart' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>').join('')
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
    let drawingNumber = 0;
    let chartNumber = 0;
    sheetList.forEach((sheet, index) => {
      const chartList = getSheetCharts(sheet);
      entryList.push({ name: 'xl/worksheets/sheet' + (index + 1) + '.xml', text: buildSheetXml(sheet, chartList.length > 0) });
      if (!chartList.length) return;
      drawingNumber += 1;
      const chartTargetList = chartList.map(() => { chartNumber += 1; return '../charts/chart' + chartNumber + '.xml'; });
      const firstChartNumber = chartNumber - chartList.length + 1;
      entryList.push({ name: 'xl/worksheets/_rels/sheet' + (index + 1) + '.xml.rels', text: buildRelsXml('drawing', ['../drawings/drawing' + drawingNumber + '.xml']) });
      entryList.push({ name: 'xl/drawings/drawing' + drawingNumber + '.xml', text: buildDrawingXml(chartList.map((chart) => chart.anchor)) });
      entryList.push({ name: 'xl/drawings/_rels/drawing' + drawingNumber + '.xml.rels', text: buildRelsXml('chart', chartTargetList) });
      // chart.dataSheet (opsyonal): pangalan ng sheet kung saan nakalagay ang data ng chart (kung hindi ito ang sheet na may chart).
      chartList.forEach((chart, chartIndex) => {
        entryList.push({ name: 'xl/charts/chart' + (firstChartNumber + chartIndex) + '.xml', text: buildChartXml(chart.dataSheet || sheet.name, chart) });
      });
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

  // Text na makikita sa cell (3 decimal para sa numero na may number o level style), para sa autofit.
  function getDisplayText(cell) {
    const isObject = cell !== null && typeof cell === 'object';
    const value = isObject ? cell.v : cell;
    if (value === null || value === undefined) return '';
    const isFormatted = isObject && cell.s && cell.s !== STYLE.header && cell.s !== STYLE.bold;
    return typeof value === 'number' && isFormatted ? value.toFixed(cell.s === STYLE.precise ? 4 : 3) : String(value);
  }

  // Autofit: lapad ng bawat column ayon sa pinakamahabang laman (bold ay mas malapad nang kaunti).
  // setting: { MIN, MAX, EXTRA, BOLD_FACTOR }.
  function computeColumnWidths(rows, setting) {
    const widthList = [];
    rows.forEach((cellList) => cellList.forEach((cell, columnIndex) => {
      const isBold = cell !== null && typeof cell === 'object' && Boolean(cell.s) && cell.s !== STYLE.number;
      const length = Array.from(getDisplayText(cell)).length * (isBold ? setting.BOLD_FACTOR : 1);
      widthList[columnIndex] = Math.max(widthList[columnIndex] || 0, length);
    }));
    return Array.from(widthList, (length) => Math.min(setting.MAX, Math.max(setting.MIN, Math.ceil((length || 0) + setting.EXTRA))));
  }

  root.xlsx = Object.freeze({ STYLE, buildWorkbook, computeColumnWidths });
})();
