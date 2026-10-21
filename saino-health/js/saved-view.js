/* ============================================================
   APPOINTMENTS + SAVED VIEW  (search karne ke liye: "appointments" / "saved")
   - Sirf Tailwind classes, alag CSS nahi. Icons inline SVG
   - Data browser ke localStorage mein rehta hai (reviews ki tarah)
   - Ye 2 functions app.js ke purane "under construction" wale functions ki jagah lete hain:
       renderAppointmentsView()   renderSavedView()
   ============================================================ */

/* ---------- Shared helpers ---------- */
const APPOINTMENTS_KEY = "SAINO_APPOINTMENTS";
const SAVED_KEY = "SAINO_SAVED_PROVIDERS";

function savedReadStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
}
function savedWriteStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function savedAllProviders() {
  return (window.AppState && AppState.providers) || (window.SAINO_DATA && SAINO_DATA.providers) || [];
}
function savedFindProvider(id) {
  return savedAllProviders().find(p => String(p.id) === String(id));
}
function savedTitleCase(s) {
  s = String(s || "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SAVED_HEART_PATH = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

function savedPageHeader(title, subtitle, withButton) {
  return `
    <div class="bg-white border-y border-slate-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onclick="navigateTo('marketplace')"
            class="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline mb-2">
            ← Back to Marketplace
          </button>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900">${title}</h1>
          <p class="text-sm text-slate-500 mt-1">${subtitle}</p>
        </div>
        ${withButton ? `
          <button onclick="navigateTo('marketplace')"
            class="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
            Find healthcare
          </button>` : ""}
      </div>
    </div>`;
}

function savedEmptyState(title, text) {
  return `
    <div class="bg-white border border-slate-200 rounded-2xl text-center py-14 px-6">
      <div class="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-700 flex items-center justify-center mb-4">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="${SAVED_HEART_PATH}"/></svg>
      </div>
      <h3 class="text-base font-bold text-slate-900">${title}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5 max-w-sm mx-auto">${text}</p>
      <button onclick="navigateTo('marketplace')"
        class="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
        Find healthcare
      </button>
    </div>`;
}

/* ============================================================
   SAVED: heart button + toggle
   ============================================================ */

function savedIsSaved(id) {
  return savedReadStore(SAVED_KEY).map(String).includes(String(id));
}

// Kisi bhi card mein ye daal dijiye: ${savedHeartButton(p.id)}
function savedHeartButton(id, extraClass = "") {
  const on = savedIsSaved(id);
  return `
    <button data-save-id="${id}" onclick="toggleSaveProvider('${id}', event)" aria-label="Save"
      class="${on ? "text-red-600" : "text-slate-700"} hover:text-red-700 transition ${extraClass}">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="${SAVED_HEART_PATH}"/>
      </svg>
    </button>`;
}

function updateSavedHearts() {
  document.querySelectorAll("[data-save-id]").forEach(btn => {
    const on = savedIsSaved(btn.getAttribute("data-save-id"));
    btn.classList.toggle("text-red-600", on);
    btn.classList.toggle("text-slate-700", !on);
    const svg = btn.querySelector("svg");
    if (svg) svg.setAttribute("fill", on ? "currentColor" : "none");
  });
}

window.toggleSaveProvider = function (id, event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  let ids = savedReadStore(SAVED_KEY).map(String);
  const sid = String(id);
  const was = ids.includes(sid);
  ids = was ? ids.filter(x => x !== sid) : [sid, ...ids];
  savedWriteStore(SAVED_KEY, ids);

  const p = savedFindProvider(id);
  if (typeof showToast === "function") showToast(was ? `Removed ${p ? p.name : "provider"} from Saved` : `Saved ${p ? p.name : "provider"}`);

  updateSavedHearts();
  if (document.getElementById("saved-grid")) window.selectSavedCategory(SAVED_STATE.category);   // Saved page par ho to list refresh
};

/* ============================================================
   SAVED PAGE
   ============================================================ */
let SAVED_STATE = { category: "all" };

function savedProviderCard(p) {
  const verification = String(p.verification || "").toLowerCase();
  const tier = { vvip: "SAINO VVIP", vip: "SAINO Verified (VIP)", pro: "SAINO Verified (VIP)", prime: "SAINO VVIP" }[verification];
  const place = p.location || p.address || p.city || "";
  const initials = String(p.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return `
    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative h-32 bg-slate-100">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full flex items-center justify-center text-2xl font-black text-slate-400">${initials}</div>`}
        <span class="absolute top-2 right-2 bg-white rounded-full p-2 shadow">
          ${savedHeartButton(p.id)}
        </span>
      </div>
      <div class="p-4 flex flex-col flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">${savedTitleCase(p.category)}</span>
          ${tier ? `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">${tier}</span>` : ""}
        </div>
        <h3 class="text-sm font-bold text-slate-900">${p.name}</h3>
        <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
          ${p.rating ? `<span class="text-amber-500 font-bold">★ ${p.rating}</span>` : ""}
          ${place ? `<span class="truncate">${place}</span>` : ""}
        </div>
        <div class="flex gap-2 mt-4 pt-1 mt-auto">
          <button onclick="openProviderProfile('${p.id}')"
            class="flex-1 border border-red-700 text-red-700 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition">View profile</button>
          <button onclick="openBookingWhatsApp('${p.id}')"
            class="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-2 rounded-lg transition">Book</button>
        </div>
      </div>
    </div>`;
}

function savedProviderList() {
  const ids = savedReadStore(SAVED_KEY).map(String);
  return ids.map(savedFindProvider).filter(Boolean);        // jo provider data se hat gaye wo skip
}

function savedCategoryPills(list) {
  const cats = ["all", ...Array.from(new Set(list.map(p => p.category).filter(Boolean)))];
  return cats.map(c => {
    const on = c === SAVED_STATE.category;
    const count = c === "all" ? list.length : list.filter(p => p.category === c).length;
    return `
      <button onclick="selectSavedCategory('${c}')"
        class="px-4 py-1.5 rounded-lg border text-xs font-semibold transition
        ${on ? "bg-red-700 border-red-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}">
        ${c === "all" ? "All" : savedTitleCase(c)} (${count})
      </button>`;
  }).join("");
}

function savedGridHTML(list) {
  const shown = SAVED_STATE.category === "all" ? list : list.filter(p => p.category === SAVED_STATE.category);
  if (!list.length) return savedEmptyState("No saved providers yet", "Tap the heart on any hospital, clinic or service to keep it here for later.");
  return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">${shown.map(savedProviderCard).join("")}</div>`;
}

function renderSavedView() {
  SAVED_STATE.category = "all";
  const list = savedProviderList();

  return `
    ${savedPageHeader("Saved", "Providers you saved for later.", false)}
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 mb-16">
      <div id="saved-pills" class="flex flex-wrap gap-2 mb-5 ${list.length ? "" : "hidden"}">${savedCategoryPills(list)}</div>
      <div id="saved-grid">${savedGridHTML(list)}</div>
    </div>
  `;
}

window.selectSavedCategory = function (cat) {
  const list = savedProviderList();
  if (cat !== "all" && !list.some(p => p.category === cat)) cat = "all";   // category khali ho gayi to All par
  SAVED_STATE.category = cat;
  const pills = document.getElementById("saved-pills");
  const grid = document.getElementById("saved-grid");
  if (pills) { pills.innerHTML = savedCategoryPills(list); pills.classList.toggle("hidden", !list.length); }
  if (grid) grid.innerHTML = savedGridHTML(list);
};

/* ============================================================
   APPOINTMENTS
   ============================================================ */

// handleWhatsAppBookingSubmit ke andar call hota hai (har booking yahan save hoti hai)
window.saveAppointmentRecord = function (provider, form) {
  const list = savedReadStore(APPOINTMENTS_KEY);
  list.unshift({
    id: "apt-" + Date.now(),
    providerId: provider.id,
    providerName: provider.name,
    category: provider.category || "",
    service: form.service || "",
    patientName: form.name || "",
    date: form.date || "",
    notes: form.notes || "",
    status: "requested",                                   // requested | cancelled
    createdAt: Date.now(),
  });
  savedWriteStore(APPOINTMENTS_KEY, list);
};

function appointmentsParseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(str || ""));
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(str);
  if (isNaN(d)) return null;
  return {
    time: d.getTime(),
    day: d.getDate(),
    month: d.toLocaleString("en-US", { month: "short" }),
    full: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
  };
}

function appointmentsBucket(a) {
  if (a.status === "cancelled") return "cancelled";
  const d = appointmentsParseDate(a.date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d && d.time < today.getTime() ? "past" : "upcoming";
}

let APPOINTMENTS_STATE = { tab: "upcoming" };
const APPOINTMENTS_TABS = [["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"]];

function appointmentsTabs(all) {
  return APPOINTMENTS_TABS.map(([key, label]) => {
    const on = key === APPOINTMENTS_STATE.tab;
    const count = all.filter(a => appointmentsBucket(a) === key).length;
    return `
      <button onclick="selectAppointmentsTab('${key}')"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition
        ${on ? "border-red-700 text-red-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
        ${label} <span class="ml-1 text-xs ${on ? "text-red-700" : "text-slate-400"}">${count}</span>
      </button>`;
  }).join("");
}

function appointmentsCard(a, bucket) {
  const d = appointmentsParseDate(a.date);
  const statusChip = bucket === "cancelled"
    ? `<span class="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Cancelled</span>`
    : bucket === "past"
      ? `<span class="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Past visit</span>`
      : `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">Requested · awaiting confirmation</span>`;

  const actions = bucket === "upcoming"
    ? `<button onclick="openProviderModal('${a.providerId}')" class="border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition">View provider</button>
       <button onclick="cancelAppointment('${a.id}')" class="text-xs font-semibold text-red-700 hover:underline px-2 py-2">Cancel</button>`
    : `<button onclick="openBookingWhatsApp('${a.providerId}')" class="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">Book again</button>
       <button onclick="deleteAppointment('${a.id}')" class="text-xs font-semibold text-slate-500 hover:text-red-700 hover:underline px-2 py-2">Remove</button>`;

  return `
    <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="w-16 h-16 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
        <span class="text-xl font-black text-slate-900 leading-none">${d ? d.day : "--"}</span>
        <span class="text-[11px] font-semibold text-slate-500 uppercase mt-0.5">${d ? d.month : ""}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-1">${statusChip}</div>
        <h3 class="text-sm font-bold text-slate-900">${a.providerName}</h3>
        <p class="text-xs text-slate-600 mt-0.5">${a.service || "General consultation"}${d ? ` · ${d.full}` : ""}</p>
        <p class="text-xs text-slate-400 mt-0.5">Patient: ${a.patientName || "—"}</p>
        ${a.notes ? `<p class="text-xs text-slate-400 mt-0.5 truncate">Note: ${a.notes}</p>` : ""}
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">${actions}</div>
    </div>`;
}

function appointmentsListHTML(all) {
  const items = all.filter(a => appointmentsBucket(a) === APPOINTMENTS_STATE.tab);
  items.sort((x, y) => {
    const tx = (appointmentsParseDate(x.date) || { time: 0 }).time;
    const ty = (appointmentsParseDate(y.date) || { time: 0 }).time;
    return APPOINTMENTS_STATE.tab === "upcoming" ? tx - ty : ty - tx;
  });

  if (!items.length) {
    const msg = {
      upcoming: ["No upcoming appointments", "Book a visit with any hospital, clinic or home care provider and it will show up here."],
      past: ["No past appointments", "Your completed visits will appear here."],
      cancelled: ["No cancelled appointments", "Appointments you cancel will appear here."],
    }[APPOINTMENTS_STATE.tab];
    return savedEmptyState(msg[0], msg[1]);
  }
  return `<div class="space-y-3">${items.map(a => appointmentsCard(a, APPOINTMENTS_STATE.tab)).join("")}</div>`;
}

function renderAppointmentsView() {
  return `${savedPageHeader('My Appointments', 'Look up a booking saved in SAINO PostgreSQL.', true)}
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 mb-16"><div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 class="text-lg font-black text-slate-900">Track a booking</h2><p class="mt-1 text-xs text-slate-500">Enter the SAINO Booking ID shown after you submit your appointment request.</p><form class="mt-5 flex flex-col sm:flex-row gap-3" onsubmit="lookupLiveBooking(event)"><input id="bookingLookupId" required maxlength="80" placeholder="e.g. SAINO-AB12CD34EF" class="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase"><button id="bookingLookupButton" class="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white">Check status</button></form><div id="bookingLookupResult" class="mt-5" aria-live="polite"></div></div></div>`;
}
window.lookupLiveBooking = async function(event) {
  event.preventDefault();
  const input = document.getElementById('bookingLookupId');
  const button = document.getElementById('bookingLookupButton');
  const output = document.getElementById('bookingLookupResult');
  if (!input || !output) return;
  const bookingId = input.value.trim();
  if (!bookingId) return;
  const patientToken = window.getSainoPatientSession?.().token || '';
  if (!patientToken) { if (typeof window.openPatientOtpModal === 'function') window.openPatientOtpModal(); return; }
  button.disabled = true; button.textContent = 'Checking…';
  output.innerHTML = '<p class="text-xs text-slate-500">Loading booking status…</p>';
  try {
    const response = await fetch((window.SAINO_API_ORIGIN || '') + '/api/public/bookings/' + encodeURIComponent(bookingId), { cache: 'no-store', headers: { Accept: 'application/json', Authorization: `Bearer ${patientToken}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success || !payload.booking) throw new Error(payload.error || 'Booking not found. Check the Booking ID and try again.');
    const b = payload.booking;
    const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    output.innerHTML = `<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div class="font-bold text-emerald-900">Booking found</div><div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"><div><span class="text-slate-500">Booking ID</span><strong class="block mt-1">${esc(b.booking_ref || bookingId)}</strong></div><div><span class="text-slate-500">Patient ID</span><strong class="block mt-1">${esc(b.patient_id || 'Not assigned')}</strong></div><div><span class="text-slate-500">Provider</span><strong class="block mt-1">${esc(b.provider_name || 'Provider')}</strong></div><div><span class="text-slate-500">Appointment</span><strong class="block mt-1">${esc(b.appointment_date || 'Not scheduled')} ${esc(b.slot_time || '')}</strong></div><div><span class="text-slate-500">Status</span><strong class="block mt-1 uppercase">${esc(b.status || 'pending')}</strong></div><div><span class="text-slate-500">Payment</span><strong class="block mt-1 uppercase">${esc(b.payment_status || 'pending')}</strong></div><div><span class="text-slate-500">Queue token</span><strong class="block mt-1">${esc(b.token || 'Not assigned')}</strong></div><div><span class="text-slate-500">Visit ID</span><strong class="block mt-1">${esc(b.visit_id || 'Issued when checked in')}</strong></div></div><p class="text-[11px] text-emerald-900 mt-4">Status is read directly from the saved booking record. A booking request is not a confirmed appointment until the provider updates its status.</p></div>`;
  } catch (error) {
    output.innerHTML = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">${String(error.message || 'Booking lookup failed.').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}</div>`;
  } finally { button.disabled = false; button.textContent = 'Check status'; }
};

window.selectAppointmentsTab = function (tab) {
  APPOINTMENTS_STATE.tab = tab;
  appointmentsRefresh();
};

window.cancelAppointment = function (id) {
  if (!confirm("Cancel this appointment?")) return;
  const list = savedReadStore(APPOINTMENTS_KEY).map(a => a.id === id ? { ...a, status: "cancelled" } : a);
  savedWriteStore(APPOINTMENTS_KEY, list);
  if (typeof showToast === "function") showToast("Appointment cancelled");
  appointmentsRefresh();
};

window.deleteAppointment = function (id) {
  savedWriteStore(APPOINTMENTS_KEY, savedReadStore(APPOINTMENTS_KEY).filter(a => a.id !== id));
  appointmentsRefresh();
};
