// Provider endpoints for form templates, change requests and request status.
const router = require('express').Router();
const { TEMPLATE } = require('../config/providerTemplate');
const { submitChange } = require('../services/changeRequests');
const pool = require('../config/db');

const fail = (res, err) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ success: false, error: err.message });
  console.error('Change request failed:', err.message);
  return res.status(500).json({ success: false, error: 'Could not save this request. Please try again.' });
};

router.get('/template', (req, res) => res.json({ success: true, template: TEMPLATE }));

router.get('/changes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, entity, entity_id, action, data, status, review_note, created_at, reviewed_at
       FROM provider_change_requests WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 100`, [req.providerId]);
    res.json({ success: true, items: rows });
  } catch (err) { fail(res, err); }
});

router.post('/changes', async (req, res) => {
  try {
    const b = req.body || {};
    const row = await submitChange({ providerId: req.providerId, entity: b.entity, action: b.action || 'update', entityId: b.entityId, input: b.data });
    res.status(201).json({ success: true, change: row, message: 'Sent to the Super Admin. The update will appear publicly after approval.' });
  } catch (err) { fail(res, err); }
});

module.exports = router;
