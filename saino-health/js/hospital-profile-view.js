/* ============================================================
   HOSPITAL DIRECTORY & PROFILE VIEW (CLEAN & ERROR-FREE)
   ============================================================ */

/* 1. Directory View (List Page): hospital / clinic / diagnostic / wellness / insurance
   Sab categories ke liye ek hi function. Left side filters category ke hisaab se badalte hain. */

/* ---------- Icons (inline SVG, kabhi change nahi hote) ---------- */
const DIRECTORY_ICON = (d, cls = "w-4 h-4") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${d}</svg>`;

const DIRECTORY_ICONS = {
  location: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  distance: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  speciality: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  services: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  availability: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  saino: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  rating: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/>',
  facilities: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  tests: '<path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V2"/><path d="M8.5 2h7"/>',
  fee: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>',
  plan: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
};

/* ---------- Category info ---------- */
const DIRECTORY_META = {
  hospital:   { title: "Hospitals",          plural: "Hospitals",          desc: "Find hospitals and healthcare facilities based on your needs.", fee: ["Consultation Fee"] },
  clinic:     { title: "Clinics",            plural: "Clinics",            desc: "Find verified clinics and specialist OPD consultations.",       fee: ["Consultation Fee"] },
  diagnostic: { title: "Diagnostic Centers", plural: "Diagnostic Centers", desc: "Find diagnostic labs, blood tests, and scans.",                fee: ["Tests and scan fees"] },
  wellness:   { title: "Wellness Centers",   plural: "Wellness Centers",   desc: "Find physiotherapy and wellness providers.",                    fee: ["Session fee"] },
  insurance:  { title: "Health Insurance",   plural: "Insurance Providers", desc: "Explore medical coverage and health insurance policies.",      fee: ["Premium"] },
};

/* ---------- Filters: option = [value, label, keywords?, "pass"?] ---------- */
const DIRECTORY_COMMON = {
  location: { id: "location", title: "Location", icon: "location", kind: "location",
    options: [["Delhi", "Delhi"], ["Mumbai", "Mumbai"], ["Goa", "Goa"], ["Bengaluru", "Bengaluru / Bangalore"]] },
  distance: { id: "distance", title: "Distance", icon: "distance", kind: "distance",
    options: [["2", "Within 2 km"], ["5", "Within 5 km"], ["8", "Within 8 km"], ["10", "Within 10 km"], ["15", "Within 15 km"]] },
  saino: { id: "saino", title: "SAINO Status", icon: "saino", kind: "saino",
    options: [["verified", "Verified Partner"], ["featured", "Featured"]] },
  rating: { id: "rating", title: "Rating", icon: "rating", kind: "rating",
    options: [["4", "4 Stars & Above"], ["3", "3 Stars & Above"]] },
};
const dirText = (id, title, icon, options) => ({ id, title, icon, kind: "text", options });
const C = DIRECTORY_COMMON;

const DIRECTORY_FILTERS = {
  hospital: [
    C.location, C.distance,
    dirText("speciality", "Speciality / Treatment", "speciality", [
      ["Cardiology", "Cardiology"], ["Neurology", "Neurology"], ["Orthopedics", "Orthopedics", ["orthopedic", "ortho"]],
      ["Pediatrics", "Pediatrics", ["pediatric", "paediatric"]], ["General Surgery", "General Surgery", ["surgery"]]]),
    dirText("services", "Services", "services", [
      ["Emergency", "Emergency Care", ["emergency"]], ["ICU", "ICU / NICU", ["icu", "nicu"]],
      ["Pharmacy", "24/7 Pharmacy", ["pharmacy"]], ["Laboratory", "Laboratory & Diagnostics", ["laborator", "diagnostic", "pathology"]]]),
    dirText("availability", "Availability", "availability", [
      ["24_7", "Open 24/7", ["24/7", "24x7", "24 hours"]], ["today", "Available Today", [], "pass"]]),
    C.saino, C.rating,
    dirText("insurance", "Insurance", "plan", [
      ["government", "Government Insurance / Health Scheme", ["government", "health scheme"]],
      ["private", "Private Insurance Accepted", ["private insurance", "insurance"]]]),
    dirText("facilities", "Facilities", "facilities", [
      ["parking", "Parking Available", ["parking"]], ["cafeteria", "Cafeteria", ["cafeteria", "canteen"]], ["atm", "ATM", ["atm"]]]),
    dirText("type", "Hospital Type", "facilities", [
      ["government", "Government / Public", ["government", "public"]], ["private", "Private", ["private"]],
      ["community", "Community / Trust", ["community", "trust"]]]),
  ],
  clinic: [
    C.location, C.distance,
    dirText("speciality", "Speciality", "speciality", [
      ["General Physician", "General Physician", ["general", "physician"]], ["Dental", "Dental", ["dental", "dentist"]],
      ["Dermatology", "Dermatology", ["dermat", "skin"]], ["Pediatrics", "Pediatrics", ["pediatric", "paediatric"]],
      ["Gynecology", "Gynecology", ["gynec", "gynaec"]], ["ENT", "ENT", ["ent", "ear nose"]], ["Eye", "Eye Care", ["eye", "ophthal"]]]),
    dirText("availability", "Availability", "availability", [
      ["open_now", "Open Now", [], "pass"], ["evening", "Evening OPD", ["evening", "pm"]], ["weekend", "Open on Weekends", ["sat", "sun", "weekend"]]]),
    dirText("fee", "Consultation Fee", "fee", [
      ["fee_low", "Under INR 500", ["under 500"]], ["fee_mid", "INR 500 – 1,000", ["500"]], ["fee_high", "Above INR 1,000", ["above 1000"]]]),
    C.saino, C.rating,
    dirText("insurance", "Insurance", "plan", [
      ["government", "Government Insurance / Health Scheme", ["government", "health scheme"]],
      ["private", "Private Insurance Accepted", ["private insurance", "insurance"]]]),
  ],
  diagnostic: [
    C.location, C.distance,
    dirText("tests", "Tests & Scans", "tests", [
      ["Blood", "Blood Tests / Pathology", ["blood", "pathology"]], ["X-Ray", "X-Ray", ["x-ray", "xray", "x ray"]],
      ["MRI", "MRI", ["mri"]], ["CT", "CT Scan", ["ct scan", "ct"]], ["Ultrasound", "Ultrasound", ["ultrasound", "usg"]], ["ECG", "ECG", ["ecg", "ekg"]]]),
    dirText("services", "Services", "services", [
      ["home_sample", "Home Sample Collection", ["home sample", "home collection"]], ["online_report", "Online Reports", ["online report", "report"]],
      ["packages", "Health Packages", ["package"]], ["24_7", "Open 24/7", ["24/7", "24x7", "24 hours"]]]),
    dirText("accreditation", "Accreditation", "saino", [
      ["nabl", "NABL Accredited", ["nabl"]], ["iso", "ISO Certified", ["iso"]]]),
    C.saino, C.rating,
  ],
  wellness: [
    C.location, C.distance,
    dirText("services", "Services", "services", [
      ["Yoga", "Yoga", ["yoga"]], ["Physio", "Physiotherapy", ["physio"]], ["Ayurveda", "Ayurveda", ["ayurved"]],
      ["Spa", "Spa & Massage", ["spa", "massage"]], ["Meditation", "Meditation", ["meditat"]], ["Nutrition", "Nutrition & Diet", ["nutrition", "diet"]]]),
    dirText("facilities", "Facilities", "facilities", [
      ["steam", "Steam / Sauna", ["steam", "sauna"]], ["parking", "Parking Available", ["parking"]], ["female", "Female-only Sessions", ["female", "women"]]]),
    dirText("availability", "Availability", "availability", [
      ["open_now", "Open Now", [], "pass"], ["weekend", "Open on Weekends", ["sat", "sun", "weekend"]]]),
    C.saino, C.rating,
  ],
  insurance: [
    C.location,
    dirText("plan", "Plan Type", "plan", [
      ["individual", "Individual", ["individual"]], ["family", "Family Floater", ["family"]],
      ["senior", "Senior Citizen", ["senior"]], ["critical", "Critical Illness", ["critical"]]]),
    dirText("coverage", "Coverage", "fee", [
      ["cov_5", "Up to Rs. 5 lakh", ["5 lakh", "500000"]], ["cov_10", "Rs. 5 – 10 lakh", ["10 lakh", "1000000"]], ["cov_high", "Above Rs. 10 lakh", ["above 10 lakh", "20 lakh", "25 lakh"]]]),
    dirText("features", "Features", "services", [
      ["cashless", "Cashless Hospitals", ["cashless"]], ["claim", "Claim Support", ["claim"]],
      ["maternity", "Maternity Cover", ["maternity"]], ["preexisting", "Pre-existing Disease Cover", ["pre-existing", "preexisting"]]]),
    C.saino, C.rating,
  ],
};

/* ---------- Helpers ---------- */
function directoryAllProviders() {
  return (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
}
function directoryFindProvider(id) {
  const key = String(id).toLowerCase();
  return directoryAllProviders().find(p => p && ((p.id && String(p.id).toLowerCase() === key) || (p.name && p.name.toLowerCase() === key)));
}
function directoryNorm(s) { return String(s || "").toLowerCase(); }

const DIRECTORY_BLOBS = new WeakMap();
function directoryBlob(p) {
  if (!DIRECTORY_BLOBS.has(p)) {
    let t = ""; try { t = JSON.stringify(p).toLowerCase(); } catch (e) {}
    DIRECTORY_BLOBS.set(p, t);
  }
  return DIRECTORY_BLOBS.get(p);
}
function directoryMatchesSearch(p, query = window.AppState?.searchQuery || '') {
  const terms = directoryNorm(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const blob = directoryBlob(p);
  return terms.every(term => blob.includes(term) || (['bengaluru', 'bangalore'].includes(term) && /bengaluru|bangalore/.test(blob)));
}
function directoryIsVerified(p) {
  const v = directoryNorm(p.verification);
  return !!(p.isVerified || p.is_verified || ["verified", "pro", "prime", "vip", "vvip"].includes(v));
}
function directoryIsFeatured(p) {
  const v = directoryNorm(p.verification);
  return !!(p.featured || v === "vip" || v === "vvip");
}
function directoryHaversine(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Asli distance (location + lat/lng se). Data na ho to null (fake 5km nahi dikhayenge)
function directoryDistanceKm(p) {
  const lat = parseFloat(p.lat ?? p.latitude), lng = parseFloat(p.lng ?? p.longitude);
  const o = window.USER_LOCATION;
  if (o && !isNaN(lat) && !isNaN(lng)) return directoryHaversine(o.lat, o.lng, lat, lng);
  const direct = parseFloat(String(p.distance ?? "").replace(/[^\d.]/g, ""));
  return isNaN(direct) ? null : direct;
}

function directoryMatchGroup(p, group, values) {
  if (!values.length) return true;                                 // is group mein kuch tick nahi = koi rok nahi
  switch (group.kind) {
    case "location": {
      const loc = directoryNorm([p.location, p.address, p.city].filter(Boolean).join(" "));
      return values.some(v => v === 'Bengaluru' ? /bengaluru|bangalore/.test(loc) : loc.includes(v.toLowerCase()));
    }
    case "distance": {
      const d = directoryDistanceKm(p);
      return d === null ? true : d <= Math.max(...values.map(Number));
    }
    case "rating": {
      const r = parseFloat(p.rating);
      return (isNaN(r) ? 0 : r) >= Math.min(...values.map(Number));
    }
    case "saino":
      return values.some(v => (v === "verified" ? directoryIsVerified(p) : directoryIsFeatured(p)));
    default: {
      const blob = directoryBlob(p);
      return values.some(v => {
        const opt = group.options.find(o => o[0] === v);
        if (opt && opt[3] === "pass") return true;                 // data nahi hai to rok nahi lagate
        const kws = (opt && opt[2] && opt[2].length) ? opt[2] : [(opt ? opt[1] : v).toLowerCase()];
        return kws.some(k => blob.includes(k.toLowerCase()));
      });
    }
  }
}

/* ---------- Sidebar + Card HTML ---------- */
function directorySidebarHTML(groups) {
  return groups.map(g => `
    <div class="border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <button type="button" onclick="toggleDirectoryFilter('${g.id}')"
        class="w-full flex items-center justify-between gap-2 py-1 text-sm font-semibold text-slate-900">
        <span class="flex items-center gap-2">
          <span class="text-slate-700 shrink-0">${DIRECTORY_ICON(DIRECTORY_ICONS[g.icon] || DIRECTORY_ICONS.services)}</span>
          <span>${g.title}</span>
        </span>
        <span id="directory-arrow-${g.id}" class="text-slate-500 transition-transform duration-200 shrink-0">${DIRECTORY_ICON(DIRECTORY_ICONS.chevron)}</span>
      </button>
      <div id="directory-options-${g.id}" class="hidden mt-3 space-y-2.5">
        ${g.options.map(o => `
          <label class="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" data-filter-group="${g.id}" value="${o[0]}" class="w-4 h-4 accent-red-700 rounded shrink-0">
            <span>${o[1]}</span>
          </label>`).join("")}
      </div>
    </div>`).join("");
}

const DIRECTORY_PILL = "bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold";

function directoryCardHTML(p, index, categoryType) {
  const meta = DIRECTORY_META[categoryType] || DIRECTORY_META.hospital;
  const id = p.id || p.name || "provider";
  const name = p.name || meta.title.slice(0, -1);
  const imgSrc = p.cover_image_url || p.image || p.logo_url || p.logo || "assets/logo.png";
  const rating = p.rating == null ? "No rating yet" : Number(p.rating).toFixed(1);
  const location = p.location || p.address || "Address not provided";
  const opd = p.opd || p.openingHours || "Mon–Sat, 9:30 AM – 6:00 PM";
  const phone = p.phone || "Phone not provided";
  const deps = Array.isArray(p.departments) ? p.departments : [];
  const fee = p.consultationFee || p.fee || "Fee not provided";
  const heart = (typeof savedHeartButton === "function")
    ? savedHeartButton(id)
    : "";
  const safeId = String(id).replace(/'/g, "\\'");

  return `
    <div data-directory-card data-provider-id="${id}" class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300">
      <div class="grid grid-cols-1 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)_13rem] gap-4">

        <!-- Image -->
        <button type="button" onclick="openProviderProfile('${safeId}')" aria-label="Open ${name}"
          class="block w-full h-48 md:h-56 lg:h-60 self-start rounded-xl overflow-hidden bg-slate-100">
          <img src="${imgSrc}" alt="${name}" class="w-full h-full object-cover">
        </button>

        <!-- Info -->
        <div class="min-w-0 border border-slate-200 rounded-2xl p-4 flex flex-col">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 class="text-xl lg:text-2xl font-bold text-slate-900 min-w-0">
              <button type="button" onclick="openProviderProfile('${safeId}')" class="text-left hover:text-red-700 transition">${name}</button>
            </h2>
            ${typeof window.renderSainoTierBadge === "function" ? window.renderSainoTierBadge(p, true) : ""}
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-2">
            <span class="flex items-center gap-1 text-amber-500 font-bold">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/></svg>
              ${rating}
            </span>
            <button type="button" onclick="openProviderReviews('${safeId}')" class="font-medium hover:text-red-700 hover:underline">Reviews</button>
            <button type="button" onclick="goToHospitalDiscussions('${safeId}')" class="flex items-center gap-1 font-medium hover:text-red-700 hover:underline">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.chat, "w-4 h-4 text-slate-500")}
              Discussions
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-sm mb-2 font-semibold">
            <span class="text-emerald-700 flex items-center gap-1">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.clock, "w-4 h-4 text-emerald-600")} ${opd}
            </span>
            ${categoryType === "hospital" && /emergency/i.test(String(p.facilities_info || "")) ? `
            <span class="flex items-center gap-1 text-red-700 font-bold">
              <svg class="w-5 h-5 text-red-600 -scale-x-100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8a2 2 0 0 1 2-2h8a1 1 0 0 1 1 1v1h2.4a2 2 0 0 1 1.7.95l2.1 3.4a2 2 0 0 1 .3 1.05V16a1 1 0 0 1-1 1h-.6a2.5 2.5 0 0 1-4.8 0H9.4a2.5 2.5 0 0 1-4.8 0H4a1 1 0 0 1-1-1V8Z"/>
                <circle cx="7" cy="17.5" r="1.5" fill="#fff"/><circle cx="17" cy="17.5" r="1.5" fill="#fff"/>
              </svg>
              24/7 Emergency
            </span>` : ""}
          </div>

          <div class="text-slate-600 text-sm mb-1 font-medium">
            ${location}<span data-distance-for="${id}" class="text-slate-500"></span>
          </div>
          <div class="text-slate-700 text-sm font-semibold mb-1">OPD: ${opd}</div>
          <div class="text-slate-800 text-sm font-bold mb-3">${phone}</div>

          <!-- Departments (pehle 3 aur baaki ke pills ek jaise) -->
          <div class="flex flex-wrap items-center gap-2 mt-auto">
            ${deps.slice(0, 3).map(d => `<span class="${DIRECTORY_PILL}">${d}</span>`).join("")}
            <div id="extra-deps-${index}" class="hidden flex-wrap gap-2">
              ${deps.slice(3).map(d => `<span class="${DIRECTORY_PILL}">${d}</span>`).join("")}
            </div>
            ${deps.length > 3 ? `
              <button type="button"
              onclick="
                const extra = document.getElementById('extra-deps-${index}');
                const expanded = extra.classList.toggle('hidden') === false;
                extra.classList.toggle('flex', expanded);
                this.textContent = expanded ? 'Show Less' : 'Show More (+${deps.length - 3})';
                this.setAttribute('aria-expanded', String(expanded));
              "
              id="more-btn-${index}"
              aria-expanded="false"
              class="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition">
              Show More (+${deps.length - 3})
            </button>` : ""}
          </div>
        </div>

        <!-- Actions -->
        <div class="md:col-span-2 lg:col-span-1 flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center lg:items-stretch justify-between">
          <div class="flex lg:flex-col items-center lg:items-stretch justify-between gap-3">
            <div class="flex items-center gap-3 text-slate-700 lg:justify-end lg:mb-4 order-2 lg:order-1">
              <button type="button" class="hover:text-red-700 transition" aria-label="Share">${DIRECTORY_ICON(DIRECTORY_ICONS.share, "w-5 h-5")}</button>
              ${heart}
            </div>
            <div class="order-1 lg:order-2">
              <div class="text-xs text-slate-500">${meta.fee[0]}</div>
              <div class="text-sm font-bold">${fee}</div>
            </div>
          </div>
          <div class="flex flex-col gap-3 sm:w-56 lg:w-full">
            <button type="button" onclick="openAppointmentBooking('${safeId}')"
              class="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-3 rounded-xl transition shadow-sm">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.calendar, "w-5 h-5")} Book appointment
            </button>
            <button type="button" onclick="openProviderProfile('${safeId}')"
              class="w-full border border-red-700 text-red-700 hover:bg-red-50 py-3 rounded-xl font-semibold text-sm transition">
              View Profile
            </button>
          </div>
        </div>

      </div>
    </div>`;
}

/* ---------- Page ---------- */
function renderHospitalDirectoryView(categoryType = "hospital") {
  categoryType = String(categoryType || "hospital").toLowerCase();
  if (!DIRECTORY_META[categoryType]) categoryType = "hospital";
  window.__directoryCategory = categoryType;

  const meta = DIRECTORY_META[categoryType];
  const groups = DIRECTORY_FILTERS[categoryType];
  
const list = directoryAllProviders().filter(
  p => p && directoryNorm(p.category) === categoryType && directoryMatchesSearch(p)
);

const directorySort = window.__directorySort || "recommended";

const reviewCount = p => Number(
  p.reviewsCount ?? p.reviews_count ?? p.review_count ?? 0
) || 0;

const rating = p => Number(p.rating) || 0;

if (directorySort === "rating") {
  list.sort((a, b) => rating(b) - rating(a) || reviewCount(b) - reviewCount(a));
} else if (directorySort === "reviews") {
  list.sort((a, b) => reviewCount(b) - reviewCount(a) || rating(b) - rating(a));
} else if (directorySort === "name") {
  list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

  setTimeout(() => {                                   // HTML page par lagne ke baad
    if (typeof directoryRefreshDistances === "function") directoryRefreshDistances();
    if (typeof directoryEnsureUserLocation === "function") directoryEnsureUserLocation();
  }, 0);

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      <!-- Header -->
      <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <button type="button" onclick="goBackToPreviousPage()"
            class="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline mb-2">
            ← Back to Marketplace
          </button>
          <h1 class="text-2xl sm:text-3xl font-black">${meta.title}</h1>
          <p class="text-slate-500 text-sm">${meta.desc}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="relative"><span class="sr-only">Search ${meta.plural}</span><i data-lucide="search" class="absolute left-3 top-2.5 h-4 w-4 text-slate-400"></i><input id="directorySearchInput" value="${escapeReviewHtml(AppState.searchQuery || '')}" oninput="directorySearch(this.value)" placeholder="Search ${meta.plural.toLowerCase()}" class="w-56 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"></label>
          <button type="button" onclick="clearAllFilters()" class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition">
  Clear Filters
</button>
        </div>
      </div>

      <!-- Quick category switcher: stay on directory page while changing category -->
      <div class="flex flex-wrap gap-2 mb-4" aria-label="Browse healthcare categories">
        <button type="button" onclick="navigateTo('hospital')" class="px-3 py-2 rounded-full border ${categoryType === 'hospital' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'} text-xs font-bold">Hospitals</button>
        <button type="button" onclick="navigateTo('clinic')" class="px-3 py-2 rounded-full border ${categoryType === 'clinic' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'} text-xs font-bold">Clinics</button>
        <button type="button" onclick="navigateTo('diagnostic')" class="px-3 py-2 rounded-full border ${categoryType === 'diagnostic' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'} text-xs font-bold">Diagnostics</button>
        <button type="button" onclick="navigateTo('bloodbank')" class="px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-bold">Blood Banks</button>
      </div>

      <!-- Mobile: filters button -->
      <button type="button" onclick="toggleDirectoryFilterPanel()"
        class="md:hidden w-full flex items-center justify-center gap-2 mb-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800">
        ${DIRECTORY_ICON(DIRECTORY_ICONS.filter)} Filters
      </button>

      <!-- Layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">

        <!-- Left Filter Sidebar -->
        <div class="col-span-1 md:col-span-4 lg:col-span-3">
          <div id="directory-filter-panel" data-category="${categoryType}" class="hidden md:block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:sticky md:top-24">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold">Filters</h3>
              <button type="button" onclick="clearAllFilters()" class="text-red-600 text-sm font-semibold hover:underline">Clear All</button>
            </div>
            <div class="space-y-4">
              ${directorySidebarHTML(groups)}
            </div>
            <div class="mt-5 pt-2">
              <button type="button" onclick="clearAllFilters()"
                class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition text-sm">
                ${DIRECTORY_ICON(DIRECTORY_ICONS.rotate)} Clear all filters
              </button>
            </div>
          </div>
        </div>

        <!-- Right Content List -->
        <div id="directory-results" class="col-span-1 md:col-span-8 lg:col-span-9 space-y-4 min-w-0">
                
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div id="directory-count" class="text-sm font-semibold text-slate-700">
            ${list.length} ${meta.plural} found
          </div>

          <label class="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Sort by
            <select
              onchange="changeDirectorySort(this.value)"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500">
              <option value="recommended" ${directorySort === "recommended" ? "selected" : ""}>Recommended</option>
              <option value="rating" ${directorySort === "rating" ? "selected" : ""}>Highest Rated</option>
              <option value="reviews" ${directorySort === "reviews" ? "selected" : ""}>Most Reviewed</option>
              <option value="name" ${directorySort === "name" ? "selected" : ""}>Name A–Z</option>
            </select>
          </label>
        </div>

          ${list.map((p, index) => directoryCardHTML(p, index, categoryType)).join("")}
          <div id="directory-empty" class="${list.length === 0 ? "" : "hidden "}bg-white border rounded-xl p-10 text-center text-slate-500 font-medium">
            No ${meta.plural.toLowerCase()} found.
          </div>
        </div>
      </div>
    </div>
  `;
}
 
