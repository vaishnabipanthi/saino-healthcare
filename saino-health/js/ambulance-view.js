/* ============================================================
   AMBULANCE DIRECTORY & TRACKING VIEW
   ============================================================ */

const AMBULANCE_LIST = [
  { id: "amb-nepal",     name: "Nepal Ambulance Service",  tier: "verified", minutes: 15, type: "Basic",            km: 2.1, rating: 4.8, fare: 1800, bookingId: "SA-10493", vehicle: "BA 2 PA 4521", pos: { x: 26, y: 20 }, driver: { name: "Ramesh Thapa", role: "Paramedic Driver · BLS unit", phone: "+977-9800000001" } },
  { id: "amb-ktm",       name: "KTM Medical Rescue",       tier: "pro",      minutes: 20, type: "Basic",            km: 3.5, rating: 4.7, fare: 2000, bookingId: "SA-10494", vehicle: "BA 3 PA 1180", pos: { x: 77, y: 20 }, driver: { name: "Sunil Gurung", role: "Paramedic Driver · BLS unit", phone: "+977-9800000002" } },
  { id: "amb-emergency", name: "Emergency Services Nepal", tier: "vip",      minutes: 10, type: "ICU",              km: 1.2, rating: 4.9, fare: 1500, bookingId: "SA-10495", vehicle: "BA 1 PA 7734", pos: { x: 23, y: 72 }, driver: { name: "Anita Rai", role: "Paramedic Driver · ICU unit", phone: "+977-9800000003" } },
  { id: "amb-rescue",    name: "Kathmandu Rescue Team",    tier: "vvip",     minutes: 25, type: "Oxygen equipped",  km: 4.0, rating: 4.6, fare: 2500, bookingId: "SA-10496", vehicle: "BA 4 PA 9052", pos: { x: 77, y: 72 }, driver: { name: "Bikash Tamang", role: "Paramedic Driver · Oxygen unit", phone: "+977-9800000004" } },
];

const AMBULANCE_FILTERS = ["All", "Basic", "ICU", "Oxygen equipped"];
const AMBULANCE_STEPS = ["Requested", "Dispatched", "En Route", "Arrived"];

const AMBULANCE_TIERS = {
  verified: { label: "SAINO Verified", cls: "text-emerald-700" },
  pro:      { label: "SAINO Verified (VIP)", cls: "text-blue-800" },
  vip:      { label: "SAINO Verified (VIP)", cls: "text-amber-600" },
  vvip:     { label: "SAINO VVIP",     cls: "text-red-600" },
};

let AMBULANCE_STATE = { filter: "All", from: null, to: null, active: null };

const ambulanceMoney = (n) => `NPR ${n.toLocaleString("en-US")}`;

function ambulanceVisible() {
  return AMBULANCE_LIST
    .filter(a => AMBULANCE_STATE.filter === "All" || a.type === AMBULANCE_STATE.filter)
    .sort((a, b) => a.minutes - b.minutes);
}

function ambulanceBadge(tier) {
  const t = AMBULANCE_TIERS[tier] || AMBULANCE_TIERS.verified;
  return `
    <span class="inline-flex items-center gap-1 bg-slate-50 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${t.cls}">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/>
        <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${t.label}
    </span>`;
}

function ambulanceFilterPills() {
  return AMBULANCE_FILTERS.map(f => {
    const on = f === AMBULANCE_STATE.filter;
    return `
      <button onclick="selectAmbulanceFilter('${f}')"
        class="px-5 py-2 rounded-lg border text-sm font-semibold transition ${on ? "bg-red-700 border-red-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}">
        ${f}
      </button>`;
  }).join("");
}

function ambulanceRows(list) {
  if (!list.length) {
    return `<div class="text-center text-sm text-slate-500 py-10">No ambulances available for this type right now.</div>`;
  }
  return list.map(a => `
    <div onclick="openAmbulanceTracking('${a.id}')"
      class="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-5 py-3 flex flex-wrap sm:flex-nowrap items-center gap-4 cursor-pointer transition">
      <div class="w-12 text-center flex-shrink-0">
        <div class="text-2xl font-bold text-slate-900 leading-none">${a.minutes}</div>
        <div class="text-sm text-slate-500">min</div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-base font-semibold text-slate-900">${a.name}</h3>
          ${ambulanceBadge(a.tier)}
        </div>
        <p class="text-sm text-slate-500 mt-1">${a.type}, ${a.km} km away, ${a.rating} rating</p>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-base font-bold text-slate-900">${ambulanceMoney(a.fare)}</div>
        <div class="text-sm text-slate-500">estimated</div>
      </div>
      <button onclick="event.stopPropagation(); openAmbulanceTracking('${a.id}')"
        class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition flex-shrink-0">
        Call Now
      </button>
    </div>`).join("");
}

