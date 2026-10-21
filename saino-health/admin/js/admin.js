(function () {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pageLabels = {
    dashboard:'Executive Dashboard','live-operations':'Live Operations',analytics:'Analytics & Reports',providers:'Provider Network',verification:'Verification & Setup',users:'Patient & User',appointments:'Bookings & Appointments','live-queue':'Live Queue & Tokens',telemedicine:'Telemedicine',marketplace:'Reviews & Marketplace', 'qr-management':'QR Management', payments:'Payments & Settlements',plans:'Plans & Subscriptions',disputes:'Support & Exceptions',roles:'Users & Roles',audit:'Audit Logs',notifications:'Notifications','system-health':'System Health',settings:'Global Settings'
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-page]');
      if (nav && nav.dataset.page) {
        event.preventDefault();
        changePage(nav.dataset.page);
      }
    });
    if (window.lucide) window.lucide.createIcons();
    if (sessionStorage.getItem('SAINO_ADMIN_TOKEN')) changePage('dashboard');
  });

  window.showAdminToast = function (message) {
    let toast = document.getElementById('sainoAdminToast');
    if (!toast) {
      toast = document.createElement('div'); toast.id = 'sainoAdminToast';
      toast.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:100001;max-width:420px;padding:13px 18px;border-radius:10px;background:#122742;color:white;box-shadow:0 12px 32px #0002;font:600 13px Inter,Arial,sans-serif';
      document.body.appendChild(toast);
    }
    toast.textContent = String(message || 'Done'); toast.style.display = 'block';
    clearTimeout(window.__sainoAdminToastTimer);
    window.__sainoAdminToastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
  };

  window.changePage = async function changePage(page) {
    clearInterval(window.__sainoAdminRefreshTimer);
    window.__sainoAdminPage = page;
    if (!sessionStorage.getItem('SAINO_ADMIN_TOKEN')) { if (window.showAdminLogin) window.showAdminLogin('Please sign in first.'); return; }
    const root = document.getElementById('pageContent');
    if (!root) return;
    document.querySelectorAll('[data-page]').forEach(item => {
      if (item.classList && item.classList.contains('nav-item')) item.classList.toggle('active', item.dataset.page === page);
    });
    const title = document.getElementById('pageTitle') || document.querySelector('.topbar h1, .topbar-title');
    if (title) title.textContent = pageLabels[page] || page;
    root.innerHTML = '<div class="panel" style="padding:28px;color:#64748b">Loading records from PostgreSQL…</div>';
    try {
      if (page === 'dashboard') await renderDashboard();
      else if (page === 'providers' || page === 'verification') {
        if (window.showProvidersPage) await window.showProvidersPage(page === 'verification' ? 'pending' : 'all');
        else if (window.loadProviders) await window.loadProviders(page === 'verification' ? 'pending' : 'all');
        else root.innerHTML = '<div class="panel" style="padding:20px">Provider module not available.</div>';
      }
      else if (window.AdminLiveModules && window.AdminLiveModules.loadPage) await window.AdminLiveModules.loadPage(page);
      else root.innerHTML = '<div class="panel" style="padding:20px">This module is not available.</div>';
    } catch (error) {
      root.innerHTML = '<div class="panel" style="padding:22px;color:#b91c1c"><h2>Could not load ' + esc(pageLabels[page] || page) + '</h2><p style="margin-top:8px;color:#475569">' + esc(error.message || 'Backend request failed.') + '</p><button class="primary-button" id="retryAdminPage" style="margin-top:14px">Retry</button></div>';
      const retry = document.getElementById('retryAdminPage'); if (retry) retry.addEventListener('click', () => changePage(page));
    }
    if (window.lucide) window.lucide.createIcons();
  };

  async function renderDashboard() {
    const root = document.getElementById('pageContent');
    const [statsData, providersData, bookingsData, qrData] = await Promise.all([
      window.adminApi('/stats'), window.adminApi('/providers?limit=8'), window.adminApi('/bookings?limit=8'), window.adminApi('/qr')
    ]);
    const s = statsData.stats || {};
    const pending = statsData.verification || [];
    const activities = statsData.activities || [];
    const recentBookings = (bookingsData.rows || []).slice(0, 6);
    const kpis = [
      ['Registered patients', s.totalUsers ?? 0, 'Users recorded in PostgreSQL'],
      ['Healthcare providers', s.totalProviders ?? 0, 'Provider accounts and listings'],
      ['Published providers', s.verifiedProviders ?? 0, 'Verified and visible in marketplace'],
      ['Total doctors', s.totalDoctors ?? 0, 'Active doctor records in PostgreSQL'],
      ['Active services', s.activeServices ?? 0, 'Active service records in PostgreSQL'],
      ['Bookings', s.appointments ?? 0, 'Saved website, QR and reception bookings'],
      ['Active QR codes', s.activeQrCodes ?? 0, 'Generated and enabled provider QR codes'],
      ['Reviews', s.reviews ?? 0, 'Visible review records'],
      ['QR scans', s.qrScans ?? 0, 'Tracked scans; not bookings'],
      ['Collected revenue', `${s.currency || 'INR'} ${Number(s.revenue || 0).toLocaleString('en-IN')}`, 'Verified patient payments and paid plans']
    ];
    root.innerHTML = `<div class="page-intro"><div><p class="eyebrow">LIVE OPERATIONS</p><h2>Executive Dashboard</h2><p class="muted">Counts below are read from the shared PostgreSQL database. Empty values stay at zero; no demo counters are added.</p></div><button id="refreshDashboard" class="primary-button">Refresh data</button></div>
      <div class="dashboard-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:18px 0">${kpis.map(k=>`<div class="panel" style="padding:17px"><div style="font-size:12px;color:#64748b">${esc(k[0])}</div><div style="font-weight:800;font-size:28px;margin:7px 0;color:#14233b">${Number(k[1]||0).toLocaleString()}</div><div style="font-size:11px;color:#64748b">${esc(k[2])}</div></div>`).join('')}</div>
      <div class="dashboard-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">
        <section class="panel" style="padding:18px"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Pending provider verification</h3><button class="text-button" data-page="verification">View queue</button></div><div style="margin-top:12px">${pending.length ? pending.map(p=>`<div style="display:flex;gap:12px;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid #e2e8f0"><div><strong>${esc(p.provider||p.name||'Provider')}</strong><div style="font-size:12px;color:#64748b">${esc(p.category||p.provider_type||'Provider')} · ${esc(p.location||p.city||'Location not provided')}</div></div><span style="font-size:11px;color:#a16207">${esc(p.verification_status||'pending')}</span></div>`).join('') : '<p style="padding:16px 0;color:#64748b">No provider registrations are waiting for verification.</p>'}</div></section>
        <section class="panel" style="padding:18px"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Recent bookings</h3><button class="text-button" data-page="appointments">View all</button></div><div style="overflow:auto;margin-top:12px"><table class="data-table"><thead><tr><th>Booking ID</th><th>Patient</th><th>Provider</th><th>Status</th></tr></thead><tbody>${recentBookings.length?recentBookings.map(b=>`<tr><td>${esc(b.booking_id||'—')}</td><td>${esc(b.patient_name||'—')}</td><td>${esc(b.provider_name||'—')}</td><td>${esc(b.status||'pending')}</td></tr>`).join(''):'<tr><td colspan="4" style="padding:20px;color:#64748b">No booking records yet. Test a booking from the patient website.</td></tr>'}</tbody></table></div></section>
        <section class="panel" style="padding:18px"><h3>Financial records</h3><p style="margin:12px 0;color:#64748b;font-size:12px">Collected revenue includes Razorpay verified patient bookings and paid provider plans recorded in PostgreSQL.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="padding:12px;background:#f8fafc;border-radius:8px"><div style="font-size:11px;color:#64748b">Verified collected revenue (${esc(s.currency||'INR')})</div><strong style="font-size:20px">${Number(s.revenue||0).toLocaleString('en-IN')}</strong></div><div style="padding:12px;background:#f8fafc;border-radius:8px"><div style="font-size:11px;color:#64748b">Pending subscriptions</div><strong style="font-size:20px">${Number(s.subscriptionPending||0).toLocaleString()}</strong></div></div><button class="primary-button" data-page="payments" style="margin-top:13px">Open Payments</button></section>
        <section class="panel" style="padding:18px"><h3>Recent audited actions</h3><div style="margin-top:12px">${activities.length?activities.slice(0,6).map(a=>`<div style="padding:10px 0;border-top:1px solid #e2e8f0"><strong style="font-size:12px">${esc(a.title||a.action||'Action')}</strong><div style="font-size:11px;color:#64748b">${esc(a.description||a.entity_type||'')} · ${a.time?esc(new Date(a.time).toLocaleString()):'—'}</div></div>`).join(''):'<p style="color:#64748b;padding:12px 0">No audit actions recorded yet.</p>'}</div><button class="text-button" data-page="audit">View audit log</button></section>
      </div>
      <p style="font-size:11px;color:#64748b;margin-top:16px">Payment gateway: ${esc(s.paymentGateway||'not configured')}. External SMS, email, telemedicine video and HIS/EMR are not reported active unless separately configured.</p>`;
    document.getElementById('refreshDashboard').addEventListener('click', () => changePage('dashboard'));
    window.__sainoAdminRefreshTimer = setInterval(() => {
      if (window.__sainoAdminPage === 'dashboard' && document.visibilityState === 'visible') changePage('dashboard');
    }, 15000);
  }

  window.refreshAdminStats = () => changePage('dashboard');
})();
