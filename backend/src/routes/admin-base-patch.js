const express = require('express');
const pool = require('../config/db');
const router = express.Router();

const asNumber = (v) => Number.parseInt(v || '0', 10) || 0;

router.get('/', (_req, res) => res.json({ success: true, message: 'SAINO Admin API is running' }));

// All KPI values come from PostgreSQL. No seeded/fallback demo numbers.
router.get('/stats', async (_req, res) => {
  try {
    const [users, providers, appointments, reviews, verified, pending, recentLogs] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'patient'"),
      pool.query('SELECT COUNT(*)::int AS count FROM providers'),
      pool.query('SELECT COUNT(*)::int AS count FROM appointments'),
      pool.query('SELECT COUNT(*)::int AS count FROM reviews'),
      pool.query("SELECT COUNT(*)::int AS count FROM providers WHERE verification_status = 'verified' AND is_published = TRUE"),
      pool.query("SELECT COUNT(*)::int AS count FROM providers WHERE verification_status IN ('pending','under_review','more_info_required','draft')"),
      pool.query('SELECT id, action, entity_type, entity_id, details, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 8')
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers: asNumber(users.rows[0].count),
        totalProviders: asNumber(providers.rows[0].count),
        verifiedProviders: asNumber(verified.rows[0].count),
        pendingProviders: asNumber(pending.rows[0].count),
        appointments: asNumber(appointments.rows[0].count),
        reviews: asNumber(reviews.rows[0].count),
        campaigns: null,
        revenue: null
      },
      verification: (await pool.query(`SELECT id, name AS provider, category, city, district, province, verification_status, created_at, to_jsonb(p)->>'plan' AS plan FROM providers p WHERE verification_status IN ('pending','under_review','more_info_required','draft') ORDER BY created_at DESC LIMIT 8`)).rows,
      activities: recentLogs.rows.map(row => ({
        type: 'info', icon: 'activity', title: row.action,
        description: `${row.entity_type}${row.entity_id ? ' #' + row.entity_id : ''}`,
        time: row.created_at
      }))
    });
  } catch (err) {
    console.error('Admin stats query failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load live admin data. Check database connection and schema.' });
  }
});

router.get('/providers', async (req, res) => {
  try {
    const page = Math.max(0, asNumber(req.query.page));
    const limit = Math.min(100, Math.max(1, asNumber(req.query.limit || '20')));
    const offset = page * limit;
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const clauses = [];
    const values = [];
    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(name ILIKE $${values.length} OR city ILIKE $${values.length} OR phone ILIKE $${values.length})`);
    }
    if (status === 'pending_verification') clauses.push("verification_status IN ('pending','under_review','more_info_required','draft')");
    else if (status === 'active') clauses.push("verification_status = 'verified' AND is_published = TRUE");
    else if (status === 'rejected') clauses.push("verification_status = 'rejected'");
    else if (status === 'suspended') clauses.push("verification_status = 'suspended'");
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await pool.query(`SELECT COUNT(*)::int AS count FROM providers ${where}`, values);
    values.push(limit, offset);
    const rows = await pool.query(`
      SELECT id, name, category AS provider_type, category, description AS about,
             phone, email, city, district AS state, province, address,
             verification_status,
             CASE WHEN verification_status = 'verified' AND is_published THEN 'active'
                  WHEN verification_status = 'rejected' THEN 'rejected'
                  WHEN verification_status = 'suspended' THEN 'suspended'
                  ELSE 'pending_verification' END AS status,
             is_published, to_jsonb(p)->>'plan' AS plan, created_at
      FROM providers p ${where}
      ORDER BY created_at DESC NULLS LAST, id DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);
    res.json({ success: true, providers: rows.rows, totalCount: asNumber(count.rows[0].count), page, limit });
  } catch (err) {
    console.error('Admin providers query failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load providers from PostgreSQL.' });
  }
});

router.get('/providers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT *, to_jsonb(p)->>\'plan\' AS plan FROM providers p WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Provider not found' });
    res.json({ success: true, provider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load provider details.' });
  }
});

// Approve/reject only updates fields present in the current sainodb schema.
router.post('/providers/:id/status', async (req, res) => {
  const requested = String(req.body.status || '');
  const mapping = {
    active: { verification: 'verified', published: true },
    verified: { verification: 'verified', published: true },
    rejected: { verification: 'rejected', published: false },
    pending_verification: { verification: 'pending', published: false },
    pending: { verification: 'pending', published: false },
    suspended: { verification: 'suspended', published: false }
  };
  const next = mapping[requested];
  if (!next) return res.status(400).json({ success: false, error: 'Unsupported provider status' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE providers SET verification_status = $1, is_published = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [next.verification, next.published, req.params.id]
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    await client.query(
      `INSERT INTO admin_audit_logs (action, entity_type, entity_id, details) VALUES ($1, 'provider', $2, $3::jsonb)`,
      [requested === 'active' || requested === 'verified' ? 'provider_approved' : `provider_${requested}`, req.params.id, JSON.stringify({ verification_status: next.verification, is_published: next.published })]
    );
    await client.query('COMMIT');
    res.json({ success: true, provider: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Provider status update failed:', err.message);
    res.status(500).json({ success: false, error: 'Provider status could not be saved.' });
  } finally { client.release(); }
});

module.exports = router;
