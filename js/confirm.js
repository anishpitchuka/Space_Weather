document.addEventListener('DOMContentLoaded', function () {
  const subDataStr     = localStorage.getItem('sw_submission');
  const submissionData = subDataStr ? JSON.parse(subDataStr) : null;
  if (!submissionData) return;

  const rows = [
    ['Name',               submissionData.name     || '—'],
    ['Email',              submissionData.email    || '—'],
    ['What was observed',  submissionData.what     || '—'],
    ['Website',            submissionData.website  || '—'],
    ['Description',        submissionData.desc     || '—'],
    ['Date of observation',submissionData.dateStr],
    ['Location',           submissionData.location || '—'],
    ['Category',           submissionData.category || '—'],
    ['Submitted at',       new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'],
  ];

  const tbody = document.getElementById('summary-body');
  if (tbody) {
    tbody.innerHTML = '';
    rows.forEach(([k, v]) => {
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
    caption.className   = 'img-caption';
    caption.textContent = '📷 ' + submissionData.what;
    bigWrap.appendChild(bigImg);
    bigWrap.appendChild(caption);
    photoArea.appendChild(bigWrap);
  }

  const confirmIdVal = document.getElementById('confirm-id-val');
  if (confirmIdVal) confirmIdVal.textContent = 'REF# ' + genRef();
});
