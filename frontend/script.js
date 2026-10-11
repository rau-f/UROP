const API = '/api/opportunities';
const $ = (id) => document.getElementById(id);

const FIELDS = ['title', 'description', 'area', 'researcher_name', 'department',
  'required_skills', 'available_positions', 'deadline', 'status'];
const REQUIRED = ['title', 'area', 'researcher_name', 'department', 'available_positions', 'deadline'];
const LABELS = {
  title: 'Title', description: 'Description', area: 'Research area',
  researcher_name: 'Faculty member', department: 'Department',
  required_skills: 'Required skills', available_positions: 'Available positions',
  deadline: 'Application deadline', status: 'Status',
};

// Turn whatever the API returns for a deadline into YYYY-MM-DD.
// "2026-12-31" or "2026-12-31 00:00:00" -> keep the first 10 characters.
// An ISO timestamp ("2026-12-30T19:00:00.000Z", what you get when db.js does not set
// dateStrings) is converted back to the local calendar day, so the date never shifts.
const day = (d) => {
  const s = String(d ?? '');
  if (!s.includes('T')) return s.slice(0, 10);
  const t = new Date(s);
  if (isNaN(t)) return s.slice(0, 10);
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};

// The database may hand status back as "open" or "Open"; always work with "Open" / "Closed".
const statusLabel = (v) => (String(v ?? '').toLowerCase() === 'closed' ? 'Closed' : 'Open');

function show(text, ok = true) {
  const m = $('message');
  m.textContent = text;
  m.className = ok ? 'ok' : 'err';
}

// Show an API error. A 404 means the row is stale (deleted elsewhere), so refresh the list too.
function fail(e) {
  show(e.message, false);
  if (/\(404\)$/.test(e.message)) loadList();
}

// fetch does not throw on 400/404/500, so check res.ok and surface the API's error text.
async function api(path = '', options = {}) {
  let res;
  try {
    res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running, then try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${data?.error || 'Request failed'} (${res.status})`);
  return data;
}

function btn(label, onClick, cls = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.className = cls;
  b.addEventListener('click', onClick);
  return b;
}

function rowEl(r) {
  const tr = document.createElement('tr');
  [r.title, r.area, r.researcher_name, day(r.deadline), r.available_positions, statusLabel(r.status)].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  const actions = document.createElement('td');
  actions.append(btn('Details', () => showDetails(r.id), 'secondary'), btn('Edit', () => startEdit(r.id), 'secondary'));
  if (statusLabel(r.status) === 'Open') actions.append(btn('Close', () => closeOpp(r.id), 'secondary'));
  actions.append(btn('Delete', () => removeOpp(r.id), 'danger'));
  tr.appendChild(actions);
  return tr;
}

async function loadList() {
  try {
    const rows = await api();
    const body = $('rows');
    body.innerHTML = '';
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7">No opportunities yet. Post the first one below.</td></tr>';
      return;
    }
    rows.forEach((r) => body.appendChild(rowEl(r)));
  } catch (e) {
    show(`Could not load opportunities: ${e.message}`, false);
  }
}

async function showDetails(id) {
  try {
    const r = await api(`/${id}`);
    const dl = $('details-body');
    dl.innerHTML = '';
    for (const [key, label] of Object.entries(LABELS)) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = key === 'deadline' ? day(r[key])
        : key === 'status' ? statusLabel(r[key])
        : (r[key] ?? 'Not provided');
      dl.append(dt, dd);
    }
    $('details').hidden = false;
    $('details').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    fail(e);
  }
}

function readForm() {
  const data = {};
  FIELDS.forEach((f) => { data[f] = $(f).value.trim(); });
  data.available_positions = data.available_positions === '' ? '' : Number(data.available_positions);
  if (data.description === '') data.description = null;
  if (data.required_skills === '') data.required_skills = null;
  return data;
}

function validate(d) {
  const missing = REQUIRED.filter((f) => d[f] === '');
  if (missing.length) return `Fill in the required fields: ${missing.map((f) => LABELS[f]).join(', ')}.`;
  if (!Number.isInteger(d.available_positions) || d.available_positions < 0)
    return 'Available positions must be a whole number, 0 or more.';
  return null;
}

function resetForm() {
  $('opp-form').reset();
  $('opp-id').value = '';
  $('form-title').textContent = 'Post a new opportunity';
  $('save').textContent = 'Save opportunity';
  $('cancel').hidden = true;
}

async function startEdit(id) {
  try {
    const r = await api(`/${id}`);
    FIELDS.forEach((f) => { $(f).value = f === 'deadline' ? day(r[f])
      : f === 'status' ? statusLabel(r[f])
      : (r[f] ?? ''); });
    $('opp-id').value = r.id;
    $('form-title').textContent = `Edit opportunity #${r.id}`;
    $('save').textContent = 'Update opportunity';
    $('cancel').hidden = false;
    $('form-section').scrollIntoView({ behavior: 'smooth' });
    $('title').focus();
  } catch (e) {
    fail(e);
  }
}

// The API's PUT replaces every field, so send the full record with only the status changed.
async function closeOpp(id) {
  try {
    const r = await api(`/${id}`);
    await api(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...r, deadline: day(r.deadline), status: 'Closed' }),
    });
    show('Opportunity closed.');
    $('details').hidden = true;
    loadList();
  } catch (e) {
    fail(e);
  }
}

async function removeOpp(id) {
  if (!confirm('Delete this opportunity? This cannot be undone.')) return;
  try {
    await api(`/${id}`, { method: 'DELETE' });
    show('Opportunity deleted.');
    if ($('opp-id').value === String(id)) resetForm();
    $('details').hidden = true;
    loadList();
  } catch (e) {
    fail(e);
  }
}

$('opp-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = readForm();
  const problem = validate(data);
  if (problem) return show(problem, false);

  const id = $('opp-id').value;
  try {
    await api(id ? `/${id}` : '', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
    show(id ? 'Opportunity updated.' : 'Opportunity saved.');
    $('details').hidden = true;
    resetForm();
    loadList();
  } catch (err) {
    fail(err);
  }
});

$('cancel').addEventListener('click', resetForm);
$('hide-details').addEventListener('click', () => { $('details').hidden = true; });

loadList();