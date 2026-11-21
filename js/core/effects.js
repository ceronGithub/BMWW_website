/*
 * FILE    : js/core/effects.js
 * PURPOSE : Maliliit na effects: spotlight sa card, ripple sa button, sliding indicator sa sidebar
 * DEPENDS : js/core/config.js (REDUCED_MOTION_QUERY, SELECTOR.sidebar), css/theme.css
 * VERSION : v7.9 | 2026-11-21 | fix: ina-update na ang indicator ng sidebar kapag may link na itinago o ibinalik (hidden ng li, hal. paglipat sa Lead PC); hindi na umuulit ang update kapag walang nagbago
 * VERSION : v4 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;

  // Mga constant ng effects (nasa file na ito para hindi galawin ang config.js nang walang permission).
  const EFFECTS = Object.freeze({
    CARD: '.card',
    SPOT_X: '--mx',
    SPOT_Y: '--my',
    BUTTON: '.btn',
    RIPPLE_CLASS: 'ripple',
    SIDEBAR_LIST: '.sidebar-list',
    LINK: '.sidebar-link',
    ACTIVE_CLASS: 'is-active',
    INDICATOR_CLASS: 'sidebar-indicator',
    READY_CLASS: 'has-indicator',
    OBSERVED_ATTRIBUTES: ['class', 'hidden']
  });
  let frameId = 0;
  let indicatorFrameId = 0;

  // Naka-on ba ang reduced motion ng PC.
  function isReducedMotion() {
    return window.matchMedia(CONFIG.REDUCED_MOTION_QUERY).matches;
  }

  // Sinusundan ng spotlight ang cursor sa loob ng card.
  function handlePointerMove(event) {
    if (isReducedMotion() || !(event.target instanceof Element)) return;
    const card = event.target.closest(EFFECTS.CARD);
    if (!card) return;
    const clientX = event.clientX;
    const clientY = event.clientY;
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      card.style.setProperty(EFFECTS.SPOT_X, (clientX - box.left) + 'px');
      card.style.setProperty(EFFECTS.SPOT_Y, (clientY - box.top) + 'px');
    });
  }

  // Ripple sa pindot ng button.
  function handlePointerDown(event) {
    if (isReducedMotion() || !(event.target instanceof Element)) return;
    const button = event.target.closest(EFFECTS.BUTTON);
    if (!button || button.disabled) return;
    const box = button.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = EFFECTS.RIPPLE_CLASS;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - box.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - box.top - size / 2) + 'px';
    ripple.addEventListener('animationend', () => ripple.remove());
    button.appendChild(ripple);
  }

  // Inilalagay ang itim na indicator sa active na link ng sidebar (dumudulas kapag nagbago).
  function updateIndicator() {
    const list = document.querySelector(EFFECTS.SIDEBAR_LIST);
    if (!list) return;
    const active = list.querySelector(EFFECTS.LINK + '.' + EFFECTS.ACTIVE_CLASS);
    let indicator = list.querySelector('.' + EFFECTS.INDICATOR_CLASS);
    if (!active) {
      if (indicator && !indicator.hidden) indicator.hidden = true;
      return;
    }
    const isNew = !indicator;
    if (isNew) {
      indicator = document.createElement('span');
      indicator.className = EFFECTS.INDICATOR_CLASS;
      indicator.setAttribute('aria-hidden', 'true');
      indicator.style.transition = 'none';
      list.prepend(indicator);
    }
    if (indicator.hidden) indicator.hidden = false;
    indicator.style.height = active.offsetHeight + 'px';
    indicator.style.transform = 'translateY(' + active.offsetTop + 'px)';
    if (isNew) {
      indicator.getBoundingClientRect();
      indicator.style.transition = '';
      list.classList.add(EFFECTS.READY_CLASS);
    }
  }

  // Pinagsasama ang sunud-sunod na pagbabago sa isang update.
  function scheduleIndicator() {
    if (indicatorFrameId) window.cancelAnimationFrame(indicatorFrameId);
    indicatorFrameId = window.requestAnimationFrame(updateIndicator);
  }

  // Simula ng effects.
  function initEffects() {
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    const sidebar = document.querySelector(CONFIG.SELECTOR.sidebar);
    if (sidebar) {
      new MutationObserver(scheduleIndicator).observe(sidebar, { childList: true, subtree: true, attributes: true, attributeFilter: EFFECTS.OBSERVED_ATTRIBUTES });
    }
    window.addEventListener('resize', scheduleIndicator);
    scheduleIndicator();
  }

  initEffects();
})();
