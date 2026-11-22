/*
 * FILE    : js/core/lot-beep.js
 * PURPOSE : Maikling beep (Web Audio) kapag natapos ang lote (END MEASUREMENT)
 * DEPENDS : js/core/lot-config.js
 * VERSION : v1 | 2026-11-22 | bagong file (Yugto 1)
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const BEEP = root.lotConfig.BEEP;
  let audioContext = null;

  // Kinukuha ang AudioContext (isang beses lang ginagawa). Null kung walang suporta ang browser.
  function getAudioContext() {
    if (audioContext) return audioContext;
    const ContextClass = window.AudioContext || window.webkitAudioContext;
    if (!ContextClass) return null;
    audioContext = new ContextClass();
    return audioContext;
  }

  // Tumutunog ng isang beep. Tahimik kung hindi kaya (walang audio o hinarang ng browser); hindi dapat tumigil ang page.
  function playBeep() {
    if (!BEEP.ENABLED) return;
    try {
      const context = getAudioContext();
      if (!context) return;
      if (context.state === 'suspended') {
        const resumed = context.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
      }
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = BEEP.WAVE;
      oscillator.frequency.value = BEEP.FREQUENCY_HZ;
      gain.gain.value = BEEP.VOLUME;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + BEEP.DURATION_MS / 1000);
    } catch (error) {
      // Walang tunog: hindi ito hadlang sa pag-END ng lote.
    }
  }

  root.lotBeep = Object.freeze({ playBeep });
})();
