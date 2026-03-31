/* ============================================
   DHT ADMIN PORTAL — JavaScript
   ============================================ */

const SUPABASE_URL = 'https://mxaezkfyowvotzfrnfil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14YWV6a2Z5b3d2b3R6ZnJuZmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzA2MzAsImV4cCI6MjA4NzQ0NjYzMH0.ueMC6olfg0oR7mG_UtdcRCk61YRdMGzkUdqiHvmirT4';

// --- Supabase helpers ---
async function sbFetch(path, options = {}) {
  const session = getSession();
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': 'Bearer ' + session.access_token } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(SUPABASE_URL + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sbAuth(email, password) {
  const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
  return data;
}

async function sbSignOut(accessToken) {
  await fetch(SUPABASE_URL + '/auth/v1/logout', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + accessToken }
  });
}

// --- Session ---
function saveSession(data) {
  sessionStorage.setItem('dht_admin_session', JSON.stringify({
    access_token: data.access_token,
    email: data.user?.email || ''
  }));
}
function getSession() {
  try { return JSON.parse(sessionStorage.getItem('dht_admin_session')); } catch { return null; }
}
function clearSession() { sessionStorage.removeItem('dht_admin_session'); }

// --- DOM refs ---
const loginScreen  = document.getElementById('loginScreen');
const portal       = document.getElementById('portal');
const loginForm    = document.getElementById('loginForm');
const loginError   = document.getElementById('loginError');
const loginBtn     = document.getElementById('loginBtn');
const signOutBtn   = document.getElementById('signOutBtn');
const adminLabel   = document.getElementById('adminUserLabel');
const refreshBtn   = document.getElementById('refreshBtn');
const sidebar      = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// --- Init ---
(function init() {
  const session = getSession();
  if (session) {
    showPortal(session);
  }
})();

// --- Login ---
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  loginError.hidden = true;
  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled = true;
  try {
    const data = await sbAuth(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPassword').value
    );
    saveSession(data);
    showPortal(getSession());
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  } finally {
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
});

// --- Sign out ---
signOutBtn.addEventListener('click', async function () {
  const session = getSession();
  if (session) await sbSignOut(session.access_token).catch(() => {});
  clearSession();
  portal.hidden = true;
  loginScreen.style.display = 'flex';
});

// --- Mobile menu ---
mobileMenuBtn.addEventListener('click', function () {
  sidebar.classList.toggle('open');
});
document.addEventListener('click', function (e) {
  if (sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// --- Show portal ---
function showPortal(session) {
  loginScreen.style.display = 'none';
  portal.hidden = false;
  adminLabel.textContent = session.email;
  loadAllData();
}

// --- Tab navigation ---
document.querySelectorAll('.nav-item[data-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    sidebar.classList.remove('open');
  });
});

refreshBtn.addEventListener('click', loadAllData);

// --- Load all data ---
async function loadAllData() {
  try {
    const [registrations, donations, contacts] = await Promise.all([
      sbFetch('/rest/v1/registrations?select=*&order=created_at.desc'),
      sbFetch('/rest/v1/donations?select=*&order=created_at.desc'),
      sbFetch('/rest/v1/contacts?select=*&order=created_at.desc')
    ]);
    renderOverview(registrations, donations, contacts);
    renderParticipants(registrations);
    renderDonations(donations);
    renderMessages(contacts);
  } catch (err) {
    console.error('Load error:', err);
  }
}

// ============================================================
//  OVERVIEW
// ============================================================
function renderOverview(registrations, donations, contacts) {
  // Stats
  document.getElementById('statTotal').textContent = registrations.length;

  const musicians = registrations.filter(r =>
    r.role && r.role.toLowerCase().includes('musician'));
  document.getElementById('statMusicians').textContent = musicians.length;

  const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  document.getElementById('statDonationTotal').textContent = '$' + totalDonated.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const newMessages = contacts.filter(c => c.status === 'new' || !c.status).length;
  document.getElementById('statNewMessages').textContent = newMessages;

  // Nav badges
  document.getElementById('navBadgeParticipants').textContent = registrations.length || '';
  document.getElementById('navBadgeMessages').textContent = newMessages || '';

  // Role chart
  const roleCounts = {};
  registrations.forEach(r => {
    const k = r.role || 'Unknown';
    roleCounts[k] = (roleCounts[k] || 0) + 1;
  });
  renderBarChart('roleChart', roleCounts, registrations.length);

  // Region chart
  const regionCounts = {};
  registrations.forEach(r => {
    const k = r.region || 'Not specified';
    regionCounts[k] = (regionCounts[k] || 0) + 1;
  });
  renderBarChart('regionChart', regionCounts, registrations.length);

  // Recent sign-ups
  const recentList = document.getElementById('recentList');
  const recent5 = registrations.slice(0, 5);
  if (recent5.length === 0) {
    recentList.innerHTML = '<p class="recent-empty">No registrations yet.</p>';
  } else {
    recentList.innerHTML = recent5.map(r => `
      <div class="recent-item">
        <div class="recent-avatar">${(r.name || '?')[0].toUpperCase()}</div>
        <div class="recent-info">
          <div class="recent-name">${esc(r.name)}</div>
          <div class="recent-sub">${esc(r.role || '—')}</div>
        </div>
        <div class="recent-time">${timeAgo(r.created_at)}</div>
      </div>`).join('');
  }

  // Recent donations
  const recentDonations = document.getElementById('recentDonations');
  const recent5d = donations.slice(0, 5);
  if (recent5d.length === 0) {
    recentDonations.innerHTML = '<p class="recent-empty">No donations recorded yet.</p>';
  } else {
    recentDonations.innerHTML = recent5d.map(d => `
      <div class="recent-item">
        <div class="recent-avatar" style="background:rgba(52,211,153,0.12);color:var(--green);">$</div>
        <div class="recent-info">
          <div class="recent-name">${esc(d.donor_name || 'Anonymous')}</div>
          <div class="recent-sub">$${parseFloat(d.amount).toFixed(2)}</div>
        </div>
        <div class="recent-time">${timeAgo(d.created_at)}</div>
      </div>`).join('');
  }
}

