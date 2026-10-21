// SuperAdmin: pending provider changes ki queue, approve / reject. (admin.js ke auth ke baad mount)
const router = require('express').Router();
const pool = require('../config/db');
const { approveChange, rejectChange } = require('../services/changeRequests');

const fail = (res, err) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ success: false, error: err.message });
  console.error('Admin change action failed:', err.message);
  return res.status(500).json({ success: false, error: 'Action complete nahi ho paaya.' });
};

router.get('/changes', async (req, res) => {
  const status = ['pending', 'approved', 'rejected', 'superseded'].includes(req.query.status) ? req.query.status : 'pending';
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.provider_id, p.name AS provider_name, c.entity, c.entity_id, c.action, c.data, c.status, c.review_note, c.created_at, c.reviewed_at
       FROM provider_change_requests c JOIN providers p ON p.id = c.provider_id
       WHERE c.status = $1 ORDER BY c.created_at ASC LIMIT 200`, [status]);
    const count = (await pool.query(`SELECT COUNT(*)::int AS n FROM provider_change_requests WHERE status = 'pending'`)).rows[0].n;
    res.json({ success: true, status, pendingCount: count, items: rows });
  } catch (err) { fail(res, err); }
});

router.post('/changes/:id/approve', async (req, res) => {
  try {
    const row = await approveChange(Number(req.params.id), req.admin && req.admin.id);
    res.json({ success: true, message: 'Approve ho gaya. Ab public par dikhega.', change: { id: row.id, entity: row.entity, action: row.action } });
  } catch (err) { fail(res, err); }
});

router.post('/changes/:id/reject', async (req, res) => {
  try {
    await rejectChange(Number(req.params.id), req.admin && req.admin.id, String((req.body || {}).note || '').slice(0, 500));
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});

module.exports = router;
