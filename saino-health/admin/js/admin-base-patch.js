
var API_BASE = "/api/admin";

// Global Badge Helper (Safe against ReferenceErrors)
window.getPlanBadgeHtml = function(plan) {
    if (plan === "big_hospital" || plan === "saino_prime") {
        return '<span style="background:linear-gradient(135deg, #7055b5, #41236d); color:#fff; padding:3px 8px; border-radius:5px; font-size:9px; font-weight:800; letter-spacing:0.5px;">👑 SAINO VVIP</span>';
    }
    if (plan === "hospital" || plan === "saino_pro") {
        return '<span style="background:linear-gradient(135deg, #b87900, #ffb800); color:#fff; padding:3px 8px; border-radius:5px; font-size:9px; font-weight:800; letter-spacing:0.5px;">⭐ SAINO VIP</span>';
    }
    return '<span style="background:#e7f5ef; color:#16845b; padding:3px 8px; border-radius:5px; font-size:9px; font-weight:700;">✓ Solo Doctor Plan</span>';
};

document.addEventListener("DOMContentLoaded", function() {
    if (window.lucide) lucide.createIcons();

    initDashboard();
    initNavigation();
    initMobileMenu();
    initNotificationBell();
});

/* ------------------------------------------------------------
   1. DASHBOARD INITIALIZATION & STATS (PORT 4000)
   ------------------------------------------------------------ */

async function initDashboard() {
    try {
        var res = await fetch(API_BASE + "/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Admin API returned HTTP " + res.status);
        var data = await res.json();
        if (!data.success) throw new Error(data.error || "Unable to load admin data");
        var stats = data.stats || {};
        [
            ["totalUsers", stats.totalUsers],
            ["totalProviders", stats.totalProviders],
            ["verifiedProviders", stats.verifiedProviders],
            ["totalAppointments", stats.appointments],
            ["totalReviews", stats.reviews],
            ["activeCampaigns", stats.campaigns]
        ].forEach(function(pair) {
            var el = document.getElementById(pair[0]);
            if (el) el.textContent = pair[1] === null || pair[1] === undefined ? "—" : Number(pair[1]).toLocaleString();
        });
        renderActivities(data.activities || []);
        renderVerificationQueue(data.verification || []);
        updateNotificationBadge((data.verification || []).length);
    } catch (err) {
        console.error("Admin dashboard live data error:", err);
        var ids = ["totalUsers", "totalProviders", "verifiedProviders", "totalAppointments", "totalReviews", "activeCampaigns"];
        ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = "—"; });
        renderActivities([{ type: "info", icon: "alert-circle", title: "Live data unavailable", description: "Admin API/database connection failed. Check backend terminal.", time: "Error" }]);
        renderVerificationQueue([]);
        updateNotificationBadge(0);
    }
}

function renderActivities(activities) {
    var container = document.getElementById("activityList");
    if (!container) return;

    if (!activities.length) {
        container.innerHTML = '<p class="muted" style="padding:12px;">No recent activities yet.</p>';
        return;
    }

    var html = "";
    for (var i = 0; i < activities.length; i++) {
        var act = activities[i];
        html += '<div class="activity-item">' +
            '<div class="activity-icon ' + (act.type || 'info') + '">' +
                '<i data-lucide="' + (act.icon || 'activity') + '"></i>' +
            '</div>' +
            '<div class="activity-content">' +
                '<strong>' + escapeHtml(act.title || '') + '</strong>' +
                '<p>' + escapeHtml(act.description || '') + '</p>' +
            '</div>' +
            '<time>' + escapeHtml(act.time || 'Just now') + '</time>' +
        '</div>';
    }
    container.innerHTML = html;

    if (window.lucide) lucide.createIcons();
}

function renderVerificationQueue(queue) {
    var container = document.getElementById("verificationList");
    if (!container) return;

    if (!queue.length) {
        container.innerHTML = '<p class="muted" style="padding:12px;">No providers waiting in verification queue.</p>';
        return;
    }

    var html = "";
    for (var i = 0; i < queue.length; i++) {
        var item = queue[i];
        html += '<div class="mini-list-item" style="cursor:pointer;" onclick="changePage(\'providers\')">' +
            '<div class="provider-mini-avatar">' +
                getInitials(item.provider || item.name || 'Hospital') +
            '</div>' +
            '<div class="mini-list-content">' +
                '<strong>' + escapeHtml(item.provider || item.name || '') + '</strong>' +
                '<span>' + escapeHtml(item.category || item.provider_type || 'Hospital') + ' · ' + escapeHtml(item.location || [item.city, item.district, item.province].filter(Boolean).join(', ') || 'Location not provided') + '</span>' +
            '</div>' +
            '<span class="status-badge pending">Setup Pending</span>' +
        '</div>';
    }
    container.innerHTML = html;
}

function updateNotificationBadge(count) {
    var dot = document.querySelector(".notification-dot");
    if (!dot) return;
    if (count > 0) {
        dot.style.display = "block";
        dot.title = count + " pending verifications";
    } else {
        dot.style.display = "none";
    }
}

