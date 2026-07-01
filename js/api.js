// ── LIVE ALERT BANNER ────────────────────────────────────────────
var _alertState = { kp: 0, flareFlux: 0 };

function updateAlertBanner() {
  var banner = document.getElementById('alert-banner');
  var text   = document.getElementById('alert-text');
  var detail = document.getElementById('alert-detail');
  if (!banner || !text || !detail) return;

  var kp   = _alertState.kp;
  var flux = _alertState.flareFlux;

  var gLevel = 0;
  if (kp >= 9) gLevel = 5;
  else if (kp >= 8) gLevel = 4;
  else if (kp >= 7) gLevel = 3;
  else if (kp >= 6) gLevel = 2;
  else if (kp >= 5) gLevel = 1;

  function flareLabel(f) {
    if (f >= 1e-3) return 'X' + (f / 1e-4).toFixed(0);
    if (f >= 1e-4) return 'X' + (f / 1e-4).toFixed(1);
    if (f >= 1e-5) return 'M' + (f / 1e-5).toFixed(1);
    if (f >= 1e-6) return 'C' + (f / 1e-6).toFixed(1);
    if (f >= 1e-7) return 'B' + (f / 1e-7).toFixed(1);
    return 'A';
  }
  var flareStr   = flareLabel(flux);
  var flareLevel = flux >= 1e-4 ? 3 : flux >= 1e-5 ? 2 : flux >= 1e-6 ? 1 : 0;
  var maxLevel   = Math.max(gLevel, flareLevel);

  banner.className = '';
  if (maxLevel >= 3)       banner.classList.add('level-red');
  else if (maxLevel === 2) banner.classList.add('level-orange');
  else if (maxLevel === 1) banner.classList.add('level-yellow');

  var links = {
    storm: 'https://www.swpc.noaa.gov/noaa-scales-explanation',
    flare: 'https://spaceweather.com/glossary/flareclasses.html',
    kp:    'https://www.swpc.noaa.gov/products/planetary-k-index',
    calm:  'https://www.swpc.noaa.gov/products/real-time-solar-wind'
  };
  function makeLink(href, label) {
    return ' <a href="' + href + '" target="_blank" style="color:inherit;opacity:0.7;font-size:10px;font-weight:normal;text-decoration:underline;white-space:nowrap;">[' + label + ']</a>';
  }

  var parts = [];
  if (gLevel >= 1)    parts.push('G' + gLevel + ' Geomagnetic Storm (KP ' + kp.toFixed(0) + ')' + makeLink(links.storm, 'what is this?'));
  if (flareLevel >= 1) parts.push(flareStr + ' Solar Flare' + makeLink(links.flare, 'what is this?'));

  if (parts.length === 0) {
    text.innerHTML   = '● Space weather conditions are currently calm.' + makeLink(links.calm, 'learn more');
    detail.innerHTML = 'KP ' + kp.toFixed(0) + makeLink(links.kp, 'about KP') + ' &nbsp;·&nbsp; ' + flareStr + ' flare activity' + makeLink(links.flare, 'about flares');
  } else {
    text.innerHTML     = '⚠ ACTIVE ALERT: ' + parts.join(' &nbsp;·&nbsp; ');
    detail.textContent = '';
  }
}

// ── SOLAR WIND ──
function findLatestValidRow(d, speedIdx, densityIdx) {
  // NOAA sometimes flags the newest row(s) with literal "NaN" values, or the
  // "2-hour" endpoint can come back with only the header row (no data). Walk
  // backward from the end to find the last row with real numbers.
  if (!Array.isArray(d)) return null;
  for (let i = d.length - 1; i >= 1; i--) {
    const a = parseFloat(d[i][speedIdx]), b = parseFloat(d[i][densityIdx]);
    if (!isNaN(a) && !isNaN(b)) return { row: d[i], a, b };
  }
  return null;
}

async function loadSolarWind() {
  try {
    let r    = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json');
    let d    = await r.json();
    let hit  = findLatestValidRow(d, 2, 1);
    if (!hit) {
      // 2-hour feed came back empty/NaN — fall back to the 1-day feed, which
      // ends at the same latest reading but has historically been reliable.
      r   = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json');
      d   = await r.json();
      hit = findLatestValidRow(d, 2, 1);
    }
    const row = hit ? hit.row : d[d.length - 1];
    const spd = hit ? hit.a : NaN, den = hit ? hit.b : NaN;
    const el_sw_speed   = document.getElementById('sw-speed');   if (el_sw_speed)   el_sw_speed.textContent   = isNaN(spd) ? 'N/A' : spd.toFixed(1);
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = isNaN(den) ? 'N/A' : den.toFixed(2);
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Updated: Today at ' + utcTime(row[0]);
  } catch(e) {
    const el_sw_speed   = document.getElementById('sw-speed');   if (el_sw_speed)   el_sw_speed.textContent   = '---';
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = '---';
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Data unavailable';
  }
}