window.changeDirectorySort = function(value) {
  const allowed = ["recommended", "rating", "reviews", "name"];

  window.__directorySort = allowed.includes(value)
    ? value
    : "recommended";

  if (typeof renderApp === "function") {
    renderApp();
  }
};

/* ============================================================
   PRACTO-STYLE DETAILED CLINIC & DOCTOR PROFILE ENGINE
   (Matches Uploaded Docx & Practo Screenshots 2, 4, 7, 8)
   ============================================================ */
function renderHospitalProfileView(providerId) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  
  // Resolve the requested provider from the live marketplace data
  const p = (typeof directoryFindProvider === "function" ? directoryFindProvider(providerId) : null) ||
    allProviders.find(x => x && (String(x.id).toLowerCase() === String(providerId).toLowerCase() || String(x.name).toLowerCase() === String(providerId).toLowerCase()));
  if (!p) return `<div class="mx-auto max-w-3xl p-10 text-center"><h1 class="text-xl font-bold">Provider profile unavailable</h1><p class="mt-2 text-sm text-slate-600">This listing is not currently published. Return to choose an available provider.</p><button onclick="goBackToPreviousPage()" class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Back</button></div>`;

  const name = p.name || "Healthcare Facility";
  const coverImg = p.cover_image_url || p.image || p.logo_url || p.logo || "assets/logo.png";
  const logoImg = p.logo_url || p.logo || "assets/logo.png";
  const locationText = p.address || p.location || "Address not provided";
  const ratingText = Number(p.rating || 0).toFixed(1);
  const reviewsCount = Number(p.reviewsCount || p.reviews_count || 0);
  const galleryImages = Array.isArray(p.photos) ? p.photos.filter(Boolean).slice(0, 5) : [];
  const isSolo = p.provider_type === "solo_doctor" || (p.doctors && p.doctors.length === 1);

  // Doctors list (Photo, Degrees, 15 yrs exp, ₹ Fees)
  const docs = Array.isArray(p.doctors) ? p.doctors : [];

  // Render Doctor Cards (Matches Practo Screenshot 7 & 8)
  const doctorsHtml = docs.map(d => `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-4">
      <div class="flex items-start gap-4 text-left">
        <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img src="${d.avatar_url || 'assets/logo.png'}" alt="${d.name}" class="w-full h-full object-cover">
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-base text-slate-900">${d.name || 'Doctor'}</h3>
            <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">✓ Medical Reg. Verified</span>
          </div>
          <p class="text-xs text-slate-600 font-medium mt-0.5">${d.qualification || 'Qualification not provided'} • <span class="text-slate-900 font-bold">${d.department || 'Speciality not provided'}</span></p>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
            <span class="font-bold text-slate-700">${d.experience_years == null ? 'Experience not provided' : `${d.experience_years} Years Experience`}</span>
            <span>•</span>
            <span class="text-emerald-700 font-bold">👍 ${d.stories_pct == null ? '' : `${d.stories_pct}%`}${d.stories_count == null ? '' : ` (${d.stories_count} Patient Stories)`}</span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            <span>🕒 Timings: <strong>${d.shift_timings || 'Timings not provided'}</strong></span>
          </div>
        </div>
      </div>

      <div class="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
        <div class="text-left md:text-right">
          <div class="text-xl font-black text-slate-900">₹${d.opd_fee == null ? 'Fee not provided' : Number(d.opd_fee).toLocaleString('en-IN')}</div>
          <div class="text-[10px] text-slate-400 font-semibold">Consultation Fee</div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button onclick="openVideoConsultBooking('${p.id}', '${d.name || ''}', '${d.department || ''}', '${d.opd_fee ?? ''}', '${d.id || ''}')" class="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition">
            📹 Video Consult
          </button>
          <button onclick="if(typeof openAppointmentBooking==='function'){openAppointmentBooking('${p.id}', '${String(d.name || '').replace(/'/g, '\\&#39;')}', '${String(d.department || '').replace(/'/g, '\\&#39;')}', '${d.fee ?? d.opd_fee ?? ''}', '${d.id || ''}');}" class="px-5 py-2.5 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold rounded-xl text-xs shadow-md transition">
            ⚡ Book Clinic Visit
          </button>
        </div>
      </div>
    </div>
  `).join("");
  const careTeam = Array.isArray(p.careTeam) ? p.careTeam : [];
  const careTeamHtml = careTeam.length ? `<section><h2 class="text-sm font-extrabold text-slate-900 mb-3">Nursing Team</h2><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${careTeam.map(member => `<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><img src="${escapeReviewHtml(member.avatar_url || 'assets/logo.png')}" alt="${escapeReviewHtml(member.name)}" class="h-12 w-12 rounded-full border object-cover"><div><strong class="block text-xs text-slate-900">${escapeReviewHtml(member.name)}</strong><span class="text-[11px] text-slate-500">${escapeReviewHtml(member.role || 'Nurse')}</span></div></div>`).join('')}</div></section>` : '';

  return `
    <div class="bg-slate-50 min-h-screen pb-16 text-slate-900">
      
      <!-- Back Button & Breadcrumbs -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div class="flex items-center justify-between mb-3 text-xs">
          <button onclick="if(typeof returnToProviderSource==='function'){returnToProviderSource();}else{navigateTo('marketplace');}" class="text-slate-600 hover:text-[#ad0b0e] font-bold flex items-center gap-1 transition">
            <span>← Back to previous page</span>
          </button>
          <span class="text-slate-400">Home › Healthcare Providers › <strong class="text-slate-800">${name}</strong></span>
         </div>   
          <div class="relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl overflow-hidden bg-slate-900 shadow-md">

            <div class="absolute inset-0">
              <img
                src="${coverImg}"
                alt="${name} Cover"
                class="w-full h-full object-cover object-center"
                style="object-position: center 35%;"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            </div>
          <div class="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 h-full pt-16">
            <div class="flex items-center gap-4 text-left">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                <img src="${logoImg}" alt="${name}" class="w-full h-full object-cover">
              </div>
              <div class="text-white">
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-white">${name}</h1>
                  <span class="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">✓ Verified</span>
                </div>
                <p class="text-xs text-slate-200 mt-1 flex items-center gap-1">
                  <span>📍</span> ${locationText}
                </p>
                <div class="flex items-center gap-3 text-xs mt-1.5 text-amber-300 font-bold">
                  <span>★ ${ratingText} (${reviewsCount} reviews)</span>
                  <span class="text-slate-300 font-normal">• 🕒 ${p.openingHours || 'Opening hours not provided'}</span>
                </div>
              </div>
            </div>

            <!-- Direction & QR Standee Buttons -->
            <div class="flex items-center gap-2">
              <button onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(name + ' ' + locationText)}', '_blank')" class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl text-xs font-bold transition">
                📍 Get Directions
              </button>
              
            <button
              type="button"
              onclick="window.openProviderQrPopup('${p.id}')"
              class="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 transition">
              📱 Reception QR
            </button>

            </div>
          </div>
        </div>
         
<div class="flex flex-wrap items-center gap-6 border-b border-slate-200 mt-6 pb-3 text-xs font-bold text-slate-600">
  <button type="button"
    onclick="document.getElementById('profileOverviewSec')?.scrollIntoView({behavior:'smooth', block:'start'})"
    class="text-[#ad0b0e] border-b-2 border-[#ad0b0e] pb-3 -mb-3 font-extrabold">
    Overview
  </button>

  <button type="button"
    onclick="document.getElementById('profileDoctorsSec')?.scrollIntoView({behavior:'smooth', block:'start'})"
    class="hover:text-red-700 transition">
    Doctors (${docs.length})
  </button>

  <button type="button"
    onclick="window.openProviderReviews?.('${p.id}')"
    class="hover:text-red-700 transition">
    Patient Stories &amp; Reviews
  </button>
</div>
        <!-- 3. MAIN SECTION: CLINIC DETAILS + DOCTORS -->
        
<div id="profileOverviewSec" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 scroll-mt-24">

          <!-- Left: About & Doctors -->
          <div class="lg:col-span-2 space-y-6 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 class="font-extrabold text-sm text-slate-900 mb-2">About ${name}</h2>
              <p class="text-xs text-slate-600 leading-relaxed">${p.about || p.description || 'Provider has not added an about description yet.'}</p>
            </div>

            ${galleryImages.length ? `<section><h2 class="text-sm font-extrabold text-slate-900 mb-3">Facility Photos</h2><div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${galleryImages.map((image, index) => `<img src="${escapeReviewHtml(image)}" alt="${escapeReviewHtml(name)} photo ${index + 1}" loading="lazy" class="h-32 w-full rounded-xl border border-slate-200 object-cover">`).join('')}</div></section>` : ''}

            ${careTeamHtml}
            <div id="profileDoctorsSec" class="scroll-mt-24">
              <h2 class="text-base font-extrabold text-slate-900 mb-1">
                ${isSolo ? 'Consulting Specialist' : 'Doctors & Specialists Available'}
              </h2>
              <p class="text-xs text-slate-500 mb-4">Select doctor to book confirmed in-person OPD token or video consultation.</p>
              ${doctorsHtml || '<div class="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-500">No doctor profiles are published yet.</div>'}
            </div>
          </div>

          <!-- Right: Timings & Helpline -->
          <div class="space-y-4 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-500">Facility Information</h3>
              <div>
                <div class="text-xs font-bold text-slate-900">OPD Timings</div>
                <div class="text-xs text-slate-600 mt-0.5">${p.openingHours || 'Opening hours not provided'}</div>
                <div class="text-xs text-slate-400">${p.facilities_info || 'Facility information not provided'}</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-slate-900">Helpline Phone</div>
                <div class="text-xs text-slate-600 mt-0.5">${p.phone || 'Phone not provided'}</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-emerald-700">Queue status</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Queue updates will appear here when the provider shares live queue information.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}
/* 3. Global Click Handlers */
window.renderHospitalDirectoryView = renderHospitalDirectoryView;
window.renderHospitalProfileView = renderHospitalProfileView;

window.openProviderProfile = function(providerId) {
  const provider = directoryFindProvider(providerId);
  if (!provider) return;
  if (typeof window.captureProviderReturnView === "function") window.captureProviderReturnView();
  window.AppState.activeProvider = provider;
  if (typeof window.navigateTo === "function") {
    window.navigateTo("provider-profile", { providerId: provider.id || providerId });
    return;
  }
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) main.innerHTML = renderHospitalProfileView(provider.id || providerId);
};
window.openHospitalProfile = window.openProviderProfile;
window.openClinicProfile = window.openProviderProfile;
window.openDiagnosticProfile = window.openProviderProfile;
window.openWellnessProfile = window.openProviderProfile;
window.openInsuranceProfile = window.openHospitalProfile;

// Reviews par click: profile khulta hai aur seedha Reviews section par scroll hota hai
window.openProviderReviews = function(providerId) {
  const hasReturnView = typeof window.captureProviderReturnView === "function" && window.captureProviderReturnView();
  window.openProviderProfile(providerId);
  setTimeout(function() {
    const el = document.getElementById("profile-reviews");
    if (!el) return;
    if (hasReturnView && typeof window.returnToProviderSource === "function" && !el.querySelector("[data-review-return]")) {
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.setAttribute("data-review-return", "true");
      backButton.className = "mb-4 text-sm font-semibold text-slate-600 hover:text-red-700";
      backButton.textContent = "← Back to previous page";
      backButton.addEventListener("click", window.returnToProviderSource);
      el.insertBefore(backButton, el.firstChild);
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
};


window.renderClinicDirectoryView = () => renderHospitalDirectoryView('clinic');
window.renderDiagnosticDirectoryView = () => renderHospitalDirectoryView('diagnostic');
window.renderWellnessDirectoryView = () => renderHospitalDirectoryView('wellness');
window.renderInsuranceDirectoryView = () => renderHospitalDirectoryView('insurance');

window.openCategoryPage = function(categoryName) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalDirectoryView(categoryName);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
};

window.backToHospitalList = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalDirectoryView(window.__directoryCategory || "hospital");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
};

window.toggleDepartments = function(index) {
  const extraDeps = document.getElementById(`extra-deps-${index}`);
  const moreBtn = document.getElementById(`more-btn-${index}`);
  if (!extraDeps || !moreBtn) return;

  const isHidden = extraDeps.classList.toggle('hidden');
  extraDeps.classList.toggle('flex', !isHidden);

  moreBtn.textContent = isHidden ? `+${extraDeps.children.length}` : 'Show less';
};
/* ============================================================
   HOSPITAL APPOINTMENT BOOKING VIEW (FULLY DYNAMIC & REACTIVE)
   ============================================================ */

window.BOOKING_STATE = {
  bookingType: "appointment",
  hospitalName: "",
  doctorName: "",
  doctorRole: "",
  doctorId: "",
  date: "",
  timeSlot: "",
  fee: 0,
  consultationType: "in_person"
};

window.renderAppointmentBookingView = function() {
  const patientProfile = window.getSainoPatientSession?.().profile || {};
  const escapeField = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const currentProviderName = window.BOOKING_STATE.hospitalName || "Selected Facility";
  const currentDoc = window.BOOKING_STATE.doctorName;
  const currentDay = window.BOOKING_STATE.selectedDay;
  const currentSlot = window.BOOKING_STATE.timeSlot;
  const isDiagnosticPackage = window.BOOKING_STATE.bookingType === "diagnostic-package";
  const providers = (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const provider = providers.find(item =>
    String(item.id) === String(window.BOOKING_STATE.providerId) ||
    String(item.name) === String(window.BOOKING_STATE.hospitalName)
  );
  const doctorOptions = (provider && Array.isArray(provider.doctors) ? provider.doctors : [])
    .map(doctor => typeof doctor === "string" ? null : ({
      ...doctor,
      role: doctor.department || doctor.specialization || doctor.role || "",
      fee: doctor.fee ?? doctor.opd_fee ?? doctor.consultation_fee ?? ""
    }))
    .filter(doctor => doctor && doctor.name);
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const safeBookingValue = value => String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " ");

  return `
    <div id="appointment-booking-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Top Breadcrumb & Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav class="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
            <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
            <span>›</span>
            <span class="text-red-700 font-semibold">${isDiagnosticPackage ? "Book Diagnostic Package" : "Book Appointment"}</span>
          </nav>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-black text-sm">
                ${currentProviderName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl font-bold text-slate-900 leading-tight">${currentProviderName}</h1>
                  <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Saino Verified
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">${window.BOOKING_STATE.location || "Kathmandu"}</p>
              </div>
            </div>

            <button type="button" onclick="returnToProviderSource()" class="text-xs font-semibold text-slate-600 hover:text-red-700 flex items-center gap-1">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Main Booking Layout -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT COLUMN -->
          <div class="lg:col-span-8 space-y-6">

            <!-- 1. Choose an Available Doctor -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 class="text-sm font-bold text-slate-900 mb-4">${isDiagnosticPackage ? "1. Selected Diagnostic Package" : "1. Choose an Available Doctor"}</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" style="display:${isDiagnosticPackage ? "none" : "grid"}">
                ${doctorOptions.map(doctor => {
                  const selected = doctor.name === currentDoc;
                  const safeName = safeBookingValue(doctor.name);
                  const safeRole = safeBookingValue(doctor.role || "Consultant");
                  return `
                    <button type="button"
                            data-booking-doctor
                            data-doctor="${safeBookingValue(doctor.name)}"
                            data-doctor-id="${safeBookingValue(doctor.id || '')}"
                            aria-pressed="${selected}"
                            onclick="selectBookingDoctor('${safeName}', '${safeRole}', '${safeBookingValue(doctor.id || '')}', '${safeBookingValue(doctor.fee)}')"
                            class="w-full text-left cursor-pointer rounded-2xl p-4 relative transition ${selected ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                      <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
                          <div>
                            <h3 class="text-xs font-bold text-slate-900">${doctor.name}</h3>
                            <p class="text-[11px] text-slate-500">${doctor.role || "Consultant"}</p>
                          </div>
                        </div>
                        <span data-doctor-radio class="w-4 h-4 rounded-full border-2 ${selected ? 'border-red-700' : 'border-slate-300'} flex items-center justify-center">
                          <span class="w-2 h-2 rounded-full bg-red-700 ${selected ? '' : 'hidden'}"></span>
                        </span>
                      </div>
                      ${doctor.experience_years != null ? `<p class="mt-3 text-[11px] text-slate-500">Experience: <strong class="text-slate-700">${doctor.experience_years} years</strong></p>` : ""}
                      <p class="mt-2 text-[11px] text-slate-600">Consultation fee: <strong>${doctor.fee === '' ? 'Not provided' : '₹' + Number(doctor.fee).toLocaleString('en-IN')}</strong></p>
                    </button>
                  `;
                }).join("")}
              </div>
              ${doctorOptions.length ? '' : '<p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">This provider has no approved doctor profiles available for booking yet.</p>'}
              ${isDiagnosticPackage ? `
                <div class="rounded-xl border border-red-100 bg-red-50/60 p-4">
                  <h3 class="text-sm font-bold text-slate-900">${window.BOOKING_STATE.packageTitle}</h3>
                  <p class="text-xs text-slate-600 mt-1">${window.BOOKING_STATE.packageTests}</p>
                  <p class="text-xs font-bold text-red-700 mt-2">${window.BOOKING_STATE.fee}</p>
                  <p class="text-[11px] text-slate-500 mt-1">Partner: ${currentProviderName}</p>
                </div>
              ` : ""}
            </div>

            <!-- 2. Select appointment date -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 class="text-sm font-bold text-slate-900 mb-4">2. Select appointment date</h2>
              <input id="bookingDate" type="date" min="${minDate}" value="${currentDay || ''}" onchange="selectBookingDate(this.value)" class="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-3 text-sm">
            </div>

            <!-- 3. Choose a Time Slot -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">3. Choose a Time Slot</h2>
              
              <label for="bookingTime" class="text-[11px] font-semibold text-slate-500">Choose a time</label>
              <input id="bookingTime" type="time" value="${currentSlot || ''}" onchange="selectBookingSlot(this.value)" class="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-3 text-sm">
            </div>

            <!-- 4. Enter Patient Information -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">4. Enter Patient Information</h2>
              <div>
                <label for="bookingConsultationType" class="block text-xs font-semibold text-slate-700 mb-1.5">Consultation type</label>
                <select id="bookingConsultationType" onchange="window.BOOKING_STATE.consultationType=this.value" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
                  <option value="in_person" ${window.BOOKING_STATE.consultationType === 'video' ? '' : 'selected'}>Clinic visit</option>
                  <option value="video" ${window.BOOKING_STATE.consultationType === 'video' ? 'selected' : ''}>Video consult request</option>
                </select>
                <p class="mt-1 text-[10px] text-slate-500">Video requests are recorded for the provider. Live video calling is not configured.</p>
              </div>
              
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Patient's Full Name</label>
                <input type="text" id="patientName" value="${escapeField(patientProfile.name)}" placeholder="e.g. John Doe" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input type="tel" id="patientPhone" value="${escapeField(patientProfile.phone)}" placeholder="e.g. +91 98XXXXXXXX" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" id="patientEmail" value="${escapeField(patientProfile.email)}" placeholder="e.g. email@example.com" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">${isDiagnosticPackage ? "Package notes (optional)" : "Reason for Appointment / Symptoms"}</label>
                <textarea id="patientSymptoms" rows="3" placeholder="Explain symptoms briefly here..." class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition"></textarea>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="consentBox" checked class="w-4 h-4 accent-red-700 rounded cursor-pointer">
                <label for="consentBox" class="text-[11px] text-slate-600 cursor-pointer">
                  I consent to sharing these details with ${currentProviderName} for ${isDiagnosticPackage ? "package booking" : "clinical review"}.
                </label>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Sticky Booking Summary -->
          <div class="lg:col-span-4 sticky top-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 class="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">${isDiagnosticPackage ? "Package Booking Summary" : "Booking Summary"}</h3>
              
              <dl class="text-xs space-y-3 py-4 border-b border-slate-100">
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">${isDiagnosticPackage ? "Partner" : "Hospital"}</dt>
                  <dd id="summaryHospital" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.hospitalName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">${isDiagnosticPackage ? "Package" : "Doctor"}</dt>
                  <dd id="summaryDoctor" class="font-bold text-slate-800 text-right">${isDiagnosticPackage ? window.BOOKING_STATE.packageTitle : window.BOOKING_STATE.doctorName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Date</dt>
                  <dd id="summaryDate" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.date}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Time Slot</dt>
                  <dd id="summaryTime" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.timeSlot}</dd>
                </div>
              </dl>

              <div class="flex justify-between items-center py-4">
                <span class="text-xs font-semibold text-slate-600">${isDiagnosticPackage ? "Package Price" : "Consultation Fee"}</span>
                <span id="summaryFee" class="text-base font-black text-red-700">₹${Number(window.BOOKING_STATE.fee || 0).toLocaleString('en-IN')}</span>
              </div>

             <button type="button" onclick="confirmAppointment()" class="w-full bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-xs">
                Proceed to Payment →
              </button>

              <p class="text-[10px] text-slate-500 text-center mt-3">
                ${isDiagnosticPackage ? "Package payment is handled by the diagnostic partner." : "Online payment to SAINO is required to confirm this appointment. A request and queue token are saved if payment setup is unavailable."}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
};

