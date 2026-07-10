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
// NOAA retired the entire /products/solar-wind/ directory (plasma-2-hour.json,
// plasma-1-day.json, mag-2-hour.json, mag-1-day.json all 404 now, verified
// directly against services.swpc.noaa.gov). Replaced with the new
// /json/rtsw/ real-time solar wind feed.
async function loadSolarWind() {
  try {
    const r   = await fetchWithTimeout('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json');
    const d   = await r.json();
    let row = null;
    for (let i = d.length - 1; i >= 0; i--) {
      if (d[i].proton_speed != null && d[i].proton_density != null) { row = d[i]; break; }
    }
    if (!row) throw new Error('no valid solar wind rows');
    const spd = parseFloat(row.proton_speed), den = parseFloat(row.proton_density);
    const el_sw_speed   = document.getElementById('sw-speed');   if (el_sw_speed)   el_sw_speed.textContent   = isNaN(spd) ? 'N/A' : spd.toFixed(1);
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = isNaN(den) ? 'N/A' : den.toFixed(2);
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Updated: Today at ' + utcTime(row.time_tag);
  } catch(e) {
    const el_sw_speed   = document.getElementById('sw-speed');   if (el_sw_speed)   el_sw_speed.textContent   = '---';
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = '---';
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Data unavailable';
  }
}

