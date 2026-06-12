(function(){
    // Init Leaflet map inside the wrap div
    var wrap = document.getElementById('india-map-inner');
    if (!wrap) return;
    wrap.style.position = 'absolute';
    wrap.style.top = 0; wrap.style.left = 0;
    wrap.style.right = 0; wrap.style.bottom = 0;
    var outer = document.getElementById('india-map-wrap');
    outer.style.paddingBottom = '';
    outer.style.height = '420px';
    outer.style.cursor = 'crosshair';

    var map = L.map('india-map-inner', {
      center: [22.5, 82.5],
      zoom: 4,
      minZoom: 4,
      maxZoom: 10,
      maxBounds: [[5, 66], [38, 98]],
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // NRSC HQ marker
    var nrscIcon = L.divIcon({
      html: '<div style="background:#cc0000;color:#fff;font-size:9px;font-weight:bold;padding:2px 4px;border-radius:2px;white-space:nowrap;border:1px solid #800000;">NRSC</div>',
      className: '', iconAnchor: [16, 8]
    });
    L.marker([17.3850, 78.4867], {icon: nrscIcon})
      .addTo(map)
      .bindTooltip('NRSC · Hyderabad', {permanent:false, direction:'right'});

    // Click handler — reverse geocode via Nominatim
    var clickMarker = null;
    map.on('click', function(e){
      var lat = e.latlng.lat.toFixed(5);
      var lon = e.latlng.lng.toFixed(5);

      // Place/move pin
      if(clickMarker) map.removeLayer(clickMarker);
      clickMarker = L.circleMarker(e.latlng, {
        radius:7, color:'#cc0000', fillColor:'#ff4444',
        fillOpacity:0.9, weight:2
      }).addTo(map);

      // Show popup with lat/lon immediately
      const el_pop_lat = document.getElementById('pop-lat'); if (el_pop_lat) el_pop_lat.textContent = lat + '° N';
      const el_pop_lon = document.getElementById('pop-lon'); if (el_pop_lon) el_pop_lon.textContent = lon + '° E';
      const el_pop_area = document.getElementById('pop-area'); if (el_pop_area) el_pop_area.textContent = 'Fetching...';
      const el_pop_state = document.getElementById('pop-state'); if (el_pop_state) el_pop_state.textContent = 'Fetching...';

      var popup = document.getElementById('map-popup');
      popup.style.display = 'block';
      // Position popup near click but inside viewport
      var px = e.originalEvent.clientX;
      var py = e.originalEvent.clientY;
      var pw = 230, ph = 160;
      var vw = window.innerWidth, vh = window.innerHeight;
      popup.style.left = (px + pw + 12 > vw ? px - pw - 8 : px + 12) + 'px';
      popup.style.top  = (py + ph > vh ? py - ph : py) + 'px';

      // Reverse geocode via BigDataCloud (no API key, CORS-friendly)
      fetchWithTimeout('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+lon+'&localityLanguage=en')
        .then(function(r){ return r.json(); })
        .then(function(d){
          var area = d.locality || d.city || d.principalSubdivisionCode || 'Unknown';
          var state = d.principalSubdivision || 'Unknown';
          var country = d.countryName || '';
          const el_pop_area = document.getElementById('pop-area'); if (el_pop_area) el_pop_area.textContent = area;
          const el_pop_state = document.getElementById('pop-state'); if (el_pop_state) el_pop_state.textContent = state + (country && country !== 'India' ? ' (' + country + ')' : '');
        })
        .catch(function(){
          const el_pop_area = document.getElementById('pop-area'); if (el_pop_area) el_pop_area.textContent = 'Unavailable';
          const el_pop_state = document.getElementById('pop-state'); if (el_pop_state) el_pop_state.textContent = 'Unavailable';
        });
    });

    // Close popup on map drag
    map.on('dragstart', function(){
      document.getElementById('map-popup').style.display = 'none';
    });
  })();

// Date banner
(function(){
  const d = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cd = document.getElementById('center-date');
  if(cd) cd.textContent =
    days[d.getDay()] + ', ' + months[d.getMonth()] + '. ' + d.getDate() + ', ' + d.getFullYear();
  const sdl = document.getElementById('sun-date-label');
  if(sdl) sdl.textContent =
    d.getDate() + ' ' + months[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
})();

// Sun toggle
const SUN = {
  labels:   'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIi.jpg',
  nolabels: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIB.jpg'
};
function setSunMode(m) {
  const sunImgEl = document.getElementById('sun-img'); if(sunImgEl) sunImgEl.src = SUN[m] + '?nc=' + Date.now();
  document.getElementById('lnk-labels').style.textDecoration   = m==='labels'   ? 'none' : 'underline';
  document.getElementById('lnk-nolabels').style.textDecoration = m==='nolabels' ? 'none' : 'underline';
}

// Aurora switcher
function setAurora(r) {
  const u = {
    north:  'https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg',
    europe: 'https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg',
    south:  'https://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.jpg',
    nz:     'https://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.jpg'
  };
  const auroraImgEl = document.getElementById('aurora-img'); if(auroraImgEl) auroraImgEl.src = u[r] + '?nc=' + Date.now();
}

// KP helper
function kpLabel(v) {
  if (v < 1) return '<span class="kp-quiet">quiet</span>';
  if (v < 2) return '<span class="kp-quiet">quiet</span>';
  if (v < 3) return '<span class="kp-quiet">quiet</span>';
  if (v < 4) return '<span class="kp-unsettled">unsettled</span>';
  if (v < 5) return '<span class="kp-active">active</span>';
  if (v < 6) return '<span class="kp-storm">minor storm</span>';
  return '<span class="kp-storm">storm</span>';
}
function drawKpBars(kp) {
  const wrap = document.getElementById('kp-bars');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const bar = document.createElement('div');
    bar.className = 'kp-bar';
    const lit = i < Math.round(kp);
    bar.classList.add(lit ? 'lit' : 'unlit');
    if (i >= 5 && lit) bar.classList.add('storm');
    else if (i >= 3 && lit) bar.classList.add('active');
    wrap.appendChild(bar);
  }
}

// Flare class from flux
function flareClass(flux) {
  if (!flux || flux <= 0) return 'A1.0';
  if (flux < 1e-7) return 'A' + (flux/1e-8).toFixed(1);
  if (flux < 1e-6) return 'B' + (flux/1e-7).toFixed(1);
  if (flux < 1e-5) return 'C' + (flux/1e-6).toFixed(1);
  if (flux < 1e-4) return 'M' + (flux/1e-5).toFixed(1);
  return 'X' + (flux/1e-4).toFixed(1);
}

// UTC time string helper
function utcTime(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toUTCString().slice(17, 22) + ' UT';
  } catch(e) { return ''; }
}

// ── FETCH WITH TIMEOUT — stops tab spinner from hanging API calls ──
function fetchWithTimeout(url) {
  var ctrl = new AbortController();
  setTimeout(function(){ ctrl.abort(); }, 6000);
  return fetch(url, { signal: ctrl.signal });
}

// ── SOLAR WIND ──
async function loadSolarWind() {
  try {
    const r = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json');
    const d = await r.json();
    const row = d[d.length-1];
    const spd = parseFloat(row[2]), den = parseFloat(row[1]);
    const el_sw_speed = document.getElementById('sw-speed'); if (el_sw_speed) el_sw_speed.textContent   = isNaN(spd) ? 'N/A' : spd.toFixed(1);
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = isNaN(den) ? 'N/A' : den.toFixed(2);
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Updated: Today at ' + utcTime(row[0]);
  } catch(e) {
    const el_sw_speed = document.getElementById('sw-speed'); if (el_sw_speed) el_sw_speed.textContent   = '---';
    const el_sw_density = document.getElementById('sw-density'); if (el_sw_density) el_sw_density.textContent = '---';
    const el_sw_updated = document.getElementById('sw-updated'); if (el_sw_updated) el_sw_updated.textContent = 'Data unavailable';
  }
}

// ── IMF ──
async function loadIMF() {
  try {
    const r = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/mag-2-hour.json');
    const d = await r.json();
    const row = d[d.length-1];
    const bt = parseFloat(row[6]), bz = parseFloat(row[3]);
    const el_imf_bt = document.getElementById('imf-bt'); if (el_imf_bt) el_imf_bt.textContent  = isNaN(bt) ? 'N/A' : bt.toFixed(2);
    const el_imf_bz = document.getElementById('imf-bz'); if (el_imf_bz) el_imf_bz.textContent  = isNaN(bz) ? 'N/A' : bz.toFixed(2);
    const el_imf_dir = document.getElementById('imf-dir'); if (el_imf_dir) el_imf_dir.innerHTML   = bz >= 0
      ? '<span style="color:#009900">north</span>'
      : '<span style="color:#cc0000">south</span>';
    const el_imf_updated = document.getElementById('imf-updated'); if (el_imf_updated) el_imf_updated.textContent = 'Updated: Today at ' + utcTime(row[0]);
  } catch(e) {
    const el_imf_bt = document.getElementById('imf-bt'); if (el_imf_bt) el_imf_bt.textContent = '---';
    const el_imf_bz = document.getElementById('imf-bz'); if (el_imf_bz) el_imf_bz.textContent = '---';
  }
}

// ── KP ──
async function loadKp() {
  try {
    const r = await fetchWithTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const d = await r.json();
    const latest = d[d.length-1];
    const kp = parseFloat(latest[1]);
    const el_kp_now = document.getElementById('kp-now'); if (el_kp_now) el_kp_now.textContent = isNaN(kp) ? 'N/A' : kp.toFixed(2);
    const el_kp_label = document.getElementById('kp-label'); if (el_kp_label) el_kp_label.innerHTML = kpLabel(kp);
    drawKpBars(kp);
    const now = Date.now();
    let max24 = 0;
    for (let i = d.length-1; i >= 1; i--) {
      if (now - new Date(d[i][0]).getTime() > 86400000) break;
      const v = parseFloat(d[i][1]);
      if (!isNaN(v) && v > max24) max24 = v;
    }
    const el_kp_max = document.getElementById('kp-max'); if (el_kp_max) el_kp_max.textContent = max24.toFixed(2);
    const el_kp_max_label = document.getElementById('kp-max-label'); if (el_kp_max_label) el_kp_max_label.innerHTML = kpLabel(max24);
  } catch(e) {
    const el_kp_now = document.getElementById('kp-now'); if (el_kp_now) el_kp_now.textContent = '---';
    const el_kp_max = document.getElementById('kp-max'); if (el_kp_max) el_kp_max.textContent = '---';
    drawKpBars(0);
  }
}

// ── FLARES ──
async function loadFlares() {
  try {
    const r = await fetchWithTimeout('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json');
    const d = await r.json();
    const now = Date.now();
    let max6=0, max24=0, time6='', time24='';
    for (const e of d) {
      if (e.energy !== '0.1-0.8nm') continue;
      const t = new Date(e.time_tag).getTime();
      const f = parseFloat(e.flux);
      if (isNaN(f)) continue;
      if (now - t <= 86400000 && f > max24) { max24 = f; time24 = e.time_tag; }
      if (now - t <=  21600000 && f > max6)  { max6  = f; time6  = e.time_tag; }
    }
    const el_flare_6hr = document.getElementById('flare-6hr'); if (el_flare_6hr) el_flare_6hr.textContent       = flareClass(max6);
    const el_flare_24hr = document.getElementById('flare-24hr'); if (el_flare_24hr) el_flare_24hr.textContent      = flareClass(max24);
    const el_flare_6hr_time = document.getElementById('flare-6hr-time'); if (el_flare_6hr_time) el_flare_6hr_time.textContent  = time6  ? utcTime(time6)  : '';
    const el_flare_24hr_time = document.getElementById('flare-24hr-time'); if (el_flare_24hr_time) el_flare_24hr_time.textContent = time24 ? utcTime(time24) : '';
    const el_flare_updated = document.getElementById('flare-updated'); if (el_flare_updated) el_flare_updated.textContent   = 'Updated: Today at: ' + new Date().toUTCString().slice(17,22) + ' UT';
  } catch(e) {
    const el_flare_6hr = document.getElementById('flare-6hr'); if (el_flare_6hr) el_flare_6hr.textContent  = '---';
    const el_flare_24hr = document.getElementById('flare-24hr'); if (el_flare_24hr) el_flare_24hr.textContent = '---';
  }
}

// ── ASTEROIDS ──
const STATIC_ASTS = [
  { n:'2026 KC2',  d:'2026-May-25', ld:'7.8',  v:'10.3', m:'22',  today:true },
  { n:'2026 JW3',  d:'2026-May-25', ld:'13.2', v:'14.8', m:'65',  today:true },
  { n:'2026 KW',   d:'2026-May-25', ld:'3.5',  v:'18.4', m:'26',  today:true },
  { n:'2026 KO1',  d:'2026-May-25', ld:'7.1',  v:'3.1',  m:'10',  today:true },
  { n:'2023 JK1',  d:'2026-May-27', ld:'14.7', v:'8.5',  m:'36' },
  { n:'2026 JJ',   d:'2026-May-27', ld:'18.8', v:'4.8',  m:'24' },
  { n:'2026 KX1',  d:'2026-May-28', ld:'4.1',  v:'9.4',  m:'22' },
  { n:'2026 KD1',  d:'2026-May-28', ld:'11',   v:'5.1',  m:'14' },
  { n:'2026 HW2',  d:'2026-May-29', ld:'17.7', v:'12.5', m:'120' },
  { n:'2023 BM4',  d:'2026-May-30', ld:'12.2', v:'5.7',  m:'64' },
  { n:'2026 KV',   d:'2026-Jun-01', ld:'10.1', v:'10.9', m:'28' },
  { n:'2026 JN',   d:'2026-Jun-01', ld:'16',   v:'7.8',  m:'50' },
  { n:'2026 KB1',  d:'2026-Jun-01', ld:'10.2', v:'13.5', m:'133' },
  { n:'2021 KN2',  d:'2026-Jun-03', ld:'8.9',  v:'8.9',  m:'7' },
  { n:'2018 GE',   d:'2026-Jun-07', ld:'16.4', v:'3.1',  m:'11' },
  { n:'2016 VS',   d:'2026-Jun-12', ld:'20',   v:'11.1', m:'12' },
  { n:'530520',    d:'2026-Jun-12', ld:'16.1', v:'14.6', m:'152' },
  { n:'2003 LN6',  d:'2026-Jun-18', ld:'3.7',  v:'3.9',  m:'41' },
  { n:'2025 WC4',  d:'2026-Jun-21', ld:'10.2', v:'19.2', m:'304' },
  { n:'152637',    d:'2026-Jun-27', ld:'6.7',  v:'8.9',  m:'947' },
  { n:'523808',    d:'2026-Jul-04', ld:'9.1',  v:'16.8', m:'479' },
  { n:'2023 YO1',  d:'2026-Jul-05', ld:'6.5',  v:'2.7',  m:'23' },
  { n:'2007 AA2',  d:'2026-Jul-11', ld:'17.8', v:'7.2',  m:'43' },
];

function renderAsteroids(list) {
  const tbody = document.getElementById('ast-tbody');
  tbody.innerHTML = '';
  for (const a of list) {
    const tr = document.createElement('tr');
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
    const end = new Date(); end.setDate(today.getDate()+7);
    const fmt = x => x.toISOString().slice(0,10);
    const resp = await fetchWithTimeout(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(today)}&end_date=${fmt(end)}&api_key=DEMO_KEY`);
    const json = await resp.json();
    if (json.near_earth_objects) {
      const rows = [];
      for (const [date, neos] of Object.entries(json.near_earth_objects)) {
        for (const neo of neos) {
          const ca = neo.close_approach_data[0];
          const today_flag = date === fmt(today);
          rows.push({
            n: neo.name.replace(/[()]/g,''),
            d: date,
            ld: parseFloat(ca.miss_distance.lunar).toFixed(1),
            v: parseFloat(ca.relative_velocity.kilometers_per_second).toFixed(1),
            m: Math.round((neo.estimated_diameter.meters.estimated_diameter_min + neo.estimated_diameter.meters.estimated_diameter_max)/2),
            today: today_flag
          });
        }
      }
      rows.sort((a,b) => a.d.localeCompare(b.d));
      if (rows.length > 0) renderAsteroids(rows);
    }
  } catch(e) { /* keep static */ }
}

// ── TIME MACHINE DROPDOWNS ──
(function() {
  const dayEl = document.getElementById('arc-day');
  for (let i = 1; i <= 31; i++) {
    const o = document.createElement('option');
    o.textContent = o.value = i;
    if (i === 25) o.selected = true;
    dayEl.appendChild(o);
  }
  const yearEl = document.getElementById('arc-year');
  const cy = new Date().getFullYear();
  for (let y = cy; y >= 2000; y--) {
    const o = document.createElement('option');
    o.textContent = o.value = y;
    if (y === cy) o.selected = true;
    yearEl.appendChild(o);
  }
})();

function archiveGo() {
  const arcMonth = document.getElementById('arc-month');
  if(!arcMonth) return;
  const m = arcMonth.value;
  const d = document.getElementById('arc-day').value;
  const y = document.getElementById('arc-year').value;
  alert('Loading archived space weather data for ' + m + ' ' + d + ', ' + y + '.\n\nIn a full production environment, this would load the historical SpaceWeather.com page for that date from the archive database.');
}

// ── INIT ──
loadSolarWind();
loadIMF();
loadKp();
loadFlares();
loadAsteroids();
setInterval(() => { loadSolarWind(); loadIMF(); loadKp(); loadFlares(); }, 300000);


// ══════════ PAGE NAVIGATION ══════════
function showPage(name) {
  if (name === 'home') window.location.href = 'index.html';
  if (name === 'upload') window.location.href = 'upload.html';
  if (name === 'confirm') window.location.href = 'confirm.html';
}

// ── Populate dropdowns — moved into DOMContentLoaded so elements are guaranteed to exist ──

// ── Thumbnail preview ──
function showThumb(input){
  const thumb = input.parentElement.querySelector('.file-thumb');
  if(input.files && input.files[0]){
    const r=new FileReader();
    r.onload=e=>{thumb.src=e.target.result;thumb.style.display='block';};
    r.readAsDataURL(input.files[0]);
  } else {thumb.style.display='none';thumb.src='';}
}

// ── Generate ref ID ──
function genRef(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r='NRSC-SW-';
  for(let i=0;i<8;i++) r+=c[Math.floor(Math.random()*c.length)];
  return r;
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}



// ── RESET FORM ──
function resetUploadForm(){
  ['f-name','f-email','f-what','f-website','f-desc','f-location'].forEach(id=>{
    document.getElementById(id).value='';
  });
  document.getElementById('f-month').value='';
  document.getElementById('f-day').value='';
  document.getElementById('f-year').value=new Date().getFullYear();
  document.getElementById('f-category').value='';
  document.querySelectorAll('.photo-input').forEach(inp=>{
    inp.value='';
    const t=inp.parentElement.querySelector('.file-thumb');
    if(t){t.style.display='none';t.src='';}
  });
  showPage('upload');
}



// ══════════════════════════════════════════════════
// INJECT SUBMITTED DATA INTO HOME DASHBOARD
// ══════════════════════════════════════════════════
function injectIntoDashboard(data) {
  // Inject user submission as an article in the center column
  const userArticleDiv = document.getElementById('user-article');
  if (userArticleDiv) {
    const metaParts = [];
    if (data.name)     metaParts.push('📷 ' + escHtml(data.name));
    if (data.location) metaParts.push('📍 ' + escHtml(data.location));
    if (data.dateStr && data.dateStr !== '(not specified)') metaParts.push('📅 ' + escHtml(data.dateStr));
    if (data.category) metaParts.push('🏷️ ' + escHtml(data.category));

    const imgHtml = data.firstImageSrc
      ? '<img class="user-article-img" src="' + data.firstImageSrc + '" alt="' + escHtml(data.what) + '">'
      : '';

    const websiteHtml = data.website
      ? '<div style="font-size:11px;margin-top:5px;"><b>More images:</b> <a href="' + escHtml(data.website) + '" target="_blank">' + escHtml(data.website) + '</a></div>'
      : '';

    userArticleDiv.innerHTML =
      '<div class="user-article-badge">🛰️ NRSC Space Weather &nbsp;·&nbsp; READER OBSERVATION</div>' +
      '<div class="user-article-inner">' +
        '<div class="user-article-head">' + escHtml((data.what || 'SPACE WEATHER OBSERVATION').toUpperCase()) + ':</div>' +
        '<div class="user-article-meta">' + metaParts.join(' &nbsp;|&nbsp; ') + '</div>' +
        imgHtml +
        (data.desc ? '<div class="user-article-desc">' + escHtml(data.desc) + '</div>' : '') +
        websiteHtml +
      '</div>';

    userArticleDiv.style.display = 'block';
  }
}

async function handleSubmit() {
  const _sbClient = (typeof supabase !== 'undefined')
    ? supabase.createClient(
        'https://tkwktiuqbafddghceyue.supabase.co',
        'sb_publishable_8S0mPmwjshXTiYS7tgjk5A_WLCVeiJE'
      )
    : null;
  const name     = document.getElementById('f-name').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const what     = document.getElementById('f-what').value.trim();
  const website  = document.getElementById('f-website').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const dateVal  = document.getElementById('f-date').value;
  const location = document.getElementById('f-location').value.trim();
  const category = document.getElementById('f-category').value;

  if (!name)     { alert('Please enter your name.');  return; }
  if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
  if (!what)     { alert('Please tell us what you saw.'); return; }
  if (!desc)     { alert('Please tell us more about what it was like (description).'); return; }
  if (!dateVal)  { alert('Please select the date of observation.'); return; }
  if (!location) { alert('Please enter where you observed the object (location).'); return; }
  if (!category) { alert('Please select a category.'); return; }

  const allInputs = document.querySelectorAll('.photo-input');
  const files = [];
  allInputs.forEach(inp => { if (inp.files && inp.files[0]) files.push(inp.files[0]); });
  if (files.length === 0) { alert('Please upload at least one photo.'); return; }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  const dateStr = new Date(dateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  let photoUrls = [];
  let firstImageSrc = null;

  try {
    if (!_sbClient) throw new Error('Supabase SDK not loaded.');

    // Upload each photo to Storage
    for (const file of files) {
      const ext  = file.name.split('.').pop();
      const path = `submissions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await _sbClient.storage
        .from('space-weather-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = _sbClient.storage
        .from('space-weather-photos')
        .getPublicUrl(path);
      photoUrls.push(urlData.publicUrl);
    }

    // Insert row into submissions table
    const { error: dbErr } = await _sbClient.from('submissions').insert({
      name,
      email,
      what_observed: what,
      website:       website || null,
      description:   desc,
      observation_date: dateStr,
      location,
      category,
      photo_urls:    photoUrls,
    });
    if (dbErr) throw dbErr;

    // Read first image as data URL for confirm page preview
    firstImageSrc = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = e => res(e.target.result);
      reader.onerror = () => rej(new Error('File read failed'));
      reader.readAsDataURL(files[0]);
    });

  } catch (err) {
    console.error('Submission error:', err);
    alert('Submission failed: ' + (err.message || err));
    btn.disabled = false;
    btn.textContent = 'Submit';
    return;
  }

  localStorage.setItem('sw_submission', JSON.stringify(
    { name, email, what, website, desc, dateStr, location, category, firstImageSrc, photoUrls }
  ));
  window.location.href = 'confirm.html';
}

