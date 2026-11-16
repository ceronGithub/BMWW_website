/**
 * FILE: js/main.js
 * PURPOSE: Shared logic — toast, PC role switching, sample data buttons, global guards.
 * Exposes window.lotTracking so mwwView.js and leadView.js can plug in.
 * DESIGN PREVIEW: the role switch lets you see both Excel screens in one file.
 * In the real build, the role comes from the "This PC is" setting of the machine.
 */
(function () {
  const lotTracking = (window.lotTracking = { currentRole: "mww" });

  // Block the context menu everywhere (protocol standard, applied from day 1)
  document.addEventListener("contextmenu", function (event) { event.preventDefault(); });

  /**
   * showToast
   * Top-center message that dismisses itself after 2 seconds.
   * type: "success" | "error" | "warning"
   */
  lotTracking.showToast = function (message, type) {
    const toastStack = document.getElementById("toastStack");
    const toastItem = document.createElement("div");
    toastItem.className = "toastItem is" + type.charAt(0).toUpperCase() + type.slice(1);
    toastItem.textContent = message;
    toastStack.appendChild(toastItem);

    setTimeout(function () { toastItem.classList.add("isLeaving"); }, 1700);
    setTimeout(function () { toastItem.remove(); }, 2000);
  };

  /**
   * setRole
   * Shows the MWW screen or the LEAD screen and updates the role button highlight.
   */
  lotTracking.setRole = function (roleName) {
    lotTracking.currentRole = roleName;
    const isMww = roleName === "mww";

    document.getElementById("mwwView").classList.toggle("isHidden", !isMww);
    document.getElementById("leadView").classList.toggle("isHidden", isMww);

    document.querySelectorAll(".roleButton").forEach(function (button) {
      button.classList.toggle("isActive", button.dataset.role === roleName);
    });

    if (!isMww) {
      document.getElementById("leadRoleText").textContent = roleName === "lead1" ? "LEAD PC1" : "LEAD PC2";
    }
  };

  document.querySelectorAll(".roleButton").forEach(function (button) {
    button.addEventListener("click", function () { lotTracking.setRole(button.dataset.role); });
  });

  // Sample data buttons only exist for design review; each view registers its own loader
  document.getElementById("loadSampleButton").addEventListener("click", function () {
    lotTracking.loadMwwSample();
    lotTracking.loadLeadSample();
    lotTracking.showToast("✓ Sample data loaded.", "success");
  });
  document.getElementById("clearSampleButton").addEventListener("click", function () {
    lotTracking.clearMwwSample();
    lotTracking.clearLeadSample();
    lotTracking.showToast("✓ Sample data cleared.", "success");
  });
})();
