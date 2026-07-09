# Photo Submissions (upload / confirm flow)

Lets site visitors submit their own space-weather photos (aurora, sunspots,
comets, etc.), which are stored and then reviewed/displayed.

- **Submission form:** `upload.html` / `js/upload.js` / `css/upload.css`.
  Includes basic form persistence (fields survive a reload/navigation before
  submit).
- **Review/confirmation page:** `confirm.html` / `js/confirm.js` /
  `css/confirm.css`.
- **Storage:** images and metadata are stored in Supabase (a `submissions`
  table plus Supabase Storage for the image files) — not `localStorage`.
  This was an intentional change from an earlier `localStorage`-based
  prototype, since `localStorage` doesn't persist across devices/browsers or
  survive a user clearing site data.
- **Home page tie-in:** the most recent 5 submissions are queried directly
  from `js/main.js`'s `DOMContentLoaded` handler (`sb.from('submissions')...`)
  and can be surfaced alongside the static articles.
