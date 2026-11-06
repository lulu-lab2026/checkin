/**
 * Check.In — Local Storage data layer
 * ------------------------------------------------------------
 * Shape of the saved data (key "checkin.data.v1"):
 *
 * {
 *   version: 1,
 *   days: {
 *     "2026-11-06": [                 // local date the workday started
 *       {
 *         id: "lq3x9k",
 *         start: 1762412400000,        // Inicio de Trabajo (ms timestamp)
 *         end:   1762441200000|null,   // Fin de Trabajo (null = still open)
 *         events: [                    // Check-In / Check-Out, in order
 *           { type: "in",  ts: 1762412460000 },
 *           { type: "out", ts: 1762426800000, auto?: true }
 *         ],
 *         totalMs: 27000000            // stored when the workday ends
 *       }
 *     ]
 *   }
 * }
 *
 * A day can hold several workdays (e.g. morning and evening shifts).
 */
var Store = (function () {
  'use strict';

  var KEY = 'checkin.data.v1';
  var data = read();

  function empty() { return { version: 1, days: {} }; }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.days !== 'object') return empty();
      return parsed;
    } catch (err) {
      console.warn('[Check.In] Could not read saved data:', err);
      return empty();
    }
  }

  /** Persist everything. Returns false if storage is full/unavailable. */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('[Check.In] Could not save data:', err);
      return false;
    }
  }

  return {
    KEY: KEY,
    save: save,

    /** Re-read from disk (used when another tab changes the data). */
    reload: function () { data = read(); },

    /** All workdays recorded for a date key (YYYY-MM-DD). */
    getDay: function (key) { return data.days[key] || []; },

    hasDay: function (key) { return (data.days[key] || []).length > 0; },

    /** The workday that is still open, if any: { key, wd } or null. */
    findActive: function () {
      var keys = Object.keys(data.days).sort().reverse();
      for (var i = 0; i < keys.length; i++) {
        var list = data.days[keys[i]];
        for (var j = 0; j < list.length; j++) {
          if (!list[j].end) return { key: keys[i], wd: list[j] };
        }
      }
      return null;
    },

    /** Add a new workday under a date key and save. */
    addWorkday: function (key, wd) {
      if (!data.days[key]) data.days[key] = [];
      data.days[key].push(wd);
      return save();
    },

    /** Remove every record of a date and save. */
    deleteDay: function (key) {
      delete data.days[key];
      return save();
    }
  };
})();