function getInitials(name) {
    return String(name || "HP")
        .split(" ")
        .slice(0, 2)
        .map(function(word) { return word[0] || ""; })
        .join("")
        .toUpperCase();
}

/* ------------------------------------------------------------
   2. TOPBAR NOTIFICATION BELL & DROPDOWN
   ------------------------------------------------------------ */

function openNotificationReview(providerId) {
    var dropdown = document.getElementById("adminNotificationDropdown");
    if (dropdown) dropdown.style.display = "none";
    changePage('providers');
    if (window.openProviderInspectionModal) {
        window.openProviderInspectionModal(providerId);
    }
}
window.openNotificationReview = openNotificationReview;

function initNotificationBell() {
    var bellBtn = document.querySelector(".notification-button");
    if (!bellBtn) return;

    var dropdown = document.getElementById("adminNotificationDropdown");
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.id = "adminNotificationDropdown";
        dropdown.style.cssText = "display:none; position:fixed; top:65px; right:75px; width:340px; max-height:420px; background:#fff; border:1px solid var(--border); border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,0.12); z-index:999; overflow-y:auto;";
        document.body.appendChild(dropdown);
    }

    bellBtn.addEventListener("click", async function(e) {
        e.stopPropagation();
        var isOpen = dropdown.style.display === "block";
        if (isOpen) {
            dropdown.style.display = "none";
            return;
        }

        dropdown.innerHTML = '<p class="muted" style="padding:16px;">Checking pending verification requests…</p>';
        dropdown.style.display = "block";

        try {
            var res = await fetch(API_BASE + "/providers?status=pending_verification");
            var json = await res.json();
            var pending = json.providers || [];

            updateNotificationBadge(pending.length);

            if (!pending.length) {
                dropdown.innerHTML = '<div style="padding:14px 16px; border-bottom:1px solid #f0f1f4;">' +
                    '<strong>Notifications</strong>' +
                '</div>' +
                '<div style="padding:24px; text-align:center;">' +
                    '<p class="muted" style="font-size:11px; margin:0;">No pending verification requests.</p>' +
                    '<small style="color:var(--green); font-weight:700;">All hospital setups are up-to-date.</small>' +
                '</div>';
                return;
            }

            var html = '<div style="padding:12px 16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">' +
                '<strong style="font-size:12px;">Verification Requests (' + pending.length + ')</strong>' +
                '<small style="color:var(--amber); font-weight:700;">Action Required</small>' +
            '</div><div class="notification-items">';

            for (var i = 0; i < pending.length; i++) {
                var p = pending[i];
                var dateStr = new Date(p.created_at || Date.now()).toLocaleDateString();
                html += '<div style="padding:12px 16px; border-bottom:1px solid #f0f1f4; cursor:pointer;" ' +
                    'onmouseover="this.style.background=\'#f8f9fb\'" onmouseout="this.style.background=\'#fff\'" ' +
                    'onclick="window.openNotificationReview(\'' + p.id + '\')">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                        '<strong style="font-size:11px; color:var(--navy);">' + escapeHtml(p.name) + '</strong>' +
                        window.getPlanBadgeHtml(p.plan) +
                    '</div>' +
                    '<small class="muted" style="display:block;">' + escapeHtml(p.city || 'Location not provided') + ' · Submitted ' + dateStr + '</small>' +
                    '<span style="font-size:9px; color:var(--blue); font-weight:700; margin-top:4px; display:inline-block;">Click to inspect details & verify →</span>' +
                '</div>';
            }
            html += '</div>';
            dropdown.innerHTML = html;
        } catch (err) {
            dropdown.innerHTML = '<p class="muted" style="padding:16px;">Error loading: ' + escapeHtml(err.message) + '</p>';
        }
    });

    document.addEventListener("click", function(e) {
        if (!e.target.closest("#adminNotificationDropdown") && !e.target.closest(".notification-button")) {
            dropdown.style.display = "none";
        }
    });
}

/* ------------------------------------------------------------
   3. NAVIGATION ROUTER (HANDWRITTEN NOTEBOOK SECTIONS)
   ------------------------------------------------------------ */

function initNavigation() {
    document.addEventListener("click", function(event) {
        var target = event.target.closest("[data-page]");
        if (!target) return;
        event.preventDefault();

        var page = target.dataset.page;
        setActiveNavigation(target);
        changePage(page);
    });
}

function setActiveNavigation(target) {
    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.classList.remove("active");
    });
    if (target.classList.contains("nav-item")) {
        target.classList.add("active");
    }
}

