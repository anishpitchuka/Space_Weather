# Near-Earth Asteroids

Table of near-Earth objects making a close approach today, shown in the
right column of the home page.

- **Source:** NASA NeoWs (Near Earth Object Web Service) API.
- **API key:** a personal NASA API key (`NASA_API_KEY`, injected via
  `vercel.json`'s build command from the `NASA_API_KEY` Vercel env var, or
  set locally in `js/config.js`). Falls back to NASA's shared `DEMO_KEY` if
  no key is configured, though that key is rate-limited and shared across
  everyone using it unauthenticated.
- **Function:** `loadAsteroids()` in `js/api.js`.
- **HTML target:** `<table class="ast-table"><tbody id="ast-tbody">` in
  `index.html`.
- **Fields shown:** name, close-approach date, distance (lunar distances),
  relative velocity, estimated diameter, whether the approach is today.

## Setup

Get a free key at https://api.nasa.gov, then either add it to Vercel's
project environment variables as `NASA_API_KEY`, or paste it directly into
`js/config.js` (`const NASA_API_KEY = '...'`) for local testing —
`js/config.js` is gitignored, so it's never committed.
