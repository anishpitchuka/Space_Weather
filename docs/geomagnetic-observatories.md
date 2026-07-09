# Indian Geomagnetic Observatory Map & Graphs

Interactive map of Indian geomagnetic observation stations (Alibag, Jaipur,
Hyderabad, and others), with a live magnetic-field graph per station shown
on click, in the center column of the home page.

- **Source:** BGS INTERMAGNET GIN API
  (`https://imag-data.bgs.ac.uk/GIN_V1/GINServices`).
- **Map:** [Leaflet](https://leafletjs.com), rendered into
  `#india-map-inner` inside `#india-map-wrap` (`index.html`). Map/marker
  logic lives in `js/map.js`.
- **Graphs:** fetched per-station on marker click, via `loadObsStation(code)`
  in `js/observatories.js`.

## Fetch window

Each station's data has its own publication lag ("Best available" status at
BGS) — Alibag and Jaipur in particular can lag ~2 days. The fetch window was
widened from `dataDuration=2` (2 days) to `dataDuration=6` (6 days), with
`dataStartDate` set to 5 days before now, specifically to make sure these
slower-publishing stations still return a full, non-blank dataset. The
status text under each graph now shows the real timestamp of the last valid
data point (`formatObsTime()` / `lastValidIndex()` helpers), rather than the
browser's current time, so a stale reading is visible as stale rather than
looking falsely up-to-date.

## Popup fields

Latitude, longitude, area name, and state — shown in `#map-popup` on marker
click. Additional data fields are a planned addition, not yet implemented.
