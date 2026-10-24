(() => {
  "use strict";
  const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_ORIGIN = localHost ? "http://localhost:4000" : "https://saino-backend-td51.onrender.com";
  const API_BASE = API_ORIGIN + "/api/provider";
  const app = document.getElementById("app");
  const providerToken = localStorage.getItem("SAINO_PROVIDER_TOKEN");

  if (!providerToken) {
    window.location.replace("login.html");
    return;
  }

  function apiFetch(url, options = {}) {
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${providerToken}` };
    if (options.body && !Object.keys(headers).some(key => key.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, { ...options, headers });
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "◫" },
    { id: "complete_profile", label: "Complete Profile", icon: "✎" },
    { id: "appointments", label: "Appointments", icon: "▦" },
    { id: "queue", label: "Live Queue", icon: "✚" },
    { id: "doctors", label: "Doctors", icon: "🩺" },
    { id: "services", label: "Services", icon: "≡" },
    { id: "telemedicine", label: "Telemedicine", icon: "📹" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "reviews", label: "Reviews & Feedback", icon: "⭐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "qr_marketplace", label: "QR Management", icon: "📱" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "staff", label: "Staff & Reception", icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙" },
    { id: "billing", label: "Billing", icon: "🧾" }
  ];

  const state = {
    page: "dashboard",
    activeModal: null,
    editingDoctorId: null,
    editingServiceId: null,
    appointmentFilter: "all",
    provider: { name: "", tier: "Saino Free", plan_name: "Saino Free", city: "", rating: 0, reviews_count: 0, plan: "Saino Free", doctor_limit: null, service_limit: null },
    user: { name: "", role: "Provider Admin" },
    stats: { total: 0, marketplace: 0, walkin: 0, qr: 0, telemedicine: 0, waiting: 0 },
    queue: { serving: null, waiting: [], stats: { waiting: 0, completed: 0, issued: 0, avg_consult: 0 } },
    doctors: [],
    services: [],
    appointments: [],
    reviews: [],
    qrCodes: [],
    payments: [],
    staff: [],
    notifications: [],
    paymentTotals: { total: 0, cash: 0, digital: 0 },
    profileStatus: { complete: false, percent: 0, missing: [] },
    profileSubmittedModal: false
  };

  const operatingDays = [
    ['Monday', 'Mon'], ['Tuesday', 'Tue'], ['Wednesday', 'Wed'], ['Thursday', 'Thu'],
    ['Friday', 'Fri'], ['Saturday', 'Sat'], ['Sunday', 'Sun']
  ];
  function parseOperatingHours(value) {
    const result = {};
    String(value || '').split(';').forEach(part => {
      const match = part.trim().match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?\s*:?\s*(Closed|\d{1,2}:\d{2}\s*(?:-|to)\s*\d{1,2}:\d{2})$/i);
      if (!match) return;
      const day = match[1].slice(0, 3).toLowerCase();
      if (match[2].toLowerCase() === 'closed') result[day] = { closed: true };
      else {
        const times = match[2].match(/\d{1,2}:\d{2}/g) || [];
        result[day] = { closed: false, open: times[0] || '', close: times[1] || '' };
      }
    });
    return result;
  }
  function serializeOperatingHours(form) {
    return operatingDays.map(([, key]) => {
      const day = key.toLowerCase();
      if (!form.elements.namedItem(`hours_enabled_${day}`)?.checked) return '';
      const open = form.elements.namedItem(`hours_open_${day}`)?.value || '';
      const close = form.elements.namedItem(`hours_close_${day}`)?.value || '';
      return open && close ? `${key} ${open}-${close}` : '';
    }).filter(Boolean).join('; ');
  }
  function profilePayload(form) {
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.opening_hours = serializeOperatingHours(form);
    try { payload.gallery_images = JSON.parse(payload.gallery_images || '[]'); }
    catch (_) { payload.gallery_images = []; }
    return payload;
  }
  async function bindProfileMedia(form) {
    if (!form) return;
    for (const [inputId, targetName] of [['providerLogoFile', 'logo_url'], ['providerCoverFile', 'cover_image_url']]) {
      const input = document.getElementById(inputId);
      input?.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          const dataUrl = await compressImage(file);
          form.elements.namedItem(targetName).value = dataUrl;
          const preview = form.querySelector(`[data-photo-preview="${targetName}"]`);
          preview.src = dataUrl;
          preview.classList.remove('hidden');
        } catch (error) { alert(error.message || 'Could not process this image.'); input.value = ''; }
      });
    }
    const galleryInput = document.getElementById('providerGalleryFiles');
    const galleryField = form.elements.namedItem('gallery_images');
    const galleryPreview = document.getElementById('profileGalleryPreview');
    const drawGallery = () => {
      let images = [];
      try { images = JSON.parse(galleryField.value || '[]'); } catch (_) {}
      galleryPreview.innerHTML = images.map((image, index) => `<div class="relative"><img src="${safe(image)}" alt="Facility gallery image ${index + 1}" class="h-28 w-full rounded-lg border border-slate-200 object-cover"><button type="button" data-remove-gallery="${index}" class="absolute right-1 top-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-red-700 shadow">Remove</button></div>`).join('');
      galleryPreview.querySelectorAll('[data-remove-gallery]').forEach(button => button.addEventListener('click', () => {
        const current = JSON.parse(galleryField.value || '[]');
        current.splice(Number(button.dataset.removeGallery), 1);
        galleryField.value = JSON.stringify(current);
        drawGallery();
      }));
    };
    galleryPreview?.querySelectorAll('[data-remove-gallery]').forEach(button => button.addEventListener('click', () => {
      const current = JSON.parse(galleryField.value || '[]');
      current.splice(Number(button.dataset.removeGallery), 1);
      galleryField.value = JSON.stringify(current);
      drawGallery();
    }));
    galleryInput?.addEventListener('change', async () => {
      const files = Array.from(galleryInput.files || []);
      let current = [];
      try { current = JSON.parse(galleryField.value || '[]'); } catch (_) {}
      if (current.length + files.length > 5) { alert('You can add up to five gallery images.'); galleryInput.value = ''; return; }
      try {
        const uploaded = [];
        for (const file of files) uploaded.push(await compressImage(file, 130 * 1024));
        galleryField.value = JSON.stringify([...current, ...uploaded]);
        drawGallery();
      } catch (error) { alert(error.message || 'Could not process these images.'); }
      galleryInput.value = '';
    });
    form.querySelectorAll('[data-hours-toggle]').forEach(toggle => toggle.addEventListener('change', () => {
      const day = toggle.dataset.hoursToggle;
      for (const suffix of ['open', 'close']) {
        const input = form.elements.namedItem(`hours_${suffix}_${day}`);
        input.disabled = !toggle.checked;
        input.required = toggle.checked;
      }
    }));
  }

  async function compressImage(file, maxBytes = 170 * 1024) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Choose an image file.');
    if (file.size > 12 * 1024 * 1024) throw new Error('Each image must be smaller than 12 MB.');
    const source = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = source;
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.78;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length * 0.75 > maxBytes && quality > 0.42) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      if (dataUrl.length * 0.75 > maxBytes) throw new Error('This image could not be compressed enough. Choose a smaller image.');
      return dataUrl;
    } finally { URL.revokeObjectURL(source); }
  }

  async function loadData() {
    try {
      const endpoints = [
        `${API_BASE}/dashboard`, `${API_BASE}/doctors`, `${API_BASE}/services`,
        `${API_BASE}/appointments`, `${API_BASE}/staff`, `${API_BASE}/payments`,
        `${API_BASE}/reviews`, `${API_BASE}/qr`, `${API_BASE}/notifications`
      ];
      const responses = await Promise.all(endpoints.map(url => apiFetch(url, { method: 'GET' })));
      const results = await Promise.all(responses.map(async response => ({
        status: response.status,
        data: await response.json().catch(() => ({}))
      })));
      const [dashResult, docsResult, servicesResult, apptsResult, staffResult, paymentsResult, reviewsResult, qrResult, notificationsResult] = results;
      const dashRes = dashResult.data;
      if (dashResult.status === 401 || dashRes.code === 'AUTH_REQUIRED') {
        localStorage.removeItem('SAINO_PROVIDER_TOKEN');
        localStorage.removeItem('isProviderLoggedIn');
        window.location.replace('login.html?expired=1');
        return;
      }
      if (dashResult.status >= 400 || !dashRes.success) {
        throw new Error(dashRes.error || 'The backend could not return your provider record.');
      }
      state.provider = dashRes.provider || state.provider;
      state.provider.tier = state.provider.plan || state.provider.plan_name || 'Saino Free';
      state.user = dashRes.user || state.user;
      state.stats = dashRes.stats || state.stats;
      state.doctors = docsResult.data.success ? (docsResult.data.rows || []) : [];
      state.services = servicesResult.data.success ? (servicesResult.data.rows || []) : [];
      state.appointments = apptsResult.data.success ? (apptsResult.data.rows || []) : [];
      state.staff = staffResult.data.success ? (staffResult.data.rows || []) : [];
      state.payments = paymentsResult.data.success ? (paymentsResult.data.rows || []) : [];
      state.paymentTotals = paymentsResult.data.success ? (paymentsResult.data.totals || state.paymentTotals) : state.paymentTotals;
      state.reviews = reviewsResult.data.success ? (reviewsResult.data.rows || []) : [];
      state.qrCodes = qrResult.data.success ? (qrResult.data.rows || []) : [];
      state.notifications = notificationsResult.data.success ? (notificationsResult.data.rows || []) : [];
      const profileResponse = await apiFetch(`${API_BASE}/completeness`, { method: 'GET' });
      const profileData = await profileResponse.json().catch(() => ({}));
      if (profileResponse.ok && profileData.success) {
        state.profileStatus = profileData;
        if (!profileData.complete && state.page === 'dashboard') state.page = 'complete_profile';
      }
      // Queue is a view of saved appointments, never a set of browser-generated patients.
      const ordered = [...state.appointments].sort((a,b) => new Date(a.created_at || a.appointment_date || 0) - new Date(b.created_at || b.appointment_date || 0));
      const servingRow = [...ordered].reverse().find(a => String(a.status || '').toLowerCase() === 'in_progress');
      const waitingRows = ordered.filter(a => ['waiting','checked_in','arrived'].includes(String(a.status || '').toLowerCase()));
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const todayRows = ordered.filter(a => String(a.appointment_date || '').slice(0,10) === todayKey);
      state.queue = {
        serving: servingRow ? queueRow(servingRow) : null,
        waiting: waitingRows.map(queueRow),
        stats: {
          waiting: waitingRows.length,
          completed: todayRows.filter(a => String(a.status || '').toLowerCase() === 'completed').length,
          issued: todayRows.length,
          avg_consult: null
        }
      };
    } catch (e) {
      console.error('SAINO API error:', e);
      if (app) app.innerHTML = '<div class="min-h-screen grid place-items-center bg-slate-50 p-6"><div class="max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center"><h1 class="text-lg font-bold text-slate-900">Could not load live provider data</h1><p class="mt-2 text-sm text-slate-600">' + safe(e.message || 'Start the backend and check the PostgreSQL connection.') + '</p><a class="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href="login.html">Back to login</a></div></div>';
      return;
    }
    render();
  }

  function queueRow(a) {
    return {
      id: a.id, appointment_id: a.id, token: a.token || '—', patient_name: a.patient_name || '—',
      patient_id: a.patient_id || '', booking_ref: a.booking_ref || '', doctor: a.doctor || '', room: a.room || '',
      source: a.source || '—', status: a.status || 'pending', eta_minutes: a.eta_minutes
    };
  }


  function playAirportChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 Note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 Note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (_) {}
  }

  async function triggerQueueAction(action) {
    const serving = state.queue && state.queue.serving;
    try {
      if (action === 'call-next') {
        if (serving) {
          alert('A patient is already marked in progress. Mark that consultation done or skip it first.');
          return;
        }
        const nextPatient = state.queue.waiting[0];
        if (!nextPatient || !nextPatient.id) {
          alert('There are no checked-in/waiting appointments to call. Add a real reception booking first.');
          return;
        }
        const response = await apiFetch(`${API_BASE}/appointments/${encodeURIComponent(nextPatient.id)}`, {
          method: 'PATCH', body: JSON.stringify({ status: 'in_progress', room: nextPatient.room || '' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not start this consultation.');
        playAirportChime();
      } else if (action === 'done') {
        if (!serving || !serving.id) { alert('There is no saved appointment currently in progress.'); return; }
        const response = await apiFetch(`${API_BASE}/appointments/${encodeURIComponent(serving.id)}`, {
          method: 'PATCH', body: JSON.stringify({ status: 'completed' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not complete this consultation.');
      } else if (action === 'skip') {
        if (!serving || !serving.id) { alert('There is no saved appointment currently in progress.'); return; }
        const response = await apiFetch(`${API_BASE}/appointments/${encodeURIComponent(serving.id)}`, {
          method: 'PATCH', body: JSON.stringify({ status: 'checked_in' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not return this appointment to the queue.');
      } else return;
      await loadData();
    } catch (error) {
      alert(error.message || 'Queue update failed.');
    }
  }


  function kpiCard(title, val, sub, colorClass, badge) {
    const badgeHtml = badge ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">' + badge + '</span>' : '';
    return '<div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">' +
      '<div class="flex items-center justify-between"><span class="text-[11px] font-semibold text-slate-500">' + title + '</span>' + badgeHtml + '</div>' +
      '<div class="text-2xl font-black text-slate-900 my-1">' + val + '</div>' +
      '<div class="text-[10px] font-bold ' + colorClass + '">' + sub + '</div>' +
    '</div>';
  }

  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function focusProfileRequirement(missing = []) {
    const entries = Array.isArray(missing) ? missing : [];
    const requirement = String(entries[0] || '').toLowerCase();
    const sectionId = /doctor|opd fee|consultation fee|priced/.test(requirement) ? 'profile-doctors-section'
      : /service|department/.test(requirement) ? 'profile-services-section'
      : /cover|photo|image/.test(requirement) ? 'profile-images-section' : 'profile-details-section';
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target = section?.querySelector('.profile-nav-btn, input:not([type="hidden"]):not([type="file"]), textarea, select');
    window.setTimeout(() => target?.focus({ preventScroll: true }), 250);
    const notice = document.querySelector('[data-profile-submit-message]');
    if (notice) {
      const list = entries.length ? entries.join(', ') : 'the highlighted profile details';
      notice.textContent = `Complete ${list} in the highlighted section before submitting for approval.`;
      notice.classList.remove('hidden');
    }
  }

  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'in_consultation') return '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">In Consultation</span>';
    if (s === 'waiting') return '<span class="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">Waiting</span>';
    if (s === 'completed') return '<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px]">Completed</span>';
    if (s === 'cancelled') return '<span class="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Cancelled</span>';
    return '<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">' + status + '</span>';
  }
/* ============================================================
     RENDER MASTER CONTROLLER (SOLO DOCTOR VS HOSPITAL POCKET DESK)
     ============================================================ */
  function render() {
    if (!app) return;

    // 1. Detect: Single Doctor Clinic vs Large Hospital
    // Keep existing dashboard modules visible. The signup plan tiers (Free/Pro/VIP/VVIP)
    // are marketplace plans, not the older Clinic/Hospital quota tiers, so do not guess-lock tools here.
    const isSolo = state.provider && state.provider.provider_type === 'solo_doctor';
    const visibleNavItems = navItems;

    let navHtml = '';
    for (let i = 0; i < visibleNavItems.length; i++) {
      const item = visibleNavItems[i];
      const active = state.page === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200';
      const unreadCount = item.id === 'notifications' ? state.notifications.filter(notification => !notification.is_read).length : 0;
      navHtml += '<button class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ' + active + '" data-page="' + item.id + '">' +
        '<span class="text-sm">' + item.icon + '</span><span class="flex-1 text-left">' + item.label + '</span>' + (unreadCount ? '<span class="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] text-white">' + unreadCount + '</span>' : '') +
      '</button>';
    }

    // 2. Real Clinic Name & Location (Raipur, Chhattisgarh Context)
    const clinicName = state.provider.name || "Provider account";
    const clinicCity = [state.provider.city, state.provider.district, state.provider.province].filter(Boolean).join(', ') || 'Location not provided';
    const planBadge = state.provider.plan_name || state.provider.plan || state.provider.tier || 'Saino Free';

    app.innerHTML = '<div class="flex min-h-screen">' +
      '<aside class="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">' +
        '<div class="p-5 border-b border-slate-800 flex items-center gap-3">' +
          '<img src="../assets/logo.png" alt="SAINO Health" class="w-10 h-10 rounded-lg bg-white object-contain p-1">' +
          '<div>' +
            '<div class="font-bold text-white text-sm tracking-wide">SAINO Health</div>' +
            '<div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">' + (isSolo ? 'DOCTOR POCKET DESK' : 'PROVIDER NETWORK') + '</div>' +
          '</div>' +
        '</div>' +
        '<nav class="flex-1 p-3 space-y-1 overflow-y-auto">' + navHtml + '</nav>' +
        '<div class="p-4 m-3 bg-slate-950/60 border border-slate-800 rounded-xl">' +
          '<div class="text-xs font-bold text-slate-200">Reception QR Standee</div>' +
          '<div class="text-[11px] text-slate-400 mt-0.5">' + clinicName + ' Instant Token</div>' +
          '<button class="nav-item mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition" data-page="qr_marketplace">⬇ View &amp; Print Standee</button>' +
        '</div>' +
      '</aside>' +
      '<div class="flex-1 flex flex-col min-w-0 overflow-x-hidden">' +
        '<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">' +
          '<div class="w-96"><input type="text" placeholder="Search patients, tokens, appointments..." class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"></div>' +
          '<div class="flex items-center gap-6">' +
            '<div class="text-right">' +
              '<div class="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">' + 
                clinicName + 
                '<span class="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-200 font-bold">' + planBadge + '</span>' +
              '</div>' +
              '<div class="text-[11px] text-slate-500">' + clinicCity + '</div>' +
            '</div>' +
            '<button class="modal-trigger flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition cursor-pointer text-left" data-modal="settings">' +
              '<div class="text-right"><div class="text-xs font-bold text-slate-900">' + state.user.name + ' ⚙</div><div class="text-[10px] text-slate-500">' + state.user.role + '</div></div>' +
              '<div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">DR</div>' +
            '</button>' +
            '<button id="providerSignOut" type="button" class="ml-3 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Sign out</button>' +
          '</div>' +
        '</header>' +
        '<main class="flex-1 p-6 overflow-y-auto">' + renderPageContent() + '</main>' +
      '</div>' +
    '</div>' + renderModal() + renderProfileSubmittedModal();

    bindEvents();
  }

  function renderPageContent() {
    switch (state.page) {
      case "complete_profile": return renderCompleteProfile();
      case "dashboard": return renderDashboard();
      case "appointments": return renderAppointments();
      case "queue": return renderQueue();
      case "doctors": return renderDoctors();
      case "services": return renderServices();
      case "telemedicine": return renderTelemedicine();
      case "payments": return renderPayments();
      case "reviews": return renderReviews();
      case "notifications": return renderNotifications();
      case "qr_marketplace": return renderQRMarketplace();
      case "reports": return renderReports();
      case "staff": return renderStaff();
      case "settings": return renderSettings();
      case "billing": return renderBilling();
      default: return renderDashboard();
    }
  }

  function renderProfileSubmittedModal() {
    if (!state.profileSubmittedModal) return '';
    return '<div class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="profileSubmittedTitle">' +
      '<div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">' +
        '<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700" aria-hidden="true">✓</div>' +
        '<h2 id="profileSubmittedTitle" class="mt-4 text-lg font-black text-slate-900">Sent to Admin</h2>' +
        '<p class="mt-2 text-sm text-slate-600">Your profile has been sent to the Admin team for review. You can keep using your dashboard while it is reviewed.</p>' +
        '<button id="viewProviderDashboardAfterSubmit" type="button" class="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">View dashboard</button>' +
      '</div></div>';
  }

  function renderCompleteProfile() {
    const p = state.provider || {};
    const field = (label, name, value, attrs = '') => `<label class="block text-xs font-semibold text-slate-700">${label}<input name="${name}" value="${safe(value || '')}" ${attrs} class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal focus:border-red-600 focus:outline-none"></label>`;
    const textarea = (label, name, value, attrs = '') => `<label class="block text-xs font-semibold text-slate-700">${label}<textarea name="${name}" ${attrs} class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal focus:border-red-600 focus:outline-none">${safe(value || '')}</textarea></label>`;
    const doctorRows = state.doctors.map(d => `<div class="flex justify-between gap-2 border-b py-2 text-xs"><span><strong>${safe(d.name || d.full_name)}</strong> | ${safe(d.department || 'Specialty not entered')}</span><span>INR ${Number(d.opd_fee || 0).toLocaleString('en-IN')} | ${safe(d.experience_years || 0)} yrs</span></div>`).join('') || '<p class="py-3 text-xs text-slate-500">No doctors have been added yet.</p>';
    const serviceRows = state.services.map(s => `<div class="flex justify-between gap-2 border-b py-2 text-xs"><span><strong>${safe(s.name)}</strong> | ${safe(s.category || s.department || '')}</span><span>INR ${Number(s.price || 0).toLocaleString('en-IN')}</span></div>`).join('') || '<p class="py-3 text-xs text-slate-500">No services have been added yet.</p>';
    let gallery = Array.isArray(p.gallery_images) ? p.gallery_images : [];
    if (typeof p.gallery_images === 'string') { try { gallery = JSON.parse(p.gallery_images) || []; } catch (_) { gallery = []; } }
    const hours = parseOperatingHours(p.opening_hours);
    const basicMissing = !p.name || !p.email || !p.phone || !p.registration_no || !(p.address || p.address_line) || !p.city || !p.description;
    const imageMissing = !p.cover_image_url;
    const doctorMissing = !state.doctors.length || !state.doctors.some(d => Number(d.opd_fee || 0) > 0);
    const serviceMissing = !state.services.length;
    const sectionClass = missing => `rounded-xl ${missing ? 'border-2 border-red-500 ring-2 ring-red-100' : 'border border-slate-200'} bg-white p-5`;
    const sectionNotice = missing => missing ? '<p class="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">This section has required details to complete.</p>' : '';
    const photoField = (label, name, value, id) => `<div><label for="${id}" class="block text-xs font-semibold text-slate-700">${label}</label><input type="hidden" name="${name}" value="${safe(value || '')}"><input id="${id}" type="file" accept="image/*" class="mt-1 block w-full text-xs text-slate-600"><img data-photo-preview="${name}" src="${safe(value || '')}" alt="${label}" class="media-preview ${value ? '' : 'hidden'}"></div>`;
    const hoursRows = operatingDays.map(([day, key]) => {
      const dayKey = key.toLowerCase(), saved = hours[dayKey] || {};
      const enabled = Object.prototype.hasOwnProperty.call(hours, dayKey) && !saved.closed, disabled = !enabled;
      return `<div class="grid grid-cols-3 items-center gap-2 border-b border-slate-100 py-2 text-xs"><label class="flex items-center gap-2 font-semibold"><input type="checkbox" name="hours_enabled_${dayKey}" data-hours-toggle="${dayKey}" ${enabled ? 'checked' : ''}>${day}</label><label class="grid gap-1 text-[10px] text-slate-500">Open<input aria-label="${day} opening time" type="time" name="hours_open_${dayKey}" value="${safe(saved.open || '')}" ${disabled ? 'disabled' : 'required'} class="min-w-0 w-full rounded-md border border-slate-300 px-2 py-1.5"></label><label class="grid gap-1 text-[10px] text-slate-500">Close<input aria-label="${day} closing time" type="time" name="hours_close_${dayKey}" value="${safe(saved.close || '')}" ${disabled ? 'disabled' : 'required'} class="min-w-0 w-full rounded-md border border-slate-300 px-2 py-1.5"></label></div>`;
    }).join('');
    const missing = (state.profileStatus.missing || []).map(safe).join(', ');
    return `<div class="mx-auto max-w-5xl"><div class="mb-5"><p class="text-xs font-bold uppercase tracking-wide text-red-700">Provider marketplace setup</p><h1 class="mt-1 text-2xl font-black text-slate-900">Complete Profile</h1><p class="mt-2 text-sm text-slate-600">Enter your facility details. Approved information will appear on the patient marketplace.</p><div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Profile ${Number(state.profileStatus.percent || 0)}% complete.${missing ? ` Still needed: ${missing}` : ' Ready for review.'}</div></div>
      <form id="completeProviderProfileForm" class="space-y-5">
        <section class="${sectionClass(basicMissing)}">${sectionNotice(basicMissing)}<h2 class="mb-4 text-sm font-bold">Hospital / Clinic Details</h2><div class="grid gap-4 md:grid-cols-2">${field('Hospital / clinic name *','name',p.name,'required maxlength="200"')}${field('Provider email *','email',p.email,'type="email" required')}${field('Contact phone *','phone',p.phone,'required maxlength="40"')}${field('Provider type','provider_type',p.provider_type,'placeholder="Hospital, Clinic, Diagnostic Centre"')}${field('Marketplace category','category',p.category,'placeholder="hospital / clinic / diagnostic"')}${field('Registration number *','registration_no',p.registration_no,'required')}${field('Website (optional)','website',p.website,'type="url" placeholder="https://"')}${field('City *','city',p.city,'required')}${field('State / Province (optional)','state',p.state)}${field('PIN code (optional)','pincode',p.pincode)}<div class="md:col-span-2">${field('Full address *','address',p.address || p.address_line,'required')}</div><div class="md:col-span-2">${textarea('About this facility *','description',p.description,'required rows="4" maxlength="4000"')}</div><div class="md:col-span-2">${textarea('Facilities and accessibility information (optional)','facilities_info',p.facilities_info,'rows="3" placeholder="Facilities available at your centre"')}</div></div></section>
        <section class="${sectionClass(imageMissing)}">${sectionNotice(imageMissing)}<h2 class="mb-1 text-sm font-bold">Facility Images</h2><p class="mb-4 text-xs text-slate-500">Upload a logo, a cover photo and up to five gallery images. Images are compressed before saving.</p><div class="grid gap-4 md:grid-cols-2">${photoField('Facility logo (optional)','logo_url',p.logo_url,'providerLogoFile')}${photoField('Cover / banner photo *','cover_image_url',p.cover_image_url,'providerCoverFile')}</div><div class="mt-5"><label for="providerGalleryFiles" class="block text-xs font-semibold text-slate-700">Facility photo gallery (optional)</label><input id="providerGalleryFiles" type="file" accept="image/*" multiple class="mt-1 block w-full text-xs text-slate-600"><input type="hidden" name="gallery_images" value="${safe(JSON.stringify(gallery))}"><div id="profileGalleryPreview" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">${gallery.map((image,index)=>`<div class="relative"><img src="${safe(image)}" alt="Facility gallery image ${index + 1}" class="h-28 w-full rounded-lg border border-slate-200 object-cover"><button type="button" data-remove-gallery="${index}" class="absolute right-1 top-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-red-700 shadow">Remove</button></div>`).join('')}</div></div></section>
        <section class="rounded-xl border border-slate-200 bg-white p-5"><h2 class="mb-1 text-sm font-bold">OPD Schedule (optional)</h2><p class="mb-3 text-xs text-slate-500">Select open days and set an opening and closing time for each.</p><input type="hidden" name="opening_hours" value="${safe(p.opening_hours || '')}"><div class="max-w-2xl">${hoursRows}</div></section>
        <section class="${sectionClass(doctorMissing)}">${sectionNotice(doctorMissing)}<div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-sm font-bold">Doctors and Consultation Fees</h2><p class="mt-1 text-xs text-slate-500">Add doctor names, specialties, experience, OPD fees and availability.</p></div><button type="button" class="profile-nav-btn rounded-lg border px-3 py-2 text-xs font-bold" data-page="doctors">Manage doctors</button></div><div class="mt-3">${doctorRows}</div></section>
        <section class="${sectionClass(serviceMissing)}">${sectionNotice(serviceMissing)}<div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-sm font-bold">Services</h2><p class="mt-1 text-xs text-slate-500">Add services and fees for your marketplace listing.</p></div><button type="button" class="profile-nav-btn rounded-lg border px-3 py-2 text-xs font-bold" data-page="services">Manage services</button></div><div class="mt-3">${serviceRows}</div></section>
        <div class="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/95 p-4 shadow-lg"><span class="text-xs text-slate-500">Your details are saved to your provider account.</span><div class="flex gap-2"><button type="submit" class="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Save details</button><button type="button" id="submitProviderProfileReview" class="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white">Submit for approval</button></div></div>
      </form></div>`;
  }
  // 1. DASHBOARD
  function renderDashboard() {
    const p = state.provider || {};
    const serving = state.queue?.serving || null;
    const waiting = state.queue?.waiting || [];
    const score = Number(state.profileStatus.percent || 0);
    const publicReady = String(p.verification_status || '').toLowerCase() === 'verified' && p.is_published === true;
    const serviceFeeNote = 'Actual saved database records';
    const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    const waitingHTML = waiting.length ? waiting.slice(0,8).map(w => `<div class="px-4 py-3 flex items-center justify-between border-b border-slate-100"><div><strong class="text-xs text-slate-900">${safe(w.token)} · ${safe(w.patient_name)}</strong><div class="text-[11px] text-slate-500">PID ${safe(w.patient_id || 'not assigned')} · ${safe(w.doctor || 'Doctor not assigned')}</div></div><span class="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded">${safe(w.status)}</span></div>`).join('') : '<div class="p-6 text-center text-xs text-slate-500">No saved patients are waiting. Website, QR and reception bookings will appear here after they are saved in PostgreSQL.</div>';
    return `<section class="mb-6 p-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white"><div class="flex flex-wrap items-start justify-between gap-4"><div><span class="text-[10px] uppercase font-black tracking-wide px-2 py-1 rounded ${publicReady?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-900'}">${publicReady?'Published on patient marketplace':'Not published — approval required'}</span><h2 class="text-lg font-extrabold mt-3">Marketplace profile completeness: ${score}%</h2><p class="text-xs text-slate-300 mt-1">Provider-entered details saved to PostgreSQL. Approval/publication is controlled by Super Admin.</p></div><button class="nav-item px-4 py-2 bg-[#ad0b0e] text-white text-xs font-bold rounded-xl" data-page="complete_profile">Complete Profile</button></div><div class="w-full bg-slate-700 rounded-full h-2 mt-4"><div class="bg-emerald-400 h-2 rounded-full" style="width:${score}%"></div></div></section>
      <div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Provider dashboard</h1><p class="text-xs text-slate-500 mt-1">${safe(dateLabel)} · ${safe(p.name || 'Provider account')} · ${safe([p.city,p.district,p.province].filter(Boolean).join(', ') || 'Location not provided')}</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg" data-modal="token">+ Reception booking</button></div>
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">${kpiCard('Total bookings', Number(state.stats.total||0), serviceFeeNote,'text-slate-700')}${kpiCard('Website bookings', Number(state.stats.marketplace||0),serviceFeeNote,'text-blue-600')}${kpiCard('Reception / walk-in',Number(state.stats.walkin||0),serviceFeeNote,'text-slate-700')}${kpiCard('QR bookings',Number(state.stats.qr||0),serviceFeeNote,'text-emerald-600')}${kpiCard('Video bookings',Number(state.appointments.filter(a=>a.consultation_type==='video').length||0),'Saved video requests','text-purple-600')}${kpiCard('Waiting now',waiting.length,'Checked-in / waiting rows','text-amber-600')}</div>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5"><div class="xl:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"><div class="px-4 py-4 border-b border-slate-100 flex justify-between items-center"><div><h2 class="text-sm font-bold text-slate-900">Live queue</h2><p class="text-xs text-slate-500">Appointment status drives the queue; no sample patients are inserted.</p></div><button class="text-xs font-bold text-red-700" data-page="queue">Open queue</button></div>${serving ? `<div class="m-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200"><div class="text-[10px] font-bold text-emerald-800">NOW IN CONSULTATION</div><div class="text-2xl font-black mt-1">${safe(serving.token)}</div><div class="font-bold text-slate-900">${safe(serving.patient_name)}</div><div class="text-xs text-slate-600">PID ${safe(serving.patient_id||'—')} · ${safe(serving.doctor||'Doctor not assigned')} · ${safe(serving.room||'Room not assigned')}</div><div class="mt-3"><button class="queue-btn px-3 py-2 bg-emerald-700 text-white rounded text-xs font-bold" data-action="done">Mark consultation complete</button><button class="queue-btn ml-2 px-3 py-2 border rounded text-xs font-bold" data-action="skip">Return to queue</button></div></div>` : '<div class="p-4 text-xs text-slate-500">No appointment is currently marked as in progress.</div>'}${waitingHTML}</div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"><h2 class="font-bold text-sm text-slate-900">Provider setup</h2><div class="space-y-3 mt-4 text-xs">${[['Doctors saved',state.doctors.length],['Services saved',state.services.length],['QR codes',state.qrCodes.length],['Reviews',state.reviews.length],['Staff records',state.staff.length]].map(([k,v])=>`<div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">${k}</span><strong>${Number(v||0)}</strong></div>`).join('')}</div><p class="mt-4 text-[11px] text-slate-500">Saved changes will also be visible to Super Admin. Only verified and published profiles appear on the public marketplace.</p><button class="mt-4 w-full px-3 py-2 border rounded-lg text-xs font-bold" data-page="appointments">View appointments</button></div></div>`;
  }


  function renderAppointments() {
    const all = state.appointments || [];
    const active = state.appointmentFilter === 'all' ? all : all.filter(a => String(a.status||'').toLowerCase() === state.appointmentFilter);
    const filters = [ ['all','All'],['pending','Pending'],['confirmed','Confirmed'],['checked_in','Checked in'],['waiting','Waiting'],['in_progress','In progress'],['completed','Completed'],['cancelled','Cancelled'] ];
    const tabs = filters.map(([id,label])=>`<button class="filter-tab rounded-lg px-3 py-2 text-xs font-bold ${state.appointmentFilter===id?'bg-slate-900 text-white':'bg-white border text-slate-600'}" data-filter="${id}">${label} <span class="opacity-70">(${id==='all'?all.length:all.filter(a=>String(a.status||'').toLowerCase()===id).length})</span></button>`).join('');
    const rows = active.map(a=>`<tr class="border-b border-slate-100"><td class="p-3"><strong>${safe(a.booking_ref||'—')}</strong><div class="text-[10px] text-slate-500">PID ${safe(a.patient_id||'—')} · Visit ${safe(a.visit_id||'not started')}</div><div class="text-[10px] text-slate-400">Token ${safe(a.token||'—')}</div></td><td class="p-3"><strong>${safe(a.patient_name||'—')}</strong><div class="text-[10px] text-slate-500">${safe(a.patient_phone||'')} ${safe(a.patient_email||'')}</div></td><td class="p-3">${safe(a.doctor||'Not assigned')}<div class="text-[10px] text-slate-500">${safe(a.service_name||'—')} · ${safe(a.room||'Room not assigned')}</div></td><td class="p-3">${safe(a.source||'—')}<div class="text-[10px] text-slate-500">${safe(a.consultation_type||'in_person')}</div></td><td class="p-3">${safe(a.appointment_date||'—')}<div class="text-[10px] text-slate-500">${safe(a.slot_time||'Time not set')}</div></td><td class="p-3">
  <div class="mb-1">${statusBadge(a.status || 'pending')}</div>
  <div class="text-[10px] text-slate-500">
    Payment: ${safe(a.payment_status || 'pending')}
  </div>
  <div class="text-[10px] text-slate-500">
    Fee ${a.fee == null ? '—' : 'INR ' + Number(a.fee).toLocaleString('en-IN')}
  </div>
</td><td class="p-3"><div class="flex gap-1 flex-wrap">${['confirmed','checked_in','waiting','in_progress','completed','cancelled','no_show'].map(status=>`<button class="appt-status px-2 py-1 border rounded text-[10px] font-bold" data-id="${safe(a.id)}" data-status="${status}">${status.replace(/_/g,' ')}</button>`).join('')}</div></td></tr>`).join('');
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Appointments & patient records</h1><p class="text-xs text-slate-500 mt-1">Website, QR and reception entries use the same PostgreSQL booking table.</p></div><div><button id="refreshProviderData" class="px-3 py-2 border rounded-lg text-xs font-bold">Refresh</button> <button class="modal-trigger px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold" data-modal="token">+ Reception booking</button></div></div><div class="flex gap-2 flex-wrap mb-4">${tabs}</div><div class="bg-white border rounded-xl overflow-auto"><table class="w-full text-left text-xs min-w-[1000px]"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Booking / Patient IDs</th><th class="p-3">Patient</th><th class="p-3">Care / Doctor</th><th class="p-3">Source / Type</th><th class="p-3">Date / Time</th><th class="p-3">Booking / Payment Status</th><th class="p-3">Update status</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="p-8 text-center text-slate-500">No matching bookings saved in PostgreSQL. Use reception booking or the patient website to create a test booking.</td></tr>'}</tbody></table></div>`;
  }


  function renderQueue() {
    const serving = state.queue?.serving;
    const waiting = state.queue?.waiting || [];
    const rows = waiting.map(w=>`<tr class="border-b"><td class="p-3 font-bold">${safe(w.token)}</td><td class="p-3">${safe(w.patient_name)}<div class="text-[10px] text-slate-500">PID ${safe(w.patient_id||'—')}</div></td><td class="p-3">${safe(w.doctor||'Unassigned')}</td><td class="p-3">${safe(w.source||'—')}</td><td class="p-3">${safe(w.status)}</td></tr>`).join('');
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Live Queue & Digital Token Console</h1><p class="text-xs text-slate-500 mt-1">Queue actions update the saved appointment. Actual HIS/EMR integration is not configured.</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold" data-modal="token">+ Issue manual token</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-5"><div class="lg:col-span-2 bg-white border rounded-xl p-5"><div class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Currently in consultation</div>${serving?`<div class="mt-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50"><div class="text-3xl font-black">${safe(serving.token)}</div><div class="text-lg font-bold">${safe(serving.patient_name)}</div><p class="text-xs text-slate-600">PID ${safe(serving.patient_id||'—')} · ${safe(serving.doctor||'Doctor not assigned')} · ${safe(serving.room||'Room not assigned')}</p><div class="flex flex-wrap gap-2 mt-4"><button class="queue-btn px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold" data-action="done">Mark completed</button><button class="queue-btn px-4 py-2 rounded-lg border text-xs font-bold" data-action="skip">Skip / return to queue</button></div></div>`:'<p class="py-5 text-sm text-slate-500">No saved appointment is currently in progress.</p>'}<div class="flex justify-between items-center mt-5 mb-3"><h3 class="font-bold text-sm">Checked-in / waiting (${waiting.length})</h3><button class="queue-btn px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold" data-action="call-next" ${serving?'disabled':''}>Call next</button></div><div class="overflow-auto"><table class="w-full text-left text-xs min-w-[600px]"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Token</th><th class="p-3">Patient</th><th class="p-3">Doctor</th><th class="p-3">Source</th><th class="p-3">Status</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="p-6 text-center text-slate-500">No patient currently waiting. Bookings appear here after status is set to checked_in/waiting.</td></tr>'}</tbody></table></div></div><div class="bg-white border rounded-xl p-5"><h3 class="font-bold text-sm">Actual queue counts</h3><div class="mt-4 space-y-3 text-xs">${[['Waiting',waiting.length],['Completed today',state.queue?.stats?.completed||0],['Appointments today',state.queue?.stats?.issued||0]].map(([l,v])=>`<div class="flex justify-between border-b pb-2"><span class="text-slate-500">${l}</span><strong>${v}</strong></div>`).join('')}</div><p class="text-[11px] text-slate-500 mt-4">ETA notifications and HIS/EMR synchronisation need a configured external integration; no fake ETA is displayed.</p></div></div>`;
  }


  function renderDoctors() {
    const rows = state.doctors.map(d => `<tr class="border-b border-slate-100"><td class="p-3"><div class="flex items-center gap-3">${d.avatar_url ? `<img src="${safe(d.avatar_url)}" class="w-10 h-10 rounded object-cover" alt="">` : '<div class="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">MD</div>'}<div><strong>${safe(d.name || d.full_name || '')}</strong><div class="text-[10px] text-slate-500">${safe(d.qualification || 'Qualification not provided')}</div></div></div></td><td class="p-3">${safe(d.department || d.specialization || 'Not provided')}<div class="text-[10px] text-slate-500">${safe(d.room || 'Room not assigned')}</div></td><td class="p-3">${d.opd_fee == null ? '—' : 'INR ' + Number(d.opd_fee).toLocaleString()}</td><td class="p-3">${safe(d.shift_timings || 'Timings not provided')}</td><td class="p-3">${safe(d.nmc_no || 'Not provided')}</td><td class="p-3">${safe(d.status || 'active')}</td><td class="p-3"><button type="button" class="edit-doctor rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold hover:border-red-500 hover:text-red-700" data-doctor-id="${safe(d.id)}">Edit</button></td></tr>`).join('');
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Doctors management</h1><p class="text-xs text-slate-500 mt-1">${state.doctors.length} doctors saved for this provider. Edit saved details at any time.</p></div><button class="modal-trigger px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold" data-modal="doctor">+ Add doctor</button></div><div class="bg-white border rounded-xl overflow-auto"><table class="w-full min-w-[850px] text-left text-xs"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Doctor</th><th class="p-3">Specialty / room</th><th class="p-3">Consult fee</th><th class="p-3">Timings</th><th class="p-3">Registration no.</th><th class="p-3">Status</th><th class="p-3">Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="p-8 text-center text-slate-500">No doctor profiles saved yet. Select “Add doctor” to create a database record.</td></tr>'}</tbody></table></div>`;
  }
  function renderServices() {
    const rows = state.services.map(s=>`<tr class="border-b border-slate-100"><td class="p-3"><strong>${safe(s.name||'')}</strong><div class="text-[10px] text-slate-500">${safe(s.code||'Code not assigned')}</div><div class="text-[10px] text-slate-500">${safe(s.description||'')}</div></td><td class="p-3">${safe(s.category||'Not provided')}<div class="text-[10px] text-slate-500">${safe(s.department||'')}</div></td><td class="p-3">${s.price==null?'—':'INR '+Number(s.price).toLocaleString()}</td><td class="p-3">${s.duration_min==null?'—':safe(s.duration_min)+' min'}</td><td class="p-3">${safe(s.status||'active')}</td><td class="p-3"><button type="button" class="edit-service rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold hover:border-red-500 hover:text-red-700" data-service-id="${safe(s.id)}">Edit</button></td></tr>`).join('');
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Services & pricing</h1><p class="text-xs text-slate-500 mt-1">Update service details and fees at any time.</p></div><button class="modal-trigger px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold" data-modal="service">+ Add service</button></div><div class="bg-white border rounded-xl overflow-auto"><table class="w-full min-w-[700px] text-left text-xs"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Service</th><th class="p-3">Category / department</th><th class="p-3">Price</th><th class="p-3">Duration</th><th class="p-3">Status</th><th class="p-3">Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="p-8 text-center text-slate-500">No services saved. Add one to persist service details and prices.</td></tr>'}</tbody></table></div>`;
  }


  function renderTelemedicine() {
    const videos = state.appointments.filter(a=>String(a.consultation_type||'').toLowerCase()==='video');
    const rows = videos.map(a=>`<tr class="border-b"><td class="p-3">${safe(a.booking_ref||'—')}<div class="text-[10px] text-slate-500">PID ${safe(a.patient_id||'—')}</div></td><td class="p-3">${safe(a.patient_name||'—')}</td><td class="p-3">${safe(a.appointment_date||'—')} ${safe(a.slot_time||'')}</td><td class="p-3">${safe(a.status||'pending')}</td><td class="p-3">${safe(a.payment_status||'pending')}</td></tr>`).join('');
    return `<div class="mb-5"><h1 class="text-xl font-bold">Telemedicine & video consultation</h1><p class="text-xs text-slate-500 mt-1">Shows actual video consultation booking requests from PostgreSQL. Video calling and online payment are not configured in this build.</p></div><div class="bg-white border rounded-xl p-5 mb-5"><span class="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">Video provider: not configured</span><p class="text-xs text-slate-600 mt-3">Do not start or promise an online consultation until video meeting, payment confirmation, consent and digital prescription workflows are connected.</p></div><div class="bg-white border rounded-xl overflow-auto"><table class="w-full min-w-[680px] text-left text-xs"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Booking / PID</th><th class="p-3">Patient</th><th class="p-3">Date / time</th><th class="p-3">Booking status</th><th class="p-3">Payment status</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="p-8 text-center text-slate-500">No video consultation requests have been booked.</td></tr>'}</tbody></table></div>`;
  }


  function renderPayments() {
    const rows = state.payments.map(p=>`<tr class="border-b"><td class="p-3">${safe(p.receipt_no||'—')}</td><td class="p-3">${safe(p.patient_name||'—')}</td><td class="p-3">${safe(p.service_name||'—')}</td><td class="p-3">INR ${Number(p.amount||0).toLocaleString()}</td><td class="p-3">${safe(p.payment_method||'—')}<div class="text-[10px] text-slate-500">${safe(p.account_mask||'')}</div></td><td class="p-3">${safe(p.status||'recorded')}</td><td class="p-3">${p.created_at?safe(new Date(p.created_at).toLocaleString()):'—'}</td></tr>`).join('');
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Payments & billing records</h1><p class="text-xs text-slate-500 mt-1">This is a manual payment ledger, not a payment gateway or settlement connection.</p></div><button class="modal-trigger px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold" data-modal="payment">+ Record received payment</button></div><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">${kpiCard('Recorded amounts','INR '+Number(state.paymentTotals.total||0).toLocaleString(),'Saved ledger total','text-emerald-700')}${kpiCard('Cash records','INR '+Number(state.paymentTotals.cash||0).toLocaleString(),'Method recorded as cash','text-slate-700')}${kpiCard('Other method records','INR '+Number(state.paymentTotals.digital||0).toLocaleString(),'Not independently gateway-verified','text-blue-700')}</div><div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-4">Gateway status: not configured. Recording a manual row does not prove money was received online or settled to a provider.</div><div class="bg-white border rounded-xl overflow-auto"><table class="w-full min-w-[800px] text-left text-xs"><thead class="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th class="p-3">Receipt</th><th class="p-3">Patient</th><th class="p-3">Service</th><th class="p-3">Amount</th><th class="p-3">Method</th><th class="p-3">Status</th><th class="p-3">Recorded</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="p-8 text-center text-slate-500">No payment entries in PostgreSQL. Record a payment only after the provider confirms the real transaction.</td></tr>'}</tbody></table></div>`;
  }


  function renderReviews() {
    const rows = state.reviews.map(r=>`<article class="border border-slate-200 rounded-xl p-4"><div class="flex items-start justify-between gap-3"><div><strong class="text-sm">${safe(r.patient_name||'Patient')}</strong><div class="text-[11px] text-slate-500">${r.created_at?safe(new Date(r.created_at).toLocaleString()):'Date not provided'} · ${r.verified_visit?'Verified visit':'Visit not verified'}</div></div><span class="text-amber-600 font-bold">${Number(r.rating||0).toFixed(1)} / 5</span></div><p class="text-xs text-slate-700 mt-3">${safe(r.comment||'No comment')}</p>${r.response?`<div class="mt-3 p-3 bg-slate-50 rounded-lg text-xs"><strong>Provider response</strong><p class="mt-1">${safe(r.response)}</p></div>`:''}<form class="review-reply-form mt-3 flex gap-2" data-review-id="${safe(r.id)}"><input name="response" required maxlength="2000" value="" placeholder="Write a response…" class="flex-1 px-3 py-2 border rounded-lg text-xs"><button class="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold">Save reply</button></form></article>`).join('');
    return `<div class="mb-5"><h1 class="text-xl font-bold">Reviews & feedback</h1><p class="text-xs text-slate-500 mt-1">Reviews and provider replies are read and stored in PostgreSQL. Reviews are not generated automatically after a visit.</p></div><div class="space-y-3">${rows||'<div class="bg-white border rounded-xl p-8 text-center text-sm text-slate-500">No reviews have been recorded for this provider.</div>'}</div>`;
  }
  
function renderNotifications() {
  const rows = state.notifications.map(n => {
    const appointment = state.appointments.find(
      a => String(a.id) === String(n.appointment_id)
    );

    const pendingArrival =
      n.title === 'Patient Arrival Request' &&
      appointment?.arrival_status === 'pending' &&
      String(appointment?.status || '').toLowerCase() === 'confirmed';

    return `
      <article class="notification ${n.is_read ? '' : 'unread'}">
        <div class="flex-1">
          <strong>${safe(n.title)}</strong>
          <p>${safe(n.message)}</p>
          <time>${n.created_at ? new Date(n.created_at).toLocaleString() : ''}</time>

          ${pendingArrival ? `
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="arrival-confirm rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                data-id="${safe(appointment.id)}">
                Confirm Arrival
              </button>

              <button
                class="arrival-cancel rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white"
                data-id="${safe(appointment.id)}">
                Cancel Appointment
              </button>
            </div>
          ` : ''}
        </div>

        ${pendingArrival ? '' : n.is_read
          ? '<span class="text-[10px] text-slate-400">Read</span>'
          : `<button class="provider-notification-read rounded border px-3 py-1 text-[10px] font-bold" data-notification-id="${safe(n.id)}">Mark read</button>`
        }
      </article>
    `;
  }).join('');

  return `
    <div class="mb-5">
      <h1 class="text-xl font-bold">Notifications</h1>
      <p class="text-xs text-slate-500 mt-1">
        Updates saved for this provider account.
      </p>
    </div>

    <div class="bg-white border rounded-xl p-5">
      <div class="flex justify-between items-center mb-3">
        <strong class="text-sm">Account notifications</strong>
        <span class="text-xs text-slate-500">
          ${state.notifications.filter(n => !n.is_read).length} unread
        </span>
      </div>
      ${rows || '<p class="py-6 text-center text-sm text-slate-500">No notifications yet.</p>'}
    </div>
  `;
}

  function getProviderQrLink(q) {
    return `${API_ORIGIN}/api/public/qr/${encodeURIComponent(q.code)}`;
  }

  function getProviderQrImage(q) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&data=${encodeURIComponent(getProviderQrLink(q))}`;
  }

  async function copyBookingQrLink(url) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement('textarea');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      if (!copied) throw new Error('Copy is unavailable on this browser.');
    }
  }

  async function downloadBookingQr(q) {
    const response = await fetch(getProviderQrImage(q));
    if (!response.ok) throw new Error('Could not download QR image.');

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `SAINO-Booking-QR-${q.code}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }

  async function handleBookingQrAction(action, q) {
    const url = getProviderQrLink(q);
    const title = state.provider.name || 'SAINO Healthcare';

    if (action === 'copy') {
      await copyBookingQrLink(url);
      alert('Booking link copied!');
      return;
    }

    if (action === 'whatsapp') {
      const message = `Book an appointment at ${title}:\n${url}`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    if (action === 'download') {
      await downloadBookingQr(q);
      return;
    }

    if (action === 'share') {
      if (navigator.share) {
        await navigator.share({
          title: `${title} Booking QR`,
          text: `Book your appointment directly at ${title}.`,
          url
        });
      } else {
        await copyBookingQrLink(url);
        alert('Native sharing unavailable. Booking link copied!');
      }
    }
  }

      
    function renderQRMarketplace() {
      const p = state.provider || {};

      const approved =
        String(p.verification_status || '').toLowerCase() === 'verified' &&
        p.is_published === true;

      const bookingQr = state.qrCodes.find(
        q => q.label === 'Booking QR'
      );

      const rows = state.qrCodes.map(q => {
        const link = `${API_ORIGIN}/api/public/qr/${encodeURIComponent(q.code)}`;

        const image =
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;

        const isBookingQr = q.label === 'Booking QR';

        return `
          <div class="bg-white border rounded-xl p-5 mb-4">
            <div class="flex flex-col sm:flex-row gap-5">

              <img
                src="${image}"
                alt="Booking QR"
                class="w-40 h-40 border rounded-lg object-contain"
              >

              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-sm">${safe(q.label)}</h3>

                <p class="text-xs text-slate-500 mt-1">
                  Status: ${safe(q.status)}
                </p>

                <p class="text-xs mt-2">
                  Total scans: ${Number(q.total_scans || 0)}
                </p>

                <a href="${safe(link)}"
                  target="_blank"
                  rel="noopener"
                  class="block mt-2 text-xs text-blue-700 underline break-all">
                  ${safe(link)}
                </a>

                <div class="flex flex-wrap gap-2 mt-4">

                  <button type="button"
                    class="qr-view px-3 py-2 bg-slate-900 text-white rounded text-xs font-bold"
                    data-id="${safe(q.id)}">
                    View My QR
                  </button>

                  <button type="button"
                    class="qr-status px-3 py-2 border rounded text-xs font-bold"
                    data-id="${safe(q.id)}"
                    data-status="${q.status === 'active' ? 'disabled' : 'active'}">
                    ${q.status === 'active' ? 'Deactivate' : 'Activate'} QR
                  </button>

                </div>

                ${isBookingQr
                  ? '<p class="mt-3 text-xs text-emerald-700 font-semibold">Main hospital booking QR</p>'
                  : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="mb-5">
          <h1 class="text-xl font-bold">QR Management</h1>
          <p class="text-xs text-slate-500 mt-1">
            Patients can scan your QR to open your hospital booking page.
          </p>
        </div>

        ${!approved ? `
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
            <h3 class="font-bold text-sm text-amber-900">
              Admin approval required
            </h3>
            <p class="text-xs text-amber-800 mt-2">
              Booking QR generation becomes available after your
              provider profile is verified and published.
            </p>
          </div>
        ` : !bookingQr ? `
          <form id="createProviderQrForm"
            class="bg-white border rounded-xl p-5 mb-5">

            <h3 class="font-bold text-sm">Generate Hospital Booking QR</h3>

            <p class="text-xs text-slate-500 mt-2">
              One permanent main booking QR will be created for your hospital.
            </p>

            <button type="submit"
              class="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-bold">
              Generate Booking QR
            </button>

          </form>
        ` : `
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
            <p class="text-sm font-bold text-emerald-800">
              Your Booking QR is already generated.
            </p>
          </div>
        `}

        <div class="space-y-3">
          ${rows || '<p class="text-xs text-slate-500">No QR generated yet.</p>'}
        </div>
      `;
    }


  function renderReports() {
    const a = state.appointments || [];
    const completed = a.filter(x=>String(x.status||'').toLowerCase()==='completed').length;
    const waiting = a.filter(x=>['waiting','checked_in','arrived'].includes(String(x.status||'').toLowerCase())).length;
    const qrScans = state.qrCodes.reduce((sum,q)=>sum+Number(q.total_scans||0),0);
    const qrBookings = a.filter(x=>String(x.source||'').toLowerCase()==='qr').length;
    const scanConversion = qrScans ? `${(qrBookings/qrScans*100).toFixed(1)}%` : 'Not available';
    return `<div class="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h1 class="text-xl font-bold">Reports & analytics</h1><p class="text-xs text-slate-500 mt-1">All metrics are computed from saved records. No fabricated retention or wait-time statistics.</p></div><button id="exportCsvBtnReports" class="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg">Export appointments CSV</button></div><div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">${kpiCard('Appointments',a.length,'Saved booking records','text-slate-700')}${kpiCard('Completed',completed,'Status = completed','text-emerald-700')}${kpiCard('Currently waiting',waiting,'Queue statuses','text-amber-700')}${kpiCard('Recorded payments','INR '+Number(state.paymentTotals.total||0).toLocaleString(),'Provider payment ledger','text-blue-700')}</div><div class="bg-white border rounded-xl p-5"><h3 class="font-bold text-sm">QR conversion tracking</h3><div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs"><div class="p-3 bg-slate-50 rounded"><span class="text-slate-500">Tracked scans</span><strong class="block text-lg mt-1">${qrScans}</strong></div><div class="p-3 bg-slate-50 rounded"><span class="text-slate-500">QR bookings</span><strong class="block text-lg mt-1">${qrBookings}</strong></div><div class="p-3 bg-slate-50 rounded"><span class="text-slate-500">Bookings / scans</span><strong class="block text-lg mt-1">${scanConversion}</strong><span class="text-[10px] text-slate-500">Indicative; booking counts can include repeat visitors</span></div></div></div>`;
  }


  function renderStaff() {
    let sRows = '';
    if (!state.staff.length) {
      sRows = '<tr><td colspan="4" class="p-8 text-center text-slate-400">No staff members in database. Click "+ Add Staff" to insert.</td></tr>';
    } else {
      for (let i = 0; i < state.staff.length; i++) {
        const s = state.staff[i];
        sRows += '<tr class="hover:bg-slate-50/60"><td class="p-3 font-bold text-slate-900"><span class="inline-flex items-center gap-2">' + (s.avatar_url ? '<img src="' + safe(s.avatar_url) + '" alt="" class="w-9 h-9 rounded-full object-cover">' : '') + safe(s.name) + '</span></td><td class="p-3 text-slate-600">' + safe(s.email || '') + '</td><td class="p-3"><span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">' + safe(s.role) + '</span></td><td class="p-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span></td></tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Staff & Reception Management</h1><p class="text-xs text-slate-500 mt-0.5">Hospital administrative accounts & OPD counter assignments</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="staff">+ Add Staff</button></div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">STAFF MEMBER</th><th class="p-3">EMAIL</th><th class="p-3">ROLE</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + sRows + '</tbody></table>' +
    '</div>';
  }

  function renderSettings() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Provider Settings & Compliance</h1><p class="text-xs text-slate-500 mt-0.5">Hospital operational credentials & profile configuration</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="settings">⚙ Edit Hospital Profile</button></div>' +
    '<div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">' +
      '<h3 class="text-sm font-bold text-slate-900">Current Hospital Information</h3>' +
      '<div class="grid grid-cols-2 gap-4 text-xs">' +
        '<div><span class="text-slate-500">Hospital Name:</span> <strong class="text-slate-900 block mt-1">' + state.provider.name + '</strong></div>' +
        '<div><span class="text-slate-500">City / Location:</span> <strong class="text-slate-900 block mt-1">' + state.provider.city + '</strong></div>' +
        '<div><span class="text-slate-500">Admin Staff:</span> <strong class="text-slate-900 block mt-1">' + state.user.name + '</strong></div>' +
        '<div><span class="text-slate-500">Active Tier:</span> <strong class="text-blue-700 block mt-1">' + (state.provider.plan_name || 'Hospital Tier') + '</strong></div>' +
      '</div>' +
      '<button class="modal-trigger mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg" data-modal="settings">Edit Details</button>' +
    '</div>';
  }

  function renderBilling() {
    const plans = [
      { name: 'Saino Free', price: 'INR 0 / month', subtitle: 'Free Forever', features: ['Basic provider profile', 'Organization information', 'Services listing', 'Patient discovery'] },
      { name: 'Saino Pro', price: 'INR 3,600 / month', subtitle: 'Growing your presence', features: ['Everything in Free', 'Enhanced profile', 'More service information', 'Improved visibility'] },
      { name: 'Saino VIP', price: 'INR 5,900 / month', subtitle: 'Increasing visibility', features: ['Everything in Pro', 'Featured placement', 'Enhanced marketplace presence', 'More engagement opportunities'] },
      { name: 'Saino VVIP', price: 'INR 9,999 / month', subtitle: 'Maximum visibility', features: ['Everything in VIP', 'Higher visibility', 'Premium placement', 'Advanced marketplace features', 'Priority support'] }
    ];
    const currentPlan = state.provider.plan || state.provider.plan_name || 'Saino Free';
    return '<div class="mb-5"><h1 class="text-xl font-bold text-slate-900">Subscription & Billing</h1><p class="text-xs text-slate-500 mt-1">Your onboarding plan is saved with your provider account. Plan changes should be completed through the account settings.</p></div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">' + plans.map(plan =>
        '<div class="bg-white border ' + (plan.name === currentPlan ? 'border-2 border-emerald-500' : 'border-slate-200') + ' rounded-2xl p-5 shadow-sm">' +
          '<div class="flex justify-between items-center gap-2"><h3 class="font-bold text-sm text-slate-900">' + plan.name + '</h3>' + (plan.name === currentPlan ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">CURRENT</span>' : '') + '</div>' +
          '<div class="text-lg font-black text-slate-900 my-3">' + plan.price + '</div><p class="text-xs text-slate-500 mb-3">' + plan.subtitle + '</p>' +
          '<ul class="text-xs text-slate-600 space-y-2">' + plan.features.map(feature => '<li>✓ ' + feature + '</li>').join('') + '</ul>' +
        '</div>'
      ).join('') + '</div>' +
      '<button class="modal-trigger mt-5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg" data-modal="settings">Manage Plan & Settings</button>';
  }

  function renderModal() {
    if (!state.activeModal) return '';
    const editingDoctor = state.editingDoctorId ? state.doctors.find(doctor => Number(doctor.id) === Number(state.editingDoctorId)) : null;
    const editingService = state.editingServiceId ? state.services.find(service => Number(service.id) === Number(state.editingServiceId)) : null;

    if (state.activeModal === 'token') {
      let docOpts = '<option value="">Any Available Doctor</option>';
      for (let i = 0; i < state.doctors.length; i++) {
        const d = state.doctors[i];
        docOpts += '<option value="' + d.id + '">' + d.name + ' (' + d.room + ')</option>';
      }

      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Issue Manual OPD Token</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="issueTokenForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Patient Full Name *</label><input name="patient_name" required placeholder="e.g. Maya Gurung" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Mobile Phone (+977)</label><input name="patient_phone" placeholder="98XXXXXXXX" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Assign Doctor</label><select name="doctor_id" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">' + docOpts + '</select></div>' +
            '<div class="grid grid-cols-2 gap-2">' +
              '<div><label class="font-semibold text-slate-700">Source</label><select name="source" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="walkin">Walk-in</option><option value="phone">Phone Booking</option><option value="qr">QR Kiosk</option></select></div>' +
              '<div><label class="font-semibold text-slate-700">Consultation Fee (Rs.)</label><input name="fee" type="number" value="0" min="0" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '</div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Issue Token to Queue</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'doctor') {
      return `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            
            <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-red-400">DOCTOR CREDENTIALS</span>
                <h3 class="font-extrabold text-sm text-white">${editingDoctor ? 'Edit Doctor Details' : 'Add Doctor &amp; OPD Consultation'}</h3>
              </div>
              <button type="button" class="close-modal text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form id="addDocForm" class="p-6 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              
              <!-- Doctor Name & Photo -->
              <div>
                <label class="font-bold text-slate-700 block mb-1">Doctor Full Name *</label>
                <input name="name" required placeholder="Dr. Rajesh Verma" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">Doctor / clinician photo (optional)</label>
                <input name="avatar_url" placeholder="Photo URL (or choose a file below)" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                <input id="doctorPhotoFile" type="file" accept="image/*" class="w-full mt-2 text-[11px]">
                <img data-doctor-photo-preview alt="Doctor photo preview" class="hidden mt-2 h-16 w-16 rounded-full object-cover">
              </div>

              <!-- Qualification & Speciality -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Qualifications &amp; Degree *</label>
                  <input name="qualification" required placeholder="MBBS, MD (Medicine)" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Medical Speciality *</label>
                  <input name="department" required placeholder="Consultant Physician" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <!-- Experience & Registration -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Experience (Years) *</label>
                  <input name="experience_years" type="number" required placeholder="12" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">NMC / State Reg No. *</label>
                  <input name="nmc_no" required placeholder="CGMC-18942 / NMC-XXXX" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <!-- Consultation Fees in INR ₹ -->
              <div class="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
                <div class="font-bold text-slate-900 mb-2">Consultation Pricing (INR ₹)</div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="font-bold text-slate-700 block mb-1">In-Person OPD Fee (₹) *</label>
                    <input name="opd_fee" type="number" required value="0" min="0" class="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600 font-bold">
                  </div>
                  <div>
                    <label class="font-bold text-slate-700 block mb-1">Follow-up / Online Fee (₹)</label>
                    <input name="followup_fee" type="number" value="0" min="0" class="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                  </div>
                </div>
              </div>

              <!-- Timings & Room -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">OPD Shift Hours (optional)</label>
                  <input name="shift_timings" placeholder="e.g. 09:00–13:00" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Chamber / Room</label>
                  <input name="room" placeholder="Room / chamber" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" class="close-modal px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold rounded-lg shadow-md transition">${editingDoctor ? 'Update Doctor Profile' : 'Save Doctor Profile'}</button>
              </div>

            </form>
          </div>
        </div>`;
    }

    if (state.activeModal === 'service') {
      return `<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">` +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          `<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">${editingService ? 'Edit Service' : 'Add New Service'}</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>` +
          '<form id="addSrvForm" class="space-y-3 text-xs">' +
            `<div><label class="font-semibold text-slate-700">Service Name *</label><input name="name" required placeholder="e.g. 2D Echo or Blood Test" value="${safe(editingService?.name || '')}" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>` +
            `<div><label class="font-semibold text-slate-700">Description (optional)</label><textarea name="description" rows="2" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">${safe(editingService?.description || '')}</textarea></div>` +
            `<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Category</label><input name="category" value="${safe(editingService?.category || 'Consultations')}" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Department</label><input name="department" value="${safe(editingService?.department || 'General OPD')}" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div></div>` +
            `<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Price (INR ₹) *</label><input name="price" type="number" required step="0.01" value="${editingService?.price ?? 0}" min="0" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Duration (min)</label><input name="duration_min" type="number" value="${editingService?.duration_min ?? 15}" min="1" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div></div>` +
            `<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">${editingService ? 'Update Service' : 'Save Service'}</button></div>` +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'staff') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Add Staff Member</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="addStaffForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Full Name *</label><input name="name" required placeholder="e.g. Sangita Maharjan" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Official Email *</label><input name="email" type="email" required placeholder="sangita@norvic.com" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Role</label><select name="role" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="Receptionist">Receptionist</option><option value="Nurse">Nurse</option><option value="Doctor">Doctor</option><option value="Billing Clerk">Billing Clerk</option><option value="Provider Admin">Provider Admin</option></select></div>' +
            '<div><label class="font-semibold text-slate-700">Staff photo (optional)</label><input id="staffPhotoFile" type="file" accept="image/*" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><img id="staffPhotoPreview" alt="Staff photo preview" class="hidden mt-2 h-16 w-16 rounded-full object-cover"></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save Staff</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'payment') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Record Counter Payment</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="recordPayForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Patient Name *</label><input name="patient_name" required placeholder="e.g. Sita Devi Sharma" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Service / Consultation</label><input name="service_name" placeholder="Service actually paid for" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Amount (Rs.) *</label><input name="amount" type="number" min="0" step="0.01" placeholder="Enter received amount" required class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Payment Method</label><select name="payment_method" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="Fonepay QR">Fonepay QR</option><option value="eSewa Direct">eSewa Direct</option><option value="Cash Counter">Cash Counter</option><option value="Khalti">Khalti</option><option value="Bank Transfer">Bank Transfer</option></select></div></div>' +
            '<div><label class="font-semibold text-slate-700">Masked Account / UPI ID</label><input name="account_mask" placeholder="9841***@esewa or A/C ****4819" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Record Transaction</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'settings') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Hospital Profile & Settings</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="editSettingsForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Hospital Display Name</label><input name="name" value="' + state.provider.name + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">City / Location</label><input name="city" value="' + state.provider.city + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Admin Staff Name</label><input name="admin_name" value="' + state.user.name + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Current Subscription Plan</label><input value="' + (state.provider.plan || 'Saino Free') + '" readonly class="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"><p class="text-[10px] text-slate-500 mt-1">Plan upgrades must go through the subscription/payment flow.</p></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'qr_gen') return '<div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"><div class="bg-white rounded-xl p-6"><p class="text-sm font-bold">QR codes are created from QR Management and saved in PostgreSQL.</p><button class="close-modal mt-4 px-4 py-2 border rounded">Close</button></div></div>';

    return '';
  }

  function bindEvents() {
    const viewDashboardAfterSubmit = document.getElementById('viewProviderDashboardAfterSubmit');
    if (viewDashboardAfterSubmit) viewDashboardAfterSubmit.addEventListener('click', () => {
      state.profileSubmittedModal = false;
      state.page = 'dashboard';
      render();
    });
    const signOutButton = document.getElementById("providerSignOut");
    if (signOutButton) signOutButton.addEventListener("click", () => {
      localStorage.removeItem("SAINO_PROVIDER_TOKEN");
      localStorage.removeItem("isProviderLoggedIn");
      localStorage.removeItem("currentProviderEmail");
      localStorage.removeItem("currentProviderId");
      localStorage.removeItem("currentProviderPlan");
      window.location.replace("login.html");
    });

    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        state.page = btn.dataset.page;
        render();
      });
    });
    const profileForm = document.getElementById('completeProviderProfileForm');
    if (profileForm) {
      const profileSections = profileForm.querySelectorAll(':scope > section');
      ['profile-details-section', 'profile-images-section', 'profile-schedule-section', 'profile-doctors-section', 'profile-services-section'].forEach((id, index) => {
        if (profileSections[index]) profileSections[index].id = id;
      });
      const submitNotice = document.createElement('p');
      submitNotice.dataset.profileSubmitMessage = '';
      submitNotice.setAttribute('role', 'alert');
      submitNotice.className = 'hidden rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800';
      profileForm.prepend(submitNotice);
      bindProfileMedia(profileForm);
    }
    document.querySelectorAll('.profile-nav-btn').forEach(button => button.addEventListener('click', async () => {
      const payload = profilePayload(profileForm);
      try {
        const response = await apiFetch(`${API_BASE}/profile`, { method: 'PUT', body: JSON.stringify(payload) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not save profile details.');
        await loadData(); state.page = button.dataset.page; render();
      } catch (error) { alert(error.message || 'Could not save profile details.'); }
    }));
    if (profileForm) profileForm.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = profilePayload(profileForm);
      try {
        const response = await apiFetch(`${API_BASE}/profile`, { method: 'PUT', body: JSON.stringify(payload) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not save profile details.');
        await loadData(); state.page = 'complete_profile'; render();
        alert('Profile details have been saved.');
      } catch (error) { alert(error.message || 'Could not save profile details.'); }
    });
    const submitProfile = document.getElementById('submitProviderProfileReview');
    if (submitProfile) submitProfile.addEventListener('click', async () => {
      if (!profileForm || !profileForm.reportValidity()) return;
      const payload = profilePayload(profileForm);
      try {
        const saved = await apiFetch(`${API_BASE}/profile`, { method: 'PUT', body: JSON.stringify(payload) });
        const savedData = await saved.json().catch(() => ({}));
        if (!saved.ok || !savedData.success) throw new Error(savedData.error || 'Could not save profile details.');
        const response = await apiFetch(`${API_BASE}/submit-for-review`, { method: 'POST', body: JSON.stringify({}) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          if (Array.isArray(data.missing) && data.missing.length) {
            focusProfileRequirement(data.missing);
            return;
          }
          const backendMessage = String(data.error || data.message || '');
          if (/phle|pehle|bhar|admin ke paas/i.test(backendMessage) || /[\u0900-\u097f]/.test(backendMessage)) {
            focusProfileRequirement(state.profileStatus.missing || []);
            return;
          }
          throw new Error(backendMessage || 'Could not submit the profile for review.');
        }
        await loadData(); state.page = 'complete_profile'; state.profileSubmittedModal = true; render();
      } catch (error) {
        const message = String(error.message || 'Could not submit the profile for review.');
        if (/phle|pehle|bhar|admin ke paas/i.test(message) || /[\u0900-\u097f]/.test(message)) {
          focusProfileRequirement(state.profileStatus.missing || []);
          return;
        }
        alert(message);
      }
    });

    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        state.appointmentFilter = tab.dataset.filter;
        render();
      });
    });

    document.querySelectorAll(".queue-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        triggerQueueAction(btn.dataset.action);
      });
    });

    document.querySelectorAll('.appt-status').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const response = await apiFetch(`${API_BASE}/appointments/${encodeURIComponent(btn.dataset.id)}`, {
          method: 'PATCH', body: JSON.stringify({ status: btn.dataset.status })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not update appointment status.');
        await loadData();
      } catch (error) { alert(error.message); }
    }));
    const refreshProviderData = document.getElementById('refreshProviderData');
    if (refreshProviderData) refreshProviderData.addEventListener('click', () => loadData());
    document.querySelectorAll('.review-reply-form').forEach(form => form.addEventListener('submit', async event => {
      event.preventDefault();
      const responseText = new FormData(form).get('response');
      try {
        const response = await apiFetch(`${API_BASE}/reviews/${encodeURIComponent(form.dataset.reviewId)}/respond`, {
          method: 'POST', body: JSON.stringify({ response: responseText })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not save review response.');
        await loadData(); state.page = 'reviews'; render();
      } catch (error) { alert(error.message); }
    }));

    
    document.querySelectorAll('.qr-view').forEach(button => {
      button.addEventListener('click', () => {
        const q = state.qrCodes.find(
          item => String(item.id) === String(button.dataset.id)
        );

        if (!q) {
          alert('QR record not found.');
          return;
        }

        const url = getProviderQrLink(q);
        const image = getProviderQrImage(q);

        const overlay = document.createElement('div');
        overlay.className =
          'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4';

        overlay.innerHTML = `
          <div role="dialog" aria-modal="true"
            aria-label="Hospital Booking QR"
            class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-black text-slate-900">
                My Booking QR
              </h2>

              <button type="button" data-qr-close
                class="rounded-lg border px-3 py-2 text-xs font-bold">
                Close
              </button>
            </div>

            <p class="mt-2 text-xs text-slate-500">
              ${safe(state.provider.name || 'SAINO Provider')}
            </p>

            <img src="${safe(image)}"
              alt="Scan hospital booking QR"
              class="mx-auto mt-5 h-56 w-56 rounded-xl border object-contain">

            <p class="mt-3 text-center text-xs font-bold text-slate-600">
              Scan to book an appointment
            </p>

            <p class="mt-2 break-all text-center text-[10px] text-slate-500">
              ${safe(url)}
            </p>

            <div class="mt-5 grid grid-cols-2 gap-2">
              <button type="button" data-qr-action="download"
                class="rounded-lg bg-slate-900 px-3 py-3 text-xs font-bold text-white">
                Download PNG
              </button>

              <button type="button" data-qr-action="share"
                class="rounded-lg border px-3 py-3 text-xs font-bold">
                Share
              </button>

              <button type="button" data-qr-action="whatsapp"
                class="rounded-lg bg-emerald-600 px-3 py-3 text-xs font-bold text-white">
                WhatsApp
              </button>

              <button type="button" data-qr-action="copy"
                class="rounded-lg border px-3 py-3 text-xs font-bold">
                Copy Link
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('[data-qr-close]').addEventListener(
          'click',
          () => overlay.remove()
        );

        overlay.addEventListener('click', event => {
          if (event.target === overlay) overlay.remove();
        });

        overlay.querySelectorAll('[data-qr-action]').forEach(actionButton => {
          actionButton.addEventListener('click', async () => {
            actionButton.disabled = true;

            try {
              await handleBookingQrAction(
                actionButton.dataset.qrAction,
                q
              );
            } catch (error) {
              if (error.name !== 'AbortError') {
                alert(error.message || 'QR action failed.');
              }
            } finally {
              actionButton.disabled = false;
            }
          });
        });
      });
    });


    const createProviderQrForm = document.getElementById('createProviderQrForm');
    if (createProviderQrForm) createProviderQrForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(createProviderQrForm);
      try {
        const response = await apiFetch(`${API_BASE}/qr`, {
          method: 'POST', body: JSON.stringify({ label: formData.get('label'), branch_name: formData.get('branch_name') })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not create QR code.');
        await loadData(); state.page = 'qr_marketplace'; render();
      } catch (error) { alert(error.message); }
    });
    document.querySelectorAll('.qr-status').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const response = await apiFetch(`${API_BASE}/qr/${encodeURIComponent(btn.dataset.id)}/status`, {
          
method: 'PATCH',
body: JSON.stringify(
  btn.dataset.status === 'confirmed'
    ? { action: 'accept' }
    : { status: btn.dataset.status }
)

        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not update QR status.');
        await loadData(); state.page = 'qr_marketplace'; render();
      } catch (error) { alert(error.message); }
    }));

    document.querySelectorAll(".modal-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.modal === 'doctor') state.editingDoctorId = null;
        if (btn.dataset.modal === 'service') state.editingServiceId = null;
        state.activeModal = btn.dataset.modal;
        render();
      });
    });
    document.querySelectorAll('.edit-doctor').forEach(button => button.addEventListener('click', () => {
      state.editingDoctorId = Number(button.dataset.doctorId);
      state.activeModal = 'doctor';
      render();
    }));
    document.querySelectorAll('.edit-service').forEach(button => button.addEventListener('click', () => {
      state.editingServiceId = Number(button.dataset.serviceId);
      state.activeModal = 'service';
      render();
    }));
    
document.querySelectorAll('.arrival-confirm').forEach(button => {
  button.addEventListener('click', async () => {
    const appointmentId = button.dataset.id;

    if (!confirm('Confirm that this patient has arrived at reception?')) return;

    button.disabled = true;
    button.textContent = 'Confirming...';

    try {
      const response = await apiFetch(
        `${API_BASE}/appointments/${encodeURIComponent(appointmentId)}/confirm-arrival`,
        {
          method: 'PATCH',
          body: '{}'
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not confirm patient arrival.');
      }

      state.page = 'notifications';
      await loadData();

      alert('Patient arrival confirmed successfully.');
    } catch (error) {
      alert(error.message || 'Arrival confirmation failed.');
      button.disabled = false;
      button.textContent = 'Confirm Arrival';
    }
  });
});


document.querySelectorAll('.arrival-cancel').forEach(button => {
  button.addEventListener('click', async () => {
    const appointmentId = button.dataset.id;

    const reason = prompt(
      'Enter the reason for cancelling this appointment:'
    );

    if (reason === null) return;

    if (!reason.trim()) {
      alert('Cancellation reason is required.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    button.disabled = true;
    button.textContent = 'Cancelling...';

    try {
      const response = await apiFetch(
        `${API_BASE}/appointments/${encodeURIComponent(appointmentId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'cancelled',
            reason: reason.trim()
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not cancel appointment.');
      }

      state.page = 'notifications';
      await loadData();

      alert('Appointment cancelled successfully.');

    } catch (error) {
      alert(error.message || 'Cancellation failed.');
      button.disabled = false;
      button.textContent = 'Cancel Appointment';
    }
  });
});

    document.querySelectorAll('.provider-notification-read').forEach(button => button.addEventListener('click', async () => {
      try {
        const response = await apiFetch(`${API_BASE}/notifications/${encodeURIComponent(button.dataset.notificationId)}/read`, { method: 'PATCH', body: '{}' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not update notification.');
        await loadData(); state.page = 'notifications'; render();
      } catch (error) { alert(error.message); }
    }));

    document.querySelectorAll(".close-modal").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeModal = null;
        state.editingDoctorId = null;
        state.editingServiceId = null;
        render();
      });
    });

    const exportBtn = document.getElementById("exportCsvBtn") || document.getElementById("exportCsvBtnReports");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        window.open(API_BASE + "/reports/export-csv", "_blank");
      });
    }

    const tokenForm = document.getElementById("issueTokenForm");
    if (tokenForm) tokenForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await apiFetch(API_BASE + "/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: fd.get("patient_name"),
          patient_phone: fd.get("patient_phone"),
          doctor_id: fd.get("doctor_id") || null,
          source: fd.get("source") || "walkin",
          fee: fd.get("fee") === "" ? null : Number(fd.get("fee"))
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

   const docForm = document.getElementById("addDocForm");
    if (docForm) {
      const existingDoctor = state.editingDoctorId && state.doctors.find(doctor => Number(doctor.id) === Number(state.editingDoctorId));
      if (existingDoctor) {
        for (const [fieldName, value] of Object.entries({
          name: existingDoctor.name || existingDoctor.full_name, avatar_url: existingDoctor.avatar_url,
          qualification: existingDoctor.qualification, department: existingDoctor.department || existingDoctor.specialization,
          experience_years: existingDoctor.experience_years, nmc_no: existingDoctor.nmc_no, room: existingDoctor.room,
          opd_fee: existingDoctor.opd_fee, followup_fee: existingDoctor.followup_fee, shift_timings: existingDoctor.shift_timings
        })) {
          const input = docForm.elements.namedItem(fieldName);
          if (input && value != null) input.value = value;
        }
      }
      const photoFile = document.getElementById('doctorPhotoFile');
      const photoPreview = docForm.querySelector('[data-doctor-photo-preview]');
      const photoUrlField = docForm.elements.namedItem('avatar_url');
      if (existingDoctor?.avatar_url && photoPreview) { photoPreview.src = existingDoctor.avatar_url; photoPreview.classList.remove('hidden'); }
      photoFile?.addEventListener('change', async () => {
        const file = photoFile.files?.[0]; if (!file) return;
        try { const image = await compressImage(file, 170 * 1024); photoUrlField.value = image; photoPreview.src = image; photoPreview.classList.remove('hidden'); }
        catch (error) { alert(error.message); photoFile.value = ''; }
      });
      docForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(docForm);

        const payload = {
          name: fd.get("name"),
          avatar_url: fd.get("avatar_url"),
          qualification: fd.get("qualification"),
          department: fd.get("department"),
          experience_years: fd.get("experience_years") === "" ? null : parseInt(fd.get("experience_years"), 10),
          nmc_no: fd.get("nmc_no"),
          room: fd.get("room"),
          opd_fee: fd.get("opd_fee") === "" ? null : Number(fd.get("opd_fee")),
          consultation_fee: fd.get("opd_fee") === "" ? null : Number(fd.get("opd_fee")),
          followup_fee: fd.get("followup_fee") === "" ? 0 : Number(fd.get("followup_fee")),
          shift_timings: fd.get("shift_timings")
        };

        try {
          const editingId = state.editingDoctorId;
          const res = await apiFetch(API_BASE + (editingId ? `/doctors/${encodeURIComponent(editingId)}` : "/doctors"), {
            method: editingId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            state.activeModal = null;
            state.editingDoctorId = null;
            await loadData(); // Reloads real doctors from PostgreSQL
            render();
          } else {
            alert(data.error || data.message || "Failed to save doctor.");
          }
        } catch (err) {
          console.error("Doctor save error:", err);
          alert(err.message || "Could not save doctor to PostgreSQL. No local demo record was created.");
        }
      });
    }

    const srvForm = document.getElementById("addSrvForm");
    if (srvForm) srvForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const editingId = state.editingServiceId;
        const res = await apiFetch(API_BASE + (editingId ? `/services/${encodeURIComponent(editingId)}` : "/services"), {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fd.get("name"),
            description: fd.get("description"),
            category: fd.get("category"),
            department: fd.get("department"),
            price: fd.get("price") === "" ? null : Number(fd.get("price")),
            duration_min: fd.get("duration_min") === "" ? 15 : parseInt(fd.get("duration_min"), 10)
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Could not save service.');
        state.activeModal = null;
        state.editingServiceId = null;
        await loadData();
        state.page = 'services';
        render();
      } catch (error) { alert(error.message || 'Could not save service.'); }
    });

    const staffForm = document.getElementById("addStaffForm");
    const staffPhotoFile = document.getElementById('staffPhotoFile');
    const staffPhotoPreview = document.getElementById('staffPhotoPreview');
    let staffAvatarUrl = '';
    staffPhotoFile?.addEventListener('change', async () => {
      const file = staffPhotoFile.files?.[0]; if (!file) return;
      try { staffAvatarUrl = await compressImage(file, 170 * 1024); staffPhotoPreview.src = staffAvatarUrl; staffPhotoPreview.classList.remove('hidden'); }
      catch (error) { alert(error.message); staffPhotoFile.value = ''; }
    });
    if (staffForm) staffForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await apiFetch(API_BASE + "/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          role: fd.get("role"),
          avatar_url: staffAvatarUrl || null
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

    const payForm = document.getElementById("recordPayForm");
    if (payForm) payForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await apiFetch(API_BASE + "/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: fd.get("patient_name"),
          service_name: fd.get("service_name"),
          amount: fd.get("amount") === "" ? 0 : Number(fd.get("amount")),
          payment_method: fd.get("payment_method"),
          account_mask: fd.get("account_mask") || null
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

    const settingsForm = document.getElementById("editSettingsForm");
    if (settingsForm) settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await apiFetch(API_BASE + "/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          city: fd.get("city"),
          admin_name: fd.get("admin_name")
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });
  }

  loadData();
})();
