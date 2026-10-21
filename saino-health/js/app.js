
window.renderUserProfileIcon = function(sizeClass = "w-8 h-8", iconSizeClass = "w-4 h-4", extraClass = "", displayName = "") {
  const initials = String(displayName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  return `
    <span class="${sizeClass} rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 ${extraClass}" aria-hidden="true">
      ${initials ? `<span class="${iconSizeClass} font-extrabold leading-none">${escapeCommunityText(initials)}</span>` : `<i data-lucide="user-round" class="${iconSizeClass}"></i>`}
    </span>
  `;
};

const AppState = {
  activeView: 'marketplace', // 'marketplace' | 'discovery' | 'campaigns' | 'boost' | 'about' | 'contact' | 'list-your-care'
  activeBigScreenIndex: 0,
  bigScreenDisplayMode: 'billboard', // 'billboard' | 'spotlight' | 'mobile'
  selectedLocation: 'all',
  selectedCategory: 'all',
  selectedVerification: 'all',
  selectedBookingType: 'all',
  searchQuery: '',
  sortBy: 'recommended',
  currentAdIndex: 0,
  adAutoPlayInterval: null,
  bigScreenAutoPlayInterval: null,
  discoverySlideIndex: 0,
  discoveryReviewIndex: 0,
  discoveryRatedTab: 'hospitals',
  discoverySelectedLocation: 'loc-1',
  providers: [],
  activeProvider: null,
  toastTimeout: null
};
window.AppState = AppState;
const quickServices = [
  { id: 'hospital', title: 'Hospital', icon: 'building-2', description: 'Hospitals & specialist care' },
  { id: 'clinic', title: 'Clinic', icon: 'stethoscope', description: 'Doctors & OPD clinics' },
  { id: 'diagnostic', title: 'Diagnostic / Lab', icon: 'activity', description: 'Labs, MRI, CT & scans' },
  { id: 'packages', title: 'Diagnostic Packages', icon: 'package-check', description: 'Health screening packages' },
  { id: 'wellness', title: 'Wellness Centre', icon: 'sparkles', description: 'Wellness & preventive care' },
  { id: 'homecare', title: 'Homecare & Elderly', icon: 'heart-handshake', description: 'Care at your doorstep' },
  { id: 'insurance', title: 'Health Insurance', icon: 'shield-check', description: 'Protect your health' },
  { id: 'bloodbank', title: 'Blood Bank', icon: 'droplets', description: 'Emergency blood services' }
];
function getSainoVisitorId() {
  let visitorId = localStorage.getItem('SAINO_VISITOR_ID');
  if (!visitorId) {
    visitorId = window.crypto?.randomUUID?.() || `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('SAINO_VISITOR_ID', visitorId);
  }
  return visitorId;
}
 document.addEventListener('DOMContentLoaded', async () => {
  // Provider listings always come from PostgreSQL. Do not briefly expose the
  // bundled sample provider directory while the live request is in flight.
  window.SAINO_DATA.providers = [];
  AppState.providers = [];
  try {
    if (typeof window.SAINO_LOAD_LIVE_MARKETPLACE === 'function') {
      AppState.providers = await window.SAINO_LOAD_LIVE_MARKETPLACE();
    }
  } catch (error) {
    console.error('Live marketplace unavailable:', error);
    window.SAINO_DATA.providers = [];
    AppState.providers = [];
  }
  try {
    AppState.providers.forEach(provider => { provider.isLiked = false; provider.likesCount = Number(provider.likesCount) || 0; });
    const stateResponse = await fetch(`${window.SAINO_API_ORIGIN || ''}/api/public/provider-likes?visitor_id=${encodeURIComponent(getSainoVisitorId())}`, { cache: 'no-store' });
    const statePayload = await stateResponse.json().catch(() => ({}));
    if (stateResponse.ok && statePayload.success) {
      const likeState = new Map((statePayload.rows || []).map(row => [String(row.provider_id), row]));
      AppState.providers.forEach(provider => {
        const saved = likeState.get(String(provider.id));
        if (saved) { provider.isLiked = Boolean(saved.is_liked); provider.likesCount = Number(saved.likes_count) || 0; }
      });
    }
  } catch (_) {}
  window.updatePatientProfileMenu?.();
  if (typeof window.refreshOpdCards === 'function') window.refreshOpdCards();
  // Naya Code (URL Hash Reader + Auto Router):
  const initialHash = window.location.hash ? window.location.hash.replace('#', '').trim() : '';
  const validViews = ['marketplace', 'discovery', 'find-healthcare', 'appointments', 'saved', 'list-your-care', 'about', 'contact', 'faqs', 'hospital', 'clinic', 'diagnostic', 'wellness', 'ambulance', 'bloodbank', 'homecare', 'insurance'];
  
  const targetView = (initialHash && validViews.includes(initialHash)) ? initialHash : 'marketplace';
  AppState.activeView = targetView;
  window.__sainoViewHistory = [targetView];

  if (!history.state) {
    history.replaceState({ view: targetView, filterParams: null, scrollY: 0 }, '', window.location.href.split('#')[0] + '#' + targetView);
  }

  // Hash change hone par turant screen update karein
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash ? window.location.hash.replace('#', '').trim() : 'marketplace';
    if (validViews.includes(hash) && hash !== AppState.activeView) {
      navigateTo(hash, null, true);
    }
  });

  // Browser Back Button dabane par step-by-step piche aane ke liye
  window.addEventListener('popstate', (e) => {
    // Agar koi booking modal ya popup khula hai toh pehle use band karein
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && modalContainer.innerHTML.trim() !== '') {
      modalContainer.innerHTML = '';
      return;
    }

    const stack = window.__sainoProviderReturnStack || [];
    const routeStack = window.__sainoViewHistory || (window.__sainoViewHistory = [AppState.activeView]);
    if (e.state?.view && routeStack.length > 1 && routeStack[routeStack.length - 2] === e.state.view) routeStack.pop();
    else if (e.state?.view && routeStack[routeStack.length - 1] !== e.state.view) routeStack.push(e.state.view);
    if (e.state?.view && stack.length && stack[stack.length - 1].activeView === e.state.view) {
      window.returnToProviderSource(true);
      return;
    }

    if (e.state && e.state.view) {
      navigateTo(e.state.view, e.state.filterParams, true);
      if (Number.isFinite(Number(e.state.scrollY))) requestAnimationFrame(() => window.scrollTo({ top: Number(e.state.scrollY), behavior: 'instant' }));
    } else {
      navigateTo('marketplace', null, true);
    }
  });

  initNavigation();
  initAdCarousel();
  initBigScreenAutoPlay();
  renderApp();
  const qrParams = new URLSearchParams(window.location.search);
  const qrProviderId = qrParams.get('providerId');
  if (qrParams.get('source') === 'qr' && qrProviderId && /^\d+$/.test(qrProviderId)) {
    window.BOOKING_STATE = window.BOOKING_STATE || {};
    window.BOOKING_STATE.qrCode = qrParams.get('qr') || '';
    setTimeout(() => window.openAppointmentBooking?.(qrProviderId), 0);
  }
  initGlobalEventListeners();
  
  // Refresh Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Navigation Controller
function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      navigateTo(target);
    });
  });

  // Mobile menu toggle (Safe check taaki crash na ho)
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}
  window.backToHospitalList = function () {
  window.goBackToPreviousPage();
};

// Global SPA Routing Engine
function navigateTo(viewName, filterParams = null, isPopState = false) {
  if (!['provider-profile', 'appointment-booking', 'provider-reviews'].includes(viewName) && AppState.activeView !== viewName) {
    if (window.__sainoProviderReturnStack) window.__sainoProviderReturnStack.length = 0;
    window.__sainoProviderReturnView = null;
  }
  if (viewName === 'back') {
    navigateTo('marketplace', null, false);
    return;
  }

  if (viewName === "patient" && AppState.activeView !== "patient") {
    window.__sainoReviewReturnState = {
      view: AppState.activeView,
      selectedCategory: AppState.selectedCategory,
      selectedLocation: AppState.selectedLocation,
      selectedVerification: AppState.selectedVerification,
      selectedBookingType: AppState.selectedBookingType,
      searchQuery: AppState.searchQuery,
      scrollY: window.scrollY
    };
  }

  if (viewName === "homecare" && AppState.activeView !== "homecare") {
    window.captureServiceReturnView();
  }
  AppState.activeView = viewName;
  // Keep the red underline only on the currently active top navigation page.
  document.querySelectorAll('.nav-link').forEach(link => {
    const action = link.getAttribute('onclick') || '';
    const active = action.includes("navigateTo('" + viewName + "')") ||
      (viewName === 'marketplace' && action.includes("navigateTo('marketplace')"));
    link.classList.toggle('active', active);
  });
  if (viewName === 'provider-reviews' && filterParams && filterParams.providerId) {
    AppState.activeProvider = AppState.providers.find(provider =>
      String(provider.id) === String(filterParams.providerId)
    ) || null;
  }

  if (!isPopState) {
    if (history.state?.view) history.replaceState({ ...history.state, scrollY: window.scrollY }, '', window.location.href);
    const routeStack = window.__sainoViewHistory || (window.__sainoViewHistory = [history.state?.view || AppState.activeView]);
    routeStack.push(viewName);
    history.pushState({ view: viewName, filterParams: filterParams }, '', window.location.href.split('#')[0] + '#' + viewName);
  }

  window.returnFromAllReviews = function() {
    const previous = window.__sainoReviewReturnState;
    if (!previous) {
      navigateTo("marketplace");
      return;
    }
    AppState.selectedCategory = previous.selectedCategory;
    AppState.selectedLocation = previous.selectedLocation;
    AppState.selectedVerification = previous.selectedVerification;
    AppState.selectedBookingType = previous.selectedBookingType;
    AppState.searchQuery = previous.searchQuery;
    window.__sainoReviewReturnState = null;
    navigateTo(previous.view || "marketplace");
    window.scrollTo({ top: previous.scrollY || 0, behavior: "instant" });
  };

  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.add('hidden');
  }

  // Desktop Navbar Active Highlight
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === viewName) {
      link.classList.add('nav-active');
      link.classList.remove('text-slate-700');
    } else {
      link.classList.remove('nav-active');
      link.classList.add('text-slate-700');
    }
  });

  // Mobile Bottom Bar Active Highlight
  document.querySelectorAll('[data-bottom-btn]').forEach(btn => {
    if (btn.getAttribute('data-bottom-btn') === viewName) {
      btn.style.color = '#B91C1C';
    } else {
      btn.style.color = '#64748b';
    }
  });

  if (filterParams) {
    if (filterParams.category) AppState.selectedCategory = filterParams.category;
    if (filterParams.location) AppState.selectedLocation = filterParams.location;
    if (filterParams.bookingType) AppState.selectedBookingType = filterParams.bookingType;
  }

  renderApp();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.goBackToPreviousPage = function() {
  const routeStack = window.__sainoViewHistory || [];
  if (routeStack.length > 1 && history.state?.view === routeStack[routeStack.length - 1]) {
    history.back();
    return;
  }
  navigateTo('marketplace');
};


function mobileSearchSubmit() {
  const input = document.getElementById('mobileSearchInput');
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  AppState.searchQuery = query;
  AppState.activeView = 'marketplace';

  if (typeof renderApp === 'function') renderApp();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Master Controller
function renderApp() {
  const mainContainer = document.getElementById('mainContent');
  if (!mainContainer) return;

  const heroSection = document.getElementById('heroHomeSection');
  if (heroSection) {
    heroSection.style.display = AppState.activeView === 'marketplace' ? 'block' : 'none';
  }

  switch (AppState.activeView) {
    case 'marketplace':
      mainContainer.innerHTML = renderMarketplaceView();
      bindMarketplaceEvents();
      break;
    case 'hospital':
      case 'hospitals':
      case 'clinic':
      case 'clinics':
      case 'diagnostic':
      case 'diagnostics':
      case 'wellness':
      case 'insurance':
        mainContainer.innerHTML = window.renderHospitalDirectoryView ? window.renderHospitalDirectoryView(AppState.activeView) : renderCategoryListView(AppState.activeView);
        if (typeof applyLaptopScale === 'function') setTimeout(applyLaptopScale, 30);
        break;
      case 'ambulance':
      case 'homecare':
        mainContainer.innerHTML = renderCategoryListView(AppState.activeView);
        break;
      case 'bloodbank':
        mainContainer.innerHTML = window.renderBloodBankDirectoryView ? window.renderBloodBankDirectoryView() : renderCategoryListView('bloodbank');
        break;
    case 'discovery':
      mainContainer.innerHTML = renderDiscoveryView();
      bindProvidersShowcaseEvents();
      break;
     case "find-healthcare":
      mainContainer.innerHTML = renderFindHealthcareView();
      break;
    case 'appointments':
      mainContainer.innerHTML = renderAppointmentsView();
      break;
    case 'appointment-booking':
      mainContainer.innerHTML = window.renderAppointmentBookingView ? window.renderAppointmentBookingView() : '';
      break;
    case 'saved':
      mainContainer.innerHTML = renderSavedView();
      break;
    case 'list-your-care':
      mainContainer.innerHTML = renderListYourCareView();
      bindListYourCareEvents();
      break;
    case 'campaigns':
      mainContainer.innerHTML = renderCampaignsView();
      bindCampaignsEvents();
      break;
    case 'boost':
      mainContainer.innerHTML = renderBoostView();
      bindBoostEvents();
      break;
    case 'about':
      mainContainer.innerHTML = renderAboutView();
      bindAboutEvents();
      break;
    case 'contact':
      mainContainer.innerHTML = renderContactView();
      bindContactEvents();
      break;
    case 'faqs':
      mainContainer.innerHTML = renderFaqsView();
      break;
    case 'patient':
    mainContainer.innerHTML = window.renderAllReviewsView();
    break
    case 'provider-reviews':
      mainContainer.innerHTML = window.renderProviderReviewsPage();
      break;
    case 'provider-profile':
      mainContainer.innerHTML = AppState.activeProvider?.category === 'clinic' && window.renderClinicProfileView
        ? window.renderClinicProfileView(AppState.activeProvider.id)
        : (window.renderHospitalProfileView ? window.renderHospitalProfileView(AppState.activeProvider && AppState.activeProvider.id) : '');
      break;
    case 'discussions':
    mainContainer.innerHTML = window.renderAllDiscussionsView();
    break;
    default:
    mainContainer.innerHTML = renderMarketplaceView();
      bindMarketplaceEvents();
  }

  if (typeof applyLaptopScale === 'function') applyLaptopScale();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // Ads data with high-res responsive images
  const ads = [
    { 
      title: "Catalogue / Ads Section", 
      desc: "Rotating healthcare promotions, sponsored placements & platform announcements",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80" 
    },
    { 
      title: "Special Offer", 
      desc: "Get 20% off on diagnostic packages",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80" 
    },
    { 
      title: "Insurance Plans", 
      desc: "Protect your family with cashless health insurance",
      image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80" 
    },
    { 
      title: "Homecare Services", 
      desc: "Book nurses and doctors at your doorstep",
      image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80" 
    }
  ];

  let currentAd = 0;
  const adTitle = document.getElementById("adTitle");
  const adDescription = document.getElementById("adDescription");
  const adImageBanner = document.getElementById("adImageBanner");
  const dots = document.querySelectorAll(".ad-dot");

  function showAd(index) {
    currentAd = index;
    const item = ads[index];

    if (adTitle && adDescription) {
      adTitle.textContent = item.title;
      adDescription.textContent = item.desc;
    }

    if (adImageBanner) {
      adImageBanner.src = item.image;
    }

    if (dots && dots.length) {
      dots.forEach((dot, i) => {
        dot.classList.remove("bg-white");
        dot.classList.add("bg-white/40");
        if (i === index) {
          dot.classList.add("bg-white");
          dot.classList.remove("bg-white/40");
        }
      });
    }
  }

  dots.forEach((dot, i) => {
    dot.setAttribute("data-index", i);
    dot.addEventListener("click", () => showAd(i));
  });

  setInterval(() => {
    let nextAd = (currentAd + 1) % ads.length;
    showAd(nextAd);
  }, 3500);

  showAd(0);
});


// ==========================================
// 1. MARKETPLACE VIEW RENDERING 
// ==========================================
function renderBloodBankEnquiryAction(bank) {
  const phone = String(bank.phone || "").replace(/[^\d+]/g, "");
  if (/^\+?\d{7,15}$/.test(phone)) {
    return `
      <a href="tel:${phone}" aria-label="Call ${bank.name} at ${phone}"
        class="mt-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-3 py-1.5 bg-saino-red text-white rounded-lg text-[10px] font-bold">
        Enquire Now
      </a>
    `;
  }
  const safeName = String(bank.name || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
    <button type="button" onclick="openCustomWhatsApp('Blood Bank Enquiry: ${safeName}', 'Hello SAINO, I need blood availability information from ${safeName}.')"
      class="mt-2 px-3 py-1.5 bg-saino-red text-white rounded-lg text-[10px] font-bold">
      Enquire Now
    </button>
  `;
}
/* ============================================================
   1. NEAR YOU TABS DATA (4 Live Cards Per Category)
   ============================================================ */
window.NEAR_YOU_DATA = {};

window.currentNearYouTab = "bloodbank";

function switchNearYouTab(tabKey) {
  window.currentNearYouTab = tabKey;
  
  document.querySelectorAll(".near-you-tab-btn").forEach(btn => {
    const isThis = btn.dataset.tab === tabKey;
    btn.className = isThis 
      ? "near-you-tab-btn px-4 py-2 border-b-2 border-[#ad0b0e] text-[#ad0b0e] font-bold text-xs"
      : "near-you-tab-btn px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs";
  });

  const container = document.getElementById("nearYouCardsContainer");
  if (!container) return;

  const categoryKey = value => String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
  const providers = (window.AppState?.providers || []).filter(p => p && (tabKey === 'all' || tabKey === 'offers' || categoryKey(p.category || p.provider_type) === categoryKey(tabKey)));
  const items = tabKey === 'offers' ? providers.filter(p => (p.services || []).length) : providers;
  if (!items.length) { container.innerHTML = '<div class="col-span-full p-6 text-center text-sm text-slate-500">No published providers are available in this category yet.</div>'; return; }
  container.innerHTML = items.map(p => `
    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
      <div class="relative h-40 bg-slate-100">
        <img src="${p.cover_image_url || p.image || p.logo_url || p.logo || 'assets/logo.png'}" alt="${p.name}" class="w-full h-full object-cover">
        <span class="absolute top-3 left-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">Verified</span>
        <button class="absolute top-3 right-3 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600">♥</button>
      </div>
      <div class="p-4 flex flex-col flex-1 justify-between gap-3 text-left">
        <div>
          <h3 class="font-bold text-sm text-slate-900 leading-snug">${p.name}</h3>
          <div class="flex items-center gap-1.5 text-xs mt-1">
            <span class="text-amber-500 font-bold">★ ${Number(p.rating || 0)}</span>
            <span class="text-slate-400">(${Number(p.reviewsCount || p.reviews_count || 0)} reviews)</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">${p.city || p.location || 'Location not provided'}</p>
        </div>
        <button onclick="openProviderProfile('${p.id}')" class="w-full py-2 border border-[#ad0b0e] text-[#ad0b0e] hover:bg-rose-50 text-xs font-bold rounded-xl transition">
          View Details →
        </button>
      </div>
    </div>
  `).join("");
}

window.openNearYouDirectory = function() {
  const tab = window.currentNearYouTab || 'hospital';
  navigateTo(tab === 'offers' ? 'marketplace' : tab);
  if (tab === 'offers') document.getElementById('nearYouCardsContainer')?.scrollIntoView({ behavior: 'smooth' });
};

/* ============================================================
   2. OPD CAROUSEL SLIDER ENGINE (Matches Screenshot 2)
   ============================================================ */
window.opdCurrentIndex = 0;
let opdCards = [];
function refreshOpdCards() {
  const providers = (window.AppState?.providers || []).filter(p => p && Array.isArray(p.doctors));
  opdCards = providers.flatMap(p => p.doctors.filter(d => d && d.id).map(d => ({
    hospital: p.name, doctor: d.name, spec: d.department || d.specialization || '',
    fee: Number(d.fee ?? d.opd_fee ?? 0), time: d.shift_timings || '', image: d.avatar_url || p.logo_url || p.logo || '',
    id: p.id, doctorId: d.id
  })));
  window.opdCurrentIndex = Math.min(window.opdCurrentIndex || 0, Math.max(0, opdCards.length - 2));
  renderOpdCards();
}
window.refreshOpdCards = refreshOpdCards;

function slideOpdCarousel(direction) {
  const maxIdx = Math.max(0, opdCards.length - 2);
  window.opdCurrentIndex += direction;
  if (window.opdCurrentIndex < 0) window.opdCurrentIndex = maxIdx;
  if (window.opdCurrentIndex > maxIdx) window.opdCurrentIndex = 0;
  renderOpdCards();
}

function renderOpdCards() {
  const container = document.getElementById("opdCardsCarousel");
  if (!container) return;

  if (!opdCards.length) {
    container.innerHTML = '<div class="w-full p-6 text-center text-sm text-slate-500">Approved doctors and their live schedules will appear here when providers publish them.</div>';
    const dots = document.getElementById("opdDots"); if (dots) dots.innerHTML = '';
    return;
  }

  const visible = opdCards.slice(window.opdCurrentIndex, window.opdCurrentIndex + 2);
  container.innerHTML = visible.map(item => `
    <div class="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left transition-all">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
          ${item.image ? `<img src="${item.image}" alt="${item.hospital}" class="w-full h-full object-cover">` : ''}
          </div>
          <div>
            <h3 class="font-bold text-sm text-slate-900 leading-snug">${item.hospital}</h3>
            <p class="text-xs text-slate-500 font-semibold mt-1">${item.spec}</p>
            <div class="text-sm font-black text-slate-900 mt-2">${item.fee ? `₹${Number(item.fee).toLocaleString('en-IN')}` : 'Fee not provided'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${item.time}</div>
          </div>
        </div>
        <button class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 transition">♥</button>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-50">
        <button onclick="openAppointmentBooking('${item.id}', '${item.doctor}', '${item.spec}', '${item.fee}', '${item.doctorId}')" 
                class="px-5 py-2 rounded-full border border-[#ad0b0e] text-[#ad0b0e] hover:bg-[#ad0b0e] hover:text-white text-xs font-bold transition flex items-center gap-1.5">
          <span>Book Now</span> <span>→</span>
        </button>
      </div>
    </div>
  `).join("");

  const dotsContainer = document.getElementById("opdDots");
  if (dotsContainer) {
    const totalPages = Math.max(1, opdCards.length - 1);
    let dotsHtml = "";
    for (let i = 0; i < totalPages; i++) {
      dotsHtml += (i === window.opdCurrentIndex)
        ? '<span class="w-5 h-1.5 rounded-full bg-[#ad0b0e] transition-all"></span>'
        : '<span class="w-1.5 h-1.5 rounded-full bg-slate-300 transition-all"></span>';
    }
    dotsContainer.innerHTML = dotsHtml;
  }
}

// Auto scroll timer
setInterval(() => {
  if (document.getElementById("opdCardsCarousel")) {
    slideOpdCarousel(1);
  }
}, 4500);

/* ============================================================
   3. MAIN RENDERER (ALL FIGMA SECTIONS + COMPACT HALF-HEIGHT CARDS)
   ============================================================ */
function renderMarketplaceView() {
  if (AppState.searchQuery.trim() || (AppState.selectedLocation && AppState.selectedLocation !== 'all')) {
    return renderMarketplaceSearchResults();
  }
  const marketplaceReviews = (window.AppState?.providers || []).flatMap(provider => (provider.reviews || []).map(review => ({ ...review, provider: provider.name }))).filter(review => review.comment || review.rating);
  setTimeout(() => {
    switchNearYouTab("bloodbank");
    renderOpdCards();
  }, 50);

  return `
    <!-- 1. COMPACT PROMO CARDS (HALF HEIGHT SLEEK DESIGN) -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
      
      <!-- Card 2: Emergency? -->
      <div class="rounded-xl p-3 bg-gradient-to-br from-sky-50 to-blue-100/60 border border-sky-200/80 flex items-center justify-between gap-2 shadow-2xs">
        <div class="min-w-0 text-left">
          <span class="text-[11px] font-black text-sky-800 flex items-center gap-1">
            <i data-lucide="truck" class="w-3.5 h-3.5 text-sky-700"></i> Emergency?
          </span>
          <p class="text-[10px] text-slate-600 truncate mt-0.5">Call Ambulance (24/7)</p>
        </div>
        <button onclick="filterCategory('ambulance')" class="px-2.5 py-1 bg-sky-900 hover:bg-slate-900 text-white rounded-lg text-[9px] font-bold shadow-xs shrink-0">
          Call →
        </button>
      </div>

      <!-- Card 3: Get Your Medicines -->
      <div class="rounded-xl p-3 bg-gradient-to-br from-emerald-50 to-teal-100/60 border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
        <div class="min-w-0 text-left">
          <span class="text-[11px] font-black text-emerald-800 flex items-center gap-1">
            <i data-lucide="pill" class="w-3.5 h-3.5 text-emerald-700"></i> Medicines
          </span>
          <p class="text-[10px] text-slate-600 truncate mt-0.5">Home Delivery Refills</p>
        </div>
        <button onclick="filterCategory('pharmacy')" class="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[9px] font-bold shadow-xs shrink-0">
          Find →
        </button>
      </div>

      <!-- Card 4: Up to 30% OFF -->
      <div class="rounded-xl p-3 bg-gradient-to-br from-purple-50 to-indigo-100/60 border border-purple-200/80 flex items-center justify-between gap-2 shadow-2xs">
        <div class="min-w-0 text-left">
          <span class="text-[11px] font-black text-purple-900 flex items-center gap-1">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-700"></i> 30% OFF
          </span>
          <p class="text-[10px] text-slate-600 truncate mt-0.5">Doctor Consultations</p>
        </div>
        <button onclick="filterCategory('clinic')" class="px-2.5 py-1 bg-purple-900 hover:bg-slate-900 text-white rounded-lg text-[9px] font-bold shadow-xs shrink-0">
          Book →
        </button>
      </div>

      <!-- Card 5: Health Checkup -->
      <div class="rounded-xl p-3 bg-gradient-to-br from-cyan-50 to-sky-100/60 border border-cyan-200/80 flex items-center justify-between gap-2 shadow-2xs">
        <div class="min-w-0 text-left">
          <span class="text-[11px] font-black text-cyan-900 flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-cyan-700"></i> Checkup
          </span>
          <p class="text-[10px] text-slate-600 truncate mt-0.5">From INR 2499</p>
        </div>
        <button onclick="filterCategory('diagnostic')" class="px-2.5 py-1 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg text-[9px] font-bold shadow-xs shrink-0">
          Explore →
        </button>
      </div>
    </section>

    <!-- 2. OUR SERVICES (WITH REALISTIC BADGE ICONS) -->
    <section class="space-y-4">
      <div class="flex items-end justify-between">
        <div class="text-left">
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">Our Services</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Everything you need for better health, all in one place.</p>
        </div>
        <button onclick="navigateTo('find-healthcare')" class="text-xs font-bold text-[#ad0b0e] hover:underline flex items-center gap-1">View All →</button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Hospitals -->
        <div onclick="filterCategory('hospital')" class="service-card-img cursor-pointer bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between text-left">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center mb-4 p-2 shadow-inner border border-sky-100">
            <img src="https://img.icons8.com/color/96/hospital-3.png" alt="Hospitals" class="w-10 h-10 object-contain">
          </div>
          <div><h3 class="font-extrabold text-sm text-slate-900">Hospitals</h3><p class="text-[11px] text-slate-500 mt-1 leading-tight">Find and book top hospitals</p></div>
          <div class="mt-5 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">→</div>
        </div>

        <!-- Doctors / Clinics -->
        <div onclick="filterCategory('clinic')" class="service-card-img cursor-pointer bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between text-left">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-4 p-2 shadow-inner border border-blue-100">
            <img src="https://img.icons8.com/color/96/stethoscope.png" alt="Clinics" class="w-10 h-10 object-contain">
          </div>
          <div><h3 class="font-extrabold text-sm text-slate-900">Doctors / Clinics</h3><p class="text-[11px] text-slate-500 mt-1 leading-tight">Consult trusted doctors</p></div>
          <div class="mt-5 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">→</div>
        </div>

        <!-- Diagnostics -->
        <div onclick="filterCategory('diagnostic')" class="service-card-img cursor-pointer bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between text-left">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center mb-4 p-2 shadow-inner border border-indigo-100">
            <img src="https://img.icons8.com/color/96/microscope.png" alt="Diagnostics" class="w-10 h-10 object-contain">
          </div>
          <div><h3 class="font-extrabold text-sm text-slate-900">Diagnostics</h3><p class="text-[11px] text-slate-500 mt-1 leading-tight">Lab tests & health checkups</p></div>
          <div class="mt-5 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">→</div>
        </div>

        <!-- Blood Bank -->
        <div onclick="filterCategory('bloodbank')" class="service-card-img cursor-pointer bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between text-left">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center mb-4 p-2 shadow-inner border border-red-100">
            <img src="https://img.icons8.com/color/96/blood-bag.png" alt="Blood Bank" class="w-10 h-10 object-contain">
          </div>
          <div><h3 class="font-extrabold text-sm text-slate-900">Blood Bank</h3><p class="text-[11px] text-slate-500 mt-1 leading-tight">Find blood banks near you</p></div>
          <div class="mt-5 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">→</div>
        </div>

        <!-- Ambulance -->
        <div onclick="filterCategory('ambulance')" class="service-card-img cursor-pointer bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between text-left col-span-2 sm:col-span-1">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-100 flex items-center justify-center mb-4 p-2 shadow-inner border border-rose-100">
            <img src="https://img.icons8.com/color/96/ambulance.png" alt="Ambulance" class="w-10 h-10 object-contain">
          </div>
          <div><h3 class="font-extrabold text-sm text-slate-900">Ambulance</h3><p class="text-[11px] text-slate-500 mt-1 leading-tight">24/7 ambulance service</p></div>
          <div class="mt-5 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">→</div>
        </div>
      </div>
    </section>

    <!-- 3. HEALTHCARE NEAR YOU (TABBED 4 CARDS) -->
    <section class="space-y-5">
      <div class="flex items-end justify-between">
        <div class="text-left">
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">Healthcare Near You</h2>
        </div>
        <button onclick="openNearYouDirectory()" 
                class="text-xs font-bold text-[#ad0b0e] hover:underline flex items-center gap-1">View All →</button>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button data-tab="bloodbank" onclick="switchNearYouTab('bloodbank')" class="near-you-tab-btn px-4 py-2 border-b-2 border-[#ad0b0e] text-[#ad0b0e] font-bold text-xs">Top Blood Banks</button>
        <button data-tab="clinic" onclick="switchNearYouTab('clinic')" class="near-you-tab-btn px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs">Best Clinics</button>
        <button data-tab="diagnostic" onclick="switchNearYouTab('diagnostic')" class="near-you-tab-btn px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs">Popular Diagnostics</button>
        <button data-tab="hospital" onclick="switchNearYouTab('hospital')" class="near-you-tab-btn px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs">Hospitals</button>
        <button data-tab="offers" onclick="switchNearYouTab('offers')" class="near-you-tab-btn px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs">Offers &amp; Availability</button>
      </div>

      <div id="nearYouCardsContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>
    </section>

    <!-- 4. DISCOVER HEALTHCARE AROUND YOU (FULL-WIDTH BILLBOARD BANNER) -->
    <section class="relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[260px] flex items-center justify-between p-6 sm:p-10 text-white shadow-md"
             style="background: linear-gradient(90deg, rgba(7, 17, 38, 0.92) 0%, rgba(7, 17, 38, 0.70) 50%, rgba(7, 17, 38, 0.85) 100%), url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;">
      <div class="relative z-10 max-w-xl text-left space-y-3">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-white drop-shadow">
          Discover Healthcare Around You
        </h2>
        <p class="text-xs sm:text-sm text-slate-200 max-w-md">
          Find hospitals, clinics, doctors and diagnostic services across India.
        </p>
        <div class="pt-2">
          <button onclick="navigateTo('discovery')" class="px-6 py-3 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-bold rounded-xl shadow-lg transition">
            Explore Now →
          </button>
        </div>
      </div>
      <div class="hidden md:flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-200">
        📍 24/7 Verified Health Map
      </div>
    </section>

    <!-- 5. BOOK HEALTHCARE SERVICES (OPD / UPD) (EXACT SCREENSHOT 2) -->
    <section class="space-y-4">
      <div class="flex items-end justify-between">
        <div class="text-left">
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">Book Healthcare Services (OPD / UPD)</h2>
        </div>
        <button onclick="filterCategory('hospital')" class="text-xs font-bold text-[#ad0b0e] hover:underline flex items-center gap-1">View All →</button>
      </div>

      <div class="relative">
        <button onclick="slideOpdCarousel(-1)" class="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:text-black flex items-center justify-center transition font-bold" aria-label="Previous">
          ❮
        </button>

        <div id="opdCardsCarousel" class="flex gap-4 overflow-hidden"></div>

        <button onclick="slideOpdCarousel(1)" class="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:text-black flex items-center justify-center transition font-bold" aria-label="Next">
          ❯
        </button>
      </div>

      <div id="opdDots" class="flex justify-center items-center gap-1.5 pt-2"></div>
    </section>

    <!-- 6. WHAT OUR USERS SAY + LIST YOUR CARE (RIGHT SIDE) -->
    <section class="space-y-4">
      <div class="text-left">
        <h2 class="text-xl sm:text-2xl font-black text-slate-900">What Our Users Say</h2>
        <p class="text-xs text-slate-500 mt-0.5">Real stories. Real trust.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div class="lg:col-span-6">${marketplaceReviews.length ? renderTalkReviewItem(marketplaceReviews[0]) : '<div class="h-full bg-white border border-slate-200 rounded-3xl p-6 text-sm text-slate-500">Patient reviews will appear here when providers publish them.</div>'}</div>

        <div class="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
          <div class="space-y-2 z-10 max-w-sm">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-[#ffb3b5]">As seen on missinguniya</span>
            <h3 class="text-lg sm:text-xl font-bold leading-snug">SAINO – Making Healthcare More Accessible</h3>
            <p class="text-xs text-slate-300 leading-relaxed">Are you a Doctor, Clinic or Hospital? List your care facility to reach patients directly.</p>
            <div class="pt-2 flex flex-wrap gap-2.5">
              <a href="list_your _care/list-your-care.html" class="inline-flex items-center gap-2 px-4 py-2 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-bold rounded-xl shadow-md transition">
                <span>List Your Care Facility</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </a>
              <button onclick="navigateTo('discovery')" class="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition">
                <span>Explore Providers</span> <span>▶</span>
              </button>
            </div>
          </div>

          <div class="w-full sm:w-44 h-32 rounded-2xl overflow-hidden relative border border-white/20 shrink-0">
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80" alt="Video Review" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-white/90 text-[#ad0b0e] flex items-center justify-center font-bold pl-0.5 shadow-lg">▶</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
window.openDiagnosticPackageBooking = function(packageId) {
  const packages = (window.SAINO_DATA && window.SAINO_DATA.diagnosticPackages) || [];
  const pkg = packages.find(item => String(item.id) === String(packageId));
  if (!pkg) {
    showToast("This diagnostic package is no longer available.");
    return;
  }

  const packageProviders = { "pkg-1": "prov-3", "pkg-2": "prov-10" };
  const partnerId = packageProviders[String(pkg.id)];
  window.BOOKING_STATE.bookingType = "diagnostic-package";
  window.BOOKING_STATE.packageTitle = pkg.title;
  window.BOOKING_STATE.packageTests = pkg.testsCount;
  window.BOOKING_STATE.fee = pkg.discountedPrice;
  window.BOOKING_STATE.hospitalName = pkg.hospital;
  window.BOOKING_STATE.providerId = partnerId || "";
  window.BOOKING_STATE.location = "Partner location will be confirmed";
  window.captureProviderReturnView();
  window.openAppointmentBooking(partnerId || "", pkg.title, "Diagnostic Package");
};


// Render Horizontal Clinic Card
function renderHorizontalClinicCard(c) {
  const clinicProfileId = String(c.id || c.name || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
    <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row gap-4">
      <button type="button" onclick="openProviderProfile('${clinicProfileId}')" aria-label="Open ${c.name} profile" class="w-full sm:w-36 h-32 sm:h-auto rounded-xl overflow-hidden bg-saino-gray-100 flex-shrink-0 relative">
        <img src="${c.image}" alt="${c.name}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-saino-red text-white shadow-xs">
          ${c.badge || 'SAINO Verified (VIP)'}
        </span>
      </button>
      <div class="flex-1 flex flex-col justify-between text-xs">
        <div>
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-bold text-saino-gray-900 leading-tight">
              <button type="button" onclick="openProviderProfile('${clinicProfileId}')" class="text-left hover:text-saino-red">${c.name}</button>
            </h4>
          </div>
          <div class="flex items-center space-x-1 text-amber-500 font-bold text-xs mb-1.5">
            <span>⭐</span>
            <span class="text-saino-gray-900">${c.rating}</span>
            <button type="button" onclick="openProviderReviews('${clinicProfileId}')" class="text-saino-gray-400 font-normal hover:text-saino-red hover:underline">(${c.reviews} Reviews)</button>
          </div>
          <div class="text-[11px] text-saino-gray-600 mb-1">
            <strong class="text-saino-gray-800">${c.doctor || c.special || 'Specialist Consultant'}</strong>
          </div>
          <div class="text-[11px] text-saino-gray-500 flex items-center mb-2">
            <i data-lucide="map-pin" class="w-3 h-3 mr-1 text-saino-red flex-shrink-0"></i>
            <span class="truncate">${c.area || 'India'}</span>
          </div>
        </div>
        <div class="pt-2 border-t border-saino-gray-100 flex items-center justify-between">
          <button type="button" onclick="openAppointmentBooking('${clinicProfileId}')" class="px-3.5 py-1.5 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-lg text-[11px] transition shadow-xs">
            Book appointment
          </button>
          <button type="button" onclick="openProviderProfile('${clinicProfileId}')" class="text-red-700 hover:text-red-900 font-semibold text-[11px] flex items-center space-x-0.5">
            <span>View Profile</span>
            <i data-lucide="chevron-right" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render Patient Review in Right Column (Talk of the Town)
function renderTalkReviewItem(t, idx) {
  const cleanValue = value => {
    const text = String(value || '').trim();
    return text && !['undefined', 'null'].includes(text.toLowerCase()) ? text : '';
  };
  const author = cleanValue(t.author) || cleanValue(t.user) || 'Patient';
  const reviewText = cleanValue(t.body) || cleanValue(t.text) || cleanValue(t.comment) || cleanValue(t.title) || 'Patient rating shared.';
  const providerName = cleanValue(t.provider) || cleanValue(t.hospitalName) || 'Healthcare provider';
  const rating = Number(t.rating) > 0 ? Math.min(5, Number(t.rating)) : 5;

  return `
    <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 shadow-xs hover:shadow-md transition text-xs">
      <div class="flex items-center space-x-3 mb-2">
        ${window.renderUserProfileIcon("w-8 h-8", "text-[10px] shadow-xs", "", author)}
        <div class="truncate flex-1">
          <strong class="text-saino-gray-900 block font-bold text-xs truncate">${escapeCommunityText(author)}</strong>
          <div class="flex items-center space-x-1 text-amber-500 text-[10px]">
            <span>${'★'.repeat(Math.max(0, Math.min(5, Math.round(rating))))}${'☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(rating))))}</span>
            <span class="text-saino-gray-400">· ${rating.toFixed(1)}</span>
          </div>
        </div>
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          Community review
        </span>
      </div>
      <p class="text-saino-gray-600 text-[11px] italic leading-relaxed mb-2">
        "${escapeCommunityText(reviewText)}"
      </p>
      <div class="text-[10px] text-saino-gray-400 flex items-center justify-between pt-1 border-t border-saino-gray-100">
        <span>Care at: <strong class="text-saino-gray-700">${escapeCommunityText(providerName)}</strong
        <button onclick="showToast('Liked review!')" class="text-saino-red font-bold hover:underline">
          ♥ Helpful
        </button>
      </div>
    </div>
  `;
}

// Render Patient Story Card (Horizontal 3-card Showcase)
function renderPatientStoryCard(s) {
  return `
    <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-1 text-amber-500 text-sm">
            <span>★★★★★</span>
          </div>
          <span class="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Verified Patient
          </span>
        </div>
        <h4 class="text-sm font-bold text-saino-gray-900 mb-2 leading-snug">${s.title}</h4>
        <p class="text-xs text-saino-gray-600 mb-4 leading-relaxed italic">"${s.body}"</p>
      </div>
      <div class="pt-3 border-t border-saino-gray-100 flex items-center justify-between text-xs">
        <div>
          <strong class="text-saino-gray-900 block font-bold">${s.author}</strong>
          <span class="text-[11px] text-saino-gray-500">${s.role} · <span class="text-saino-red font-semibold">${s.provider}</span></span>
        </div>
      </div>
    </div>
  `;
}

// Render Diagnostic Package Card
function renderDiagnosticPackageCard(pkg) {
  const safePackageId = String(pkg.id || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
    <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-saino-red/10 text-saino-red-dark border border-saino-red/20">
            ${pkg.badge}
          </span>
          <span class="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            ${pkg.discount}
          </span>
        </div>
        <h4 class="text-base font-bold text-saino-gray-900 mb-2 leading-snug">${pkg.title}</h4>
        <p class="text-xs text-saino-gray-600 mb-4 leading-relaxed">${pkg.testsCount}</p>
        <div class="text-xs text-saino-gray-400 mb-4">
          Partner: <strong class="text-saino-gray-700">${pkg.hospital}</strong>
        </div>
      </div>
      <div class="pt-4 border-t border-saino-gray-100 flex items-center justify-between">
        <div>
          <span class="text-xs text-saino-gray-400 line-through block">${pkg.originalPrice}</span>
          <strong class="text-base font-black text-saino-gray-900">${pkg.discountedPrice}</strong>
        </div>
        <button type="button" onclick="openDiagnosticPackageBooking('${safePackageId}')" class="px-4 py-2 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl text-xs transition shadow-xs">
          BOOK NOW
        </button>
      </div>
    </div>
  `;
}

// Render Individual Provider Card (Matching Exact Layout from Screenshot & Figma)
window.captureProviderReturnView = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!main) return false;
  const hero = document.getElementById("heroHomeSection");
  const snapshot = {
    html: main.innerHTML,
    scrollY: window.scrollY,
    heroDisplay: hero ? hero.style.display : "",
    historyState: history.state,
    url: window.location.href,
    activeView: AppState.activeView
  };
  const stack = window.__sainoProviderReturnStack || (window.__sainoProviderReturnStack = []);
  const top = stack[stack.length - 1];
  if (!top || top.activeView !== snapshot.activeView || top.url !== snapshot.url) stack.push(snapshot);
  window.__sainoProviderReturnView = snapshot;
  return true;
};

window.returnToProviderSource = function(fromPopState = false) {
  const stack = window.__sainoProviderReturnStack || [];
  if (!fromPopState && stack.length && ['provider-profile', 'appointment-booking', 'provider-reviews'].includes(history.state?.view)) {
    history.back();
    return;
  }
  const previous = stack.pop() || window.__sainoProviderReturnView;
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!previous || !main) {
    navigateTo("marketplace");
    return;
  }
  main.innerHTML = previous.html;
  window.__sainoProviderReturnView = stack[stack.length - 1] || null;
  AppState.activeView = previous.activeView || AppState.activeView;
  const routeStack = window.__sainoViewHistory || [];
  const sourceIndex = routeStack.lastIndexOf(AppState.activeView);
  if (sourceIndex >= 0) routeStack.length = sourceIndex + 1;
  history.replaceState(previous.historyState, '', previous.url);
  const hero = document.getElementById("heroHomeSection");
  if (hero) hero.style.display = previous.heroDisplay;
  if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  if (typeof window.updateSavedHearts === "function") window.updateSavedHearts();
  window.scrollTo({ top: previous.scrollY, behavior: "instant" });
};

