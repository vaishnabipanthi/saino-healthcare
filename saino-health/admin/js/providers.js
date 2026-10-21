(function () {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const statusLabel = p => p.is_published && p.verification_status === 'verified' ? 'Live' : (p.status === 'setup_in_progress' ? 'Provider completing profile' : (p.status === 'pending_payment' ? 'Payment pending' : (p.verification_status === 'rejected' ? 'Rejected' : (p.verification_status === 'suspended' ? 'Suspended' : 'Pending review'))));
  const statusClass = p => p.is_published && p.verification_status === 'verified' ? 'active' : 'pending';
  let cache = [];
  let currentStatus = '';
  let currentSearch = '';

  window.showProvidersPage = function (status = '') {
    currentStatus = (status === 'verification' || status === 'pending') ? 'pending_verification' : ((status && status !== 'all') ? status : (status === 'all' ? '' : currentStatus));
    const host = document.getElementById('pageContent');
    if (!host) return;
    host.innerHTML = `<div class="page-intro"><div><p class="eyebrow">MARKETPLACE MANAGEMENT</p><h2>Provider Directory</h2><p class="muted">Live provider records from PostgreSQL. New registrations stay unpublished until approved.</p></div><button class="primary-button" id="refreshAdminProviders">Refresh list</button></div>
      <div class="panel provider-panel"><div class="provider-toolbar"><input id="adminProviderSearch" type="search" placeholder="Search provider, city, email or phone" value="${esc(currentSearch)}"><select id="adminStatusFilter"><option value="" ${!currentStatus?'selected':''}>All statuses</option><option value="pending_verification" ${currentStatus==='pending_verification'?'selected':''}>Pending verification</option><option value="active" ${currentStatus==='active'?'selected':''}>Published / live</option><option value="rejected" ${currentStatus==='rejected'?'selected':''}>Rejected</option><option value="suspended" ${currentStatus==='suspended'?'selected':''}>Suspended</option></select></div>
      <div class="table-container"><table class="data-table"><thead><tr><th>PROVIDER</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>PLAN</th><th>ACTIONS</th></tr></thead><tbody id="adminProvidersTbody"><tr><td colspan="6" style="padding:26px;text-align:center">Loading live providers…</td></tr></tbody></table></div></div><div id="adminInspectionModalContainer"></div>`;
    document.getElementById('refreshAdminProviders').addEventListener('click', loadAdminProviders);
    document.getElementById('adminProviderSearch').addEventListener('input', e => { currentSearch=e.target.value; renderAdminProvidersTable(filtered()); });
    document.getElementById('adminStatusFilter').addEventListener('change', e => { currentStatus=e.target.value; loadAdminProviders(); });
    loadAdminProviders();
  };

  function filtered() {
    const q = currentSearch.toLowerCase();
    return cache.filter(p => !q || [p.name,p.city,p.district,p.province,p.phone,p.email].some(v => String(v||'').toLowerCase().includes(q)));
  }
  async function loadAdminProviders() {
    const tbody = document.getElementById('adminProvidersTbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:26px;text-align:center">Loading from PostgreSQL…</td></tr>';
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (currentStatus) query.set('status', currentStatus);
      if (currentSearch) query.set('search', currentSearch);
      const data = await window.adminApi('/providers?' + query.toString());
      cache = data.providers || [];
      renderAdminProvidersTable(filtered());
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:26px;color:#b91c1c;text-align:center">${esc(error.message)} <button class="text-button" onclick="showProvidersPage()">Retry</button></td></tr>`;
    }
  }
  function renderAdminProvidersTable(list) {
    const tbody = document.getElementById('adminProvidersTbody');
    if (!tbody) return;
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="6" style="padding:28px;text-align:center;color:#64748b">No provider records match this filter. New List Your Care registrations will appear here.</td></tr>'; return; }
    tbody.innerHTML = list.map(p => `<tr>
      <td><strong>${esc(p.name)}</strong><div style="font-size:11px;color:#64748b">${esc(p.email || 'No email')} · ${esc(p.phone || 'No phone')}</div></td>
      <td>${esc(p.provider_type || p.category || 'Provider')}</td><td>${esc([p.city,p.district,p.province].filter(Boolean).join(', ') || 'Location not provided')}</td>
      <td><span class="status-badge ${statusClass(p)}">${esc(statusLabel(p))}</span></td><td>${esc(p.plan || 'Not selected')}</td>
      <td><div style="display:flex;gap:5px;flex-wrap:wrap"><button class="primary-button" style="padding:5px 9px;font-size:11px" data-provider-inspect="${esc(p.id)}">Details</button>${p.verification_status==='pending' && p.status==='pending' ? `<button class="primary-button" style="padding:5px 9px;font-size:11px;background:#0369a1" data-provider-status="onboarding_approved" data-provider-id="${esc(p.id)}">Approve dashboard access</button>` : (p.verification_status==='verified' && p.is_published ? `<button class="primary-button" style="padding:5px 9px;font-size:11px;background:#475569" data-provider-status="unpublished" data-provider-id="${esc(p.id)}">Unpublish</button>` : (p.status==='setup_in_progress' ? '<span style="font-size:11px;color:#0369a1;padding:6px">Waiting for provider profile</span>' : `<button class="primary-button" style="padding:5px 9px;font-size:11px;background:#15803d" data-provider-status="approved" data-provider-id="${esc(p.id)}">Approve & publish</button>`))}<button class="primary-button" style="padding:5px 9px;font-size:11px;background:#b91c1c" data-provider-status="rejected" data-provider-id="${esc(p.id)}">Reject</button><button class="primary-button" style="padding:5px 9px;font-size:11px;background:#475569" data-provider-status="suspended" data-provider-id="${esc(p.id)}">Suspend</button></div></td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-provider-inspect]').forEach(btn => btn.addEventListener('click', () => openProviderInspectionModal(btn.dataset.providerInspect)));
    tbody.querySelectorAll('[data-provider-status]').forEach(btn => btn.addEventListener('click', () => setProviderStatus(btn.dataset.providerId, btn.dataset.providerStatus)));
  }
  async function openProviderInspectionModal(id) {
    const modal = document.getElementById('adminInspectionModalContainer'); if (!modal) return;
    const provider = cache.find(p => String(p.id) === String(id)) || {};
    modal.innerHTML = `<div style="position:fixed;inset:0;z-index:9999;background:#0f172a99;display:flex;align-items:center;justify-content:center;padding:15px"><div style="background:white;width:min(680px,100%);max-height:85vh;overflow:auto;border-radius:14px;padding:24px"><div style="display:flex;justify-content:space-between;gap:12px"><div><p class="eyebrow">PROVIDER VERIFICATION</p><h2>${esc(provider.name || 'Provider')}</h2></div><button id="closeProviderDetail" class="primary-button">Close</button></div><div id="providerDetailContents">Loading database record…</div></div></div>`;
    modal.querySelector('#closeProviderDetail').addEventListener('click', () => modal.innerHTML = '');
    try {
      const data = await window.adminApi('/providers/' + encodeURIComponent(id));
      const p = data.provider || provider;
      const docs = data.documents || [];
      modal.querySelector('#providerDetailContents').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:18px">${[
        ['Email',p.email],['Phone',p.phone],['Type',p.provider_type || p.category],['Plan',p.plan],['City',p.city],['District',p.district],['Address',p.address],['Contact person',p.contact_person],['Registration no.',p.registration_no],['VAT/PAN',p.vatpan],['Verification',p.verification_status],['Published',p.is_published ? 'Yes' : 'No'],['Doctors', (data.doctors||[]).length],['Services', (data.services||[]).length],['Documents stored',docs.length]
      ].map(([k,v])=>`<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:9px"><small style="color:#64748b">${esc(k)}</small><div style="font-weight:700;margin-top:4px;overflow-wrap:anywhere">${esc(v == null || v === '' ? 'Not provided in database' : v)}</div></div>`).join('')}</div><p style="color:#64748b;font-size:12px;margin-top:14px">Only the values stored in PostgreSQL are shown. A missing licence/document has not been marked as verified.</p>`;
    } catch (error) { modal.querySelector('#providerDetailContents').textContent = error.message; }
  }
  window.openProviderInspectionModal = openProviderInspectionModal;
  window.closeAdminInspectionModal = () => { const m=document.getElementById('adminInspectionModalContainer'); if(m)m.innerHTML=''; };
  window.setProviderStatus = async function (id, status) {
    const verb = status === 'approved' ? 'approve and publish' : (status === 'rejected' ? 'reject' : (status === 'suspended' ? 'suspend' : 'unpublish'));
    if (!window.confirm(`Are you sure you want to ${verb} this provider?`)) return;
    try {
      await window.adminApi('/providers/' + encodeURIComponent(id) + '/status', { method:'POST', body:JSON.stringify({status}) });
      window.closeAdminInspectionModal();
      await loadAdminProviders();
      if (window.refreshAdminStats) window.refreshAdminStats();
      if (window.showAdminToast) window.showAdminToast('Provider status saved to PostgreSQL.');
    } catch (error) { window.alert(error.message); }
  };
  window.filterAdminProviders = value => { currentSearch=String(value||''); renderAdminProvidersTable(filtered()); };
  window.filterAdminProvidersByStatus = value => { currentStatus=value; loadAdminProviders(); };
})();