/* ============================================================
   INTERACTIVE JS EVENT HANDLERS (LIVE DOM UPDATES)
   ============================================================ */

// 1. Doctor Selection Logic
window.selectBookingDoctor = function(doctorName, doctorRole, doctorId, fee) {
  window.BOOKING_STATE.doctorName = doctorName;
  window.BOOKING_STATE.doctorRole = doctorRole;
  window.BOOKING_STATE.doctorId = doctorId || '';
  window.BOOKING_STATE.fee = fee === '' ? 0 : Number(fee) || 0;

  const summaryDoc = document.getElementById("summaryDoctor");
  if (summaryDoc) summaryDoc.textContent = doctorName;
  const summaryFee = document.getElementById('summaryFee');
  if (summaryFee) summaryFee.textContent = `₹${Number(window.BOOKING_STATE.fee || 0).toLocaleString('en-IN')}`;

  document.querySelectorAll("[data-booking-doctor]").forEach(card => {
    const selected = card.getAttribute("data-doctor") === doctorName;
    card.setAttribute("aria-pressed", String(selected));
    card.className = `w-full text-left cursor-pointer rounded-2xl p-4 relative transition ${selected ? "border-2 border-red-600 bg-red-50/20" : "border border-slate-200 bg-white hover:border-slate-300"}`;
    const radio = card.querySelector("[data-doctor-radio]");
    if (radio) {
      radio.className = `w-4 h-4 rounded-full border-2 ${selected ? "border-red-700" : "border-slate-300"} flex items-center justify-center`;
      const dot = radio.querySelector("span");
      if (dot) dot.classList.toggle("hidden", !selected);
    }
  });
};

