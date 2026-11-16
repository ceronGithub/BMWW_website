# task-04 — Paths settings panel (Sheet1 paths, pasteable at naka-save)
SPEC SECTION: Sheet1 sa BM-ANALYZER.xlsm ("YUNG MGA URL DAPAT NAKA LABAS. AT I PASTE NALANG NO NEED I OPEN YUNG CODE.")
TASKPLAN PHASE: Phase 3 — Paths
DEPENDENCY: task-3 [DONE]
NEEDS: none
SETUP: none
FILES TO TOUCH: js/config.js (default values at label lang), js/Storage.js, js/pathSettings.js (new), js/pathSettingsView.js (new), index.html, css/pathSettings.css (new), js/main.js
DONE WHEN:
- May panel na nagpapakita ng: SERVER, bawat LEAD PC / MWW PC IP, Desktop path, \\IP\C$ path, at Calib path ng MWW
- Pwedeng i-paste ang bawat path sa input; naka-save at nandoon pa pagka-refresh
- Dumadaan ang bawat input sa sqlInjectionDetector at sa networkPath whitelist
- Hindi pa ginagamit ng ibang screen ang mga value (iyon ay task-5)
