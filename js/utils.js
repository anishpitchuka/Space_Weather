function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function genRef() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'NRSC-SW-';
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

function utcTime(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toUTCString().slice(17, 22) + ' UT';
  } catch(e) { return ''; }
}

function fetchWithTimeout(url) {
  var ctrl = new AbortController();
  setTimeout(function() { ctrl.abort(); }, 6000);
  return fetch(url, { signal: ctrl.signal });
}

function flareClass(flux) {
  if (!flux || flux <= 0) return 'A1.0';
  if (flux < 1e-7) return 'A' + (flux/1e-8).toFixed(1);
  if (flux < 1e-6) return 'B' + (flux/1e-7).toFixed(1);
  if (flux < 1e-5) return 'C' + (flux/1e-6).toFixed(1);
  if (flux < 1e-4) return 'M' + (flux/1e-5).toFixed(1);
  return 'X' + (flux/1e-4).toFixed(1);
}

function kpLabel(v) {
  if (v < 3) return '<span class="kp-quiet">quiet</span>';
  if (v < 4) return '<span class="kp-unsettled">unsettled</span>';
  if (v < 5) return '<span class="kp-active">active</span>';
  if (v < 6) return '<span class="kp-storm">minor storm</span>';
  return '<span class="kp-storm">storm</span>';
}

function drawKpBars(kp) {
  const fill   = document.getElementById('kp-bar-fill');
  const needle = document.getElementById('kp-bar-needle');
  if (!fill || !needle) return;
  const pct = Math.min(Math.max(kp / 9, 0), 1) * 100;
  fill.style.width    = pct + '%';
  needle.style.left   = pct + '%';
}

function showPage(name) {
  if (name === 'home')    window.location.href = 'index.html';
  if (name === 'upload')  window.location.href = 'upload.html';
  if (name === 'confirm') window.location.href = 'confirm.html';
}
