const API_BASE_URL = 'http://localhost:4000/api';
async function fetchProviders(query, city) {
  try {
    let url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    if (city && city !== 'all') {
      url += `&city=${encodeURIComponent(city)}`;
    }
    const res = await fetch(url);
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('API Fetch Error:', error);
    return null;
  }
}
function renderDropdownList(providers, container) {
  if (!container) return;

  if (providers === null) {
    container.innerHTML = `
      <div class="p-3 text-xs text-rose-600 font-semibold">
        Backend is not responding (Check port 4000).
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  if (providers.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-xs text-slate-500 text-center font-medium">
        No healthcare providers found.
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = providers.map((item) => `
    <div onclick="if(typeof openProviderModal === 'function') openProviderModal('${item.id}')" class="p-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#B91C1C] transition">${item.name}</span>
          ${item.is_verified ? '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Verified</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">
          <span class="font-semibold text-slate-700">${item.category}</span> &bull; ${item.city} ${item.address ? `(${item.address})` : ''}
        </p>
      </div>
      ${item.phone ? `<span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded hidden sm:inline-block">${item.phone}</span>` : ''}
    </div>
  `).join('');

  container.classList.remove('hidden');
}

function closeDropdown(container) {
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
}

//  Live Search Setup
function setupLiveSearch({ inputId, selectId, dropdownId, btnId }) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(selectId);
  const dropdown = document.getElementById(dropdownId);
  const btn = document.getElementById(btnId);

  let debounceTimer = null;

  const triggerSearch = () => {
    const q = input ? input.value.trim() : '';
    const city = select ? select.value : '';

    if (q.length < 1) {
      closeDropdown(dropdown);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const data = await fetchProviders(q, city);
      renderDropdownList(data, dropdown);
    }, 250);
  };

  if (input) input.addEventListener('input', triggerSearch);
  if (select) select.addEventListener('change', triggerSearch);
  if (btn) btn.addEventListener('click', triggerSearch);

  document.addEventListener('click', (e) => {
    if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown(dropdown);
    }
  });
}


setupLiveSearch({
  inputId: 'globalSearchInput',
  selectId: 'globalLocationSelect',
  dropdownId: 'globalResultsDropdown',
  btnId: 'globalSearchBtn'
});

setupLiveSearch({
  inputId: 'heroSearchInput',
  selectId: 'heroLocationSelect',
  dropdownId: 'searchResultsDropdown',
  btnId: 'heroSearchBtn'
});