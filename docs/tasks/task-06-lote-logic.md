# task-06 — Pure logic: LOT Unit, Shift, Remarks choices
SPEC SECTION: macro: modResultNameParser, modShiftResolver, modMacroConfig (shift / remarks), modResultUnitCollector
TASKPLAN PHASE: Phase 4 — MWW PC -> Queue
DEPENDENCY: none
NEEDS: none
SETUP: none
FILES TO TOUCH: js/loteLogic.js (new), js/config.js (shift hours/names at remarks list lang)
DONE WHEN:
- buildLotUnitName(wafer, layerNo, blk) -> "4A25C20A" (Wafer + Layer + Blk, gaya ng macro)
- getShiftName(date) -> "Shift 1" (06:00-13:59), "Shift 2" (14:00-21:59), "Shift 3" (22:00-05:59)
- Ang Remarks choices ay: 1st Meas., 2nd Meas., 1st Re-lap, 2nd Re-lap, 1st Re-measure, 2nd Re-measure, Final Meas., Manual input
- Pure functions lang: walang DOM at walang storage; may node test na pumapasa
