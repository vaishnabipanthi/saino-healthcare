/* SAINO Super Admin Provider Directory — live PostgreSQL data only */
const ADMIN_API = "/api/admin";
window.ADMIN_PROVIDERS_CACHE = [];

function adminEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function showProvidersPage() {
  const host = document.getElementById('pageContent');
  if (!host) return;
  host.innerHTML = `
    <div class="page-intro"><div><p class="eyebrow">MARKETPLACE MANAGEMENT</p><h2>Provider Directory</h2><p class="muted">Providers registered in the SAINO PostgreSQL database.</p></div>
    <div class="provider-actions"><button class="primary-button" onclick="loadAdminProviders()"><i data-lucide="refresh-cw"></i> Refresh List</button></div></div>
    <div class="panel provider-panel"><div class="provider-toolbar">
      <input id="adminProviderSearch" type="search" placeholder="Search provider, city, phone..." oninput="filterAdminProviders(this.value)">
      <select id="adminStatusFilter" onchange="filterAdminProvidersByStatus(this.value)"><option value="">All Statuses</option><option value="pending_verification">Pending Verification</option><option value="active">Approved & Published</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>
    </div><div class="table-container"><table class="data-table"><thead><tr><th>PROVIDER</th><th>TYPE</th><th>LOCATION</th><th>VERIFICATION</th><th>PLAN</th><th>ACTIONS</th></tr></thead><tbody id="adminProvidersTbody"><tr><td colspan="6" style="text-align:center;padding:24px">Loading database records…</td></tr></tbody></table></div></div><div id="adminInspectionModalContainer"></div>`;
  if (window.lucide) lucide.createIcons();
  loadAdminProviders();
}
window.showProvidersPage = showProvidersPage;
window.showProviderChangesPage = showProvidersPage;

async function loadAdminProviders() {
  const tbody = document.getElementById('adminProvidersTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px">Loading database records…</td></tr>';
  try {
    const status = document.getElementById('adminStatusFilter')?.value || '';
    const query = new URLSearchParams(); if (status) query.set('status', status);
    const res = await fetch(ADMIN_API + '/providers?' + query.toString(), {cache:'no-store'});
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'HTTP ' + res.status);
    window.ADMIN_PROVIDERS_CACHE = data.providers || [];
    filterAdminProviders(document.getElementById('adminProviderSearch')?.value || '');
  } catch (err) {
    console.error('Provider directory load failed:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#b91c1c">Could not load real providers. Check backend/database. ${adminEscape(err.message)}</td></tr>`;
  }
}
function renderAdminProvidersTable(list) {
  const tbody = document.getElementById('adminProvidersTbody'); if (!tbody) return;
  if (!list.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px">No matching provider records in the database.</td></tr>'; return; }
  tbody.innerHTML = list.map(p => {
    const status = p.status || 'pending_verification';
    const statusText = status === 'active' ? 'Approved & Published' : status === 'rejected' ? 'Rejected' : status === 'suspended' ? 'Suspended' : 'Pending review';
    const location = [p.city,p.state,p.province].filter(Boolean).map(adminEscape).join(', ') || 'Not provided';
    const plan = p.plan ? adminEscape(p.plan) : 'Not selected / not stored';
    return `<tr><td><strong>${adminEscape(p.name)}</strong><div style="font-size:11px;color:#64748b">${adminEscape(p.phone || p.email || 'No contact saved')}</div></td>
      <td>${adminEscape(p.provider_type || p.category || 'Not specified')}</td><td>${location}</td>
      <td><span class="status-badge ${status==='active'?'active':status==='rejected'?'rejected':'pending'}">${statusText}</span></td>
      <td>${plan}</td><td><button class="primary-button" style="padding:5px 12px;font-size:11px" onclick="openProviderInspectionModal('${adminEscape(p.id)}')">Inspect</button></td></tr>`;
  }).join('');
}
window.openProviderInspectionModal = function(id) {
  const p = window.ADMIN_PROVIDERS_CACHE.find(x => String(x.id) === String(id));
  const container = document.getElementById('adminInspectionModalContainer'); if (!container || !p) return;
  const status = p.status || 'pending_verification';
  container.innerHTML = `<div style="position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px"><div style="background:#fff;width:100%;max-width:600px;border-radius:16px;overflow:hidden;font-size:12px">
    <div style="padding:16px 20px;background:#0f172a;color:#fff;display:flex;justify-content:space-between"><div><small>PROVIDER REVIEW</small><h3>${adminEscape(p.name)}</h3></div><button onclick="closeAdminInspectionModal()">✕</button></div>
    <div style="padding:20px;max-height:65vh;overflow:auto;display:grid;gap:10px"><div><b>Category:</b> ${adminEscape(p.category || p.provider_type || 'Not provided')}</div><div><b>Location:</b> ${adminEscape([p.address,p.city,p.state,p.province].filter(Boolean).join(', ') || 'Not provided')}</div><div><b>Phone:</b> ${adminEscape(p.phone || 'Not provided')}</div><div><b>Email:</b> ${adminEscape(p.email || 'Not provided')}</div><div><b>About:</b> ${adminEscape(p.description || p.about || 'Not provided')}</div><div><b>Verification:</b> ${adminEscape(p.verification_status || status)}</div><div><b>Published on marketplace:</b> ${p.is_published ? 'Yes' : 'No'}</div><div><b>Plan:</b> ${adminEscape(p.plan || 'Not stored in current database schema')}</div><small>Only information actually saved in the database is shown here. No licence or document verification is assumed.</small></div>
    <div style="padding:16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #eee"><button onclick="closeAdminInspectionModal()">Close</button><button onclick="setProviderStatus('${adminEscape(p.id)}','rejected')">Reject</button><button onclick="setProviderStatus('${adminEscape(p.id)}','active')">Approve & Publish</button></div></div></div>`;
};
window.closeAdminInspectionModal = function(){ const c=document.getElementById('adminInspectionModalContainer'); if(c)c.innerHTML=''; };
window.setProviderStatus = async function(id,newStatus) {
  try {
    const res = await fetch(ADMIN_API + '/providers/' + encodeURIComponent(id) + '/status', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Status update failed');
    window.closeAdminInspectionModal();
    await loadAdminProviders();
    if (typeof initDashboard === 'function') initDashboard();
    alert(newStatus === 'active' ? 'Provider approved and published.' : 'Provider rejected.');
  } catch(err) { alert('Change was not saved: ' + err.message); }
};
function filterAdminProviders(val) {
  const q=String(val||'').toLowerCase();
  renderAdminProvidersTable((window.ADMIN_PROVIDERS_CACHE||[]).filter(p => [p.name,p.city,p.phone,p.email,p.category,p.provider_type].some(v=>String(v||'').toLowerCase().includes(q))));
}
function filterAdminProvidersByStatus(status) { loadAdminProvidersWithStatus(status); }
async function loadAdminProvidersWithStatus(status) {
  const tbody=document.getElementById('adminProvidersTbody'); if(!tbody)return;
  tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px">Loading…</td></tr>';
  try { const q=new URLSearchParams();if(status)q.set('status',status);const res=await fetch(ADMIN_API+'/providers?'+q.toString(),{cache:'no-store'});const data=await res.json();if(!res.ok||!data.success)throw new Error(data.error||'Request failed');window.ADMIN_PROVIDERS_CACHE=data.providers||[];filterAdminProviders(document.getElementById('adminProviderSearch')?.value||''); }
  catch(err){tbody.innerHTML=`<tr><td colspan="6">Database load failed: ${adminEscape(err.message)}</td></tr>`;}
}
