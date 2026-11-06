/**
 * Check.In — time helpers
 * ------------------------------------------------------------
 * Pure functions for date keys, hour calculations and
 * locale-aware formatting (uses the active i18n locale).
 */
var Time = (function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  /** Local date key "YYYY-MM-DD" (not UTC, so days match the user's clock). */
  function dateKey(date) {
    date = date || new Date();
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /** "YYYY-MM-DD" → Date at local midnight. */
  function parseKey(key) {
    var p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  /**
   * Milliseconds worked in a workday, summing every Check-In → Check-Out pair.
   * An unclosed Check-In counts up to `now` (live) or up to the workday end.
   */
  function workedMs(wd, now) {
    now = now || Date.now();
    var total = 0;
    var openAt = null;
    wd.events.forEach(function (ev) {
      if (ev.type === 'in' && openAt === null) openAt = ev.ts;
      else if (ev.type === 'out' && openAt !== null) { total += ev.ts - openAt; openAt = null; }
    });
    if (openAt !== null) total += Math.max(0, (wd.end || now) - openAt);
    return total;
  }

  /** Total for a workday: stored value once finished, live value while open. */
  function workdayTotal(wd, now) {
    return wd.end ? (wd.totalMs != null ? wd.totalMs : workedMs(wd)) : workedMs(wd, now);
  }

  /** Sum of all workdays of a day. */
  function dayTotal(list, now) {
    return list.reduce(function (sum, wd) { return sum + workdayTotal(wd, now); }, 0);
  }

  function split(ms) {
    var minutes = Math.floor(ms / 60000);
    return { h: Math.floor(minutes / 60), m: minutes % 60 };
  }

  /** "07 h 45 min" — the official total format. */
  function formatHM(ms) {
    var s = split(ms);
    return I18n.t('total.format', { h: pad(s.h), m: pad(s.m) });
  }

  /** "7h45" — compact label for calendar cells. */
  function formatCompact(ms) {
    var s = split(ms);
    return s.h + 'h' + pad(s.m);
  }

  /** "02:15:09" — live stopwatch. */
  function formatStopwatch(ms) {
    var sec = Math.floor(ms / 1000);
    return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec / 60) % 60) + ':' + pad(sec % 60);
  }

  // ---- Intl formatters (cached per locale) ----
  var cache = {};
  function fmt(name, options) {
    var id = I18n.locale() + '|' + name;
    if (!cache[id]) cache[id] = new Intl.DateTimeFormat(I18n.locale(), options);
    return cache[id];
  }

  function capitalise(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  return {
    pad: pad,
    dateKey: dateKey,
    parseKey: parseKey,
    workedMs: workedMs,
    workdayTotal: workdayTotal,
    dayTotal: dayTotal,
    formatHM: formatHM,
    formatCompact: formatCompact,
    formatStopwatch: formatStopwatch,

    /** 09:05:12 */
    time: function (ts) {
      return fmt('time', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ts));
    },
    /** 09:05 */
    clock: function (date) {
      return fmt('clock', { hour: '2-digit', minute: '2-digit' }).format(date);
    },
    /** Viernes, 6 de noviembre de 2026 */
    longDate: function (date) {
      return capitalise(fmt('long', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date));
    },
    /** 6 de noviembre */
    shortDate: function (date) {
      return fmt('short', { day: 'numeric', month: 'long' }).format(date);
    },
    /** Noviembre de 2026 */
    monthTitle: function (year, month) {
      return capitalise(fmt('month', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1)));
    },
    /** Weekday initials ordered from the locale's first day of the week. */
    weekdays: function () {
      var start = I18n.weekStart();
      var f = fmt('wd', { weekday: 'short' });
      var names = [];
      // 2024-01-07 was a Sunday → index 0
      for (var i = 0; i < 7; i++) {
        names.push(capitalise(f.format(new Date(2024, 0, 7 + ((start + i) % 7))).replace('.', '')));
      }
      return names;
    }
  };
})();