// ── IMF ──
async function loadIMF() {
  try {
    let r    = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/mag-2-hour.json');
    let d    = await r.json();
    let hit  = findLatestValidRow(d, 6, 3); // bt at index 6, bz at index 3
    if (!hit) {
      r   = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json');
      d   = await r.json();
      hit = findLatestValidRow(d, 6, 3);
    }
    const row = hit ? hit.row : d[d.length - 1];
    const bt  = hit ? hit.a : NaN, bz = hit ? hit.b : NaN;
    const el_imf_bt      = document.getElementById('imf-bt');      if (el_imf_bt)      el_imf_bt.textContent  = isNaN(bt) ? 'N/A' : bt.toFixed(2);
    const el_imf_bz      = document.getElementById('imf-bz');      if (el_imf_bz)      el_imf_bz.textContent  = isNaN(bz) ? 'N/A' : bz.toFixed(2);
    const el_imf_dir     = document.getElementById('imf-dir');     if (el_imf_dir)     el_imf_dir.innerHTML   = (!isNaN(bz) && bz >= 0) ? '<span style="color:#009900">north</span>' : '<span style="color:#cc0000">south</span>';
    const el_imf_updated = document.getElementById('imf-updated'); if (el_imf_updated) el_imf_updated.textContent = 'Updated: Today at ' + utcTime(row[0]);
  } catch(e) {
    const el_imf_bt = document.getElementById('imf-bt'); if (el_imf_bt) el_imf_bt.textContent = '---';
    const el_imf_bz = document.getElementById('imf-bz'); if (el_imf_bz) el_imf_bz.textContent = '---';
  }
}

// ── KP ──
async function loadKp() {
  try {
    const r      = await fetchWithTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const d      = await r.json();
    const latest = d[d.length - 1];
    const kp     = parseFloat(latest.Kp ?? latest[1]);
    const el_kp_now       = document.getElementById('kp-now');       if (el_kp_now)       el_kp_now.textContent     = isNaN(kp) ? 'N/A' : kp.toFixed(2);
    const el_kp_label     = document.getElementById('kp-label');     if (el_kp_label)     el_kp_label.innerHTML     = kpLabel(kp);
    drawKpBars(kp);
    const now = Date.now();
    let max24 = 0;
    for (let i = d.length - 1; i >= 1; i--) {
      const entry = d[i];
      const entryTime = new Date(entry.time_tag ?? entry[0]).getTime();
      if (now - entryTime > 86400000) break;
      const v = parseFloat(entry.Kp ?? entry[1]);
      if (!isNaN(v) && v > max24) max24 = v;
    }
    const el_kp_max       = document.getElementById('kp-max');       if (el_kp_max)       el_kp_max.textContent     = max24.toFixed(2);
    const el_kp_max_label = document.getElementById('kp-max-label'); if (el_kp_max_label) el_kp_max_label.innerHTML = kpLabel(max24);
    _alertState.kp = isNaN(kp) ? 0 : kp;
    updateAlertBanner();
  } catch(e) {
    const el_kp_now = document.getElementById('kp-now'); if (el_kp_now) el_kp_now.textContent = '---';
    const el_kp_max = document.getElementById('kp-max'); if (el_kp_max) el_kp_max.textContent = '---';
    drawKpBars(0);
  }
}

// ── FLARES ──
async function loadFlares() {
  try {
    const r   = await fetchWithTimeout('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json');
    const d   = await r.json();
    const now = Date.now();
    let max6 = 0, max24 = 0, time6 = '', time24 = '';
    for (const e of d) {
      if (e.energy !== '0.1-0.8nm') continue;
      const t = new Date(e.time_tag).getTime();
      const f = parseFloat(e.flux);
      if (isNaN(f)) continue;
      if (now - t <= 86400000 && f > max24) { max24 = f; time24 = e.time_tag; }
      if (now - t <=  21600000 && f > max6)  { max6  = f; time6  = e.time_tag; }
    }
    const el_flare_6hr      = document.getElementById('flare-6hr');      if (el_flare_6hr)      el_flare_6hr.textContent      = flareClass(max6);
    const el_flare_24hr     = document.getElementById('flare-24hr');     if (el_flare_24hr)     el_flare_24hr.textContent     = flareClass(max24);
    const el_flare_6hr_time = document.getElementById('flare-6hr-time'); if (el_flare_6hr_time) el_flare_6hr_time.textContent = time6  ? utcTime(time6)  : '';
    const el_flare_24hr_time= document.getElementById('flare-24hr-time');if (el_flare_24hr_time)el_flare_24hr_time.textContent= time24 ? utcTime(time24) : '';
    const el_flare_updated  = document.getElementById('flare-updated');  if (el_flare_updated)  el_flare_updated.textContent  = 'Updated: Today at: ' + new Date().toUTCString().slice(17,22) + ' UT';
    _alertState.flareFlux = max24;
    updateAlertBanner();
  } catch(e) {
    const el_flare_6hr  = document.getElementById('flare-6hr');  if (el_flare_6hr)  el_flare_6hr.textContent  = '---';
    const el_flare_24hr = document.getElementById('flare-24hr'); if (el_flare_24hr) el_flare_24hr.textContent = '---';
  }
}

