/* Live SAINO marketplace loader. Never fall back to hardcoded sample providers. */
(function () {
  'use strict';
  const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiOrigin = localHost ? 'http://localhost:4000' : 'https://saino-backend-td51.onrender.com';
  window.SAINO_API_ORIGIN = apiOrigin;
  window.SAINO_LOAD_LIVE_MARKETPLACE = async function () {
    const response = await fetch(apiOrigin + '/api/public/providers', { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success || !Array.isArray(payload.providers)) {
      window.SAINO_DATA.providers = [];
      throw new Error(payload.error || 'Could not load approved providers from PostgreSQL.');
    }
    window.SAINO_DATA.providers = payload.providers.map(provider => ({
      ...provider,
      id: String(provider.id),
      category: String(provider.category || provider.provider_type || 'hospital').toLowerCase(),
      image: provider.cover_image_url || provider.image || provider.logo_url || provider.logo || 'assets/logo.png',
      logo: provider.logo_url || provider.logo || provider.cover_image_url || 'assets/logo.png',
      location: provider.address || provider.location || '',
      city: provider.city || provider.district || provider.province || '',
      departments: Array.isArray(provider.departments) ? provider.departments : [],
      doctors: Array.isArray(provider.doctors) ? provider.doctors : [],
      services: Array.isArray(provider.services) ? provider.services : [],
      reviews: Array.isArray(provider.reviews) ? provider.reviews : [],
      reviewsCount: Number(provider.reviewsCount || provider.reviews_count || 0),
      likesCount: Number(provider.likesCount || 0),
      interestedCount: Number(provider.interestedCount || 0),
      openingHours: provider.openingHours || '',
      verification: 'listed',
      showPhone: Boolean(provider.phone)
    }));
    window.SAINO_MARKETPLACE_LOAD_ERROR = '';
    return window.SAINO_DATA.providers;
  };
})();
