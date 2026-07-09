# Daily Sun Photo

Shows the latest SDO (Solar Dynamics Observatory) HMI intensitygram image of
the sun.

- **Source:** `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMII.jpg`
  (and the 256px variant used as a fallback/thumbnail).
- **Function:** wired in `js/main.js` — sets the image `src`/`onerror`
  directly, no polling loop needed since the URL always serves the current
  latest image.
- **Note:** the filename is case-sensitive — `HMII` (capital I twice), not
  `HMIi`. An earlier bug had this typo'd, which silently 404'd the image;
  the URLs in both `index.html` and `js/main.js` were corrected together.
