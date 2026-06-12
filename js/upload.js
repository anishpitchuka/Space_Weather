// ── Thumbnail preview ──
function showThumb(input) {
  const thumb = input.parentElement.querySelector('.file-thumb');
  if (input.files && input.files[0]) {
    const r = new FileReader();
    r.onload = e => { thumb.src = e.target.result; thumb.style.display = 'block'; };
    r.readAsDataURL(input.files[0]);
  } else {
    thumb.style.display = 'none';
    thumb.src = '';
  }
}

// ── Form submit ──
async function handleSubmit() {
  const _sbClient = (typeof supabase !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  const name     = document.getElementById('f-name').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const what     = document.getElementById('f-what').value.trim();
  const website  = document.getElementById('f-website').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const dateVal  = document.getElementById('f-date').value;
  const location = document.getElementById('f-location').value.trim();
  const category = document.getElementById('f-category').value;

  if (!name)     { alert('Please enter your name.');                           return; }
  if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
  if (!what)     { alert('Please tell us what you saw.');                      return; }
  if (!desc)     { alert('Please add a description.');                         return; }
  if (!dateVal)  { alert('Please select the date of observation.');            return; }
  if (!location) { alert('Please enter your location.');                       return; }
  if (!category) { alert('Please select a category.');                         return; }

  const allInputs = document.querySelectorAll('.photo-input');
  const files = [];
  allInputs.forEach(inp => { if (inp.files && inp.files[0]) files.push(inp.files[0]); });
  if (files.length === 0) { alert('Please upload at least one photo.'); return; }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  const dateStr = new Date(dateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  let photoUrls = [], firstImageSrc = null;

  try {
    if (!_sbClient) throw new Error('Supabase SDK not loaded.');

    for (const file of files) {
      const ext  = file.name.split('.').pop();
      const path = `submissions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await _sbClient.storage
        .from('space-weather-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = _sbClient.storage.from('space-weather-photos').getPublicUrl(path);
      photoUrls.push(urlData.publicUrl);
    }

    const { error: dbErr } = await _sbClient.from('submissions').insert({
      name, email, what_observed: what, website: website || null,
      description: desc, observation_date: dateStr, location, category, photo_urls: photoUrls,
    });
    if (dbErr) throw dbErr;

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

  localStorage.removeItem('sw_upload_draft');
  localStorage.setItem('sw_submission', JSON.stringify(
    { name, email, what, website, desc, dateStr, location, category, firstImageSrc, photoUrls }
  ));
  window.location.href = 'confirm.html';
}

// ── Upload page init ──
document.addEventListener('DOMContentLoaded', function () {
  const dateInput = document.getElementById('f-date');
  if (dateInput) dateInput.max = new Date().toISOString().split('T')[0];
});
