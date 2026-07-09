# Geomagnetic Storm Predictor — Forecast Panel, Chart, and Pipeline

Combines the two site features backed by the storm predictor (the text
forecast panel and the forecast-vs-actual chart), plus the full external
pipeline that produces both, since they're one integration end to end.

## What the site shows

**Storm Forecast panel** (`#storm-forecast-section`, col-left, hidden until
data exists) — Dst forecast at +1h/+3h/+6h, storm probability, worst-case
severity label, which model variant produced it, an early-warning +6h call
from a separate solar-wind-only model, a CME outlook line (only shown when a
CME is currently pending), and a main-phase status line (only shown during
an active storm).

**Forecast-vs-actual chart** (`#dst-forecast-chart-block`, center column,
replacing the original "Sunset Sky Show" placeholder) — observed Dst plotted
against the model's own forecast, with a ±1σ confidence band and dotted
"past forecast" lines per horizon, matching the chart the predictor's own
Streamlit dashboard shows.

## Where the data comes from

This site is a **pure reader** — it has no model code and does no inference.
Everything is produced by a separate project (a PyTorch storm predictor,
originally a Streamlit app, owned by a collaborator, in its own GitHub repo)
and published to Supabase, from which this site reads.

### The predictor repo, at a high level

- `app.py` — the original Streamlit dashboard (interactive, for local use).
- `predictor_core.py` — pure-logic module split out of `app.py` (constants,
  model classes, NOAA/CME/main-phase fetch & compute functions, no Streamlit
  dependency). `app.py` now does `from predictor_core import *` for
  everything that lives here.
- `predict_and_store.py` — headless script that imports `predictor_core`,
  runs the same live-data → prediction pipeline `app.py`'s Live Dashboard
  tab runs, and publishes the results (see below). No Streamlit, no browser.
- `.github/workflows/predict.yml` — GitHub Actions workflow that runs
  `predict_and_store.py` on a schedule (`*/15 * * * *`, every 15 minutes)
  plus on-demand via `workflow_dispatch`.

### What each scheduled run does

1. Fetches live NOAA solar wind, Dst, and Kp data.
2. Picks the best available trained model variant on disk (stratified +
   weighted ensemble > weighted ensemble > stratified ensemble > plain LSTM)
   and runs the Dst forecast (+1h/+3h/+6h).
3. Runs the separate solar-wind-only "early warning" model (+6h/+12h/+24h)
   if that artifact exists.
4. Checks for a pending CME (CACTus catalog + a trained arrival/severity
   model) and an active storm main phase, if either is currently happening.
5. Inserts one row into the `storm_predictions` Supabase table with all of
   the above, summarized.
6. Re-runs a walk-forward backtest over the live window
   (`compute_forecast_track`) and renders the observed-vs-forecast Dst chart
   with Plotly (a verbatim port of `app.py`'s `chart_dst`), exports it to a
   static PNG via `kaleido`, and uploads it to a public Supabase Storage
   bucket (`charts/latest_dst_forecast.png`), overwriting the same filename
   every run so the URL never changes.

### Supabase objects involved

- **`storm_predictions` table** — append-only log, one row per run
  (`created_at` timestamp). Public `SELECT` via RLS; only the service_role
  key (used server-side by the GitHub Action) can `INSERT`.
- **`charts` Storage bucket** — public bucket, one file
  (`latest_dst_forecast.png`) repeatedly overwritten. Public read; only the
  service_role key can write.

### Secrets

`SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the **secret key** — Supabase's
newer name for `service_role` — never the anon/publishable key) are stored
as GitHub Actions repo secrets in the *predictor* repo, not this one. This
site only ever uses the public/anon (publishable) key, already configured
via `js/config.js`.

## How this site reads it

- **`loadStormPrediction()`** (`js/api.js`) — queries the single most recent
  `storm_predictions` row and populates the panel. Fails silently (leaves
  the section hidden) if the table doesn't exist yet or the fetch fails, so
  a backend hiccup never breaks the page.
- **`loadDstForecastChart()`** (`js/api.js`) — probes the chart image URL
  (with a cache-busting `?t=` timestamp) before swapping it into the `<img>`,
  falling back to an empty-state message if the probe fails.
- Both are called on page load and on the same 5-minute refresh cycle as the
  other live panels (`js/main.js`).

## Known gaps / honesty notes

- The chart is a from-scratch verbatim port of `app.py`'s `chart_dst`
  function body (read directly from the uploaded source), not a
  screenshot/export of the live Streamlit app itself.
- `predictor_core.py` was extracted from a partial read of `app.py`
  (everything through `run_model_a_prediction()`, plus the `ACCURACY` dicts)
  — the remaining Streamlit UI code (tabs, sidebar, CSS) was never read and
  wasn't needed for this integration, but this is worth knowing if `app.py`
  ever throws an unexpected `NameError` for something not yet accounted for
  here (this has happened twice already — missing `streamlit`/
  `streamlit_autorefresh` imports and a missing `plotly.graph_objects`
  import — both were imports that needed to stay in `app.py` itself, not
  `predictor_core.py`).
- GitHub Actions cron schedules are not guaranteed to fire exactly on time —
  expect delays, especially right after a schedule is newly added to a repo.