// Article image upload handler
function loadImg(input, slotId) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = document.getElementById(slotId + '-img');
    var ph  = document.getElementById(slotId + '-ph');
    var slot = document.getElementById(slotId);
    img.src = e.target.result;
    img.style.display = 'block';
    ph.style.display  = 'none';
    // Allow clicking image to re-upload
    slot.title = 'Click to change image';
  };
  reader.readAsDataURL(input.files[0]);
}


window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('f-date');
  if (dateInput) dateInput.max = new Date().toISOString().split('T')[0];

  const dayEl = document.getElementById('f-day');
  if (dayEl) {
    for (let i = 1; i <= 31; i++) { const o = document.createElement('option'); o.textContent = o.value = i; dayEl.appendChild(o); }
  }
  const yearEl = document.getElementById('f-year');
  if (yearEl) {
    const cy = new Date().getFullYear();
    for (let y = cy; y >= 2000; y--) { const o = document.createElement('option'); o.textContent = o.value = y; yearEl.appendChild(o); }
  }

  const path = window.location.pathname;
  const isConfirmPage = path.includes('confirm.html');
  const isHomePage = path.includes('index.html') || path.endsWith('/');
  
  const subDataStr = localStorage.getItem('sw_submission');
  const submissionData = subDataStr ? JSON.parse(subDataStr) : null;

  if (isConfirmPage && submissionData) {
    const rows = [
      ['Name', submissionData.name||'—'], ['Email', submissionData.email||'—'], ['What was observed', submissionData.what||'—'],
      ['Website', submissionData.website||'—'], ['Description', submissionData.desc||'—'],
      ['Date of observation', submissionData.dateStr], ['Location', submissionData.location||'—'],
      ['Category', submissionData.category||'—'],
      ['Submitted at', new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST'],
    ];
    const tbody = document.getElementById('summary-body');
    if (tbody) {
      tbody.innerHTML = '';
      rows.forEach(([k,v]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + escHtml(k) + '</td><td>' + escHtml(v) + '</td>';
        tbody.appendChild(tr);
      });
    }

    const photoArea = document.getElementById('confirm-photo-area');
    if (photoArea && submissionData.firstImageSrc) {
      photoArea.innerHTML = '';
      const bigWrap = document.createElement('div');
      bigWrap.className = 'submitted-img-wrap';
      const bigImg = document.createElement('img');
      bigImg.src = submissionData.firstImageSrc;
      const caption = document.createElement('div');
      caption.className = 'img-caption';
      caption.textContent = '📷 ' + submissionData.what;
      bigWrap.appendChild(bigImg);
      bigWrap.appendChild(caption);
      photoArea.appendChild(bigWrap);
    }
    
    const confirmIdVal = document.getElementById('confirm-id-val');
    if (confirmIdVal) confirmIdVal.textContent = 'REF# ' + genRef();
  }

  if (isHomePage && submissionData) {
    injectIntoDashboard(submissionData);
  }
});