window.captureServiceReturnView = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!main) return false;
  const hero = document.getElementById("heroHomeSection");
  window.__sainoServiceReturnView = {
    html: main.innerHTML,
    scrollY: window.scrollY,
    activeView: typeof AppState !== "undefined" ? AppState.activeView : "",
    heroDisplay: hero ? hero.style.display : ""
  };
  return true;
};

window.returnToServiceSource = function() {
  const previous = window.__sainoServiceReturnView;
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!previous || !main) {
    navigateTo("marketplace");
    return;
  }
  main.innerHTML = previous.html;
  window.__sainoServiceReturnView = null;
  if (previous.activeView && typeof AppState !== "undefined") {
    AppState.activeView = previous.activeView;
    history.replaceState({ view: previous.activeView }, "", window.location.href.split("#")[0] + "#" + previous.activeView);
    document.querySelectorAll("[data-nav]").forEach(link => {
      const isActive = link.getAttribute("data-nav") === previous.activeView;
      link.classList.toggle("nav-active", isActive);
      link.classList.toggle("text-slate-700", !isActive);
    });
    document.querySelectorAll("[data-bottom-btn]").forEach(button => {
      button.style.color = button.getAttribute("data-bottom-btn") === previous.activeView ? "#B91C1C" : "#64748b";
    });
  }
  const hero = document.getElementById("heroHomeSection");
  if (hero) hero.style.display = previous.heroDisplay;
  if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  if (typeof window.updateSavedHearts === "function") window.updateSavedHearts();
  window.scrollTo({ top: previous.scrollY, behavior: "instant" });
};

window.renderSainoTierBadge = function(provider, compact = false) {
  const verificationStatus = provider && provider.verification_status;
  if ((verificationStatus && verificationStatus !== "verified") || (provider && provider.verified === false)) {
    return "";
  }
  const tier = String(provider && (provider.plan || provider.verification || provider.verificationTier || provider.badgeType) || "listed").toLowerCase();
  const size = compact
    ? "gap-1 px-2 py-0.5 text-[10px]"
    : "gap-1.5 px-3 py-1 text-xs";
  const iconSize = compact ? "w-3.5 h-3.5" : "w-4 h-4";

  if (tier === "vvip") {
    return `<span class="inline-flex items-center ${size} rounded-full font-black bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md"><i data-lucide="award" class="${iconSize} text-amber-300"></i><span>🏆 SAINO VVIP</span></span>`;
  }
  if (tier === "vip" || tier === "saino_pro" || tier === "pro") {
    return `<span class="inline-flex items-center ${size} rounded-full font-black bg-gradient-to-r from-amber-500 to-amber-600 text-saino-gray-950 shadow-md"><i data-lucide="crown" class="${iconSize}"></i><span>SAINO Verified (VIP)</span></span>`;
  }
  if (tier === "prime" || tier === "verified" || tier === "saino_prime" || tier === "vvip") {
    return `<span class="inline-flex items-center ${size} rounded-full font-black bg-emerald-600 text-white shadow-md"><i data-lucide="badge-check" class="${iconSize}"></i><span>SAINO VVIP</span></span>`;
  }
  return `<span class="inline-flex items-center ${size} rounded-full font-black bg-saino-gray-800 text-white shadow-md"><i data-lucide="compass" class="${iconSize}"></i><span>SAINO Discovery</span></span>`;
};

window.openProviderByName = function(providerName, categoryHint) {
  const providers = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const queryWords = normalize(providerName).split(/\s+/).filter(word =>
    word.length > 2 && !["hospital", "blood", "bank", "service", "center", "centre"].includes(word)
  );
  const match = providers
    .map(provider => {
      const name = normalize(provider.name);
      const score = queryWords.reduce((total, word) => total + (name.includes(word) ? 1 : 0), 0);
      const categoryMatch = String(provider.category || "").toLowerCase() === String(categoryHint || "").toLowerCase();
      return { provider, score, categoryMatch };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.categoryMatch) - Number(a.categoryMatch))[0];

  if (match) {
    window.openProviderProfile(match.provider.id || match.provider.name);
  } else if (categoryHint) {
    filterCategory(categoryHint);
  } else {
    showToast("We couldn't find this provider's profile.");
  }
};

window.openLeadDoctorProfile = function(providerId, doctorName, doctorRole) {
  window.openAppointmentBooking(providerId, doctorName, doctorRole);
};

window.openDoctorOpdBooking = function(doctorId) {
  const doctors = (window.SAINO_DATA && window.SAINO_DATA.onlineDoctors) || [];
  const doctor = doctors.find(item => String(item.id) === String(doctorId));
  if (!doctor) {
    showToast("We couldn't find this doctor's booking details.");
    return;
  }

  const providers = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const hospitalName = normalize(doctor.hospital);
  const provider = providers.find(item => {
    const providerName = normalize(item.name);
    return providerName === hospitalName ||
      providerName.includes(hospitalName) ||
      hospitalName.includes(providerName) ||
      (hospitalName.includes("norvic") && providerName.includes("norvic"));
  });

  window.openAppointmentBooking(
    provider ? provider.id : doctor.hospital,
    doctor.name,
    doctor.role,
    doctor.fee
  );
};

function getLeadDoctorImage(provider) {
  if (provider.leadDoctorImage || provider.doctorImage) {
    return provider.leadDoctorImage || provider.doctorImage;
  }

  const femaleDoctorNames = ['Smriti', 'Manisha', 'Radhika', 'Anjali', 'Rita'];
  const leadDoctorName = String(provider.leadDoctor || '');
  const isFemaleDoctor = femaleDoctorNames.some(name =>
    new RegExp(`\\b${name}\\b`, 'i').test(leadDoctorName)
  );
  const availableDoctors = (window.SAINO_DATA && window.SAINO_DATA.onlineDoctors) || [];
  const maleImages = ['doc-1', 'doc-3', 'doc-5']
    .map(id => availableDoctors.find(doctor => doctor.id === id))
    .filter(doctor => doctor && doctor.image)
    .map(doctor => doctor.image);
  const femaleDoctorImage = availableDoctors.find(doctor => doctor.id === 'doc-4');
  const femaleImages = [
    'assets/doctor2.jpg',
    ...(femaleDoctorImage && femaleDoctorImage.image ? [femaleDoctorImage.image] : [])
  ];
  const images = isFemaleDoctor ? femaleImages : maleImages;
  const firstName = leadDoctorName.replace(/^Dr\.?\s*/i, '').split(/\s+/)[0] || leadDoctorName;
  const nameHash = [...firstName.toLowerCase()].reduce((total, character) => total + character.charCodeAt(0), 0);
  return images.length ? images[nameHash % images.length] : 'assets/doctor2.jpg';
}

