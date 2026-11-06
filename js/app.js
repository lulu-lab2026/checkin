/**
 * Check.In — application controller
 * ------------------------------------------------------------
 * Sections:
 *   1. Helpers & DOM references
 *   2. Workday actions (start, check-in, check-out, end)
 *   3. Inicio view rendering
 *   4. Registros view rendering (calendar + day detail)
 *   5. Feedback UI (toasts, ripple, modal)
 *   6. Router (hash based SPA)
 *   7. PWA (service worker + install prompt)
 *   8. Boot
 */
(function () {
  'use strict';

  /* ==========================================================
     1. HELPERS & DOM REFERENCES
     ========================================================== */

  var $ = function (sel) { return document.querySelector(sel); };
  var t = function (key, params) { return I18n.t(key, params); };

  var el = {
    greeting: $('#greeting'),
    todayDate: $('#todayDate'),
    clock: $('#clock'),
    statusChip: $('#statusChip'),
    statusText: $('#statusText'),
    workedLive: $('#workedLive'),
    heroNote: $('#heroNote'),
    btnStart: $('#btnStart'),
    btnIn: $('#btnIn'),
    btnOut: $('#btnOut'),
    btnEnd: $('#btnEnd'),
    logList: $('#logList'),
    logEmpty: $('#logEmpty'),
    logCount: $('#logCount'),
    totalBar: $('#totalBar'),
    totalValue: $('#totalValue'),
    calTitle: $('#calTitle'),
    calWeekdays: $('#calWeekdays'),
    calGrid: $('#calGrid'),
    calPrev: $('#calPrev'),
    calNext: $('#calNext'),
    calToday: $('#calToday'),
    statTotal: $('#statTotal'),
    statDays: $('#statDays'),
    statAvg: $('#statAvg'),
    detailCard: $('#detailCard'),
    detailTitle: $('#detailTitle'),
    detailBody: $('#detailBody'),
    deleteDayBtn: $('#deleteDayBtn'),
    langSelect: $('#langSelect'),
    installBtn: $('#installBtn'),
    toastRegion: $('#toastRegion'),
    modal: $('#modal')
  };

  var ICONS = { start: 'i-briefcase', in: 'i-login', out: 'i-logout', end: 'i-flag' };

  var today = new Date();
  var state = {
    route: 'inicio',
    calYear: today.getFullYear(),
    calMonth: today.getMonth(),
    selectedKey: Time.dateKey(today),
    lastDateKey: Time.dateKey(today),
    highlightLast: false,   // animate newest log row after an action
    highlightTotal: false   // animate total after "Fin de Trabajo"
  };

  function icon(id) { return '<svg class="icon" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  function lastEvent(wd) { return wd.events[wd.events.length - 1] || null; }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ==========================================================
     2. WORKDAY ACTIONS
     Each returns { ok: boolean } and shows its own toast.
     ========================================================== */

  var Actions = {
    /** Inicio de Trabajo — opens a new workday for today. */
    start: function () {
      if (Store.findActive()) return fail('toast.alreadyActive');
      var now = Date.now();
      var wd = { id: uid(), start: now, end: null, events: [], totalMs: 0 };
      if (!Store.addWorkday(Time.dateKey(new Date(now)), wd)) return fail('toast.storageError', 'error');
      return done('toast.started', { time: Time.time(now) });
    },

    /** Check-In — starts a worked segment. */
    checkIn: function () {
      var active = Store.findActive();
      if (!active) return fail('toast.noDay');
      var last = lastEvent(active.wd);
      if (last && last.type === 'in') return fail('toast.alreadyIn');
      var now = Date.now();
      active.wd.events.push({ type: 'in', ts: now });
      if (!Store.save()) return fail('toast.storageError', 'error');
      return done('toast.checkIn', { time: Time.time(now) });
    },

    /** Check-Out — closes the current worked segment. */
    checkOut: function () {
      var active = Store.findActive();
      if (!active) return fail('toast.noDay');
      var last = lastEvent(active.wd);
      if (!last || last.type !== 'in') return fail('toast.notIn');
      var now = Date.now();
      active.wd.events.push({ type: 'out', ts: now });
      if (!Store.save()) return fail('toast.storageError', 'error');
      return done('toast.checkOut', { time: Time.time(now) });
    },

    /** Fin de Trabajo — closes the workday and calculates the total. */
    end: function () {
      var active = Store.findActive();
      if (!active) return fail('toast.noDay');
      var now = Date.now();
      var wd = active.wd;
      var autoClosed = false;

      // A Check-In without its Check-Out is closed at the end time.
      var last = lastEvent(wd);
      if (last && last.type === 'in') {
        wd.events.push({ type: 'out', ts: now, auto: true });
        autoClosed = true;
      }
      wd.end = now;
      wd.totalMs = Time.workedMs(wd);
      if (!Store.save()) return fail('toast.storageError', 'error');

      state.highlightTotal = true;
      var result = done('toast.ended', { total: Time.formatHM(wd.totalMs) });
      if (autoClosed) setTimeout(function () { toast(t('toast.autoClosed'), 'info'); }, 350);
      return result;
    }
  };

  function done(key, params) {
    state.highlightLast = true;
    toast(t(key, params), 'success');
    vibrate(15);
    return { ok: true };
  }

  function fail(key, type) {
    toast(t(key), type || 'warn');
    vibrate([10, 40, 10]);
    return { ok: false };
  }

  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
  }

  /* ==========================================================
     3. INICIO VIEW
     ========================================================== */

  /** Workdays shown on Inicio: today's, plus an open one from a previous day. */
  function homeWorkdays() {
    var key = Time.dateKey();
    var list = Store.getDay(key).map(function (wd) { return { key: key, wd: wd }; });
    var active = Store.findActive();
    if (active && active.key !== key) list.unshift(active);
    return list;
  }

  function currentStatus() {
    var active = Store.findActive();
    if (active) {
      var last = lastEvent(active.wd);
      if (!last) return 'ready';
      return last.type === 'in' ? 'working' : 'paused';
    }
    var finishedToday = Store.getDay(Time.dateKey()).some(function (wd) { return wd.end; });
    return finishedToday ? 'finished' : 'idle';
  }

  function renderHome() {
    var now = new Date();
    var hour = now.getHours();
    el.greeting.textContent = t(hour < 12 ? 'greeting.morning' : hour < 20 ? 'greeting.afternoon' : 'greeting.evening');
    el.todayDate.textContent = Time.longDate(now);

    // Status chip
    var status = currentStatus();
    el.statusChip.dataset.status = status;
    el.statusText.textContent = t('status.' + status);

    // Enable only the actions that make sense right now
    var active = Store.findActive();
    el.btnStart.disabled = !!active;
    el.btnIn.disabled = !active || status === 'working';
    el.btnOut.disabled = status !== 'working';
    el.btnEnd.disabled = !active;

    // Note for a workday left open on a previous date
    if (active && active.key !== Time.dateKey()) {
      el.heroNote.hidden = false;
      el.heroNote.textContent = t('home.openSince', { date: Time.shortDate(Time.parseKey(active.key)) });
    } else {
      el.heroNote.hidden = true;
    }

    renderLog();
    tick();
  }

  /** Builds the chronological list of rows for one workday. */
  function workdayRows(wd) {
    var rows = [{ type: 'start', ts: wd.start }];
    wd.events.forEach(function (ev) { rows.push({ type: ev.type, ts: ev.ts, auto: ev.auto }); });
    if (wd.end) rows.push({ type: 'end', ts: wd.end });
    return rows;
  }

  function eventLabel(row) {
    return row.auto ? t('events.autoOut') : t('events.' + row.type);
  }

  function renderLog() {
    var items = homeWorkdays();
    var multiple = items.length > 1;
    var html = '';
    var count = 0;

    items.forEach(function (item, idx) {
      if (multiple) {
        html += '<li class="tl-group">' + t('log.workday', { n: idx + 1 }) +
          (item.wd.end ? '' : ' · <span class="tl-live">' + t('log.inProgress') + '</span>') + '</li>';
      }
      workdayRows(item.wd).forEach(function (row) {
        count++;
        html += '<li class="tl-item" data-tone="' + row.type + '">' +
          '<span class="tl-icon">' + icon(ICONS[row.type]) + '</span>' +
          '<span class="tl-label">' + eventLabel(row) + '</span>' +
          '<time class="tl-time">' + Time.time(row.ts) + '</time>' +
          '</li>';
      });
    });

    el.logList.innerHTML = html;
    el.logEmpty.hidden = count > 0;
    el.logCount.textContent = count;

    // Animate the newest row after an action
    if (state.highlightLast) {
      var rows = el.logList.querySelectorAll('.tl-item');
      if (rows.length) rows[rows.length - 1].classList.add('is-new');
      state.highlightLast = false;
    }

    // "Total de Horas" — sum of finished workdays shown in the log
    var finished = items.filter(function (i) { return i.wd.end; });
    if (finished.length) {
      var ms = finished.reduce(function (s, i) { return s + Time.workdayTotal(i.wd); }, 0);
      el.totalValue.textContent = Time.formatHM(ms);
      el.totalBar.hidden = false;
      if (state.highlightTotal) {
        el.totalBar.classList.remove('pop');
        void el.totalBar.offsetWidth; // restart animation
        el.totalBar.classList.add('pop');
      }
    } else {
      el.totalBar.hidden = true;
    }
    state.highlightTotal = false;
  }

  /** Runs every second: clock, live worked time, midnight rollover. */
  function tick() {
    var now = new Date();
    el.clock.textContent = Time.clock(now);

    var ms = homeWorkdays().reduce(function (s, i) { return s + Time.workdayTotal(i.wd, now.getTime()); }, 0);
    el.workedLive.textContent = Time.formatStopwatch(ms);

    var key = Time.dateKey(now);
    if (key !== state.lastDateKey) {          // a new day has begun
      state.lastDateKey = key;
      renderAll();
    }
  }

  /* ==========================================================
     4. REGISTROS VIEW
     ========================================================== */

  function renderCalendar() {
    var y = state.calYear, m = state.calMonth;
    var todayKey = Time.dateKey();
    var now = Date.now();

    el.calTitle.textContent = Time.monthTitle(y, m);
    el.calWeekdays.innerHTML = Time.weekdays().map(function (d) { return '<span>' + d + '</span>'; }).join('');

    var first = new Date(y, m, 1);
    var offset = (first.getDay() - I18n.weekStart() + 7) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var html = '';
    for (var i = 0; i < offset; i++) html += '<span class="cal-day is-blank" aria-hidden="true"></span>';

    var monthMs = 0, daysWorked = 0;
    for (var d = 1; d <= daysInMonth; d++) {
      var key = Time.dateKey(new Date(y, m, d));
      var list = Store.getDay(key);
      var has = list.length > 0;
      var total = has ? Time.dayTotal(list, now) : 0;
      if (has) { monthMs += total; daysWorked++; }

      var cls = 'cal-day' + (has ? ' has-records' : '') + (key === todayKey ? ' is-today' : '') +
        (key === state.selectedKey ? ' is-selected' : '');
      var label = Time.longDate(new Date(y, m, d)) + (has ? ' · ' + Time.formatHM(total) : '');

      html += '<button type="button" class="' + cls + '" data-key="' + key + '" aria-label="' + label + '"' +
        (key === state.selectedKey ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
        '<span class="cal-num">' + d + '</span>' +
        (has ? '<span class="cal-hours">' + Time.formatCompact(total) + '</span>' : '') +
        '</button>';
    }
    el.calGrid.innerHTML = html;

    el.statTotal.textContent = daysWorked ? Time.formatHM(monthMs) : '—';
    el.statDays.textContent = daysWorked;
    el.statAvg.textContent = daysWorked ? Time.formatHM(monthMs / daysWorked) : '—';
  }

  function renderDetail() {
    var key = state.selectedKey;
    if (!key) {
      el.detailTitle.textContent = '';
      el.detailBody.innerHTML = '<p class="empty">' + t('records.selectDay') + '</p>';
      el.deleteDayBtn.hidden = true;
      return;
    }

    el.detailTitle.textContent = Time.longDate(Time.parseKey(key));
    var list = Store.getDay(key);
    el.deleteDayBtn.hidden = list.length === 0;

    if (!list.length) {
      el.detailBody.innerHTML = '<div class="empty-state">' + icon('i-calendar') + '<p>' + t('records.noRecords') + '</p></div>';
      return;
    }

    var now = Date.now();
    var html = '';
    list.forEach(function (wd, idx) {
      var rows = workdayRows(wd);
      var openIn = null;
      var body = rows.map(function (row, i) {
        var span = '—';
        if (row.type === 'in') openIn = row.ts;
        if (row.type === 'out' && openIn !== null) { span = Time.formatHM(row.ts - openIn); openIn = null; }
        return '<tr data-tone="' + row.type + '">' +
          '<td class="col-num">' + (i + 1) + '</td>' +
          '<td><span class="cell-action"><span class="tl-icon sm">' + icon(ICONS[row.type]) + '</span>' + eventLabel(row) + '</span></td>' +
          '<td class="col-time">' + Time.time(row.ts) + '</td>' +
          '<td class="col-span">' + span + '</td>' +
          '</tr>';
      }).join('');

      html += '<section class="wd-block">' +
        '<header class="wd-head"><span>' + t('log.workday', { n: idx + 1 }) + '</span>' +
        '<span class="pill' + (wd.end ? '' : ' live') + '">' +
        (wd.end ? Time.formatHM(Time.workdayTotal(wd)) : t('log.inProgress') + ' · ' + Time.formatHM(Time.workdayTotal(wd, now))) +
        '</span></header>' +
        '<div class="table-wrap"><table class="log-table">' +
        '<thead><tr><th class="col-num">' + t('records.colNum') + '</th><th>' + t('records.colAction') +
        '</th><th class="col-time">' + t('records.colTime') + '</th><th class="col-span">' + t('records.colSpan') + '</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table></div></section>';
    });

    html += '<div class="total-bar">' + icon('i-hourglass') +
      '<span>' + t('records.dayTotal') + ': <strong>' + Time.formatHM(Time.dayTotal(list, now)) + '</strong></span></div>';

    el.detailBody.innerHTML = html;
  }

  function renderRecords() {
    renderCalendar();
    renderDetail();
  }

  function shiftMonth(delta) {
    var d = new Date(state.calYear, state.calMonth + delta, 1);
    state.calYear = d.getFullYear();
    state.calMonth = d.getMonth();
    el.calGrid.classList.remove('slide-left', 'slide-right');
    void el.calGrid.offsetWidth;
    el.calGrid.classList.add(delta > 0 ? 'slide-left' : 'slide-right');
    renderCalendar();
  }

  /* ==========================================================
     5. FEEDBACK UI
     ========================================================== */

  var TOAST_ICONS = { success: 'i-check', info: 'i-info', warn: 'i-alert', error: 'i-alert' };

  function toast(message, type) {
    type = type || 'info';
    var node = document.createElement('div');
    node.className = 'toast toast-' + type;
    node.setAttribute('role', type === 'error' ? 'alert' : 'status');
    node.innerHTML = '<span class="toast-icon">' + icon(TOAST_ICONS[type]) + '</span><span>' + message + '</span>';
    el.toastRegion.appendChild(node);

    // Keep at most 3 toasts on screen
    while (el.toastRegion.children.length > 3) el.toastRegion.firstChild.remove();

    setTimeout(function () {
      node.classList.add('leaving');
      node.addEventListener('animationend', function () { node.remove(); }, { once: true });
    }, 2800);
  }

  /** Material-style ripple from the pointer position. */
  function ripple(button, evt) {
    var rect = button.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 1.4;
    var x = (evt.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    var y = (evt.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px';
    button.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); }, { once: true });
  }

  function flash(button, ok) {
    var cls = ok ? 'is-done' : 'is-denied';
    button.classList.remove('is-done', 'is-denied');
    void button.offsetWidth;
    button.classList.add(cls);
    setTimeout(function () { button.classList.remove(cls); }, 700);
  }

  /**
   * Promise-based modal. Resolves true when confirmed.
   * opts: { title, body, confirm, cancel?, danger?, iconId? }
   */
  function modal(opts) {
    return new Promise(function (resolve) {
      var dlg = el.modal;
      $('#modalTitle').textContent = opts.title;
      $('#modalBody').textContent = opts.body;
      $('#modalIcon').innerHTML = icon(opts.iconId || 'i-info');
      $('#modalIcon').className = 'modal-icon' + (opts.danger ? ' danger' : '');
      var confirmBtn = $('#modalConfirm');
      var cancelBtn = $('#modalCancel');
      confirmBtn.textContent = opts.confirm;
      confirmBtn.className = 'btn ' + (opts.danger ? 'danger' : 'primary');
      cancelBtn.hidden = !opts.cancel;
      cancelBtn.textContent = opts.cancel || '';

      if (typeof dlg.showModal !== 'function') {   // very old browsers
        resolve(window.confirm(opts.title + '\n\n' + opts.body));
        return;
      }
      dlg.returnValue = '';
      dlg.addEventListener('close', function onClose() {
        dlg.removeEventListener('close', onClose);
        resolve(dlg.returnValue === 'confirm');
      });
      dlg.showModal();
    });
  }

  /* ==========================================================
     6. ROUTER
     ========================================================== */

  var ROUTES = ['inicio', 'registros'];

  function route() {
    var name = (location.hash || '#inicio').slice(1);
    if (ROUTES.indexOf(name) === -1) name = 'inicio';
    state.route = name;

    document.querySelectorAll('.tab').forEach(function (tab) {
      var on = tab.dataset.route === name;
      tab.classList.toggle('is-active', on);
      if (on) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    });

    document.querySelectorAll('.view').forEach(function (view) {
      var on = view.dataset.view === name;
      if (on && view.hidden) {
        view.hidden = false;
        view.classList.remove('view-enter');
        void view.offsetWidth;
        view.classList.add('view-enter');
      } else if (!on) {
        view.hidden = true;
      }
    });

    if (name === 'inicio') renderHome(); else renderRecords();
    window.scrollTo(0, 0);
  }

  function renderAll() {
    I18n.apply();
    if (state.route === 'inicio') renderHome(); else renderRecords();
  }

  /* ==========================================================
     7. PWA
     ========================================================== */

  var deferredPrompt = null;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function setupPWA() {
    // Service worker → offline support + installability
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function (err) {
          console.warn('[Check.In] Service worker not registered:', err);
        });
      });
    }

    // Android / desktop Chrome: custom install button
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      el.installBtn.hidden = false;
    });
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      el.installBtn.hidden = true;
      toast(t('toast.installed'), 'success');
    });

    // iPhone / iPad: show instructions (Safari has no install prompt)
    if (isIOS && !isStandalone) el.installBtn.hidden = false;

    el.installBtn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; el.installBtn.hidden = true; });
      } else {
        modal({ title: t('install.iosTitle'), body: t('install.iosBody'), confirm: t('modal.ok'), iconId: 'i-share' });
      }
    });
  }

  /* ==========================================================
     8. BOOT
     ========================================================== */

  function populateLanguages() {
    el.langSelect.innerHTML = I18n.available().map(function (lang) {
      return '<option value="' + lang.code + '">' + lang.name + '</option>';
    }).join('');
    el.langSelect.value = I18n.getLanguage();
    document.getElementById('langCode').textContent = I18n.getLanguage().toUpperCase();
  }

  function bindEvents() {
    // The four main actions
    [el.btnStart, el.btnIn, el.btnOut, el.btnEnd].forEach(function (btn) {
      btn.addEventListener('click', function (evt) {
        ripple(btn, evt);
        var result = Actions[btn.dataset.action]();
        flash(btn, result.ok);
        renderHome();
      });
    });

    // Calendar navigation
    el.calPrev.addEventListener('click', function () { shiftMonth(-1); });
    el.calNext.addEventListener('click', function () { shiftMonth(1); });
    el.calToday.addEventListener('click', function () {
      var now = new Date();
      state.calYear = now.getFullYear();
      state.calMonth = now.getMonth();
      state.selectedKey = Time.dateKey(now);
      renderRecords();
    });

    // Day selection (event delegation)
    el.calGrid.addEventListener('click', function (evt) {
      var cell = evt.target.closest('.cal-day[data-key]');
      if (!cell) return;
      state.selectedKey = cell.dataset.key;
      renderRecords();
      el.detailCard.classList.remove('view-enter');
      void el.detailCard.offsetWidth;
      el.detailCard.classList.add('view-enter');
      // On stacked (mobile) layouts, bring the detail into view
      if (window.matchMedia('(max-width: 899px)').matches) {
        el.detailCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Delete a day's records
    el.deleteDayBtn.addEventListener('click', function () {
      var key = state.selectedKey;
      modal({
        title: t('modal.deleteTitle'),
        body: t('modal.deleteBody', { date: Time.longDate(Time.parseKey(key)) }),
        confirm: t('modal.confirmDelete'),
        cancel: t('modal.cancel'),
        danger: true,
        iconId: 'i-trash'
      }).then(function (yes) {
        if (!yes) return;
        if (Store.deleteDay(key)) toast(t('toast.deleted'), 'success');
        else toast(t('toast.storageError'), 'error');
        renderRecords();
      });
    });

    // Language switcher
    el.langSelect.addEventListener('change', function () { I18n.setLanguage(el.langSelect.value); });
    I18n.onChange(function () { populateLanguages(); renderAll(); });

    // Routing
    window.addEventListener('hashchange', route);

    // Keep several open tabs in sync
    window.addEventListener('storage', function (e) {
      if (e.key === Store.KEY) { Store.reload(); renderAll(); }
    });

    // Refresh when the app comes back to the foreground (e.g. after midnight)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) renderAll();
    });

    setInterval(function () { if (state.route === 'inicio') tick(); }, 1000);
  }

  function boot() {
    I18n.init();
    populateLanguages();
    bindEvents();
    setupPWA();
    route();
    document.body.classList.add('is-ready');
  }

  boot();
})();
