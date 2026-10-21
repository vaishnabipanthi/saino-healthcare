(function () {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const host = () => document.getElementById('pageContent');
  const button = (label, attrs = '') => `<button class="primary-button" ${attrs}>${esc(label)}</button>`;
  const table = (headers, rows, empty) => `<div class="panel"><div class="table-container"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" style="padding:26px;text-align:center;color:#64748b">${esc(empty)}</td></tr>`}</tbody></table></div></div>`;
  const intro = (kicker, title, description, action = '') => `<div class="page-intro"><div><p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2><p class="muted">${esc(description)}</p></div>${action}</div>`;
  const toast = (msg) => window.showAdminToast ? window.showAdminToast(msg) : window.alert(msg);
  const date = (value) => value ? new Date(value).toLocaleString() : '—';
  const npr = (value) => value == null || value === '' ? '—' : `₹${Number(value).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

  async function loadPage(page, opts = {}) {
    const root = host(); if (!root) return;
    if (page === 'appointments' || page === 'live-operations') return showBookings(page);
    if (page === 'live-queue') return showBookings(page, 'waiting');
    if (page === 'users' || page === 'roles') return showUsers(page);
    if (page === 'payments' || page === 'plans') return showPayments(page);
    if (page === 'qr-management') return showQr();
    if (page === 'notifications') return showNotifications();
    if (page === 'audit') return showAudit();
    if (page === 'marketplace') return showReviews();
    if (page === 'analytics') return showAnalytics();
    if (page === 'settings' || page === 'system-health') return showSettings(page);
    if (page === 'telemedicine') return showBookings(page, 'video');
    if (page === 'disputes') return showBookings(page, 'cancelled');
    return showNotConnected(page);
  }

  async function showBookings(page, forcedStatus = '') {
    const root = host(); if (!root) return;
    const title = page === 'live-queue' ? 'Live Queue & Tokens' : (page === 'telemedicine' ? 'Telemedicine Bookings' : (page === 'disputes' ? 'Cancelled / Exception Bookings' : 'Bookings & Appointments'));
    root.innerHTML = intro('BOOKING OPERATIONS', title, 'Bookings created on the patient website or provider reception are read from the shared PostgreSQL booking table.') +
      `<div class="panel"><div class="provider-toolbar"><input id="adminBookingSearch" type="search" placeholder="Search Booking ID, patient or provider"><select id="adminBookingStatus"><option value="">All statuses</option>${['pending','pending_payment','confirmed','checked_in','waiting','in_progress','completed','cancelled','no_show'].map(s=>`<option value="${s}" ${forcedStatus===s?'selected':''}>${s.replace(/_/g,' ')}</option>`).join('')}</select><button id="refreshAdminBookings" class="primary-button">Refresh</button></div><div id="adminBookingsTable" style="padding:12px">Loading booking records…</div></div>`;
    const load = async () => {
      const search = document.getElementById('adminBookingSearch').value;
      const status = document.getElementById('adminBookingStatus').value || forcedStatus;
      try {
        const q = new URLSearchParams(); if(search)q.set('search',search); if(status)q.set('status',status);
        const data = await window.adminApi('/bookings?' + q.toString());
        const rows = (data.rows||[]).map(b => `<tr><td><strong>${esc(b.booking_id)}</strong><div style="font-size:11px;color:#64748b">PID ${esc(b.patient_id||'—')} · Visit ${esc(b.visit_id||'not started')}</div></td><td>${esc(b.patient_name)}<div style="font-size:11px;color:#64748b">${esc(b.patient_phone||'')} ${esc(b.patient_email||'')}</div></td><td>${esc(b.provider_name)}<div style="font-size:11px;color:#64748b">${esc(b.doctor_name||b.service_name||'—')}</div></td><td>${esc(b.source||'—')} / ${esc(b.consultation_type||'in_person')}</td><td>${esc(b.appointment_date||'—')}<div style="font-size:11px;color:#64748b">${esc(b.slot_time||'—')} · Token ${esc(b.token||'—')}</div></td><td>${esc(b.status||'pending')}<div style="font-size:11px;color:#64748b">Payment: ${esc(b.payment_status||'pending')}</div></td><td>${npr(b.amount)}</td><td><select data-booking-status="${esc(b.id)}" style="max-width:145px"><option value="">Change status…</option>${['pending','confirmed','checked_in','waiting','in_progress','completed','cancelled','no_show'].map(s=>`<option value="${s}">${s.replace(/_/g,' ')}</option>`).join('')}</select><button class="text-button" data-save-booking="${esc(b.id)}">Save</button></td></tr>`).join('');
        document.getElementById('adminBookingsTable').innerHTML = table(['BOOKING / PATIENT IDS','PATIENT','PROVIDER / CARE','SOURCE / TYPE','DATE / QUEUE','STATUS / PAYMENT','AMOUNT','ADMIN ACTION'], rows, 'No booking records found. Create a test booking on the patient website.');
        root.querySelectorAll('[data-save-booking]').forEach(btn => btn.addEventListener('click', async () => {
          const select = root.querySelector(`[data-booking-status="${CSS.escape(btn.dataset.saveBooking)}"]`);
          if (!select || !select.value) return toast('Choose a booking status first.');
          try { await window.adminApi('/bookings/'+encodeURIComponent(btn.dataset.saveBooking)+'/status',{method:'PATCH',body:JSON.stringify({status:select.value})}); toast('Booking status saved.'); await load(); if(window.refreshAdminStats)window.refreshAdminStats(); }
          catch(e){toast(e.message);}
        }));
      } catch(e) { document.getElementById('adminBookingsTable').textContent = e.message; }
    };
    document.getElementById('refreshAdminBookings').addEventListener('click',load);
    document.getElementById('adminBookingSearch').addEventListener('input',load);
    document.getElementById('adminBookingStatus').addEventListener('change',load);
    await load();
  }

  async function showUsers(page) {
    const root=host(); if(!root)return;
    const rolePage = page === 'roles';
    root.innerHTML = intro(rolePage?'ACCESS CONTROL':'PLATFORM MANAGEMENT',rolePage?'Users & Roles':'User Directory',rolePage?'Role changes are restricted to Super Admin. Account activation changes are audited.':'Actual accounts from the users table; no demo users are inserted.') +
      `<div class="panel"><div class="provider-toolbar"><input id="adminUserSearch" type="search" placeholder="Search name, email, phone or role"><button class="primary-button" id="refreshAdminUsers">Refresh</button></div><div id="adminUsersTable" style="padding:12px">Loading users…</div></div>`;
    const load=async()=>{
      try{
        const q=new URLSearchParams();if(document.getElementById('adminUserSearch').value)q.set('search',document.getElementById('adminUserSearch').value);
        const data=await window.adminApi('/users?'+q.toString());
        const rows=(data.rows||[]).map(u=>`<tr><td><strong>${esc(u.full_name||'—')}</strong><div style="font-size:11px;color:#64748b">#${esc(u.id)} · Created ${esc(date(u.created_at))}</div></td><td>${esc(u.email||'—')}<div style="font-size:11px;color:#64748b">${esc(u.phone||'')}</div></td><td>${esc(u.role)}</td><td>${u.is_active?'Active':'Inactive'}</td><td>${esc(u.provider_name||'—')}</td><td><button class="primary-button" data-user-active="${esc(u.id)}" data-active="${u.is_active?'false':'true'}">${u.is_active?'Deactivate':'Activate'}</button>${rolePage?` <select data-role="${esc(u.id)}"><option value="">Set role…</option>${['patient','provider','provider_staff','doctor','receptionist','support','operations','finance','admin','superadmin'].map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}</select><button class="text-button" data-role-save="${esc(u.id)}">Save role</button>`:''}</td></tr>`).join('');
        document.getElementById('adminUsersTable').innerHTML=table(['USER','CONTACT','ROLE','ACCOUNT','PROVIDER','ACTIONS'],rows,'No user records in the database yet.');
        root.querySelectorAll('[data-user-active]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.adminApi('/users/'+btn.dataset.userActive+'/status',{method:'PATCH',body:JSON.stringify({is_active:btn.dataset.active==='true'})});toast('User account status saved.');await load();}catch(e){toast(e.message);}}));
        root.querySelectorAll('[data-role-save]').forEach(btn=>btn.addEventListener('click',async()=>{const select=root.querySelector(`[data-role="${CSS.escape(btn.dataset.roleSave)}"]`);if(!select.value)return toast('Choose a role first.');try{await window.adminApi('/users/'+btn.dataset.roleSave+'/role',{method:'PATCH',body:JSON.stringify({role:select.value})});toast('Role updated.');await load();}catch(e){toast(e.message);}}));
      }catch(e){document.getElementById('adminUsersTable').textContent=e.message;}
    };
    document.getElementById('refreshAdminUsers').addEventListener('click',load);document.getElementById('adminUserSearch').addEventListener('input',load); await load();
  }

  async function showPayments(page) {
    const root=host(); if(!root)return;
    const isPlans=page==='plans';
    root.innerHTML=intro('BUSINESS & FINANCE',isPlans?'Plans & Subscriptions':'Payments & Settlements','Razorpay captures are verified server-side and recorded here with provider subscription and patient booking payments.')+
      `<div class="panel"><div class="provider-toolbar"><button class="primary-button" id="refreshAdminPayments">Refresh</button><span id="adminGatewayStatus" style="font-size:12px;color:#475569">Checking gateway status?</span></div><div id="adminPaymentsTable" style="padding:12px">Loading payment records…</div></div>`;
    const load=async()=>{try{const [data,stats]=await Promise.all([window.adminApi('/payments'),window.adminApi('/stats')]);document.getElementById('adminGatewayStatus').textContent='Gateway: '+(stats.stats?.paymentGateway||'not configured');const rows=(data.rows||[]).map(p=>`<tr><td>${esc(p.record_type)}</td><td>${esc(p.provider_name)}</td><td>${esc(p.patient_name||p.service_name||'—')}</td><td>${npr(p.amount)}</td><td>${esc(p.payment_method||'—')}</td><td>${esc(p.payment_status||'pending')}</td><td>${esc(p.reference||'—')}</td><td>${esc(date(p.created_at))}</td></tr>`).join('');document.getElementById('adminPaymentsTable').innerHTML=`<p style="font-size:12px;color:#475569;margin:0 0 12px">${(data.rows||[]).length} stored record(s). Recorded collection total: ${npr(data.totals?.recorded)}. This is not reconciled gateway revenue.</p>`+table(['TYPE','PROVIDER','PATIENT / PLAN','AMOUNT','METHOD','PAYMENT STATUS','REFERENCE','CREATED'],rows,'No payment/subscription records have been saved yet.');}catch(e){document.getElementById('adminPaymentsTable').textContent=e.message;}};
    document.getElementById('refreshAdminPayments').addEventListener('click',load);await load();window.__sainoAdminRefreshTimer=setInterval(()=>{if(['payments','plans'].includes(window.__sainoAdminPage)&&document.visibilityState==='visible')load();},15000);
  }

  async function showQr() {
    const root=host(); if(!root)return;
    root.innerHTML=intro('PATIENT ACQUISITION','QR Booking Management','Each QR is tied to a provider. Scans and bookings are counted separately. QR scans are only measured when a user opens a generated SAINO QR URL.')+
      `<div class="panel" style="padding:18px;margin-bottom:18px"><form id="adminQrForm" style="display:flex;gap:10px;flex-wrap:wrap"><select name="provider_id" required style="min-width:240px;padding:10px;border:1px solid #cbd5e1;border-radius:8px"><option value="">Choose provider…</option></select><input name="label" placeholder="QR label (e.g. Reception)" required style="padding:10px;border:1px solid #cbd5e1;border-radius:8px"><input name="branch_name" placeholder="Branch / department (optional)" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px"><button class="primary-button" type="submit">Generate QR</button></form></div><div id="adminQrTable">Loading QR codes…</div>`;
    try{const [providers,qrs]=await Promise.all([window.adminApi('/providers?limit=100'),window.adminApi('/qr')]);const select=root.querySelector('[name="provider_id"]');(providers.providers||[]).forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} · ${p.city||'No city'}`;select.appendChild(o);});
      const render=rows=>{const html=rows.map(q=>{const url=new URL('/api/public/qr/'+encodeURIComponent(q.code),window.SAINO_API_ORIGIN || location.origin).toString();const img='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='+encodeURIComponent(url);return `<tr><td><strong>${esc(q.label)}</strong><div style="font-size:11px;color:#64748b">${esc(q.branch_name||'No branch')}</div></td><td>${esc(q.provider_name)}</td><td><img src="${img}" width="78" height="78" alt="QR code" loading="lazy"><div style="font-size:10px;max-width:200px;word-break:break-all"><a target="_blank" rel="noopener" href="${esc(url)}">Open QR destination</a></div></td><td>${esc(q.status)}</td><td>${esc(q.total_scans||0)} total / ${esc(q.unique_scans||0)} unique</td><td>${esc(q.bookings_since_created||0)}</td><td><button class="primary-button" data-qr-toggle="${esc(q.id)}" data-status="${q.status==='active'?'disabled':'active'}">${q.status==='active'?'Disable':'Activate'}</button></td></tr>`;}).join('');document.getElementById('adminQrTable').innerHTML=table(['LABEL / BRANCH','PROVIDER','QR DESTINATION','STATUS','SCANS','BOOKINGS','ACTION'],html,'No QR codes created. Generate one above.');root.querySelectorAll('[data-qr-toggle]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.adminApi('/qr/'+btn.dataset.qrToggle+'/status',{method:'PATCH',body:JSON.stringify({status:btn.dataset.status})});await loadQrRows();}catch(e){toast(e.message);}}));};
      async function loadQrRows(){const data=await window.adminApi('/qr');render(data.rows||[]);} render(qrs.rows||[]);
      root.querySelector('#adminQrForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);try{await window.adminApi('/qr',{method:'POST',body:JSON.stringify({provider_id:fd.get('provider_id'),label:fd.get('label'),branch_name:fd.get('branch_name')})});toast('QR saved.');e.target.reset();await loadQrRows();}catch(err){toast(err.message);}});
    }catch(e){root.querySelector('#adminQrTable').textContent=e.message;}
  }

  async function showNotifications() {
    const root=host();if(!root)return;root.innerHTML=intro('COMMUNICATIONS','Admin Notifications','Registration and provider status notifications saved by backend transactions.')+`<div class="panel"><div style="padding:14px;text-align:right"><button class="primary-button" id="refreshAdminNotifications">Refresh</button></div><div id="adminNotificationsTable">Loading notifications…</div></div>`;
    const load=async()=>{try{const data=await window.adminApi('/notifications');const rows=(data.rows||[]).map(n=>`<tr><td>${n.is_read?'Read':'Unread'}</td><td><strong>${esc(n.title)}</strong><div style="font-size:11px;color:#64748b">${esc(n.message)}</div></td><td>${esc(n.provider_name||'—')}</td><td>${esc(date(n.created_at))}</td><td>${n.is_read?'—':button('Mark read',`data-notif-read="${esc(n.id)}"`)}</td></tr>`).join('');document.getElementById('adminNotificationsTable').innerHTML=table(['STATE','MESSAGE','PROVIDER','DATE','ACTION'],rows,'No notifications recorded yet.');root.querySelectorAll('[data-notif-read]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.adminApi('/notifications/'+btn.dataset.notifRead+'/read',{method:'PATCH',body:'{}'});await load();}catch(e){toast(e.message);}}));}catch(e){document.getElementById('adminNotificationsTable').textContent=e.message;}};document.getElementById('refreshAdminNotifications').addEventListener('click',load);await load();window.__sainoAdminRefreshTimer=setInterval(()=>{if(window.__sainoAdminPage==='notifications'&&document.visibilityState==='visible')load();},15000);
  }

  async function showAudit() {
    const root=host();if(!root)return;root.innerHTML=intro('CONTROL & SECURITY','Audit Logs','Database audit events for admin logins, provider approval, booking updates, account changes and moderation. This page does not show invented uptime metrics.')+`<div class="panel"><div style="padding:14px;text-align:right"><button class="primary-button" id="refreshAudit">Refresh</button></div><div id="auditTable">Loading audit log…</div></div>`;
    const load=async()=>{try{const data=await window.adminApi('/audit?limit=300');const rows=(data.rows||[]).map(a=>`<tr><td>${esc(date(a.created_at))}</td><td>${esc(a.actor_name||a.actor_email||'System')}</td><td><strong>${esc(a.action)}</strong></td><td>${esc(a.entity_type)} ${esc(a.entity_id||'')}</td><td><code style="white-space:pre-wrap">${esc(JSON.stringify(a.details||{}))}</code></td></tr>`).join('');document.getElementById('auditTable').innerHTML=table(['WHEN','ACTOR','ACTION','ENTITY','DETAILS'],rows,'No audit events recorded yet.');}catch(e){document.getElementById('auditTable').textContent=e.message;}};document.getElementById('refreshAudit').addEventListener('click',load);await load();
  }

  async function showReviews() {
    const root=host();if(!root)return;root.innerHTML=intro('MARKETPLACE TRUST','Reviews & Moderation','Only review rows stored in PostgreSQL appear. Hide a review if it violates policy; hidden status is persisted in the database.')+`<div class="panel"><div style="padding:14px;display:flex;gap:10px;align-items:center"><label><input id="showHiddenReviews" type="checkbox"> Include hidden</label><button id="refreshAdminReviews" class="primary-button">Refresh</button></div><div id="adminReviewsTable">Loading reviews…</div></div>`;
    const load=async()=>{try{const data=await window.adminApi('/reviews?include_hidden='+(document.getElementById('showHiddenReviews').checked?'true':'false'));const rows=(data.rows||[]).map(r=>`<tr><td>${esc(r.provider_name||'—')}</td><td>${esc(r.patient_name)}</td><td>${esc(r.rating)} / 5</td><td>${esc(r.comment)}</td><td>${r.is_hidden?'Hidden':'Visible'}</td><td>${esc(r.response||'—')}</td><td><button class="primary-button" data-review-hide="${esc(r.id)}" data-hide="${r.is_hidden?'false':'true'}">${r.is_hidden?'Restore':'Hide'}</button><button class="text-button" data-review-reply="${esc(r.id)}">Reply</button></td></tr>`).join('');document.getElementById('adminReviewsTable').innerHTML=table(['PROVIDER','PATIENT','RATING','REVIEW','VISIBILITY','RESPONSE','ACTION'],rows,'No reviews are stored in PostgreSQL yet.');root.querySelectorAll('[data-review-hide]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.adminApi('/reviews/'+btn.dataset.reviewHide+'/moderation',{method:'PATCH',body:JSON.stringify({is_hidden:btn.dataset.hide==='true'})});await load();}catch(e){toast(e.message);}}));root.querySelectorAll('[data-review-reply]').forEach(btn=>btn.addEventListener('click',async()=>{const response=prompt('Write a reply to this review:');if(!response)return;try{await window.adminApi('/reviews/'+btn.dataset.reviewReply+'/respond',{method:'POST',body:JSON.stringify({response})});toast('Reply saved.');await load();}catch(e){toast(e.message);}}));}catch(e){document.getElementById('adminReviewsTable').textContent=e.message;}};document.getElementById('refreshAdminReviews').addEventListener('click',load);document.getElementById('showHiddenReviews').addEventListener('change',load);await load();
  }

  async function showAnalytics() {
    const root=host();if(!root)return;root.innerHTML=intro('REPORTING','Analytics & Reports','These totals are computed from database records, not simulated charts.')+`<div class="panel" style="padding:20px"><button id="refreshAdminAnalytics" class="primary-button">Load report</button><div id="adminAnalyticsTable" style="margin-top:18px">Loading actual counts…</div></div>`;
    const load=async()=>{try{const data=await window.adminApi('/stats');const s=data.stats||{};const entries=[['Patient accounts',s.totalUsers],['All providers',s.totalProviders],['Published providers',s.verifiedProviders],['Pending verification',s.pendingProviders],['Total doctors',s.totalDoctors],['Active services',s.activeServices],['Bookings',s.appointments],['Visible reviews',s.reviews],['Active QR codes',s.activeQrCodes],['QR scans',s.qrScans],['Collected revenue',npr(s.revenue)],['Provider payment records',s.providerPaymentRows],['Recorded provider payments',npr(s.recordedProviderPayments)],['Subscriptions pending',s.subscriptionPending],['Confirmed subscription amount',npr(s.confirmedSubscriptionAmount)],['Payment gateway',s.paymentGateway]];document.getElementById('adminAnalyticsTable').innerHTML=table(['METRIC','DATABASE VALUE'],entries.map(([a,b])=>`<tr><td>${esc(a)}</td><td><strong>${esc(b==null?'Not configured':b)}</strong></td></tr>`).join(''),'No analytics data.');}catch(e){document.getElementById('adminAnalyticsTable').textContent=e.message;}};document.getElementById('refreshAdminAnalytics').addEventListener('click',load);await load();window.__sainoAdminRefreshTimer=setInterval(()=>{if(window.__sainoAdminPage==='analytics'&&document.visibilityState==='visible')load();},15000);
  }

  async function showSettings(page) {
    const root=host();if(!root)return;
    if(page==='system-health'){
      root.innerHTML=intro('SYSTEM OPERATIONS','System Health','API/database status is checked live. Third-party integration states remain unconfigured until credentials and endpoints are added.')+`<div class="panel" style="padding:20px"><button class="primary-button" id="checkSystemHealth">Check now</button><pre id="systemHealthOutput" style="white-space:pre-wrap;margin-top:16px">Checking database connection…</pre></div>`;
      const check=async()=>{const out=document.getElementById('systemHealthOutput');try{const response=await fetch('/api/health');const data=await response.json();out.textContent=JSON.stringify(data,null,2);}catch(e){out.textContent='Health endpoint could not be reached: '+e.message;}};document.getElementById('checkSystemHealth').addEventListener('click',check);await check();return;
    }
    root.innerHTML=intro('PLATFORM CONFIGURATION','Global Settings','Settings persist in PostgreSQL. Payment, SMS, email and video integrations are not shown as active unless configured.')+`<div class="panel" style="padding:18px"><h3>Integration Status</h3><div id="adminSettingsList" style="margin-top:12px">Loading settings…</div><form id="adminSettingForm" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><input name="key" placeholder="Setting key" required style="padding:10px;border:1px solid #cbd5e1;border-radius:8px"><input name="value" placeholder="JSON value, e.g. \"Asia/Kathmandu\"" required style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;min-width:280px"><button class="primary-button">Save setting</button></form></div>`;
    try{const data=await window.adminApi('/settings');document.getElementById('adminSettingsList').innerHTML=`<p><strong>Payment gateway:</strong> ${esc(data.integrations?.payment_gateway||'not configured')}</p><p><strong>SMS:</strong> ${esc(data.integrations?.sms||'not configured')}</p><p><strong>Email:</strong> ${esc(data.integrations?.email||'not configured')}</p><p><strong>Video consultation:</strong> ${esc(data.integrations?.video||'not configured')}</p>`+(data.rows||[]).map(s=>`<div style="border-top:1px solid #e2e8f0;padding:10px 0"><strong>${esc(s.setting_key)}</strong><pre style="white-space:pre-wrap">${esc(JSON.stringify(s.setting_value))}</pre></div>`).join('');}catch(e){document.getElementById('adminSettingsList').textContent=e.message;}
    document.getElementById('adminSettingForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);let value;try{value=JSON.parse(fd.get('value'));}catch(_){return toast('Value must be valid JSON. Example: "Asia/Kathmandu"');}try{await window.adminApi('/settings/'+encodeURIComponent(fd.get('key')),{method:'PUT',body:JSON.stringify({value})});toast('Setting saved.');window.changePage('settings');}catch(err){toast(err.message);}});
  }

  function showNotConnected(page) {
    const root=host();if(!root)return;const labels={'live-operations':'Live Operations','disputes':'Support & Disputes','telemedicine':'Telemedicine','plans':'Plans & Subscriptions'};
    root.innerHTML=intro('MODULE STATUS',labels[page]||page,'This specific workflow is not yet fully configured in the current backend. The interface deliberately avoids fake live counters.')+`<div class="panel" style="padding:20px"><h3>What is currently connected</h3><p style="color:#475569;line-height:1.6">Provider records, verification state, patient bookings, database user accounts, recorded provider payments, QR codes, notifications, review moderation and audit events are backed by PostgreSQL. Any third-party payment, video, SMS, email or EMR/HIS integration requires the provider credentials and integration details before it can be shown as connected.</p></div>`;
  }
  window.AdminLiveModules={loadPage};
})();
