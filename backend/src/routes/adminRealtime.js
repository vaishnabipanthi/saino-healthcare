// SuperAdmin realtime + analytics. admin.js ke router.use(auth) ke BAAD mount hota hai,
// isliye yahan ke sab routes SuperAdmin token maangte hain.
const router = require('express').Router();
const pool = require('../config/db');

const IST_TODAY = `(NOW() AT TIME ZONE 'Asia/Kolkata')::date`;
const ACTIVE_BOOKING = `LOWER(COALESCE(status,'')) NOT IN ('cancelled','canceled','no_show','rejected')`;
const WAITING = `LOWER(COALESCE(status,'')) IN ('waiting','pending','checked_in','arrived','queued')`;

async function buildSnapshot() {
  const [prov, today, live, notif, recent, inventory, sig] = await Promise.all([
    pool.query(`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(verification_status,'')) = 'verified' AND is_published = TRUE)::int AS live,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(verification_status,'')) IN ('pending','under_review','more_info_required'))::int AS pending,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(verification_status,'')) = 'suspended')::int AS suspended
      FROM providers`),
    pool.query(`SELECT
        COUNT(*) FILTER (WHERE ${ACTIVE_BOOKING})::int AS bookings,
        COUNT(*) FILTER (WHERE ${ACTIVE_BOOKING} AND source IN ('marketplace','website','patient_app'))::int AS online,
        COUNT(*) FILTER (WHERE ${ACTIVE_BOOKING} AND source IN ('walkin','walk_in','reception','qr'))::int AS offline,
        COUNT(*) FILTER (WHERE ${ACTIVE_BOOKING} AND LOWER(COALESCE(consultation_type,'')) = 'video')::int AS video,
        COALESCE(SUM(fee) FILTER (WHERE ${ACTIVE_BOOKING} AND payment_status='paid'), 0)::float AS revenue
      FROM provider_appointments WHERE appointment_date = ${IST_TODAY}`),
    pool.query(`SELECT COUNT(*)::int AS waiting,
        COUNT(DISTINCT provider_id)::int AS providers_active
      FROM provider_appointments WHERE appointment_date = ${IST_TODAY} AND ${WAITING}`),
    pool.query(`SELECT COUNT(*) FILTER (WHERE NOT is_read)::int AS unread FROM admin_notifications`),
    pool.query(`SELECT a.id, a.booking_ref, a.patient_name, a.status, a.source, a.fee, a.created_at,
        p.name AS provider_name
      FROM provider_appointments a JOIN providers p ON p.id = a.provider_id
      ORDER BY a.created_at DESC LIMIT 8`),
    pool.query(`SELECT
        (SELECT COUNT(*)::int FROM doctors WHERE COALESCE(is_active,TRUE)=TRUE AND LOWER(COALESCE(status,'active')) <> 'deleted') AS total_doctors,
        (SELECT COUNT(*)::int FROM services WHERE COALESCE(is_active,TRUE)=TRUE AND LOWER(COALESCE(status,'active')) <> 'deleted') AS active_services,
        (SELECT COUNT(*)::int FROM provider_qr_codes WHERE status='active') AS active_qr_codes,
        (SELECT COUNT(*)::int FROM provider_qr_scans) AS qr_scans,
        (SELECT COALESCE(SUM(amount),0)::float FROM provider_subscriptions WHERE payment_status IN ('paid','success','completed')) +
        (SELECT COALESCE(SUM(fee),0)::float FROM provider_appointments WHERE payment_status='paid') AS collected_revenue`),
    pool.query(`SELECT (SELECT COALESCE(MAX(created_at)::text, '') FROM provider_appointments) AS last_booking,
        (SELECT COALESCE(MAX(created_at)::text, '') FROM admin_notifications) AS last_notification,
        (SELECT COUNT(*) FROM providers)::int AS providers_count`),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    providers: prov.rows[0],
    today: today.rows[0],
    live: { waiting: live.rows[0].waiting, providersActive: live.rows[0].providers_active },
    notifications: { unread: notif.rows[0].unread },
    inventory: inventory.rows[0],
    recentBookings: recent.rows.map((r) => ({
      id: r.id, ref: r.booking_ref, patient: r.patient_name, provider: r.provider_name,
      status: r.status, source: r.source, fee: Number(r.fee || 0), createdAt: r.created_at,
    })),
    // stream sirf tab bhejta hai jab ye signature badle
    _sig: JSON.stringify([sig.rows[0], today.rows[0], live.rows[0], notif.rows[0], inventory.rows[0]]),
  };
}

const publicSnapshot = (s) => { const { _sig, ...rest } = s; return rest; };

// Polling fallback: frontend har 10s pe ye call kar sakta hai
router.get('/snapshot', async (req, res) => {
  try { res.json({ success: true, ...publicSnapshot(await buildSnapshot()) }); }
  catch (err) { console.error('Snapshot failed:', err.message); res.status(500).json({ success: false, error: 'Dashboard data load nahi ho paya.' }); }
});

// Realtime: Server-Sent Events. Data change hone par hi "snapshot" event jata hai.
router.get('/stream', async (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  let closed = false; let lastSig = ''; let ticks = 0;
  req.on('close', () => { closed = true; });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const tick = async () => {
    if (closed) return;
    try {
      const snap = await buildSnapshot();
      if (snap._sig !== lastSig) { lastSig = snap._sig; send('snapshot', publicSnapshot(snap)); }
      else if (++ticks % 3 === 0) res.write(': ping\n\n');   // ~15s heartbeat, proxy connection zinda rakhta hai
    } catch (err) {
      send('error', { message: 'Live update me problem' });
    }
  };
  send('hello', { ok: true });
  await tick();
  const timer = setInterval(tick, 5000);
  req.on('close', () => clearInterval(timer));
});

// Analytics: pichle N din ka booking trend + source-wise split + status split
router.get('/analytics', async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
  try {
    const [trend, sources, statuses] = await Promise.all([
      pool.query(`SELECT to_char(appointment_date, 'YYYY-MM-DD') AS day,
          COUNT(*) FILTER (WHERE ${ACTIVE_BOOKING})::int AS bookings,
          COALESCE(SUM(fee) FILTER (WHERE ${ACTIVE_BOOKING}), 0)::float AS revenue
        FROM provider_appointments
        WHERE appointment_date >= ${IST_TODAY} - ($1::int - 1)
        GROUP BY appointment_date ORDER BY appointment_date`, [days]),
      pool.query(`SELECT COALESCE(NULLIF(source,''),'unknown') AS source, COUNT(*)::int AS count
        FROM provider_appointments WHERE ${ACTIVE_BOOKING} GROUP BY 1 ORDER BY count DESC`),
      pool.query(`SELECT COALESCE(NULLIF(status,''),'unknown') AS status, COUNT(*)::int AS count
        FROM provider_appointments GROUP BY 1 ORDER BY count DESC`),
    ]);
    res.json({ success: true, days, trend: trend.rows, sources: sources.rows, statuses: statuses.rows });
  } catch (err) {
    console.error('Analytics failed:', err.message);
    res.status(500).json({ success: false, error: 'Analytics load nahi ho paya.' });
  }
});

module.exports = router;
