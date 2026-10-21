/* Blood bank directory is sourced from published provider records. */
const BLOOD_BANK_STATE = { search: '', city: 'all' };

function bloodBankProviders() {
  return (window.AppState?.providers || window.SAINO_DATA?.providers || []).filter(provider =>
    String(provider.category || provider.provider_type || '').toLowerCase().replace(/[\s_-]+/g, '') === 'bloodbank'
  );
}

function getFilteredBloodBanks() {
  const query = BLOOD_BANK_STATE.search.trim().toLocaleLowerCase();
  return bloodBankProviders().filter(provider => {
    const location = [provider.city, provider.area, provider.address, provider.location].filter(Boolean).join(' ').toLocaleLowerCase();
    if (BLOOD_BANK_STATE.city !== 'all' && !location.includes(BLOOD_BANK_STATE.city.toLocaleLowerCase())) return false;
    if (!query) return true;
    const searchable = [provider.name, location, provider.about, provider.description,
      ...(provider.departments || []), ...(provider.services || []).map(item => item.name)].join(' ').toLocaleLowerCase();
    return searchable.includes(query);
  });
}

function renderBloodBankDirectoryView() {
  const providers = getFilteredBloodBanks();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  return `<section class="min-h-[55vh] bg-slate-50 pb-12">
    <header class="border-y border-slate-200 bg-white"><div class="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <button type="button" onclick="goBackToPreviousPage()" class="mb-2 text-xs font-bold text-red-700 hover:underline">← Back</button>
      <div class="flex flex-wrap items-end justify-between gap-3"><div><h1 class="text-2xl font-black text-slate-900">Blood Banks</h1><p class="mt-1 text-sm text-slate-500">Published blood bank listings across India.</p></div><span class="text-xs font-bold text-slate-500">${providers.length} providers</span></div>
    </div></header>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div class="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <label class="relative"><span class="sr-only">Search blood banks</span><i data-lucide="search" class="absolute left-3 top-3 h-4 w-4 text-slate-400"></i><input id="bloodBankSearch" value="${esc(BLOOD_BANK_STATE.search)}" oninput="filterBloodBanks(this.value)" placeholder="Search blood bank or location" class="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"></label>
        <label><span class="sr-only">City</span><select onchange="filterBloodBankCity(this.value)" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all" ${BLOOD_BANK_STATE.city === 'all' ? 'selected' : ''}>All India</option><option value="bengaluru" ${BLOOD_BANK_STATE.city === 'bengaluru' ? 'selected' : ''}>Bengaluru / Bangalore</option><option value="goa" ${BLOOD_BANK_STATE.city === 'goa' ? 'selected' : ''}>Goa</option><option value="mumbai" ${BLOOD_BANK_STATE.city === 'mumbai' ? 'selected' : ''}>Mumbai</option><option value="delhi" ${BLOOD_BANK_STATE.city === 'delhi' ? 'selected' : ''}>Delhi</option></select></label>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        ${providers.length ? providers.map(provider => `<article class="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div class="flex min-w-0 items-center gap-4"><img src="${esc(provider.cover_image_url || provider.image || provider.logo_url || provider.logo || 'assets/logo.png')}" alt="${esc(provider.name)}" class="h-20 w-24 rounded-xl bg-slate-100 object-cover"><div class="min-w-0"><h2 class="truncate text-base font-extrabold text-slate-900">${esc(provider.name)}</h2><p class="mt-1 text-xs text-slate-500">${esc(provider.address || provider.location || provider.city || 'Location not provided')}</p><p class="mt-2 text-[11px] text-slate-500">${provider.phone ? `Phone: ${esc(provider.phone)}` : 'Contact details available on provider profile.'}</p></div></div><button type="button" onclick="openProviderProfile('${esc(provider.id)}')" class="shrink-0 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-800">View profile</button></article>`).join('') : `<div class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 class="font-bold text-slate-900">${bloodBankProviders().length ? 'No matching blood banks' : 'No published blood banks yet'}</h2><p class="mx-auto mt-2 max-w-lg text-sm text-slate-500">${bloodBankProviders().length ? 'Change the search or city filter.' : 'Approved blood bank profiles will appear here when providers publish their listing. Inventory status is shown only when a provider shares it.'}</p><button type="button" onclick="navigateTo('marketplace')" class="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Back to marketplace</button></div>`}
      </div>
    </div>
  </section>`;
}

function refreshBloodBankDOM() {
  const main = document.getElementById('mainContent');
  if (main) main.innerHTML = renderBloodBankDirectoryView();
  window.lucide?.createIcons();
}

window.filterBloodBanks = function(query) {
  BLOOD_BANK_STATE.search = query || '';
  const input = document.getElementById('bloodBankSearch');
  const position = input?.selectionStart ?? BLOOD_BANK_STATE.search.length;
  refreshBloodBankDOM();
  const next = document.getElementById('bloodBankSearch');
  next?.focus(); next?.setSelectionRange(position, position);
};

window.filterBloodBankCity = function(city) {
  BLOOD_BANK_STATE.city = city || 'all';
  refreshBloodBankDOM();
};

window.requestBlood = function(providerId) {
  window.openProviderProfile(providerId);
};
