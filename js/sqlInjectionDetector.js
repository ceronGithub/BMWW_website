/**
 * FILE: js/sqlInjectionDetector.js
 * ANO ITO: Pure function na nagche-check kung may hinala ng SQL injection ang text.
 * GINAGAWA: Nagche-check lang. Walang DOM, walang UI, walang storage.
 * INPUT:   text (string), fieldType (key ng CONFIG.FIELD_WHITELISTS, hal. "barcode")
 * OUTPUT:  { isSafe: boolean, reason: string }
 *          reason = "ok" | "emptyOrNotText" | "patternMatched" | "characterNotAllowed"
 *          Ang reason ay para sa console.error lang. Hindi ito ipinapakita sa user.
 * TANDAAN: Ito ay unang harang lang sa frontend. Ang tunay na proteksyon ay ang
 *          parameterized query sa server (Rule 19).
 */
import { CONFIG } from "./config.js";

const MAX_DECODE_ROUNDS = 3;

/**
 * decodeUrlEncoding
 * Ide-decode ang %27 at iba pa. Inuulit hanggang 3 beses para mahuli ang
 * double-encoding (%2527). Kapag sira ang encoding (hal. "%E0%A4%A"), ititigil
 * at ibabalik ang huling magandang bersyon.
 */
function decodeUrlEncoding(text) {
  let current = text;
  for (let round = 0; round < MAX_DECODE_ROUNDS; round += 1) {
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch (error) {
      return current;
    }
    if (decoded === current) {
      return current;
    }
    current = decoded;
  }
  return current;
}

/**
 * normalizeForWhitelist
 * Trim at URL-decode lang. Hindi ginagawang lowercase, para tama ang whitelist.
 */
function normalizeForWhitelist(text) {
  return decodeUrlEncoding(String(text).trim());
}

/**
 * normalizeForPatterns
 * Trim, URL-decode, lowercase, at gawing isang space ang paulit-ulit na
 * space/tab/newline. Para hindi malusutan ng "SeLeCt" o "%27 OR 1=1".
 */
function normalizeForPatterns(text) {
  return normalizeForWhitelist(text).toLowerCase().replace(/\s+/g, " ");
}

/**
 * detectSqlInjection
 * 1) Pattern check sa normalized na text.
 * 2) Whitelist check ng characters para sa uri ng field (kung may nakalista).
 * Ang walang laman na text ay ligtas; ang "required" check ay trabaho ng validation.
 */
export function detectSqlInjection(text, fieldType) {
  if (text === null || text === undefined || text === "") {
    return { isSafe: true, reason: "emptyOrNotText" };
  }

  const patternText = normalizeForPatterns(text);
  const matchedPattern = CONFIG.SQL_INJECTION_PATTERNS.some(function (pattern) {
    return pattern.test(patternText);
  });
  if (matchedPattern) {
    return { isSafe: false, reason: "patternMatched" };
  }

  const whitelist = CONFIG.FIELD_WHITELISTS[fieldType];
  if (whitelist && !whitelist.test(normalizeForWhitelist(text))) {
    return { isSafe: false, reason: "characterNotAllowed" };
  }

  return { isSafe: true, reason: "ok" };
}