function ambulanceLivePositions(list) {
  return `
    <div class="relative" style="height:430px;">
      ${list.map(a => `
        <button onclick="openAmbulanceTracking('${a.id}')" title="${a.name}"
          class="absolute text-xl -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition"
          style="left:${a.pos.x}\%; top:${a.pos.y}%;">🚑</button>`).join("")}
      <div class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style="left:48%; top:46%;">
        <span class="w-5 h-5 rounded-full bg-blue-400 border-2 border-blue-200"></span>
        <span class="text-[11px] text-slate-700 mt-1">You</span>
      </div>
    </div>`;
}

function renderAmbulanceDirectoryView() {
  AMBULANCE_STATE.filter = "All";
  const list = ambulanceVisible();

  return `
    <div class="bg-white border-y border-slate-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900">Ambulance</h1>
          <p class="text-sm text-slate-500 mt-1">Find the ambulance according to your needs.</p>
        </div>
        <button onclick="connectAmbulanceSOS()"
          class="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition">
          Call for help now
        </button>
      </div>
    </div>

    <div class="bg-slate-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 mb-10">
        <div id="ambulance-filters" class="flex flex-wrap gap-3 mb-5">
          ${ambulanceFilterPills()}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 id="ambulance-count" class="text-base font-bold text-slate-900">${list.length} available now</h2>
            </div>
            <div id="ambulance-list" class="space-y-3">${ambulanceRows(list)}</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 class="text-base font-bold text-slate-900">Map, live positions</h2>
            <div id="ambulance-map-live">${ambulanceLivePositions(list)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.selectAmbulanceFilter = function (type) {
  AMBULANCE_STATE.filter = type;
  const list = ambulanceVisible();
  document.getElementById("ambulance-filters").innerHTML = ambulanceFilterPills();
  document.getElementById("ambulance-count").textContent = `${list.length} available now`;
  document.getElementById("ambulance-list").innerHTML = ambulanceRows(list);
  document.getElementById("ambulance-map-live").innerHTML = ambulanceLivePositions(list);
};

/* ============================================================
   TRACKING COMPONENTS & VIEWS
   ============================================================ */
function ambulanceBookingFor(a) {
  return {
    id: a.bookingId,
    step: 2,
    etaMinutes: a.minutes,
    distanceKm: a.km,
    driver: { name: a.driver.name, role: a.driver.role, rating: a.rating, phone: a.driver.phone },
    pickup: AMBULANCE_STATE.from || "Current location (GPS)",
    drop: AMBULANCE_STATE.to || "Nearest hospital",
    vehicle: a.vehicle,
    fare: a.fare,
  };
}

function ambulanceDriverCard(b) {
  const d = b.driver;
  return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        ${window.renderUserProfileIcon("w-11 h-11", "w-5 h-5")}
        <div>
          <div class="text-sm font-bold text-slate-900">${d.name}</div>
          <div class="text-[11px] text-slate-500">${d.role}</div>
          <div class="flex items-center gap-1 text-[11px] mt-0.5">
            <span class="text-amber-500 tracking-tight">★★★★★</span>
            <span class="text-slate-500">${d.rating}</span>
          </div>
        </div>
      </div>
      <div class="w-full sm:w-1/2 flex flex-col gap-2">
        <button onclick="callAmbulanceDriver()" class="w-full bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-2.5 rounded-md transition">Call driver</button>
        <button onclick="messageAmbulanceDriver()" class="w-full border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium py-2 rounded-md transition">Message</button>
      </div>
    </div>`;
}

function ambulanceSosCard() {
  return `
    <div class="bg-red-50 border border-red-300 rounded-xl p-3">
      <div class="text-xs font-bold text-red-700">Emergency SOS</div>
      <p class="text-[11px] text-slate-600 mt-0.5 mb-2.5">Connects you directly to Saino's emergency response line.</p>
      <button onclick="connectAmbulanceSOS()" class="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-md transition">Connect now</button>
    </div>`;
}

function ambulanceDetailsCard(b) {
  const rows = [["Pickup", b.pickup], ["Drop", b.drop], ["Vehicle", b.vehicle], ["Est. fare", ambulanceMoney(b.fare)]];
  return `
    <dl class="bg-white border border-slate-200 rounded-xl px-4 py-1 text-[11px] divide-y divide-slate-100">
      ${rows.map(([k, v]) => `
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-slate-400">${k}</dt>
          <dd class="font-medium text-slate-800 text-right">${v}</dd>
        </div>`).join("")}
    </dl>`;
}

