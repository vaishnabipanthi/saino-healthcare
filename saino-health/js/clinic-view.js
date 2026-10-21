
/* 2. Hospital Profile View (Single Profile Page) */
function renderHospitalProfileView(providerId) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];

  // Data se exact provider dhoondega (Hospital, Clinic, Diagnostic, Wellness etc.)
  const provider = allProviders.find(p => 
    p && (
      (p.id && String(p.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (p.name && p.name.toLowerCase() === String(providerId).toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(String(providerId).toLowerCase()))
    )
  ) || {
    name: providerId || "Healthcare Provider",
    category: (window.AppState && window.AppState.activeView) || "clinic",
    rating: "4.8",
    reviewsCount: "210",
    location: "Kathmandu",
    distance: "2.5km",
    opd: "Mon–Sat, 8:00 AM – 7:00 PM",
    phone: "+977 1-4200000",
    about: "Verified partner healthcare facility offering quality healthcare services."
  };

  const name = provider.name || "Provider";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "HC";
  const category = (provider.category || "healthcare").toLowerCase();
  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + "s";
  const location = provider.location || provider.address || "Kathmandu";
  const rating = provider.rating || "4.8";
  const reviews = provider.reviewsCount || "240";
  const opd = provider.opd || "Mon–Sat, 8:00 AM – 7:00 PM";
  const phone = provider.phone || "+977 1-4400000";
  const distance = provider.distance || "2.5km";
  const about = provider.about || `${name} provides specialized medical services, diagnostics, and care in ${location}.`;

  // Doctors / Services / Tests
  const docs = (Array.isArray(provider.doctors) && provider.doctors.length > 0) ? provider.doctors : [
    { name: "Dr. Anup Karki", role: "Consultant Specialist", initials: "AK" },
    { name: "Dr. Sabina Shrestha", role: "General Care", initials: "SS" },
    { name: "Dr. Ashina Pradhan", role: "Specialist", initials: "AP" }
  ];
  return `
    <div id="hospital-profile-container" class="bg-slate-50 min-h-screen pb-16">
      
      <!-- Breadcrumb -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:underline">Home</button>
          <span>›</span>
          <button type="button" onclick="backToHospitalList()" class="hover:underline">${categoryTitle}</button>
          <span>›</span>
          <span class="text-slate-800 font-semibold">Norvic Hospital</span>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- Banner -->
        <div class="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm" style="min-height: 190px;">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-xl shrink-0">
                ${(provider.image || provider.imageUrl || provider.logo) ? `<img src="${provider.image || provider.imageUrl || provider.logo}" alt="${name}" class="w-full h-full object-cover">` : initials}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-bold">${name}</h1>
                 <span class="inline-flex items-center gap-1 text-emerald-300 text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    <svg class="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Saino Verified
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-emerald-100/80 mt-1">
                  <span>Multispecialty Hospital</span>
                  <span>•</span>
                  <span>24/7 Emergency</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-amber-300 mt-2">
                  <span>★</span>
                  <span class="font-bold text-white">${rating}</span>
                  <button type="button" onclick="openDedicatedReviewsView('${provider.id || name}')" class="text-emerald-100/80 hover:text-white underline underline-offset-2 transition cursor-pointer">(${reviews} reviews)</button>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="bg-white rounded-full p-2 inline-flex shadow-sm">${typeof savedHeartButton === "function" ? savedHeartButton(provider.id || name) : ""}</span>
              <button type="button"
                onclick="openAppointmentBooking('${provider.id || name}')"
                class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-sm">
                Book appointment
              </button>
            </div>
          </div>
        </div>

        <!-- About & Meta -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h2 class="text-base font-bold text-slate-900 mb-2">About</h2>
            <p class="text-xs text-slate-600 leading-relaxed">
              ${about}
            </p>
          </div>
          
          <div class="bg-white rounded-2xl border border-slate-200 p-5 text-xs space-y-3">
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Address</span>
              <span class="font-semibold text-slate-800 text-right">Thapathali, Kathmandu</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Hours</span>
              <span class="font-semibold text-slate-800">Open 24 hours</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Phone</span>
              <span class="font-semibold text-slate-800">+977 1-4258554</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Distance</span>
              <span class="font-semibold text-slate-800">3km</span>
            </div>
          </div>
        </div>

        <!-- Available Doctors -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-slate-900">Available doctors</h2>
            <span class="text-xs text-slate-400 font-medium">3 Doctors Active</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <img src="assets/doctor3.jpg" class="w-14 h-14 mx-auto rounded-full object-cover mb-2" alt="Dr. Anup Karki">
              <h3 class="text-xs font-bold text-slate-900">Dr. Anup Karki</h3>
              <p class="text-[11px] text-slate-500 mb-3">General physician</p>
              <button type="button" onclick="openAppointmentBooking('${provider.id || name}', 'Dr. Anup Karki', 'General physician')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <img src="assets/doctor2.jpg" class="w-14 h-14 mx-auto rounded-full object-cover mb-2">
              <h3 class="text-xs font-bold text-slate-900">Dr. Sabina Shrestha</h3>
              <p class="text-[11px] text-slate-500 mb-3">General physician</p>
              <button type="button" onclick="openAppointmentBooking('${provider.id || name}', 'Dr. Sabina Shrestha', 'General physician')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <img src="assets/doctor1.jpg" class="w-14 h-14 mx-auto rounded-full object-cover mb-2" alt="Dr. Ashina Pradhan">
              <h3 class="text-xs font-bold text-slate-900">Dr. Ashina Pradhan</h3>
              <p class="text-[11px] text-slate-500 mb-3">Gynaecologist</p>
              <button type="button" onclick="openAppointmentBooking('${provider.id || name}', 'Dr. Ashina Pradhan', 'Gynaecologist')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        <!-- Available Slots -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900">Doctor's available slots</h2>
            <span class="text-xs text-slate-400">Today, 24 Oct</span>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-800 mb-3">General medicine</div>
            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div class="flex items-center gap-3">
                  ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                  <div>
                    <div class="text-xs font-bold text-slate-900">Dr. Sabina Shrestha</div>
                    <div class="text-[10px] text-slate-400">General physician</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">10:00 AM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">02:30 PM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">4:00 PM</button>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div class="flex items-center gap-3">
                  ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                  <div>
                    <div class="text-xs font-bold text-slate-900">Dr. Anup Karki</div>
                    <div class="text-[10px] text-slate-400">General physician</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">11:00 AM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">03:30 PM</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-800 mb-3">Maternity & Gynaecology</div>
            <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
              <div class="flex items-center gap-3">
                ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                <div>
                  <div class="text-xs font-bold text-slate-900">Dr. Ashina Pradhan</div>
                  <div class="text-[10px] text-slate-400">Gynaecologist</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">10:00 AM</button>
                <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">11:30 AM</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Gallery -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-base font-bold text-slate-900 mb-4">Gallery</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
  <img src="assets/hos1.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 1">
  <img src="assets/hos2.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 2">
  <img src="assets/hos3.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 3">
  <img src="assets/hos4.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 4">
  <img src="assets/hos5.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 5">
  <img src="assets/hos6.jpg" class="w-full h-44 rounded-xl object-cover" alt="Gallery 6">
</div>
        </div>

        <!-- Reviews -->
        <div id="profile-reviews" class="bg-white rounded-2xl border border-slate-200 p-6 scroll-mt-4">
          <h2 class="text-base font-bold text-slate-900 mb-4">Reviews</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="border border-slate-200 rounded-xl p-5 text-center flex flex-col justify-center">
              <div class="text-4xl font-black text-slate-900">${rating}</div>
              <div class="text-amber-500 text-sm mt-1">★★★★★</div>
              <div class="text-[11px] text-slate-400 mt-1">Based on ${reviews} reviews</div>
              <div class="mt-4 space-y-1 text-[10px] text-slate-500">
                <div class="flex items-center gap-2"><span>5</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[80%]"></div></div></div>
                <div class="flex items-center gap-2"><span>4</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[15%]"></div></div></div>
                <div class="flex items-center gap-2"><span>3</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[3%]"></div></div></div>
                <div class="flex items-center gap-2"><span>2</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[1%]"></div></div></div>
                <div class="flex items-center gap-2"><span>1</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[1%]"></div></div></div>
              </div>
            </div>
            <div class="lg:col-span-2 space-y-4">
              <!-- Sujata R. -->
              <div class="border-b border-slate-100 pb-3">
                <div class="flex items-center justify-between text-xs mb-2">
                  <div class="flex items-center gap-2.5">
                    ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                    <div>
                      <div class="font-bold text-slate-800 leading-tight">Sujata R.</div>
                      <div class="text-amber-500 text-[11px] leading-tight">★★★★★</div>
                    </div>
                  </div>
                  <span class="text-slate-400">1 month ago</span>
                </div>
                <p class="text-xs text-slate-600 pl-10.5">Great experience overall. Doctor took time explaining issues and the rest of the nursing was smooth.</p>
              </div>

              <!-- Bikash T. -->
              <div class="border-b border-slate-100 pb-3">
                <div class="flex items-center justify-between text-xs mb-2">
                  <div class="flex items-center gap-2.5">
                    ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                    <div>
                      <div class="font-bold text-slate-800 leading-tight">Bikash T.</div>
                      <div class="text-amber-500 text-[11px] leading-tight">★★★★★</div>
                    </div>
                  </div>
                  <span class="text-slate-400">2 weeks ago</span>
                </div>
                <p class="text-xs text-slate-600 pl-10.5">Clean premises, well mannered staff, quick lab turnaround times, highly recommend.</p>
              </div>

              <!-- Alisha M. -->
              <div>
                <div class="flex items-center justify-between text-xs mb-2">
                  <div class="flex items-center gap-2.5">
                    ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4")}
                    <div>
                      <div class="font-bold text-slate-800 leading-tight">Alisha M.</div>
                      <div class="text-amber-500 text-[11px] leading-tight">★★★★☆</div>
                    </div>
                  </div>
                  <span class="text-slate-400">3 days ago</span>
                </div>
                <p class="text-xs text-slate-600 pl-10.5">Very professional gynaecology department. Felt well cared for.</p>
              </div>
            </div>

        <!-- More Hospitals -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-slate-900">More hospitals</h2>
            <button type="button" onclick="backToHospitalList()" class="text-xs text-red-700 font-semibold hover:underline">View all</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <img src="assets/hos1.jpg" alt="Norvic Hospital" class="h-28 w-full object-cover">
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Norvic Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">Thapathali • 3km</p>
                <button type="button" onclick="openHospitalProfile('norvic')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <img src="assets/hos2.jpg" alt="Madhyapur Hospital" class="h-28 w-full object-cover">
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Madhyapur Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">Thimi • 6km</p>
                <button type="button" onclick="openHospitalProfile('madhyapur')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <img src="assets/hos3.jpg" alt="Everest Hospital" class="h-28 w-full object-cover">
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Everest Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">New Baneshwor • 4km</p>
                <button type="button" onclick="openHospitalProfile('everest')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

/* 3. Global Click Handlers */
window.renderHospitalProfileView = renderHospitalProfileView;

/* Profile router: sirf ek function. Clinic ho to clinic ka profile, baaki sabka hospital wala profile page.
   (Pehle yahan openHospitalProfile / openClinicProfile do-do baar define the, ab sirf yahi ek hai.) */
window.openProviderProfile = function(providerId) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!main) return;
  const p = directoryFindProvider(providerId);
  const cat = directoryNorm(p && p.category);
  const useClinic = cat === "clinic" && typeof window.renderClinicProfileView === "function";
  main.innerHTML = useClinic ? window.renderClinicProfileView(providerId) : renderHospitalProfileView(providerId);
  window.scrollTo({ top: 0, behavior: "instant" });
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};
window.openHospitalProfile = window.openProviderProfile;
window.openClinicProfile = window.openProviderProfile;
window.openDiagnosticProfile = window.openProviderProfile;
window.openWellnessProfile = window.openProviderProfile;

// Reviews par click: profile khulta hai aur seedha Reviews section par scroll hota hai
window.openProviderReviews = function(providerId) {
  window.openProviderProfile(providerId);
  setTimeout(function() {
    const el = document.getElementById("profile-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
window.backToHospitalList = function () {
  navigateTo(window.__directoryCategory || "hospital");
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
  hospitalName: "Norvic Hospital",
  doctorName: "Dr. Aayush Shrestha",
  doctorRole: "Senior Cardiologist",
  doctorAvatar: "AS",
  doctorInitialClass: "bg-red-700 text-white",
  date: "Sept 22, 2026",
  selectedDay: 22,
  timeSlot: "11:30 AM",
  fee: "Rs. 1,000"
};

window.renderAppointmentBookingView = function() {
  const currentProviderName = window.BOOKING_STATE.hospitalName || "Selected Facility";
  const currentDoc = window.BOOKING_STATE.doctorName;
  const currentDay = window.BOOKING_STATE.selectedDay;
  const currentSlot = window.BOOKING_STATE.timeSlot;

  return `
    <div id="appointment-booking-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Top Breadcrumb & Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav class="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
            <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
            <span>›</span>
            <span class="text-red-700 font-semibold">Book Appointment</span>
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

            <button type="button" onclick="openHospitalProfile('${window.BOOKING_STATE.providerId || currentProviderName}')" class="text-xs font-semibold text-slate-600 hover:text-red-700 flex items-center gap-1">
              ← Back to Profile
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
              <h2 class="text-sm font-bold text-slate-900 mb-4">1. Choose an Available Doctor</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- Doctor 1: Dr. Aayush Shrestha -->
                <div id="doc-card-aayush" 
                     onclick="selectBookingDoctor('Dr. Aayush Shrestha', 'Senior Cardiologist')" 
                     class="cursor-pointer rounded-2xl p-4 relative transition ${currentDoc === 'Dr. Aayush Shrestha' ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
                      <div>
                        <h3 class="text-xs font-bold text-slate-900">Dr. Aayush Shrestha</h3>
                        <p class="text-[11px] text-slate-500">Senior Cardiologist</p>
                      </div>
                    </div>
                    <span id="doc-radio-aayush" class="w-4 h-4 rounded-full flex items-center justify-center ${currentDoc === 'Dr. Aayush Shrestha' ? 'border-2 border-red-700' : 'border-2 border-slate-300'}">
                      <span class="w-2 h-2 rounded-full bg-red-700 ${currentDoc === 'Dr. Aayush Shrestha' ? '' : 'hidden'}"></span>
                    </span>
                  </div>
                  <div class="mt-3 text-[11px] text-slate-500">
                    <div class="text-amber-500 font-medium">★ ★ ★ ★ ★ <span class="text-slate-700 font-bold">4.8</span> <span class="text-slate-400">(240 reviews)</span></div>
                    <div class="mt-1">Experience: <strong class="text-slate-700 font-semibold">12 Years</strong></div>
                  </div>
                </div>

                <!-- Doctor 2: Dr. Rekha Shrestha -->
                <div id="doc-card-rekha" 
                     onclick="selectBookingDoctor('Dr. Rekha Shrestha', 'General Physician')" 
                     class="cursor-pointer rounded-2xl p-4 relative transition ${currentDoc === 'Dr. Rekha Shrestha' ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
                      <div>
                        <h3 class="text-xs font-bold text-slate-900">Dr. Rekha Shrestha</h3>
                        <p class="text-[11px] text-slate-500">General Physician</p>
                      </div>
                    </div>
                    <span id="doc-radio-rekha" class="w-4 h-4 rounded-full flex items-center justify-center ${currentDoc === 'Dr. Rekha Shrestha' ? 'border-2 border-red-700' : 'border-2 border-slate-300'}">
                      <span class="w-2 h-2 rounded-full bg-red-700 ${currentDoc === 'Dr. Rekha Shrestha' ? '' : 'hidden'}"></span>
                    </span>
                  </div>
                  <div class="mt-3 text-[11px] text-slate-500">
                    <div class="text-amber-500 font-medium">★ ★ ★ ★ ★ <span class="text-slate-700 font-bold">5.0</span> <span class="text-slate-400">(180 reviews)</span></div>
                    <div class="mt-1">Experience: <strong class="text-slate-700 font-semibold">8 Years</strong></div>
                  </div>
                </div>

              </div>
            </div>

            <!-- 2. Select Date (September 2026) -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 class="text-sm font-bold text-slate-900 mb-4">2. Select Date (September 2026)</h2>
              
              <div class="w-full text-center text-xs">
                <div class="grid grid-cols-7 text-[11px] font-medium text-slate-400 pb-3 border-b border-slate-100">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>

                <div id="calendar-days-container" class="grid grid-cols-7 gap-y-2.5 pt-4 text-xs font-medium text-slate-700">
                  <span class="text-slate-300 py-1.5">31</span>
                  ${Array.from({ length: 30 }, (_, i) => i + 1).map(day => `
                    <button type="button" 
                            data-day="${day}" 
                            onclick="selectBookingDate(${day})" 
                            class="cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition ${day === currentDay ? 'bg-[#991b1b] text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700'}">
                      ${day}
                    </button>
                  `).join('')}
                  <span class="text-slate-300 py-1.5">1</span>
                  <span class="text-slate-300 py-1.5">2</span>
                  <span class="text-slate-300 py-1.5">3</span>
                  <span class="text-slate-300 py-1.5">4</span>
                </div>
              </div>
            </div>

            <!-- 3. Choose a Time Slot -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">3. Choose a Time Slot</h2>
              
              <!-- Morning -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Morning Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-morning">
                  ${['09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Afternoon -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Afternoon Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-afternoon">
                  ${['02:00 PM', '03:15 PM', '04:30 PM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Evening -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Evening Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-evening">
                  ${['06:00 PM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 4. Enter Patient Information -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">4. Enter Patient Information</h2>
              
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Patient's Full Name</label>
                <input type="text" id="patientName" placeholder="e.g. John Doe" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input type="tel" id="patientPhone" placeholder="e.g. 98XXXXXXXX" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" id="patientEmail" placeholder="e.g. email@saino.com" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Reason for Appointment / Symptoms</label>
                <textarea id="patientSymptoms" rows="3" placeholder="Explain symptoms briefly here..." class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition"></textarea>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="consentBox" checked class="w-4 h-4 accent-red-700 rounded cursor-pointer">
                <label for="consentBox" class="text-[11px] text-slate-600 cursor-pointer">
                  I consent to sharing this basic healthcare details with Narnia Clinic for clinical review.
                </label>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Sticky Booking Summary -->
          <div class="lg:col-span-4 sticky top-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 class="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Booking Summary</h3>
              
              <dl class="text-xs space-y-3 py-4 border-b border-slate-100">
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Hospital</dt>
                  <dd id="summaryHospital" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.hospitalName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Doctor</dt>
                  <dd id="summaryDoctor" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.doctorName}</dd>
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
                <span class="text-xs font-semibold text-slate-600">Consultation Fee</span>
                <span class="text-base font-black text-red-700">${window.BOOKING_STATE.fee}</span>
              </div>

              <button type="button" onclick="confirmAppointment()" class="w-full bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-xs">
                Confirm & Book Appointment
              </button>

              <p class="text-[10px] text-slate-400 text-center mt-3">
                No booking charges. Pay at the clinic.
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
window.selectBookingDoctor = function(doctorName, doctorRole) {
  window.BOOKING_STATE.doctorName = doctorName;
  window.BOOKING_STATE.doctorRole = doctorRole;

  // Update Summary Card
  const summaryDoc = document.getElementById("summaryDoctor");
  if (summaryDoc) summaryDoc.textContent = doctorName;

  // Update Visual Card Borders & Radio Dots
  const cardAayush = document.getElementById("doc-card-aayush");
  const cardRekha = document.getElementById("doc-card-rekha");
  const radioAayush = document.querySelector("#doc-radio-aayush span");
  const radioRekha = document.querySelector("#doc-radio-rekha span");
  const radioAayushCircle = document.getElementById("doc-radio-aayush");
  const radioRekhaCircle = document.getElementById("doc-radio-rekha");

  if (doctorName === "Dr. Aayush Shrestha") {
    if (cardAayush) {
      cardAayush.className = "cursor-pointer rounded-2xl p-4 relative transition border-2 border-red-600 bg-red-50/20";
    }
    if (cardRekha) {
      cardRekha.className = "cursor-pointer rounded-2xl p-4 relative transition border border-slate-200 bg-white hover:border-slate-300";
    }
    if (radioAayushCircle) radioAayushCircle.className = "w-4 h-4 rounded-full border-2 border-red-700 flex items-center justify-center";
    if (radioRekhaCircle) radioRekhaCircle.className = "w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center";
    if (radioAayush) radioAayush.classList.remove("hidden");
    if (radioRekha) radioRekha.classList.add("hidden");
  } else {
    if (cardRekha) {
      cardRekha.className = "cursor-pointer rounded-2xl p-4 relative transition border-2 border-red-600 bg-red-50/20";
    }
    if (cardAayush) {
      cardAayush.className = "cursor-pointer rounded-2xl p-4 relative transition border border-slate-200 bg-white hover:border-slate-300";
    }
    if (radioRekhaCircle) radioRekhaCircle.className = "w-4 h-4 rounded-full border-2 border-red-700 flex items-center justify-center";
    if (radioAayushCircle) radioAayushCircle.className = "w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center";
    if (radioRekha) radioRekha.classList.remove("hidden");
    if (radioAayush) radioAayush.classList.add("hidden");
  }
};

// 2. Date Selection Logic
window.selectBookingDate = function(dayNumber) {
  window.BOOKING_STATE.selectedDay = dayNumber;
  window.BOOKING_STATE.date = "Sept " + dayNumber + ", 2026";

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

window.openAppointmentBooking = function(providerId, doctorName, doctorRole) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  
  // Clicked facility find karein (Clinic, Hospital, Diagnostic)
  const p = allProviders.find(item => 
    item && (
      (item.id && String(item.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase().includes(String(providerId).toLowerCase()))
    )
  );

  if (p) {
    window.BOOKING_STATE.providerId = p.id;
    window.BOOKING_STATE.hospitalName = p.name;
    window.BOOKING_STATE.location = p.location || p.address || "Kathmandu";
    if (p.doctors && p.doctors.length > 0) {
      window.BOOKING_STATE.doctorName = p.doctors[0].name;
      window.BOOKING_STATE.doctorRole = p.doctors[0].role;
    }
  } else if (providerId) {
    window.BOOKING_STATE.providerId = providerId;
    window.BOOKING_STATE.hospitalName = providerId;
  }

  if (doctorName) {                       // profile par kisi doctor ke "Book" se aaye ho
    window.BOOKING_STATE.doctorName = doctorName;
    if (doctorRole) window.BOOKING_STATE.doctorRole = doctorRole;
  }

  // Modal ko band karein agar khula ho
  if (typeof closeModal === 'function') closeModal();
  window.closeModal = function() {
  const modal = document.getElementById("modal") || document.getElementById("appointment-modal") || document.querySelector(".modal");
  if (modal) modal.remove();
  openProviderProfile(window.BOOKING_STATE?.providerId || 'norvic');
};

  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main && typeof window.renderAppointmentBookingView === 'function') {
    main.innerHTML = window.renderAppointmentBookingView();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};



// 5. Booking Confirmation
/* ============================================================
   BOOKING CONFIRMATION SUCCESS VIEW (1:1 SCREENSHOT REPLICA)
   ============================================================ */

window.renderAppointmentSuccessView = function(patientData) {
  const patientName = patientData.name || "John Doe";
  const patientPhone = patientData.phone || "+977 98510XXXXX";
  const patientEmail = patientData.email || "johndoe@gmail.com";
  const patientReason = patientData.symptoms || "Routine cardiovascular check-up. Experiencing minor shortness of breath during light workouts over the past week.";
  const bookingRef = "SAINO-2026-" + Math.floor(1000 + Math.random() * 9000);

  return `
    <div id="booking-confirmation-container" class="bg-[#fbfcfd] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Breadcrumb -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-4">
        <nav class="flex items-center gap-2 text-[11px] text-slate-400">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
          <span>›</span>
          <button type="button" onclick="backToHospitalList()" class="hover:text-slate-600">Hospitals</button>
          <span>›</span>
          <button type="button" onclick="openHospitalProfile('norvic')" class="hover:text-slate-600">Norvic Hospital</button>
          <span>›</span>
          <span class="text-red-700 font-medium">Booking Confirmed</span>
        </nav>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- 1. Top Success Hero Card -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 text-center shadow-2xs">
          <!-- Green Shield Icon -->
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>

          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Appointment Booked Successfully!</h1>
          <p class="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Your booking is confirmed. Norvic Hospital has been notified of your appointment.
          </p>

          <!-- Booking Reference Pill -->
          <div class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 text-xs text-slate-500 mt-5">
            <span>Booking Reference:</span>
            <strong class="font-bold text-red-700">${bookingRef}</strong>
          </div>
        </div>

        <!-- 2. Dual Column Details (Appointment Summary & Patient Info) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          <!-- Left: Appointment Summary -->
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 class="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Appointment Summary</h2>
            
            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Clinic</span>
              <div class="flex items-center gap-1 text-xs font-bold text-slate-900 mt-0.5">
                <svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                <span>${window.BOOKING_STATE.hospitalName}</span>
              </div>
              <p class="text-[11px] text-slate-500 ml-4.5">Thapathali, Kathmandu · Multi-specialty</p>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Doctor</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${window.BOOKING_STATE.doctorName}</div>
              <p class="text-[11px] text-slate-500">${window.BOOKING_STATE.doctorRole} (12 Yrs Experience)</p>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Date & Time</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${window.BOOKING_STATE.date}</div>
              <div class="text-[11px] font-bold text-red-700 mt-0.5">At ${window.BOOKING_STATE.timeSlot} (Morning Slot)</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Consultation Fee</span>
              <div class="text-sm font-black text-red-700 mt-0.5">${window.BOOKING_STATE.fee}</div>
              <p class="text-[10px] text-slate-400">Pay at the clinic counter during checkout</p>
            </div>
          </div>

          <!-- Right: Patient Information -->
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 class="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Patient Information</h2>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Patient Name</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientName}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Contact Phone</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientPhone}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Email Address</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientEmail}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Reason for Visit</span>
              <p class="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">${patientReason}</p>
            </div>
          </div>

        </div>

        <!-- 3. Important Guidelines & Instructions -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3 print:hidden">
          <h2 class="text-xs font-bold text-slate-900 tracking-tight">Important Guidelines & Instructions</h2>
          <ul class="space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li class="leading-relaxed">
              Please arrive at Norvic Hospital at least <strong class="text-red-700 font-semibold">15 minutes early</strong> to complete physical check-in and registry procedures.
            </li>
            <li class="leading-relaxed">
              Bring a valid <strong class="text-red-700 font-semibold">Government-issued Photo ID</strong> (Citizenship Card, Passport, or License) along with any previous medical/cardiology reports.
            </li>
            <li class="leading-relaxed">
              If you need to reschedule or cancel your slot, please notify the platform or clinic at least 4 hours before the scheduled time slot.
            </li>
          </ul>
        </div>

        <!-- 4. Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="button" 
                  onclick="window.print()" 
                  class="flex-1 py-3 px-4 border border-red-700 text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition text-center shadow-2xs">
            Download Confirmation PDF
          </button>
          
          <button type="button" 
                  onclick="navigateTo('marketplace')" 
                  class="flex-1 py-3 px-4 bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold rounded-xl transition text-center shadow-xs">
            Go Back to Homepage
          </button>
        </div>

      </div>
    </div>
  `;
};

// Confirm Button Handler with Form Data Extraction
window.confirmAppointment = function() {
  const nameInput = document.getElementById("patientName");
  const phoneInput = document.getElementById("patientPhone");
  const emailInput = document.getElementById("patientEmail");
  const symptomsInput = document.getElementById("patientSymptoms");

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const symptoms = symptomsInput ? symptomsInput.value.trim() : "";

  if (!name) {
    alert("Please enter the patient's full name.");
    if (nameInput) nameInput.focus();
    return;
  }
  if (!phone) {
    alert("Please enter a contact phone number.");
    if (phoneInput) phoneInput.focus();
    return;
  }

  // My Appointments page ke liye save (appointments-saved-view.js ka saveAppointmentRecord)
  if (typeof saveAppointmentRecord === "function") {
    const bp = window.BOOKING_STATE || {};
    const found = (typeof directoryFindProvider === "function" && bp.providerId) ? directoryFindProvider(bp.providerId) : null;
    const parsed = new Date(String(bp.date || ""));
    const isoDate = isNaN(parsed) ? "" : parsed.getFullYear() + "-" + String(parsed.getMonth() + 1).padStart(2, "0") + "-" + String(parsed.getDate()).padStart(2, "0");
    saveAppointmentRecord(
      { id: bp.providerId || bp.hospitalName, name: bp.hospitalName, category: (found && found.category) || "" },
      {
        service: (bp.doctorName || "") + (bp.doctorRole ? " (" + bp.doctorRole + ")" : ""),
        name: name,
        date: isoDate,
        notes: (bp.timeSlot ? "Time: " + bp.timeSlot + ". " : "") + symptoms
      }
    );
  }

  const patientPayload = {
    name: name,
    phone: phone,
    email: email || "johndoe@gmail.com",
    symptoms: symptoms || "Routine cardiovascular check-up. Experiencing minor shortness of breath during light workouts over the past week."
  };

  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = window.renderAppointmentSuccessView(patientPayload);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};
/* ============================================================
   AUTO-SCALE FOR LAPTOP VIEW (COMPACT 85% ZOOM)
   ============================================================ */
function applyLaptopScale() {
  const container = document.getElementById("mainContent") || 
                    document.getElementById("main-content") || 
                    document.querySelector("main") || 
                    document.body;

  if (!container) return;

  
  if (window.innerWidth >= 1024) {
    container.style.zoom = "0.85";
  } else {
    container.style.zoom = "1"; 
  }
}

window.addEventListener("resize", applyLaptopScale);
window.addEventListener("DOMContentLoaded", applyLaptopScale);

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
    const ok = !!p && groups.every(function(g) { return directoryMatchGroup(p, g, selected[g.id]); });
    card.classList.toggle("hidden", !ok);
    if (ok) visible++;
  });

  const meta = DIRECTORY_META[panel.getAttribute("data-category")] || DIRECTORY_META.hospital;
  const count = document.getElementById("directory-count");
  if (count) count.textContent = visible + " " + meta.plural + " found";
  const empty = document.getElementById("directory-empty");
  if (empty) empty.classList.toggle("hidden", visible !== 0);
};

window.clearAllFilters = function() {
  document.querySelectorAll("#directory-filter-panel input[type=checkbox]").forEach(function(cb) { cb.checked = false; });
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

};

/* ---------- Home page card: "+N more" click par baaki departments ---------- */
window.toggleHomeDepartments = function(providerId) {
  const box = document.getElementById("home-extra-" + providerId);
  const btn = document.getElementById("home-more-" + providerId);
  if (!box || !btn) return;
  const nowHidden = box.classList.toggle("hidden");
  btn.textContent = nowHidden ? btn.getAttribute("data-label") : "Show less";
};