// 2. Date Selection Logic
window.selectBookingDate = function(isoDate) {
  window.BOOKING_STATE.date = isoDate;

  // Update Summary
  const summaryDate = document.getElementById("summaryDate");
  if (summaryDate) summaryDate.textContent = window.BOOKING_STATE.date;

  // Update Calendar Active Button
  const allDays = document.querySelectorAll(".cal-day-btn");
  allDays.forEach(btn => {
    const d = parseInt(btn.getAttribute("data-day"));
    if (d === dayNumber) {
      btn.className = "cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition bg-[#991b1b] text-white font-bold shadow-xs";
    } else {
      btn.className = "cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition hover:bg-slate-100 text-slate-700";
    }
  });
};

// 3. Time Slot Selection Logic
window.selectBookingSlot = function(timeString) {
  window.BOOKING_STATE.timeSlot = timeString;

  // Update Summary
  const summaryTime = document.getElementById("summaryTime");
  if (summaryTime) summaryTime.textContent = timeString;

  // Update Slot Buttons
  const allSlots = document.querySelectorAll(".slot-btn");
  allSlots.forEach(btn => {
    const t = btn.getAttribute("data-slot");
    if (t === timeString) {
      btn.className = "slot-btn px-4 py-2 rounded-xl text-xs transition bg-[#991b1b] text-white font-semibold shadow-xs";
    } else {
      btn.className = "slot-btn px-4 py-2 rounded-xl text-xs transition border border-slate-200 text-slate-700 hover:border-slate-400";
    }
  });
};

