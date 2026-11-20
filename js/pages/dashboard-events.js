/*
 * FILE    : js/pages/dashboard-events.js
 * PURPOSE : Dashboard: live na petsa at oras, buwanang kalendaryo, at events (Add, Edit, Delete)
 * DEPENDS : js/core/config.js, js/core/security.js, js/core/events-store.js
 * VERSION : v3 | 2026-11-20 | bagong file
 */
(function () {
  'use strict';
  const root = window.BMWW;
  const CONFIG = root.CONFIG;
  const EVENTS = CONFIG.EVENTS;
  const SEL = CONFIG.SELECTOR.events;
  const TEXT = CONFIG.TEXT.events;
  const STATE = EVENTS.FILE_STATE;
  const store = root.eventsStore;
  const security = root.security;
  let elements = null;
  let state = null;
  let clockTimerId = null;

  // Dalawang digit ang numero (5 -> "05").
  function pad(value) {
    return String(value).padStart(2, '0');
  }

  // Date -> "YYYY-MM-DD" (oras ng PC, hindi UTC).
  function toDateKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  // "YYYY-MM-DD" -> Date (hatinggabi, oras ng PC).
  function fromDateKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Mahabang petsa, hal. "Friday, November 20, 2026".
  function formatLongDate(date) {
    return date.toLocaleDateString(EVENTS.LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Kinukuha ang lahat ng elemento ng seksyon; null kung wala sa pahina.
  function getElements() {
    const found = {};
    const keyList = Object.keys(SEL);
    for (let index = 0; index < keyList.length; index += 1) {
      const element = document.querySelector(SEL[keyList[index]]);
      if (!element) return null;
      found[keyList[index]] = element;
    }
    return found;
  }

  // Bilang ng event kada petsa.
  function countByDate(list) {
    const countMap = new Map();
    list.forEach((item) => countMap.set(item.date, (countMap.get(item.date) || 0) + 1));
    return countMap;
  }

  // Pinapakita ang mensahe ng resulta (success o error) sa labas ng form.
  function setMessage(message, isError) {
    elements.message.textContent = message;
    elements.message.classList.toggle(EVENTS.CLASS.error, Boolean(message) && isError === true);
    elements.message.classList.toggle(EVENTS.CLASS.success, Boolean(message) && isError !== true);
  }

  // Mensahe ng error sa loob ng form.
  function setFormStatus(message) {
    elements.formStatus.textContent = message;
    elements.formStatus.classList.toggle(EVENTS.CLASS.error, Boolean(message));
  }

  // ---- ORAS AT PETSA ----

  // Hinihinto ang orasan.
  function stopClock() {
    if (clockTimerId !== null) window.clearInterval(clockTimerId);
    clockTimerId = null;
  }

  // Ina-update ang oras at petsa; humihinto kapag wala na ang pahina.
  function updateClock() {
    if (!elements || !elements.clockTime.isConnected) { stopClock(); return; }
    const now = new Date();
    elements.clockTime.textContent = now.toLocaleTimeString(EVENTS.LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.clockDate.textContent = formatLongDate(now);
    const todayKey = toDateKey(now);
    if (todayKey !== state.todayKey) {
      state.todayKey = todayKey;
      renderCalendar();
    }
  }

  // Sinisimulan ang orasan (isa lang ang timer).
  function startClock() {
    stopClock();
    updateClock();
    clockTimerId = window.setInterval(updateClock, EVENTS.CLOCK_MS);
  }

  // ---- KALENDARYO ----

  // Pangalan ng araw ng linggo (Sun, Mon, ...) ayon sa WEEK_START.
  function renderWeekdays() {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(2023, 0, 1 + EVENTS.WEEK_START + index);
      const cell = document.createElement('span');
      cell.className = 'calendar-weekday';
      cell.textContent = day.toLocaleDateString(EVENTS.LOCALE, { weekday: 'short' });
      fragment.appendChild(cell);
    }
    elements.calWeekdays.replaceChildren(fragment);
  }

  // Ginuguhit ang buwan (42 na araw) na may marka sa petsang may event.
  function renderCalendar() {
    const first = new Date(state.viewYear, state.viewMonth, 1);
    elements.calTitle.textContent = first.toLocaleDateString(EVENTS.LOCALE, { month: 'long', year: 'numeric' });
    const countMap = countByDate(state.eventList);
    const offset = (first.getDay() - EVENTS.WEEK_START + 7) % 7;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < EVENTS.CELL_COUNT; index += 1) {
      const day = new Date(state.viewYear, state.viewMonth, 1 - offset + index);
      const key = toDateKey(day);
      const count = countMap.get(key) || 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.setAttribute(EVENTS.ATTR.date, key);
      button.textContent = String(day.getDate());
      button.classList.toggle(EVENTS.CLASS.outside, day.getMonth() !== state.viewMonth);
      button.classList.toggle(EVENTS.CLASS.today, key === state.todayKey);
      button.classList.toggle(EVENTS.CLASS.selected, key === state.selectedDate);
      button.classList.toggle(EVENTS.CLASS.hasEvent, count > 0);
      button.setAttribute('aria-pressed', key === state.selectedDate ? 'true' : 'false');
      button.setAttribute('aria-label', formatLongDate(day) + (count > 0 ? ', ' + count + TEXT.eventCount + (count > 1 ? 's' : '') : ''));
      fragment.appendChild(button);
    }
    elements.calGrid.replaceChildren(fragment);
  }

  // Lumilipat ng buwan (-1 o +1).
  function changeMonth(step) {
    const target = new Date(state.viewYear, state.viewMonth + step, 1);
    state.viewYear = target.getFullYear();
    state.viewMonth = target.getMonth();
    renderCalendar();
  }

  // Pumipili ng petsa at inililipat ang kalendaryo sa buwan nito.
  function selectDate(key) {
    const date = fromDateKey(key);
    state.selectedDate = key;
    state.viewYear = date.getFullYear();
    state.viewMonth = date.getMonth();
    closeForm();
    setMessage('', false);
    renderAll();
  }

  // ---- LISTAHAN NG EVENT SA NAPILING PETSA ----

  // Gumagawa ng isang button ng aksyon (Edit/Delete) para sa event.
  function createActionButton(label, ariaLabel, action, eventId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary event-action';
    button.textContent = label;
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute(EVENTS.ATTR.action, action);
    button.setAttribute(EVENTS.ATTR.id, eventId);
    return button;
  }

  // Gumagawa ng isang item ng event (textContent lang, iwas XSS).
  function createEventItem(item) {
    const row = document.createElement('li');
    row.className = 'event-item';
    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = item.time || TEXT.allDay;
    const body = document.createElement('div');
    body.className = 'event-body';
    const title = document.createElement('p');
    title.className = 'event-title';
    title.textContent = item.title;
    body.appendChild(title);
    if (item.note) {
      const note = document.createElement('p');
      note.className = 'card-note';
      note.textContent = item.note;
      body.appendChild(note);
    }
    const actions = document.createElement('div');
    actions.className = 'event-actions';
    actions.appendChild(createActionButton(TEXT.editButton, TEXT.editAria + item.title, EVENTS.ACTION.edit, item.id));
    actions.appendChild(createActionButton(TEXT.deleteButton, TEXT.deleteAria + item.title, EVENTS.ACTION.remove, item.id));
    row.append(time, body, actions);
    return row;
  }

  // Ginuguhit ang events ng napiling petsa.
  function renderDayList() {
    elements.selectedLabel.textContent = TEXT.selectedPrefix + formatLongDate(fromDateKey(state.selectedDate));
    const dayList = store.sortEvents(state.eventList.filter((item) => item.date === state.selectedDate));
    if (dayList.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'card-note event-empty';
      empty.textContent = TEXT.noEvents;
      elements.list.replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    dayList.forEach((item) => fragment.appendChild(createEventItem(item)));
    elements.list.replaceChildren(fragment);
  }

  // Sinasabi kung saan naka-save ang events; lalabas ang button kapag kailangan ng permission.
  function renderStorageNote() {
    const noteMap = {
      [STATE.ok]: TEXT.stateOk,
      [STATE.noFolder]: TEXT.stateNoFolder,
      [STATE.noPermission]: TEXT.stateNoPermission,
      [STATE.unsupported]: TEXT.stateUnsupported,
      [STATE.error]: TEXT.stateError
    };
    elements.storageNote.textContent = noteMap[state.fileState] || TEXT.stateNoFolder;
    elements.grantButton.hidden = state.fileState !== STATE.noPermission;
  }

  // Ginuguhit muli ang kalendaryo, listahan at tala.
  function renderAll() {
    renderCalendar();
    renderDayList();
    renderStorageNote();
  }

  // ---- FORM (ADD / EDIT) ----

  // Binubuksan ang form para sa bago (walang item) o i-edit na event.
  function openForm(item) {
    state.editingId = item ? item.id : null;
    elements.formTitle.textContent = item ? TEXT.formEdit : TEXT.formAdd;
    elements.titleInput.value = item ? item.title : '';
    elements.dateInput.value = item ? item.date : state.selectedDate;
    elements.timeInput.value = item ? item.time : '';
    elements.noteInput.value = item ? item.note : '';
    setFormStatus('');
    elements.form.hidden = false;
    elements.addButton.hidden = true;
    elements.titleInput.focus();
  }

  // Isinasara ang form.
  function closeForm() {
    state.editingId = null;
    elements.form.hidden = true;
    elements.addButton.hidden = false;
    setFormStatus('');
  }

  // Sine-save ang listahan sa store at ina-update ang state.
  async function persist(nextList) {
    const result = await store.saveEvents(nextList);
    state.eventList = result.events;
    state.fileState = result.fileState;
  }

  // Tinitingnan ang laman ng form; ibinabalik ang event o null (may mensahe ng error).
  function readForm() {
    const title = security.sanitizeInput(elements.titleInput.value, EVENTS.TITLE_MAX);
    const date = elements.dateInput.value;
    const time = elements.timeInput.value;
    const note = security.sanitizeInput(elements.noteInput.value, EVENTS.NOTE_MAX);
    if (!title) { setFormStatus(TEXT.titleRequired); return null; }
    if (!store.isValidDateText(date)) { setFormStatus(TEXT.dateInvalid); return null; }
    if (!store.isValidTimeText(time)) { setFormStatus(TEXT.timeInvalid); return null; }
    if (state.editingId === null && state.eventList.length >= EVENTS.MAX_EVENTS) { setFormStatus(TEXT.tooMany); return null; }
    return { id: state.editingId || store.createId(), title, date, time, note, pending: true };
  }

  // Pag-submit ng form: validate, save, ipakita.
  async function handleSubmit(domEvent) {
    domEvent.preventDefault();
    if (state.isBusy) return;
    const savedEvent = readForm();
    if (!savedEvent) return;
    const nextList = state.editingId === null
      ? [...state.eventList, savedEvent]
      : state.eventList.map((item) => (item.id === savedEvent.id ? savedEvent : item));
    state.isBusy = true;
    elements.saveButton.disabled = true;
    try {
      await persist(nextList);
      selectDate(savedEvent.date);
      setMessage(TEXT.saved, false);
    } catch (error) {
      setFormStatus(TEXT.saveError);
    } finally {
      state.isBusy = false;
      elements.saveButton.disabled = false;
    }
  }

  // Pindot sa Edit o Delete ng isang event.
  async function handleListClick(domEvent) {
    const button = domEvent.target instanceof Element ? domEvent.target.closest(CONFIG.SELECTOR.eventAction) : null;
    if (!button || state.isBusy) return;
    const eventId = button.getAttribute(EVENTS.ATTR.id);
    const target = state.eventList.find((item) => item.id === eventId);
    if (!target) return;
    if (button.getAttribute(EVENTS.ATTR.action) === EVENTS.ACTION.edit) { openForm(target); return; }
    if (!window.confirm(TEXT.confirmDelete)) return;
    state.isBusy = true;
    try {
      await persist(state.eventList.filter((item) => item.id !== eventId));
      closeForm();
      renderAll();
      setMessage(TEXT.deleted, false);
    } catch (error) {
      setMessage(TEXT.saveError, true);
    } finally {
      state.isBusy = false;
    }
  }

  // Pindot sa petsa ng kalendaryo.
  function handleGridClick(domEvent) {
    const button = domEvent.target instanceof Element ? domEvent.target.closest(CONFIG.SELECTOR.eventDay) : null;
    if (button) selectDate(button.getAttribute(EVENTS.ATTR.date));
  }

  // Pindot sa "Ngayon": balik sa kasalukuyang petsa.
  function handleToday() {
    selectDate(toDateKey(new Date()));
  }

  // Pindot sa "Payagan ang folder": humihingi ng permission at binabasa ulit ang file.
  async function handleGrant() {
    elements.grantButton.disabled = true;
    try {
      const result = await store.loadEvents(true);
      if (!elements.calGrid.isConnected) return;
      state.eventList = result.events;
      state.fileState = result.fileState;
      renderAll();
    } finally {
      elements.grantButton.disabled = false;
    }
  }

  // Inilalagay ang mga listener ng seksyon.
  function bindEvents() {
    elements.calPrev.addEventListener('click', () => changeMonth(-1));
    elements.calNext.addEventListener('click', () => changeMonth(1));
    elements.calToday.addEventListener('click', handleToday);
    elements.calGrid.addEventListener('click', handleGridClick);
    elements.list.addEventListener('click', handleListClick);
    elements.addButton.addEventListener('click', () => openForm(null));
    elements.cancelButton.addEventListener('click', closeForm);
    elements.form.addEventListener('submit', handleSubmit);
    elements.grantButton.addEventListener('click', handleGrant);
  }

  // Simula: tinatawag ng dashboard.js kapag na-load ang page.
  async function init() {
    elements = getElements();
    if (!elements) return;
    const today = new Date();
    state = {
      eventList: store.readLocalEvents(),
      fileState: STATE.noFolder,
      todayKey: toDateKey(today),
      selectedDate: toDateKey(today),
      viewYear: today.getFullYear(),
      viewMonth: today.getMonth(),
      editingId: null,
      isBusy: false
    };
    elements.titleInput.maxLength = EVENTS.TITLE_MAX;
    elements.noteInput.maxLength = EVENTS.NOTE_MAX;
    elements.form.hidden = true;
    renderWeekdays();
    bindEvents();
    startClock();
    renderAll();
    const grid = elements.calGrid;
    try {
      const result = await store.loadEvents(false);
      if (!grid.isConnected) return;
      state.eventList = result.events;
      state.fileState = result.fileState;
    } catch (error) {
      if (!grid.isConnected) return;
      setMessage(TEXT.loadError, true);
    }
    renderAll();
  }

  root.dashboardEvents = Object.freeze({ init });
})();