// ── ASTEROIDS ──
const STATIC_ASTS = [
  { n:'2026 KC2',  d:'2026-May-25', ld:'7.8',  v:'10.3', m:'22',  today:true },
  { n:'2026 JW3',  d:'2026-May-25', ld:'13.2', v:'14.8', m:'65',  today:true },
  { n:'2026 KW',   d:'2026-May-25', ld:'3.5',  v:'18.4', m:'26',  today:true },
  { n:'2026 KO1',  d:'2026-May-25', ld:'7.1',  v:'3.1',  m:'10',  today:true },
  { n:'2023 JK1',  d:'2026-May-27', ld:'14.7', v:'8.5',  m:'36'  },
  { n:'2026 JJ',   d:'2026-May-27', ld:'18.8', v:'4.8',  m:'24'  },
  { n:'2026 KX1',  d:'2026-May-28', ld:'4.1',  v:'9.4',  m:'22'  },
  { n:'2026 KD1',  d:'2026-May-28', ld:'11',   v:'5.1',  m:'14'  },
  { n:'2026 HW2',  d:'2026-May-29', ld:'17.7', v:'12.5', m:'120' },
  { n:'2023 BM4',  d:'2026-May-30', ld:'12.2', v:'5.7',  m:'64'  },
  { n:'2026 KV',   d:'2026-Jun-01', ld:'10.1', v:'10.9', m:'28'  },
  { n:'2026 JN',   d:'2026-Jun-01', ld:'16',   v:'7.8',  m:'50'  },
  { n:'2026 KB1',  d:'2026-Jun-01', ld:'10.2', v:'13.5', m:'133' },
  { n:'2021 KN2',  d:'2026-Jun-03', ld:'8.9',  v:'8.9',  m:'7'   },
  { n:'2018 GE',   d:'2026-Jun-07', ld:'16.4', v:'3.1',  m:'11'  },
  { n:'2016 VS',   d:'2026-Jun-12', ld:'20',   v:'11.1', m:'12'  },
  { n:'530520',    d:'2026-Jun-12', ld:'16.1', v:'14.6', m:'152' },
  { n:'2003 LN6',  d:'2026-Jun-18', ld:'3.7',  v:'3.9',  m:'41'  },
  { n:'2025 WC4',  d:'2026-Jun-21', ld:'10.2', v:'19.2', m:'304' },
  { n:'152637',    d:'2026-Jun-27', ld:'6.7',  v:'8.9',  m:'947' },
  { n:'523808',    d:'2026-Jul-04', ld:'9.1',  v:'16.8', m:'479' },
  { n:'2023 YO1',  d:'2026-Jul-05', ld:'6.5',  v:'2.7',  m:'23'  },
  { n:'2007 AA2',  d:'2026-Jul-11', ld:'17.8', v:'7.2',  m:'43'  },
];

function renderAsteroids(list) {
  const tbody = document.getElementById('ast-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const a of list) {
    const tr  = document.createElement('tr');
    if (a.today || a.t) tr.className = 'today-ast';
    const enc = encodeURIComponent(a.n || a.name);
    tr.innerHTML = `<td><a href="https://ssd.jpl.nasa.gov/sbdb.cgi?sstr=${enc}&orb=1" target="_blank" style="font-size:9px;">${a.n||a.name}</a></td><td style="font-size:9px;">${a.d||a.date}</td><td style="text-align:center;font-size:9px;">${a.ld||a.miss}</td><td style="text-align:center;font-size:9px;">${a.v||a.vel}</td><td style="text-align:center;font-size:9px;">${a.m||a.dia}</td>`;
    tbody.appendChild(tr);
  }
}

async function loadAsteroids() {
  renderAsteroids(STATIC_ASTS);
  try {
    const today = new Date();
    const end   = new Date(); end.setDate(today.getDate() + 7);
    const fmt   = x => x.toISOString().slice(0, 10);
    const key   = (typeof NASA_API_KEY !== 'undefined' && NASA_API_KEY && !NASA_API_KEY.startsWith('PASTE_') && !NASA_API_KEY.startsWith('YOUR_')) ? NASA_API_KEY : 'DEMO_KEY';
    const resp  = await fetchWithTimeout(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(today)}&end_date=${fmt(end)}&api_key=${key}`);
    const json  = await resp.json();
    if (json.near_earth_objects) {
      const rows = [];
      for (const [date, neos] of Object.entries(json.near_earth_objects)) {
        for (const neo of neos) {
          const ca         = neo.close_approach_data[0];
          const today_flag = date === fmt(today);
          rows.push({
            n:     neo.name.replace(/[()]/g, ''),
            d:     date,
            ld:    parseFloat(ca.miss_distance.lunar).toFixed(1),
            v:     parseFloat(ca.relative_velocity.kilometers_per_second).toFixed(1),
            m:     Math.round((neo.estimated_diameter.meters.estimated_diameter_min + neo.estimated_diameter.meters.estimated_diameter_max) / 2),
            today: today_flag
          });
        }
      }
      rows.sort((a, b) => a.d.localeCompare(b.d));
      if (rows.length > 0) renderAsteroids(rows);
    }
  } catch(e) { /* keep static */ }
}