window.openAppointmentBooking = function(providerId, doctorName, doctorRole, doctorFee, doctorId) {
  // A new booking must not accidentally retry payment for an earlier request.
  window.__SAINO_PENDING_PATIENT_PAYMENT = null;
  const isDiagnosticPackage = window.BOOKING_STATE.bookingType === "diagnostic-package" && doctorRole === "Diagnostic Package";
  if (!isDiagnosticPackage) {
    window.BOOKING_STATE.bookingType = "appointment";
    delete window.BOOKING_STATE.packageTitle;
    delete window.BOOKING_STATE.packageTests;
    window.BOOKING_STATE.doctorName = "";
    window.BOOKING_STATE.doctorRole = "";
    window.BOOKING_STATE.doctorId = "";
    window.BOOKING_STATE.fee = 0;
  }
  if (typeof window.captureProviderReturnView === "function") window.captureProviderReturnView();
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  
  // Clicked facility find karein (Clinic, Hospital, Diagnostic)
  const p = providerId ? allProviders.find(item =>
    item && (
      (item.id && String(item.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase().includes(String(providerId).toLowerCase()))
    )
  ) : null;

  if (p) {
    window.BOOKING_STATE.providerId = p.id;
    window.BOOKING_STATE.hospitalName = p.name;
    window.BOOKING_STATE.location = p.location || p.address || "Kathmandu";
    const firstDoctor = (p.doctors || []).find(d => d && typeof d === 'object' && d.id);
    if (firstDoctor) {
      window.BOOKING_STATE.doctorName = firstDoctor.name || '';
      window.BOOKING_STATE.doctorRole = firstDoctor.department || firstDoctor.specialization || '';
      window.BOOKING_STATE.doctorId = String(firstDoctor.id);
      window.BOOKING_STATE.fee = Number(firstDoctor.fee ?? firstDoctor.opd_fee ?? 0);
    }
  } else if (providerId) {
    window.BOOKING_STATE.providerId = providerId;
    window.BOOKING_STATE.hospitalName = providerId;
  }
  const deepLink = new URLSearchParams(window.location.search);
  if (deepLink.get('source') === 'qr' && String(deepLink.get('providerId')) === String(window.BOOKING_STATE.providerId)) {
    window.BOOKING_STATE.source = 'qr';
    window.BOOKING_STATE.qrCode = deepLink.get('qr') || '';
  }

  if (doctorName) {                       // profile par kisi doctor ke "Book" se aaye ho
    window.BOOKING_STATE.doctorName = doctorName;
    if (doctorRole) window.BOOKING_STATE.doctorRole = doctorRole;
    if (doctorFee !== undefined && doctorFee !== '') window.BOOKING_STATE.fee = Number(doctorFee) || 0;
    const selectedDoctor = (p?.doctors || []).find(d => d && (doctorId ? String(d.id) === String(doctorId) : d.name === doctorName));
    if (selectedDoctor) window.BOOKING_STATE.doctorId = String(selectedDoctor.id || '');
  }

  // Modal ko band karein agar khula ho
  if (typeof closeModal === 'function') closeModal();

  if (typeof navigateTo === "function") {
    navigateTo("appointment-booking", {
      providerId: window.BOOKING_STATE.providerId,
      doctorName: window.BOOKING_STATE.doctorName
    });
  }
};

window.openVideoConsultBooking = function(providerId, doctorName, doctorRole, doctorFee, doctorId) {
  window.openAppointmentBooking(providerId, doctorName, doctorRole, doctorFee, doctorId);
  setTimeout(() => {
    const type = document.getElementById('bookingConsultationType');
    if (type) type.value = 'video';
  }, 0);
};

window.renderAppointmentSuccessView = function(patientData) {
  const patient = patientData || {};
  const bp = window.BOOKING_STATE || {};

  // 1. Generate Unique SAINO Booking ID (e.g. SAINO-2026-89412)
  const sainoBookingId = bp.sainoBookingId || ("SAINO-2026-" + Math.floor(10000 + Math.random() * 90000));
  
  // 2. Generate Live Queue Token & Room (Matches Docx: A-Citycare 21 token / Room 301)
  const tokenPrefix = (bp.hospitalName || "CityCare").substring(0, 8).replace(/\s+/g, '');
  const tokenNum = Math.floor(18 + Math.random() * 8);
  const queueToken = bp.queueToken || `A-${tokenPrefix}-${tokenNum}`;
  const nowServingToken = `A-${tokenPrefix}-${Math.max(1, tokenNum - 2)}`;
  const doctorRoom = bp.room || "Room 301";
  const estWaitTime = "12 Minutes";
  const doctorName = bp.doctorName || "Dr. Aayush Sharma";
  const hospitalName = bp.hospitalName || "CityCare Multispeciality Hospital";
  const consultationFee = bp.fee || "₹500";

  return `
    <div id="booking-confirmation-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24 text-left">
      
      <!-- Breadcrumb Navigation -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-3">
        <nav class="flex items-center gap-2 text-xs text-slate-400">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-700">Home</button>
          <span>›</span>
          <span class="text-[#ad0b0e] font-bold">Booking Confirmed &amp; Live Boarding Pass</span>
        </nav>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- ================= 1. AIRPORT-STYLE DIGITAL BOARDING PASS WIDGET ================= -->
        <div class="rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative">
          
          <!-- Boarding Pass Header Ribbon -->
          <div class="p-5 sm:p-6 bg-gradient-to-r from-[#ad0b0e] via-[#8f080b] to-[#730608] flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img src="assets/logo.png" alt="SAINO" class="w-full h-full object-contain" onerror="this.src='../assets/logo.png'">
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-rose-200">SAINO HEALTH • LIVE BOARDING PASS</span>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight">${hospitalName}</h2>
              </div>
            </div>
            
            <div class="text-right">
              <span class="text-[10px] text-rose-200 uppercase font-bold tracking-wider block">UNIQUE BOOKING ID</span>
              <strong class="text-sm sm:text-base font-mono font-black text-white bg-black/30 px-3 py-1 rounded-lg border border-white/20 inline-block mt-0.5">
                ${sainoBookingId}
              </strong>
            </div>
          </div>

          <!-- Boarding Pass Main Body (Live Token & Queue Telemetry) -->
          <div class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <!-- Left Col: Giant Token Display -->
            <div class="md:col-span-5 bg-white/5 rounded-2xl p-5 border border-white/10 text-center space-y-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">YOUR QUEUE TOKEN</span>
              <div class="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight text-emerald-400 drop-shadow">
                ${queueToken}
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active in Queue</span>
              </div>
            </div>

            <!-- Right Col: Airport Flight-Style Telemetry Grid -->
            <div class="md:col-span-7 grid grid-cols-2 gap-4 text-left">
              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Now Serving Token</span>
                <strong class="text-base sm:text-lg font-bold text-amber-300 font-mono">${nowServingToken}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">2 Patients Ahead</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Doctor Room / Chamber</span>
                <strong class="text-base sm:text-lg font-bold text-white">${doctorRoom}</strong>
                <span class="text-[10px] text-emerald-400 block mt-0.5">Ground Floor Hall</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Consulting Doctor</span>
                <strong class="text-xs sm:text-sm font-bold text-white block truncate">${doctorName}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">Consultant Physician</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Estimated Wait Time</span>
                <strong class="text-base sm:text-lg font-bold text-sky-300">${estWaitTime}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">Auto-updates on call</span>
              </div>
            </div>

          </div>

          <!-- Boarding Pass Tear Line -->
          <div class="relative border-t-2 border-dashed border-slate-700/80 my-1">
            <div class="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#f8fafc]"></div>
            <div class="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#f8fafc]"></div>
          </div>

          <!-- Boarding Pass Footer (Passenger Info & Quick Actions) -->
          <div class="p-5 sm:p-6 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
              <strong class="text-white text-sm">${patient.name || "Patient User"}</strong>
              <span class="text-[11px] text-slate-400 ml-2">(${patient.phone || "+91 98XXXXXXXX"})</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold text-xs">
                Fees: ${consultationFee}
              </span>
              <button onclick="window.print()" class="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition shadow-md">
                🖨 Print Pass
              </button>
            </div>
          </div>

        </div>

        <!-- ================= 2. JOURNEY STATUS & AUTOMATED NOTIFICATIONS ================= -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 class="font-extrabold text-sm text-slate-900">Patient Consultation Journey Tracker</h3>
          
          <!-- Step Progress -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span class="text-[10px] font-bold text-emerald-800 uppercase block">Step 1: Confirmed</span>
              <strong class="text-emerald-900">Token Generated</strong>
              <span class="text-[10px] text-emerald-700 block mt-0.5">✓ SAINO Booking ID Ready</span>
            </div>

            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span class="text-[10px] font-bold text-amber-800 uppercase block">Step 2: Reception</span>
              <strong class="text-amber-900">Scan at Desk</strong>
              <span class="text-[10px] text-amber-700 block mt-0.5">Instant desk verification</span>
            </div>

            <div class="p-3 rounded-xl bg-sky-50 border border-sky-200">
              <span class="text-[10px] font-bold text-sky-800 uppercase block">Step 3: Consultation</span>
              <strong class="text-sky-900">${doctorRoom}</strong>
              <span class="text-[10px] text-sky-700 block mt-0.5">Enter when token called</span>
            </div>

            <div class="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span class="text-[10px] font-bold text-purple-800 uppercase block">Step 4: Feedback</span>
              <strong class="text-purple-900">Review &amp; Rating</strong>
              <span class="text-[10px] text-purple-700 block mt-0.5">Automated post-visit prompt</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-3">
            <span class="text-xl">📲</span>
            <div>
              <strong class="text-slate-900 block">Mobile Notification Bar Tracking:</strong>
              <span>CityCare OPD queue will automatically update your phone notification bar as patients ahead finish their consultations.</span>
            </div>
          </div>
        </div>

        <!-- ================= 3. BACK TO MARKETPLACE BUTTON ================= -->
        <div class="pt-2 text-center">
          <button type="button" onclick="navigateTo('marketplace')" 
                  class="px-8 py-3 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold text-xs rounded-xl shadow-lg transition">
            ← Return to SAINO Marketplace
          </button>
        </div>

      </div>
    </div>
  `;
};

/* ============================================================
   AUTO-SCALE FOR DESKTOP VIEW
   ============================================================ */
function applyLaptopScale() {
  const container = document.getElementById("mainContent") || 
                    document.getElementById("main-content") || 
                    document.querySelector("main") || 
                    document.body;

  if (!container) return;

  
  if (window.innerWidth >= 1024) {
    container.style.zoom = typeof AppState !== "undefined" && AppState.activeView === "marketplace" ? "0.8" : "0.85";
  } else {
    container.style.zoom = "1"; 
  }
}

window.addEventListener("resize", applyLaptopScale);
window.addEventListener("DOMContentLoaded", applyLaptopScale);


const originalRenderHospital = window.renderHospitalDirectoryView;
if (typeof originalRenderHospital === "function") {
  window.renderHospitalDirectoryView = function(...args) {
    const html = originalRenderHospital.apply(this, args);
    setTimeout(applyLaptopScale, 50);
    return html;
  };
}

// Run immediately once
applyLaptopScale();
/* ============================================================
   DIRECTORY FILTERS + CLEAR + DISTANCE + DISCUSSIONS + HOME CARD HELPERS
   (Pehle yahan runLiveFilters / clearAllFilters the. Ab filters category ke hisaab se chalte hain.)
   NOTE: purani hospital-filters.js ab nahi chahiye, usse hata dein (isme sab aa gaya hai).
   ============================================================ */

window.toggleDirectoryFilter = function(groupId) {
  const box = document.getElementById("directory-options-" + groupId);
  const arrow = document.getElementById("directory-arrow-" + groupId);
  if (!box) return;
  const nowHidden = box.classList.toggle("hidden");
  if (arrow) arrow.classList.toggle("rotate-180", !nowHidden);
};

window.toggleDirectoryFilterPanel = function() {
  const panel = document.getElementById("directory-filter-panel");
  if (panel) panel.classList.toggle("hidden");
};

window.directoryApplyFilters = function() {
  const panel = document.getElementById("directory-filter-panel");
  const cards = document.querySelectorAll("[data-directory-card]");
  if (!panel) return;
  const groups = DIRECTORY_FILTERS[panel.getAttribute("data-category")] || [];

  const selected = {};
  groups.forEach(function(g) {
    selected[g.id] = Array.from(panel.querySelectorAll('input[data-filter-group="' + g.id + '"]:checked')).map(function(i) { return i.value; });
  });

  let visible = 0;
  cards.forEach(function(card) {
    const p = directoryFindProvider(card.getAttribute("data-provider-id"));
    const ok = !!p && directoryMatchesSearch(p) && groups.every(function(g) { return directoryMatchGroup(p, g, selected[g.id]); });
    card.classList.toggle("hidden", !ok);
    if (ok) visible++;
  });

  const meta = DIRECTORY_META[panel.getAttribute("data-category")] || DIRECTORY_META.hospital;
  const count = document.getElementById("directory-count");
  if (count) count.textContent = visible + " " + meta.plural + " found";
  const empty = document.getElementById("directory-empty");
  if (empty) empty.classList.toggle("hidden", visible !== 0);
};

window.directorySearch = function(value) {
  if (window.AppState) AppState.searchQuery = String(value || '');
  window.directoryApplyFilters();
};

window.clearAllFilters = function() {
  document.querySelectorAll("#directory-filter-panel input[type=checkbox]").forEach(function(cb) { cb.checked = false; });
  const search = document.getElementById('directorySearchInput');
  if (search) search.value = '';
  if (window.AppState) AppState.searchQuery = '';
  window.directoryApplyFilters();
};

// Checkbox change par filter (sirf ek baar bind hota hai)
if (!window.__directoryFilterBound) {
  window.__directoryFilterBound = true;
  document.addEventListener("change", function(e) {
    if (e.target && e.target.matches && e.target.matches("#directory-filter-panel input[type=checkbox]")) {
      window.directoryApplyFilters();
    }
  });
}

/* ---------- Distance (har hospital ka alag, user ki location se) ---------- */
window.directoryRefreshDistances = function() {
  document.querySelectorAll("[data-distance-for]").forEach(function(el) {
    const p = directoryFindProvider(el.getAttribute("data-distance-for"));
    const d = p ? directoryDistanceKm(p) : null;
    const text = d === null ? "" : " · " + d.toFixed(1) + " km";
    if (el.textContent !== text) el.textContent = text;
  });
};

window.directoryEnsureUserLocation = function() {
  if (window.USER_LOCATION || window.__directoryAskedLocation || !navigator.geolocation) return;
  window.__directoryAskedLocation = true;
  navigator.geolocation.getCurrentPosition(function(pos) {
    window.USER_LOCATION = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    window.directoryRefreshDistances();
    window.directoryApplyFilters();
  }, function() {});
};

/* ---------- Discussions: us hospital ki discussion tak ---------- */
window.goToHospitalDiscussions = function(providerId) {
  const p = directoryFindProvider(providerId);
  if (!p) return;
  const clean = function(s) {
    return String(s || "").toLowerCase().replace(/\(.*?\)/g, " ")
      .replace(/\b(hospital|international|research|centre|center|and|pvt|ltd)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ").trim();
  };
  const store = window.DISCUSSIONS_STORE || {};
  const key = clean(p.name);
  const disc = (p.discussionId && store[p.discussionId]) ||
    Object.values(store).find(function(d) { const n = clean(d.hospital); return n && (n === key || n.includes(key) || key.includes(n)); });

  navigateTo("discussions");
  if (disc) {
    setTimeout(function() { if (typeof window.openDiscussionModal === "function") window.openDiscussionModal(disc.id); }, 60);
  } else if (typeof showToast === "function") {
    showToast("No discussion for " + p.name + " yet");
  }
};

/* ---------- Home page card: "+N more" click par baaki departments ---------- */
window.toggleHomeDepartments = function(providerId) {
  const box = document.getElementById("home-extra-" + providerId);
  const btn = document.getElementById("home-more-" + providerId);
  if (!box || !btn) return;
  const nowHidden = box.classList.toggle("hidden");
  btn.textContent = nowHidden ? btn.getAttribute("data-label") : "Show less";
};

// Booking IDs, fees and queue data come from the API response, never the browser.
window.renderAppointmentSuccessView = function(booking) {
  const b = booking || {};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const paymentUnavailable = Boolean(b.payment_unavailable);
  const confirmed = b.payment_status === 'paid' && ['pending','confirmed','checked_in','waiting','in_progress','completed'].includes(String(b.status || '').toLowerCase());
  const bookingMessage = paymentUnavailable
    ? 'Your booking request and queue token are saved. Online payment is not configured yet; the appointment is awaiting payment.'
    : b.payment_status !== 'paid' && Number(b.amount || 0) > 0
      ? 'Complete payment to confirm this appointment. Your booking ID and token are saved.'
      : 'Your request is saved. The provider will confirm it and update your live queue status.';
  return `<section id="booking-confirmation-container" class="max-w-3xl mx-auto px-4 py-10"><div class="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
    <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">${confirmed ? 'Appointment confirmed' : 'Booking request saved'}</p>
    <h1 class="mt-2 text-2xl font-black text-slate-900">${esc(b.provider_name || window.BOOKING_STATE.hospitalName)}</h1>
    <p id="bookingConfirmationMessage" class="mt-2 text-sm text-slate-600">${esc(bookingMessage)}</p>
    <dl class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div><dt class="text-slate-500">Booking ID</dt><dd class="font-bold">${esc(b.booking_id || '—')}</dd></div>
      <div><dt class="text-slate-500">Queue token</dt><dd id="bookingToken" class="font-bold">${esc(b.token || 'Not assigned')}</dd></div>
      <div><dt class="text-slate-500">Doctor</dt><dd class="font-bold">${esc(b.doctor_name || 'Provider to assign')}</dd></div>
      <div><dt class="text-slate-500">Visit</dt><dd class="font-bold">${esc(b.appointment_date || '')} ${esc(b.slot_time || '')}</dd></div>
      <div><dt class="text-slate-500">Status</dt><dd id="bookingStatus" class="font-bold uppercase">${esc(b.status || 'pending')}</dd></div>
      <div><dt class="text-slate-500">Payment</dt><dd id="bookingPaymentStatus" class="font-bold uppercase">${esc(b.payment_status || 'pending')}</dd></div>
      <div><dt class="text-slate-500">Queue position</dt><dd id="bookingQueuePosition" class="font-bold">${b.queue?.position ? esc(b.queue.position) : 'Provider check-in pending'}</dd></div>
      <div><dt class="text-slate-500">Now serving</dt><dd id="bookingNowServing" class="font-bold">${esc(b.queue?.now_serving_token || 'Not started')}</dd></div>
      <div><dt class="text-slate-500">Room</dt><dd id="bookingRoom" class="font-bold">${esc(b.room || b.queue?.room || 'Provider will update')}</dd></div>
      <div><dt class="text-slate-500">Estimated wait</dt><dd id="bookingEta" class="font-bold">${b.queue?.eta_minutes == null ? 'Not available yet' : `${esc(b.queue.eta_minutes)} minutes`}</dd></div>
      <div><dt class="text-slate-500">Visit ID</dt><dd id="bookingVisitId" class="font-bold">${esc(b.visit_id || 'Issued at check-in')}</dd></div>
      <div><dt class="text-slate-500">Consultation fee</dt><dd class="font-bold">₹${Number(b.amount || 0).toLocaleString('en-IN')}</dd></div>
    </dl>
    <div class="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900"><strong>SAINO notification</strong><p id="bookingPatientNotification" class="mt-1">Booking details and future provider updates are saved to your patient account.</p></div>
    <p id="bookingLiveUpdatedAt" class="mt-3 text-[11px] text-slate-500" aria-live="polite">Live appointment updates will appear here.</p>
    <div class="mt-6 flex flex-wrap gap-3">${b.payment_required && b.payment_status !== 'paid' && !b.payment_unavailable ? '<button id="retryPatientPayment" onclick="retryPatientBookingPayment()" class="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Pay online</button>' : ''}<button onclick="refreshAppointmentStatus()" class="rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white">Refresh live status</button><button onclick="navigateTo('marketplace')" class="rounded-xl border px-4 py-3 text-sm font-bold">Back to marketplace</button></div>
  </div></section>`;
};

window.refreshAppointmentStatus = async function() {
  const bookingId = window.__SAINO_ACTIVE_BOOKING_ID;
  const token = window.getSainoPatientSession?.().token || '';
  if (!bookingId || !token || !document.getElementById('booking-confirmation-container')) return;
  const api = window.SAINO_API_ORIGIN || '';
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  const put = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(value ?? ''); };
  try {
    const [bookingResponse, notificationResponse] = await Promise.all([
      fetch(`${api}/api/public/bookings/${encodeURIComponent(bookingId)}`, { cache: 'no-store', headers }),
      fetch(`${api}/api/public/patient/notifications`, { cache: 'no-store', headers })
    ]);
    const bookingPayload = await bookingResponse.json().catch(() => ({}));
    const notificationPayload = await notificationResponse.json().catch(() => ({}));
    if (!bookingResponse.ok || !bookingPayload.success || !bookingPayload.booking) throw new Error(bookingPayload.error || 'Live appointment status is unavailable.');
    const b = bookingPayload.booking;
    put('bookingToken', b.token || 'Not assigned');
    put('bookingStatus', b.status || 'pending');
    put('bookingPaymentStatus', b.payment_status || 'pending');
    put('bookingQueuePosition', b.queue?.position ? b.queue.position : (['waiting','checked_in'].includes(String(b.status).toLowerCase()) ? '1' : 'Provider check-in pending'));
    put('bookingNowServing', b.queue?.now_serving_token || 'Not started');
    put('bookingRoom', b.room || b.queue?.room || 'Provider will update');
    put('bookingEta', b.queue?.eta_minutes == null ? 'Not available yet' : `${b.queue.eta_minutes} minutes`);
    put('bookingVisitId', b.visit_id || 'Issued at check-in');
    if (b.payment_status === 'paid') document.getElementById('retryPatientPayment')?.remove();
    const note = (notificationPayload.rows || []).find(row => row.booking_ref === bookingId);
    if (note) put('bookingPatientNotification', note.message);
    put('bookingLiveUpdatedAt', `Live status updated ${new Date().toLocaleTimeString()}. Queue position and wait time appear after provider check-in.`);
    return b;
  } catch (error) {
    put('bookingLiveUpdatedAt', error.message || 'Could not refresh live status.');
    return null;
  }
};

window.retryPatientBookingPayment = async function() {
  const bookingId = window.__SAINO_ACTIVE_BOOKING_ID;
  const session = window.getSainoPatientSession?.() || {};
  const button = document.getElementById('retryPatientPayment');
  if (!bookingId || !session.token) return window.openPatientOtpModal?.();
  if (button) { button.disabled = true; button.textContent = 'Preparing payment…'; }
  const api = window.SAINO_API_ORIGIN || '';
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` };
  try {
    const orderResponse = await fetch(`${api}/api/public/bookings/${encodeURIComponent(bookingId)}/payment`, { method: 'POST', headers, body: '{}' });
    const orderPayload = await orderResponse.json().catch(() => ({}));
    if (!orderResponse.ok || !orderPayload.success || !orderPayload.payment) throw new Error(orderPayload.error || 'Online payment is unavailable.');
    if (!window.Razorpay) await new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve; script.onerror = () => reject(new Error('Razorpay checkout could not be loaded.'));
      document.head.appendChild(script);
    });
    const checkout = new window.Razorpay({
      key: orderPayload.payment.key_id, order_id: orderPayload.payment.order_id,
      amount: orderPayload.payment.amount, currency: orderPayload.payment.currency,
      name: 'SAINO Health', description: `Appointment at ${orderPayload.booking.provider_name}`,
      prefill: { name: session.profile?.name || '', email: session.profile?.email || '', contact: session.profile?.phone || '' },
      theme: { color: '#991b1b' },
      handler: async result => {
        try {
          const response = await fetch(`${api}/api/public/bookings/payment/verify`, { method: 'POST', headers,
            body: JSON.stringify({ booking_id: bookingId, ...result }) });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload.success) throw new Error(payload.error || 'Payment verification failed.');
          window.__SAINO_PENDING_PATIENT_PAYMENT = null;
          await window.refreshAppointmentStatus();
          if (window.showToast) window.showToast('Payment received. Your booking status is updated.');
        } catch (error) { alert(error.message || 'Payment verification failed.'); }
      },
      modal: { ondismiss: () => { if (button) { button.disabled = false; button.textContent = 'Pay online'; } } }
    });
    checkout.open();
  } catch (error) {
    alert(error.message || 'Online payment is unavailable.');
    if (button) { button.disabled = false; button.textContent = 'Pay online'; }
  }
};
/* ============================================================
   STEP 1 BUTTON CONNECTED TO RAZORPAY / PAYMENT PAGE (NO SIGN-IN)
   ============================================================ */

// 1. "Book Appointment" Button Handler -> Opens Payment Page Directly
window.confirmAppointment = function() {
  const bp = window.BOOKING_STATE || {};
  const name = document.getElementById('patientName')?.value.trim() || '';
  const phone = document.getElementById('patientPhone')?.value.trim() || '';
  const email = document.getElementById('patientEmail')?.value.trim() || '';
  const notes = document.getElementById('patientSymptoms')?.value.trim() || '';
  const date = document.getElementById('bookingDate')?.value || bp.date || '';
  const time = document.getElementById('bookingTime')?.value || bp.timeSlot || '';

  // Validation
  if (!bp.providerId) return alert('Please select a hospital or clinic.');
  if (!name) return alert('Please enter patient full name.');
  if (!phone || phone.length < 7) return alert('Please enter patient mobile number.');
  if (!date) return alert('Please choose an appointment date.');
  if (!time) return alert('Please choose an appointment time slot.');
  if (!document.getElementById('consentBox')?.checked) return alert('Please accept the consent checkbox.');

  // Save in State
  window.BOOKING_STATE.patientName = name;
  window.BOOKING_STATE.patientPhone = phone;
  window.BOOKING_STATE.patientEmail = email;
  window.BOOKING_STATE.symptoms = notes;
  window.BOOKING_STATE.date = date;
  window.BOOKING_STATE.timeSlot = time;

  // JOD DIYA: Seedhe Full Razorpay / Payment Page Open Hoga
  const main = document.getElementById('mainContent') || document.getElementById('main-content') || document.querySelector('main');
  if (main) {
    main.innerHTML = window.renderFullPaymentPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// 2. Full-Page Payment Screen (Cash vs Razorpay UPI QR Scanner)
window.renderFullPaymentPage = function() {
  const bp = window.BOOKING_STATE || {};
  const hosp = bp.hospitalName || "Hospital Facility";
  const doc = bp.doctorName || "Assigned Doctor";
  const dt = bp.date || new Date().toISOString().slice(0, 10);
  const tm = bp.timeSlot || "10:00 AM";
  const fee = bp.fee ? `₹${Number(bp.fee).toLocaleString('en-IN')}` : "₹500";
  const patient = bp.patientName || "Patient";
  const phone = bp.patientPhone || "";

  return `
    <div class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24 text-left">
      <!-- Breadcrumb Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <nav class="flex items-center gap-2 text-xs text-slate-400">
            <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
            <span>›</span>
            <button type="button" onclick="navigateTo('appointment-booking')" class="hover:text-slate-600">Select Doctor</button>
            <span>›</span>
            <span class="text-[#ad0b0e] font-bold">Payment Method</span>
          </nav>
          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Patient: ${patient} (${phone})
          </span>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT COLUMN: Payment Options -->
          <div class="lg:col-span-8 space-y-6">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h1 class="text-xl font-black text-slate-900">Choose How to Pay</h1>
              <p class="text-xs text-slate-500 mt-1">Select your preferred payment method for ${hosp}.</p>

              <div class="mt-6 space-y-4">
                <!-- Option 1: Cash at Hospital Reception -->
                <label class="block border-2 border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-[#ad0b0e] transition">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="paymentOption" value="cash_at_hospital" checked onchange="document.getElementById('razorpayQrBox').classList.add('hidden')" class="w-4 h-4 accent-[#ad0b0e]">
                    <div>
                      <strong class="text-sm font-bold text-slate-900 block">🏥 Pay in Cash at Hospital</strong>
                      <span class="text-xs text-slate-500">Pay directly in cash at the hospital OPD counter on your visit.</span>
                    </div>
                  </div>
                </label>

                <!-- Option 2: Online UPI / Razorpay Scanner -->
                <label class="block border-2 border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-[#ad0b0e] transition">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="paymentOption" value="razorpay_qr" onchange="document.getElementById('razorpayQrBox').classList.remove('hidden')" class="w-4 h-4 accent-[#ad0b0e]">
                    <div>
                      <strong class="text-sm font-bold text-slate-900 block">📱 Online (Razorpay / UPI QR Scanner)</strong>
                      <span class="text-xs text-slate-500">Instant scan &amp; pay via Google Pay, PhonePe, Paytm, or any banking app.</span>
                    </div>
                  </div>

                  <!-- QR Scanner Box -->
                  <div id="razorpayQrBox" class="hidden mt-4 pt-4 border-t border-slate-100 text-center">
                    <span class="inline-block text-[11px] font-bold text-[#ad0b0e] bg-red-50 px-3 py-1 rounded-full mb-3">Scan &amp; Pay ${fee}</span>
                    <div class="w-52 h-52 mx-auto bg-white border-2 border-slate-200 rounded-2xl p-3 flex items-center justify-center shadow-xs">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=saino@upi&pn=SAINO_HEALTH" alt="Payment QR Scanner" class="w-full h-full object-contain">
                    </div>
                    <p class="text-xs text-slate-500 mt-2">Scan QR code using UPI to pay, then click Complete Booking below.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Summary & Confirm Button -->
          <div class="lg:col-span-4 sticky top-6">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h2 class="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Booking Summary</h2>
              <dl class="text-xs space-y-3 py-4 border-b border-slate-100">
                <div class="flex justify-between"><dt class="text-slate-400">Hospital</dt><dd class="font-bold text-slate-800 text-right">${hosp}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Doctor</dt><dd class="font-bold text-slate-800 text-right">${doc}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Date</dt><dd class="font-bold text-slate-800 text-right">${dt}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Time</dt><dd class="font-bold text-slate-800 text-right">${tm}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Patient</dt><dd class="font-bold text-slate-800 text-right">${patient}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Contact</dt><dd class="font-bold text-slate-800 text-right">${phone}</dd></div>
              </dl>
              <div class="flex justify-between items-center py-4">
                <span class="text-xs font-semibold text-slate-600">Consultation Fee</span>
                <span class="text-base font-black text-[#ad0b0e]">${fee}</span>
              </div>
              <button id="finalBookBtn" type="button" onclick="submitRealBackendBooking()" class="w-full py-4 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-bold rounded-xl shadow-md transition">
                Confirm &amp; Complete Booking →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
};

// 3. Backend Database Save (POST /api/public/bookings) -> PostgreSQL Real Save
window.submitRealBackendBooking = async function() {
  const bp = window.BOOKING_STATE || {};
  const selectedMode = document.querySelector('input[name="paymentOption"]:checked')?.value || 'cash_at_hospital';
  const btn = document.getElementById("finalBookBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Connecting to Database..."; }

  // Date formatting for PostgreSQL
  let dateIso = bp.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    const d = new Date(dateIso || Date.now());
    dateIso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  let slotTime = bp.timeSlot || '10:00';
  const m = String(slotTime).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (m) {
    let hh = parseInt(m[1], 10);
    if (m[3].toUpperCase() === 'PM' && hh < 12) hh += 12;
    if (m[3].toUpperCase() === 'AM' && hh === 12) hh = 0;
    slotTime = `${String(hh).padStart(2,'0')}:${m[2]}`;
  }

  try {
    const payload = {
      provider_id: String(bp.providerId),
      doctor_id: bp.doctorId ? Number(bp.doctorId) : null,
      doctor_name: bp.doctorName || '',
      patient_name: bp.patientName,
      patient_phone: bp.patientPhone,
      patient_email: bp.patientEmail || '',
      appointment_date: dateIso,
      slot_time: slotTime,
      consultation_type: bp.consultationType || 'in_person',
      payment_method: selectedMode,
      notes: bp.symptoms || ''
    };

    const response = await fetch((window.SAINO_API_ORIGIN || '') + '/api/public/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.booking) {
      throw new Error(data.error || 'Database could not save booking.');
    }

    const b = data.booking;
    window.__SAINO_ACTIVE_BOOKING = b;

    // Save in LocalStorage for My Appointments
    try {
      const list = JSON.parse(localStorage.getItem('SAINO_MY_APPOINTMENTS') || '[]');
      list.unshift({
        bookingId: b.booking_id,
        hospital: b.provider_name || bp.hospitalName,
        doctor: b.doctor_name || bp.doctorName,
        date: b.appointment_date,
        timeSlot: b.slot_time,
        token: b.token || '#07',
        patientName: bp.patientName,
        patientPhone: bp.patientPhone,
        paymentMode: selectedMode === 'razorpay_qr' ? 'Online Paid (UPI QR)' : 'Cash at Hospital'
      });
      localStorage.setItem('SAINO_MY_APPOINTMENTS', JSON.stringify(list));
    } catch (_) {}

    // Show Confirmation View with Real Booking ID & Red Download PDF Button
    const main = document.getElementById("mainContent") || document.querySelector("main");
    if (main) {
      main.innerHTML = `
        <div class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans py-12 px-4 text-center">
          <div class="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-black mb-3">✓</div>
            <h1 class="text-2xl font-black text-slate-900">${selectedMode === 'razorpay_qr' ? 'Payment &amp; Booking Successful!' : 'Booking Confirmed!'}</h1>
            <p class="text-xs text-slate-500 mt-1">Your booking has been saved in the database for <strong>${b.provider_name}</strong>.</p>

            <div class="my-6 p-5 rounded-2xl bg-red-50/70 border border-red-200">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your Real Booking ID</span>
              <strong class="text-2xl font-mono font-black text-[#ad0b0e] block mt-1">${b.booking_id}</strong>
              <span class="text-xs text-slate-600 block mt-1 font-semibold">Queue Token: <strong class="text-slate-900">${b.token || '#07'}</strong></span>
            </div>

            <div class="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 mb-6">
              <div class="flex justify-between"><span class="text-slate-400">Doctor:</span><strong class="text-slate-800">${b.doctor_name || bp.doctorName}</strong></div>
              <div class="flex justify-between"><span class="text-slate-400">Date &amp; Time:</span><strong class="text-slate-800">${b.appointment_date} • ${b.slot_time}</strong></div>
              <div class="flex justify-between"><span class="text-slate-400">Payment:</span><strong class="text-slate-800">${selectedMode === 'razorpay_qr' ? 'Paid via UPI QR' : 'Pay in Cash at Hospital'}</strong></div>
            </div>

            <!-- Red Download PDF Button -->
            <button type="button" onclick="downloadRealAppointmentPdf()" class="w-full py-4 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-black rounded-xl shadow-md transition mb-3">
              📄 Download PDF Confirmation Slip
            </button>
            
            <button type="button" onclick="navigateTo('appointments')" class="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl transition">
              Track Live Queue in My Appointments →
            </button>
          </div>
        </div>
      `;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } catch (err) {
    alert(err.message || 'Error saving booking to database.');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm & Complete Booking →'; }
  }
};

// 4. Download Confirmation PDF Slip
window.downloadRealAppointmentPdf = function() {
  const b = window.__SAINO_ACTIVE_BOOKING || {};
  const bp = window.BOOKING_STATE || {};
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SAINO_Appointment_${b.booking_id || bp.sainoBookingId}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; }
        .box { max-width: 620px; margin: auto; border: 2px solid #0f172a; border-radius: 16px; padding: 28px; }
        .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ad0b0e; padding-bottom: 14px; margin-bottom: 18px; }
        .brand { font-size: 22px; font-weight: 900; color: #ad0b0e; }
        .uid { background: #fef2f2; border: 1.5px solid #ad0b0e; color: #ad0b0e; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; }
        .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .lbl { color: #64748b; }
        .val { font-weight: 700; color: #0f172a; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="hdr">
          <div>
            <div class="brand">SAINO HEALTH</div>
            <div style="font-size:11px;color:#64748b;">Official Appointment &amp; Queue Pass</div>
          </div>
          <div class="uid">Token: ${b.token || '#07'}</div>
        </div>
        <div class="row"><span class="lbl">Unique Booking ID</span><span class="val" style="color:#ad0b0e;">${b.booking_id || '—'}</span></div>
        <div class="row"><span class="lbl">Patient Name</span><span class="val">${bp.patientName || 'Patient'}</span></div>
        <div class="row"><span class="lbl">Mobile Number</span><span class="val">${bp.patientPhone || '—'}</span></div>
        <div class="row"><span class="lbl">Hospital</span><span class="val">${b.provider_name || bp.hospitalName}</span></div>
        <div class="row"><span class="lbl">Doctor</span><span class="val">${b.doctor_name || bp.doctorName}</span></div>
        <div class="row"><span class="lbl">Appointment Date</span><span class="val">${b.appointment_date || bp.date}</span></div>
        <div class="row"><span class="lbl">Scheduled Time</span><span class="val">${b.slot_time || bp.timeSlot}</span></div>
        <div class="row"><span class="lbl">Payment Method</span><span class="val">${bp.paymentMode === 'razorpay_qr' ? 'Online Paid (UPI QR)' : 'Cash at Hospital Reception'}</span></div>
        <p style="font-size:11px;color:#64748b;margin-top:20px;text-align:center;">Track your live queue position anytime in <strong>My Appointments</strong> using your Unique ID: <strong>${b.booking_id}</strong></p>
      </div>
      <script>window.onload = function(){ window.print(); };</script>
    </body>
    </html>
  `);
  win.document.close();
};