function renderBarChart(containerId, counts, total) {
  const el = document.getElementById(containerId);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  if (sorted.length === 0) {
    el.innerHTML = '<p class="recent-empty">No data yet.</p>';
    return;
  }
  el.innerHTML = sorted.map(([label, count]) => `
    <div class="bar-row">
      <div class="bar-label" title="${esc(label)}">${esc(shortLabel(label))}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(count / max * 100).toFixed(1)}%"></div>
      </div>
      <div class="bar-count">${count}</div>
    </div>`).join('');
}

// ============================================================
//  PARTICIPANTS
// ============================================================
let allParticipants = [];

function renderParticipants(data) {
  allParticipants = data;
  filterParticipants();
}

function filterParticipants() {
  const search = document.getElementById('participantSearch').value.toLowerCase();
  const role   = document.getElementById('roleFilter').value;
  const region = document.getElementById('regionFilter').value;

  let filtered = allParticipants.filter(r => {
    const matchSearch = !search ||
      (r.name  || '').toLowerCase().includes(search) ||
      (r.email || '').toLowerCase().includes(search);
    const matchRole   = !role   || r.role   === role;
    const matchRegion = !region || r.region === region;
    return matchSearch && matchRole && matchRegion;
  });

  const tbody = document.getElementById('participantsBody');
  const empty = document.getElementById('participantsEmpty');
  document.getElementById('participantCount').textContent =
    filtered.length + ' of ' + allParticipants.length + ' registrations';

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><span class="cell-truncate">${esc(r.name || '—')}</span></td>
      <td><a href="mailto:${esc(r.email)}" style="color:var(--primary)">${esc(r.email || '—')}</a></td>
      <td>${roleChip(r.role)}</td>
      <td><span class="cell-truncate">${esc(r.region || '—')}</span></td>
      <td style="white-space:nowrap">${formatDate(r.created_at)}</td>
    </tr>`).join('');
}

document.getElementById('participantSearch').addEventListener('input', filterParticipants);
document.getElementById('roleFilter').addEventListener('change', filterParticipants);
document.getElementById('regionFilter').addEventListener('change', filterParticipants);

document.getElementById('exportParticipants').addEventListener('click', function () {
  exportCSV(allParticipants, ['name','email','role','region','created_at'], 'dht_participants.csv');
});

// ============================================================
//  DONATIONS
// ============================================================
let allDonations = [];

function renderDonations(data) {
  allDonations = data;
  const total = data.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const avg   = data.length ? total / data.length : 0;
  document.getElementById('donationGrandTotal').textContent =
    '$' + total.toLocaleString('en-AU', { minimumFractionDigits: 2 });
  document.getElementById('donationCount').textContent = data.length;
  document.getElementById('donationAvg').textContent =
    '$' + avg.toLocaleString('en-AU', { minimumFractionDigits: 2 });

  const tbody = document.getElementById('donationsBody');
  const empty = document.getElementById('donationsEmpty');
  if (data.length === 0) { tbody.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  tbody.innerHTML = data.map(d => `
    <tr>
      <td style="white-space:nowrap">${formatDate(d.created_at)}</td>
      <td>${esc(d.donor_name || 'Anonymous')}</td>
      <td>${d.donor_email ? `<a href="mailto:${esc(d.donor_email)}" style="color:var(--primary)">${esc(d.donor_email)}</a>` : '—'}</td>
      <td style="color:var(--green);font-weight:700">$${parseFloat(d.amount).toFixed(2)}</td>
      <td>${esc(d.reference || '—')}</td>
      <td><span class="cell-truncate">${esc(d.notes || '—')}</span></td>
      <td>
        <button class="btn-delete-row" data-id="${d.id}" data-type="donation" title="Delete">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        </button>
      </td>
    </tr>`).join('');
}

// Add donation modal
const donationModal  = document.getElementById('donationModal');
const donationForm   = document.getElementById('donationForm');

document.getElementById('addDonationBtn').addEventListener('click', () => { donationModal.hidden = false; });
document.getElementById('closeDonationModal').addEventListener('click', closeDonationModal);
document.getElementById('cancelDonationBtn').addEventListener('click', closeDonationModal);
donationModal.addEventListener('click', e => { if (e.target === donationModal) closeDonationModal(); });

function closeDonationModal() { donationModal.hidden = true; donationForm.reset(); }

donationForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('donorAmount').value);
  if (!amount || amount <= 0) return;
  const payload = {
    donor_name:  document.getElementById('donorName').value.trim() || null,
    donor_email: document.getElementById('donorEmail').value.trim() || null,
    amount:      amount,
    reference:   document.getElementById('donorReference').value.trim() || null,
    notes:       document.getElementById('donorNotes').value.trim() || null
  };
  try {
    await sbFetch('/rest/v1/donations', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload)
    });
    closeDonationModal();
    loadAllData();
  } catch (err) {
    alert('Error saving donation: ' + err.message);
  }
});

// Delete row (donations)
document.getElementById('donationsBody').addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-delete-row');
  if (!btn) return;
  if (!confirm('Delete this donation record?')) return;
  try {
    await sbFetch('/rest/v1/donations?id=eq.' + btn.dataset.id, { method: 'DELETE' });
    loadAllData();
  } catch (err) {
    alert('Error deleting: ' + err.message);
  }
});

// ============================================================
//  MESSAGES
// ============================================================
let allMessages = [];

function renderMessages(data) {
  allMessages = data;
  filterMessages();
}

function filterMessages() {
  const search = document.getElementById('messageSearch').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;

  let filtered = allMessages.filter(m => {
    const matchSearch = !search ||
      (m.name    || '').toLowerCase().includes(search) ||
      (m.email   || '').toLowerCase().includes(search) ||
      (m.message || '').toLowerCase().includes(search) ||
      (m.subject || '').toLowerCase().includes(search);
    const matchStatus = !status || (m.status || 'new') === status;
    return matchSearch && matchStatus;
  });

  const tbody = document.getElementById('messagesBody');
  const empty = document.getElementById('messagesEmpty');
  if (filtered.length === 0) { tbody.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  tbody.innerHTML = filtered.map(m => `
    <tr>
      <td style="white-space:nowrap">${formatDate(m.created_at)}</td>
      <td>${esc(m.name || '—')}</td>
      <td><a href="mailto:${esc(m.email)}" style="color:var(--primary)">${esc(m.email || '—')}</a></td>
      <td>${esc(m.subject || '—')}</td>
      <td><span class="cell-truncate" style="max-width:220px" title="${esc(m.message || '')}">${esc(m.message || '—')}</span></td>
      <td>
        <select class="status-select" data-id="${m.id}" data-type="contact">
          <option value="new"     ${(m.status||'new')==='new'     ? 'selected':''}>New</option>
          <option value="read"    ${(m.status||'new')==='read'    ? 'selected':''}>Read</option>
          <option value="replied" ${(m.status||'new')==='replied' ? 'selected':''}>Replied</option>
        </select>
      </td>
    </tr>`).join('');
}

document.getElementById('messageSearch').addEventListener('input', filterMessages);
document.getElementById('statusFilter').addEventListener('change', filterMessages);

document.getElementById('messagesBody').addEventListener('change', async function (e) {
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  try {
    await sbFetch('/rest/v1/contacts?id=eq.' + sel.dataset.id, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: sel.value })
    });
    // Update local data and refresh badges without full reload
    const msg = allMessages.find(m => m.id === sel.dataset.id);
    if (msg) msg.status = sel.value;
    const newUnread = allMessages.filter(m => (m.status || 'new') === 'new').length;
    document.getElementById('navBadgeMessages').textContent = newUnread || '';
    document.getElementById('statNewMessages').textContent = newUnread;
  } catch (err) {
    alert('Error updating status: ' + err.message);
  }
});

document.getElementById('exportMessages').addEventListener('click', function () {
  exportCSV(allMessages, ['name','email','subject','message','status','created_at'], 'dht_messages.csv');
});

// ============================================================
//  UTILITIES
// ============================================================
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day:'2-digit', month:'short', year:'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  return days + 'd ago';
}

function shortLabel(label) {
  const map = {
    'Musician / Artist': 'Musician',
    'Parent / Guardian': 'Parent',
    'Teacher / Educator': 'Teacher',
    'Potential Sponsor / Partner': 'Sponsor',
    'Community Member / Supporter': 'Community',
    'Darwin / Top End': 'Darwin',
    'Katherine / Big Rivers': 'Katherine',
    'Tennant Creek / Barkly': 'Tennant Ck',
    'Alice Springs / Red Centre': 'Alice Spgs',
    'Outside the NT': 'Outside NT'
  };
  return map[label] || label;
}

function roleChip(role) {
  const map = {
    'Musician / Artist': 'musician',
    'Parent / Guardian': 'parent',
    'Teacher / Educator': 'teacher',
    'Potential Sponsor / Partner': 'sponsor',
    'Community Member / Supporter': 'community'
  };
  const cls = map[role] || 'community';
  return `<span class="chip chip--${cls}">${esc(shortLabel(role || 'Unknown'))}</span>`;
}

function exportCSV(data, columns, filename) {
  const header = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = String(row[col] || '').replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
