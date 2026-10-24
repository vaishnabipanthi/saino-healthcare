
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

   //SAVED: heart button + toggle
function savedIsSaved(id) {
  return savedReadStore(SAVED_KEY).map(String).includes(String(id));
}


function savedHeartButton(id, extraClass = "") {
  const on = savedIsSaved(id);

  return `
    <button type="button"
      data-save-id="${id}"
      onclick="toggleSaveProvider('${id}', event)"
      aria-label="${on ? "Remove from Saved" : "Save provider"}"
      aria-pressed="${on}"
      title="${on ? "Saved" : "Save provider"}"
      class="${on ? "text-red-600" : "text-slate-700"} hover:text-red-700 transition ${extraClass}">
      <svg class="w-5 h-5" viewBox="0 0 24 24"
        fill="${on ? "currentColor" : "none"}"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>`;
}

function updateSavedHearts() {
  document.querySelectorAll("[data-save-id]").forEach(btn => {
    const on = savedIsSaved(btn.getAttribute("data-save-id"));

    btn.classList.toggle("text-red-600", on);
    btn.classList.toggle("text-slate-700", !on);

    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Remove from Saved" : "Save provider");
    btn.title = on ? "Saved" : "Save provider";

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

   // SAVED PAGE
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

/* SAINO Patient Live Appointment Tracking */

let sainoTrackingTimer = null;
let sainoActiveBookingRef = "";

function sainoEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function sainoStatusLabel(status) {
  return ({
    pending: "Awaiting Provider Confirmation",
    requested: "Awaiting Provider Confirmation",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    waiting: "Waiting in Queue",
    in_progress: "Consultation in Progress",
    completed: "Visit Completed",
    cancelled: "Cancelled",
    declined: "Declined",
    rejected: "Declined"
  })[String(status || "").toLowerCase()] || savedTitleCase(status);
}

function sainoLiveBookingCard(b, bookingRef) {
  const esc = sainoEscape;
  const status = String(b.status || "pending").toLowerCase();

  const pending = ["pending", "requested"].includes(status);
  const declined = ["declined", "rejected", "cancelled"].includes(status);
  const completed = status === "completed";

  const token = !pending && !declined ? b.token : null;

  const steps = [
    ["confirmed", "Booked"],
    ["checked_in", "Checked In"],
    ["waiting", "Waiting"],
    ["in_progress", "Your Turn"],
    ["completed", "Done"]
  ];

  const currentIndex = steps.findIndex(([key]) => key === status);

  const progress = pending || declined ? "" : `
    <div class="mt-5 border-t border-slate-200 pt-4">
      <h4 class="text-sm font-bold text-slate-900 mb-4">
        Appointment Progress
      </h4>

      <div class="grid grid-cols-5 gap-1">
        ${steps.map(([key, label], index) => {
          const done = currentIndex >= index;
          return `
            <div class="text-center">
              <div class="mx-auto w-8 h-8 rounded-full flex items-center
                          justify-center text-xs font-bold
                          ${done
                            ? "bg-red-700 text-white"
                            : "bg-slate-100 text-slate-400"}">
                ${done ? "✓" : index + 1}
              </div>
              <p class="mt-2 text-[10px] sm:text-xs
                        ${done ? "text-red-700 font-bold" : "text-slate-400"}">
                ${label}
              </p>
            </div>`;
        }).join("")}
      </div>
    </div>`;
      const arrivalStatus = String(b.arrival_status || "not_requested").toLowerCase();

  const appointmentDay = String(b.appointment_date || "").slice(0, 10);

  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const isVideo = /video|online|virtual/i.test(
    String(b.consultation_type || b.appointment_type || "")
  );

  const arrivalUI =
    status === "confirmed" &&
    arrivalStatus === "not_requested" &&
    appointmentDay === todayIST &&
    !isVideo
      ? `<button onclick="requestPatientArrival()"
           id="patientArrivalButton"
           class="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
           I Have Arrived
         </button>`
      : arrivalStatus === "pending"
        ? `<p class="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
             Arrival request sent. Waiting for reception confirmation.
           </p>`
        : arrivalStatus === "confirmed"
          ? `<p class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
               ✓ Arrival confirmed by reception.
             </p>`
          : "";
  const reviewUI = status === "completed"
  ? b.has_review
    ? `
      <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-sm font-bold text-emerald-800">
          ✓ Review Submitted
        </p>

        <button type="button"
          onclick="viewPatientReview('${esc(b.booking_ref || bookingRef)}')"
          class="mt-3 w-full rounded-xl bg-red-700 px-5 py-3
                 text-sm font-bold text-white hover:bg-red-800">
          View Review →
        </button>
      </div>
    `
    : `
      <button type="button" onclick="openPatientReview()"
        class="mt-4 w-full rounded-xl bg-amber-500 px-5 py-3
               text-sm font-bold text-white hover:bg-amber-600">
        ⭐ Write a Review
      </button>

      <div id="patientReviewForm" class="mt-4"></div>
    `
  : "";

  const queue = token ? `
    <div class="grid grid-cols-2 gap-3 mt-5">
      <div class="bg-red-50 border border-red-100 rounded-xl p-4">
        <p class="text-xs text-slate-500">Your Token</p>
        <p class="text-3xl font-black text-red-800 mt-2">
          ${esc(token)}
        </p>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p class="text-xs text-slate-500">Now Serving</p>
        <p class="text-3xl font-black text-slate-900 mt-2">
          ${esc(b.now_serving_token || "—")}
        </p>
      </div>
    </div>

    ${b.position != null || b.eta_minutes != null ? `
      <div class="mt-3 bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
        ${b.position != null
          ? `<strong>Queue position:</strong> ${esc(b.position)}`
          : ""}
        ${b.eta_minutes != null
          ? `<p class="mt-1"><strong>Estimated wait:</strong>
             ${esc(b.eta_minutes)} minutes</p>`
          : ""}
      </div>` : ""}
  ` : "";

  const message = pending
    ? "Your booking request has been submitted. Please wait for provider confirmation. Your queue token will be assigned after confirmation."
    : declined
      ? "This appointment is no longer active."
      : completed
        ? "Your consultation has been completed."
        : "Your appointment status is updated automatically.";

  const badgeClass = pending
    ? "bg-amber-50 text-amber-700"
    : declined
      ? "bg-red-50 text-red-700"
      : completed
        ? "bg-slate-100 text-slate-700"
        : "bg-emerald-50 text-emerald-700";

  return `
    <div class="border border-slate-200 rounded-2xl p-4 sm:p-6 bg-white">

      <div class="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h3 class="text-lg font-black text-slate-900">
            Today's Appointment
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            Live queue · Updates automatically
          </p>
        </div>

        <span class="text-xs font-bold px-3 py-1.5 rounded-full ${badgeClass}">
          ${esc(sainoStatusLabel(status))}
        </span>
      </div>

      <div class="mt-5 border-t border-slate-100 pt-4">
        <h4 class="text-base font-bold text-slate-900">
          ${esc(b.provider_name || "Healthcare Provider")}
        </h4>

        <p class="text-xs text-slate-500 mt-1">
          ${esc(b.appointment_date || "Date not available")}
          · ${esc(b.slot_time || "Time not available")}
        </p>

        <p class="text-xs text-slate-400 mt-2">
          Booking ID: ${esc(b.booking_ref || bookingRef)}
        </p>
      </div>

              ${queue}
        ${arrivalUI}

        <div class="mt-4 rounded-xl p-3 ${badgeClass}">
          <p class="text-sm font-semibold">${esc(message)}</p>
        </div>

        ${progress}
        ${reviewUI}

      ${token && !completed ? `
        <div class="mt-5 flex items-start gap-2 text-xs text-slate-600
                    bg-slate-50 rounded-xl p-3">
          <span>🔔</span>
          <p>Keep checking your live queue for updates.
             Your status will refresh automatically.</p>
        </div>` : ""}

      <p class="text-[11px] text-slate-400 mt-4">
        Last updated: ${new Date().toLocaleTimeString()}
      </p>
    </div>`;
}
window.openPatientReview = function () {
  const container = document.getElementById("patientReviewForm");
  if (!container) return;

  container.innerHTML = `
    <form onsubmit="submitPatientReview(event)"
      class="rounded-xl border border-amber-200 bg-amber-50 p-5">

      <h3 class="mb-3 text-base font-bold text-slate-900">
        Rate Your Experience
      </h3>

      <label class="block text-sm font-semibold mb-2">
        Your Rating
      </label>

      <input type="hidden" id="patientReviewRating" value="">

        <div id="patientReviewStars"
            class="flex items-center gap-2 mb-4"
            role="group"
            aria-label="Select your rating">

          ${[1, 2, 3, 4, 5].map(n => `
            <button
              type="button"
              data-rating="${n}"
              aria-label="${n} star${n > 1 ? 's' : ''}"
              aria-pressed="false"
              onclick="selectPatientReviewRating(${n})"
              class="text-4xl text-slate-300 transition-colors hover:scale-110">
              ★
            </button>
          `).join("")}

        </div>

      <label class="block text-sm font-semibold mb-2">
        Your Feedback
      </label>

      <textarea id="patientReviewComment"
        required maxlength="2000" rows="4"
        placeholder="Share your experience..."
        class="w-full rounded-lg border p-3 mb-4"></textarea>

      <button id="patientReviewSubmit" type="submit"
        class="w-full rounded-lg bg-amber-500 p-3 font-bold text-white">
        Submit Review
      </button>
    </form>
  `;
};
window.selectPatientReviewRating = function (rating) {
  const input = document.getElementById("patientReviewRating");
  const stars = document.querySelectorAll(
    "#patientReviewStars button"
  );

  if (!input) return;

  input.value = String(rating);

  stars.forEach(star => {
    const selected = Number(star.dataset.rating) <= rating;

    star.classList.toggle("text-amber-400", selected);
    star.classList.toggle("text-slate-300", !selected);

    star.setAttribute(
      "aria-pressed",
      String(Number(star.dataset.rating) === rating)
    );
  });
};

window.submitPatientReview = async function (event) {
  event.preventDefault();

const bookingRef = sainoActiveBookingRef;
console.log("REVIEW BOOKING REF:", bookingRef);
  const rating = Number(
    document.getElementById("patientReviewRating")?.value
  );
  const comment = document.getElementById("patientReviewComment")?.value.trim();
  const button = document.getElementById("patientReviewSubmit");

  const patientToken =
    window.getSainoPatientSession?.()?.token ||
    localStorage.getItem("SAINO_PATIENT_TOKEN") || "";

  if (!bookingRef || !patientToken) {
    alert("Please log in and open your completed booking.");
    return;
  }

  if (!rating || !comment || !button) return;

  const bookingResponse = await fetch(
    (window.SAINO_API_ORIGIN || "") +
      "/api/public/bookings/" + encodeURIComponent(bookingRef),
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );

  const bookingData = await bookingResponse.json().catch(() => ({}));

  if (!bookingResponse.ok || !bookingData.success) {
    alert(bookingData.error || "Could not verify booking.");
    return;
  }

  const providerId = bookingData.booking?.provider_id;

  if (!providerId ||
      String(bookingData.booking.status).toLowerCase() !== "completed") {
    alert("Only completed appointments can be reviewed.");
    return;
  }

  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const response = await fetch(
      (window.SAINO_API_ORIGIN || "") +
        "/api/public/providers/" + encodeURIComponent(providerId) + "/reviews",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${patientToken}`
        },
        body: JSON.stringify({
          booking_ref: bookingRef,
          rating,
          comment
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Review submission failed.");
    }

    document.getElementById("patientReviewForm").innerHTML = `
      <p class="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        ✓ Thank you! Your verified review has been submitted successfully.
      </p>
    `;

  } catch (error) {
    alert(error.message || "Could not submit review.");
    button.disabled = false;
    button.textContent = "Submit Review";
  }
};
window.requestPatientArrival = async function () {
  const bookingRef = sainoActiveBookingRef;
  const button = document.getElementById("patientArrivalButton");

  if (!bookingRef || !button) return;

  if (!confirm("Have you reached the healthcare provider's reception?")) {
    return;
  }

  const patientToken =
    window.getSainoPatientSession?.()?.token ||
    localStorage.getItem("SAINO_PATIENT_TOKEN") ||
    "";

  if (!patientToken) {
    alert("Please log in first.");
    return;
  }

  button.disabled = true;
  button.textContent = "Sending request...";

  try {
    const response = await fetch(
      (window.SAINO_API_ORIGIN || "") +
      "/api/public/bookings/" +
      encodeURIComponent(bookingRef) +
      "/arrival-request",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${patientToken}`
        },
        body: JSON.stringify({})
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Could not send arrival request.");
    }

    button.outerHTML = `
      <p class="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
        Arrival request sent. Waiting for reception confirmation.
      </p>
    `;

  } catch (error) {
    alert(error.message || "Arrival request failed.");
    button.disabled = false;
    button.textContent = "I Have Arrived";
  }
};

window.lookupLiveBooking = async function(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("bookingLookupId");
  const button = document.getElementById("bookingLookupButton");
  const output = document.getElementById("bookingLookupResult");

  if (!input || !output) return;

  const bookingRef = input.value.trim();
  if (!bookingRef) return;

  const patientToken =
    window.getSainoPatientSession?.()?.token ||
    localStorage.getItem("SAINO_PATIENT_TOKEN") ||
    "";

  if (!patientToken) {
    output.innerHTML = `
      <p class="text-sm text-red-700">
        Please sign in with your patient ID/email and password first.
      </p>`;
    return;
  }

  // Previous booking ki auto-refresh band karo.
  if (sainoTrackingTimer) {
    clearInterval(sainoTrackingTimer);
    sainoTrackingTimer = null;
  }

  sainoActiveBookingRef = bookingRef;

  async function refreshBooking() {
    if (!document.getElementById("bookingLookupResult")) {
      clearInterval(sainoTrackingTimer);
      sainoTrackingTimer = null;
      return;
    }

    try {
      const response = await fetch(
        (window.SAINO_API_ORIGIN || "") +
        "/api/public/bookings/" +
        encodeURIComponent(bookingRef),
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${patientToken}`
          }
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.success || !payload.booking) {
        throw new Error(payload.error || "Unable to load booking.");
      }

      if (sainoActiveBookingRef !== bookingRef) return;

      const booking = payload.booking;

      const reviewForm = document.getElementById("patientReviewForm");
        const reviewIsOpen = reviewForm && reviewForm.querySelector("form");

        if (!reviewIsOpen) {
          output.innerHTML = sainoLiveBookingCard(booking, bookingRef);
        }

      const status = String(booking.status || "").toLowerCase();

      if (["completed", "cancelled", "declined", "rejected"].includes(status)) {
        clearInterval(sainoTrackingTimer);
        sainoTrackingTimer = null;
      }

    } catch (error) {
      output.innerHTML = `
        <div class="rounded-xl border border-red-200 bg-red-50 p-4
                    text-sm text-red-700">
          ${sainoEscape(error.message || "Tracking failed.")}
        </div>`;

      clearInterval(sainoTrackingTimer);
      sainoTrackingTimer = null;
    }
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Checking…";
  }

  output.innerHTML =
    '<p class="text-sm text-slate-500">Loading live appointment…</p>';

  await refreshBooking();

  if (button) {
    button.disabled = false;
    button.textContent = "Check status";
  }

  // Har 10 seconds mein latest backend status fetch karega.
  if (
    !sainoTrackingTimer &&
    document.getElementById("bookingLookupResult") &&
    output.innerHTML.includes("Today's Appointment")
  ) {
    sainoTrackingTimer = setInterval(() => {
      if (!document.hidden) refreshBooking();
    }, 100000);
  }
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
window.viewPatientReview = async function (bookingRef) {
  const token =
    window.getSainoPatientSession?.()?.token ||
    localStorage.getItem("SAINO_PATIENT_TOKEN") || "";

  if (!token) {
    alert("Please log in first.");
    return;
  }

  try {
    const response = await fetch(
      (window.SAINO_API_ORIGIN || "") +
      "/api/public/bookings/" +
      encodeURIComponent(bookingRef) + "/review",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Review unavailable.");
    }

    window.sainoReviewFocus = {
      providerId: String(data.review.provider_id),
      reviewId: String(data.review.id)
    };

    window.openHospitalProfile(String(data.review.provider_id));

  } catch (error) {
    alert(error.message || "Could not open review.");
  }
};