# taskPlan.md — BMWW_website (BM Analyzer, LOT_TRACKING)
**NEXT UP:** task-7 | file: docs/tasks/task-07-queue-event-logic.md | needs: task-6
**OPEN FINDINGS:** 7 — see docs/openFindings.md

SPEC SOURCE: ang macro sa BM-ANALYZER.xlsm (modMacroConfig, modMonitoring*, modQueue*, modSend*) + mga tala sa Sheet1.
SAFE: PC ROLE = MWW PC -> hindi diretsong sinusulatan ang monitoring file; nagpapadala ng QUEUE event
(START / UNIT / FINISH) sa Queue folder ng LEAD PC. Ang LEAD PC ang nagbabasa ng queue at sumusulat ng xlsx.

## Phase 1 — Tapos na (reconciled mula sa overview change log; nakita ang code sa main.js / mwwPanel.js)
- [DONE] task-1 — Dynamic PC tabs, Add PC, PC ROLE, IP rows (reconciled — verify against Layer-3 audit)
- [DONE] task-2 — Enter flow, Start Date/Time, scan ng Calib/CLO1A/CLO1A1 papunta sa RESULT (reconciled — verify against Layer-3 audit)

## Phase 2 — Housekeeping
- [DONE] task-3 — Inalis ang lumang duplicate na js/RegistryLogic.js

## Phase 3 — Paths (Sheet1)
- [DONE] task-4 — Paths settings panel: lahat ng path sa Sheet1 bilang input na pwedeng i-paste, naka-save
- [DONE] task-5 — Gamitin ang naka-save na Server/Database/Queue path sa MWW panel at LEAD notice (alisin ang hard-coded)

## Phase 4 — MWW PC -> Queue (macro: modQueue*, modShiftResolver, modRemarksFlow)
- [DONE] task-6 — Pure logic: LOT Unit (Wafer+Layer+Blk, hal. 4A25C20A), Shift (6/14/22), Remarks choices
- [ ] task-7 — Pure logic: gawa ng queue event line (START/UNIT/FINISH, TAB, yyyymmdd_hhnnss_seq.q)
- [ ] task-8 — I-link ang Queue folder at ipadala ang START kapag nagsimula ang lote
- [ ] task-9 — Ipadala ang UNIT kada bagong LOT Unit sa RESULT, at itanong ang Remarks
- [ ] task-10 — Ipadala ang FINISH kapag NEW LOTE o bagong Barcode

## Phase 5 — LEAD PC (macro: modQueueFileReader, modMonitoring*)
- [ ] task-11 — Basahin ang Queue (.q), .bad kapag sira, burahin kapag naproseso na
- [ ] task-12 — Sulatan ang ddmmyyyy_MONITORING.xlsx (16 column, Status ONGOING/DONE, Lot Duration, block merge)
- [ ] task-13 — LEAD screen: totoong data mula sa monitoring file kapalit ng sample

## Phase 6 — Send (macro: modSend*)
- [ ] task-14 — Send to Server (manual na button; file at folder; Sent Status / Sent Time)
- [ ] task-15 — Send to PC (under construction din sa macro)

## Phase 7 — Mga tala sa Sheet1
- [ ] task-16 — Slider count sa monitoring: 90 = Long Bar, 70 = Middle Bar
- [ ] task-17 — File search ayon sa date created (hindi buong Calib ang i-se-search)
- [ ] task-18 — MENU: Data Analysis at Range Data Analysis (kailangan ng detalye; "AYUSIN" pa sa macro)
