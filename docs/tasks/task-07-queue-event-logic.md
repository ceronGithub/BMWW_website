# task-07 — Pure logic: gawa ng queue event line at pangalan ng .q file
SPEC SECTION: macro: modQueueEventBuilder, modQueueNameBuilder, modQueueSettings, modQueueStamp
TASKPLAN PHASE: Phase 4 — MWW PC -> Queue
DEPENDENCY: task-6 (LOT Unit, Shift)
NEEDS: task-6
SETUP: none
FILES TO TOUCH: js/queueEvent.js (new), js/config.js (QUEUE settings), tests/queueEvent.test.mjs (new)
DONE WHEN:
- buildQueueLine(fieldValues) -> mga field na pinaghihiwalay ng TAB, tinatanggal ang TAB/bagong linya sa loob ng field, nagtatapos sa CRLF
- buildQueueFileName(eventName, machineName, barcode, detail, now, sequence) -> "20261115_205959_001_MWW 1_BMW11_UNIT_4A25C20A" (yyyymmdd_hhnnss_seq3 + machine + barcode + event + detail); walang extension
- Ang sequence ay ipinapasa (pure), umuulit mula 1 pagkatapos ng 999; ang .q extension ay galing sa config
- Mga field ng event: START = EVENT, BARCODE, STAMP, OPERATOR, MACHINE, SHIFT; UNIT = EVENT, BARCODE, STAMP, LOT UNIT, WAFER, BLK, LAYER, PATH, DETECTED STAMP, OPERATOR; FINISH = ayon sa modQueueEventApplier (basahin muna)
- Pure functions lang: walang DOM at walang storage; may node test na pumapasa
