# Check.In

A minimal, installable web app (PWA) for freelancers to track their working hours.
Built with plain **HTML, CSS and JavaScript**: no frameworks, no build step and no external requests.

## Features

- **Inicio**: today's date, a live clock, a status chip and a live counter of the time worked today.
  - **Inicio de Trabajo** opens a workday.
  - **Check-In / Check-Out** can be used as many times as you need. Each action saves its exact timestamp.
  - **Fin de Trabajo** closes the workday and adds up every Check-In → Check-Out pair. The result appears below the log as `Total de Horas: XX h XX min`.
  - If you end a workday while still checked in, the app adds an automatic Check-Out at the end time.
  - A day can hold more than one workday (for example, a morning shift and an evening shift).
- **Registros**: a monthly calendar where days with records are highlighted and show their hours, plus monthly stats (total, days worked, daily average). Click a day to see a table of every timestamp, the length of each segment and the day's total. A day's records can be deleted after a confirmation.
- **i18n**: Spanish and English are included. The app picks the browser language automatically, and you can switch from the top bar.
- **Persistence**: everything is saved in `localStorage` and kept in sync between open tabs.
- **PWA**: a manifest, a service worker (works offline), icons for Android and iOS, and an install button.

## Run it

A service worker only runs over `http://localhost` or `https://`, so serve the folder from a local server:

```bash
cd checkin
python3 -m http.server 8080
# open http://localhost:8080
```

You can also open `index.html` directly. Everything works except offline mode and installation.

## Install on a phone

Deploy the folder to any static HTTPS host, such as GitHub Pages, Netlify, Vercel or Cloudflare Pages.

- **Android (Chrome)**: tap the download icon in the top bar, or use *⋮ → Install app*.
- **iPhone (Safari)**: tap *Share → Add to Home Screen*. The download icon in the app shows these steps.

## Project structure

```
checkin/
├── index.html              App shell, icon sprite, both views
├── manifest.webmanifest    PWA manifest
├── sw.js                   Service worker (offline cache)
├── css/styles.css          Mobile-first styles, tokens, animations
├── icons/                  favicon.svg + PNG icons (any, maskable, apple-touch)
└── js/
    ├── i18n.js             Translation engine (t(), data-i18n, language switch)
    ├── lang/es.js          Spanish strings (default)
    ├── lang/en.js          English strings
    ├── storage.js          localStorage data layer
    ├── time.js             Hour calculations + Intl date/time formatting
    └── app.js              Actions, rendering, router, feedback, PWA setup
```

## Add a language

1. Copy `js/lang/en.js` to, for example, `js/lang/fr.js`.
2. Change `I18n.register('en', …)` to `'fr'`, then translate the values and set `meta.locale` (`fr-FR`) and `meta.weekStart`.
3. Add `<script src="js/lang/fr.js"></script>` after the other language files in `index.html`.
4. Add `'./js/lang/fr.js'` to `ASSETS` in `sw.js` and bump `CACHE_VERSION`.

The new language will then appear in the language switcher automatically.

## Data format

The data is stored under the key `checkin.data.v1`:

```json
{
  "version": 1,
  "days": {
    "2026-11-06": [
      {
        "id": "lq3x9k",
        "start": 1762412400000,
        "end": 1762441200000,
        "events": [
          { "type": "in", "ts": 1762412460000 },
          { "type": "out", "ts": 1762426800000 }
        ],
        "totalMs": 14340000
      }
    ]
  }
}
```

## Updating the app

When you change any file, bump `CACHE_VERSION` in `sw.js` so installed copies download the new version.
