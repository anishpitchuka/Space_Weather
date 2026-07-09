# NOAA Live Panels — Solar Wind, IMF, Kp Index, X-ray Flares

These four panels all pull directly from NOAA SWPC's public JSON feeds
client-side (no backend), and share the same fetch/fallback/refresh pattern.

## Solar Wind & IMF

Shows solar wind speed/density and interplanetary magnetic field (Bz/Bt/By).

- **Primary source:** `https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json`
  (plasma) and the equivalent `mag-2-hour.json` (IMF).
- **Fallback:** if the 2-hour endpoint returns header-only/no valid rows
  (a real, fairly common NOAA outage), falls back to the 7-day feed and
  walks backward to find the last row with valid data
  (`findLatestValidRow()` in `js/api.js`).
- **Functions:** `loadSolarWind()`, `loadIMF()` in `js/api.js`.
- **HTML targets:** solar wind / IMF panel elements in `index.html`
  (col-left).

## Kp Index

Real-time planetary Kp (geomagnetic activity, 0–9 scale).

- **Source:** NOAA's planetary K-index feed.
- **Function:** `loadKp()` in `js/api.js`.

## X-ray Solar Flares

Strongest GOES X-ray flare class in the last 6 and 24 hours.

- **Source:** NOAA GOES X-ray flares feed.
- **Function:** `loadFlares()` in `js/api.js`. Also feeds `_alertState.flareFlux`,
  which drives the site's top alert banner (`updateAlertBanner()`).

## Refresh behavior

All four are fetched on page load and re-fetched every 5 minutes via a single
`setInterval` in `js/main.js`'s `DOMContentLoaded` handler, alongside the
other live panels (asteroids, sunspot number, storm forecast, forecast chart).

## Known limitations

Sunspot number (SILSO EISN feed) is fetched client-side but SILSO does not
support cross-origin browser requests at all — confirmed by testing from a
genuinely different origin, not a transient issue. No working CORS proxy has
been found yet; this is an open follow-up, not implemented reliably.