function ambulanceTracker(step) {
  const last = AMBULANCE_STEPS.length - 1;
  const pct = Math.min(step, last) / last * 100;
  return `
    <div class="bg-white border border-slate-200 rounded-xl px-5 py-4">
      <div class="relative">
        <div class="absolute top-[5px] left-[12.5%] right-[12.5%] h-0.5 bg-slate-200">
          <div class="h-full bg-red-700 transition-all duration-500" style="width:${pct}%"></div>
        </div>
        <div class="relative grid grid-cols-4">
          ${AMBULANCE_STEPS.map((label, i) => {
            const done = i <= step;
            return `
              <div class="flex flex-col items-center text-center">
                <span class="w-3 h-3 rounded-full border-2 ${done ? "bg-red-700 border-red-700" : "bg-white border-slate-300"}"></span>
                <span class="mt-2 text-[10px] ${done ? "font-semibold text-slate-900" : "text-slate-400"}">${label}</span>
              </div>`;
          }).join("")}
        </div>
      </div>
    </div>`;
}

function ambulanceMap(b) {
  return `
    <div class="relative bg-cyan-50 border border-cyan-100 rounded-xl overflow-hidden" style="height:230px;">
      <div class="absolute top-3 left-3 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-3 z-10">
        <div>
          <div class="text-sm font-bold text-slate-900 leading-none">${b.etaMinutes} min</div>
          <div class="text-[9px] text-slate-400 mt-1">ETA</div>
        </div>
        <span class="w-px h-7 bg-slate-200"></span>
        <div>
          <div class="text-sm font-bold text-slate-900 leading-none">${b.distanceKm} km</div>
          <div class="text-[9px] text-slate-400 mt-1">away</div>
        </div>
      </div>
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 230" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 195 C 90 185, 100 100, 165 108 S 290 75, 370 62" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>
      </svg>
      <span class="absolute w-2.5 h-2.5 rounded-full bg-slate-900" style="left:7%; top:84%;"></span>
      <span class="absolute w-2.5 h-2.5 rounded-full bg-red-700" style="left:41%; top:46%;"></span>
      <span class="absolute w-3.5 h-3.5 rounded-full bg-red-700" style="left:91%; top:26%;"></span>
    </div>`;
}

function renderAmbulanceTrackingView(id) {
  const a = AMBULANCE_LIST.find(x => x.id === id) || AMBULANCE_LIST[0];
  const b = ambulanceBookingFor(a);
  AMBULANCE_STATE.active = b;

  return `
    <div class="bg-white border-y border-slate-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <button onclick="backToAmbulanceList()" class="text-xs font-semibold text-red-700 hover:underline mb-2">← Back to ambulances</button>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900">Ambulance</h1>
        <p class="text-sm text-slate-500 mt-1">${a.name}</p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 mb-16">
      <div class="space-y-4">
        ${ambulanceDriverCard(b)}
        ${ambulanceSosCard()}
        ${ambulanceDetailsCard(b)}
      </div>

      <div class="text-center mt-4">
        <button onclick="cancelAmbulanceBooking()" class="text-[11px] text-slate-500 underline hover:text-red-700">Cancel booking</button>
      </div>

      <div class="max-w-xl mx-auto mt-8">
        <div class="text-[10px] text-slate-400 mb-1">Booking #${b.id}</div>
        <h2 class="text-xl font-black text-slate-900">Your ambulance is on the way</h2>
        <p class="text-xs text-slate-500 mt-1 mb-4">Estimated arrival is based on live traffic and may update.</p>
        <div class="mb-4">${ambulanceTracker(b.step)}</div>
        ${ambulanceMap(b)}
      </div>
    </div>
  `;
}

window.openAmbulanceTracking = function (id) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content");
  if (!main) return;
  main.innerHTML = renderAmbulanceTrackingView(id);
  window.scrollTo({ top: 0, behavior: "instant" });
};

window.backToAmbulanceList = function () {
  renderApp();
  window.scrollTo({ top: 0, behavior: "instant" });
};

window.callAmbulanceDriver = function () {
  const b = AMBULANCE_STATE.active;
  if (b) window.location.href = `tel:${b.driver.phone}`;
};

window.messageAmbulanceDriver = function () {
  const b = AMBULANCE_STATE.active;
  if (b) window.open(`https://wa.me/${b.driver.phone.replace(/[^\d]/g, "")}`, "_blank");
};

window.connectAmbulanceSOS = function () {
  window.location.href = "tel:102";
};

window.cancelAmbulanceBooking = function () {
  const b = AMBULANCE_STATE.active;
  if (b && confirm("Cancel this ambulance booking?")) {
    alert(`Booking #${b.id} cancelled`);
    window.backToAmbulanceList();
  }
};