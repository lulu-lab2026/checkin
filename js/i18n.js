/**
 * Check.In — i18n engine
 * ------------------------------------------------------------
 * Tiny, dependency-free translation layer.
 *
 *  - Each language lives in its own file (js/lang/xx.js) and calls
 *    I18n.register('xx', { ... }).
 *  - Keys are dotted paths: t('actions.checkIn').
 *  - Placeholders use braces: t('toast.started', { time: '09:00' }).
 *  - Static HTML is translated with attributes:
 *      data-i18n="key"                     → textContent
 *      data-i18n-attr="aria-label:key;title:key2" → attributes
 *
 * To add a language: copy js/lang/en.js, translate the values,
 * change the code, and add a <script> tag in index.html.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'checkin.lang';
  var FALLBACK = 'es';

  var languages = {};   // code → dictionary
  var current = FALLBACK;
  var listeners = [];

  /** Register a language dictionary. */
  function register(code, dict) {
    languages[code] = dict;
  }

  /** Resolve a dotted key inside a dictionary. */
  function lookup(dict, key) {
    return key.split('.').reduce(function (node, part) {
      return node && node[part] !== undefined ? node[part] : undefined;
    }, dict);
  }

  /** Translate a key, falling back to Spanish, then to the key itself. */
  function t(key, params) {
    var value = lookup(languages[current], key);
    if (value === undefined) value = lookup(languages[FALLBACK], key);
    if (value === undefined) return key;
    if (typeof value !== 'string') return value; // arrays/objects (e.g. lists)
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function (match, name) {
      return params[name] !== undefined ? params[name] : match;
    });
  }

  /** Translate every element marked with data-i18n / data-i18n-attr. */
  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        if (parts.length === 2) el.setAttribute(parts[0].trim(), t(parts[1].trim()));
      });
    });
  }

  /** Pick the initial language: saved choice → browser language → fallback. */
  function detect() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && languages[saved]) return saved;
    var prefs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).slice(0, 2).toLowerCase();
      if (languages[code]) return code;
    }
    return FALLBACK;
  }

  /** Change the active language, persist it and notify listeners. */
  function setLanguage(code) {
    if (!languages[code]) return;
    current = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* ignore */ }
    document.documentElement.lang = code;
    apply();
    listeners.forEach(function (fn) { fn(code); });
  }

  function init() { setLanguage(detect()); }

  global.I18n = {
    register: register,
    t: t,
    apply: apply,
    init: init,
    setLanguage: setLanguage,
    getLanguage: function () { return current; },
    /** BCP-47 locale used by Intl formatters (dates, times). */
    locale: function () { return t('meta.locale'); },
    /** First day of the week for the calendar (0 = Sunday, 1 = Monday). */
    weekStart: function () { return Number(t('meta.weekStart')) || 0; },
    available: function () {
      return Object.keys(languages).map(function (code) {
        return { code: code, name: lookup(languages[code], 'meta.name') || code };
      });
    },
    onChange: function (fn) { listeners.push(fn); }
  };
})(window);
