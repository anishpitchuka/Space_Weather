# Space Weather

A static space-weather dashboard — live solar wind, IMF, Kp index, X-ray
flares, near-Earth asteroids, Indian geomagnetic observatory data, and a
geomagnetic storm forecast, in a Drudge-style / spaceweather.com-style
layout. Deployed on Vercel, backed by Supabase for storage and the
user-submitted-photo feature.

## Features

- **Solar wind & IMF** — live speed, density, Bz/Bt/By from NOAA SWPC, with
  automatic fallback to a longer-range feed when the primary 2-hour endpoint
  returns no valid data.
- **Kp index** — real-time planetary Kp from NOAA.
- **X-ray solar flares** — GOES flare class over the last 6h/24h.
- **Near-Earth asteroids** — NASA NeoWs feed (personal API key, falls back to
  `DEMO_KEY` if unset).
- **Daily sun photo** — SDO HMI intensitygram, auto-refreshed.
- **Indian geomagnetic observatory graphs** — Alibag, Jaipur, Hyderabad, and
  others, pulled from BGS INTERMAGNET, plotted on an interactive map.
- **Geomagnetic storm forecast** — Dst/Kp forecast, CME outlook, and
  main-phase status, published by a companion ML predictor project and read
  from Supabase (see [Storm predictor integration](#storm-predictor-integration)
  below).
- **Forecast-vs-actual chart** — the predictor's Dst chart (observed vs.
  forecast, with ±1σ band), rendered server-side and displayed on the home
  page, refreshed automatically.
- **Photo submissions** — users can upload images via `upload.html`;
  submissions are stored in Supabase and reviewed via `confirm.html`.

## Tech stack

Plain HTML/CSS/JS (no framework, no build step beyond config injection).
[Supabase](https://supabase.com) for the submissions table, storm predictions
table, and chart image storage. [Leaflet](https://leafletjs.com) for the
observatory map. Deployed on [Vercel](https://vercel.com).

## Project structure

```
index.html        — home page (all live panels + articles)
upload.html        confirm.html   — photo submission flow
css/               — one stylesheet per page
js/
  api.js           — all external API fetches (NOAA, NASA, BGS, Supabase reads)
  main.js          — home page init, refresh intervals
  observatories.js — India observatory map + graphs
  map.js           — Leaflet map logic
  upload.js        confirm.js     — submission flow
  utils.js         — shared helpers
  config.example.js — template for local credentials
  config.js         — your actual credentials (gitignored, generated on Vercel)
test/              — sample images for local testing
vercel.json        — build command that generates js/config.js from env vars
```

## Local setup

1. Copy `js/config.example.js` to `js/config.js` and fill in your own
   Supabase project URL/publishable key and NASA API key
   (get one free at https://api.nasa.gov).
2. Serve the folder with any static file server (e.g. `npx serve .` or the
   VS Code Live Server extension) — no build step needed locally.

## Deployment (Vercel)

`vercel.json`'s `buildCommand` generates `js/config.js` at build time from
Vercel environment variables, so nothing sensitive is committed to the repo.
Set these in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (the publishable/anon key — safe to expose client-side)
- `NASA_API_KEY`

## Storm predictor integration

The geomagnetic storm forecast panel and forecast-vs-actual chart are
produced by a separate project — a Python/PyTorch storm predictor (LSTM /
Transformer / TCN ensembles), originally a Streamlit app, run headlessly on a
schedule via GitHub Actions. That job:

1. Fetches live NOAA solar wind/Dst/Kp data and runs the trained model.
2. Inserts one summary row into a `storm_predictions` Supabase table
   (forecast values, storm probability, CME outlook, main-phase status).
3. Renders the observed-vs-forecast Dst chart (Plotly) and uploads it as a
   static PNG to a public Supabase Storage bucket, overwriting the same file
   each run.

This site only *reads* from Supabase — `loadStormPrediction()` and
`loadDstForecastChart()` in `js/api.js` poll the latest row and the chart
image every 5 minutes. If no predictor run has ever happened, both sections
stay hidden/empty rather than showing broken data.
