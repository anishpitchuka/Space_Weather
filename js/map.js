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
    maxBounds: [[-5, 58], [40, 102]],
    maxBoundsViscosity: 0.6,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);

  // ── Icon factory ──
  function makeIcon(label, bg, border) {
    return L.divIcon({
      html: '<div style="background:' + bg + ';color:#fff;font-size:8px;font-weight:bold;padding:2px 4px;border-radius:2px;white-space:nowrap;border:1px solid ' + border + ';line-height:1.3;">' + label + '</div>',
      className: '', iconAnchor: [12, 8]
    });
  }

  // ── Popup factory ──
  function makePopup(emoji, title, rows, links) {
    var html = '<div style="font-family:Arial,sans-serif;font-size:11px;line-height:1.8;min-width:210px;">'
      + '<div style="background:#003366;color:#fff;font-weight:bold;padding:4px 8px;margin:0;border-radius:0;">'
      + emoji + ' ' + title + '</div>'
      + '<div style="padding:8px 10px;">';
    rows.forEach(function(r) { html += '<div>' + r + '</div>'; });
    if (links.length) {
      html += '<div style="margin-top:6px;padding-top:5px;border-top:1px solid #eee;">';
      links.forEach(function(l) {
        html += '<a href="' + l.url + '" target="_blank" style="color:#003366;font-weight:bold;text-decoration:none;display:block;">' + l.label + ' &raquo;</a>';
      });
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  // ── NRSC ──
  var nrscIcon = makeIcon('NRSC', '#cc0000', '#800000');
  L.marker([17.3850, 78.4867], { icon: nrscIcon })
    .addTo(map)
    .bindPopup(makePopup('🛰️', 'NRSC · Hyderabad', [
      '<b>National Remote Sensing Centre</b>',
      'Organisation: ISRO, Dept. of Space',
      'Lat: 17.385° N &nbsp;|&nbsp; Lon: 78.487° E'
    ], [{ url: 'https://www.nrsc.gov.in', label: 'nrsc.gov.in' }]),
    { className: 'obs-tooltip', maxWidth: 240 });

  // ── Geomagnetic observatories ──
  var geoIcon = function(code) { return makeIcon(code, '#003366', '#001a4d'); };

  var geoStations = [
    {
      code: 'ABG', name: 'Alibag',
      lat: 18.638, lon: 72.872,
      geoLat: '12.89° N', geoLon: '146.09° E',
      institute: 'Indian Institute of Geomagnetism (IIG)',
      website: 'https://iigm.res.in/observatories/alibag'
    },
    {
      code: 'JAI', name: 'Jaipur',
      lat: 26.917, lon: 75.820,
      geoLat: '18.36° N', geoLon: '150.49° E',
      institute: 'Indian Institute of Geomagnetism (IIG)',
      website: 'https://iigm.res.in/observatories/jaipur'
    },
    {
      code: 'HYB', name: 'Hyderabad',
      lat: 17.414, lon: 78.554,
      geoLat: '8.09°–8.62° N', geoLon: '151.76° E',
      institute: 'CSIR-National Geophysical Research Institute (NGRI)',
      website: 'https://www.ngri.res.in/research/geomagnetism.php'
    }
  ];

  var locationPopup = document.getElementById('map-popup');

  geoStations.forEach(function(s) {
    var rows = [
      '<b>' + s.institute + '</b>',
      '<b>Geographic:</b> ' + s.lat + '° N, ' + s.lon + '° E',
      '<b>Geomagnetic (QD):</b> Lat ' + s.geoLat + ', Lon ' + s.geoLon,
      '<span style="color:#888;font-size:10px;">📡 Geomagnetic Observatory</span>'
    ];
    L.marker([s.lat, s.lon], { icon: geoIcon(s.code) })
      .addTo(map)
      .bindPopup(makePopup('🧭', s.code + ' · ' + s.name + ' Observatory', rows,
        [{ url: s.website, label: 'observatory website' }]),
        { className: 'obs-tooltip', maxWidth: 260 })
      .on('click', function() {
        if (locationPopup) locationPopup.style.display = 'none';
        if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
      });
  });

  // ── Solar observatories ──
  var solIcon = makeIcon('KSO', '#b35900', '#7a3a00');

  L.marker([10.2317, 77.4656], { icon: solIcon })
    .addTo(map)
    .bindPopup(makePopup('☀️', 'KSO · Kodaikanal Solar Observatory', [
      '<b>Indian Institute of Astrophysics (IIAP)</b>',
      'Lat: 10.232° N &nbsp;|&nbsp; Lon: 77.466° E',
      'Alt: 2,343 m',
      '<b>Focus:</b> Sunspot monitoring, white light & H-alpha solar imaging',
      '<span style="color:#888;font-size:10px;">☀️ Solar Observatory</span>'
    ], [{ url: 'https://kso.iiap.res.in/new/archive/input', label: 'data archive' }]),
    { className: 'obs-tooltip', maxWidth: 260 })
    .on('click', function() {
      if (locationPopup) locationPopup.style.display = 'none';
      if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
    });

  // ── Optical / IR observatories ──
  var optIcon = function(label) { return makeIcon(label, '#5c0099', '#3a0066'); };

  var optStations = [
    {
      label: 'IAO', name: 'Indian Astronomical Observatory · Hanle',
      lat: 32.7794, lon: 78.9642, alt: '4,500 m',
      institute: 'IIAP + IUCAA',
      desc: 'Houses 2m Himalayan Chandra Telescope (HCT), HAGAR gamma-ray array, MACE Cherenkov telescope',
      links: [
        { url: 'https://www.iiap.res.in/centers/iao/', label: 'IAO · IIAP' },
        { url: 'http://voi.iucaa.in/voi/hct_data_archive.html', label: 'HCT data archive · IUCAA' }
      ]
    },
    {
      label: 'MIRO', name: 'Mount Abu Infrared Observatory',
      lat: 24.6548, lon: 72.7792, alt: '1,680 m',
      institute: 'Physical Research Laboratory (PRL)',
      desc: 'Optical/IR astronomy — exoplanets, stellar astrophysics, supernovae, AGN',
      links: [{ url: 'https://www.prl.res.in/~miro/', label: 'MIRO website' }]
    },
    {
      label: 'ARIES', name: 'Aryabhatta Research Institute · Nainital',
      lat: 29.3614, lon: 79.4561, alt: '1,951 m (Manora Peak)',
      institute: 'ARIES, Dept. of Science & Technology',
      desc: 'Optical astronomy & atmospheric science — 3.6m DOT, 4m ILMT, solar telescopes',
      links: [{ url: 'https://www.aries.res.in/', label: 'ARIES website' }]
    }
  ];

  optStations.forEach(function(s) {
    var rows = [
      '<b>' + s.institute + '</b>',
      'Lat: ' + s.lat + '° N &nbsp;|&nbsp; Lon: ' + s.lon + '° E',
      'Alt: ' + s.alt,
      '<b>Focus:</b> ' + s.desc,
      '<span style="color:#888;font-size:10px;">🔭 Optical / IR Observatory</span>'
    ];
    L.marker([s.lat, s.lon], { icon: optIcon(s.label) })
      .addTo(map)
      .bindPopup(makePopup('🔭', s.name, rows, s.links),
        { className: 'obs-tooltip', maxWidth: 280 })
      .on('click', function() {
        if (locationPopup) locationPopup.style.display = 'none';
        if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
      });
  });

  // ── Space science data centres (ISRO mission archives) ──
  var dataIcon = function(label) { return makeIcon(label, '#00695c', '#004d40'); };

  var dataCenters = [
    {
      label: 'ISSDC',
      name: 'Indian Space Science Data Centre · Byalalu',
      lat: 12.9018, lon: 77.3682,
      institute: 'ISRO / ISTRAC · IDSN campus, Bengaluru',
      desc: 'Ingest, archive & dissemination of payload data — Aditya-L1, Chandrayaan, AstroSat, Mars Orbiter & other ISRO space science missions',
      links: [{ url: 'https://www.issdc.gov.in/', label: 'ISSDC · Aditya-L1 & mission data' }]
    }
  ];

  dataCenters.forEach(function(s) {
    var rows = [
      '<b>' + s.institute + '</b>',
      'Lat: ' + s.lat + '° N &nbsp;|&nbsp; Lon: ' + s.lon + '° E',
      '<b>Focus:</b> ' + s.desc,
      '<span style="color:#888;font-size:10px;">📦 Space Science Data Centre</span>'
    ];
    L.marker([s.lat, s.lon], { icon: dataIcon(s.label) })
      .addTo(map)
      .bindPopup(makePopup('📦', s.name, rows, s.links),
        { className: 'obs-tooltip', maxWidth: 280 })
      .on('click', function() {
        if (locationPopup) locationPopup.style.display = 'none';
        if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
      });
  });

  // ── Radio observatories ──
  var radioIcon = function(label) { return makeIcon(label, '#2e7d32', '#1b5e20'); };

  var radioStations = [
    {
      label: 'GMRT',
      name: 'Giant Metrewave Radio Telescope · Khodad',
      lat: 19.0965, lon: 74.0497, alt: '650 m',
      institute: 'National Centre for Radio Astrophysics (NCRA-TIFR)',
      desc: '30 × 45 m dishes at metre wavelengths — world\'s largest sensitive array at low radio frequencies (~80 km N of Pune). Observational data via request-based GOA archive.',
      links: [
        { url: 'https://www.gmrt.ncra.tifr.res.in/', label: 'GMRT website' },
        { url: 'https://naps.ncra.tifr.res.in/goa/data/search', label: 'GMRT Online Archive (GOA)' }
      ]
    }
  ];

  radioStations.forEach(function(s) {
    var rows = [
      '<b>' + s.institute + '</b>',
      'Lat: ' + s.lat + '° N &nbsp;|&nbsp; Lon: ' + s.lon + '° E',
      'Alt: ' + s.alt,
      '<b>Focus:</b> ' + s.desc,
      '<span style="color:#888;font-size:10px;">📡 Radio Observatory</span>'
    ];
    L.marker([s.lat, s.lon], { icon: radioIcon(s.label) })
      .addTo(map)
      .bindPopup(makePopup('📡', s.name, rows, s.links),
        { className: 'obs-tooltip', maxWidth: 280 })
      .on('click', function() {
        if (locationPopup) locationPopup.style.display = 'none';
        if (clickMarker) { map.removeLayer(clickMarker); clickMarker = null; }
      });
  });

  // ── Legend ──
  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function() {
    var div = L.DomUtil.create('div');
    div.style.cssText = 'background:#fff;padding:6px 8px;font-size:10px;font-family:Arial;border:1px solid #aaa;border-radius:3px;line-height:1.9;box-shadow:1px 2px 6px rgba(0,0,0,0.2);';
    div.innerHTML =
      '<div style="font-weight:bold;margin-bottom:3px;color:#333;">Observatory Types</div>'
      + '<div><span style="background:#cc0000;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">NRSC</span> &nbsp;NRSC / ISRO</div>'
      + '<div><span style="background:#003366;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">ABG</span> &nbsp;Geomagnetic</div>'
      + '<div><span style="background:#b35900;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">KSO</span> &nbsp;Solar</div>'
      + '<div><span style="background:#5c0099;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">IAO</span> &nbsp;Optical / IR</div>'
      + '<div><span style="background:#00695c;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">ISSDC</span> &nbsp;Space science data</div>'
      + '<div><span style="background:#2e7d32;color:#fff;padding:1px 5px;border-radius:2px;font-size:9px;">GMRT</span> &nbsp;Radio</div>';
    return div;
  };
  legend.addTo(map);

  // ── Click to geocode ──
  var clickMarker = null;
  map.on('click', function (e) {
    map.closePopup();
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
    var pw = 230, ph = 180, vw = window.innerWidth, vh = window.innerHeight;
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

  window.addEventListener('scroll', function () {
    document.getElementById('map-popup').style.display = 'none';
  });
})();
