(function () {
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
    center: [22.5, 82.5], zoom: 4, minZoom: 4, maxZoom: 10,
    maxBounds: [[5, 66], [38, 98]], zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);

  var nrscIcon = L.divIcon({
    html: '<div style="background:#cc0000;color:#fff;font-size:9px;font-weight:bold;padding:2px 4px;border-radius:2px;white-space:nowrap;border:1px solid #800000;">NRSC</div>',
    className: '', iconAnchor: [16, 8]
  });
  L.marker([17.3850, 78.4867], { icon: nrscIcon })
    .addTo(map)
    .bindTooltip('NRSC · Hyderabad', { permanent: false, direction: 'right' });

  var clickMarker = null;
  map.on('click', function (e) {
    var lat = e.latlng.lat.toFixed(5);
    var lon = e.latlng.lng.toFixed(5);
    if (clickMarker) map.removeLayer(clickMarker);
    clickMarker = L.circleMarker(e.latlng, {
      radius: 7, color: '#cc0000', fillColor: '#ff4444', fillOpacity: 0.9, weight: 2
    }).addTo(map);

    var el_pop_lat   = document.getElementById('pop-lat');   if (el_pop_lat)   el_pop_lat.textContent   = lat + '° N';
    var el_pop_lon   = document.getElementById('pop-lon');   if (el_pop_lon)   el_pop_lon.textContent   = lon + '° E';
    var el_pop_area  = document.getElementById('pop-area');  if (el_pop_area)  el_pop_area.textContent  = 'Fetching...';
    var el_pop_state = document.getElementById('pop-state'); if (el_pop_state) el_pop_state.textContent = 'Fetching...';

    var popup = document.getElementById('map-popup');
    popup.style.display = 'block';
    var px = e.originalEvent.clientX, py = e.originalEvent.clientY;
    var pw = 230, ph = 160, vw = window.innerWidth, vh = window.innerHeight;
    popup.style.left = (px + pw + 12 > vw ? px - pw - 8 : px + 12) + 'px';
    popup.style.top  = (py + ph > vh ? py - ph : py) + 'px';

    fetchWithTimeout('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=en')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var area  = d.locality || d.city || d.principalSubdivisionCode || 'Unknown';
        var state = d.principalSubdivision || 'Unknown';
        var country = d.countryName || '';
        var el_area  = document.getElementById('pop-area');  if (el_area)  el_area.textContent  = area;
        var el_state = document.getElementById('pop-state'); if (el_state) el_state.textContent = state + (country && country !== 'India' ? ' (' + country + ')' : '');
      })
      .catch(function () {
        var el_area  = document.getElementById('pop-area');  if (el_area)  el_area.textContent  = 'Unavailable';
        var el_state = document.getElementById('pop-state'); if (el_state) el_state.textContent = 'Unavailable';
      });
  });

  map.on('dragstart', function () {
    document.getElementById('map-popup').style.display = 'none';
  });
})();
