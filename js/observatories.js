// Geomagnetic Observatory carousel — ABG, JAI, HYB

var OBS_STATIONS = [
  { code: 'ABG', name: 'Alibag',    components: ['X','Y','Z','S'] },
  { code: 'JAI', name: 'Jaipur',    components: ['X','Y','Z','S'] },
  { code: 'HYB', name: 'Hyderabad', components: ['H','D','Z','S'] }
];

var OBS_COLORS = {
  X: '#cc0000', H: '#cc0000',
  Y: '#007700', D: '#007700',
  Z: '#0055cc',
  S: '#111111'
};

var OBS_LABELS = {
  X: 'X  (North)',       H: 'H  (Horizontal)',
  Y: 'Y  (East)',        D: 'D  (Declination)',
  Z: 'Z  (Vertical)',
  S: 'S  (Scalar)'
};

var obsIndex  = 0;
var obsData   = {};  // stores trimmed arrays per station

function obsNav(dir) {
  obsIndex = (obsIndex + dir + OBS_STATIONS.length) % OBS_STATIONS.length;
  var active = OBS_STATIONS[obsIndex];

  OBS_STATIONS.forEach(function(s) {
    var p = document.getElementById('obs-panel-' + s.code);
    if (p) p.style.display = 'none';
  });
  var panel = document.getElementById('obs-panel-' + active.code);
  if (panel) panel.style.display = 'block';

  document.getElementById('obs-nav-name').textContent = active.name;
  document.getElementById('obs-nav-code').textContent = active.code;
  document.getElementById('obs-nav-pos').textContent  = (obsIndex + 1) + ' / ' + OBS_STATIONS.length;

  // panel is now visible — redraw with stored data if available
  if (obsData[active.code]) {
    requestAnimationFrame(function() { renderStation(active.code); });
  }
}

function trimData(all) {
  var lastValid = all.length - 1;
  while (lastValid > 0 && (all[lastValid] == null || all[lastValid] >= 88888)) lastValid--;
  var start = Math.max(0, lastValid - 1439);
  return all.slice(start, lastValid + 1);
}

function renderStation(code) {
  var station = OBS_STATIONS.filter(function(s) { return s.code === code; })[0];
  var data    = obsData[code];
  if (!data) return;
  station.components.forEach(function(key) {
    drawObsChart('canvas-' + code + '-' + key, key, data[key] || []);
  });
}

function drawObsChart(canvasId, key, values) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var color = OBS_COLORS[key] || '#333';
  var label = OBS_LABELS[key] || key;

  var dpr = window.devicePixelRatio || 1;
  var W   = canvas.parentElement.offsetWidth || 190;
  var H   = 90;
  canvas.width        = W * dpr;
  canvas.height       = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var pad = { top: 18, right: 6, bottom: 16, left: 48 };
  var pw  = W - pad.left - pad.right;
  var ph  = H - pad.top  - pad.bottom;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // title bar
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(label, 5, 10);

  var valid = values.filter(function(v) { return v != null && v < 88888 && v > -88888; });
  if (valid.length === 0) {
    ctx.fillStyle = '#bbb'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
    ctx.fillText('No data', pad.left + pw / 2, pad.top + ph / 2 + 3);
    return;
  }

  var minV  = Math.min.apply(null, valid);
  var maxV  = Math.max.apply(null, valid);
  var range = maxV - minV || 1;

  // grid
  ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5;
  for (var g = 0; g <= 4; g++) {
    var gy = pad.top + (ph / 4) * g;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + pw, gy); ctx.stroke();
  }

  // y-axis labels
  ctx.fillStyle = '#888'; ctx.font = '7px Arial'; ctx.textAlign = 'right';
  ctx.fillText(maxV.toFixed(1), pad.left - 3, pad.top + 5);
  ctx.fillText(((maxV + minV) / 2).toFixed(1), pad.left - 3, pad.top + ph / 2 + 3);
  ctx.fillText(minV.toFixed(1), pad.left - 3, pad.top + ph);

  // x-axis labels
  ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.font = '7px Arial';
  ['-24h', '-18h', '-12h', '-6h', 'now'].forEach(function(lbl, i) {
    ctx.fillText(lbl, pad.left + (pw / 4) * i, H - 3);
  });

  // border
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
  ctx.strokeRect(pad.left, pad.top, pw, ph);

  // data line
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.2;
  var first = true;
  for (var i = 0; i < values.length; i++) {
    var v = values[i];
    if (v == null || v >= 88888 || v <= -88888) { first = true; continue; }
    var x  = pad.left + (i / (values.length - 1)) * pw;
    var y2 = pad.top  + ph - ((v - minV) / range) * ph;
    if (first) { ctx.moveTo(x, y2); first = false; } else ctx.lineTo(x, y2);
  }
  ctx.stroke();
}

function loadObsStation(code) {
  var station  = OBS_STATIONS.filter(function(s) { return s.code === code; })[0];
  var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  var url = 'https://imag-data.bgs.ac.uk/GIN_V1/GINServices?Request=GetData'
    + '&observatoryIagaCode=' + code
    + '&samplesPerDay=minute'
    + '&dataStartDate=' + yesterday
    + '&dataDuration=2'
    + '&publicationState=Best+available'
    + '&format=json';

  var sid = 'status-' + code;
  var statusEl = document.getElementById(sid);
  if (statusEl) statusEl.textContent = 'Loading…';

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      // store trimmed data
      var stored = {};
      station.components.forEach(function(key) {
        stored[key] = trimData(d[key] || []);
      });
      obsData[code] = stored;

      // only render if this station's panel is currently visible
      var panel = document.getElementById('obs-panel-' + code);
      if (panel && panel.style.display !== 'none') {
        renderStation(code);
      }

      if (statusEl) statusEl.textContent = 'Updated ' + new Date().toUTCString().slice(17, 22) + ' UT · rolling 24h';
    })
    .catch(function(err) {
      if (statusEl) statusEl.textContent = 'Data unavailable';
      console.error('OBS fetch error [' + code + ']:', err);
    });
}

function loadAllObservatories() {
  OBS_STATIONS.forEach(function(s) { loadObsStation(s.code); });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('obs-nav-pos').textContent = '1 / ' + OBS_STATIONS.length;
  // load all 3 upfront — data stored, drawn when panel becomes visible
  loadAllObservatories();
  setInterval(loadAllObservatories, 300000);
});
