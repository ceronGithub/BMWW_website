/**
 * FILE: js/loteLogic.js
 * ANO ITO: Pure logic para sa lote: pangalan ng LOT Unit, pangalan ng Shift, at ang
 *          pagpipilian sa Remarks. Kopya ng gawi ng macro (modResultUnitCollector,
 *          modShiftResolver, modMacroConfig).
 * INPUT:   Wafer, Layer No., Blk (text) at isang Date.
 * OUTPUT:  text (LOT Unit / Shift) at listahan ng Remarks.
 * TANDAAN: Walang DOM at walang storage dito. Ang config lang (js/config.js) ang binabasa.
 *          Ginagamit ito ng queue events (task 7 pataas) at ng RESULT.
 */

import { CONFIG } from "./config.js";

/**
 * buildLotUnitName
 * Binubuo ang LOT Unit sa pagkakasunod na Wafer + Layer No. + Blk, hal. 4A25C + 20 + A
 * -> "4A25C20A". Ang Wafer at Blk ay ginagawang malaking letra (kapareho ng parser ng macro).
 * Ang Layer No. ay iniiwang text para hindi mawala ang leading zero (hal. "05").
 * Kapag may kulang na bahagi, blangko ang ibabalik para walang kalahating pangalan.
 */
export function buildLotUnitName(wafer, layerNo, blk) {
  const waferCode = String(wafer ?? "").trim().toUpperCase();
  const layerNumber = String(layerNo ?? "").trim();
  const blockCode = String(blk ?? "").trim().toUpperCase();

  if (waferCode === "" || layerNumber === "" || blockCode === "") return "";
  return waferCode + layerNumber + blockCode;
}

/**
 * getShiftName
 * Sinasabi kung anong shift ang isang oras, ayon sa CONFIG.SHIFTS:
 * Shift 1 (06:00-13:59), Shift 2 (14:00-21:59), at Shift 3 para sa natitira (22:00-05:59).
 * Blangko ang ibabalik kung hindi valid na Date ang ipinasa.
 */
export function getShiftName(moment, shiftSettings = CONFIG.SHIFTS) {
  if (!(moment instanceof Date) || Number.isNaN(moment.getTime())) return "";

  const hourValue = moment.getHours();

  if (hourValue >= shiftSettings.shiftOneStartHour && hourValue < shiftSettings.shiftTwoStartHour) {
    return shiftSettings.shiftOneName;
  }
  if (hourValue >= shiftSettings.shiftTwoStartHour && hourValue < shiftSettings.shiftThreeStartHour) {
    return shiftSettings.shiftTwoName;
  }
  return shiftSettings.shiftThreeName;
}

/**
 * getRemarksChoices
 * Ibinabalik ang kopya ng listahan ng Remarks para hindi mabago ang config ng tumatawag.
 * Ang index + 1 ay ang numerong pipiliin ng operator.
 */
export function getRemarksChoices() {
  return [...CONFIG.REMARKS_CHOICES];
}

/**
 * isManualRemarksChoice
 * True kapag ang napiling Remarks ay "Manual input" (hindi sensitibo sa laki ng letra),
 * ibig sabihin ang operator mismo ang magta-type ng Remarks.
 */
export function isManualRemarksChoice(choiceText) {
  return String(choiceText ?? "").trim().toLowerCase()
    === CONFIG.REMARKS_MANUAL_CHOICE_TEXT.toLowerCase();
}