function changePage(page) {
    var titleMap = {
        dashboard: "Executive Dashboard",
        "live-operations": "Live Operations",
        analytics: "Analytics & Reports",
        providers: "Providers",
        verification: "Verification & Setup Queue",
        users: "Patient & User Management",
        appointments: "Bookings & Appointments",
        "live-queue": "Live Queue & Tokens",
        telemedicine: "Telemedicine Console",
        marketplace: "Patient Discovery Marketplace",
        "qr-management": "QR Management",
        payments: "Payment & Settlements",
        plans: "Plans & Subscriptions",
        disputes: "Support & Disputes",
        roles: "Roles & Permissions",
        audit: "Audit Logs",
        notifications: "Notifications",
        "system-health": "System Health",
        settings: "Global Settings"
    };

    var title = titleMap[page] || "Dashboard";

    var pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl) pageTitleEl.textContent = title;

    var breadcrumbEl = document.getElementById("breadcrumbPage");
    if (breadcrumbEl) breadcrumbEl.textContent = title;

    if (page === "dashboard") {
        showDashboard();
        return;
    }

    if (page === "providers" || page === "verification") {
        if (window.showProvidersPage) window.showProvidersPage();
        return;
    }

    showComingSoon(page, title);
}

function showDashboard() {
    var pageContent = document.getElementById("pageContent");
    if (!pageContent) return;

    pageContent.innerHTML = '<div id="dashboardPage" class="page active-page">' +
        '<div class="page-intro">' +
            '<div>' +
                '<p class="eyebrow">MARKETPLACE OVERVIEW</p>' +
                '<h2>Good evening, Admin.</h2>' +
                '<p class="muted">Real-time platform operations and live provider network status.</p>' +
            '</div>' +
            '<button class="primary-button" onclick="changePage(\'providers\')">' +
                '<i data-lucide="plus"></i> Add Provider' +
            '</button>' +
        '</div>' +
        '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="users"></i></div><div class="stat-content"><span>Total Users</span><strong id="totalUsers">--</strong><small class="positive">Active Patients</small></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="building-2"></i></div><div class="stat-content"><span>Total Providers</span><strong id="totalProviders">--</strong><small class="positive">Network Facilities</small></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="badge-check"></i></div><div class="stat-content"><span>Verified Providers</span><strong id="verifiedProviders">--</strong><small>Live on Marketplace</small></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="calendar-check"></i></div><div class="stat-content"><span>Appointments</span><strong id="totalAppointments">--</strong><small class="positive">Booked Today</small></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="star"></i></div><div class="stat-content"><span>Total Reviews</span><strong id="totalReviews">--</strong><small>Patient Ratings</small></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i data-lucide="megaphone"></i></div><div class="stat-content"><span>Active Campaigns</span><strong id="activeCampaigns">--</strong><small>Live Promotions</small></div></div>' +
        '</div>' +
        '<div class="section-heading"><div><h3>Quick Actions</h3><p>Frequently used administration tools.</p></div></div>' +
        '<div class="quick-actions">' +
            '<button class="quick-action" data-page="providers"><span class="quick-icon red"><i data-lucide="building-2"></i></span><span><strong>Providers Directory</strong><small>Manage hospital listings</small></span></button>' +
            '<button class="quick-action" data-page="verification"><span class="quick-icon amber"><i data-lucide="shield-check"></i></span><span><strong>Verification Queue</strong><small>Pending setups & review</small></span></button>' +
            '<button class="quick-action" data-page="live-queue"><span class="quick-icon purple"><i data-lucide="list-ordered"></i></span><span><strong>Live Queue & Tokens</strong><small>Real-time OPD rush</small></span></button>' +
            '<button class="quick-action" data-page="payments"><span class="quick-icon blue"><i data-lucide="credit-card"></i></span><span><strong>Payment & Settlements</strong><small>Hospital subscriptions</small></span></button>' +
        '</div>' +
        '<div class="dashboard-grid">' +
            '<div class="panel">' +
                '<div class="panel-header"><div><h3>Recent Activity</h3><p>Latest actions across the marketplace.</p></div><button class="text-button" onclick="changePage(\'audit\')">View All</button></div>' +
                '<div class="activity-list" id="activityList"></div>' +
            '</div>' +
            '<div class="panel">' +
                '<div class="panel-header"><div><h3>Verification & Setup Queue</h3><p>Hospitals awaiting setup & approval.</p></div><button class="text-button" data-page="verification">View Queue</button></div>' +
                '<div class="mini-list" id="verificationList"></div>' +
            '</div>' +
        '</div>' +
    '</div>';

    if (window.lucide) lucide.createIcons();
    initDashboard();
}

function showComingSoon(page, title) {
    var pageContent = document.getElementById("pageContent");
    if (!pageContent) return;

    pageContent.innerHTML = '<div class="module-placeholder">' +
        '<div class="placeholder-icon"><i data-lucide="construction"></i></div>' +
        '<p class="eyebrow">ADMIN MODULE</p>' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '<p>This module connects directly to your live PostgreSQL database. Real-time management screens are ready to be activated.</p>' +
        '<div class="placeholder-note"><i data-lucide="database"></i><span>Database Connection: Active &amp; Ready</span></div>' +
    '</div>';

    if (window.lucide) lucide.createIcons();
}

function initMobileMenu() {
    var button = document.getElementById("menuBtn");
    var sidebar = document.getElementById("sidebar");
    if (!button || !sidebar) return;

    button.addEventListener("click", function() {
        sidebar.classList.toggle("open");
    });
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(character) {
        return {
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character];
    });
}