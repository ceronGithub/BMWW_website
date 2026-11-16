/**
 * FILE: tests/loteLogic.test.mjs
 * ANO ITO: Node test para sa js/loteLogic.js (task 6). Takbo: node --test tests/
 */
import test from "node:test";
import assert from "node:assert/strict";
import { buildLotUnitName, getShiftName, getRemarksChoices, isManualRemarksChoice } from "../js/loteLogic.js";

test("buildLotUnitName: Wafer + Layer + Blk", () => {
  assert.equal(buildLotUnitName("4A25C", "20", "A"), "4A25C20A");
  assert.equal(buildLotUnitName("4a25c", "05", "b"), "4A25C05B");
  assert.equal(buildLotUnitName(" 4A25C ", " 20 ", " A "), "4A25C20A");
});

test("buildLotUnitName: blangko kapag may kulang", () => {
  assert.equal(buildLotUnitName("", "20", "A"), "");
  assert.equal(buildLotUnitName("4A25C", "", "A"), "");
  assert.equal(buildLotUnitName("4A25C", "20", undefined), "");
});

test("getShiftName: hangganan ng bawat shift", () => {
  const at = (hourValue, minuteValue) => new Date(2026, 10, 17, hourValue, minuteValue, 0);
  assert.equal(getShiftName(at(6, 0)), "Shift 1");
  assert.equal(getShiftName(at(13, 59)), "Shift 1");
  assert.equal(getShiftName(at(14, 0)), "Shift 2");
  assert.equal(getShiftName(at(21, 59)), "Shift 2");
  assert.equal(getShiftName(at(22, 0)), "Shift 3");
  assert.equal(getShiftName(at(0, 0)), "Shift 3");
  assert.equal(getShiftName(at(5, 59)), "Shift 3");
});

test("getShiftName: blangko kapag hindi valid ang Date", () => {
  assert.equal(getShiftName(new Date("hindi-date")), "");
  assert.equal(getShiftName(null), "");
});

test("getRemarksChoices: kapareho ng macro at kopya lang", () => {
  const expectedChoices = ["1st Meas.", "2nd Meas.", "1st Re-lap", "2nd Re-lap",
    "1st Re-measure", "2nd Re-measure", "Final Meas.", "Manual input"];
  assert.deepEqual(getRemarksChoices(), expectedChoices);
  getRemarksChoices().push("sira");
  assert.deepEqual(getRemarksChoices(), expectedChoices);
});

test("isManualRemarksChoice", () => {
  assert.equal(isManualRemarksChoice("Manual input"), true);
  assert.equal(isManualRemarksChoice(" manual INPUT "), true);
  assert.equal(isManualRemarksChoice("Final Meas."), false);
});