function renderProviderCard(p) {
const badgeHtml = window.renderSainoTierBadge(p);
const profileTargetId = p.id || p.name || '';
const safeProfileTargetId = String(profileTargetId).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const cardKey = String(profileTargetId).replace(/[^a-zA-Z0-9_-]/g, "-");
const doctorImage = getLeadDoctorImage(p);
const departments = Array.isArray(p.departments) ? p.departments : [];
const extraDepartments = departments.slice(3);
const safeDoctorName = String(p.leadDoctor || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " ");
const safeDoctorRole = String(p.leadDoctorRole || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " ");

 const categoryObj = window.SAINO_DATA.categories.find(c => c.id === p.category);
  const categoryName = categoryObj ? categoryObj.name : p.category;

  return `
    <div class="provider-card bg-white rounded-3xl border border-saino-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="relative h-48 sm:h-52 w-full bg-saino-gray-100 overflow-hidden">
          <button type="button" onclick="openProviderProfile('${safeProfileTargetId}')" aria-label="Open ${p.name} profile" class="absolute inset-0 z-0 block w-full p-0 border-0 bg-transparent cursor-pointer">
            <img src="${p.cover_image_url || p.image || p.logo_url || p.logo || 'assets/logo.png'}" alt="${p.name}" class="w-full h-full object-cover">
          </button>
          <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
          
          <!-- Top Badge & Category (Exact Match to User Screenshot) -->
          <div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
            <div>${badgeHtml}</div>
            <span class="px-3 py-1 rounded-xl text-xs font-bold bg-white text-saino-gray-800 shadow-md backdrop-blur-sm">
              ${categoryName}
            </span>
          </div>

          <!-- Bottom Title on Image with Location and Logo Thumbnail -->
          <div class="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between z-10">
            <div class="text-white max-w-[75%]">
              <h3 class="text-base sm:text-lg font-black leading-tight drop-shadow">
                <button type="button" onclick="openProviderProfile('${safeProfileTargetId}')" class="text-left">${p.name}</button>
              </h3>
              <p class="text-xs text-sky-200 flex items-center mt-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1 text-sky-400 flex-shrink-0"></i>
                <span class="truncate">${p.location}</span>
              </p>
            </div>
            <!-- Provider Logo Thumbnail -->
            <div class="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0 overflow-hidden border border-white">
              <img src="${p.logo || p.logo_url || 'assets/logo.png'}" alt="${p.name} logo" class="w-full h-full object-contain rounded-xl">
            </div>
          </div>
        </div>

        <!-- Provider Metrics & Details -->
        <div class="p-5 space-y-4">
          <!-- Rating & Engagement Stats Row -->
          <div class="flex items-center justify-between text-xs pb-3 border-b border-saino-gray-100">
            <div class="flex items-center space-x-1 text-amber-500 font-extrabold text-sm">
              <span>⭐</span>
              <span class="text-saino-gray-900">${Number(p.rating || 0)}</span>
              <button type="button" onclick="openProviderReviews('${safeProfileTargetId}')" class="text-saino-gray-400 font-medium text-xs hover:text-saino-red hover:underline">(${p.reviewsCount} Reviews)</button>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <span class="flex items-center space-x-1 text-saino-gray-600 font-semibold">
                <span class="text-saino-red">♥</span>
                <span>${(p.likesCount).toLocaleString()}</span>
              </span>
              <span class="flex items-center space-x-1 text-sky-700 font-semibold">
                <span class="text-sky-500">👥</span>
                <span>${p.interestedCount} Interested</span>
              </span>
            </div>
          </div>

          <!-- Lead Specialist / Doctor Card (Pill Container) -->
          ${p.leadDoctor ? `
            <div class="bg-saino-gray-50 p-3 rounded-2xl border border-saino-gray-100 flex items-center space-x-3">
              <button type="button" onclick="openLeadDoctorProfile('${safeProfileTargetId}', '${safeDoctorName}', '${safeDoctorRole}')" aria-label="Book an appointment with ${p.leadDoctor}" class="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500">
                <img src="${doctorImage}" alt="${p.leadDoctor}" class="w-10 h-10 rounded-full object-cover">
              </button>
              <div class="text-xs truncate">
                <button type="button" onclick="openLeadDoctorProfile('${safeProfileTargetId}', '${safeDoctorName}', '${safeDoctorRole}')" aria-label="Book an appointment with ${p.leadDoctor}" class="font-extrabold text-saino-gray-900 block truncate text-xs sm:text-sm leading-snug text-left">${p.leadDoctor}</button>
                <span class="text-[11px] text-saino-gray-500 truncate block mt-0.5">${p.leadDoctorRole}</span>
              </div>
            </div>
          ` : ''}

          <!-- Departments / Services Tags -->
          <div>
            <span class="text-xs font-bold text-saino-gray-500 block mb-2">Departments / Services:</span>
            <div class="flex flex-wrap gap-1.5">
              ${departments.slice(0, 3).map(dept => `
                <span class="px-3 py-1 bg-sky-50 text-slate-900 border border-sky-100 text-xs font-semibold rounded-xl">
                  ${dept}
                </span>
              `).join('')}
              ${extraDepartments.length ? `
                <span id="home-extra-${cardKey}" class="hidden flex-wrap gap-1.5">
                  ${extraDepartments.map(dept => `<span class="px-3 py-1 bg-sky-50 text-slate-900 border border-sky-100 text-xs font-semibold rounded-xl">${dept}</span>`).join('')}
                </span>
                <button type="button" id="home-more-${cardKey}" data-label="+${extraDepartments.length} more" onclick="toggleHomeDepartments('${cardKey}')" class="px-2 py-1 bg-saino-gray-100 text-saino-gray-500 text-xs font-bold rounded-xl hover:bg-saino-gray-200">
                  +${extraDepartments.length} more
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Opening Hours & Phone -->
          <div class="text-xs text-saino-gray-600 space-y-1.5 pt-1">
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-saino-gray-400 flex-shrink-0"></i>
              <span class="truncate font-medium">${p.openingHours}</span>
            </div>
            ${p.showPhone ? `
              <div class="flex items-center space-x-2">
                <i data-lucide="phone" class="w-4 h-4 text-saino-gray-400 flex-shrink-0"></i>
                <span class="font-semibold text-saino-gray-800">${p.phone}</span>
              </div>
            ` : `
              <div class="flex items-center space-x-2 text-saino-gray-400 text-[11px]">
                <i data-lucide="shield-alert" class="w-4 h-4 flex-shrink-0"></i>
                <span>Direct Triage via SAINO WhatsApp</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Action Buttons & Large WhatsApp Booking CTA -->
      <div class="p-5 pt-0 space-y-3">
        <!-- Interactive Engagement Row (Like, Interested, View Profile) -->
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs py-2 border-t border-saino-gray-100">
          <button onclick="toggleLike('${p.id}')" class="flex items-center space-x-1 transition font-bold ${p.isLiked ? 'text-saino-red' : 'text-saino-gray-600 hover:text-saino-red'}">
            <span>${p.isLiked ? '❤️' : '♡'}</span>
            <span>${p.isLiked ? 'Liked' : 'Like'}</span>
          </button>

          <button onclick="toggleInterested('${p.id}')" class="flex items-center space-x-1 transition font-bold ${p.isInterested ? 'text-sky-600' : 'text-saino-gray-600 hover:text-sky-600'}">
            <span>${p.isInterested ? '★' : '☆'}</span>
            <span>${p.isInterested ? 'Interested' : 'Mark Interested'}</span>
          </button>

          ${typeof savedHeartButton === "function" ? savedHeartButton(profileTargetId, "p-1") : ""}

          <button type="button" onclick="openProviderProfile('${safeProfileTargetId}')" class="text-red-700 hover:text-red-900 font-extrabold flex items-center space-x-0.5">
            <span>View Profile</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Direct appointment booking -->
        <button type="button" onclick="openAppointmentBooking('${safeProfileTargetId}')" class="w-full py-3 px-4 rounded-2xl bg-saino-red hover:bg-saino-red-dark text-white text-xs sm:text-sm font-black flex items-center justify-center space-x-2 transition shadow-md hover:shadow-lg">
          <i data-lucide="calendar-check" class="w-4 h-4"></i>
          <span>Book appointment</span>
        </button>
      </div>
    </div>
  `;
}
// 1.5 PROMOTIONAL HEALTHCARE CAMPAIGNS & BIG SCREEN SHOWCASE VIEW
// ==========================================
function renderCampaignsView() {
  const campaigns = window.SAINO_DATA.bigScreenCampaigns || [];
  const currentCamp = campaigns[AppState.activeBigScreenIndex] || campaigns[0];
  const mode = AppState.bigScreenDisplayMode || 'billboard';

  return `
    <div class="max-w-6xl mx-auto mb-16">
      
      <!-- Top Title & Description -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-saino-red/10 border border-saino-red/20 text-saino-red-dark text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="tv" class="w-4 h-4 text-saino-red"></i>
          <span class="uppercase tracking-wider">BIG SCREEN HEALTHCARE SHOWCASE · NEPAL</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-saino-gray-900 tracking-tight leading-tight mb-3">
          Promotional Campaigns & Big Screen Displays
        </h1>
        <p class="text-sm sm:text-base text-saino-gray-600 max-w-3xl mx-auto leading-relaxed">
          Explore prominent healthcare awareness campaigns, super-speciality checkup drives, emergency bloodlines, and group health insurance schemes verified by SAINO HEALTH.
        </p>
      </div>

      <!-- Display Mode Selector & Controls -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-saino-gray-200 shadow-sm">
        <div class="flex items-center space-x-2 text-xs font-bold text-saino-gray-600">
          <i data-lucide="monitor" class="w-4 h-4 text-saino-red"></i>
          <span>Display Mode:</span>
          <div class="inline-flex rounded-xl p-1 bg-saino-gray-100 border border-saino-gray-200 text-xs">
            <button onclick="setBigScreenMode('billboard')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'billboard' ? 'bg-saino-gray-900 text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              Digital Billboard (16:9)
            </button>
            <button onclick="setBigScreenMode('spotlight')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'spotlight' ? 'bg-saino-red text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              Spotlight Card
            </button>
            <button onclick="setBigScreenMode('mobile')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              App Takeover Screen
            </button>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-xs text-saino-gray-500 font-medium hidden sm:inline">Auto-Sliding Active</span>
          <button onclick="prevBigScreenCampaign()" class="p-2 rounded-xl bg-saino-gray-100 hover:bg-saino-gray-200 text-saino-gray-700 transition" title="Previous Campaign">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <span class="text-xs font-bold text-saino-gray-700 px-2">
            ${AppState.activeBigScreenIndex + 1} / ${campaigns.length}
          </span>
          <button onclick="nextBigScreenCampaign()" class="p-2 rounded-xl bg-saino-gray-100 hover:bg-saino-gray-200 text-saino-gray-700 transition" title="Next Campaign">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- BIG SCREEN DISPLAY UNIT -->
      <div class="mb-12">
        <div class="big-screen-frame overflow-hidden relative text-white shadow-2xl p-4 sm:p-6 md:p-8">
          
          <!-- Inner Billboard Container with Dynamic Background -->
          <div class="relative rounded-2xl overflow-hidden min-h-[420px] md:min-h-[460px] flex flex-col justify-between p-6 md:p-10"
               style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%), url('${currentCamp.bannerImage}') center/cover no-repeat;">
            
            <!-- Screen Glare Effect -->
            <div class="absolute inset-0 screen-glare pointer-events-none"></div>

            <!-- Top Header on Big Screen -->
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/15">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-xl bg-white p-1 shadow-lg overflow-hidden border border-white/50 flex-shrink-0">
                  <img src="${currentCamp.sponsorLogo}" alt="Sponsor" class="w-full h-full object-cover rounded-lg">
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-white tracking-wide">${currentCamp.sponsor}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-saino-red text-white shadow-sm">
                      ${currentCamp.sponsorTier}
                    </span>
                  </div>
                  <span class="text-[11px] text-rose-300 font-bold uppercase tracking-widest block mt-0.5">
                    ${currentCamp.tag}
                  </span>
                </div>
              </div>

              <!-- Discount & Validity Badge -->
              <div class="flex items-center space-x-2">
                <span class="px-3 py-1 rounded-xl text-xs font-black bg-amber-400 text-saino-gray-950 shadow-md">
                  ★ ${currentCamp.discountBadge}
                </span>
                <span class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 text-saino-gray-200 border border-white/20">
                  ${currentCamp.validTill}
                </span>
              </div>
            </div>

            <!-- Middle Headline & Key Statistics -->
            <div class="relative z-10 my-6 max-w-3xl">
              <div class="inline-block px-2.5 py-0.5 rounded bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-rose-300 mb-2">
                ${currentCamp.tagline}
              </div>
              <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-md">
                ${currentCamp.title}
              </h2>
              <p class="text-xs sm:text-sm md:text-base text-saino-gray-200 leading-relaxed mb-6">
                ${currentCamp.subtitle}
              </p>

              <!-- Live KPI Stat Pills -->
              <div class="grid grid-cols-3 gap-3 mb-6 max-w-lg">
                ${currentCamp.stats.map(s => `
                  <div class="bg-black/40 backdrop-blur-md border border-white/15 p-2.5 rounded-xl text-center">
                    <span class="text-xs sm:text-sm font-black text-rose-400 block">${s.val}</span>
                    <span class="text-[10px] text-saino-gray-300 font-medium block truncate">${s.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Perks Checklist -->
              <ul class="space-y-1.5 text-xs text-saino-gray-100 mb-6">
                ${currentCamp.highlights.map(h => `
                  <li class="flex items-center space-x-2">
                    <span class="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                    <span>${h}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Bottom Big Screen Actions -->
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
              <div class="flex flex-wrap items-center gap-3">
                <button onclick="openCustomWhatsApp('${currentCamp.title}', '${currentCamp.whatsappMsg}')" class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl transition flex items-center space-x-2">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  <span>Book Campaign Offer via WhatsApp</span>
                </button>
                <button onclick="navigateTo('marketplace')" class="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition border border-white/20">
                  Explore Related Providers
                </button>
              </div>

              <!-- Screen Indicator Tabs -->
              <div class="flex items-center space-x-1.5">
                ${campaigns.map((c, idx) => `
                  <button onclick="setBigScreenCampaign(${idx})" 
                    class="h-2.5 rounded-full transition-all ${idx === AppState.activeBigScreenIndex ? 'w-8 bg-rose-500 shadow-md' : 'w-2.5 bg-white/40 hover:bg-white/70'}"
                    title="${c.title}">
                  </button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

        <!-- Big Screen Stand Aesthetic -->
        <div class="big-screen-stand hidden md:block"></div>
        <div class="big-screen-base hidden md:block"></div>
      </div>

      <!-- Quick Selector Thumbnails for all 6 Campaigns -->
      <div class="mb-14">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base md:text-lg font-bold text-saino-gray-900">Featured Mega Campaigns in Nepal</h3>
          <span class="text-xs text-saino-gray-500">Click any card to load on Big Screen</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${campaigns.map((camp, idx) => {
            const isActive = idx === AppState.activeBigScreenIndex;
            return `
              <div onclick="setBigScreenCampaign(${idx})" 
                class="p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive 
                    ? 'bg-saino-red/10 border-saino-red ring-2 ring-saino-red/20 shadow-md scale-[1.02]' 
                    : 'bg-white border-saino-gray-200 hover:border-saino-gray-300 shadow-xs'
                }">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isActive ? 'bg-saino-red text-white' : 'bg-saino-gray-100 text-saino-gray-600'}">
                      ${camp.tag}
                    </span>
                    <span class="text-[11px] font-bold text-amber-600">${camp.discountBadge}</span>
                  </div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-snug mb-1">${camp.title}</h4>
                  <p class="text-[11px] text-saino-gray-500 line-clamp-2 mb-3">${camp.subtitle}</p>
                </div>
                <div class="pt-2 border-t border-saino-gray-100 flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-saino-gray-700 truncate">${camp.sponsor}</span>
                  <span class="text-saino-red font-bold flex-shrink-0">View Screen →</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- "Advertise on SAINO Big Screen" Promotion Portal (For Hospitals & Advertisers) -->
      <div class="p-6 md:p-10 rounded-3xl bg-gradient-to-r from-saino-gray-900 via-indigo-950 to-saino-gray-900 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-saino-red text-white mb-3">
            FOR HEALTHCARE ADVERTISERS & HOSPITALS
          </span>
          <h3 class="text-xl md:text-3xl font-black mb-2">Launch Your Healthcare Campaign on SAINO Big Screen</h3>
          <p class="text-xs md:text-sm text-saino-gray-300 mb-6 leading-relaxed">
            Reach over 150,000+ monthly patients across Kathmandu Valley with premier billboard takeovers, category top pinning, and direct WhatsApp appointment leads.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-rose-400 block">150,000+</strong>
              <span class="text-xs text-saino-gray-300">Monthly Patient Views</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-emerald-400 block">450+ Leads</strong>
              <span class="text-xs text-saino-gray-300">Avg WhatsApp Inquiries / Mo</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-amber-400 block">#1 Top Rank</strong>
              <span class="text-xs text-saino-gray-300">Category Search Priority</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openCustomWhatsApp('Big Screen Campaign Booking', 'Hi SAINO Advertising Team, I would like to book a Big Screen Healthcare Campaign on SAINO Health.')" class="px-5 py-3 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center space-x-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Book Big Screen Campaign Slot</span>
            </button>
            <button onclick="openUpgradeBadgeModal('saino_prime')" class="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition border border-white/20">
              View Advertising Rates & Tiers
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function setBigScreenCampaign(index) {
  AppState.activeBigScreenIndex = index;
  renderApp();
  const screenEl = document.querySelector('.big-screen-frame');
  if (screenEl) {
    screenEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setBigScreenMode(mode) {
  AppState.bigScreenDisplayMode = mode;
  renderApp();
}

function nextBigScreenCampaign() {
  const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
  AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex + 1) % total;
  renderApp();
}

function prevBigScreenCampaign() {
  const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
  AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex - 1 + total) % total;
  renderApp();
}

function initBigScreenAutoPlay() {
  if (AppState.bigScreenAutoPlayInterval) {
    clearInterval(AppState.bigScreenAutoPlayInterval);
  }
  AppState.bigScreenAutoPlayInterval = setInterval(() => {
    if (AppState.activeView === 'campaigns') {
      const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
      AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex + 1) % total;
      renderApp();
    }
  }, 8000);
}

function bindCampaignsEvents() {}

   // ==========================================
// 2. DISCOVERY VIEW
// ==========================================
  function renderDiscoveryView() {
  const liveProviders = window.AppState?.providers || [];
  const reviewCountFor = provider => Number(provider.reviewsCount ?? provider.reviews_count ?? (Array.isArray(provider.reviews) ? provider.reviews.length : 0)) || 0;
  const providerRecommendation = (a, b) => Number(b.rating || 0) - Number(a.rating || 0) || reviewCountFor(b) - reviewCountFor(a) || String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
  const hospitals = liveProviders.filter(provider => String(provider.category || '').toLowerCase() === 'hospital').sort(providerRecommendation).slice(0, 3);
  const clinics = liveProviders.filter(provider => String(provider.category || '').toLowerCase() === 'clinic').sort(providerRecommendation).slice(0, 3);
  const otherProviders = liveProviders.filter(provider => !['hospital', 'clinic'].includes(String(provider.category || '').toLowerCase()));
  const reviews = liveProviders.flatMap(provider => (Array.isArray(provider.reviews) ? provider.reviews : []).map(review => ({ ...review, provider: provider.name }))).filter(review => review.comment || review.body || review.text || review.title).sort((a, b) => Date.parse(b.date || '') - Date.parse(a.date || ''));
  const discoverySlides = liveProviders.map(provider => {
    const services = Array.isArray(provider.services) ? provider.services : [];
    const doctors = Array.isArray(provider.doctors) ? provider.doctors : [];
    const firstService = services.find(service => service && service.name);
    const detailLines = services.slice(0, 3).map(service => `<li>${service.name}${service.price ? ` INR ${Number(service.price).toLocaleString('en-IN')}` : ''}</li>`).join('');
    return {
      badge: 'LIVE PROVIDER', tier: provider.plan || 'SAINO',
      titleHtml: `${provider.name || 'Healthcare Provider'}`,
      hospital: [provider.name, provider.city || provider.location].filter(Boolean).join(' | '),
      note: provider.description || provider.about || 'Provider profile published on SAINO.',
      middleLabel: 'Services and doctors',
      middleContent: detailLines || `<p>${doctors.length} listed doctor profile(s)</p>`,
      packageName: firstService?.name || 'Provider profile',
      price: firstService?.price ? `INR ${Number(firstService.price).toLocaleString('en-IN')}` : '',
      image: provider.cover_image_url || provider.image || provider.logo_url || provider.logo || ''
    };
  });
  if (!discoverySlides.length) return '<section class="mx-auto max-w-5xl p-10 text-center"><h2 class="text-xl font-bold">Healthcare providers will appear here</h2><p class="mt-2 text-slate-600">No approved provider profiles are currently published.</p></section>';

  window._discoverySlides = discoverySlides;
  if (typeof AppState.discoverySlideIndex === 'undefined') {
    AppState.discoverySlideIndex = 0;
  }

  const s = discoverySlides[AppState.discoverySlideIndex];

  return `
    <div class="w-full mb-16 px-0">  
      <style>
        @media (max-width: 767px) {
          #discoveryCampaignHero {
            height: auto;
            min-height: 390px;
            overflow: hidden;
          }
          #discoveryCampaignHero > .absolute.inset-y-0.right-0 {
            display: none;
          }
          #discoveryCampaignHero .discovery-campaign-layout {
            height: auto;
            min-height: 390px;
            flex-direction: row;
            align-items: center;
          }
          #discoveryCampaignHero .discovery-campaign-layout > div:first-child {
            width: 42%;
            height: clamp(112px, 32vw, 136px);
            flex: 0 0 42%;
            margin: 0;
            padding: 6px 4px 6px 6px;
          }
          #discoveryCampaignHero #discSlideImg {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          #discoveryCampaignHero .discovery-campaign-layout > div:last-child {
            width: auto;
            height: auto;
            min-width: 0;
            flex: 1 1 0;
            overflow: visible;
            padding: 28px 34px 38px 4px;
          }
          #discoveryCampaignHero #discSlideTitle {
            font-size: clamp(11px, 3.3vw, 13px);
            line-height: 1.15;
            overflow-wrap: break-word;
          }
          #discoveryCampaignHero #discSlideHospital {
            font-size: clamp(8px, 2.5vw, 10px);
            line-height: 1.2;
            overflow-wrap: break-word;
          }
          #discoveryCampaignHero #discSlideNote {
            font-size: 8px;
            line-height: 1.2;
          }
          #discoveryCampaignHero .discovery-campaign-layout > div:last-child > div > .mb-3\\.5 {
            margin-bottom: 6px;
          }
          #discoveryCampaignHero #discSlideMiddleLabel,
          #discoveryCampaignHero #discSlidePackageName {
            font-size: 8px;
          }
          #discoveryCampaignHero #discSlidePrice {
            font-size: 9px;
          }
          #discoveryCampaignHero #discSlideMiddleLabel + div {
            font-size: 8px;
          }
          #discoveryCampaignHero #discSlideMiddleBox {
            font-size: 8px;
          }
          #discoveryCampaignHero .discovery-campaign-layout > div:last-child .mb-3\\.5.text-\\[11px\\] {
            min-height: 36px;
            margin-bottom: 6px;
          }
          #discoveryCampaignHero button[aria-label="Next featured campaign"] {
            top: 50%;
            right: 8px;
            width: 28px;
            height: 28px;
            transform: translateY(-50%);
            touch-action: manipulation;
          }
          #nearbyProvidersList,
          #nearbyProvidersList > [data-location][data-category] {
            width: 100%;
            min-width: 0;
          }
          #nearbyProvidersList h4 {
            max-width: 100%;
            min-width: 0;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          #sainoRatedResults > .grid {
            grid-template-columns: minmax(0, 1fr);
          }
          #sainoRatedResults .truncate {
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            overflow-wrap: anywhere;
          }
        }
      </style>
       <section id="discoveryCampaignHero" class="relative overflow-hidden bg-[#0a0f1d] text-white shadow-xl mb-8 border-y border-slate-800 w-full h-[350px] md:h-[530px]">
            <a 
                href="#video-library" 
                onclick="event.preventDefault(); navigateTo('campaigns')"
               class="absolute top-2 right-4 sm:right-6 md:top-8 md:right-12 z-20 inline-flex items-center space-x-1 px-1.5 py-1 md:px-4 md:py-2.5 rounded-md bg-[#334155]/80 border border-slate-400/40 text-slate-200 text-[9px] md:text-xs">
              <svg class="w-3 h-3 sm:w-5 sm:h-5 text-slate-200 shrink-0 stroke-[1.5]" 
                  viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="8" y1="21" x2="16" y2="21" stroke-linecap="round"/>
                <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round"/>
                <polygon points="10 7 15 10 10 13" fill="currentColor" stroke="none"/>
              </svg>

              <span class="text-[8px] sm:text-xs">Video Library</span>

              <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 stroke-[2]" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
        <div class="absolute inset-y-0 right-0 w-[450px] md:w-[610px] bg-gradient-to-l from-slate-800 via-slate-800/60 to-transparent pointer-events-none z-0"></div>
        <div class="discovery-campaign-layout flex flex-row items-stretch h-full">
          <div class="w-[200px] md:w-[400px] md:h-[460px] md:ml-20 h-[300px] mt-[19px] mb-[16px] ml-18 relative overflow-hidden p-2 shrink-0">
            <img 
              id="discSlideImg" 
              src="${s.image}" 
              alt="${s.hospital}" 
              class="w-full h-full object-cover rounded-[12px] select-none"
              style="image-rendering: -webkit-optimize-contrast;"
              loading="eager">
          </div>
          <div class="flex-1 py-2 px-3 md:py-8 md:px-12 flex flex-col justify-center text-left h-full overflow-hidden w-full">
            <div>
               <div class="flex flex-row items-center gap-1 sm:gap-3 mb-1 sm:mb-3">
              <a 
                  href="#featured-campaign" 
                  onclick="navigateTo('marketplace')" 
                  id="discSlideBadge" 
                  class="px-0.5 py-0.5 sm:px-3 sm:py-2 rounded-lg text-[6px] sm:text-xs md:text-[15px] font-bold tracking-wide text-white-600 bg-[#162032] border-2 border-purple-500 hover:border-purple-400 hover:bg-purple-950/40 transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none">
                  ${s.badge || 'FEATURED HEALTH CAMPAIGN'}
                </a>
               <a 
                  href="#vvip-info" 
                  onclick="navigateTo('marketplace')" 
                  id="discSlideTier" 
                  class="px-1 py-0.5 sm:px-3 sm:py-2 rounded-lg text-[8px] sm:text-xs md:text-[15px] font-bold tracking-wide text-white-600 bg-[#162032] border-2 border-purple-500 hover:border-purple-400 hover:bg-purple-950/40 transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none">
                  ${s.tier || 'VVIP'}
                </a>
            </div>

        <h2 id="discSlideTitle" class="mt-1 text-[10px] sm:text-xs md:text-2xl font-extrabold text-white leading-tight mb-1 md:mb-3 drop-shadow-md">
          ${s.titleHtml}
        </h2>

        <h3 id="discSlideHospital" class="mt-1 text-[9px] sm:text-xs md:text-sm font-bold text-white mb-2">
          ${s.hospital || 'Grande International Hospital · Kathmandu'}
        </h3>

        <p id="discSlideNote" class="text-[8px] md:text-xs text-slate-300 max-w-sm leading-tight mb-1 md:mb-3.5">
          ${s.note || ''}
        </p>

        <div class="mb-3.5 text-[11px] text-slate-300 min-h-[72px]">
          <span id="discSlideMiddleLabel" class="text-[10px] text-slate-400 font-medium block mb-1">${s.middleLabel}</span>
          <div id="discSlideMiddleBox">
            ${s.middleContent}
          </div>
        </div>
        
      <div class="mb-3.5 leading-tight">
        <span id="discSlidePackageName" class="text-[10px] text-slate-300 font-medium block mb-0.5">${s.packageName}</span>
        <span id="discSlidePrice" class="text-xs font-bold text-white tracking-wide">${s.price}</span>
        </div>
      </div>
      <div class="flex items-center space-x-2 mt-1 mb-1 z-20">
         <button 
          type="button"
          onclick="triggerCampaignWhatsApp()" 
          class="h-6 px-2 sm:h-8 sm:px-4 rounded-full border border-slate-600 bg-[#152136] hover:bg-[#1c2c47] text-white text-[10px] sm:text-xs font-medium tracking-wide flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer">
         <span class="text-[8px] sm:text-xs">View provider</span>
        </button>

        <button 
          onclick="navigateTo('marketplace')" 
          class="h-6 px-2 sm:h-8 sm:px-4 rounded-full bg-white hover:bg-slate-100 text-[#881337] text-[10px] sm:text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer">
          <span class="text-[8px] sm:text-xs">Browse services</span>
          <span class="text-[10px] sm:text-xs font-black leading-none text-[#881337]">→</span>
        </button>

      </div>
          <p id="discSlideValidity" class="text-[9px] sm:text-xs md:text-sm text-slate-400/60 font-normal tracking-wide mt-1 sm:mt-2 select-none">
            SAINO marketplace provider listing
          </p>
            <button type="button" onclick="window.nextDiscoverySlide()" aria-label="Next featured campaign" class="absolute right-6 sm:right-12 md:right-32 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-white text-black
               flex items-center justify-center shadow-xl z-30"> <svg class="w-3 h-3 sm:w-5 sm:h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
                    
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1 sm:space-x-2 z-30">
              ${discoverySlides.map((_, index) => `<button onclick="goToDiscoverySlide(${index})" class="p-1 cursor-pointer"><span class="disc-dot block rounded-full transition-all duration-300 ${AppState.discoverySlideIndex === index ? 'w-1.5 h-1.5 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}"></span></button>`).join('')}
            </div>
        </div>
      </section>

      <div class="space-y-12 px-4 sm:px-6">
        <section>
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><span class="text-xs font-black uppercase tracking-wider text-saino-red">Patient picks</span><h2 class="mt-1 text-xl font-black text-slate-900">Trending Hospitals</h2><p class="mt-1 text-xs text-slate-500">Suggested from live patient ratings and review activity.</p></div><button onclick="navigateTo('hospital')" class="text-xs font-bold text-saino-red hover:underline">Browse all hospitals →</button></div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${hospitals.map(provider => renderProviderCard(provider)).join('') || '<p class="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No hospital profiles have been published yet. New verified listings will show here.</p>'}</div>
        </section>
        <section>
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><span class="text-xs font-black uppercase tracking-wider text-saino-red">Nearby care</span><h2 class="mt-1 text-xl font-black text-slate-900">Trending Clinics</h2><p class="mt-1 text-xs text-slate-500">Compare clinic profiles, doctors, services and patient reviews.</p></div><button onclick="navigateTo('clinic')" class="text-xs font-bold text-saino-red hover:underline">Browse all clinics →</button></div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${clinics.map(provider => renderProviderCard(provider)).join('') || '<p class="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No clinic profiles have been published yet. New verified listings will show here.</p>'}</div>
        </section>
        ${otherProviders.length ? `<section><div class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><span class="text-xs font-black uppercase tracking-wider text-saino-red">More care options</span><h2 class="mt-1 text-xl font-black text-slate-900">Other Approved Providers</h2><p class="mt-1 text-xs text-slate-500">Live listings for diagnostics, wellness and other services.</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${otherProviders.map(provider => renderProviderCard(provider)).join('')}</div></section>` : ''}
        <section>
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><span class="text-xs font-black uppercase tracking-wider text-saino-red">Community</span><h2 class="mt-1 text-xl font-black text-slate-900">Patient Reviews</h2><p class="mt-1 text-xs text-slate-500">Experiences shared on published provider profiles.</p></div><button onclick="navigateTo('patient')" class="text-xs font-bold text-saino-red hover:underline">Read all reviews →</button></div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${reviews.slice(0, 6).map((review, index) => renderTalkReviewItem(review, index)).join('') || '<p class="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No patient reviews have been published yet.</p>'}</div>
        </section>
      </div>
    <div class="relative overflow-hidden bg-[#0a0f1d] text-white shadow-xl mb-8 
            w-screen -mx-[calc((100vw-100%)/2)] 
            py-10 sm:py-16 px-4 sm:px-12 lg:px-26 
            rounded-none sm:rounded-2xl text-center">
        <div class="relative z-10">
          <!-- Icon -->
          <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#B91C1C] backdrop-blur-sm 
                      flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
            <i data-lucide="message-circle" class="w-5 h-5 sm:w-7 sm:h-7 text-white"></i>
          </div>

          <!-- Heading -->
          <h3 class="text-base sm:text-xl lg:text-2xl font-bold text-white">
            Have a question about a healthcare <br class="hidden sm:block"> provider?
          </h3>

          <!-- Paragraph -->
          <p class="text-xs sm:text-sm lg:text-base text-white/60 mt-2 sm:mt-3 max-w-3xl mx-auto leading-relaxed">
            Ask patients who have been there and get real, experience-based answers from the 
            <br class="hidden sm:block"> Saino Community.
          </p>

          <!-- Button -->
          <button onclick="navigateTo('discussions')"
            class="mt-4 sm:mt-6 px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-[#B91C1C] text-white 
                  text-xs sm:text-sm lg:text-base font-bold rounded-full hover:bg-[#991B1B] 
                  transition shadow-lg inline-flex items-center gap-2">
            <i data-lucide="message-circle" class="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"></i>
            <span>Ask the Community</span>
          </button> 
        </div>
      </div>

  `;
}
window.renderReviewsPage = function() {
  const reviews = (window.AppState?.providers || []).flatMap(provider => (provider.reviews || []).map(review => ({ ...review, provider: provider.name })));
  return `
    <section class="p-6">
      <div class="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">All Patient Reviews</h2>
        <button onclick="returnFromAllReviews()" 
                class="text-xs font-bold text-saino-red hover:underline">
          ← Back to previous page
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-left">
        ${reviews.map(r => renderPatientReviewCard(r)).join('')}
      </div>
    </section>
  `;
};


//for separate page of hospital, clinic ....

function renderProvidersShowcaseView() {
  return renderDiscoveryView();
}
function renderCategoryListView(categoryKey) {
  if (categoryKey === 'hospital') {
  return renderHospitalDirectoryView();
    }
  if (categoryKey === 'homecare') {
    return renderHomecareDirectoryView();
  }
  if (categoryKey === 'ambulance') {
    return renderAmbulanceDirectoryView(); 
  }
  
 const cleanKey = String(categoryKey || '').toLowerCase();
  if (cleanKey.includes('blood')) {
    return renderBloodBankDirectoryView();
  }

  const allProviders = AppState.providers || window.SAINO_DATA.providers || [];
  const filteredItems = allProviders.filter(p => p.category === categoryKey);
  const categoryTitle = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
  let cardsHTML = '';

  if (filteredItems.length === 0) {
    cardsHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200">
        <p class="text-slate-500 text-sm font-semibold">No providers available for ${categoryTitle} right now.</p>
        <button onclick="goBackToPreviousPage()" class="mt-4 px-5 py-2.5 bg-saino-red text-white text-xs font-bold rounded-xl">
          Back to Home
        </button>
      </div>`;
  } else {
    cardsHTML = filteredItems.map(p => renderProviderCard(p)).join('');
  }

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-saino-red">SAINO Directory</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mt-1"> ${categoryTitle}s</h1>
          <p class="text-xs text-slate-500 mt-0.5">Explore verified and trusted ${categoryKey} providers near you.</p>
        </div>
        <button onclick="goBackToPreviousPage()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
          ← Back to previous page
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-5" aria-label="Browse healthcare categories">
        <button onclick="filterCategory('hospital')" class="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold hover:border-red-300 hover:text-red-700">Hospitals</button>
        <button onclick="filterCategory('clinic')" class="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold hover:border-red-300 hover:text-red-700">Clinics</button>
        <button onclick="filterCategory('diagnostic')" class="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold hover:border-red-300 hover:text-red-700">Diagnostics</button>
        <button onclick="filterCategory('bloodbank')" class="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold hover:border-red-300 hover:text-red-700">Blood Banks</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${cardsHTML}
      </div>
    </div>
  `;
}


/* ============================================================
   HOMECARE DIRECTORY VIEW  
   ============================================================ */
const HOMECARE_ICON = (paths, cls = "w-5 h-5") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

const HOMECARE_ICONS = {
  nurse:   (c) => HOMECARE_ICON(`<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 8v6M9 11h6"/>`, c),
  doctor:  (c) => HOMECARE_ICON(`<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>`, c),
  elderly: (c) => HOMECARE_ICON(`<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>`, c),
  physio:  (c) => HOMECARE_ICON(`<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`, c),
  support: (c) => HOMECARE_ICON(`<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/>`, c),
  postop:  (c) => HOMECARE_ICON(`<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11v6M9 14h6"/>`, c),
  shield:  (c) => HOMECARE_ICON(`<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>`, c),
  idcard:  (c) => HOMECARE_ICON(`<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M14 10h5M14 14h4M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2"/>`, c),
  search:  (c) => HOMECARE_ICON(`<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`, c),
  award:   (c) => HOMECARE_ICON(`<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>`, c),
  pin:     (c) => HOMECARE_ICON(`<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`, c),
  star:    () => `<svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/></svg>`,
};

/* ---------- Data ---------- */
const HOMECARE_CATEGORIES = [
  { key: "nurse",   title: "Home Nurse",   sub: "Injections, wound care",  icon: "nurse" },
  { key: "doctor",  title: "Home Doctor",  sub: "General consultation",   icon: "doctor" },
  { key: "elderly", title: "Elderly Care", sub: "Daily support",           icon: "elderly" },
  { key: "physio",  title: "Home Physio",  sub: "Mobility, rehab",      icon: "physio" },
  { key: "support", title: "Care Support", sub: "Non-medical help",        icon: "support" },
  { key: "postop",  title: "Post-Op Care", sub: "Recovery monitoring",     icon: "postop" },
];

const HOMECARE_CAREGIVERS = {
  nurse: [
    { name: "Anjali Karki",    role: "RN", rating: 4.9, years: 6, rate: 1500, tier: "Saino VIP",      cert: "Nursing Council registration valid", bg: "Cleared, August 2026" },
    { name: "Bimala Shrestha", role: "RN", rating: 4.7, years: 4, rate: 1300, tier: "Saino Verified", cert: "Nursing Council registration valid", bg: "Cleared, July 2026" },
    { name: "Sujita Rana",     role: "RN", rating: 4.8, years: 8, rate: 1700, tier: "Saino VVIP",     cert: "Nursing Council registration valid", bg: "Cleared, August 2026" },
  ],
  doctor: [
    { name: "Dr. Prakash Adhikari", role: "MD", rating: 4.9, years: 12, rate: 3500, tier: "Saino VIP",  cert: "NMC registration valid", bg: "Cleared, June 2026" },
    { name: "Dr. Sunita Pandey",    role: "MBBS", rating: 4.6, years: 7, rate: 2800, tier: "Saino Verified", cert: "NMC registration valid", bg: "Cleared, August 2026" },
  ],
  elderly: [
    { name: "Kamala Gurung",  role: "Caregiver", rating: 4.8, years: 9, rate: 1200, tier: "Saino VIP",  cert: "Elder care training certified", bg: "Cleared, August 2026" },
    { name: "Ram Bahadur Thapa", role: "Caregiver", rating: 4.5, years: 3, rate: 900, tier: "Saino Verified", cert: "Elder care training certified", bg: "Cleared, May 2026" },
  ],
  physio: [
    { name: "Nabin Maharjan", role: "BPT", rating: 4.8, years: 6, rate: 2000, tier: "Saino VIP",  cert: "Nepal Health Professional Council valid", bg: "Cleared, July 2026" },
    { name: "Rita Joshi",     role: "BPT", rating: 4.7, years: 5, rate: 1800, tier: "Saino Verified", cert: "Nepal Health Professional Council valid", bg: "Cleared, August 2026" },
  ],
  support: [
    { name: "Mina Tamang", role: "Attendant", rating: 4.6, years: 4, rate: 800, tier: "Saino Verified", cert: "First aid certified", bg: "Cleared, June 2026" },
  ],
  postop: [
    { name: "Sarita Bhandari", role: "RN", rating: 4.9, years: 10, rate: 2200, tier: "Saino VIP",  cert: "Nursing Council registration valid", bg: "Cleared, August 2026" },
    { name: "Dipesh Koirala",  role: "RN", rating: 4.7, years: 5,  rate: 1900, tier: "Saino Verified", cert: "Nursing Council registration valid", bg: "Cleared, July 2026" },
  ],
};

const homecareMoney = (n) => `INR ${n.toLocaleString("en-IN")}`;

/* ---------- Small reusable pieces ---------- */
function homecareBadges(c) {
  return `
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
        ${HOMECARE_ICONS.idcard("w-3 h-3")} ID Verified
      </span>
      <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
        ${HOMECARE_ICONS.shield("w-3 h-3")} Background Checked
      </span>
      <span class="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">${c.tier}</span>
    </div>`;
}

function homecareCategoryTiles(activeKey) {
  return HOMECARE_CATEGORIES.map(cat => {
    const active = cat.key === activeKey;
    return `
      <button onclick="selectHomecareCategory('${cat.key}')"
        class="flex flex-col items-center text-center gap-1 p-4 rounded-xl border transition
        ${active ? "bg-red-50 border-red-300 ring-1 ring-red-200" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}">
        <span class="w-9 h-9 rounded-full flex items-center justify-center
          ${active ? "bg-white text-red-700" : "bg-slate-100 text-slate-600"}">
          ${HOMECARE_ICONS[cat.icon]("w-4 h-4")}
        </span>
        <span class="text-xs font-bold ${active ? "text-red-800" : "text-slate-900"}">${cat.title}</span>
        <span class="text-[11px] text-slate-500 leading-tight">${cat.sub}</span>
      </button>`;
  }).join("");
}

function homecareCaregiverCards(catKey, selectedIdx) {
  const list = HOMECARE_CAREGIVERS[catKey] || [];
  return list.map((c, i) => `
    <div class="bg-white border rounded-xl p-4 flex flex-col gap-3 transition
      ${i === selectedIdx ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}">
      <div class="flex items-center gap-3">
        ${window.renderUserProfileIcon("w-10 h-10", "w-5 h-5")}
        <div class="min-w-0">
          <div class="text-sm font-bold text-slate-900 truncate">${c.name}, ${c.role}</div>
          <div class="flex items-center gap-1 text-xs text-slate-500">
            ${c.rating} ${HOMECARE_ICONS.star()} <span>· ${c.years} yrs experience</span>
          </div>
        </div>
      </div>
      ${homecareBadges(c)}
      <div class="flex items-center justify-between mt-auto pt-1">
        <span class="text-xs font-bold text-slate-900">${homecareMoney(c.rate)} / visit</span>
        <button onclick="selectHomecareCaregiver(${i})"
          class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          View profile
        </button>
      </div>
    </div>`).join("");
}

function homecareDetailPanel(catKey, idx) {
  const c = (HOMECARE_CAREGIVERS[catKey] || [])[idx];
  if (!c) return "";
  return `
    <div class="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

      <!-- Left: identity + actions -->
      <div>
        <div class="flex items-center gap-3 mb-3">
          ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
          <div>
            <div class="text-base font-bold text-slate-900">${c.name}, ${c.role}</div>
            <div class="flex items-center gap-1 text-xs text-slate-500">
              ${c.rating} ${HOMECARE_ICONS.star()} <span>· ${c.years} years experience</span>
            </div>
          </div>
        </div>
        ${homecareBadges(c)}

        <div class="flex flex-wrap gap-3 mt-5">
          <button onclick="bookHomecare('${c.name}')"
            class="flex-1 min-w-[140px] bg-red-700 hover:bg-red-800 text-white text-sm font-semibold py-3 rounded-xl transition">
            Book now
          </button>
          <button onclick="shareHomecareWithFamily('${c.name}')"
            class="flex-1 min-w-[140px] border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold py-3 rounded-xl transition">
            Share with family
          </button>
        </div>
        <p class="text-[11px] text-slate-400 mt-3 leading-snug">
          Turning on "Share with family" lets one contact follow this visit live, once the caregiver checks in. The caregiver is notified when sharing is on.
        </p>
      </div>

      <!-- Right: verification rows -->
      <dl class="text-sm divide-y divide-slate-100 self-start">
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-slate-500">ID verification</dt>
          <dd class="font-medium text-slate-900 text-right">Verified — NIC matched</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-slate-500">Background check</dt>
          <dd class="font-medium text-slate-900 text-right">${c.bg}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-slate-500">Certification</dt>
          <dd class="font-medium text-slate-900 text-right">${c.cert}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-slate-500">Rate</dt>
          <dd class="font-bold text-slate-900 text-right">${homecareMoney(c.rate)} / visit</dd>
        </div>
      </dl>
    </div>`;
}

/* ---------- Page ---------- */
let HOMECARE_STATE = { cat: "nurse", idx: 0 };

let HOMECARE_START_CAT = "nurse";

// Homepage ke kisi bhi button se: openHomecare('nurse') / openHomecare('doctor') / openHomecare()
window.openHomecare = function (catKey) {
  if (AppState.activeView !== "homecare") window.captureServiceReturnView();
  HOMECARE_START_CAT = HOMECARE_CATEGORIES.some(c => c.key === catKey) ? catKey : "nurse";
  AppState.selectedCategory = "homecare";
  AppState.activeView = "homecare";
  renderApp();
  window.scrollTo({ top: 0, behavior: "instant" });
};

function renderHomecareDirectoryView() {
  HOMECARE_STATE = { cat: HOMECARE_START_CAT, idx: 0 };
  const cat = HOMECARE_CATEGORIES.find(c => c.key === HOMECARE_START_CAT);
  const count = HOMECARE_CAREGIVERS[HOMECARE_STATE.cat].length;

  return `
    <!-- Page header -->
    <div class="bg-white border-y border-slate-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <button onclick="returnToServiceSource()"
            class="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline mb-2">
            ← Back to previous page
          </button>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900">Home care services</h1>
        <p class="text-sm text-slate-500 mt-1">Find home care according to your needs.</p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 mb-16">

      <!-- Hero -->
      <div class="bg-teal-50 border border-teal-100 rounded-2xl p-6 mb-6">
        <h1 class="text-2xl font-black text-slate-900 mb-1">Home Care Services</h1>
        <p class="text-sm text-slate-600 max-w-md mb-3">
          Vetted nurses, doctors and caregivers who come to you — booked in minutes, tracked the whole visit.
        </p>
        <p class="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          ${HOMECARE_ICONS.shield("w-4 h-4 text-emerald-700 shrink-0")}
          Every caregiver is ID-verified and background-checked before they're listed on Saino.
        </p>
      </div>

      <!-- Category tiles -->
      <div id="homecare-categories" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        ${homecareCategoryTiles(HOMECARE_STATE.cat)}
      </div>

      <!-- Showing + count -->
      <div class="flex items-center justify-between mb-3">
        <h2 id="homecare-showing" class="text-sm font-bold text-slate-900">Showing: ${cat.title}</h2>
        <span id="homecare-count" class="text-xs text-slate-400">${count} available nearby</span>
      </div>

      <!-- Caregiver cards -->
      <div id="homecare-cards" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        ${homecareCaregiverCards(HOMECARE_STATE.cat, HOMECARE_STATE.idx)}
      </div>

      <!-- Safety by design -->
      <div class="bg-slate-900 rounded-2xl p-6 sm:p-8 mb-8 text-white">
        <h2 class="text-lg font-bold mb-1">Booking home care is safe, by design</h2>
        <p class="text-xs text-slate-300 mb-6 max-w-md">
          Every step — from who you're letting in, to what happens during the visit — is built around verification and visibility.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">${HOMECARE_ICONS.idcard("w-4 h-4")}</span>
            <div class="text-sm font-semibold mb-1">ID Verification</div>
            <p class="text-xs text-slate-300 leading-snug">National ID matched and checked before a caregiver is listed.</p>
          </div>
          <div>
            <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">${HOMECARE_ICONS.search("w-4 h-4")}</span>
            <div class="text-sm font-semibold mb-1">Background Checks</div>
            <p class="text-xs text-slate-300 leading-snug">Criminal record and reference checks, renewed periodically.</p>
          </div>
          <div>
            <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">${HOMECARE_ICONS.award("w-4 h-4")}</span>
            <div class="text-sm font-semibold mb-1">Certified Professionals</div>
            <p class="text-xs text-slate-300 leading-snug">Licenses and registrations verified against issuing bodies.</p>
          </div>
          <div>
            <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">${HOMECARE_ICONS.pin("w-4 h-4")}</span>
            <div class="text-sm font-semibold mb-1">Live Location Sharing</div>
            <p class="text-xs text-slate-300 leading-snug">Track the caregiver's visit in real time, with consent.</p>
          </div>
        </div>
      </div>

      <!-- Selected caregiver detail -->
      <div id="homecare-detail">
        ${homecareDetailPanel(HOMECARE_STATE.cat, HOMECARE_STATE.idx)}
      </div>
    </div>
  `;
}