// ── IMF ──
// NOAA retired /products/solar-wind/mag-2-hour.json — replaced by /json/rtsw/rtsw_mag_1m.json
async function loadIMF() {
  try {
    const r   = await fetchWithTimeout('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json');
    const d   = await r.json();
    let row = null;
    for (let i = d.length - 1; i >= 0; i--) {
      if (d[i].bt != null && d[i].bz_gsm != null) { row = d[i]; break; }
    }
    if (!row) throw new Error('no valid IMF rows');
    const bt  = parseFloat(row.bt), bz = parseFloat(row.bz_gsm);
    const el_imf_bt      = document.getElementById('imf-bt');      if (el_imf_bt)      el_imf_bt.textContent  = isNaN(bt) ? 'N/A' : bt.toFixed(2);
    const el_imf_bz      = document.getElementById('imf-bz');      if (el_imf_bz)      el_imf_bz.textContent  = isNaN(bz) ? 'N/A' : bz.toFixed(2);
    const el_imf_dir     = document.getElementById('imf-dir');     if (el_imf_dir)     el_imf_dir.innerHTML   = (!isNaN(bz) && bz >= 0) ? '<span style="color:#009900">north</span>' : '<span style="color:#cc0000">south</span>';
    const el_imf_updated = document.getElementById('imf-updated'); if (el_imf_updated) el_imf_updated.textContent = 'Updated: Today at ' + utcTime(row.time_tag);
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

// ── STORM FORECAST (geomagnetic storm predictor, via Supabase) ──
async function loadStormPrediction() {
  const section = document.getElementById('storm-forecast-section');
  if (typeof supabase === 'undefined' || !section) return;
  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb
      .from('storm_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return; // nothing published yet — leave section hidden

    const row = data[0];
    const el_1h   = document.getElementById('storm-1h');          if (el_1h)   el_1h.textContent   = row.forecast_1h?.toFixed(1) ?? 'N/A';
    const el_3h   = document.getElementById('storm-3h');          if (el_3h)   el_3h.textContent   = row.forecast_3h?.toFixed(1) ?? 'N/A';
    const el_6h   = document.getElementById('storm-6h');          if (el_6h)   el_6h.textContent   = row.forecast_6h?.toFixed(1) ?? 'N/A';
    const el_prob = document.getElementById('storm-probability'); if (el_prob) el_prob.textContent = (row.storm_probability != null) ? (row.storm_probability * 100).toFixed(0) + '%' : 'N/A';
    const el_sev  = document.getElementById('storm-severity');    if (el_sev)  el_sev.textContent  = row.worst_severity ? '(' + row.worst_severity + ')' : '';
    const el_var  = document.getElementById('storm-model-variant'); if (el_var) el_var.textContent = row.model_variant ? '· ' + row.model_variant : '';

    const el_cme = document.getElementById('storm-cme-outlook');
    if (el_cme) {
      if (row.cme_outlook) { el_cme.textContent = '🛰️ ' + row.cme_outlook; el_cme.style.display = 'block'; }
      else { el_cme.style.display = 'none'; }
    }
    const el_mp = document.getElementById('storm-main-phase');
    if (el_mp) {
      if (row.main_phase_status) { el_mp.textContent = '⚡ ' + row.main_phase_status; el_mp.style.display = 'block'; }
      else { el_mp.style.display = 'none'; }
    }
    const el_updated = document.getElementById('storm-updated');
    if (el_updated) el_updated.textContent = 'Updated: ' + utcTime(row.created_at);

    section.style.display = 'block';
  } catch (e) {
    // storm_predictions table doesn't exist yet, or fetch failed — leave section hidden, don't break the page
  }
}

// ── SOLAR FLARE FORECAST (ISRO Aditya-L1 flare predictor, via Supabase) ──
async function loadFlareForecast() {
  const section = document.getElementById('flare-forecast-section');
  if (typeof supabase === 'undefined' || !section) return;
  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb
      .from('flare_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return; // nothing published yet — leave section hidden

    const row = data[0];

    // "none"/"None"/"N/A"-shaped values mean "nothing at this level" — filter
    // case-insensitively rather than an exact string match, since the source
    // API doesn't guarantee one casing.
    function isBlank(v) {
      if (v == null) return true;
      const s = String(v).trim().toLowerCase();
      return s === '' || s === 'none' || s === 'n/a' || s.startsWith('none (');
    }
    function pct(v) { return (v == null) ? 'N/A' : (Math.round(v * 10) / 10) + '%'; }

    const el_class   = document.getElementById('flare-current-class');   if (el_class)   el_class.textContent   = row.current_class ?? 'N/A';
    const el_meaning = document.getElementById('flare-class-meaning');   if (el_meaning) el_meaning.textContent = row.class_meaning ? '(' + row.class_meaning + ')' : '';
    const el_risk    = document.getElementById('flare-risk-level');      if (el_risk)    el_risk.textContent    = row.risk_level ? '· ' + row.risk_level : '';
    const el_regions = document.getElementById('flare-active-regions');  if (el_regions) el_regions.textContent = row.active_regions_count ?? 'N/A';

    const gp = row.global_probabilities || {};
    const el_cprobs = document.getElementById('flare-current-probs');
    if (el_cprobs) {
      el_cprobs.textContent = 'C ' + pct(gp.c_probability_pct) + ' / M ' + pct(gp.m_probability_pct) + ' / X ' + pct(gp.x_probability_pct);
    }

    // Nowcast — has its own c/m/x_class_probability_pct fields
    const nowcastBody = document.getElementById('flare-nowcast-body');
    if (nowcastBody) {
      const nc = row.nowcast;
      if (nc) {
        nowcastBody.textContent = 'C ' + pct(nc.c_class_probability_pct) + ' / M ' + pct(nc.m_class_probability_pct) + ' / X ' + pct(nc.x_class_probability_pct)
          + (nc.risk_level ? ' — ' + nc.risk_level : '');
      } else {
        nowcastBody.textContent = 'No nowcast published.';
      }
    }

    // Extended forecast — array of {time_horizon, c/m/x_class_chance_pct}, one line per horizon
    const forecastBody = document.getElementById('flare-forecast-body');
    if (forecastBody) {
      const fc = row.forecast;
      if (Array.isArray(fc) && fc.length) {
        forecastBody.innerHTML = fc.map(function (f) {
          return (f.time_horizon || (f.hours_ahead + 'h')) + ': C ' + pct(f.c_class_chance_pct) + ' / M ' + pct(f.m_class_chance_pct) + ' / X ' + pct(f.x_class_chance_pct);
        }).join('<br>');
      } else {
        forecastBody.textContent = 'No extended forecast published.';
      }
    }

    // Ensemble forecast — array of {time_horizon, combined: {class: probability}}
    const ensembleBody = document.getElementById('flare-ensemble-body');
    if (ensembleBody) {
      const ens = row.ensemble;
      if (Array.isArray(ens) && ens.length) {
        ensembleBody.innerHTML = ens.map(function (e) {
          const combined = e.combined || {};
          const parts = Object.keys(combined).map(function (k) { return k + ' ' + pct(combined[k] * (combined[k] <= 1 ? 100 : 1)); });
          return (e.time_horizon || (e.hours_ahead + 'h')) + ': ' + (parts.length ? parts.join(' / ') : (e.flare_class + ' ' + pct(e.probability)));
        }).join('<br>');
      } else {
        ensembleBody.textContent = 'No ensemble forecast published.';
      }
    }

    const el_cme = document.getElementById('flare-cme');
    if (el_cme) {
      if (row.cme_earth_directed_count) { el_cme.textContent = '☄️ ' + row.cme_earth_directed_count + ' Earth-directed CME(s) of ' + row.cme_total_count + ' tracked'; el_cme.style.display = 'block'; }
      else { el_cme.style.display = 'none'; }
    }

    const el_impact = document.getElementById('flare-earth-impact');
    if (el_impact) {
      const impact = row.earth_impact_today || {};
      const parts = [];
      ['radio_blackout', 'radiation_storm', 'geomagnetic_storm'].forEach(function (key) {
        const detail = impact[key];
        if (detail && !isBlank(detail.text)) parts.push(detail.text);
      });
      if (parts.length) { el_impact.textContent = '🌍 ' + parts.join('; '); el_impact.style.display = 'block'; }
      else { el_impact.style.display = 'none'; }
    }

    const el_watch = document.getElementById('flare-storm-watch');
    if (el_watch) {
      const watches = row.storm_watches;
      if (Array.isArray(watches) && watches.length) {
        const text = watches.slice(0, 2).map(function (w) {
          if (typeof w === 'string') return w;
          const days = Array.isArray(w.daily_forecast)
            ? w.daily_forecast.map(function (d) { return d.day + ': ' + d.level; }).join(', ')
            : '';
          return (w.peak_category ? w.peak_category + ' watch' : 'Storm watch') + (days ? ' — ' + days : '');
        }).join(' | ');
        el_watch.textContent = '⚠️ ' + text;
        el_watch.style.display = 'block';
      } else {
        el_watch.style.display = 'none';
      }
    }

    const el_updated = document.getElementById('flare-forecast-updated');
    if (el_updated) el_updated.textContent = 'Updated: ' + utcTime(row.created_at);

    section.style.display = 'block';
  } catch (e) {
    // flare_predictions table doesn't exist yet, or fetch failed — leave section hidden, don't break the page
  }
}

// ── FLARE FLUX CHART (image, uploaded by the flare predictor's GitHub Action) ──
function loadFlareFluxChart() {
  const img   = document.getElementById('flare-flux-chart-img');
  const empty = document.getElementById('flare-flux-chart-empty');
  const updated = document.getElementById('flare-flux-chart-updated');
  if (typeof SUPABASE_URL === 'undefined' || !img) return;

  const url = SUPABASE_URL + '/storage/v1/object/public/flare_charts/latest_flare_flux.png?t=' + Date.now();
  const probe = new Image();
  probe.onload = function () {
    img.src = url;
    img.style.display = 'inline-block';
    if (empty) empty.style.display = 'none';
    if (updated) updated.textContent = 'Chart updated: ' + utcTime(new Date().toISOString());
  };
  probe.onerror = function () {
    img.style.display = 'none';
    if (empty) empty.style.display = 'block';
  };
  probe.src = url;
}

// ── DST FORECAST-VS-ACTUAL CHART (image, uploaded by the predictor's GitHub Action) ──
function loadDstForecastChart() {
  const img   = document.getElementById('dst-forecast-chart-img');
  const empty = document.getElementById('dst-forecast-chart-empty');
  const updated = document.getElementById('dst-forecast-chart-updated');
  if (typeof SUPABASE_URL === 'undefined' || !img) return;

  const url = SUPABASE_URL + '/storage/v1/object/public/charts/latest_dst_forecast.png?t=' + Date.now();
  const probe = new Image();
  probe.onload = function () {
    img.src = url;
    img.style.display = 'inline-block';
    if (empty) empty.style.display = 'none';
    if (updated) updated.textContent = 'Chart updated: ' + utcTime(new Date().toISOString());
  };
  probe.onerror = function () {
    img.style.display = 'none';
    if (empty) empty.style.display = 'block';
  };
  probe.src = url;
}

// ── SUNSPOT NUMBER ──
async function loadSunspotNumber() {
  try {
    const r     = await fetchWithTimeout('https://www.sidc.be/SILSO/DATA/EISN/EISN_current.csv');
    const text  = await r.text();
    const lines = text.trim().split('\n').filter(l => l.trim());
    const last  = lines[lines.length - 1].split(',').map(s => s.trim());
    const ssn   = parseFloat(last[4]);
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mo    = parseInt(last[1], 10);
    const el_num = document.getElementById('sunspot-num');     if (el_num) el_num.textContent = isNaN(ssn) ? 'N/A' : Math.round(ssn);
    const el_upd = document.getElementById('sunspot-updated'); if (el_upd) el_upd.textContent = isNaN(ssn) ? 'Data unavailable' : ('Updated ' + last[2] + ' ' + (months[mo] || last[1]) + ' ' + last[0]);
  } catch(e) {
    const el_num = document.getElementById('sunspot-num');     if (el_num) el_num.textContent = '---';
    const el_upd = document.getElementById('sunspot-updated'); if (el_upd) el_upd.textContent = 'Data unavailable';
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
