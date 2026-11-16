/**
 * FILE: js/newPcValidation.js
 * ANO ITO: Validation ng laman ng Add PC dialog (uri ng PC at IP).
 * GINAGAWA: Nagche-check lang. Walang DOM, walang UI, walang storage.
 * INPUT:   { type, ip }  (type = "mww" o "lead"; ip = text, puwedeng walang laman)
 * OUTPUT:  { isValid, field, messageKey, type, ip }
 *          field      = "type" o "ip" kapag may mali, null kapag ayos
 *          messageKey = susi sa CONFIG.MESSAGES (ang UI ang magpapakita ng text)
 *          ip         = naka-trim na IP (walang laman kung wala)
 * TANDAAN: Ang IP ay dumadaan sa sqlInjectionDetector (Rule 9 at 19).
 *          Opsyonal ang IP: puwedeng iwan na walang laman at i-type na lang sa row.
 */
import { CONFIG } from "./config.js";
import { detectSqlInjection } from "./sqlInjectionDetector.js";

/**
 * validateNewPc
 * 1) Dapat kilalang uri ng PC ang type (Object.hasOwn para hindi malusutan ng "constructor").
 * 2) Ang IP ay dapat pumasa sa SQL injection detector gamit ang whitelist ng networkPath.
 */
export function validateNewPc(newPcInput) {
  const type = newPcInput ? newPcInput.type : undefined;
  if (typeof type !== "string" || !Object.hasOwn(CONFIG.PC_TYPES, type)) {
    return { isValid: false, field: "type", messageKey: "unexpectedError", type: "", ip: "" };
  }

  const rawIp = newPcInput.ip;
  const ipText = typeof rawIp === "string" ? rawIp.trim() : "";
  const detection = detectSqlInjection(ipText, "networkPath");
  if (!detection.isSafe) {
    console.error("newPcValidation: hindi tinanggap ang IP (" + detection.reason + ")");
    return { isValid: false, field: "ip", messageKey: "inputNotAllowed", type: type, ip: "" };
  }

  return { isValid: true, field: null, messageKey: null, type: type, ip: ipText };
}