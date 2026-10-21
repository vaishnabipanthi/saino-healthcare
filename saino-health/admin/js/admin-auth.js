(function () {
  'use strict';
  const TOKEN_KEY = 'SAINO_ADMIN_TOKEN';
  const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const API_ORIGIN = localHost ? 'http://localhost:4000' : 'https://saino-backend-td51.onrender.com';
  const BASE = API_ORIGIN + '/api/admin';
  window.SAINO_API_ORIGIN = API_ORIGIN;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function showLogin(message) {
    let overlay = document.getElementById('sainoAdminLoginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sainoAdminLoginOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,20,40,.78);display:grid;place-items:center;padding:18px;font-family:Inter,Arial,sans-serif';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'grid';
    overlay.innerHTML = `<form id="sainoAdminLoginForm" style="width:min(450px,100%);background:#fff;border-radius:18px;padding:30px;box-shadow:0 24px 80px #0005;color:#14233b">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#b91c1c">SAINO HEALTH · CONTROL CENTER</div>
      <h2 style="font-size:27px;margin:9px 0 5px">Super Admin sign in</h2>
      <p style="font-size:13px;color:#64748b;margin:0 0 22px">Use the admin account created with <code>npm run create:superadmin</code>.</p>
      <label for="sainoAdminEmail" style="display:block;font-size:12px;font-weight:700;margin-bottom:6px">Email address</label>
      <input id="sainoAdminEmail" type="email" required autocomplete="username" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:12px;margin-bottom:14px" />
      <label for="sainoAdminPassword" style="display:block;font-size:12px;font-weight:700;margin-bottom:6px">Password</label>
      <input id="sainoAdminPassword" type="password" required autocomplete="current-password" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:12px;margin-bottom:14px" />
      <div id="sainoAdminLoginMessage" role="status" style="min-height:18px;color:#b91c1c;font-size:12px;margin-bottom:12px">${esc(message || '')}</div>
      <button id="sainoAdminLoginButton" type="submit" style="width:100%;border:0;border-radius:9px;padding:13px;background:#112b4e;color:#fff;font-weight:800;cursor:pointer">Sign in securely</button>
      <p style="font-size:11px;color:#64748b;line-height:1.5;margin:17px 0 0">New test environment? Create the first Super Admin from the backend terminal. There is no default admin password.</p>
    </form>`;
    const form = overlay.querySelector('#sainoAdminLoginForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = overlay.querySelector('#sainoAdminLoginButton');
      const messageEl = overlay.querySelector('#sainoAdminLoginMessage');
      button.disabled = true; button.textContent = 'Checking account…'; messageEl.textContent = '';
      try {
        const response = await fetch(BASE + '/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: overlay.querySelector('#sainoAdminEmail').value.trim(), password: overlay.querySelector('#sainoAdminPassword').value })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.token) throw new Error(data.error || 'Login failed.');
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem('SAINO_ADMIN_USER', JSON.stringify(data.user || {}));
        overlay.style.display = 'none';
        if (window.changePage) window.changePage('dashboard');
        if (window.refreshAdminStats) window.refreshAdminStats();
      } catch (error) {
        messageEl.textContent = error.message || 'Could not sign in.';
      } finally {
        button.disabled = false; button.textContent = 'Sign in securely';
      }
    });
  }

  async function adminApi(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
    const response = await fetch(path.startsWith('/api/admin') ? (API_ORIGIN + path) : BASE + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || data.code === 'ADMIN_AUTH_REQUIRED') {
      sessionStorage.removeItem(TOKEN_KEY);
      showLogin('Your session expired. Please sign in again.');
      throw new Error('Admin session expired.');
    }
    if (!response.ok || data.success === false) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  window.adminApi = adminApi;
  window.showAdminLogin = showLogin;
  window.logoutAdmin = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('SAINO_ADMIN_USER');
    showLogin('You have signed out.');
  };
  document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem(TOKEN_KEY)) showLogin('');
    else adminApi('/me').catch(() => {});
    const topbar = document.querySelector('.topbar-actions, .topbar-right, header .topbar-actions');
    if (topbar && !document.getElementById('sainoAdminLogout')) {
      const logout = document.createElement('button');
      logout.id = 'sainoAdminLogout'; logout.type = 'button'; logout.textContent = 'Sign out';
      logout.style.cssText = 'margin-left:10px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;font-size:12px;font-weight:700;cursor:pointer';
      logout.addEventListener('click', window.logoutAdmin);
      topbar.appendChild(logout);
    }
  });
})();
