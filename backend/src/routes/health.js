const router = require('express').Router();
const { query } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const r = await query('SELECT now() AS time, current_database() AS db');
    res.json({ ok: true, database: r.rows[0].db, time: r.rows[0].time });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Database se connect nahi hua', detail: err.message });
  }
});

module.exports = router;