/* ---------- Interactions (page ko dobara render kiye bina update) ---------- */
window.selectHomecareCategory = function (key) {
  HOMECARE_STATE = { cat: key, idx: 0 };
  const cat = HOMECARE_CATEGORIES.find(c => c.key === key);
  document.getElementById("homecare-categories").innerHTML = homecareCategoryTiles(key);
  document.getElementById("homecare-showing").textContent = `Showing: ${cat.title}`;
  document.getElementById("homecare-count").textContent = `${HOMECARE_CAREGIVERS[key].length} available nearby`;
  document.getElementById("homecare-cards").innerHTML = homecareCaregiverCards(key, 0);
  document.getElementById("homecare-detail").innerHTML = homecareDetailPanel(key, 0);
};

window.selectHomecareCaregiver = function (idx) {
  HOMECARE_STATE.idx = idx;
  document.getElementById("homecare-cards").innerHTML = homecareCaregiverCards(HOMECARE_STATE.cat, idx);
  document.getElementById("homecare-detail").innerHTML = homecareDetailPanel(HOMECARE_STATE.cat, idx);
  document.getElementById("homecare-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
};

window.bookHomecare = function (name) {
  alert(`Booking request started for ${name}`);   // yahan apna booking flow lagayein
};

window.shareHomecareWithFamily = function (name) {
  alert(`Share link for ${name}'s visit`);         // yahan apna share logic lagayein
};

// ==========================================
// 3.find healthcare 
// ==========================================
 function renderFindHealthcareView() {
    const allProviders = AppState.providers || window.SAINO_DATA.providers || [];

  const hospitals = allProviders.filter(p => p.category === 'hospital').slice(0, 3);
  const clinics = allProviders.filter(p => p.category === 'clinic').slice(0, 3);
  const diagnostics = allProviders.filter(p => p.category === 'diagnostic').slice(0, 3);
  const wellness = allProviders.filter(p => p.category === 'wellness').slice(0, 3);
  const homecare = allProviders.filter(p => p.category === 'homecare').slice(0, 3);
  const insurance = allProviders.filter(p => p.category === 'insurance').slice(0, 3);

  const diagnosticPackages = window.SAINO_DATA.diagnosticPackages || [];
  const patientReviews = (window.AppState?.providers || []).flatMap(provider => (provider.reviews || []).map(review => ({ ...review, provider: provider.name })));
  const onlineDoctors = window.SAINO_DATA.onlineDoctors || [];
  const emergencyBloodBanks = window.SAINO_DATA.sainoRated?.bloodBanks?.slice(0, 3) || [];
  const emergencyAmbulances = window.SAINO_DATA.sainoRated?.ambulances?.slice(0, 3) || [];

  const quickServices = [
    { id: 'hospital', title: 'Hospital', icon: 'building-2', description: 'Hospitals & specialist care' },
    { id: 'clinic', title: 'Clinic', icon: 'stethoscope', description: 'Doctors & OPD clinics' },
    { id: 'diagnostic', title: 'Diagnostic / Lab', icon: 'activity', description: 'Labs, MRI, CT & scans' },
    { id: 'packages', title: 'Diagnostic Packages', icon: 'package-check', description: 'Health screening packages' },
    { id: 'wellness', title: 'Wellness Centre', icon: 'sparkles', description: 'Wellness & preventive care' },
    { id: 'homecare', title: 'Homecare & Elderly', icon: 'heart-handshake', description: 'Care at your doorstep' },
    { id: 'insurance', title: 'Health Insurance', icon: 'shield-check', description: 'Protect your health' },
    { id: 'bloodbank', title: 'Blood Bank', icon: 'droplets', description: 'Emergency blood services' }
  ];
  return `
    <!-- Explore Healthcare Section -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Healthcare Services
          </span>
          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Explore Healthcare
          </h2>
          <p class="text-xs text-saino-gray-500 mt-1">
            Everything you need across the healthcare journey.
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        ${quickServices.map(service => `
          <button
            onclick="${
              service.id === 'packages'
                ? "document.getElementById('diagnostic-packages-section')?.scrollIntoView({behavior:'smooth'})"
                : `filterCategory('${service.id}')`
            }"
            class="group bg-white rounded-2xl border border-saino-gray-200 p-4 text-center hover:border-saino-red/30 hover:shadow-md transition">
            <div class="w-11 h-11 mx-auto rounded-xl bg-saino-red/10 text-saino-red flex items-center justify-center group-hover:bg-saino-red group-hover:text-white transition">
              <i data-lucide="${service.icon}" class="w-5 h-5"></i>
            </div>
            <h3 class="mt-3 text-[11px] sm:text-xs font-black text-saino-gray-900">
              ${service.title}
            </h3>
            <p class="mt-1 text-[9px] text-saino-gray-500 leading-tight">
              ${service.description}
            </p>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- Hospitals -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6 pb-3 border-b border-saino-gray-200">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-saino-red">Trusted Healthcare Providers</span>
          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">Hospitals</h2>
        </div>
        <button onclick="filterCategory('hospital')" class="text-xs font-bold text-saino-red hover:underline">View All →</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${hospitals.map(p => renderProviderCard(p)).join('')}
      </div>
    </section>

    <!-- Clinics + Reviews -->
    <section class="mb-14">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-5 pb-2 border-b border-saino-gray-200">
            <h2 class="text-base sm:text-lg font-black text-saino-gray-900 uppercase tracking-wide">Clinics</h2>
            <button onclick="filterCategory('clinic')" class="text-xs font-bold text-saino-red hover:underline">View All →</button>
          </div>
          <div class="space-y-4">
            ${clinics.map(c => renderProviderCard(c)).join('')}
          </div>
        </div>
        <div class="lg:col-span-5">
          <div class="flex items-center justify-between mb-5 pb-2 border-b border-saino-gray-200">
            <div>
              <span class="text-xs font-black uppercase tracking-wider text-saino-red">Community</span>
              <h2 class="text-base sm:text-lg font-black text-saino-gray-900">Patient Reviews</h2>
            </div>
            <button onclick="navigateTo('patient')" class="text-xs font-bold text-saino-red hover:underline">Read All →</button>
          </div>
          <div class="space-y-3">
            ${patientReviews.slice(0, 5).map((r, i) => renderTalkReviewItem(r, i)).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Discovery / Social Engagement -->
    <section class="mb-14 rounded-3xl bg-saino-gray-50 border border-saino-gray-200 p-6 sm:p-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-saino-red">SAINO Discovery</span>
          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">Like · Comment · Interested · Saved</h2>
          <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
            Discover healthcare providers, read real patient experiences, share your opinion and save providers for later.
          </p>
        </div>
        <button onclick="navigateTo('discovery')" class="px-5 py-3 rounded-xl bg-saino-red border border-saino-red text-white text-xs font-black hover:bg-saino-red-dark transition shadow-xs">
          EXPLORE DISCOVERY
        </button>
      </div>
    </section>
    <section
      id="diagnostic-packages-section"
      class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Preventive Healthcare
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Diagnostic Packages
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Choose complete health screening packages for you and your family.
          </p>

        </div>

      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        ${diagnosticPackages
          .slice(0, 6)
          .map(pkg => renderDiagnosticPackageCard(pkg))
          .join('')}

      </div>

    </section>


    <!-- ==========================================
         10. HOMECARE & ELDERLY CARE
    =========================================== -->

    <section class="mb-14">

      <div class="rounded-3xl bg-white border border-saino-gray-200 shadow-sm overflow-hidden">

        <div class="p-6 sm:p-8">

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">

            <div>

              <span class="text-xs font-black uppercase tracking-wider text-saino-red">
                Care at Home
              </span>

              <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
                Homecare & Elderly Care
              </h2>

              <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
                Professional healthcare support at home — from elderly care
                and home nursing to doctor visits and post-operative support.
              </p>

            </div>

            <button
              onclick="filterCategory('homecare')"
              class="px-5 py-2.5 rounded-xl bg-saino-red text-white text-xs font-black hover:bg-saino-red-dark transition">
              VIEW HOMECARE
            </button>

          </div>


          <!-- HOMECARE SERVICES -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
            <button
              onclick="filterBookingType('home_nurse')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">
              <i data-lucide="heart-handshake"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Nurse
              </span>
            </button>
            <button
              onclick="filterBookingType('home_doc')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">
              <i data-lucide="stethoscope"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Doctor
              </span>
            </button>
            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">
              <i data-lucide="accessibility"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Elderly Care
              </span>
            </button>
            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">
              <i data-lucide="heart-pulse"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Post-Op Care
              </span>
            </button>
            <button>
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">
              <i data-lucide="activity"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Physio
              </span>
            </button>
            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="pill"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>
              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Care Support
              </span>
            </button>
          </div>

          <!-- HOMECARE PROVIDERS -->

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${homecare.map(p => renderProviderCard(p)).join('')}
          </div>
        </div>
      </div>
    </section>
    


    <!-- ==========================================
         11. HEALTH INSURANCE
    =========================================== -->

    <section class="mb-14">

      <div class="rounded-3xl bg-white border border-saino-gray-200 shadow-sm p-6 sm:p-8">

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">

          <div>

            <span class="text-xs font-black uppercase tracking-wider text-saino-red">
              Healthcare Protection
            </span>

            <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
              Health Insurance
            </h2>

            <p class="text-xs sm:text-sm text-saino-gray-600 mt-1">
              Protect your health and your family with the right healthcare coverage.
            </p>

          </div>

          <button
            onclick="filterCategory('insurance')"
            class="px-5 py-2.5 rounded-xl bg-saino-red text-white text-xs font-black hover:bg-saino-red-dark transition">
            EXPLORE INSURANCE
          </button>

        </div>


        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">

          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="user"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Individual Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Personal healthcare protection
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="users"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Family Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Protect your whole family
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="building-2"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Corporate Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Employee healthcare coverage
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="badge-check"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Cashless Networks
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Partner hospital networks
            </span>

          </div>

        </div>


        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          ${insurance.map(p => renderProviderCard(p)).join('')}

        </div>

      </div>

    </section>


    <!-- ==========================================
         12. WELLNESS CENTRES
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Preventive & Lifestyle Care
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Wellness Centres
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Ayurveda · Yoga · Physiotherapy · Mental Wellness · Preventive Care
          </p>

        </div>

        <button
          onclick="filterCategory('wellness')"
          class="text-xs font-bold text-saino-red hover:underline">
          View All →
        </button>

      </div>


      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        ${wellness.map(p => renderProviderCard(p)).join('')}

      </div>

    </section>


    <!-- ==========================================
         13. COMPARE BEFORE YOU BOOK
    =========================================== -->

    <section class="mb-14 bg-white rounded-3xl border border-saino-gray-200 p-6 sm:p-8 shadow-sm">

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Decision Helper
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
            Compare Before You Book
          </h2>

          <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
            Compare ratings, reviews, services, pricing, availability and
            SAINO badge levels before making your healthcare decision.
          </p>

        </div>

        <button
          onclick="navigateTo('discovery')"
          class="px-6 py-3 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white text-xs font-black shadow-md transition">
          COMPARE PROVIDERS
        </button>

      </div>

    </section>


    <!-- ==========================================
         14. EMERGENCY / BLOOD BANK
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6 pb-3 border-b border-saino-gray-200">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            24/7 Rapid Response
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Emergency Care & Blood Banks
          </h2>

        </div>

        <button
          onclick="navigateTo('discovery')"
          class="text-xs font-bold text-saino-red hover:underline">
          Emergency Directory →
        </button>

      </div>


      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">


        <!-- BLOOD BANK -->

        <div class="bg-white rounded-2xl border border-saino-gray-200 p-5 shadow-xs">

          <div class="flex items-center justify-between mb-4 pb-2 border-b border-saino-gray-100">

            <h3 class="text-xs font-black uppercase text-saino-gray-700 flex items-center gap-2">

              <i data-lucide="droplet"
                 class="w-4 h-4 text-saino-red">
              </i>

              Blood Banks

            </h3>

            <span class="text-[10px] text-saino-gray-400 font-semibold">
              Emergency
            </span>

          </div>


          <div class="space-y-3">

            ${emergencyBloodBanks.map(b => `

              <div class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">

                <strong class="text-xs text-saino-gray-900 block">
                  ${b.name}
                </strong>

                <span class="text-[10px] text-saino-gray-500 block mt-1">
                  ${b.area || ''}
                </span>

                ${renderBloodBankEnquiryAction(b)}

              </div>

            `).join('')}

          </div>

        </div>


        <!-- AMBULANCE -->

        <div class="bg-white rounded-2xl border border-saino-gray-200 p-5 shadow-xs">

          <div class="flex items-center justify-between mb-4 pb-2 border-b border-saino-gray-100">

            <h3 class="text-xs font-black uppercase text-saino-gray-700 flex items-center gap-2">

              <i data-lucide="truck"
                 class="w-4 h-4 text-saino-red">
              </i>

              Ambulance

            </h3>

            <span class="text-[10px] text-saino-gray-400 font-semibold">
              24/7 Dispatch
            </span>

          </div>


          <div class="space-y-3">

            ${emergencyAmbulances.map(a => `

              <div class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">

                <strong class="text-xs text-saino-gray-900 block">
                  ${a.name}
                </strong>

                <span class="text-[10px] text-saino-gray-500 block mt-1">
                  ${a.area || ''}
                </span>

                <button
                  onclick="openCustomWhatsApp('Ambulance Dispatch: ${a.name}', 'Hello SAINO, I need an ambulance dispatch enquiry for ${a.name}.')"
                  class="mt-2 px-3 py-1.5 bg-saino-red text-white rounded-lg text-[10px] font-bold">
                  Request Ambulance
                </button>

              </div>

            `).join('')}

          </div>

        </div>

      </div>

    </section>


    <!-- ==========================================
         15. DOCTOR OPD
    =========================================== -->

    <section class="mb-14">

      <div class="mb-6">

        <span class="text-xs font-black uppercase tracking-wider text-saino-red">
          Direct Healthcare Booking
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
          Doctor Consultation & OPD
        </h2>

        <p class="text-xs text-saino-gray-500 mt-1">
          Discover doctors and request OPD consultation bookings.
        </p>

      </div>


      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

        ${onlineDoctors.slice(0, 10).map(doc => {
          const safeDoctorId = String(doc.id || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          return `

          <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 text-center shadow-xs">

            <div class="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-2 border-saino-red/20">

              <img
                src="${doc.image}"
                alt="${doc.name}"
                class="w-full h-full object-cover">

            </div>

            <strong class="text-xs font-bold text-saino-gray-900 block truncate">
              ${doc.name}
            </strong>

            <span class="text-[10px] text-saino-gray-500 block truncate mt-1">
              ${doc.role}
            </span>

            <span class="text-[10px] text-sky-700 font-semibold block truncate mt-1">
              ${doc.hospital}
            </span>

            <button
              onclick="openDoctorOpdBooking('${safeDoctorId}')"
              class="mt-3 w-full py-2 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl text-[10px]">
              BOOK OPD
            </button>

          </div>

          `;
        }).join('')}

      </div>

    </section>


    <!-- ==========================================
         16. PROVIDER ONBOARDING
    =========================================== -->

    <section class="mb-14 bg-saino-gray-50 rounded-3xl border border-saino-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">

      <div>

        <span class="text-xs font-black uppercase tracking-wider text-saino-red block mb-1">
          SAINO Provider Network
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
          Are you a Healthcare Provider?
        </h2>

        <p class="text-xs sm:text-sm text-saino-gray-600 mt-1">
          List your hospital, clinic, diagnostic centre, wellness centre,
          homecare service or health insurance business on SAINO HEALTH.
        </p>

      </div>

      <button
        onclick="navigateTo('list-your-care')"
        class="px-6 py-3 bg-saino-red hover:bg-saino-red-dark text-white font-black rounded-full text-xs sm:text-sm shadow-md transition whitespace-nowrap">
        LIST YOUR CARE
      </button>

    </section>
      <!-- 11. DIGITALLY CONNECTED (NEPAL MAP GRAPHIC) -->
    <section class="mb-14 bg-gradient-to-r from-sky-50 via-white to-sky-50 rounded-3xl border border-sky-100 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div class="max-w-md">
        <h2 class="text-2xl sm:text-3xl font-black text-saino-gray-900 mb-2">
          Digitally <span class="text-saino-red">Connected</span>
        </h2>
        <p class="text-xs sm:text-sm text-saino-gray-600 leading-relaxed">
          An all-in-one healthcare directory linking patients to verified providers across India.
        </p>
      </div>
      <div class="flex-1 flex justify-center">
        <div class="relative w-full max-w-md h-36 bg-sky-100/50 rounded-2xl border border-sky-200/60 p-4 flex items-center justify-center overflow-hidden">
          <div class="text-center text-xs font-bold text-sky-800 space-y-1">
            <i data-lucide="network" class="w-8 h-8 mx-auto text-saino-red"></i>
            <span>Bengaluru · Goa · Mumbai · Delhi</span>
            <span class="text-[10px] text-saino-gray-500 block">Bengaluru · Goa · Mumbai · Delhi</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFaqsView() {
  return `<section class="p-6 text-center">
    <h2 class="text-xl font-bold text-saino-red">FAQs</h2>
    <p class="text-saino-gray-600 mt-2">FAQs page is under construction.</p>
  </section>`;
}


// ==========================================
// 4. DEDICATED "LIST YOUR CARE" 
// ==========================================
function renderListYourCareView() {
  return `
    <div class="max-w-6xl mx-auto mb-16">
      
      <!-- Top Title & Description (Page 1 Spec) -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="plus-circle" class="w-4 h-4 text-rose-600"></i>
          <span class="uppercase tracking-wider">LIST YOUR BUSINESS & HEALTHCARE SERVICES</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
          Built to Host Every Part of Your Healthcare Ecosystem
        </h1>
        <p class="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          After successful collaboration with Healthcare Organizations, we are equipped to bring and connect the healthcare experience better via SAINO.
        </p>
      </div>

      <!-- WHAT CAN YOU LIST? 9 CATEGORY ILLUSION CARDS (Page 1 Spec) -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base md:text-lg font-bold text-slate-900">What Can You List on SAINO HEALTH?</h3>
          <span class="text-xs text-rose-600 font-bold">9 Healthcare Categories</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          ${[
            { title: 'Healthcare Facilities', sub: 'Hospitals, Nursing Homes, Specialty Centres', icon: 'building-2', color: 'rose' },
            { title: 'Healthcare Professionals', sub: 'Consultants, Surgeons, Dentists, General Practitioners', icon: 'stethoscope', color: 'blue' },
            { title: 'Diagnostics & Medical Services', sub: 'Pathology Labs, 3.0T MRI, CT Scans, Ultrasound', icon: 'microscope', color: 'emerald' },
            { title: 'Online Medical Retail', sub: 'Verified Pharmacies, Surgical & Medical Supplies', icon: 'pill', color: 'amber' },
            { title: 'Healthcare at Home', sub: 'Bedside Nursing, Elderly Care, Post-Op Rehabilitation', icon: 'home', color: 'indigo' },
            { title: 'Healthcare Organizations Campaigns', sub: 'Health Drives, Bloodline Networks, Charity Drives', icon: 'tv', color: 'rose' },
            { title: 'Healthcare Awareness', sub: 'Preventative Screening, Patient Education Catalogues', icon: 'heart-pulse', color: 'teal' },
            { title: 'Wellness Facilities', sub: 'Ayurveda, Physiotherapy, Yoga & Mental Wellness', icon: 'sparkles', color: 'violet' },
            { title: 'Health INSURANCE', sub: 'Cashless Mediclaim, Family Health Cover Policies', icon: 'shield-check', color: 'sky' }
          ].map(c => `
            <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition flex items-start space-x-3.5">
              <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-100">
                <i data-lucide="${c.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 leading-tight">${c.title}</h4>
                <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${c.sub}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- WHAT ARE THE SERVICES WE OFFER: VISUAL REPRESENTATION (Page 1 & 2 Spec) -->
      <div class="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl shadow-xl mb-12">
        <div class="max-w-3xl mb-6">
          <span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
            SERVICES WE OFFER
          </span>
          <h3 class="text-xl md:text-3xl font-extrabold mt-2 mb-2">Comprehensive Healthcare Technology Suite</h3>
          <p class="text-xs md:text-sm text-slate-300 leading-relaxed">
            Apart from healthcare hosting, SAINO Health also provides SEO services, appointment management, integrated payment gateways, and walk-in/walk-out booking intelligence — all accessible from a single platform.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          ${[
            { title: 'Trusted Badges', icon: 'award' },
            { title: 'Online Discovery & Content', icon: 'compass' },
            { title: 'Appointment Management', icon: 'calendar-check' },
            { title: 'Digital Unified Marketplace', icon: 'layout-grid' },
            { title: 'Reports & Business Insights', icon: 'bar-chart-3' },
            { title: 'Easy Booking Experience', icon: 'message-circle' },
            { title: 'Healthcare Importance to Public', icon: 'users' },
            { title: 'Medical Travel', icon: 'plane', comingSoon: true },
            { title: 'Surgery Queries', icon: 'activity', comingSoon: true },
            { title: 'Quickies by Saino', icon: 'zap', comingSoon: true },
            { title: 'SAINO Health App', icon: 'smartphone', comingSoon: true },
            { title: 'SAINO Corp Health', icon: 'briefcase', comingSoon: true }
          ].map(s => `
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10 flex items-center space-x-2.5">
              <i data-lucide="${s.icon}" class="w-4 h-4 text-rose-400 flex-shrink-0"></i>
              <span class="font-semibold text-slate-100 text-[11px] leading-tight">${s.title}</span>
              ${s.comingSoon ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-black">Soon</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- INTERACTIVE TWO-COLUMN ONBOARDING PORTAL (Page 2 Specification) -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12 grid grid-cols-1 lg:grid-cols-12">
        
        <!-- Left Side: SAINO Logo & Do It Yourself Sign-In / Register Form -->
        <div class="lg:col-span-5 p-6 sm:p-8 bg-slate-50 border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div class="mb-6">
              <img src="assets/logo.png" alt="SAINO HEALTH" class="h-16 w-auto object-contain">
              <h3 class="text-base font-extrabold text-slate-900 mt-4">Do it yourself</h3>
              <p class="text-xs text-slate-500">Sign in or register your healthcare business</p>
            </div>

            <form onsubmit="handleListYourCareSubmit(event)" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Email ID</label>
                <input type="email" id="lycEmail" required placeholder="admin@careclinic.np" class="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Password</label>
                <input type="password" id="lycPassword" required placeholder="••••••••" class="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none">
              </div>
              <button type="submit" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition shadow-md">
                Proceed to Register / Manage
              </button>
              <div class="flex items-center justify-between text-[11px] pt-1">
                <a href="#" onclick="showToast('Password reset link dispatched to email!')" class="text-rose-600 hover:underline font-semibold">Forgot Password</a>
                <a href="#" onclick="showToast('OTP sent to verified business mobile!')" class="text-slate-600 hover:underline font-semibold">Log in with OTP</a>
              </div>
            </form>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-200 text-slate-500 text-[11px]">
            <p class="font-bold text-slate-700">Didn't Have an Account? <a href="#tierComparisonSection" class="text-rose-600 hover:underline font-black">Sign up below</a></p>
            <p class="mt-1">In case of any query, please write to: <a href="mailto:support@sainotechventures.com" class="text-rose-600 font-bold underline">support@sainotechventures.com</a></p>
          </div>
        </div>

        <!-- Right Side: Visual Feature Pillars (Page 2 Specification) -->
        <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <span class="text-xs font-black uppercase text-rose-600 tracking-wider">SUPERFAST ONBOARDING</span>
            <h3 class="text-xl font-bold text-slate-900 mt-1 mb-6">Why Healthcare Providers Choose SAINO</h3>

            <div class="space-y-4">
              <div class="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="file-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Complete your registration with Company ID and PAN Details.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Seamless compliance and legal entity verification across India.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Take your listing and badge superfast.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Instant marketplace directory publication and SEO indexing.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Manage Reviews, Campaigns & Appointment Booking Superfast.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Direct WhatsApp appointment routing with zero patient friction.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="trending-up" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Monitor Insights and Analytics easily.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Live tracking of patient views, click-to-book ratios, and reach.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Provider subscription plans -->
      <div id="tierComparisonSection" class="mb-14">
        <div class="text-center mb-8">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 uppercase tracking-wider">
            SUBSCRIPTION TIERS & VERIFIED BADGES
          </span>
          <h2 class="text-xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-2">Choose the Right Growth Plan for Your Facility</h2>
          <p class="text-xs md:text-sm text-slate-500">Choose Free Listing, SAINO Verified (VIP), or SAINO VVIP</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${window.SAINO_DATA.subscriptionTiers.map(plan => `
            <div class="rounded-3xl border ${plan.highlight ? 'border-2 border-rose-500 shadow-xl bg-rose-50/20 ring-4 ring-rose-500/10' : 'border-slate-200 bg-white shadow-sm'} p-5 sm:p-6 flex flex-col justify-between relative">
              ${plan.popularTag ? `
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
                  ${plan.popularTag}
                </div>
              ` : ''}

              <div>
                <div class="mb-4">
                  <span class="text-xs font-black text-rose-700 uppercase tracking-wider">${plan.name}</span>
                  <div class="text-xl sm:text-2xl font-black text-slate-900 mt-1">${plan.price}</div>
                  <span class="text-[11px] text-slate-400 font-medium">${plan.period}</span>
                </div>

                <ul class="space-y-2 mb-6 text-xs text-slate-700">
                  ${plan.features.map(f => `
                    <li class="flex items-start space-x-2">
                      <i data-lucide="check" class="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5"></i>
                      <span class="leading-snug">${f}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <button onclick="openUpgradeBadgeModal('${plan.id}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition ${
                plan.highlight 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }">
                ${plan.cta}
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- DOCUMENT UPLOAD & COMPLIANCE GUIDE FOR PAID BADGES (Page 3 & 4 Specification) -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-12">
        <div class="mb-6 pb-4 border-b border-slate-100">
          <div class="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase mb-1">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>COMPLIANCE & VERIFICATION STANDARDS</span>
          </div>
          <h3 class="text-lg md:text-xl font-bold text-slate-900">Required Verification Documents for Paid Badges</h3>
          <p class="text-xs text-slate-500 mt-0.5">All documents must be crisp 200 DPI scans (PDF, JPEG, or PNG up to 5MB with 4 outer corners visible).</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <!-- Hospital & Clinic -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="building-2" class="w-4 h-4 text-rose-600"></i>
              <span>Hospital & Clinic</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Facility Operating Licence</li>
              <li>• Clinical Establishment Act Reg.</li>
              <li>• Biomedical waste (BMW) mgmt</li>
              <li>• Fire Safety and NOC</li>
              <li>• Professional Indemnity Insurance</li>
              <li>• Tax & Incorporation Documents</li>
              <li>• PAN / Corporate Charter</li>
            </ul>
          </div>

          <!-- Diagnostic Centres -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="microscope" class="w-4 h-4 text-rose-600"></i>
              <span>Diagnostic & Labs</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Lab Accreditation Certificate</li>
              <li>• PNDT Act Registration</li>
              <li>• AERB / Radiation Safety Approval</li>
              <li>• Signatory Doctor Qualifications</li>
            </ul>
          </div>

          <!-- Blood Banks -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="droplet" class="w-4 h-4 text-rose-600"></i>
              <span>Blood Banks</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Drug & Component License</li>
              <li>• Medical Officer Credentials</li>
              <li>• Equipment Calibration Logs</li>
            </ul>
          </div>

          <!-- Homecare Centres -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="home" class="w-4 h-4 text-rose-600"></i>
              <span>Homecare Centres</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Nursing Agency/Trade License</li>
              <li>• Staff Background Clearances</li>
              <li>• Staff Medical Certifications</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE FACILITY REGISTRATION FORM (Pages 3 & 4 Specification) -->
      <div class="bg-gradient-to-br from-slate-900 via-[#881337] to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div class="max-w-2xl mb-8">
          <span class="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
            INSTANT ONBOARDING
          </span>
          <h3 class="text-xl sm:text-3xl font-extrabold mt-3 mb-2">Register Your Healthcare Facility on SAINO</h3>
          <p class="text-xs sm:text-sm text-rose-100">Submit your organization details below. Our compliance team will review and activate your profile within 4 hours.</p>
        </div>

        <form onsubmit="handleFacilityRegistration(event)" class="space-y-5 text-xs max-w-3xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation Name</label>
              <input type="text" id="regOrgName" required placeholder="e.g. Bengaluru City Care Hospital" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation Address / Location</label>
              <input type="text" id="regOrgAddress" required placeholder="e.g. Indiranagar, Bengaluru" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Company Registration No.</label>
              <input type="text" id="regOrgRegNo" required placeholder="e.g. REG-784920/081" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation VAT / PAN No.</label>
              <input type="text" id="regOrgPan" required placeholder="e.g. 601928471" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Contact Person Full Name</label>
              <input type="text" id="regContactName" required placeholder="Dr. Ramesh Sharma" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Mobile Number</label>
              <input type="tel" id="regMobile" required placeholder="9801234567" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Official Email Address</label>
              <input type="email" id="regEmail" required placeholder="contact@hospital.np" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-200 mb-1">Choose Verification Plan</label>
            <select id="regPlanSelect" class="w-full bg-slate-900 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="saino_listed">Free Listing (INR 0)</option>
              <option value="saino_pro" selected>SAINO Verified (VIP)</option>
              <option value="saino_prime">SAINO VVIP</option>
            </select>
          </div>

          <div class="pt-2 flex flex-wrap items-center gap-4">
            <button type="submit" class="px-6 py-3.5 bg-white hover:bg-rose-50 text-rose-950 font-black rounded-2xl shadow-xl transition transform hover:scale-105 text-xs sm:text-sm">
              Submit Facility for Verification →
            </button>
            <span class="text-[11px] text-rose-200">🔒 256-Bit SSL Encrypted & Legal Sign Agreement via SAINO</span>
          </div>
        </form>
      </div>

    </div>
  `;
}

function bindListYourCareEvents() {}

function handleListYourCareSubmit(e) {
  if (e) e.preventDefault();
  showToast('Logged in to SAINO Business Dashboard!');
}

function handleFacilityRegistration(e) {
  if (e) e.preventDefault();
  const org = document.getElementById('regOrgName')?.value || 'Your Facility';
  showToast(`Registration submitted for ${org}! Compliance team will verify your license.`);
}

// ==========================================
// 3. SAINO BOOST / ADVERTISERS VIEW (PAGE 4 SPEC)
// ==========================================
function renderBoostView() {
  return `
    <div class="max-w-5xl mx-auto mb-16">
      <!-- Hero Banner -->
      <div class="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white mb-10 shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
            SAINO BOOST & HEALTHCARE CAMPAIGNS
          </span>
          <h1 class="text-2xl md:text-4xl font-extrabold mt-3 mb-3">
            Accelerate Patient Reach with Precision Healthcare Advertising
          </h1>
          <p class="text-xs md:text-sm text-purple-100 leading-relaxed mb-6">
            Showcase your hospital departments, special diagnostic packages, or insurance schemes to targeted patients actively searching for care in your district.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openAdCampaignModal()" class="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs md:text-sm hover:bg-slate-100 transition shadow">
              Launch Advertising Campaign
            </button>
            <button onclick="navigateTo('contact')" class="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs md:text-sm hover:bg-white/20 transition border border-white/20">
              Speak with Sales Team
            </button>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Category Search Pinning</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Appear at the #1 position when patients search for specific specialities like "Cardiologist in Bengaluru" or "24/7 Ambulance".
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <i data-lucide="layers" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Home Banner Showcase</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Interactive top carousel placement with 8 rotating sponsored slots linking straight to your WhatsApp triage booking team.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Transparent ROI Analytics</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Real-time measurement of patient card impressions, WhatsApp appointment initiates, profile clicks, and phone leads.
          </p>
        </div>
      </div>

      <!-- Advertising FAQ Section (Page 4 Requirement) -->
      <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
        <h3 class="text-lg font-bold text-slate-900 mb-4">Advertising & Payment Policies FAQ</h3>
        <div class="space-y-4">
          ${window.SAINO_DATA.boostFaqs.map(faq => `
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 class="text-xs md:text-sm font-bold text-slate-800 mb-1 flex items-center space-x-2">
                <i data-lucide="help-circle" class="w-4 h-4 text-sky-600 flex-shrink-0"></i>
                <span>${faq.q}</span>
              </h4>
              <p class="text-xs text-slate-600 leading-relaxed pl-6">${faq.a}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 4. ABOUT US VIEW (PAGE 4, 5, 6 SPEC)
// ==========================================
function renderAboutView() {
  return `
    <section class="py-10 sm:py-14 px-4 text-center max-w-4xl mx-auto space-y-4">
            <h1 class="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Discover. Explore. Choose. <span class="text-[#b81414]">Book with Confidence.</span>
            </h1>

            <div class="pt-2">
                <h2 class="text-base sm:text-lg font-bold text-slate-900 mb-2">Our Mission</h2>
                <p class="text-slate-600 text-xs sm:text-sm font-semibold mb-3">
                    To make healthcare easier to discover, explore, and access.
                </p>
                <p class="text-slate-500 text-xs sm:text-xs leading-relaxed max-w-2xl mx-auto">
                    At <strong class="text-[#b81414]">SAINO Health</strong>, we bring together accurate, relevant, and thoughtfully presented information about healthcare providers and services, enabling users to discover, explore, and make more informed healthcare decisions with confidence.
                </p>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap justify-center gap-2 pt-3">
                <span class="bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-medium px-3 py-1 rounded-full">8 Categories</span>
                <span class="bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-medium px-3 py-1 rounded-full">Verified Providers</span>
                <span class="bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-medium px-3 py-1 rounded-full">One Platform</span>
            </div>
        </section>

        <!-- DOCTOR QUOTE BANNER SECTION -->
        <section class="bg-slate-50/70 border-y border-slate-200/80 py-8 sm:py-12 my-4">
            <div class="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                
                <!-- Left Text Content -->
                <div class="flex-1 space-y-4">
                    <p class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                        Our goal is simple: make healthcare discovery more transparent, connected, and confident.
                    </p>

                    <!-- Red Accent Quote Box -->
                    <div class="bg-white border-l-4 border-[#b81414] border-y border-r border-slate-200/80 p-4 rounded-r-lg shadow-xs">
                        <p class="text-slate-700 text-xs leading-relaxed font-medium">
                            "Healthcare should not be a collection of disconnected services. It should be a connected ecosystem where people, providers, and information come together to make better decisions." 
                            <span class="block text-[#b81414] font-bold mt-1.5">— SAINO Health</span>
                        </p>
                    </div>
                </div>

                <!-- Right Doctor Image -->
                <div class="shrink-0 w-48 sm:w-60 md:w-64 flex justify-center">
                    <img 
                        src="https://img.freepik.com/free-photo/female-doctor-hospital-with-stethoscope_23-2148827768.jpg" 
                        alt="SAINO Health Doctor" 
                        class="w-full h-auto object-cover rounded-lg shadow-sm"
                    />
                </div>

            </div>
        </section>

        <!-- OUR OFFERINGS SECTION -->
        <section class="max-w-4xl mx-auto px-4 py-10 space-y-6">
            <h2 class="text-lg sm:text-xl font-bold text-slate-900">Our Offerings</h2>

            <div class="space-y-3.5">
                <!-- Offering Card 1 -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs flex items-start space-x-3.5">
                    <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <i class="fas fa-check text-slate-700 text-[10px]"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Comprehensive Healthcare Directory</h3>
                        <p class="text-xs font-bold text-slate-800 mb-1">Find the right care with confidence.</p>
                        <p class="text-slate-500 text-xs">
                            Detailed and verified information on healthcare providers, helping users discover doctors, clinics, hospitals, diagnostic centers, and healthcare services.
                        </p>
                    </div>
                </div>

                <!-- Offering Card 2 -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs flex items-start space-x-3.5">
                    <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <i class="fas fa-check text-slate-700 text-[10px]"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Online Appointment Booking</h3>
                        <p class="text-xs font-bold text-slate-800 mb-1">Make appointments without the hassle.</p>
                        <p class="text-slate-500 text-xs">
                            Explore provider profiles, services, reviews, and availability, and book appointments conveniently through SAINO Health.
                        </p>
                    </div>
                </div>

                <!-- Offering Card 3 -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs flex items-start space-x-3.5">
                    <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <i class="fas fa-check text-slate-700 text-[10px]"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Connected Healthcare Services</h3>
                        <p class="text-xs font-bold text-slate-800 mb-1">Stay connected to the care you need.</p>
                        <p class="text-slate-500 text-xs">
                            Access a growing network of healthcare providers and services through one trusted, connected marketplace.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- OUR APPROACH SECTION -->
        <section class="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div class="text-center">
                <span class="text-xs font-bold text-slate-500 block mb-1">Our Approach</span>
                <h2 class="text-lg sm:text-xl font-extrabold text-slate-900">Connecting People with Healthcare They Can Trust</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <!-- Grid 1: Connect -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="fas fa-eye text-slate-800 text-xs"></i>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Connect</h3>
                    </div>
                    <p class="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
                        Healthcare is more than finding a doctor or booking an appointment. It is about creating meaningful connections between people and the healthcare providers they choose. SAINO Health helps bring patients and providers closer through easier discovery, access, and communication.
                    </p>
                </div>

                <!-- Grid 2: Transparency -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="fas fa-circle-nodes text-slate-800 text-xs"></i>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Transparency</h3>
                    </div>
                    <p class="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
                        We believe people deserve clarity when making healthcare decisions. We strive to present provider information, services, reviews, activities, and promotional placements clearly, so users can explore their options and make informed choices.
                    </p>
                </div>

                <!-- Grid 3: Choice -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="fas fa-chart-simple text-slate-800 text-xs"></i>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Choice</h3>
                    </div>
                    <p class="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
                        Every individual has different healthcare needs. We believe people should have the freedom to explore relevant providers and services, understand their options, and choose the care that feels right for them.
                    </p>
                </div>

                <!-- Grid 4: Trust -->
                <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="fas fa-lock text-slate-800 text-xs"></i>
                        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Trust</h3>
                    </div>
                    <p class="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
                        Trust is at the heart of healthcare. We are committed to providing reliable provider information and maintaining a responsible verification system, helping people explore healthcare options with greater confidence.
                    </p>
                </div>
            </div>
        </section>

        <!-- YOUR DATA, YOUR CONTROL SECTION -->
        <section class="bg-slate-50/70 border-t border-slate-200/80 py-10 sm:py-12 mt-6">
            <div class="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                
                <!-- Left Details -->
                <div class="space-y-2 text-left">
                    <h2 class="text-sm font-extrabold tracking-wide text-slate-900">
                        YOUR DATA, <span class="text-[#b81414]">YOUR CONTROL.</span>
                    </h2>
                    <p class="text-xs text-slate-600 font-medium">
                        Data privacy and security is our top priority<br>
                        Your data has only one owner: YOU
                    </p>
                    <div class="pt-2 space-y-1 text-[11px] text-slate-500">
                        <p>SAINO does not have access to your data.</p>
                        <p>SAINO does not sell or share your data with any third party.</p>
                        <p>
                            SAINO follows stringent policies so that data isn't compromised at any step. 
                            <a href="#" class="text-[#b81414] font-medium hover:underline">Read More ...</a>
                        </p>
                    </div>
                </div>

                <!-- Right Security Shield Icon Badge -->
                <div class="shrink-0 text-center flex flex-col items-center">
                    <div class="relative w-20 h-20 text-[#00a8e8] flex items-center justify-center">
                        <i class="fas fa-shield-halved text-6xl"></i>
                        <i class="fas fa-lock text-slate-800 text-lg absolute top-6"></i>
                    </div>
                    <span class="text-[9px] font-bold text-[#00a8e8] tracking-widest uppercase mt-1">256-bit Encryption</span>
                    <span class="text-xs font-bold text-slate-800 mt-1">256-bit<br>Encryption</span>
                </div>

            </div>
        </section>

        <!-- ================= HEALTH CARE INVESTORS BANNER ================= -->
        <section class="bg-[#172033] text-white py-8 px-4 text-center">
            <div class="max-w-4xl mx-auto space-y-2">
                <h2 class="text-xl sm:text-2xl font-bold tracking-wide">Health Care Investors</h2>
                <p class="text-xs sm:text-sm text-slate-200 font-normal">
                    Let's build the future of healthcare together
                </p>
                <div class="pt-1">
                    <a href="#" class="text-xs sm:text-sm font-semibold text-white hover:text-gray-200 transition">
                        [Investor Relations <span class="inline-block text-xs">→</span>] <span class="text-[#d92222] font-semibold hover:underline">Click link</span>
                    </a>
                </div>
            </div>
          </section>
  `;
}

// ==========================================
// 5. CONTACT US VIEW (PAGE 7 & 8 SPEC)
// ==========================================
function renderContactView() {
  return `
    <!-- Page Header Banner -->
        <section class="bg-slate-50 border-b border-slate-200 py-6 sm:py-8 text-center px-4">
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Contact Us</h1>
            <p class="text-slate-600 text-xs max-w-xl mx-auto">Have a question, suggestion, or opportunity to share? Get in touch with our team.</p>
            <p class="text-[#b81414] text-xs font-medium mt-1">We'd love to hear from you.</p>
        </section>

        <div class="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10 sm:space-y-14">

            <!-- ================= "HOW CAN WE HELP?" SECTION ================= -->
            <section class="max-w-4xl mx-auto">
                <h2 class="text-lg sm:text-xl font-bold text-slate-900 text-center mb-6">How can we help?</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Card 1: General Support -->
                    <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs hover:border-slate-300 transition">
                        <div class="flex items-center space-x-2.5 mb-2.5">
                            <i class="fas fa-comment text-slate-800 text-xs"></i>
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm">General Support</h3>
                        </div>
                        <p class="text-slate-600 text-xs mb-3">Questions about using Saino Health.</p>
                        <a href="#" class="text-[#b81414] text-xs font-medium hover:underline inline-flex items-center">
                            Get Support <span class="ml-1.5 text-sm">→</span>
                        </a>
                    </div>

                    <!-- Card 2: Appointment Help -->
                    <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs hover:border-slate-300 transition">
                        <div class="flex items-center space-x-2.5 mb-2.5">
                            <i class="far fa-calendar text-slate-800 text-xs"></i>
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Appointment Help</h3>
                        </div>
                        <p class="text-slate-600 text-xs mb-3">Need help with an appointment or booking?</p>
                        <a href="#" class="text-[#b81414] text-xs font-medium hover:underline inline-flex items-center">
                            Get Appointment Help <span class="ml-1.5 text-sm">→</span>
                        </a>
                    </div>

                    <!-- Card 3: Provider Support -->
                    <div class="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs hover:border-slate-300 transition">
                        <div class="flex items-center space-x-2.5 mb-2.5">
                            <i class="fas fa-building text-slate-800 text-xs"></i>
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Provider Support</h3>
                        </div>
                        <p class="text-slate-600 text-xs mb-3">Already listed or want to join Saino?</p>
                        <a href="#" class="text-[#b81414] text-xs font-medium hover:underline inline-flex items-center">
                            Provider Support <span class="ml-1.5 text-sm">→</span>
                        </a>
                    </div>
                </div>
            </section>

            <!-- ================= CONTACT FORM & SIDEBAR SECTION ================= -->
            <section class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-6 md:p-10">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <!-- Contact Form (7 Cols on Desktop) -->
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
                        <h3 class="text-base font-bold text-slate-900 mb-0.5">Send Us a Message</h3>
                        <p class="text-[11px] text-slate-500 mb-5">Talk to <span class="text-[#b81414] font-semibold">Saino Health</span></p>

                        <form class="space-y-3.5">
                            <div>
                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                                <input type="text" placeholder="Write your name" class="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#b81414]">
                            </div>

                            <div>
                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                                <input type="email" placeholder="Write your email address" class="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#b81414]">
                            </div>

                            <div>
                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                                <input type="text" placeholder="Write standard subject" class="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#b81414]">
                            </div>

                            <div>
                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Message</label>
                                <textarea rows="3" placeholder="Write your message..." class="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#b81414]"></textarea>
                            </div>

                            <button type="submit" class="w-full sm:w-auto bg-[#b81414] hover:bg-[#961010] text-white font-semibold text-xs px-5 py-2.5 rounded transition">
                                Send Message
                            </button>
                        </form>
                    </div>

                    <!-- Get In Touch Sidebar (5 Cols on Desktop) -->
                    <div class="lg:col-span-5 space-y-5 pt-2">
                        <h3 class="text-base font-bold text-slate-900 mb-4">Get in Touch</h3>

                        <div class="flex items-start space-x-3">
                            <i class="fas fa-phone text-slate-500 text-xs mt-1"></i>
                            <div>
                                <h4 class="font-bold text-slate-900 text-xs">Call us</h4>
                                <p class="text-[10px] text-slate-400 mb-0.5">Call our team Mon-Fri 9am to 6pm</p>
                                <a href="tel:+9779871040212" class="text-xs font-semibold text-slate-800 hover:text-[#b81414]">+977-9871040212</a>
                            </div>
                        </div>

                        <div class="flex items-start space-x-3">
                            <i class="fas fa-envelope text-slate-500 text-xs mt-1"></i>
                            <div>
                                <h4 class="font-bold text-slate-900 text-xs">Email us</h4>
                                <a href="mailto:support@sainohealth.com" class="text-xs font-semibold text-[#b81414] hover:underline">support@sainohealth.com</a>
                            </div>
                        </div>

                        <div class="flex items-start space-x-3">
                            <i class="fas fa-location-dot text-slate-500 text-xs mt-1"></i>
                            <div>
                                <h4 class="font-bold text-slate-900 text-xs">Visit us</h4>
                                <p class="text-xs text-slate-500">India</p>
                            </div>
                        </div>

                        <div class="pt-2">
                            <p class="text-[11px] text-slate-500 mb-2 font-medium">Follow SAINO Health</p>
                            <div class="flex space-x-2">
                                <a href="#" class="w-7 h-7 rounded-full bg-[#b81414] text-white flex items-center justify-center hover:bg-[#961010] text-[10px] transition"><i class="fab fa-facebook-f"></i></a>
                                <a href="#" class="w-7 h-7 rounded-full bg-[#b81414] text-white flex items-center justify-center hover:bg-[#961010] text-[10px] transition"><i class="fab fa-instagram"></i></a>
                                <a href="#" class="w-7 h-7 rounded-full bg-[#b81414] text-white flex items-center justify-center hover:bg-[#961010] text-[10px] transition"><i class="fab fa-twitter"></i></a>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
  `;
}
  function renderFaqsView() {
  return `
  <section class="max-w-4xl mx-auto">
                <div class="text-center mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1.5">Frequently Asked Questions</h2>
                    <p class="text-slate-500 text-xs">Find quick answers to common questions about Saino Health.</p>
                </div>

                <div class="space-y-3">
                    <!-- FAQ Item 1 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">01. What is Saino Health?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Saino Health is a healthcare discovery platform that helps users find, explore, compare and connect with healthcare providers and services across India.
                        </p>
                    </div>

                    <!-- FAQ Item 2 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">02. How can I find a healthcare provider?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Use the search bar or Discovery page to find hospitals, clinics, diagnostic centres, wellness centres, ambulance services and blood banks near you.
                        </p>
                    </div>

                    <!-- FAQ Item 3 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">03. How do I book an appointment?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Open a provider's profile, check the available services and appointment options, then select your preferred date and time to book.
                        </p>
                    </div>

                    <!-- FAQ Item 4 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">04. How are healthcare providers verified?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Saino uses a verification system to identify providers whose information has been verified. Look for the Saino Verified badge on provider listings.
                        </p>
                    </div>

                    <!-- FAQ Item 5 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">05. Can I read or write reviews?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Yes. Users can share their healthcare experiences, rate providers and mark helpful reviews. You can also participate in provider-specific discussions.
                        </p>
                    </div>

                    <!-- FAQ Item 6 -->
                    <div class="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-xs">
                        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                            <h3 class="font-bold text-slate-900 text-xs sm:text-sm pr-2">06. Can I ask other patients questions?</h3>
                            <i class="fas fa-plus text-slate-800 text-xs cursor-pointer shrink-0"></i>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            Yes. You can join provider discussions or ask the community about other patients' experiences with a healthcare provider.
                        </p>
                    </div>
                </div>
            </section>
  
  `;
}

// ==========================================
// 6. AD CAROUSEL CONTROLLER (7-8 Scrolling Ads)
// ==========================================
function initAdCarousel() {
  if (AppState.adAutoPlayInterval) {
    clearInterval(AppState.adAutoPlayInterval);
  }
  AppState.adAutoPlayInterval = setInterval(() => {
    nextAd();
  }, 6000);
}

function nextAd() {
  const total = window.SAINO_DATA.promotionalAds.length;
  AppState.currentAdIndex = (AppState.currentAdIndex + 1) % total;
  updateAdTrack();
}

function prevAd() {
  const total = window.SAINO_DATA.promotionalAds.length;
  AppState.currentAdIndex = (AppState.currentAdIndex - 1 + total) % total;
  updateAdTrack();
}

function goToAd(index) {
  AppState.currentAdIndex = index;
  updateAdTrack();
}

function updateAdTrack() {
  const track = document.getElementById('adTrack');
  if (track) {
    track.style.transform = `translateX(-${AppState.currentAdIndex * 100}%)`;
  }
  const indicators = document.querySelectorAll('#adIndicators button');
  indicators.forEach((btn, idx) => {
    if (idx === AppState.currentAdIndex) {
      btn.className = 'w-5 h-2 rounded-full transition-all bg-sky-600';
    } else {
      btn.className = 'w-2 h-2 rounded-full transition-all bg-slate-300';
    }
  });
}

// ==========================================
// 7. FILTERS & SEARCH LOGIC
// ==========================================
function getFilteredProviders() {
  const normalize = value => String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const categoryKey = value => normalize(value).replace(/\s+/g, '');
  const text = value => Array.isArray(value) ? value.join(' ') : (value == null ? '' : String(value));
  return AppState.providers.filter(p => {
    // Category match
    if (AppState.selectedCategory !== 'all' && categoryKey(p.category) !== categoryKey(AppState.selectedCategory)) {
      return false;
    }
    // Location match
    if (AppState.selectedLocation !== 'all') {
      const queryLocation = normalize(AppState.selectedLocation);
      const providerLocation = normalize([p.city, p.location, p.address].filter(Boolean).join(' '));
      const matchLoc = queryLocation === 'bengaluru'
        ? /bengaluru|bangalore/.test(providerLocation)
        : providerLocation.includes(queryLocation);
      if (!matchLoc) return false;
    }
    // Verification badge match
    if (AppState.selectedVerification !== 'all' && p.verification !== AppState.selectedVerification) {
      return false;
    }
    // Search live provider, doctor, service and location fields safely.
    if (AppState.searchQuery.trim() !== '') {
      const q = normalize(AppState.searchQuery).replace(/\bbangalore\b/g, 'bengaluru');
      const haystack = normalize([
        p.name, p.category, p.city, p.location, p.address, p.about, p.description, p.leadDoctor,
        text(p.departments), ...(Array.isArray(p.doctors) ? p.doctors.flatMap(d => [d.name, d.full_name, d.department, d.specialization, d.qualification]) : []),
        ...(Array.isArray(p.services) ? p.services.flatMap(s => [s.name, s.category, s.department, s.description]) : [])
      ].join(' ')).replace(/\bbangalore\b/g, 'bengaluru');
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (AppState.sortBy === 'rating') return b.rating - a.rating;
    if (AppState.sortBy === 'likes') return b.likesCount - a.likesCount;
    if (AppState.sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
    // Default recommended: Pro first, then Prime, then Listed
    const rank = { pro: 3, prime: 2, listed: 1 };
    return (rank[b.verification] || 0) - (rank[a.verification] || 0);
  });
}

function renderMarketplaceSearchResults() {
  const providers = getFilteredProviders();
  const city = AppState.selectedLocation && AppState.selectedLocation !== 'all' ? AppState.selectedLocation : '';
  const criteria = [AppState.searchQuery.trim(), city].filter(Boolean).join(' · ');
  return `<section class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
    <button type="button" onclick="navigateTo('marketplace')" class="mb-3 text-xs font-bold text-red-700 hover:underline">← Back to home</button>
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 class="text-2xl font-black text-slate-900">Search results</h1><p class="mt-1 text-sm text-slate-500">${escapeCommunityText(criteria || 'Healthcare providers')} · ${providers.length} found</p></div><button type="button" onclick="clearMarketplaceSearch()" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700">Clear search</button></div>
    <div class="mb-5 flex flex-wrap gap-2">${[['all','All'],['hospital','Hospitals'],['clinic','Clinics'],['diagnostic','Diagnostics'],['bloodbank','Blood banks']].map(([id,label]) => `<button type="button" onclick="searchProviderCategory('${id}')" class="rounded-full border px-3 py-2 text-xs font-bold ${AppState.selectedCategory === id ? 'border-red-700 bg-red-700 text-white' : 'border-slate-200 bg-white text-slate-700'}">${label}</button>`).join('')}</div>
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">${providers.length ? providers.map(provider => renderProviderCard(provider)).join('') : '<div class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 class="font-bold text-slate-900">No matching published providers</h2><p class="mt-2 text-sm text-slate-500">Try another spelling, city, or provider category. Results include approved live listings only.</p></div>'}</div>
  </section>`;
}

window.searchProviderCategory = function(category) {
  AppState.selectedCategory = category || 'all';
  renderApp();
};
window.clearMarketplaceSearch = function() {
  AppState.searchQuery = '';
  AppState.selectedLocation = 'all';
  AppState.selectedCategory = 'all';
  const heroInput = document.getElementById('heroSearchInput'); if (heroInput) heroInput.value = '';
  const locationInput = document.getElementById('heroLocationSelect'); if (locationInput) locationInput.value = 'all';
  renderApp();
};

function filterCategory(catId) {
  if (catId === "homecare" && AppState.activeView !== "homecare") {
    window.captureServiceReturnView();
  }
  AppState.selectedCategory = catId;
  navigateTo(catId);
}

function filterBookingType(bookingId) {
  AppState.selectedBookingType = bookingId;
  // Map booking type to most relevant category if needed
  if (bookingId === 'ambulance') {
    AppState.searchQuery = 'Ambulance';
  } else if (bookingId === 'bloodbank_booking') {
    AppState.selectedCategory = 'bloodbank';
  } else if (bookingId === 'home_nurse' || bookingId === 'home_doc') {
    AppState.selectedCategory = 'homecare';
  } else if (bookingId === 'wellness_booking') {
    AppState.selectedCategory = 'wellness';
  }
  renderApp();
}

function filterVerification(tier) {
  AppState.selectedVerification = tier;
  renderApp();
}

function changeSort(val) {
  AppState.sortBy = val;
  renderApp();
}

function resetAllFilters() {
  AppState.selectedCategory = 'all';
  AppState.selectedLocation = 'all';
  AppState.selectedVerification = 'all';
  AppState.selectedBookingType = 'all';
  AppState.searchQuery = '';
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = '';
  renderApp();
}

// ==========================================
// 8. INTERACTIVE MODALS & WHATSAPP ENGINE
// ==========================================

// Like & Interested Toggles
async function toggleLike(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  try {
    const visitorId = getSainoVisitorId();
    const response = await fetch(`${window.SAINO_API_ORIGIN || ''}/api/public/providers/${encodeURIComponent(providerId)}/like`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId, liked: !p.isLiked })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Like could not be saved.');
    p.isLiked = payload.liked;
    p.likesCount = Number(payload.likes_count) || 0;
  } catch (error) {
    showToast(error.message || 'Like could not be saved.');
    return;
  }
  renderApp();
  showToast(p.isLiked ? `Liked ${p.name}` : `Unliked ${p.name}`);
}

function toggleInterested(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  p.isInterested = !p.isInterested;
  p.interestedCount += p.isInterested ? 1 : -1;
  renderApp();
  showToast(p.isInterested ? `Marked Interested in ${p.name}` : `Removed Interest`);
}

function openProviderProfile(providerId) {
  const p = AppState.providers.find(
    x => String(x.id) === String(providerId) ||
         String(x.name) === String(providerId)
  );

  if (!p) return;

  const category = String(p.category || '').toLowerCase();

  // Clinic → Clinic Profile
  if (category === 'clinic' && typeof window.openClinicProfile === 'function') {
    window.openClinicProfile(providerId);
    return;
  }

  // Hospital → Hospital Profile
  if (category === 'hospital' && typeof window.openHospitalProfile === 'function') {
    window.openHospitalProfile(providerId);
    return;
  }

  // Diagnostic → Same full profile layout as Hospital
  if (category === 'diagnostic' && typeof window.openDiagnosticProfile === 'function') {
    window.openDiagnosticProfile(providerId);
    return;
  }

  // Wellness → Same full profile layout as Hospital
  if (category === 'wellness' && typeof window.openWellnessProfile === 'function') {
    window.openWellnessProfile(providerId);
    return;
  }

  // Insurance → Same full profile layout as Hospital
  if (category === 'insurance' && typeof window.openHospitalProfile === 'function') {
    window.openHospitalProfile(providerId);
    return;
  }

  if (["homecare", "bloodbank"].includes(category) && typeof window.openHospitalProfile === "function") {
    window.openHospitalProfile(providerId);
    return;
  }

  // Fallback only for other categories
  openProviderModal(providerId);
}

window.openProviderProfile = openProviderProfile;

window.openHospitalProfile = function(providerId) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const provider = allProviders.find(p => 
    p && (
      (p.id && String(p.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (p.name && p.name.toLowerCase() === String(providerId).toLowerCase())
    )
  );

  window.captureProviderReturnView();
  AppState.activeProvider = provider || { id: providerId, name: providerId };
  navigateTo('provider-profile', { providerId: providerId });
};

// Aliases taaki clinics, diagnostics, wellness sabhi se yahi full page khule
window.openClinicProfile = window.openHospitalProfile;
window.openDiagnosticProfile = window.openHospitalProfile;
window.openWellnessProfile = window.openHospitalProfile;

function renderHospitalProfileView(providerId) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const provider = allProviders.find(p => 
    p && (
      (p.id && String(p.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (p.name && p.name.toLowerCase() === String(providerId).toLowerCase())
    )
  ) || ((AppState.activeProvider?.doctors || []).length ? AppState.activeProvider : null);
  if (provider) setTimeout(() => window.loadProviderBookingQr?.(provider.id), 0);
  if (!provider) return '<section class="max-w-4xl mx-auto p-8 text-center"><h1 class="text-2xl font-bold">Provider listing unavailable</h1><p class="mt-2 text-slate-600">This profile is not currently available from the live marketplace.</p><button class="mt-5 px-4 py-2 rounded-lg border" onclick="navigateTo(\'marketplace\')">Back to marketplace</button></section>';

  const name = provider.name || "Healthcare Facility";
  const coverImg = provider.cover_image_url || provider.image || provider.logo_url || provider.logo || "assets/logo.png";
  const logoImg = provider.logo_url || provider.logo || "assets/logo.png";
  const locationText = provider.address || provider.location || "Location not provided";
  const ratingText = Number(provider.rating || 0);
  const reviewsCount = Number(provider.reviewsCount || provider.reviews_count || 0);

  // Real Doctors List (Doctor photo, degrees, 14 yrs exp, ₹500 fees)
  const doctorsList = Array.isArray(provider.doctors) ? provider.doctors.filter(d => d && d.id) : [];

  // Render Doctor Cards (Matches Practo Screenshot 7 & 8)
  const doctorsHtml = doctorsList.map(d => `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-4">
      <div class="flex items-start gap-4 text-left">
        <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          ${d.avatar_url ? `<img src="${d.avatar_url}" alt="${d.name}" class="w-full h-full object-cover">` : ''}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-base text-slate-900">${d.name}</h3>
            
          </div>
          <p class="text-xs text-slate-600 font-medium mt-0.5">${d.qualification || 'Qualification not provided'} • <span class="text-slate-900 font-bold">${d.department || 'Specialization not provided'}</span></p>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
            <span class="font-bold text-slate-700">${d.experience_years == null ? 'Experience not provided' : `${d.experience_years} Years Experience`}</span>
            <span>•</span>
            
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            <span>🕒 Timings: <strong>${d.shift_timings || 'Schedule not provided'}</strong></span>
          </div>
        </div>
      </div>

      <div class="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
        <div class="text-left md:text-right">
          <div class="text-xl font-black text-slate-900">${d.opd_fee == null ? 'Fee not provided' : `INR ${Number(d.opd_fee).toLocaleString('en-IN')}`}</div>
          <div class="text-[10px] text-slate-400 font-semibold">Consultation Fee</div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button onclick="openVideoConsultBooking('${provider.id}', '${d.name}', '${d.department}', '${d.opd_fee ?? ''}', '${d.id}')" class="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition">
            📹 Video Consult
          </button>
          <button onclick="openAppointmentBooking('${provider.id}', '${d.name}', '${d.department}', '${d.opd_fee ?? ''}', '${d.id}')" class="px-5 py-2.5 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold rounded-xl text-xs shadow-md transition">
            ⚡ Book Clinic Visit
          </button>
        </div>
      </div>
    </div>
  `).join("");

  return `
    <div class="bg-slate-50 min-h-screen pb-16 text-slate-900">
      
      <!-- Back Button & Breadcrumbs -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div class="flex items-center justify-between mb-3 text-xs">
          <button onclick="returnToProviderSource()" class="text-slate-600 hover:text-[#ad0b0e] font-bold flex items-center gap-1 transition">
            <span>← Back to previous page</span>
          </button>
          <span class="text-slate-400">Home › Healthcare Providers › <strong class="text-slate-800">${name}</strong></span>
        </div>

        <!-- 1. FULL COVER BANNER & OVERLAPPING LOGO (Practo Screenshot 4) -->
        <div class="relative w-full rounded-3xl overflow-hidden bg-slate-900 shadow-md" style="min-height: 250px;">
          <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${coverImg}');">
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
                  <span class="text-slate-300 font-normal">${provider.openingHours || 'Hours not provided'}</span>
                </div>
              </div>
            </div>

            <!-- Direction and provider actions -->
            <div class="flex items-center gap-2">
              <div id="provider-booking-qr" data-provider-id="${escapeReviewHtml(provider.id)}" class="min-w-40 rounded-xl bg-white/95 px-3 py-2 text-center text-slate-900 shadow-md"><span class="text-[11px] font-bold">Loading booking QR…</span></div>
            </div>
          </div>
        </div>

        <!-- 2. PRACTO SUB-NAV TABS -->
        <div class="flex items-center gap-6 border-b border-slate-200 mt-6 pb-3 text-xs font-bold text-slate-600">
          <button class="text-[#ad0b0e] border-b-2 border-[#ad0b0e] pb-3 -mb-3 font-extrabold">Overview</button>
          <button onclick="document.getElementById('profileDoctorsSec')?.scrollIntoView({behavior:'smooth'})" class="hover:text-slate-900 transition">Booking options (${doctorsList.length})</button>
          <button onclick="openProviderReviews('${provider.id}')" class="hover:text-slate-900 transition">Patient Stories &amp; Reviews</button>
        </div>

        <div class="flex items-center gap-4 py-3">
          <button type="button" onclick="toggleLike('${escapeReviewHtml(provider.id)}')" class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-700"><span aria-hidden="true">${provider.isLiked ? '♥' : '♡'}</span><span>${provider.isLiked ? 'Liked' : 'Like'} · ${Number(provider.likesCount || 0).toLocaleString()}</span></button>
          ${typeof window.savedHeartButton === 'function' ? `<span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">${window.savedHeartButton(provider.id, 'p-1')} Save provider</span>` : ''}
        </div>

        <!-- 3. MAIN SECTION: CLINIC DETAILS + DOCTORS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          <!-- Left: About & Doctors -->
          <div class="lg:col-span-2 space-y-6 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 class="font-extrabold text-sm text-slate-900 mb-2">About ${name}</h2>
              <p class="text-xs text-slate-600 leading-relaxed">${provider.about || provider.description || 'Facility description not provided.'}</p>
            </div>

            <div id="profileDoctorsSec">
              <h2 class="text-base font-extrabold text-slate-900 mb-1">Doctors &amp; Specialists Available</h2>
              <p class="text-xs text-slate-500 mb-4">Select doctor to book confirmed in-person OPD token or video consultation.</p>
              ${doctorsHtml || '<p class="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No doctor profiles have been published for this provider yet.</p>'}
            </div>
          </div>

          <!-- Right: Timings & Helpline -->
          <div class="space-y-4 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-500">Facility Information</h3>
              <div>
                <div class="text-xs font-bold text-slate-900">OPD Timings</div>
                <div class="text-xs text-slate-600 mt-0.5">${provider.openingHours || 'Operating hours not provided.'}</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-slate-900">Helpline Phone</div>
                <div class="text-xs text-slate-600 mt-0.5">${provider.phone || 'Phone not provided.'}</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-slate-700">Queue status</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Queue updates appear when this provider updates a booking.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}

window.loadProviderBookingQr = async function(providerId) {
  const mount = document.getElementById('provider-booking-qr');
  if (!mount || String(mount.dataset.providerId) !== String(providerId)) return;
  try {
    const api = window.SAINO_API_ORIGIN || '';
    const response = await fetch(`${api}/api/public/providers/${encodeURIComponent(providerId)}/qr`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success || !payload.qr) {
      mount.innerHTML = '<span class="block text-[11px] font-bold">Booking QR not generated</span><span class="mt-1 block text-[10px]">Provider can generate it in Dashboard → QR Codes.</span>';
      return;
    }
    const bookingUrl = new URL(payload.url, api || window.location.origin).toString();
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=${encodeURIComponent(bookingUrl)}`;
    mount.innerHTML = `<img src="${qrImage}" alt="Scan to book at ${escapeReviewHtml(payload.qr.label || 'this provider')}" class="mx-auto h-20 w-20 rounded-md"><span class="mt-1 block text-[10px] font-extrabold">Scan to book</span><div class="mt-1 flex justify-center gap-2"><button type="button" onclick="shareProviderBookingQr('${escapeReviewHtml(providerId)}')" class="text-[10px] font-bold text-red-700 underline">Share</button><button type="button" onclick="copyProviderBookingQr('${escapeReviewHtml(bookingUrl)}')" class="text-[10px] font-bold text-red-700 underline">Copy link</button></div>`;
  } catch (_) {
    mount.innerHTML = '<span class="text-[11px] font-bold">Booking QR could not be loaded</span>';
  }
};

window.shareProviderBookingQr = async function(providerId) {
  const api = window.SAINO_API_ORIGIN || '';
  try {
    const response = await fetch(`${api}/api/public/providers/${encodeURIComponent(providerId)}/qr`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Booking QR unavailable.');
    const url = new URL(payload.url, api || window.location.origin).toString();
    const title = AppState.providers.find(item => String(item.id) === String(providerId))?.name || 'Provider booking';
    if (navigator.share) await navigator.share({ title: `${title} booking`, text: `Scan or open this link to book directly with ${title}.`, url });
    else await navigator.clipboard.writeText(url);
  } catch (error) {
    if (error.name !== 'AbortError') showToast(error.message || 'Could not share booking link.');
  }
};

window.copyProviderBookingQr = async function(url) {
  try { await navigator.clipboard.writeText(url); showToast('Booking link copied.'); }
  catch (_) { showToast('Could not copy booking link.'); }
};

function getSavedProviderReviews() {
  const savedReviews = localStorage.getItem('SAINO_PROVIDER_REVIEWS');
  return savedReviews ? JSON.parse(savedReviews) : {};
}

function escapeReviewHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getProviderReviewEntries(provider) {
  const savedReviews = getSavedProviderReviews();
  const storedReviews = savedReviews[provider.id] || [];
  const communityReviews = (window.REVIEWS_STORE && window.REVIEWS_STORE[provider.id]) || [];
  const uniqueReviews = new Map();
  [...(provider.reviews || []), ...communityReviews, ...storedReviews].map(review => ({
    id: review.id || '',
    author: review.author || review.user || 'Patient',
    rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
    date: review.date || 'Recently',
    text: review.text || review.comment || review.body || review.title || ''
  })).filter(review => review.text).forEach(review => {
    const key = review.id || `${review.author}|${review.rating}|${review.text}`;
    if (!uniqueReviews.has(key)) uniqueReviews.set(key, review);
  });
  return Array.from(uniqueReviews.values());
}

window.renderProviderReviewsPage = function() {
  const provider = AppState.activeProvider;
  if (!provider) {
    return '<section class="max-w-4xl mx-auto px-4 py-10"><p class="text-slate-600">Provider reviews are unavailable.</p></section>';
  }

  const reviews = getProviderReviewEntries(provider);
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return `
    <section class="max-w-4xl mx-auto px-4 sm:px-6 py-6 mb-12">
      <button type="button" onclick="returnToProviderSource()" class="mb-5 text-sm font-semibold text-slate-600 hover:text-red-700">
        &larr; Back to previous page
      </button>
      <header class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4 min-w-0">
            <img src="${escapeReviewHtml(provider.logo)}" alt="" class="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient reviews</p>
              <h1 class="text-lg sm:text-xl font-bold text-slate-900">${escapeReviewHtml(provider.name)}</h1>
              <p class="text-xs text-slate-500 mt-1">${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} shared</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            ${averageRating ? `<span class="text-sm font-bold text-amber-600">★ ${averageRating} / 5</span>` : ''}
            <button type="button" onclick="openWriteReviewModal('${escapeReviewHtml(provider.id)}')" class="px-4 py-2 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white text-xs font-bold transition">
              Write a Review
            </button>
          </div>
        </div>
      </header>
      <div class="space-y-3">
        ${reviews.length ? reviews.map(review => `
          <article class="bg-white border border-slate-200 rounded-2xl p-5">
            <div class="flex items-center gap-3 mb-3">
              ${window.renderUserProfileIcon("w-10 h-10", "w-5 h-5")}
              <div class="min-w-0 flex-1">
                <h2 class="font-bold text-slate-800 text-sm">${escapeReviewHtml(review.author)}</h2>
                <span class="text-xs text-slate-400">${escapeReviewHtml(review.date)}</span>
              </div>
            </div>
            <p class="text-amber-500 text-sm mb-2" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
            <p class="text-sm text-slate-600 leading-relaxed">${escapeReviewHtml(review.text)}</p>
          </article>
        `).join('') : `
          <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
            <h2 class="font-bold text-slate-800">No reviews yet</h2>
            <p class="text-sm text-slate-500 mt-1">Be the first to share your experience with ${escapeReviewHtml(provider.name)}.</p>
          </div>
        `}
      </div>
    </section>
  `;
};

window.openProviderReviews = function(providerId) {
  const provider = AppState.providers.find(item =>
    String(item.id) === String(providerId) || String(item.name) === String(providerId)
  );
  if (!provider) {
    showToast("We couldn't find this provider's reviews.");
    return;
  }

  window.captureProviderReturnView();
  AppState.activeProvider = provider;
  navigateTo('provider-reviews', { providerId: provider.id });
};

// Provider Profile Detail Modal (Pages 10 & 11)
function openProviderModal(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  AppState.activeProvider = p;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <!-- Modal Top Bar with Cover & Doctor Spotlight -->
        <div class="relative bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 flex-shrink-0">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-2xl bg-white p-1 overflow-hidden shadow-lg border-2 border-white/40 flex-shrink-0">
                <img src="${p.logo}" alt="${p.name}" class="w-full h-full object-cover rounded-xl">
              </div>
              <div>
                <div class="flex items-center space-x-2 mb-1">
                  <h2 class="text-xl md:text-2xl font-bold">${p.name}</h2>
                  ${p.verification === 'pro' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">SAINO Verified (VIP)</span>` : ''}
                  ${p.verification === 'prime' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">SAINO VVIP</span>` : ''}
                </div>
                <p class="text-xs text-sky-200 flex items-center">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1"></i>
                  <span>${p.location}, ${p.city}</span>
                </p>
              </div>
            </div>

            <!-- Top CTA -->
            <button onclick="openBookingWhatsApp('${p.id}')" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs md:text-sm shadow-md transition flex items-center space-x-2">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Book Appointment via WhatsApp</span>
            </button>
          </div>

          <!-- Doctor Sub-Bar (Page 10 Spec) -->
          ${p.leadDoctor ? `
            <div class="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <strong class="text-white font-bold">${p.leadDoctor}</strong> · 
                <span class="text-sky-200">${p.leadDoctorRole} (${p.leadDoctorExperience})</span>
              </div>
              <div class="flex items-center space-x-3 text-slate-200">
                <span>⭐ ${Number(p.rating || 0)} (${p.reviewsCount} Reviews)</span>
                <span>♥ ${(p.likesCount).toLocaleString()} Likes</span>
                <span>👥 ${p.interestedCount} Interested</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Navigation Tabs (Page 10 & 11 Spec) -->
        <div class="border-b border-slate-200 px-6 bg-slate-50 flex space-x-6 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar flex-shrink-0">
          <button onclick="switchProviderTab('about')" id="tabBtn-about" class="py-3 border-b-2 border-sky-600 text-sky-600">About</button>
          <button onclick="switchProviderTab('services')" id="tabBtn-services" class="py-3 border-b-2 border-transparent hover:text-slate-900">Services & Fees</button>
          <button onclick="switchProviderTab('reviews')" id="tabBtn-reviews" class="py-3 border-b-2 border-transparent hover:text-slate-900">Reviews (${p.reviews ? p.reviews.length : 0})</button>
          <button onclick="switchProviderTab('activity')" id="tabBtn-activity" class="py-3 border-b-2 border-transparent hover:text-slate-900">Activity & Updates</button>
          <button onclick="switchProviderTab('photos')" id="tabBtn-photos" class="py-3 border-b-2 border-transparent hover:text-slate-900">Photos Gallery</button>
          <button onclick="switchProviderTab('availability')" id="tabBtn-availability" class="py-3 border-b-2 border-transparent hover:text-slate-900">Doctor Availability</button>
        </div>

        <!-- Tab Content Area -->
        <div id="providerTabContent" class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs text-slate-700">
          ${renderProviderAboutTab(p)}
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <div class="text-slate-500">
            Opening Hours: <strong>${p.openingHours}</strong>
          </div>
          <div class="flex items-center space-x-3">
            <button onclick="openWriteReviewModal('${p.id}')" class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition">
              ✍ Write a Review
            </button>
            <button onclick="openBookingWhatsApp('${p.id}')" class="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">
              Book on WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function switchProviderTab(tabName) {
  const p = AppState.activeProvider;
  if (!p) return;

  document.querySelectorAll('[id^="tabBtn-"]').forEach(btn => {
    btn.className = 'py-3 border-b-2 border-transparent hover:text-slate-900';
  });
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) {
    activeBtn.className = 'py-3 border-b-2 border-sky-600 text-sky-600 font-bold';
  }

  const container = document.getElementById('providerTabContent');
  if (!container) return;

  switch (tabName) {
    case 'about':
      container.innerHTML = renderProviderAboutTab(p);
      break;
    case 'services':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Available Consultation & Service Packages</h4>
          <div class="space-y-2">
            ${p.services.map(s => `
              <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <strong class="text-xs text-slate-900 block">${s.name}</strong>
                  <span class="text-[11px] text-slate-500">Consultant: ${s.doctor}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-sky-700 block">${s.fee}</span>
                  <button onclick="openBookingWhatsAppWithService('${p.id}', '${s.name}')" class="mt-1 px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] hover:bg-emerald-700 transition">
                    Book Service
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
    case 'reviews':
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900">Patient Reviews & Experiences</h4>
            <button onclick="openWriteReviewModal('${p.id}')" class="text-xs font-bold text-sky-600 hover:text-sky-700">
              + Add Your Review
            </button>
          </div>
          <div class="space-y-3">
            ${p.reviews && p.reviews.length > 0 ? p.reviews.map(r => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="font-bold text-slate-800 text-xs">${r.user}</span>
                  <span class="text-[11px] text-slate-400">${r.date}</span>
                </div>
                <div class="text-amber-500 text-xs mb-1">
                  ${'★'.repeat(Math.round(r.rating))} (${r.rating})
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">"${r.comment}"</p>
              </div>
            `).join('') : '<p class="text-xs text-slate-400">No reviews submitted yet.</p>'}
          </div>
        </div>
      `;
      break;
    case 'activity':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Recent Facility Activity & Health Drives</h4>
          <ul class="space-y-2 text-xs">
            ${p.activity.map(act => `
              <li class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5"></i>
                <span class="text-slate-700">${act}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      break;
    case 'photos':
      container.innerHTML = `
        <div>
          <h4 class="text-sm font-bold text-slate-900 mb-3">Facility & Infrastructure Photos</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${p.photos.map(photo => `
              <div class="h-36 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img src="${photo}" class="w-full h-full object-cover">
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
    case 'availability':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Doctor OPD & Consultation Availability</h4>
          <div class="space-y-2">
            ${p.availability.map(av => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-slate-900 block">${av.doctor}</strong>
                  <span class="text-slate-500">${av.day}</span>
                </div>
                <span class="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold">${av.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderProviderAboutTab(p) {
  return `
    <div class="space-y-4">
      <div>
        <h4 class="text-sm font-bold text-slate-900 mb-1">About Facility</h4>
        <p class="text-xs text-slate-600 leading-relaxed">${p.about}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location & Directions</span>
          <p class="text-xs text-slate-800 font-semibold">${p.location}, ${p.city}</p>
          ${p.website ? `<a href="${p.website}" target="_blank" class="text-xs text-sky-600 hover:underline mt-1 block">Visit Official Website →</a>` : ''}
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency & OPD Schedule</span>
          <p class="text-xs text-slate-800 font-semibold">${p.openingHours}</p>
          <span class="text-[11px] text-emerald-600 font-semibold block mt-1">✓ Instant WhatsApp Booking Enabled</span>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-bold text-slate-900 mb-2">Speciality Departments</h4>
        <div class="flex flex-wrap gap-1.5">
          ${p.departments.map(d => `<span class="px-2.5 py-1 rounded-lg bg-sky-50 text-slate-900 text-xs font-semibold">${d}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// WhatsApp Booking Modal Flow (Page 1 & 9 Requirement: Book via WhatsApp)
function openBookingWhatsApp(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-emerald-200 text-xs font-bold mb-1">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>SAINO HEALTHCARE FAST-BOOKING</span>
          </div>
          <h3 class="text-lg font-bold">Book Appointment via WhatsApp</h3>
          <p class="text-xs text-emerald-100 mt-0.5">${p.name}</p>
        </div>

        <form onsubmit="handleWhatsAppBookingSubmit(event, '${p.id}')" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Select Service / Department</label>
            <select id="wbService" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              ${p.services.map(s => `<option value="${s.name}">${s.name} (${s.fee})</option>`).join('')}
              <option value="General OPD Consultation">General OPD Consultation</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Patient Full Name</label>
              <input type="text" id="wbPatientName" required placeholder="e.g. Binod Shrestha" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Preferred Date</label>
              <input type="date" id="wbDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Brief Symptoms or Notes (Optional)</label>
            <textarea id="wbNotes" rows="2" placeholder="e.g. Chest discomfort since 2 days, need ECG & consultation..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center space-x-2 border border-emerald-100">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
            <span>Your booking request is routed directly to ${p.name}'s verified WhatsApp triage desk.</span>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md flex items-center space-x-2">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Launch WhatsApp Chat</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function openBookingWhatsAppWithService(providerId, serviceName) {
  openBookingWhatsApp(providerId);
  setTimeout(() => {
    const sel = document.getElementById('wbService');
    if (sel) sel.value = serviceName;
  }, 50);
}

function handleWhatsAppBookingSubmit(e, providerId) {
  e.preventDefault();
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const service = document.getElementById('wbService').value;
  const name = document.getElementById('wbPatientName').value;
  const date = document.getElementById('wbDate').value;
  const notes = document.getElementById('wbNotes').value;

  const textMsg = `Hello ${p.name} (via SAINO HEALTH),%0A%0AI would like to book an appointment:%0A- Patient Name: ${encodeURIComponent(name)}%0A- Service: ${encodeURIComponent(service)}%0A- Preferred Date: ${encodeURIComponent(date)}%0A- Notes: ${encodeURIComponent(notes || 'N/A')}%0A%0APlease confirm available time slots.`;
  
  // Nepal generic triage WhatsApp number or dummy support number
  const whatsappUrl = `https://wa.me/9779800000000?text=${textMsg}`;
  
  window.open(whatsappUrl, '_blank');
  closeModal();
  showToast(`WhatsApp booking link launched for ${p.name}!`);
}

function openCustomWhatsApp(topic, message) {
  const whatsappUrl = `https://wa.me/9779800000000?text=${encodeURIComponent(`[SAINO HEALTH - ${topic}] ` + message)}`;
  window.open(whatsappUrl, '_blank');
  showToast(`Opened WhatsApp chat for ${topic}`);
}

function openAdWhatsApp(adId) {
  const ad = window.SAINO_DATA.promotionalAds.find(a => a.id === adId);
  if (!ad) return;
  openCustomWhatsApp(ad.title, ad.whatsappMsg);
}

// Upgrade Badge Modal (Page 2 & 3: Upgrade your Badge takes to payment subscription)
function openUpgradeBadgeModal(preselectedTier = 'saino_prime') {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-gradient-to-r from-[#881337] via-[#991b1b] to-[#7f1d1d] p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <i data-lucide="award" class="w-4 h-4"></i>
            <span>SAINO VENDOR BADGE & SUBSCRIPTION</span>
          </div>
          <h3 class="text-xl font-bold">Upgrade Your Provider Badge & Visibility</h3>
          <p class="text-xs text-rose-100 mt-0.5">Select a verified subscription plan to gain patient trust and click-to-book leads.</p>
        </div>

        <form onsubmit="handleUpgradeSubmit(event)" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Select Verification Tier</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${window.SAINO_DATA.subscriptionTiers.map(t => `
                <label class="p-3.5 rounded-2xl border ${t.id === preselectedTier ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20' : 'border-slate-200 bg-slate-50'} flex flex-col justify-between cursor-pointer">
                  <div class="flex items-center justify-between mb-2">
                    <input type="radio" name="tierPlan" value="${t.id}" ${t.id === preselectedTier ? 'checked' : ''} class="text-rose-600">
                    <span class="text-[9px] font-black uppercase ${t.type === 'paid' ? 'text-rose-700' : 'text-slate-400'}">${t.name}</span>
                  </div>
                  <strong class="text-slate-900 text-xs">${t.badge}</strong>
                  <span class="text-rose-700 font-bold text-xs mt-1">${t.price}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hospital / Clinic / Provider Name</label>
              <input type="text" id="upgOrgName" required placeholder="e.g. Bengaluru Care Clinic" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Contact Person & Phone</label>
              <input type="text" id="upgContact" required placeholder="e.g. Dr. Karki / 98XXXXXXXX" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Business Email</label>
            <input type="email" id="upgEmail" required placeholder="admin@careclinic.np" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Payment Method (Esewa / Khalti / FonePay / Bank Transfer)</label>
            <select class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
              <option>eSewa Digital Wallet</option>
              <option>Khalti Digital Wallet</option>
              <option>FonePay Direct QR</option>
              <option>Corporate Bank Transfer / Invoice</option>
            </select>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">
              Proceed to Verification & Badge Upgrade
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function handleUpgradeSubmit(e) {
  e.preventDefault();
  closeModal();
  showToast('Badge Upgrade request submitted! Our onboarding team will verify your medical license within 4 hours.');
}

// Write Review Modal
function openWriteReviewModal(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-slate-900 p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <h3 class="text-base font-bold">Write a Review</h3>
          <p class="text-xs text-slate-400 mt-0.5">${p.name}</p>
        </div>

        <form onsubmit="handleReviewSubmit(event, '${escapeReviewHtml(p.id)}')" class="p-6 space-y-4 text-xs">
          <div>
            <label for="revName" class="block font-bold text-slate-700 mb-1.5">Your name</label>
            <input type="text" id="revName" required placeholder="Enter your name" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>

          <div>
            <span class="block font-bold text-slate-700 mb-1.5">Your rating</span>
            <input type="hidden" id="revRating" value="0">
            <div class="flex items-center gap-1" role="group" aria-label="Choose a rating from 1 to 5 stars">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" data-review-star="${star}" aria-label="${star} ${star === 1 ? 'star' : 'stars'}" aria-pressed="false" onclick="selectReviewRating(${star})" class="text-3xl leading-none text-slate-300 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-md transition" style="touch-action:manipulation">
                  ★
                </button>
              `).join('')}
              <span id="reviewRatingLabel" class="ml-2 text-xs text-slate-500">Select stars</span>
            </div>
          </div>

          <div>
            <label for="revComment" class="block font-bold text-slate-700 mb-1.5">Your feedback</label>
            <textarea id="revComment" rows="3" required placeholder="Share your experience..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"></textarea>
          </div>

          <div class="pt-1 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl transition shadow-md">
              Add Review
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.selectReviewRating = function(rating) {
  const ratingInput = document.getElementById('revRating');
  if (ratingInput) ratingInput.value = String(rating);
  document.querySelectorAll('[data-review-star]').forEach(button => {
    const selected = Number(button.getAttribute('data-review-star')) <= rating;
    button.classList.toggle('text-amber-400', selected);
    button.classList.toggle('text-slate-300', !selected);
    button.setAttribute('aria-pressed', String(Number(button.getAttribute('data-review-star')) === rating));
  });
  const ratingLabel = document.getElementById('reviewRatingLabel');
  if (ratingLabel) ratingLabel.textContent = `${rating} out of 5`;
};

function handleReviewSubmit(e, providerId) {
  e.preventDefault();
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const rating = parseInt(document.getElementById('revRating').value, 10);
  const comment = document.getElementById('revComment').value.trim();
  if (!comment) return;
  if (rating < 1 || rating > 5) {
    showToast('Please select a star rating.');
    return;
  }

  window.__SAINO_PENDING_REVIEW = { providerId: String(p.id), rating, comment };
  const session = window.getSainoPatientSession?.() || {};
  if (!session.token) {
    closeModal();
    window.openPatientOtpModal?.({ reviewFlow: true });
    return;
  }
  window.submitProviderReview();
}

window.submitProviderReview = async function() {
  const pending = window.__SAINO_PENDING_REVIEW;
  const session = window.getSainoPatientSession?.() || {};
  if (!pending || !session.token) return;
  try {
    const response = await fetch((window.SAINO_API_ORIGIN || '') + `/api/public/providers/${encodeURIComponent(pending.providerId)}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ rating: pending.rating, comment: pending.comment })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success || !payload.review) throw new Error(payload.error || 'Review could not be saved.');
    const provider = AppState.providers.find(item => String(item.id) === String(pending.providerId));
    if (provider) {
      if (!Array.isArray(provider.reviews)) provider.reviews = [];
      provider.reviews.unshift(payload.review);
      provider.reviewsCount = Number(payload.reviews_count || provider.reviews.length);
      provider.reviews_count = provider.reviewsCount;
      if (payload.rating_average) provider.rating = Number(payload.rating_average);
    }
    window.__SAINO_PENDING_REVIEW = null;
    closeModal();
    renderApp();
    showToast('Your review has been saved and published.');
  } catch (error) {
    showToast(error.message || 'Review could not be saved. Please try again.');
  }
};

function openProviderSignInModal(defaultTab = 'patient') {
  if (defaultTab !== 'provider' && typeof window.openPatientOtpModal === 'function') {
    window.openPatientOtpModal();
    return;
  }
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header with SAINO Crimson Theme -->
        <div class="bg-gradient-to-r from-[#881337] via-[#991b1b] to-[#7f1d1d] p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
            <span>SAINO HEALTH PORTAL</span>
          </div>
          <h3 class="text-xl font-bold">Sign In to Your Account</h3>
          <p class="text-xs text-rose-100 mt-0.5">Choose your account type below to continue</p>
        </div>

        <!-- Role Tab Switcher: Patient / Customer vs Provider -->
        <div class="p-6 pb-2">
          <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold mb-4">
            <button type="button" id="tabBtnPatient" onclick="switchLoginTab('patient')" class="py-2.5 rounded-xl transition ${defaultTab === 'patient' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
              👤 Patient / Customer
            </button>
            <button type="button" id="tabBtnProvider" onclick="switchLoginTab('provider')" class="py-2.5 rounded-xl transition ${defaultTab === 'provider' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
              🏥 Doctor / Provider
            </button>
          </div>
        </div>

        <!-- Patient Login Form -->
        <div id="loginFormPatient" class="${defaultTab === 'patient' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Mobile Number or Email</label>
            <input type="text" required placeholder="e.g. 9801234567 or pooja@gmail.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Password / 4-Digit OTP</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <label class="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
              <input type="checkbox" checked class="rounded text-rose-600">
              <span>Remember me</span>
            </label>
            <a href="#" onclick="showToast('OTP sent to your mobile number!')" class="text-rose-600 font-bold hover:underline">Get Login OTP</a>
          </div>
          <button type="button" onclick="handlePatientSignInSubmit(event)" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">
            Sign In as Patient / Customer
          </button>
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-900 leading-relaxed">
            💡 <strong>Fast Access:</strong> You can also browse providers and book via WhatsApp as a guest without signing in!
          </div>
        </div>

        <!-- Provider Login Form -->
        <div id="loginFormProvider" class="${defaultTab === 'provider' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Provider ID / Official Email</label>
            <input type="text" required placeholder="doctor@clinic.np or NORVIC-ADMIN" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Hospital Admin Password</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <button type="button" onclick="handleProviderSignInSubmit(event)" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md">
            Sign In to Hospital Dashboard
          </button>
          <div class="text-center text-slate-500 text-[11px]">
            New Healthcare Provider? <button type="button" onclick="openUpgradeBadgeModal('saino_prime')" class="text-rose-600 font-bold hover:underline">Register Facility Here</button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function switchLoginTab(tab) {
  const patientForm = document.getElementById('loginFormPatient');
  const providerForm = document.getElementById('loginFormProvider');
  const tabBtnPatient = document.getElementById('tabBtnPatient');
  const tabBtnProvider = document.getElementById('tabBtnProvider');

  if (tab === 'patient') {
    if (patientForm) patientForm.classList.remove('hidden');
    if (providerForm) providerForm.classList.add('hidden');
    if (tabBtnPatient) {
      tabBtnPatient.className = 'py-2.5 rounded-xl transition bg-white text-rose-700 shadow-sm';
    }
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition text-slate-500 hover:text-slate-800';
    }
  } else {
    if (patientForm) patientForm.classList.add('hidden');
    if (providerForm) providerForm.classList.remove('hidden');
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition bg-white text-rose-700 shadow-sm';
    }
    if (tabBtnPatient) {
      tabBtnPatient.className = 'py-2.5 rounded-xl transition text-slate-500 hover:text-slate-800';
    }
  }
}

function handlePatientSignInSubmit(e) {
  if (e) e.preventDefault();
  window.openPatientOtpModal();
}

function handleProviderSignInSubmit(e) {
  if (e) e.preventDefault();
  closeModal();
  showToast('Signed in to SAINO Provider Portal successfully!');
}

window.getSainoPatientSession = function() {
  try { return { token: localStorage.getItem('SAINO_PATIENT_TOKEN') || '', profile: JSON.parse(localStorage.getItem('SAINO_PATIENT_PROFILE') || 'null') }; }
  catch (_) { return { token: '', profile: null }; }
};

window.updatePatientProfileMenu = function() {
  const session = window.getSainoPatientSession();
  const user = session.profile;
  const avatar = document.getElementById('patientProfileAvatar');
  const title = document.getElementById('patientProfileTitle');
  const sub = document.getElementById('patientProfileSubtitle');
  const authLinks = document.getElementById('patientAuthLinks');
  const logout = document.getElementById('patientLogoutLink');
  const initials = user?.name ? user.name.trim().split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase() : '';
  if (avatar) avatar.innerHTML = initials ? escapeCommunityText(initials) : '<i data-lucide="user-round" class="w-4 h-4"></i>';
  const menuAvatar = document.getElementById('patientProfileAvatarMenu');
  if (menuAvatar) menuAvatar.innerHTML = initials ? escapeCommunityText(initials) : '<i data-lucide="user-round" class="w-4 h-4"></i>';
  if (title) title.textContent = user?.name || 'Welcome to SAINO';
  if (sub) sub.textContent = user?.phone || user?.email || 'Sign up or log in to book';
  if (authLinks) authLinks.classList.toggle('hidden', !!session.token);
  if (logout) logout.classList.toggle('hidden', !session.token);
  if (window.lucide) window.lucide.createIcons();
};

window.patientSignOut = function() {
  localStorage.removeItem('SAINO_PATIENT_TOKEN'); localStorage.removeItem('SAINO_PATIENT_PROFILE');
  window.updatePatientProfileMenu();
  document.getElementById('userProfileDropdown')?.classList.add('hidden');
  showToast('You have signed out.');
};


window.openPatientOtpModal = function(options = {}) {
  const modal = document.getElementById('modalContainer');
  if (!modal) return;

  window.__sainoOtpBookingFlow = Boolean(options.bookingFlow);
  window.__sainoOtpReviewFlow = Boolean(options.reviewFlow);

  const name = document.getElementById('patientName')?.value || '';
  const phone = document.getElementById('patientPhone')?.value || '';
  const email = document.getElementById('patientEmail')?.value || '';

  const esc = value => escapeCommunityText(String(value || ''));

  modal.innerHTML = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
         onclick="if(event.target===this)closeModal()">
      <section class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
               role="dialog" aria-modal="true" aria-labelledby="patientAuthTitle">

        <header class="bg-gradient-to-r from-rose-900 to-red-700 p-6 text-white">
          <button onclick="closeModal()"
                  class="float-right rounded-full bg-white/15 p-2"
                  aria-label="Close">✕</button>

          <p class="text-xs font-bold uppercase tracking-widest text-rose-100">
            SAINO Patient Account
          </p>

          <h2 id="patientAuthTitle" class="mt-2 text-xl font-black">
            ${options.bookingFlow ? 'Sign in to book your appointment' :
              options.reviewFlow ? 'Sign in to publish your review' :
              'Welcome to SAINO'}
          </h2>

          <p class="mt-1 text-xs text-rose-100">
            Use your registered mobile number or email and password.
          </p>
        </header>

        <div class="space-y-4 p-6 text-sm">

          <div class="grid grid-cols-2 gap-2">
            <button id="patientLoginTab"
                    onclick="switchPatientAuthMode('login')"
                    class="rounded-xl bg-red-700 p-3 font-bold text-white">
              Login
            </button>

            <button id="patientSignupTab"
                    onclick="switchPatientAuthMode('signup')"
                    class="rounded-xl border border-slate-200 p-3 font-bold text-slate-700">
              Create account
            </button>
          </div>

          <div id="patientNameWrap" class="hidden">
            <label class="block text-xs font-bold text-slate-700">
              Full name
              <input id="patientAuthName"
                     value="${esc(name)}"
                     class="mt-1 w-full rounded-xl border border-slate-200 p-3"
                     placeholder="Enter your full name"
                     autocomplete="name">
            </label>
          </div>

          <label class="block text-xs font-bold text-slate-700">
            Mobile number or email
            <input id="patientAuthIdentifier"
                   value="${esc(phone || email)}"
                   class="mt-1 w-full rounded-xl border border-slate-200 p-3"
                   placeholder="Mobile number or email address"
                   autocomplete="username"
                   required>
          </label>

          <label class="block text-xs font-bold text-slate-700">
            Password
            <input id="patientAuthPassword"
                   type="password"
                   class="mt-1 w-full rounded-xl border border-slate-200 p-3"
                   placeholder="Enter password"
                   autocomplete="current-password"
                   required>
          </label>

          <div id="patientConfirmPasswordWrap" class="hidden">
            <label class="block text-xs font-bold text-slate-700">
              Confirm password
              <input id="patientAuthConfirmPassword"
                     type="password"
                     class="mt-1 w-full rounded-xl border border-slate-200 p-3"
                     placeholder="Re-enter password"
                     autocomplete="new-password">
            </label>
          </div>

          <p id="patientAuthMessage"
             class="hidden rounded-xl bg-slate-50 p-3 text-xs text-slate-600"
             role="status" aria-live="polite"></p>

          <button id="patientAuthSubmit"
                  onclick="submitPatientAuth()"
                  class="w-full rounded-xl bg-red-700 py-3 font-bold text-white hover:bg-red-800">
            Login
          </button>

          <p class="text-center text-[11px] text-slate-500">
            Your account is protected by password-based authentication.
          </p>
        </div>
      </section>
    </div>`;

  switchPatientAuthMode('login');

  if (window.lucide) window.lucide.createIcons();
};

window.__sainoPatientAuthMode = 'login';

window.switchPatientAuthMode = function(mode) {
  if (!['login', 'signup'].includes(mode)) return;

  window.__sainoPatientAuthMode = mode;

  const signup = mode === 'signup';
  const nameWrap = document.getElementById('patientNameWrap');
  const confirmWrap = document.getElementById('patientConfirmPasswordWrap');
  const nameInput = document.getElementById('patientAuthName');
  const passwordInput = document.getElementById('patientAuthPassword');
  const confirmInput = document.getElementById('patientAuthConfirmPassword');
  const submit = document.getElementById('patientAuthSubmit');
  const loginTab = document.getElementById('patientLoginTab');
  const signupTab = document.getElementById('patientSignupTab');
  const message = document.getElementById('patientAuthMessage');

  if (!submit) return;

  nameWrap?.classList.toggle('hidden', !signup);
  confirmWrap?.classList.toggle('hidden', !signup);

  if (nameInput) nameInput.required = signup;
  if (confirmInput) confirmInput.required = signup;

  if (passwordInput) {
    passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
  }

  submit.textContent = signup ? 'Create account' : 'Login';

  loginTab?.classList.toggle('bg-red-700', !signup);
  loginTab?.classList.toggle('text-white', !signup);
  loginTab?.classList.toggle('border', signup);

  signupTab?.classList.toggle('bg-red-700', signup);
  signupTab?.classList.toggle('text-white', signup);
  signupTab?.classList.toggle('border', !signup);

  if (message) {
    message.textContent = '';
    message.classList.add('hidden');
  }
};

window.submitPatientAuth = async function() {
  const mode = window.__sainoPatientAuthMode || 'login';
  const signup = mode === 'signup';

  const identifier =
    document.getElementById('patientAuthIdentifier')?.value.trim() || '';
  const password =
    document.getElementById('patientAuthPassword')?.value || '';
  const name =
    document.getElementById('patientAuthName')?.value.trim() || '';
  const confirmPassword =
    document.getElementById('patientAuthConfirmPassword')?.value || '';

  const message = document.getElementById('patientAuthMessage');
  const btn = document.getElementById('patientAuthSubmit');

  const showMessage = text => {
    if (!message) return;
    message.textContent = text;
    message.classList.remove('hidden');
  };

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const normalizedPhone = identifier.replace(/[\s()-]/g, '');
  const isPhone = /^\+?[1-9]\d{7,14}$/.test(normalizedPhone);

  if (!identifier || (!isEmail && !isPhone)) {
    showMessage('Enter a valid mobile number with country code or email address.');
    return;
  }

  if (signup && !name) {
    showMessage('Please enter your full name.');
    return;
  }

  if (password.length < 8) {
    showMessage('Password must contain at least 8 characters.');
    return;
  }

  if (signup && password !== confirmPassword) {
    showMessage('Passwords do not match.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = signup ? 'Creating account…' : 'Signing in…';
  }

  try {
    const endpoint = signup
      ? '/api/public/auth/register'
      : '/api/public/auth/login';

    const response = await fetch(
      (window.SAINO_API_ORIGIN || '') + endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          identifier: isEmail ? identifier.toLowerCase() : normalizedPhone,
          password,
          ...(signup ? { full_name: name } : {})
        })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success || !result.token || !result.patient) {
      throw new Error(result.error || 'Authentication failed. Please try again.');
    }

    localStorage.setItem('SAINO_PATIENT_TOKEN', result.token);
    localStorage.setItem(
      'SAINO_PATIENT_PROFILE',
      JSON.stringify(result.patient)
    );

    const nameField = document.getElementById('patientName');
    const phoneField = document.getElementById('patientPhone');
    const emailField = document.getElementById('patientEmail');

    if (nameField && result.patient.name) {
      nameField.value = result.patient.name;
    }
    if (phoneField && result.patient.phone) {
      phoneField.value = result.patient.phone;
    }
    if (emailField && result.patient.email) {
      emailField.value = result.patient.email;
    }

    const continueBooking = Boolean(window.__sainoOtpBookingFlow);
    const continueReview = Boolean(window.__sainoOtpReviewFlow);

    closeModal();

    if (typeof window.updatePatientProfileMenu === 'function') {
      window.updatePatientProfileMenu();
    }

    if (continueBooking && typeof window.confirmAppointment === 'function') {
      window.confirmAppointment();
    } else if (
      (continueReview || window.__SAINO_PENDING_REVIEW) &&
      typeof window.submitProviderReview === 'function'
    ) {
      window.submitProviderReview();
    } else if (typeof window.showToast === 'function') {
      window.showToast(
        `Welcome, ${result.patient.name || 'patient'}.`
      );
    }

  } catch (error) {
    showMessage(error.message || 'Unable to sign in.');
  } finally {
    if (btn && document.getElementById('patientAuthSubmit')) {
      btn.disabled = false;
      btn.textContent = signup ? 'Create account' : 'Login';
    }
  }
};



function openAdCampaignModal() {
  openUpgradeBadgeModal('saino_prime');
}

function closeModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) modalContainer.innerHTML = '';
}

function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const topic = document.getElementById('contactTopic').value;
  showToast(`Thank you ${name}! Your inquiry regarding "${topic}" has been sent to our Kathmandu office.`);
  e.target.reset();
}

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastMessage');
  if (!toast || !toastText) return;

  toastText.innerText = message;
  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (AppState.toastTimeout) clearTimeout(AppState.toastTimeout);
  AppState.toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 4000);
}

// Global Event Listeners (Search Bar & Keyboard Escape)
function initGlobalEventListeners() {
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (AppState.activeView !== 'marketplace') {
        AppState.activeView = 'marketplace';
      }
      renderApp();
    });
  }

  const locationSelect = document.getElementById('globalLocationSelect');
  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      AppState.selectedLocation = e.target.value;
      if (AppState.activeView !== 'marketplace') {
        AppState.activeView = 'marketplace';
      }
      renderApp();
    });
  }

  const heroInput = document.getElementById('heroSearchInput');
  const suggestionBox = document.getElementById('heroSearchSuggestions');
  let heroSearchSequence = 0;
  let heroSearchController = null;
  const heroSubmit = () => {
    const q = heroInput?.value.trim() || '';
    AppState.searchQuery = q;
    AppState.selectedLocation = document.getElementById('heroLocationSelect')?.value || 'all';
    AppState.selectedCategory = 'all';
    if (!q && AppState.selectedLocation === 'all') return;
    suggestionBox?.classList.add('hidden');
    navigateTo('marketplace');
  };
  document.getElementById('heroSearchBtn')?.addEventListener('click', heroSubmit);
  heroInput?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); heroSubmit(); } });
  heroInput?.addEventListener('input', () => {
    const q = heroInput.value.trim().toLocaleLowerCase();
    if (!suggestionBox) return;
    if (q.length < 2) { suggestionBox.innerHTML = ''; suggestionBox.classList.add('hidden'); heroInput.setAttribute('aria-expanded', 'false'); return; }
    const matches = (AppState.providers || []).flatMap(provider => {
      const qText = `${provider.name || ''} ${provider.city || ''} ${provider.location || ''} ${provider.category || ''} ${provider.about || ''} ${(provider.departments || []).join(' ')}`.toLocaleLowerCase();
      const doctor = (provider.doctors || []).find(d => `${d.name || ''} ${d.department || ''} ${d.specialization || ''}`.toLocaleLowerCase().includes(q));
      const service = (provider.services || []).find(s => `${s.name || ''} ${s.category || ''} ${s.department || ''}`.toLocaleLowerCase().includes(q));
      return qText.includes(q) || doctor || service ? [{ provider, detail: doctor ? `${doctor.name} · ${doctor.department || 'Doctor'}` : service ? `${service.name} · Service` : `${provider.category || 'Provider'} · ${provider.city || provider.location || ''}` }] : [];
    }).slice(0, 6);
    const esc = value => escapeCommunityText(String(value || ''));
    suggestionBox.innerHTML = matches.map(({provider, detail}) => `<button type="button" data-search-provider="${esc(provider.id)}" class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-rose-50"><i data-lucide="search" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"></i><span class="min-w-0"><strong class="block truncate text-xs text-slate-900">${esc(provider.name)}</strong><small class="block truncate text-[11px] text-slate-500">${esc(detail)}</small></span></button>`).join('') || `<div class="p-3 text-xs text-slate-500">No matching providers found in live listings.</div>`;
    suggestionBox.classList.remove('hidden'); heroInput.setAttribute('aria-expanded', 'true');
    suggestionBox.querySelectorAll('[data-search-provider]').forEach(button => button.addEventListener('click', () => {
      suggestionBox.classList.add('hidden'); openProviderProfile(button.dataset.searchProvider);
    }));
    if (window.lucide) window.lucide.createIcons();
    const requestSequence = ++heroSearchSequence;
    if (heroSearchController) heroSearchController.abort();
    const requestController = new AbortController();
    const requestQuery = heroInput.value.trim();
    heroSearchController = requestController;
    window.setTimeout(async () => {
      try {
        const response = await fetch(`${window.SAINO_API_ORIGIN || ''}/api/public/search?q=${encodeURIComponent(requestQuery)}&mode=suggest`, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: requestController.signal });
        const payload = await response.json().catch(() => ({}));
        if (requestSequence !== heroSearchSequence || !response.ok || !Array.isArray(payload.items)) return;
        const liveItems = payload.items.filter(item => item.providerId).slice(0, 6);
        if (!liveItems.length) return;
        const esc = value => escapeCommunityText(String(value || ''));
        suggestionBox.innerHTML = liveItems.map(item => `<button type="button" data-search-provider="${esc(item.providerId)}" class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-rose-50"><i data-lucide="search" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"></i><span class="min-w-0"><strong class="block truncate text-xs text-slate-900">${esc(item.title)}</strong><small class="block truncate text-[11px] text-slate-500">${esc(item.subtitle || item.type)}</small></span></button>`).join('');
        suggestionBox.querySelectorAll('[data-search-provider]').forEach(button => button.addEventListener('click', () => { suggestionBox.classList.add('hidden'); openProviderProfile(button.dataset.searchProvider); }));
        if (window.lucide) window.lucide.createIcons();
      } catch (_) {}
    }, 180);
  });
  document.addEventListener('click', event => {
    if (suggestionBox && !event.target.closest('#heroSearchInput') && !suggestionBox.contains(event.target)) { suggestionBox.classList.add('hidden'); heroInput?.setAttribute('aria-expanded', 'false'); }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function bindMarketplaceEvents() {
  const prevBtn = document.getElementById('prevAdBtn');
  const nextBtn = document.getElementById('nextAdBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevAd);
  if (nextBtn) nextBtn.addEventListener('click', nextAd);
}

function bindProvidersShowcaseEvents() {
  const nearbyList = document.getElementById('nearbyProvidersList');
  if (nearbyList) {
    nearbyList.querySelectorAll('[data-location][data-category]').forEach(card => {
      const name = card.querySelector('h4')?.textContent?.trim();
      if (!name) return;
      card.dataset.providerName = name;
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Open ${name} profile`);
      card.classList.add('cursor-pointer', 'lg:flex-1');
    });
    nearbyList.addEventListener('click', event => {
      if (event.target.closest('button, a, input, select')) return;
      const card = event.target.closest('[data-provider-name]');
      if (!card || !nearbyList.contains(card)) return;
      window.openDiscoveryProviderProfile(card.dataset.providerName, card.dataset.category);
    });
    nearbyList.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('button, a, input, select')) return;
      const card = event.target.closest('[data-provider-name]');
      if (!card || !nearbyList.contains(card)) return;
      event.preventDefault();
      window.openDiscoveryProviderProfile(card.dataset.providerName, card.dataset.category);
    });
  }

  const ratedResults = document.getElementById('sainoRatedResults');
  if (ratedResults) {
    const categoryByTitle = {
      'Hospitals': 'hospital',
      'Clinics': 'clinic',
      'Diagnostic Centers': 'diagnostic',
      'Wellness Centers': 'wellness',
      'Ambulance': 'ambulance',
      'Blood Bank': 'bloodbank'
    };
    const panels = Array.from(ratedResults.querySelectorAll('div')).filter(panel =>
      panel.querySelector(':scope > h4') && panel.querySelector(':scope > div.flex.flex-col')
    );
    panels.forEach(panel => {
      const title = panel.querySelector(':scope > h4')?.textContent?.trim();
      const category = categoryByTitle[title];
      const list = panel.querySelector(':scope > div.flex.flex-col');
      const rows = list?.children || [];
      Array.from(rows).forEach(row => {
        const name = row.querySelector('.truncate')?.textContent?.trim();
        if (!name || !category) return;
        row.dataset.providerName = name;
        row.dataset.providerCategory = category;
        row.setAttribute('role', 'link');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', `Open ${name} profile`);
        row.classList.add('cursor-pointer', 'hover:bg-rose-50', 'rounded-lg', 'transition-colors');
      });
    });
    const openRatedProfile = event => {
      const row = event.target.closest('[data-provider-name][data-provider-category]');
      if (!row || !ratedResults.contains(row)) return;
      window.openDiscoveryProviderProfile(row.dataset.providerName, row.dataset.providerCategory);
    };
    ratedResults.addEventListener('click', openRatedProfile);
    ratedResults.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target.closest('[data-provider-name][data-provider-category]');
      if (!row || !ratedResults.contains(row)) return;
      event.preventDefault();
      window.openDiscoveryProviderProfile(row.dataset.providerName, row.dataset.providerCategory);
    });
  }

  window.applyProviderFilters();
}

window.openDiscoveryProviderProfile = function(providerName, category) {
  const providers = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const query = normalize(providerName);
  const words = query.split(/\s+/).filter(word => word.length > 2 && !['hospital', 'clinic', 'centre', 'center', 'service'].includes(word));
  const exact = providers.find(provider => normalize(provider.name) === query);
  if (exact) {
    window.openProviderProfile(exact.id || exact.name);
    return;
  }
  const categoryProviders = providers.filter(provider =>
    String(provider.category || '').toLowerCase() === String(category || '').toLowerCase()
  );
  const candidates = categoryProviders.length ? categoryProviders : providers;
  const match = candidates
    .map(provider => ({
      provider,
      score: words.reduce((score, word) => score + (normalize(provider.name).includes(word) ? 1 : 0), 0)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  if (match) {
    window.openProviderProfile(match.provider.id || match.provider.name);
  } else if (category) {
    filterCategory(category);
  } else {
    showToast("We couldn't find this provider's profile.");
  }
};

function getDiscoveryProviderCatalog() {
  const providers = (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const catalog = providers.map(provider => ({
    ...provider,
    discoveryCategory: provider.category === 'physiotherapy' ? 'wellness' : provider.category,
    discoveryLocation: provider.location || provider.area || provider.city || 'Location not provided'
  }));
  return catalog;
}

function renderDiscoveryProviderCard(provider) {
  const name = escapeCommunityText(provider.name);
  const category = escapeCommunityText(provider.discoveryCategory || provider.category);
  const location = escapeCommunityText(provider.discoveryLocation || provider.location || 'Location not provided');
  const categoryLabel = escapeCommunityText(String(provider.category || 'Healthcare Provider').replace(/([a-z])([A-Z])/g, '$1 $2'));
  const rating = Number(provider.rating);
  const reviewCount = Number(provider.reviewsCount || provider.reviews);
  const departments = Array.isArray(provider.departments)
    ? provider.departments.slice(0, 3)
    : String(provider.special || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 3);
  const serviceDescription = provider.leadDoctorRole || provider.about || 'Healthcare services and consultations';
  const image = provider.image || provider.logo;
  const safeId = escapeCommunityText(provider.id);
  const likeOn = Boolean(provider.isLiked);
  const reviewsButton = `<button type="button" onclick="event.stopPropagation(); openProviderReviews('${safeId}')" class="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-rose-700"><i data-lucide="message-square-text" class="h-4 w-4"></i> Reviews ${Number.isFinite(reviewCount) ? `(${reviewCount})` : ''}</button>`;
  return `
    <article data-location="${escapeCommunityText(location.toLowerCase())}" data-category="${category.toLowerCase()}" data-provider-name="${name}"
      role="link" tabindex="0" aria-label="Open ${name} profile"
      class="flex min-w-0 cursor-pointer flex-col items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row">
      <div class="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-28 sm:w-28">
        ${image ? `<img src="${escapeCommunityText(image)}" alt="${name}" class="h-full w-full object-cover" loading="lazy">` : ''}
      </div>
      <div class="w-full min-w-0 flex-1">
        <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold uppercase tracking-wide text-rose-700">${categoryLabel}</span>
            <h4 class="mt-1 break-words text-base font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">${name}</h4>
          </div>
          <span class="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">${escapeCommunityText(provider.badgeLabel || 'Saino Verified')}</span>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          ${Number.isFinite(rating) ? `<span class="font-bold text-amber-600">★ ${rating.toFixed(1)}</span>` : ''}
          ${Number.isFinite(reviewCount) ? `<span class="text-slate-500">(${reviewCount} reviews)</span>` : ''}
        </div>
        <p class="mt-2 line-clamp-2 break-words text-xs font-semibold text-slate-700">${escapeCommunityText(serviceDescription)}</p>
        ${departments.length ? `<div class="mt-2.5 flex flex-wrap gap-1.5">${departments.map(item => `<span class="max-w-full break-words rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-800">${escapeCommunityText(item)}</span>`).join('')}</div>` : ''}
        <div class="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span class="min-w-0 break-words [overflow-wrap:anywhere]">${location}</span>
          ${provider.phone ? `<span class="max-w-full break-all">${escapeCommunityText(provider.phone)}</span>` : ''}
        </div>
        <div class="mt-3 flex items-center gap-4" onclick="event.stopPropagation()">
          <button type="button" onclick="toggleLike('${safeId}')" class="inline-flex items-center gap-1 text-xs font-semibold ${likeOn ? 'text-rose-700' : 'text-slate-600'}"><i data-lucide="thumbs-up" class="h-4 w-4"></i>${likeOn ? 'Liked' : 'Like'}</button>
          ${typeof window.savedHeartButton === 'function' ? `<span class="inline-flex items-center gap-1 text-xs text-slate-600">${window.savedHeartButton(safeId, 'h-5 w-5')} Save</span>` : ''}
          ${reviewsButton}
        </div>
      </div>
    </article>
  `;
}

window.applyProviderFilters = function() {
  const list = document.getElementById('nearbyProvidersList');
  if (!list) return;
  const search = (document.getElementById('providerSearchInput')?.value || '').trim().toLowerCase();
  const location = (document.getElementById('nearbyLocationSelect')?.value || 'all').toLowerCase();
  const category = (document.getElementById('nearbyCategorySelect')?.value || 'all').toLowerCase();
  if (!list.dataset.defaultMarkup) list.dataset.defaultMarkup = list.innerHTML;
  const useDirectory = !!search || location !== 'all' || category !== 'all';
  if (useDirectory) {
    const aliases = {
      kathmandu: ['kathmandu', 'baneshwor', 'thapathali', 'maharajgunj', 'putalisadak', 'lazimpat']
    };
    const providers = getDiscoveryProviderCatalog().filter(provider => {
      const providerCategory = String(provider.discoveryCategory || provider.category || '').toLowerCase();
      const providerLocation = String(provider.discoveryLocation || provider.location || '').toLowerCase();
      const searchable = `${provider.name || ''} ${provider.category || ''} ${providerLocation} ${provider.about || ''} ${provider.description || ''} ${provider.leadDoctor || ''} ${Array.isArray(provider.departments) ? provider.departments.join(' ') : ''} ${(provider.doctors || []).map(d => `${d.name || ''} ${d.department || ''} ${d.specialization || ''}`).join(' ')} ${(provider.services || []).map(s => `${s.name || ''} ${s.category || ''} ${s.department || ''}`).join(' ')}`.toLowerCase();
      const locationMatch = location === 'all' ||
        (aliases[location] || [location]).some(value => providerLocation.includes(value));
      const categoryMatch = category === 'all' || providerCategory === category;
      return locationMatch && categoryMatch && (!search || searchable.includes(search));
    }).slice(0, 10);
    list.innerHTML = providers.map(renderDiscoveryProviderCard).join('');
  } else {
    list.innerHTML = list.dataset.defaultMarkup;
  }

  list.querySelectorAll('[data-location][data-category]').forEach(card => {
    const name = card.querySelector('h4')?.textContent?.trim() || card.dataset.providerName;
    if (name) {
      card.dataset.providerName = name;
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Open ${name} profile`);
      card.classList.add('cursor-pointer');
    }
  });
  const cards = Array.from(list.querySelectorAll('[data-location][data-category]'));
  let visibleCount = 0;
  cards.forEach(card => {
    card.style.display = '';
    visibleCount += 1;
  });

  const count = document.getElementById('nearbyResultsCount');
  if (count) count.textContent = `${visibleCount} result${visibleCount === 1 ? '' : 's'} found`;
  let emptyState = document.getElementById('nearbyNoResults');
  if (!emptyState) {
    emptyState = document.createElement('div');
    emptyState.id = 'nearbyNoResults';
    emptyState.className = 'hidden rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500';
    emptyState.textContent = 'No providers match these filters.';
    list.appendChild(emptyState);
  }
  emptyState.style.display = visibleCount > 0 ? 'none' : 'block';
};

function bindBoostEvents() {}
function bindAboutEvents() {}
function bindContactEvents() {}
// Discovery Slider Transition Engine
function nextDiscoverySlide() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % window._discoverySlides.length;
  updateDiscoverySlide();
}

function prevDiscoverySlide() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex - 1 + window._discoverySlides.length) % window._discoverySlides.length;
  updateDiscoverySlide();
}

function goToDiscoverySlide(idx) {
  AppState.discoverySlideIndex = idx;
  updateDiscoverySlide();
}

function updateDiscoverySlide() {
  const slide = window._discoverySlides[AppState.discoverySlideIndex];
  const img = document.getElementById('discSlideImg');
  const title = document.getElementById('discSlideTitle');
  const hosp = document.getElementById('discSlideHospital');
  const note = document.getElementById('discSlideNote');

  if (img && title && hosp && note) {
    img.style.opacity = '0.2';
    img.style.transform = 'scale(0.97)';
    setTimeout(() => {
      img.src = slide.image;
      title.innerText = slide.title;
      hosp.innerText = slide.hospital;
      note.innerText = slide.note;
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 200);
  } else {
    renderApp();
  }
}
window.goToDiscoverySlide = function(index) {
  if (!window._discoverySlides || !window._discoverySlides[index]) return;
  AppState.discoverySlideIndex = index;
  syncDiscoverySlideDOM();
};

window.nextDiscoverySlide = function() {
  if (!window._discoverySlides || window._discoverySlides.length === 0) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % window._discoverySlides.length;
  syncDiscoverySlideDOM();
};

function syncDiscoverySlideDOM() {
  if (typeof renderApp === 'function') {
    renderApp();
    return;
  }

  const s = window._discoverySlides[AppState.discoverySlideIndex];
  if (!s) return;

  const img = document.getElementById('discSlideImg');
  const title = document.getElementById('discSlideTitle');
  const hosp = document.getElementById('discSlideHospital');
  const note = document.getElementById('discSlideNote');

  if (img) img.src = s.image;
  if (hosp) hosp.innerText = s.hospital;
  if (note) note.innerHTML = s.desc || s.note || '';
  if (title) {
    title.innerHTML = `${s.titlePart1 || ''}<span class="text-[#3b82f6]">${s.titleHighlight || ''}</span><br>${s.titlePart2 || ''}`;
  }
}

// Load real, approved providers from the backend
async function loadNearbyProviders() {
  const target = document.getElementById('nearbyProvidersList');
  if (!target) return;

  target.innerHTML = `
    <div class="p-6 text-center text-slate-400 text-sm">
      Loading providers...
    </div>
  `;

  try {
    const response = await fetch('/api/public/providers', {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Provider API failed: ${response.status}`);
    }

    const data = await response.json();
    const providers = Array.isArray(data)
      ? data
      : (Array.isArray(data.providers) ? data.providers : []);

    if (!providers.length) {
      target.innerHTML = `
        <div class="p-6 text-center text-slate-500 text-sm">
          No approved healthcare providers are available yet.
        </div>
      `;
      return;
    }

    target.innerHTML = providers
      .map((provider, index) => renderHospitalCard(provider, index))
      .join('');

  } catch (error) {
    console.error('Unable to load live providers:', error);

    target.innerHTML = `
      <div class="p-6 text-center text-red-600 text-sm">
        Healthcare listings could not be loaded.
        Please refresh the page.
      </div>
    `;
  }
}

    // 2. Card Generator UI
    function renderHospitalCard(prov, index) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prov.mapQuery || prov.name)}`;
  const initialThree = (prov.departments || []).slice(0, 3);
  const extraCount = Math.max(0, (prov.departments || []).length - 3) || 10;

  // Badge icon aur color mapping
  const isVip = prov.badge && (prov.badge.includes('VIP') || prov.badge.includes('VVIP'));
  const isPro = prov.badge && prov.badge.includes('Pro');
  const badgeColorClass = isVip ? 'text-amber-700' : (isPro ? 'text-blue-700' : 'text-emerald-700');
  const badgeIconColor = isVip ? 'text-amber-500' : (isPro ? 'text-blue-500' : 'text-emerald-500');

  return `
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
      
      <!-- Pattern Placeholder Box (Matches Screenshot) -->
      <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" 
         class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block transition-transform hover:scale-[1.02]"
         style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;">
      </a>

      <!-- Details Section -->
      <div class="flex-1 w-full">
        
        <!-- Hospital Name (Click to Maps) -->
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-block">
          <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">${prov.name}</h4>
        </a>

        <!-- Verification Badge -->
        <div class="flex items-center space-x-1.5 mt-1">
          <svg class="w-3.5 h-3.5 ${badgeIconColor} fill-current" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-xs font-semibold ${badgeColorClass}">${prov.badge || 'Saino Verified'}</span>
        </div>

        <!-- Rating + Reviews + Discussions -->
        <div class="flex items-center space-x-2 mt-2 text-xs">
          <span class="text-amber-500 font-bold">★ ${prov.rating}</span>
          <span class="text-slate-500">(${prov.reviews})</span>
          <span class="text-slate-300">•</span>
          <div class="flex items-center space-x-1 text-slate-500">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span>${prov.discussions}</span>
          </div>
        </div>

        <!-- Specialty Type -->
        <p class="text-xs font-semibold text-slate-700 mt-2">${prov.type}</p>

        <!-- Department Chips + Clickable More Button with Unique Index -->
        <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
          ${initialThree.map(d => `<span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">${d}</span>`).join('')}
          
          <span id="card-${index}-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
            ${(prov.departments || []).slice(3).map(dept => `
              <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">${dept}</span>
            `).join('')}
          </span>

          <button 
            type="button" 
            id="card-${index}-btn"
            data-label="+ ${extraCount} more specialties"
            onclick="toggleSpecialties('card-${index}')"
            class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
            + ${extraCount} more specialties
          </button>
        </div>

        <!-- Location + Timing Status -->
        <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div class="flex items-center space-x-2">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              ${prov.location}
            </span>
            <span class="text-slate-300">•</span>
            <span>${prov.distance}</span>
          </div>
          <div class="flex items-center space-x-1.5 font-medium text-emerald-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>${prov.timing}</span>
          </div>
        </div>

      </div>

    </div>
  `;
  }
  window.navigateToHospitalPage = function(encodedName, index) {
  const hospitalName = decodeURIComponent(encodedName);
  if (window.AppState) {
    window.AppState.currentView = 'providers-showcase';
    window.AppState.selectedHospital = hospitalName;
    if (typeof renderApp === 'function') {
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
  window.location.hash = `#providers?hospital=${encodeURIComponent(hospitalName)}`;
};

// Global toggle function (Ye bilkul bahar hona chahiye)
window.toggleSpecialties = function(cardId) {
  const moreSpan = document.getElementById(cardId + '-more');
  const btn = document.getElementById(cardId + '-btn');
  
  if (moreSpan && btn) {
    if (moreSpan.classList.contains('hidden')) {
      moreSpan.classList.remove('hidden');
      moreSpan.classList.add('flex');
      btn.textContent = '- Show less specialties';
    } else {
      moreSpan.classList.add('hidden');
      moreSpan.classList.remove('flex');
      btn.textContent = btn.getAttribute('data-label') || '+ more specialties';
    }
  }
};
window.toggleFilterSection = function(contentId, arrowId) {
  const content = document.getElementById(contentId);
  const arrow = document.getElementById(arrowId);
  if (!content || !arrow) return;
  
  content.classList.toggle('hidden');
  
  if (content.classList.contains('hidden')) {
    arrow.innerHTML = '⌄'; // Down arrow when closed
  } else {
    arrow.innerHTML = '⌃'; // Up arrow when open
  }
  
  // Re-initialize Lucide icons if required in your project
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};
// =========================================================
// DISCUSSION & FACEBOOK COMMENT ENGINE (End of File)
// =========================================================

// Fallback data (Agar backend se 404 aaye tab bhi chalega)
 window.DISCUSSIONS_STORE = {
  'disc-grande': {
    id: 'disc-grande',
    hospital: 'Grande International Hospital',
    logo: 'GI',
    time: '2 hours ago',
    question: 'Has anyone recently visited their emergency department?',
    likes: 9,
    comments: [
      {
        id: 'c1', author: 'Rohan Shrestha', time: '1 hour ago', text: 'Visited last night around 11 PM with severe chest discomfort. Triage was exceptionally quick and the duty doctor was right there within minutes.', likes: 9, isLiked: false,
        replies: [
          { id: 'r1', author: 'Pooja Karki', text: 'Did they ask for an upfront cash deposit before starting treatment?' },
          { id: 'r2', author: 'Rohan Shrestha', text: 'No upfront cash deposit asked. They prioritized stabilization first.' },
          { id: 'r3', author: 'Manoj Bajracharya', text: 'That is reassuring to know, thank you for sharing.' },
          { id: 'r4', author: 'Sunita Maharjan', text: 'Their emergency team is quite professional during late hours.' },
          { id: 'r5', author: 'Karan KC', text: 'Was the billing counter crowded when you checked out?' },
          { id: 'r6', author: 'Anil Pandey', text: 'Billing takes a bit of time if insurance verification is pending.' },
          { id: 'r7', author: 'Deepa Adhikari', text: 'Always keep your insurance card handy for faster clearance.' },
          { id: 'r8', author: 'Bibek Thapa', text: 'Glad to hear you recovered well, Rohan.' },
          { id: 'r9', author: 'Rajesh Thapa', text: 'Grande ER is definitely one of the better-managed ones in Kathmandu.' },
          { id: 'r10', author: 'Sita Sharma', text: 'Do they have dedicated pediatric emergency bays as well?' },
          { id: 'r11', author: 'Dr. A. Sharma', text: 'Yes Sita, we run separate pediatric resuscitation units 24/7.' },
          { id: 'r12', author: 'Gita Shrestha', text: 'Very helpful thread, saving this for future reference.' },
          { id: 'r13', author: 'Ram Prasad', text: 'Appreciate the detailed breakdown from everyone here.' }
        ]
      }
    ]
  },
  'disc-norvic': { 
    id: 'disc-norvic', 
    hospital: 'Norvic International Hospital', 
    logo: 'NI', 
    time: '5 hours ago', 
    question: 'How was your experience with the cardiology department?', 
    likes: 17, 
    comments: [
      {
        id: 'nc1', author: 'Rajesh Thapa', time: '4 hours ago', text: 'Consultation with Dr. Shrestha was extremely thorough, though the wait time at the OPD lobby crossed nearly two hours.', likes: 17, isLiked: false,
        replies: [
          { id: 'nr1', author: 'Sunita Gurung', text: 'The morning slots are always packed, better book past noon.' },
          { id: 'nr2', author: 'Karan KC', text: 'Did you book your token online or through their app?' },
          { id: 'nr3', author: 'Rajesh Thapa', text: 'Walk-in token, which is why it took longer.' },
          { id: 'nr4', author: 'Deepa Adhikari', text: 'Online booking saves at least an hour of waiting.' },
          { id: 'nr5', author: 'Bibek Thapa', text: 'Their cath lab facilities are top-notch though.' },
          { id: 'nr6', author: 'Pooja Karki', text: 'Is valet parking easily available during peak hours?' },
          { id: 'nr7', author: 'Manoj Bajracharya', text: 'Valet gets crowded by 11 AM, better park in the basement.' },
          { id: 'nr8', author: 'Hari Prasad', text: 'How are the consultation fees for senior cardiologists?' },
          { id: 'nr9', author: 'Rajesh Thapa', text: 'It was around INR 1500 for the senior consultant slot.' },
          { id: 'nr10', author: 'Gita Shrestha', text: 'Thank you for sharing your experience, Rajesh.' },
          { id: 'nr11', author: 'Ram Prasad', text: 'Norvic staff is very courteous once you get inside.' },
          { id: 'nr12', author: 'Binod Shrestha', text: 'Cardiology wing is well-maintained.' },
          { id: 'nr13', author: 'Prakash Adhikari', text: 'Did they recommend any follow-up blood tests?' },
          { id: 'nr14', author: 'Nisha Karki', text: 'Their in-house lab reports are generated quite fast.' },
          { id: 'nr15', author: 'Dipesh Lama', text: 'Good to know, planning a visit this Thursday.' },
          { id: 'nr16', author: 'Suman Shrestha', text: 'Take care of your health, Rajesh.' },
          { id: 'nr17', author: 'Bikash Shrestha', text: 'Very informative discussion thread.' },
          { id: 'nr18', author: 'Rohan Shrestha', text: 'Agree with the online booking tip.' },
          { id: 'nr19', author: 'Aayush Koirala', text: 'Norvic has always maintained high clinical standards.' },
          { id: 'nr20', author: 'Pradeep Joshi', text: 'Appreciate the honest feedback.' },
          { id: 'nr21', author: 'Puja Lama', text: 'Thanks for the parking tip too!' }
        ]
      }
    ] 
  },
  'disc-hams': { 
    id: 'disc-hams', 
    hospital: 'HAMS Hospital', 
    logo: 'HA', 
    time: 'Yesterday', 
    question: 'Anyone know about their dermatology OPD timing and wait time?', 
    likes: 5, 
    comments: [
      {
        id: 'hc1', author: 'Sunita Gurung', time: 'Yesterday', text: 'Dermatology OPD starts right around 10 AM. Reaching by 9:30 AM helps secure a lower token number.', likes: 5, isLiked: false,
        replies: [
          { id: 'hr1', author: 'Bikash Shrestha', text: 'Can we collect tokens over a phone call a day prior?' },
          { id: 'hr2', author: 'Karan KC', text: 'Phone booking works if you call before 9 AM.' },
          { id: 'hr3', author: 'Anil Pandey', text: 'Is weekend OPD available for skin consultation?' },
          { id: 'hr4', author: 'Sunita Gurung', text: 'Only Saturday morning slots are open for limited hours.' },
          { id: 'hr5', author: 'Bibek Thapa', text: 'Thanks for the precise timing details.' },
          { id: 'hr6', author: 'Pooja Karki', text: 'This will save me a wasted trip tomorrow.' },
          { id: 'hr7', author: 'Manoj Bajracharya', text: 'Great community insight!' }
        ]
      }
    ] 
  },
  'disc-bnb': { 
    id: 'disc-bnb', 
    hospital: 'B&B Hospital', 
    logo: 'BB', 
    time: '2 days ago', 
    question: 'Is the diabetes specialist available on weekends at B&B?', 
    likes: 8, 
    comments: [
      {
        id: 'bc1', author: 'Binod Shrestha', time: '2 days ago', text: 'Endocrinology consultation is available only on Saturday mornings. Sundays are closed for specialized OPDs.', likes: 8, isLiked: false,
        replies: [
          { id: 'br1', author: 'Sita Sharma', text: 'Is prior appointment mandatory for Saturday slots?' },
          { id: 'br2', author: 'Hari Prasad', text: 'Yes, because the queue fills up by Friday evening.' },
          { id: 'br3', author: 'Gita Shrestha', text: 'Good to know before heading out.' },
          { id: 'br4', author: 'Ram Prasad', text: 'B&B orthopedics is famous, but endocrinology is good too.' },
          { id: 'br5', author: 'Karan KC', text: 'Thanks for saving my weekend plan.' },
          { id: 'br6', author: 'Anil Pandey', text: 'Are lab tests done on the same floor?' },
          { id: 'br7', author: 'Deepa Adhikari', text: 'Lab collection center is right down the hall.' },
          { id: 'br8', author: 'Bibek Thapa', text: 'Very helpful community response.' },
          { id: 'br9', author: 'Pooja Karki', text: 'Will book in advance for this Saturday.' },
          { id: 'br10', author: 'Manoj Bajracharya', text: 'Appreciate the clear update.' }
        ]
      }
    ] 
  },
  'disc-mediciti': {
    id: 'disc-mediciti',
    hospital: 'Nepal Mediciti Hospital',
    logo: 'NE',
    time: '3 days ago',
    question: 'How are the room charges and insurance claim process at Mediciti?',
    likes: 12,
    comments: [
      {
        id: 'mc1', author: 'Prakash Adhikari', time: '3 days ago', text: 'The cashless insurance desk is well-structured, though insurance discharge approval took about an hour during final billing.', likes: 12, isLiked: false,
        replies: [
          { id: 'mr1', author: 'Nisha Karki', text: 'Did they accept your corporate health card without hassle?' },
          { id: 'mr2', author: 'Dipesh Lama', text: 'Pre-authorization letter from the insurance provider speeds it up.' },
          { id: 'mr3', author: 'Suman Shrestha', text: 'Room rates are on the higher side compared to government setups.' },
          { id: 'mr4', author: 'Bikash Shrestha', text: 'Nursing care and hygiene standards justify the cost though.' },
          { id: 'mr5', author: 'Rohan Shrestha', text: 'Were deluxe rooms covered under your policy tier?' },
          { id: 'mr6', author: 'Prakash Adhikari', text: 'Only semi-private was covered under my base corporate plan.' },
          { id: 'mr7', author: 'Pradeep Joshi', text: 'Good information regarding room tiers.' },
          { id: 'mr8', author: 'Puja Lama', text: 'Mediciti infrastructure is world-class.' },
          { id: 'mr9', author: 'Karan KC', text: 'Thanks for sharing the discharge timeline details.' },
          { id: 'mr10', author: 'Anil Pandey', text: 'Helps a lot in financial planning.' },
          { id: 'mr11', author: 'Deepa Adhikari', text: 'The billing staff is cooperative if documents are complete.' },
          { id: 'mr12', author: 'Bibek Thapa', text: 'Glad your discharge went smoothly eventually.' },
          { id: 'mr13', author: 'Pooja Karki', text: 'Noting this down for future insurance claims.' },
          { id: 'mr14', author: 'Manoj Bajracharya', text: 'Very detailed patient perspective.' },
          { id: 'mr15', author: 'Hari Prasad', text: 'Thanks Prakash.' },
          { id: 'mr16', author: 'Gita Shrestha', text: 'Very useful thread.' },
          { id: 'mr17', author: 'Ram Prasad', text: 'Clear and honest feedback.' },
          { id: 'mr18', author: 'Sita Sharma', text: 'Appreciate it!' }
        ]
      }
    ]
  },
  'disc-patan': {
    id: 'disc-patan',
    hospital: 'Patan Hospital',
    logo: 'PA',
    time: '4 days ago',
    question: 'Is prior appointment mandatory for general surgery OPD?',
    likes: 10,
    comments: [
      {
        id: 'pc1', author: 'Hari Prasad', time: '4 days ago', text: 'General OPD operates entirely on a token system. Reaching early around 7:30 AM ensures you get an early slot.', likes: 10, isLiked: false,
        replies: [
          { id: 'pr1', author: 'Gita Shrestha', text: 'Can we obtain tokens via their ticketing counter?' },
          { id: 'pr2', author: 'Ram Prasad', text: 'Yes, counter opens sharply at 8 AM.' },
          { id: 'pr3', author: 'Karan KC', text: 'Is the crowd manageable on weekdays?' },
          { id: 'pr4', author: 'Hari Prasad', text: 'Mondays and Thursdays are unusually crowded.' },
          { id: 'pr5', author: 'Deepa Adhikari', text: 'Good tip about avoiding Mondays.' },
          { id: 'pr6', author: 'Bibek Thapa', text: 'Patan Hospital doctors are extremely dedicated.' },
          { id: 'pr7', author: 'Pooja Karki', text: 'Affordable and reliable healthcare option.' },
          { id: 'pr8', author: 'Manoj Bajracharya', text: 'Thanks for the early morning advice.' },
          { id: 'pr9', author: 'Sunita Gurung', text: 'Very helpful community guidance.' },
          { id: 'pr10', author: 'Binod Shrestha', text: 'Will keep this in mind.' },
          { id: 'pr11', author: 'Prakash Adhikari', text: 'Appreciate the breakdown.' },
          { id: 'pr12', author: 'Nisha Karki', text: 'Thanks Hari.' },
          { id: 'pr13', author: 'Dipesh Lama', text: 'Very clear guidance.' },
          { id: 'pr14', author: 'Suman Shrestha', text: 'Helpful notes.' }
        ]
      }
    ]
  },
  'disc-kmc': {
    id: 'disc-kmc',
    hospital: 'Kathmandu Medical College (KMC)',
    logo: 'KA',
    time: '5 days ago',
    question: 'Best pediatrician for newborn vaccination schedule here?',
    likes: 6,
    comments: [
      {
        id: 'kc1', author: 'Suman Shrestha', time: '5 days ago', text: 'The pediatric vaccination clinic runs Sunday through Friday. The nursing staff handles infants with great care.', likes: 6, isLiked: false,
        replies: [
          { id: 'kr1', author: 'Bikash Shrestha', text: 'Are government immunization vaccines available too?' },
          { id: 'kr2', author: 'Rohan Shrestha', text: 'Both private and regular national schedule vaccines are stocked.' },
          { id: 'kr3', author: 'Aayush Koirala', text: 'Do we need prior pediatrician consultation before each shot?' },
          { id: 'kr4', author: 'Suman Shrestha', text: 'A quick pediatrician checkup is done right before administration.' },
          { id: 'kr5', author: 'Puja Lama', text: 'That makes it very convenient for parents.' },
          { id: 'kr6', author: 'Karan KC', text: 'Thanks for sharing the schedule details.' }
        ]
      }
    ]
  },
  'disc-om': {
    id: 'disc-om',
    hospital: 'Om Hospital & Research Centre',
    logo: 'OM',
    time: '1 week ago',
    question: 'ENT department consultation fees and doctor availability?',
    likes: 9,
    comments: [
      {
        id: 'oc1', author: 'Dipesh Lama', time: '1 week ago', text: 'Consultation fees range between INR 800 and 1200 depending on the seniority of the ENT consultant. Evening shifts are available.', likes: 9, isLiked: false,
        replies: [
          { id: 'or1', author: 'Anil Pandey', text: 'Are evening slots available on Saturdays?' },
          { id: 'or2', author: 'Deepa Adhikari', text: 'Saturday evening OPD is usually closed.' },
          { id: 'or3', author: 'Bibek Thapa', text: 'Good to know about the fee structure.' },
          { id: 'or4', author: 'Pooja Karki', text: 'Dr. Rana in ENT is exceptionally good.' },
          { id: 'or5', author: 'Manoj Bajracharya', text: 'Thanks for confirming the consultant fees.' },
          { id: 'or6', author: 'Hari Prasad', text: 'Very helpful community post.' },
          { id: 'or7', author: 'Gita Shrestha', text: 'Will check their evening timings.' },
          { id: 'or8', author: 'Ram Prasad', text: 'Om Hospital parking is quite spacious now.' },
          { id: 'or9', author: 'Sita Sharma', text: 'Appreciate the exact price range.' },
          { id: 'or10', author: 'Binod Shrestha', text: 'Thanks for the recommendation.' },
          { id: 'or11', author: 'Prakash Adhikari', text: 'Helpful details.' },
          { id: 'or12', author: 'Nisha Karki', text: 'Thanks Dipesh.' },
          { id: 'or13', author: 'Suman Shrestha', text: 'Great thread.' }
        ]
      }
    ]
  }
};
window.activeDiscussionId = null;

function getOrCreateModalContainer() {
  let container = document.getElementById('modalContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'modalContainer';
    document.body.appendChild(container);
  }
  return container;
}


window.openDiscussionModal = async function(discussionId) {
  window.activeDiscussionId = discussionId;
  window.renderFBCommentModal();

  try {
    const res = await fetch(`/api/discussions/${discussionId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.comments && data.comments.length > 0) {
        window.DISCUSSIONS_STORE[discussionId] = data;
        window.renderFBCommentModal();
      }
    }
  } catch (err) {}
};

window.renderFBCommentModal = function() {
  const container = getOrCreateModalContainer();
  const d = window.DISCUSSIONS_STORE[window.activeDiscussionId] || { hospital: 'Community', question: 'Q&A', likes: 0, comments: [] };
  const comments = d.comments || [];
  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);

  container.innerHTML = `
    <div class="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${d.logo || 'H'}
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-sm leading-tight">${d.hospital}</h3>
              <span class="text-[11px] text-slate-400">Community Discussion • ${d.time || 'Recent'}</span>
            </div>
          </div>
          <button onclick="window.closeDiscussionModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">✕</button>
        </div>

        <div class="p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <p class="text-sm sm:text-base font-bold text-slate-900 leading-snug">"${d.question}"</p>
          <div class="flex items-center space-x-4 mt-3 text-xs text-slate-500">
            <span>❤️ ${d.likes || 0} Helpful</span>
            <span>💬 ${totalCount} Comments</span>
          </div>
        </div>

        <div id="commentsStream" class="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          ${comments.map(c => `
            <div class="flex items-start space-x-2.5">
              ${window.renderUserProfileIcon("w-8 h-8", "w-4 h-4", "mt-0.5")}
              <div class="flex-1 min-w-0">
                <div class="bg-slate-100 rounded-2xl px-4 py-2.5 inline-block max-w-full">
                  <span class="font-bold text-slate-900 block leading-tight">${c.author}</span>
                  <p class="text-slate-700 mt-1 text-xs leading-relaxed whitespace-pre-wrap">${c.text}</p>
                </div>
                <div class="flex items-center space-x-3 mt-1 ml-2 text-[11px] text-slate-500">
                  <span>${c.time || 'Just now'}</span>
                  <button onclick="window.toggleCommentLike('${c.id}')" class="flex items-center space-x-1 font-bold transition ${c.isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}">
                    <svg class="w-3.5 h-3.5 ${c.isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Like ${c.likes > 0 ? `(${c.likes})` : ''}</span>
                  </button>
                                    <button onclick="window.toggleReplyBox('${c.id}')" class="font-bold hover:text-slate-800">Reply</button>
                </div>

                ${c.replies && c.replies.length > 0 ? `
                  <div class="ml-3 pl-3 border-l-2 border-slate-200 mt-2.5 space-y-2">
                    ${c.replies.map(r => `
                      <div class="flex items-start space-x-2">
                        ${window.renderUserProfileIcon("w-6 h-6", "w-3 h-3", "mt-0.5")}
                        <div class="bg-slate-100 rounded-xl px-3 py-1.5 inline-block max-w-full">
                          <span class="font-bold text-slate-900 block text-[11px]">${r.author}</span>
                          <p class="text-slate-700 text-[11px] mt-0.5">${r.text}</p>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div id="replyBox-${c.id}" class="hidden mt-2.5 ml-3 pl-3 border-l-2 border-slate-200">
                  <div class="flex items-center space-x-2">
                    <input type="text" id="replyInput-${c.id}" placeholder="Write a reply..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800">
                    <button onclick="window.submitReply('${c.id}')" class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold">Reply</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-3 sm:p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <form onsubmit="window.submitDiscussionComment(event)" class="flex items-center space-x-2">
            <input type="text" id="fbCommentInput" required placeholder="Write a public comment..." class="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-xs">
            <button type="submit" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl text-xs">Post</button>
          </form>
        </div>

      </div>
    </div>
  `;
};

window.submitDiscussionComment = function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('fbCommentInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  if (!currentDisc) return;

  if (!currentDisc.comments) currentDisc.comments = [];
  currentDisc.comments.push({
    id: 'c_' + Date.now(),
    author: 'You (Patient)',
    time: 'Just now',
    text: text,
    likes: 0,
    isLiked: false,
    replies: []
  });

  window.renderFBCommentModal();
  setTimeout(() => {
    const stream = document.getElementById('commentsStream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, 50);
};

window.toggleReplyBox = function(commentId) {
  const box = document.getElementById(`replyBox-${commentId}`);
  if (box) box.classList.toggle('hidden');
};

window.submitReply = function(commentId) {
  const input = document.getElementById(`replyInput-${commentId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  const comment = currentDisc?.comments?.find(c => c.id === commentId);
  if (!comment) return;

  if (!comment.replies) comment.replies = [];
  comment.replies.push({ id: 'r_' + Date.now(), author: 'You', time: 'Just now', text: text });
  window.renderFBCommentModal();
};

window.toggleCommentLike = function(commentId) {
  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  const c = currentDisc?.comments?.find(x => x.id === commentId);
  if (!c) return;
  c.isLiked = !c.isLiked;
  c.likes = (c.likes || 0) + (c.isLiked ? 1 : -1);
  window.renderFBCommentModal();
};

window.closeDiscussionModal = function() {
  const container = getOrCreateModalContainer();
  if (container) container.innerHTML = '';
};

// View All Discussions Page
function loadSavedCommunityQuestions() {
  const raw = localStorage.getItem('SAINO_COMMUNITY_QUESTIONS');
  if (!raw) return [];
  try {
    const questions = JSON.parse(raw);
    if (!Array.isArray(questions)) throw new Error('Saved community questions must be an array.');
    return questions.filter(item => item && typeof item.id === 'string' && typeof item.question === 'string');
  } catch (error) {
    console.error('Unable to read saved community questions.', error);
    return [];
  }
}

function escapeCommunityText(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function countDiscussionMessages(messages) {
  return (Array.isArray(messages) ? messages : []).reduce(
    (total, message) => total + 1 + countDiscussionMessages(message.replies),
    0
  );
}

function findDiscussionMessage(messages, messageId) {
  for (const message of Array.isArray(messages) ? messages : []) {
    if (String(message.id) === String(messageId)) return message;
    const nested = findDiscussionMessage(message.replies, messageId);
    if (nested) return nested;
  }
  return null;
}

window.openDiscussionPage = function(discussionId) {
  navigateTo('discussions');
  window.setTimeout(() => {
    const target = Array.from(document.querySelectorAll('[data-thread-id]'))
      .find(card => card.dataset.threadId === String(discussionId));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
};

function renderInlineDiscussionMessage(message, discussionId, depth = 0) {
  const authorText = message.author || 'Community member';
  const author = escapeCommunityText(authorText);
  const text = escapeCommunityText(message.text || '');
  const messageId = escapeCommunityText(message.id);
  if (!text) return '';
  const replies = Array.isArray(message.replies) ? message.replies : [];
  const isLiked = Boolean(message.isLiked);
  const likes = Math.max(0, Number(message.likes) || 0);
  return `
    <div class="min-w-0 ${depth ? 'ml-6 sm:ml-9' : ''}" data-discussion-message="${messageId}">
      <div class="flex items-start gap-2.5">
        ${window.renderUserProfileIcon(depth ? 'w-7 h-7' : 'w-8 h-8', 'text-[10px]', 'mt-0.5', authorText)}
        <div class="min-w-0 max-w-[92%] rounded-2xl ${depth ? 'border border-slate-100 bg-white' : 'bg-slate-100'} px-3.5 py-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <strong class="text-[11px] text-slate-800">${author}</strong>
            <span class="text-[10px] text-slate-400">${escapeCommunityText(message.time || 'Recently')}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">${text}</p>
        </div>
      </div>
      <div class="ml-10 mt-1 flex items-center gap-4 text-[11px]">
        <button type="button" aria-pressed="${isLiked}" onclick="window.toggleInlineMessageLike('${escapeCommunityText(discussionId)}','${messageId}',this)"
          class="inline-flex items-center gap-1 font-semibold ${isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'}">
          <span aria-hidden="true">♥</span><span>${isLiked ? 'Liked' : 'Like'}${likes ? ` · ${likes}` : ''}</span>
        </button>
        <button type="button" onclick="window.toggleInlineReplyBox(this)" class="font-semibold text-slate-500 hover:text-rose-600">Reply</button>
      </div>
      <div class="discussion-message-reply-slot"></div>
      ${replies.length ? `<div class="mt-2 space-y-3">${replies.map(reply => renderInlineDiscussionMessage(reply, discussionId, depth + 1)).join('')}</div>` : ''}
    </div>
  `;
}

window.renderAllDiscussionsView = function() {
  const savedQuestions = loadSavedCommunityQuestions();
  savedQuestions.forEach(item => {
    if (!window.DISCUSSIONS_STORE[item.id]) window.DISCUSSIONS_STORE[item.id] = item;
  });
  const list = Object.values(window.DISCUSSIONS_STORE || {})
    .filter(item => item && item.id && item.question)
    .map(item => ({
      ...item,
      hospital: item.hospital || 'Saino Community',
      logo: item.logo || String(item.hospital || 'SC').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase(),
      time: item.time || 'Recently',
      replies: Number(item.replies) || (item.comments || []).reduce((total, comment) => total + 1 + (comment.replies || []).length, 0),
      helpful: Number(item.helpful) || Number(item.likes) || 0
    }))
    .reverse();

  const renderThread = item => {
    const comments = Array.isArray(item.comments) ? item.comments : [];
    const messageCount = countDiscussionMessages(comments);
    const conversation = comments.map(comment => renderInlineDiscussionMessage(comment, item.id)).join('');
    return `
      <article data-thread-id="${escapeCommunityText(item.id)}" class="scroll-mt-6 flex h-[560px] flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm text-left">
        <div class="flex shrink-0 items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-xs font-extrabold text-[#B91C1C]">${escapeCommunityText(item.logo)}</div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 class="text-sm font-bold text-slate-900">${escapeCommunityText(item.hospital)}</h2>
              <span class="text-[11px] text-slate-400">${escapeCommunityText(item.time)}</span>
            </div>
            <p class="mt-1 line-clamp-3 break-words text-sm font-semibold leading-relaxed text-slate-800">${escapeCommunityText(item.question)}</p>
            <div class="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
              <span>${messageCount} messages</span>
              <span>${item.helpful} helpful</span>
            </div>
          </div>
        </div>
        <div class="discussion-conversation-scroll mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-2xl bg-slate-50 p-3 sm:p-4">
          ${conversation || '<p class="px-2 py-1 text-xs text-slate-500">No replies yet. Start the conversation.</p>'}
        </div>
      </article>
    `;
  };

  return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 mb-16">
      <div class="mb-8">
        <button onclick="navigateTo('discovery')" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 mb-3 cursor-pointer">
          <span>← Back to Discovery</span>
        </button>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Healthcare Community Discussions</h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">Ask questions, read patient experiences, and discuss care across hospitals in Nepal.</p>
      </div>

      <div class="space-y-5">
        ${list.map(renderThread).join('')}
      </div>

      <form id="discussionReplyComposer" hidden style="display:none" class="mt-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pl-4 shadow-xs focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100"
        onsubmit="window.submitInlineDiscussionReply(event)">
        <label class="sr-only" for="discussionReplyInput">Write a reply</label>
        <input id="discussionReplyInput" name="reply" required maxlength="1000" autocomplete="off" placeholder="Write a reply..."
          class="min-w-0 flex-1 bg-transparent py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400">
        <button type="submit" aria-label="Send reply" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B91C1C] text-white transition hover:bg-[#991B1B]">
          <i data-lucide="send" class="h-4 w-4"></i>
        </button>
      </form>

      <section class="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-sm">
        <h2 class="text-base sm:text-lg font-bold text-slate-900">Ask the Community</h2>
        <p class="mt-1 text-xs sm:text-sm text-slate-500">Share a question and hear from people with real healthcare experiences.</p>
        <form class="mt-4 flex flex-col sm:flex-row items-stretch gap-3" onsubmit="submitCommunityQuestion(event)">
          <label class="sr-only" for="communityQuestionInput">Your question</label>
          <textarea id="communityQuestionInput" rows="2" maxlength="1000" required
            placeholder="Write your question here..."
            class="min-h-[72px] flex-1 resize-y rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"></textarea>
          <button type="submit" class="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#B91C1C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#991B1B] sm:self-stretch">
            <i data-lucide="send" class="h-4 w-4"></i>
            Send
          </button>
        </form>
      </section>
    </div>
  `;
};

window.submitInlineDiscussionReply = function(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const discussionId = form.dataset.discussionId;
  const input = form.elements.reply;
  const text = input.value.trim();
  const discussion = window.DISCUSSIONS_STORE[discussionId];
  const parentMessage = findDiscussionMessage(discussion?.comments, form.dataset.parentId);
  if (!text || !discussion || !parentMessage) return;

  if (!Array.isArray(parentMessage.replies)) parentMessage.replies = [];
  parentMessage.replies.push({
    id: `r_${Date.now()}`,
    author: 'You (Patient)',
    time: 'Just now',
    text,
    likes: 0,
    isLiked: false,
    replies: []
  });
  renderApp();
  const updatedThread = Array.from(document.querySelectorAll('[data-thread-id]'))
    .find(card => card.dataset.threadId === discussionId);
  const conversation = updatedThread?.querySelector('.discussion-conversation-scroll');
  if (conversation) conversation.scrollTop = conversation.scrollHeight;
};

window.toggleInlineReplyBox = function(button) {
  const message = button.closest('[data-discussion-message]');
  const discussion = message?.closest('[data-thread-id]');
  const slot = message?.querySelector(':scope > .discussion-message-reply-slot');
  const composer = document.getElementById('discussionReplyComposer');
  if (!message || !discussion || !slot || !composer) return;

  const isSameTarget = composer.dataset.discussionId === discussion.dataset.threadId &&
    composer.dataset.parentId === message.dataset.discussionMessage;
  if (composer.style.display !== 'none' && isSameTarget) {
    composer.hidden = true;
    composer.style.display = 'none';
    return;
  }

  composer.dataset.discussionId = discussion.dataset.threadId;
  composer.dataset.parentId = message.dataset.discussionMessage;
  slot.appendChild(composer);
  composer.hidden = false;
  composer.style.display = 'flex';
  composer.querySelector('input')?.focus();
};

window.toggleInlineMessageLike = function(discussionId, messageId, button) {
  const message = findDiscussionMessage(window.DISCUSSIONS_STORE[discussionId]?.comments, messageId);
  if (!message) return;
  message.isLiked = !message.isLiked;
  message.likes = Math.max(0, (Number(message.likes) || 0) + (message.isLiked ? 1 : -1));
  button.setAttribute('aria-pressed', String(message.isLiked));
  button.classList.toggle('text-rose-600', message.isLiked);
  button.classList.toggle('text-slate-500', !message.isLiked);
  button.innerHTML = `<span aria-hidden="true">♥</span><span>${message.isLiked ? 'Liked' : 'Like'}${message.likes ? ` · ${message.likes}` : ''}</span>`;
};

window.submitCommunityQuestion = function(event) {
  event.preventDefault();
  const input = document.getElementById('communityQuestionInput');
  const question = input?.value.trim();
  if (!question) {
    showToast('Write a question before sending.');
    input?.focus();
    return;
  }

  const item = {
    id: `community-${Date.now()}`,
    hospital: 'Saino Community',
    logo: 'SC',
    time: 'Just now',
    question,
    likes: 0,
    comments: [],
    createdAt: Date.now()
  };
  const savedQuestions = loadSavedCommunityQuestions();
  savedQuestions.unshift(item);
  try {
    localStorage.setItem('SAINO_COMMUNITY_QUESTIONS', JSON.stringify(savedQuestions));
  } catch (error) {
    console.error('Unable to save community question.', error);
    showToast('Your question could not be saved. Please try again.');
    return;
  }
  window.DISCUSSIONS_STORE[item.id] = item;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Your question was sent to the community.');
};
// 1. LocalStorage Store & Filter States
window.REVIEWS_STORE = JSON.parse(localStorage.getItem('NEPAL_HEALTH_REVIEWS')) || {
  'disc-grande': [
    { id: 'rev-1', author: 'Priya Maharjan', rating: 5, timestamp: Date.now() - 259200000, date: '3 days ago', text: 'The emergency department at Grande was incredibly efficient. My father was admitted within minutes and the staff was professional throughout.', hospitalName: 'Grande International Hospital', providerResponse: "Thank you for your kind words. We're glad your father received prompt care.", helpful: 24, commentsCount: 3 }
  ],
  'disc-norvic': [
    { id: 'rev-1', author: 'Rajesh Thapa', rating: 4, timestamp: Date.now() - 604800000, date: '1 week ago', text: 'Good cardiologist but the waiting time is long. Arrived at 10am, waited nearly 2 hours before seeing Dr. Shrestha. The consultation was thorough.', hospitalName: 'Norvic International Hospital', helpful: 18, commentsCount: 5 }
  ],
  'disc-hams': [
    { id: 'rev-1', author: 'Sunita Gurung', rating: 5, timestamp: Date.now() - 1209600000, date: '2 weeks ago', text: "Excellent physiotherapy unit at HAMS. Three weeks of treatment for my knee injury and I'm back to normal. The therapists genuinely care.", hospitalName: 'HAMS Hospital', helpful: 31, commentsCount: 7 }
  ]
};

window.currentReviewFilter = window.currentReviewFilter || 'recent';

window.setPatientVoiceFilter = function(filterType) {
  window.currentReviewFilter = filterType;
  if (typeof renderApp === 'function') renderApp();
};

window.setReviewFilter = function(filterType) {
  window.currentReviewFilter = filterType;
  if (typeof AppState !== 'undefined') AppState.activeView = 'all-reviews';
  if (typeof renderApp === 'function') renderApp();
};

// 2. Global Review Submit Handler
window.handleGlobalReviewSubmit = function(e) {
  if (e) e.preventDefault();
  const hospitalSelect = document.getElementById('globalReviewHospital');
  if (!hospitalSelect) return;
  
  const hospitalId = hospitalSelect.value;
  const hospitalName = hospitalSelect.options[hospitalSelect.selectedIndex].text;
  const ratingVal = parseInt(document.getElementById('globalReviewRating').value);
  const textVal = document.getElementById('globalReviewText').value.trim();
  if (!textVal) return;

  if (!window.REVIEWS_STORE[hospitalId]) window.REVIEWS_STORE[hospitalId] = [];

  window.REVIEWS_STORE[hospitalId].unshift({
    id: 'rev_' + Date.now(),
    author: 'You (Verified Patient)',
    rating: ratingVal,
    timestamp: Date.now(),
    date: 'Just now',
    text: textVal,
    hospitalName: hospitalName,
    helpful: 0,
    commentsCount: 0
  });
  

  localStorage.setItem('NEPAL_HEALTH_REVIEWS', JSON.stringify(window.REVIEWS_STORE));
  if (typeof renderApp === 'function') renderApp();
};


// 3. See more Reviews Page View Renderer
window.renderAllReviewsView = function() {
  let allReviews = [];
  const store = window.REVIEWS_STORE || {
    'disc-patan': [
      { id: 'rev-2', author: 'Deepak Kharel', rating: 4, timestamp: Date.now() - 345600000, date: '4 days ago', text: 'The doctors at Patan Hospital were very attentive. The waiting time was manageable and the staff guided me properly.', hospitalName: 'Patan Hospital', helpful: 14, commentsCount: 2 }
    ],
    'disc-om': [
      { id: 'rev-3', author: 'Anjali Singh', rating: 5, timestamp: Date.now() - 604800000, date: '1 week ago', text: 'Om Hospital provided excellent maternity care. Doctors were attentive.', hospitalName: 'Om Hospital', helpful: 20, commentsCount: 4 }
    ],
    'disc-mediciti': [
      { id: 'rev-4', author: 'Ravi Thapa', rating: 3, timestamp: Date.now() - 2592000000, date: '1 month ago', text: 'Mediciti facilities are modern, but billing took longer than expected.', hospitalName: 'Nepal Mediciti Hospital', helpful: 9, commentsCount: 1 }
    ]
  };

  const normalizeReviewText = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const reviewKeys = new Set();
  const addReview = review => {
    if (!review || typeof review !== 'object') return;
    const usableValue = value => {
      const text = String(value || '').trim();
      return text && !['undefined', 'null'].includes(text.toLowerCase()) ? text : '';
    };
    const text = usableValue(review.text) || usableValue(review.comment) || usableValue(review.body) || usableValue(review.title);
    const key = normalizeReviewText(text);
    if (!key || reviewKeys.has(key)) return;
    reviewKeys.add(key);
    allReviews.push({
      ...review,
      text,
      hospitalName: usableValue(review.hospitalName) || usableValue(review.provider) || 'Healthcare provider',
      author: usableValue(review.author) || usableValue(review.user) || 'Patient'
    });
  };

  // Flatten reviews
  Object.keys(store).forEach(hId => {
    const list = store[hId] || [];
    list.forEach(r => addReview({
      ...r,
      hospitalId: hId
    }));
  });

  (window.SAINO_DATA?.patientReviews || []).forEach(review => addReview(review));

  const providerReviews = (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  providerReviews.forEach(provider => {
    (provider.reviews || []).forEach(review => {
      addReview({
        ...review,
        id: review.id || `${provider.id || provider.name}-review`,
        rating: Number(review.rating) || 5,
        hospitalName: provider.name,
        hospitalId: provider.id || provider.name
      });
    });
  });

  // Filters
  const filter = window.currentReviewFilter || 'recent';
  const searchQuery = window.currentReviewSearch || '';

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    allReviews = allReviews.filter(r => 
      (r.hospitalName && r.hospitalName.toLowerCase().includes(q)) || 
      (r.text && r.text.toLowerCase().includes(q)) ||
      (r.author && r.author.toLowerCase().includes(q))
    );
  }

  if (filter === 'recent') {
    allReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else if (filter === 'highest') {
    allReviews.sort((a, b) => b.rating - a.rating);
  } else if (filter === 'lowest') {
    allReviews.sort((a, b) => a.rating - b.rating);
  }

  return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 mb-16 text-left">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onclick="returnFromAllReviews()" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 mb-3 cursor-pointer">
            <span>← Back to previous page</span>
          </button>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">All Patient Reviews & Experiences</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Browse verified patient feedback across healthcare providers or share your own experience.</p>
        </div>

        <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <button onclick="window.setReviewFilter('recent')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'recent' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Most Recent</button>
          <button onclick="window.setReviewFilter('highest')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'highest' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Highest Rated</button>
          <button onclick="window.setReviewFilter('lowest')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'lowest' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Lowest Rated</button>
        </div>
      </div>

      <!-- Reviews List Feed -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        ${allReviews.length === 0 ? '<p class="text-slate-400 text-center py-8 text-xs">No matching reviews found.</p>' : ''}
        ${allReviews.map(r => renderTalkReviewItem(r)).join('')}
      </div>
    </div>

  `;
};

// Helper to set filter
window.setReviewFilter = function(filter) {
  window.currentReviewFilter = filter;
  const mainContainer = document.getElementById('mainContent');
  if (mainContainer) {
    mainContainer.innerHTML = window.renderAllReviewsView();
    if (window.lucide) window.lucide.createIcons();
  }


  const stars = document.querySelectorAll('#starContainer .star-btn');
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.classList.remove('text-slate-300');
      s.classList.add('text-amber-400');
    } else {
      s.classList.remove('text-amber-400');
      s.classList.add('text-slate-300');
    }
  });
};

window.previewStarRating = function(rating) {
  const stars = document.querySelectorAll('#starContainer .star-btn');
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.classList.add('text-amber-200');
    } else {
      s.classList.remove('text-amber-200');
    }
  });
};
