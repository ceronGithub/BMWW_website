# task-05 — Gamitin ang naka-save na Server/Database path (alisin ang hard-coded)
SPEC SECTION: Sheet1 ("YUNG MGA URL DAPAT NAKA LABAS"); macro: modMonitoringPaths, modLeadPcPathBuilder
TASKPLAN PHASE: Phase 3 — Paths
DEPENDENCY: task-4 [DONE]
NEEDS: task-4
SETUP: none
FILES TO TOUCH: js/mwwPanel.js, js/leadView.js, js/main.js, js/config.js (alisin ang hard-coded kung hindi na kailangan)
DONE WHEN:
- Ang Server Path at Database Path sa MWW panel ay galing sa PATH SETTINGS (getSharedPath), hindi sa hard-coded na default
- Ang notice sa LEAD screen ("Wala pang monitoring file...") ay gumagamit ng naka-save na DATABASE PATH
- Kapag binago ang path sa PATH SETTINGS, nagbabago ang MWW panel at LEAD notice nang hindi nire-refresh ang page
- Walang natitirang "C:\\Users\\Ceron Calsena" sa js/leadView.js
