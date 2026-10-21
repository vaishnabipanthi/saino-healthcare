const express = require('express');
const pool = require('../config/db');
const razorpay = require('../services/razorpay');
const { requirePatient } = require('./auth');

const router = express.Router();
const CURRENCY = (process.env.PAYMENT_CURRENCY || 'INR').toUpperCase();

let columnsReady = null;
function ensurePaymentColumns() {
  columnsReady = columnsReady || pool.query(`ALTER TABLE provider_appointments
      ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
      ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`).catch(err => { columnsReady = null; throw err; });
  return columnsReady;
}

async function loadOwnedBooking(db, bookingRef, pid, lock = false) {
  const result = await db.query(`SELECT a.*, p.name AS provider_name
    FROM provider_appointments a JOIN providers p ON p.id = a.provider_id
    WHERE a.booking_ref = $1 AND a.patient_id = $2 LIMIT 1 ${lock ? 'FOR UPDATE OF a' : ''}`, [bookingRef, pid]);
  return result.rows[0] || null;
}

const summary = (b, extra = {}) => ({
  booking_id: b.booking_ref, token: b.token, status: b.status, payment_status: b.payment_status,
  provider_id: String(b.provider_id), provider_name: b.provider_name, doctor_name: b.doctor, room: b.room,
  appointment_date: b.appointment_date, slot_time: b.slot_time, amount: Number(b.fee) || 0, currency: CURRENCY, ...extra
});

const fail = (res, err, fallback) => {
  console.error(fallback, err.message);
  res.status(err.status || 500).json({ success: false, error: err.status ? err.message : fallback });
};

router.post('/create-order', requirePatient, async (req, res) => {
  try {
    await ensurePaymentColumns();
    const booking = await loadOwnedBooking(pool, String(req.body?.booking_ref || ''), req.patient.pid);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking nahi mili.' });
    if (booking.payment_status === 'paid') return res.status(409).json({ success: false, error: 'Is booking ka payment ho chuka hai.' });

    const amount = Number(booking.fee) || 0;  // fee hamesha DB se, client se kabhi nahi
    if (amount <= 0) return res.status(400).json({ success: false, error: 'Is booking ke liye payment ki zarurat nahi hai.' });

    const { keyId, order } = await razorpay.createOrder(Math.round(amount * 100), CURRENCY, booking.booking_ref);
    await pool.query('UPDATE provider_appointments SET razorpay_order_id = $1, updated_at = NOW() WHERE booking_ref = $2', [order.id, booking.booking_ref]);

    res.json({
      success: true, key_id: keyId, order_id: order.id, amount: order.amount, currency: order.currency,
      booking_ref: booking.booking_ref, provider_name: booking.provider_name,
      prefill: { name: req.patient.full_name || '', contact: req.patient.phone || '', email: req.patient.email || '' }
    });
  } catch (err) { fail(res, err, 'Payment order could not be created.'); }
});

router.post('/verify', requirePatient, async (req, res) => {
  let client;
  try {
    await ensurePaymentColumns();
    const { booking_ref, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!booking_ref || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment details incomplete hain.' });
    }
    if (!razorpay.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, error: 'Payment signature invalid hai.' });
    }
    const payment = await razorpay.fetchCapturedPayment(razorpay_payment_id);

    client = await pool.connect();
    await client.query('BEGIN');
    const booking = await loadOwnedBooking(client, String(booking_ref), req.patient.pid, true);
    if (!booking) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Booking nahi mili.' }); }
    if (booking.payment_status === 'paid') { await client.query('COMMIT'); return res.json({ success: true, booking: summary(booking) }); }

    const expected = Math.round(Number(booking.fee) * 100);
    if (booking.razorpay_order_id !== razorpay_order_id || payment.order_id !== razorpay_order_id ||
        Number(payment.amount) !== expected || payment.status !== 'captured') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Payment complete/match nahi hua. Agar paise kate hain to support se contact kariye.' });
    }

    const updated = await client.query(`UPDATE provider_appointments
      SET payment_status = 'paid', status = 'pending', razorpay_payment_id = $1, paid_at = NOW(), updated_at = NOW()
      WHERE booking_ref = $2 RETURNING *`, [razorpay_payment_id, booking.booking_ref]);
    await client.query('INSERT INTO admin_notifications(title, message, provider_id) VALUES($1, $2, $3)',
      ['New paid booking', `${booking.patient_name} ne booking ${booking.booking_ref} ka payment kar diya hai. Please confirm.`, booking.provider_id]);
    await client.query('COMMIT');

    res.json({ success: true, booking: summary({ ...updated.rows[0], provider_name: booking.provider_name }) });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    fail(res, err, 'Payment verification failed.');
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
