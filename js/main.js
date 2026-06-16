// ── Date banner ──
(function () {
  const d      = new Date();
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cd  = document.getElementById('center-date');
  if (cd)  cd.textContent  = days[d.getDay()] + ', ' + months[d.getMonth()] + '. ' + d.getDate() + ', ' + d.getFullYear();
  const sdl = document.getElementById('sun-date-label');
  if (sdl) sdl.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
})();

// ── Sun image toggle ──
const SUN = {
  labels:   'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIi.jpg',
  nolabels: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIB.jpg'
};
function setSunMode(m) {
  const el = document.getElementById('sun-img');
  if (el) el.src = SUN[m] + '?nc=' + Date.now();
  document.getElementById('lnk-labels').style.textDecoration   = m === 'labels'   ? 'none' : 'underline';
  document.getElementById('lnk-nolabels').style.textDecoration = m === 'nolabels' ? 'none' : 'underline';
}

// ── Aurora switcher ──
function setAurora(r) {
  const u = {
    north:  'https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg',
    europe: 'https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg',
    south:  'https://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.jpg',
    nz:     'https://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.jpg'
  };
  const el = document.getElementById('aurora-img');
  if (el) el.src = u[r] + '?nc=' + Date.now();
}

// ── Time machine dropdowns ──
(function () {
  const dayEl = document.getElementById('arc-day');
  if (dayEl) {
    for (let i = 1; i <= 31; i++) {
      const o = document.createElement('option');
      o.textContent = o.value = i;
      if (i === new Date().getDate()) o.selected = true;
      dayEl.appendChild(o);
    }
  }
  const yearEl = document.getElementById('arc-year');
  if (yearEl) {
    const cy = new Date().getFullYear();
    for (let y = cy; y >= 2000; y--) {
      const o = document.createElement('option');
      o.textContent = o.value = y;
      if (y === cy) o.selected = true;
      yearEl.appendChild(o);
    }
  }
})();

function archiveGo() {
  const m = document.getElementById('arc-month');
  const d = document.getElementById('arc-day');
  const y = document.getElementById('arc-year');
  if (!m) return;
  alert('Loading archived space weather data for ' + m.value + ' ' + d.value + ', ' + y.value + '.\n\nIn a full production environment, this would load the historical data for that date.');
}

// ── Article image upload slot ──
function loadImg(input, slotId) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var img  = document.getElementById(slotId + '-img');
    var ph   = document.getElementById(slotId + '-ph');
    var slot = document.getElementById(slotId);
    img.src = e.target.result;
    img.style.display = 'block';
    ph.style.display  = 'none';
    slot.title = 'Click to change image';
  };
  reader.readAsDataURL(input.files[0]);
}

// ── Dashboard: render community submissions ──
var _photoRows = [];
var _photoIndex = 0;

function photoNav(dir) {
  if (_photoRows.length === 0) return;
  _photoIndex = (_photoIndex + dir + _photoRows.length) % _photoRows.length;
  renderPhotoCard();
}

function renderPhotoCard() {
  var slot = document.getElementById('photo-card-slot');
  var pos  = document.getElementById('photo-nav-pos');
  if (!slot) return;

  var row      = _photoRows[_photoIndex];
  var name     = row.name             || '';
  var what     = row.what_observed    || 'Space Weather Observation';
  var location = row.location         || '';
  var dateStr  = row.observation_date || '';
  var category = row.category         || '';
  var desc     = row.description      || '';
  var website  = row.website          || '';
  var photoUrl = (row.photo_urls && row.photo_urls[0]) ? row.photo_urls[0] : '';

  var metaParts = [];
  if (name)     metaParts.push('📷 ' + escHtml(name));
  if (location) metaParts.push('📍 ' + escHtml(location));
  if (dateStr)  metaParts.push('📅 ' + escHtml(dateStr));
  if (category) metaParts.push('🏷️ ' + escHtml(category));

  var imgHtml     = photoUrl ? '<img class="user-article-img" src="' + escHtml(photoUrl) + '" alt="' + escHtml(what) + '">' : '';
  var websiteHtml = website  ? '<div style="font-size:11px;margin-top:5px;"><b>More images:</b> <a href="' + escHtml(website) + '" target="_blank">' + escHtml(website) + '</a></div>' : '';

  slot.innerHTML =
    '<div class="user-article-badge">🛰️ NRSC Space Weather &nbsp;·&nbsp; READER OBSERVATION</div>' +
    '<div class="user-article-inner">' +
      '<div class="user-article-head">' + escHtml(what.toUpperCase()) + ':</div>' +
      '<div class="user-article-meta">' + metaParts.join(' &nbsp;|&nbsp; ') + '</div>' +
      imgHtml +
      (desc ? '<div class="user-article-desc">' + escHtml(desc) + '</div>' : '') +
      websiteHtml +
    '</div>';

  if (pos) pos.textContent = (_photoIndex + 1) + ' / ' + _photoRows.length;
}

function injectIntoDashboard(rows) {
  var userArticleDiv = document.getElementById('user-article');
  if (!userArticleDiv) return;
  _photoRows  = rows;
  _photoIndex = 0;

  userArticleDiv.innerHTML =
    '<div class="obs-nav" style="margin-bottom:4px;">' +
      '<button class="obs-arrow" onclick="photoNav(-1)">&#8592;</button>' +
      '<span style="font-size:11px;color:#555;">' +
        'Community Observations &nbsp;' +
        '<span id="photo-nav-pos">1 / ' + rows.length + '</span>' +
      '</span>' +
      '<button class="obs-arrow" onclick="photoNav(1)">&#8594;</button>' +
    '</div>' +
    '<div id="photo-card-slot"></div>';

  userArticleDiv.style.display = 'block';
  renderPhotoCard();
}

// ── Home page init ──
document.addEventListener('DOMContentLoaded', function () {
  updateAlertBanner();
  loadSolarWind();
  loadIMF();
  loadKp();
  loadFlares();
  loadAsteroids();
  setInterval(function () { loadSolarWind(); loadIMF(); loadKp(); loadFlares(); }, 300000);

  if (typeof supabase !== 'undefined') {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    sb.from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(5)
      .then(function ({ data, error }) {
        if (error || !data || data.length === 0) return;
        injectIntoDashboard(data);
      });
  }
});
