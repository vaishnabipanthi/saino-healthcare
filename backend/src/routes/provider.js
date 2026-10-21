const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

const router = express.Router();

let schemaReady = false;
let schemaPromise = null;

async function initTables() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await pool.query(`
      ALTER TABLE providers
        ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS plan VARCHAR(80) DEFAULT 'Saino Free',
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS registration_no VARCHAR(150),
        ADD COLUMN IF NOT EXISTS vatpan VARCHAR(150),
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS about TEXT,
        ADD COLUMN IF NOT EXISTS address_line TEXT,
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
        ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS profile_completion_pct INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_owner_user_id
        ON providers(owner_user_id) WHERE owner_user_id IS NOT NULL;

      ALTER TABLE doctors
        ADD COLUMN IF NOT EXISTS provider_id BIGINT REFERENCES providers(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS specialization VARCHAR(150),
        ADD COLUMN IF NOT EXISTS qualification VARCHAR(150),
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS followup_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS shift_timings TEXT,
        ADD COLUMN IF NOT EXISTS nmc_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS room VARCHAR(100),
        ADD COLUMN IF NOT EXISTS opd_fee NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS department VARCHAR(150),
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE services
        ADD COLUMN IF NOT EXISTS provider_id BIGINT REFERENCES providers(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS category VARCHAR(120),
        ADD COLUMN IF NOT EXISTS department VARCHAR(150),
        ADD COLUMN IF NOT EXISTS duration_min INTEGER NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active';
      ALTER TABLE services ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      ALTER TABLE providers
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_status VARCHAR(40) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS city VARCHAR(120),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'pending';
      ALTER TABLE providers
        ADD COLUMN IF NOT EXISTS district VARCHAR(100),
        ADD COLUMN IF NOT EXISTS province VARCHAR(100),
        ADD COLUMN IF NOT EXISTS latitude NUMERIC,
        ADD COLUMN IF NOT EXISTS longitude NUMERIC,
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS opening_hours TEXT,
        ADD COLUMN IF NOT EXISTS facilities_info TEXT,
        ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;

      ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS provider_id BIGINT REFERENCES providers(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS patient_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1),
        ADD COLUMN IF NOT EXISTS comment TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='doctors' AND column_name='name') THEN
          EXECUTE 'UPDATE doctors SET full_name = name WHERE (full_name IS NULL OR full_name = '''') AND name IS NOT NULL';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='doctors' AND column_name='specialization') THEN
          EXECUTE 'UPDATE doctors SET department = specialization WHERE (department IS NULL OR department = '''') AND specialization IS NOT NULL';
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS provider_appointments (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        booking_ref VARCHAR(80) NOT NULL,
        token VARCHAR(30),
        patient_name VARCHAR(200) NOT NULL,
        patient_phone VARCHAR(40),
        doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
        doctor VARCHAR(200),
        room VARCHAR(100),
        source VARCHAR(40) NOT NULL DEFAULT 'walkin',
        slot_time VARCHAR(50),
        fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(40) NOT NULL DEFAULT 'Waiting',
        appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider_id, booking_ref)
      );

      CREATE TABLE IF NOT EXISTS provider_staff (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255),
        avatar_url TEXT,
        role VARCHAR(100) NOT NULL DEFAULT 'Receptionist',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE provider_staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      CREATE TABLE IF NOT EXISTS provider_payments (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        patient_name VARCHAR(200) NOT NULL,
        service_name VARCHAR(200),
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(50),
        account_mask VARCHAR(100),
        status VARCHAR(30) NOT NULL DEFAULT 'recorded',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS provider_queue_state (
        provider_id BIGINT PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
        state JSONB NOT NULL DEFAULT '{"serving":null,"waiting":[],"stats":{"waiting":0,"completed":0,"issued":0}}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_notifications (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        provider_id BIGINT REFERENCES providers(id) ON DELETE SET NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE admin_notifications
        ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT 'Notification',
        ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS provider_id BIGINT REFERENCES providers(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS idx_doctors_provider
        ON doctors(provider_id, status);
      CREATE INDEX IF NOT EXISTS idx_services_provider
        ON services(provider_id, status);
      CREATE INDEX IF NOT EXISTS idx_provider_appts_provider
        ON provider_appointments(provider_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_provider_staff_provider
        ON provider_staff(provider_id, status);
      CREATE INDEX IF NOT EXISTS idx_provider_payments_provider
        ON provider_payments(provider_id, created_at DESC);

      ALTER TABLE provider_appointments
        ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS visit_id VARCHAR(70),
        ADD COLUMN IF NOT EXISTS service_id BIGINT,
        ADD COLUMN IF NOT EXISTS service_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(40) NOT NULL DEFAULT 'in_person',
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(60),
        ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS reason TEXT,
        ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS patient_profiles (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        pid VARCHAR(50) NOT NULL UNIQUE,
        full_name VARCHAR(200) NOT NULL,
        phone VARCHAR(40),
        email VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_profiles_email_lower
        ON patient_profiles(LOWER(email)) WHERE email IS NOT NULL AND email <> '';
      CREATE INDEX IF NOT EXISTS idx_patient_profiles_phone ON patient_profiles(phone);

      CREATE TABLE IF NOT EXISTS patient_notifications (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL,
        booking_ref VARCHAR(80),
        type VARCHAR(60) NOT NULL DEFAULT 'booking_update',
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        read_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient_created
        ON patient_notifications(patient_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_patient_notifications_booking
        ON patient_notifications(booking_ref, created_at DESC);

      CREATE TABLE IF NOT EXISTS provider_qr_codes (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        code VARCHAR(90) NOT NULL UNIQUE,
        label VARCHAR(160) NOT NULL DEFAULT 'Reception QR',
        branch_name VARCHAR(160),
        destination_url TEXT,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        total_scans BIGINT NOT NULL DEFAULT 0,
        created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS provider_qr_scans (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        qr_code_id BIGINT NOT NULL REFERENCES provider_qr_codes(id) ON DELETE CASCADE,
        visitor_hash VARCHAR(64),
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_provider_qr_scans_code_time ON provider_qr_scans(qr_code_id, scanned_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_qr_scans_unique_visitor
        ON provider_qr_scans(qr_code_id, visitor_hash) WHERE visitor_hash IS NOT NULL;

      CREATE TABLE IF NOT EXISTS provider_review_responses (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        review_id BIGINT NOT NULL,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        response TEXT NOT NULL,
        responded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(review_id, provider_id)
      );

      CREATE TABLE IF NOT EXISTS provider_subscriptions (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        plan VARCHAR(80) NOT NULL,
        amount NUMERIC(12,2),
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
        payment_reference VARCHAR(200),
        gateway VARCHAR(40),
        gateway_order_id VARCHAR(120),
        gateway_payment_id VARCHAR(120),
        starts_at TIMESTAMPTZ,
        renews_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_provider_subscriptions_provider ON provider_subscriptions(provider_id, created_at DESC);

      ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) NOT NULL DEFAULT 'visible';

      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE provider_subscriptions
        ADD COLUMN IF NOT EXISTS gateway VARCHAR(40),
        ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(120),
        ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(120);

      -- Older local databases constrained this column to a smaller legacy enum,
      -- which rejected the 'verified' value written by the current approval flow.
      ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_verification_status_check;
      ALTER TABLE providers ADD CONSTRAINT providers_verification_status_check
        CHECK (verification_status IN ('pending','under_review','more_info_required','setup_in_progress','verified','approved','rejected','suspended','draft'));
    `);

    // Repair missing generated-ID defaults in older hand-created tables without touching existing IDs.
    for (const table of ['users', 'providers', 'doctors', 'services', 'appointments', 'reviews']) {
      await ensureIdDefault(table);
    }

    // Backfill visibility for real records already attached to listings that were
    // approved before the doctor/service visibility flags were synchronized.
    await pool.query(`UPDATE doctors d SET is_public=TRUE FROM providers p
      WHERE d.provider_id=p.id AND p.verification_status='verified' AND p.is_published=TRUE
        AND d.is_active=TRUE AND d.status <> 'deleted' AND d.is_public=FALSE`);
    await pool.query(`UPDATE services s SET is_public=TRUE FROM providers p
      WHERE s.provider_id=p.id AND p.verification_status='verified' AND p.is_published=TRUE
        AND s.is_active=TRUE AND s.status <> 'deleted' AND s.is_public=FALSE`);

    // Ensure user-created databases that were bootstrapped with the initial schema
    // can still store provider profile, patient and booking fields without destructive changes.
    schemaReady = true;
  })();

  try {
    await schemaPromise;
  } catch (err) {
    schemaPromise = null;
    throw err;
  }
}

async function ensureIdDefault(table) {
  const allowed = new Set(['users', 'providers', 'doctors', 'services', 'appointments', 'reviews']);
  if (!allowed.has(table)) return;
  const col = await pool.query(
    `SELECT column_default, is_identity FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = $1 AND column_name = 'id' LIMIT 1`, [table]
  );
  if (!col.rowCount || col.rows[0].is_identity === 'YES' || col.rows[0].column_default) return;
  const seq = `${table}_saino_id_seq`;
  await pool.query(`CREATE SEQUENCE IF NOT EXISTS public."${seq}"`);
  await pool.query(`ALTER TABLE public."${table}" ALTER COLUMN id SET DEFAULT nextval('public."${seq}"')`);
  await pool.query(`ALTER SEQUENCE public."${seq}" OWNED BY public."${table}".id`);
  await pool.query(`SELECT setval('public."${seq}"', GREATEST(COALESCE((SELECT MAX(id)::bigint FROM public."${table}"), 0) + 1, 1), false)`);
}

function makePublicId(prefix) {
  const suffix = require('crypto').randomBytes(5).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}

function planAmount(plan) {
  return ({ 'Saino Free': 0, 'Saino Pro': 3600, 'Saino VIP': 5900, 'Saino VVIP': 9999 })[plan] ?? null;
}

async function createRazorpayOrder(amountInr, receipt) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw Object.assign(new Error('Razorpay is not configured.'), { status: 503 });
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: Math.round(Number(amountInr) * 100), currency: 'INR', receipt })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.id) throw Object.assign(new Error(payload.error?.description || 'Razorpay could not create an order.'), { status: 502 });
  return { keyId, order: payload };
}

function secureSignatureEqual(expectedHex, actualHex) {
  if (!/^[a-f0-9]{64}$/i.test(actualHex || '')) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function normaliseCategory(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value.includes('clinic')) return 'clinic';
  if (value.includes('diagnostic') || value.includes('lab')) return 'diagnostic';
  if (value.includes('wellness')) return 'wellness';
  if (value.includes('blood')) return 'bloodbank';
  if (value.includes('ambulance')) return 'ambulance';
  if (value.includes('home')) return 'homecare';
  if (value.includes('insurance')) return 'insurance';
  return 'hospital';
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error('JWT_SECRET missing or too short. Set a random secret of at least 24 characters in backend/.env.');
  }
  return secret;
}

// Public endpoint: provider signs up through List Your Care.
router.post('/register', async (req, res) => {
  let client;
  try {
    await initTables();
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim();
    const password = String(b.password || '');
    const contactPerson = String(b.contact_person || '').trim();
    const plan = String(b.plan || '').trim();
    const type = String(b.type || 'Hospital').trim();

    if (!name || !email || !phone || !contactPerson || !password || !plan) {
      return res.status(400).json({ success: false, error: 'Please complete all required provider details and choose a plan.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must contain at least 6 characters.' });
    }
    if (!['Saino Free', 'Saino Pro', 'Saino VIP', 'Saino VVIP'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Selected SAINO plan is not valid.' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'An account with this email already exists. Please use Provider Login.' });
    }

    const amount = planAmount(plan);
    const paymentRequired = amount > 0;
    let razorpay = null;
    if (paymentRequired) {
      const receipt = `saino_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      razorpay = await createRazorpayOrder(amount, receipt);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'provider', FALSE)
       RETURNING id, full_name, email, phone, role`,
      [contactPerson, email, phone, passwordHash]
    );
    const user = userResult.rows[0];

    const category = normaliseCategory(type);
    const providerResult = await client.query(
      `INSERT INTO providers (
        owner_user_id, name, category, provider_type, plan, email, phone,
        registration_no, vatpan, contact_person, city, address, address_line,
        status, verification_status, is_published, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12,
        $13, $14, FALSE, NOW(), NOW()
      ) RETURNING *`,
      [user.id, name, category, type, plan, email, phone,
        b.registration_no || null, b.vatpan || null, contactPerson,
        String(b.city || 'Kathmandu').trim(), String(b.address || '').trim(),
        paymentRequired ? 'pending_payment' : 'pending', paymentRequired ? 'pending_payment' : 'pending']
    );
    const provider = providerResult.rows[0];

    await client.query(
      `INSERT INTO provider_subscriptions(provider_id, plan, amount, currency, payment_status, payment_reference,
        gateway_order_id, gateway)
       VALUES ($1, $2, $3, 'INR', $4, $5, $5, $6)`,
      [provider.id, plan, amount, paymentRequired ? 'pending' : 'not_required', razorpay?.order.id || null, paymentRequired ? 'razorpay' : null]
    );

    if (!paymentRequired) await client.query(
      `INSERT INTO admin_notifications (title, message, provider_id) VALUES ($1, $2, $3)`,
      ['Provider registration awaiting review', `${name} submitted a free-plan registration.`, provider.id]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      message: paymentRequired ? 'Registration saved. Complete Razorpay payment to send it for Super Admin review.' : 'Registration saved and sent for Super Admin review.',
      payment_required: paymentRequired,
      payment: paymentRequired ? { key_id: razorpay.keyId, order_id: razorpay.order.id, amount: razorpay.order.amount, currency: razorpay.order.currency } : null,
      provider: { id: provider.id, name: provider.name, email: provider.email, plan: provider.plan, verification_status: provider.verification_status }
    });
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    console.error('Provider registration failed:', err.message);
    return res.status(err.status || 500).json({ success: false, error: err.status === 503 ? 'Razorpay is not configured. Contact SAINO support before submitting a paid plan.' : err.status === 502 ? 'Razorpay could not create the payment order. No registration was submitted; try again.' : 'Provider registration could not be saved. Check backend database connection and schema.' });
  } finally {
    if (client) client.release();
  }
});

router.post('/payment/verify', async (req, res) => {
  const body = req.body || {};
  const providerId = String(body.provider_id || '').trim();
  const orderId = String(body.razorpay_order_id || '').trim();
  const paymentId = String(body.razorpay_payment_id || '').trim();
  const signature = String(body.razorpay_signature || '').trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || !providerId || !orderId || !paymentId || !signature) {
    return res.status(400).json({ success: false, error: 'Payment verification details are incomplete.' });
  }
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  if (!secureSignatureEqual(expected, signature)) return res.status(400).json({ success: false, error: 'Razorpay payment signature is invalid.' });
  let client;
  try {
    await initTables();
    const saved = await pool.query(`SELECT s.id, s.provider_id, s.amount, s.currency FROM provider_subscriptions s
      WHERE s.provider_id::text=$1 AND s.gateway_order_id=$2 AND s.payment_status='pending' LIMIT 1`, [providerId, orderId]);
    if (!saved.rowCount) return res.status(409).json({ success: false, error: 'This payment order is not pending for the selected registration.' });

    const verifyResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${keySecret}`).toString('base64')}` }
    });
    const payment = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || payment.order_id !== orderId || payment.status !== 'captured' ||
        Number(payment.amount) !== Math.round(Number(saved.rows[0].amount) * 100) || payment.currency !== saved.rows[0].currency) {
      return res.status(402).json({ success: false, error: 'Razorpay has not confirmed a captured payment for this order.' });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    const locked = await client.query(`SELECT id FROM provider_subscriptions WHERE id=$1 AND payment_status='pending' FOR UPDATE`, [saved.rows[0].id]);
    if (!locked.rowCount) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'This payment was already processed.' }); }
    await client.query(`UPDATE provider_subscriptions SET payment_status='paid', payment_reference=$1,
      gateway_payment_id=$1, updated_at=NOW() WHERE id=$2`, [paymentId, saved.rows[0].id]);
    const provider = await client.query(`UPDATE providers SET status='pending', verification_status='pending', updated_at=NOW()
      WHERE id=$1 RETURNING name`, [saved.rows[0].provider_id]);
    await client.query(`INSERT INTO admin_notifications(title,message,provider_id) VALUES($1,$2,$3)`,
      ['Paid provider registration awaiting review', `${provider.rows[0].name} completed Razorpay payment and needs onboarding approval.`, saved.rows[0].provider_id]);
    await client.query('COMMIT');
    return res.json({ success: true, message: 'Payment verified. Your registration is now awaiting Super Admin approval.' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Provider Razorpay verification failed:', err.message);
    return res.status(503).json({ success: false, error: 'Payment verification is temporarily unavailable. Contact SAINO support with your payment ID.' });
  } finally { if (client) client.release(); }
});

// Public endpoint: credential check against the password hash in PostgreSQL.
router.post('/login', async (req, res) => {
  try {
    await initTables();
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    const password = String((req.body || {}).password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Enter your registered email and password.' });
    }

    const result = await pool.query(
      `SELECT u.id AS user_id, u.full_name, u.email, u.password_hash, u.is_active,
              p.id AS provider_id, p.name AS provider_name, p.plan, p.verification_status,
              p.status AS provider_status
       FROM users u
       JOIN providers p ON p.owner_user_id = u.id
       WHERE LOWER(u.email) = $1 AND u.role = 'provider'
       LIMIT 1`,
      [email]
    );
    const record = result.rows[0];
    if (!record || !record.password_hash || !(await bcrypt.compare(password, record.password_hash))) {
      return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
    }
    if (!record.is_active) return res.status(403).json({ success: false, code: 'PROVIDER_APPROVAL_PENDING', error: 'Your payment or Super Admin approval is still pending. You can sign in after approval.' });

    const token = jwt.sign(
      { userId: String(record.user_id), providerId: String(record.provider_id), role: 'provider' },
      getJwtSecret(),
      { expiresIn: '12h', issuer: 'saino-health' }
    );
    return res.json({
      success: true,
      token,
      user: { id: record.user_id, name: record.full_name, email: record.email },
      provider: { id: record.provider_id, name: record.provider_name, plan: record.plan, verification_status: record.verification_status }
    });
  } catch (err) {
    console.error('Provider login failed:', err.message);
    return res.status(500).json({ success: false, error: 'Provider login is unavailable. Check backend configuration.' });
  }
});

// Every dashboard/data endpoint below requires a valid signed-in provider account.
router.use(async (req, res, next) => {
  try {
    await initTables();
    const header = String(req.headers.authorization || '');
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Please sign in again.' });

    const claims = jwt.verify(match[1], getJwtSecret(), { issuer: 'saino-health' });
    if (claims.role !== 'provider' || !claims.userId || !claims.providerId) {
      return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Provider session is not valid.' });
    }

    const result = await pool.query(
      `SELECT p.*, u.id AS account_user_id, u.full_name AS account_full_name,
              u.email AS account_email, u.phone AS account_phone
       FROM providers p
       JOIN users u ON u.id = p.owner_user_id
       WHERE p.id = $1 AND u.id = $2 AND u.role = 'provider' AND u.is_active = TRUE
       LIMIT 1`,
      [claims.providerId, claims.userId]
    );
    if (!result.rows.length) return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Provider account was not found.' });
    req.provider = result.rows[0];
    req.providerId = result.rows[0].id;
    req.providerUserId = result.rows[0].account_user_id;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Your session expired. Please sign in again.' });
    }
    console.error('Provider auth middleware failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not verify provider session.' });
  }
});

// ---- Profile completeness + admin review submit ----
const { getCompleteness } = require('../services/profileCompleteness');

router.use('/', require('./providerChanges')); // template, change requests (approval flow)
router.use('/search', require('./search').providerSearch); // provider ka apna search
router.get('/notifications', async (req, res) => {
  try {
    const rows = (await pool.query(
      `SELECT id, title, message, is_read, created_at FROM admin_notifications
       WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 100`, [req.providerId]
    )).rows;
    res.json({ success: true, rows, unread: rows.filter(row => !row.is_read).length });
  } catch (err) { res.status(500).json({ success: false, error: 'Could not load notifications.' }); }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE admin_notifications SET is_read = TRUE
       WHERE id = $1 AND provider_id = $2 RETURNING id, is_read`, [req.params.id, req.providerId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Notification not found.' });
    res.json({ success: true, notification: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Could not update notification.' }); }
});
router.get('/completeness', async (req, res) => {
  try {
    const c = await getCompleteness(pool, req.providerId);
    return res.json({ success: true, ...c });
  } catch (err) {
    console.error('Completeness failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not load profile status.' });
  }
});

router.post('/submit-for-review', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT 1 FROM providers WHERE id = $1 FOR UPDATE', [req.providerId]);
    const c = await getCompleteness(client, req.providerId);
    if (!c.complete) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Complete the required details before submitting your profile.', missing: c.missing, percent: c.percent });
    }
    if (c.verification_status === 'verified') {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'Your listing is already verified.', status: 'verified' });
    }
    await client.query(`UPDATE providers SET verification_status = 'pending', status = 'pending', is_published = FALSE, updated_at = NOW() WHERE id = $1`, [req.providerId]);
    await client.query(`INSERT INTO admin_notifications (title, message, provider_id) VALUES ($1, $2, $3)`,
      ['Provider submitted for verification', `${req.provider.name} has completed a profile with ${c.counts.doctors} doctor(s) and ${c.counts.services} service(s). Review the listing.`, req.providerId]);
    await client.query('COMMIT');
    return res.json({ success: true, message: 'Sent to the Super Admin. Your listing will appear on the marketplace after approval.', status: 'pending' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Submit for review failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not submit the profile. Please try again.' });
  } finally {
    client.release();
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const p = req.provider;
    const [appt, docs, services, waiting, queueRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE source IN ('marketplace','website'))::int AS marketplace, COUNT(*) FILTER (WHERE source = 'walkin')::int AS walkin, COUNT(*) FILTER (WHERE source = 'qr')::int AS qr, COUNT(*) FILTER (WHERE consultation_type = 'video')::int AS telemedicine, COUNT(*) FILTER (WHERE LOWER(status) IN ('waiting','checked_in','arrived'))::int AS waiting FROM provider_appointments WHERE provider_id = $1", [req.providerId]),
      pool.query("SELECT COUNT(*)::int AS count FROM doctors WHERE provider_id = $1 AND status <> 'deleted' AND is_active = TRUE", [req.providerId]),
      pool.query("SELECT COUNT(*)::int AS count FROM services WHERE provider_id = $1 AND status <> 'deleted' AND is_active = TRUE", [req.providerId]),
      pool.query("SELECT COUNT(*)::int AS count FROM provider_appointments WHERE provider_id = $1 AND LOWER(status) = 'waiting'", [req.providerId]),
      pool.query('SELECT state FROM provider_queue_state WHERE provider_id = $1', [req.providerId])
    ]);
    const counts = appt.rows[0] || {};
    const savedQueue = queueRes.rows[0] && queueRes.rows[0].state;
    const safeProvider = {
      ...p,
      plan_name: p.plan || 'Saino Free',
      doctor_limit: null,
      service_limit: null
    };
    delete safeProvider.password_hash;
    return res.json({
      success: true,
      provider: safeProvider,
      user: { name: p.account_full_name || p.contact_person || '', role: 'Provider Admin' },
      stats: {
        total: Number(counts.total || 0), marketplace: Number(counts.marketplace || 0),
        walkin: Number(counts.walkin || 0), qr: Number(counts.qr || 0),
        telemedicine: Number(counts.telemedicine || 0), waiting: Number(waiting.rows[0].count || 0),
        doctors: Number(docs.rows[0].count || 0), services: Number(services.rows[0].count || 0)
      },
      queue: savedQueue || { serving: null, waiting: [], stats: { waiting: 0, completed: 0, issued: 0 } }
    });
  } catch (err) {
    console.error('Provider dashboard load failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not load provider dashboard data.' });
  }
});

router.get('/doctors', async (req, res) => {
  try {
    const rows = (await pool.query(`SELECT id, provider_id, full_name AS name, avatar_url, qualification,
      COALESCE(department, specialization) AS department, experience_years, nmc_no, room,
      COALESCE(opd_fee, consultation_fee, 0) AS opd_fee, followup_fee, shift_timings, status, phone
      FROM doctors WHERE provider_id = $1 AND status <> 'deleted' AND is_active = TRUE ORDER BY id DESC`, [req.providerId])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load doctors.' });
  }
});

router.post('/doctors', async (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim()) return res.status(400).json({ success: false, message: 'Doctor name is required.' });
  const feeInput = [b.opd_fee, b.consultation_fee, b.fee].find(value => value !== undefined && value !== null && value !== '');
  const opdFee = feeInput === '' || feeInput == null ? null : Number(feeInput);
  if (opdFee == null || !Number.isFinite(opdFee) || opdFee < 0) {
    return res.status(400).json({ success: false, error: 'Enter a valid consultation fee (zero or more).' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO doctors (
        provider_id, full_name, name, specialization, department, phone, consultation_fee, opd_fee,
        avatar_url, qualification, experience_years, nmc_no, room, followup_fee, shift_timings,
        is_active, status, is_public
      ) VALUES ($1,$2,$2,$3,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,'active',
        COALESCE((SELECT is_published FROM providers WHERE id=$1), FALSE))
      RETURNING id, provider_id, full_name AS name, avatar_url, qualification,
        COALESCE(department, specialization) AS department, experience_years, nmc_no, room,
        COALESCE(opd_fee, consultation_fee, 0) AS opd_fee, followup_fee, shift_timings, status`, [
      req.providerId, String(b.name).trim(), b.department || null, b.phone || null,
      opdFee, b.avatar_url || null, b.qualification || null,
      Math.max(0, parseInt(b.experience_years, 10) || 1), b.nmc_no || null, b.room || null,
      Math.max(0, Number(b.followup_fee) || 0), b.shift_timings || null
    ]);
    res.status(201).json({ success: true, doctor: result.rows[0] });
  } catch (err) {
    console.error('Doctor save failed:', err.message);
    res.status(500).json({ success: false, message: 'Could not save doctor to PostgreSQL.' });
  }
});

router.put('/doctors/:id', async (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim()) return res.status(400).json({ success: false, error: 'Doctor name is required.' });
  const feeInput = [b.opd_fee, b.consultation_fee, b.fee].find(value => value !== undefined && value !== null && value !== '');
  const opdFee = feeInput === '' || feeInput == null ? null : Number(feeInput);
  if (opdFee == null || !Number.isFinite(opdFee) || opdFee < 0) {
    return res.status(400).json({ success: false, error: 'Enter a valid consultation fee (zero or more).' });
  }
  try {
    const result = await pool.query(`UPDATE doctors SET
      full_name = $3, name = $3, specialization = $4, department = $4,
      avatar_url = NULLIF($5, ''), qualification = NULLIF($6, ''),
      experience_years = $7, nmc_no = NULLIF($8, ''), room = NULLIF($9, ''),
      opd_fee = $10, consultation_fee = $10, followup_fee = $11,
      shift_timings = NULLIF($12, ''), phone = NULLIF($13, ''), updated_at = NOW()
      WHERE id = $1 AND provider_id = $2 AND status <> 'deleted' AND is_active = TRUE
      RETURNING id, provider_id, full_name AS name, avatar_url, qualification,
        COALESCE(department, specialization) AS department, experience_years, nmc_no, room,
        COALESCE(opd_fee, consultation_fee, 0) AS opd_fee, followup_fee, shift_timings, status`, [
      req.params.id, req.providerId, String(b.name).trim(), b.department || null,
      b.avatar_url || '', b.qualification || '', Math.max(0, parseInt(b.experience_years, 10) || 0),
      b.nmc_no || '', b.room || '', opdFee,
      Math.max(0, Number(b.followup_fee) || 0), b.shift_timings || '', b.phone || ''
    ]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Doctor record not found.' });
    return res.json({ success: true, doctor: result.rows[0] });
  } catch (err) {
    console.error('Doctor update failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not update doctor record.' });
  }
});

router.put('/profile', async (req, res) => {
  const b = req.body || {};
  try {
    const result = await pool.query(`
      UPDATE providers SET
        name = COALESCE(NULLIF($1, ''), name),
        phone = COALESCE(NULLIF($2, ''), phone),
        description = COALESCE($3, description),
        logo_url = COALESCE($4, logo_url),
        cover_image_url = COALESCE($5, cover_image_url),
        address = COALESCE($6, address),
        address_line = COALESCE($6, address_line),
        city = COALESCE(NULLIF($7, ''), city),
        state = COALESCE($8, state),
        pincode = COALESCE($9, pincode),
        upi_id = COALESCE($10, upi_id),
        profile_completion_pct = COALESCE($11, profile_completion_pct),
        provider_type = COALESCE(NULLIF($12, ''), provider_type),
        category = COALESCE(NULLIF($13, ''), category),
        registration_no = COALESCE(NULLIF($14, ''), registration_no),
        website = COALESCE(NULLIF($15, ''), website),
        opening_hours = COALESCE($16, opening_hours),
        facilities_info = COALESCE($17, facilities_info),
        email = COALESCE(NULLIF($18, ''), email),
        gallery_images = COALESCE($19::jsonb, gallery_images),
        updated_at = NOW()
      WHERE id = $20 RETURNING *`, [
      b.name, b.phone, b.description, b.logo_url, b.cover_image_url,
      b.address || b.address_line, b.city, b.state, b.pincode, b.upi_id, null,
      b.provider_type, b.category, b.registration_no, b.website, b.opening_hours,
      b.facilities_info, b.email, Array.isArray(b.gallery_images) ? JSON.stringify(b.gallery_images.slice(0, 5)) : null,
      req.providerId
    ]);
    const c = await getCompleteness(pool, req.providerId);
    return res.json({ success: true, provider: result.rows[0], profile_completion_pct: c.percent, missing: c.missing });
  } catch (err) {
    console.error('Provider profile update failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not save provider profile.' });
  }
});

router.post('/queue/:action', async (req, res) => {
  const allowed = new Set(['call-next', 'done', 'skip']);
  if (!allowed.has(req.params.action)) return res.status(400).json({ success: false, error: 'Unknown queue action.' });
  try {
    const incoming = req.body && typeof req.body === 'object' ? req.body : {};
    await pool.query(
      `INSERT INTO provider_queue_state(provider_id, state, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT(provider_id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
      [req.providerId, JSON.stringify(incoming)]
    );
    res.json({ success: true, message: `Queue action ${req.params.action} saved.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not save queue state.' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const rows = (await pool.query(`SELECT id, provider_id, name, description, category, department, price,
      duration_min, code, status, is_active, created_at FROM services
      WHERE provider_id = $1 AND status <> 'deleted' AND is_active = TRUE ORDER BY id DESC`, [req.providerId])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load services.' });
  }
});

router.post('/services', async (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim()) return res.status(400).json({ success: false, message: 'Service name is required.' });
  try {
    const result = await pool.query(`
      INSERT INTO services(provider_id, name, description, category, department, price, duration_min, code, status, is_active, is_public)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',TRUE,COALESCE((SELECT is_published FROM providers WHERE id=$1), FALSE)) RETURNING *`, [
      req.providerId, String(b.name).trim(), b.description || null, b.category || null, b.department || null,
      Math.max(0, Number(b.price) || 0), Math.max(1, parseInt(b.duration_min, 10) || 15),
      'SVC-' + Date.now().toString().slice(-6)
    ]);
    res.status(201).json({ success: true, service: result.rows[0] });
  } catch (err) {
    console.error('Service save failed:', err.message);
    res.status(500).json({ success: false, message: 'Could not save service to PostgreSQL.' });
  }
});

router.put('/services/:id', async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const price = b.price === '' || b.price == null ? null : Number(b.price);
  const duration = b.duration_min === '' || b.duration_min == null ? 15 : Number.parseInt(b.duration_min, 10);
  if (!name) return res.status(400).json({ success: false, error: 'Service name is required.' });
  if (price == null || !Number.isFinite(price) || price < 0) return res.status(400).json({ success: false, error: 'Enter a valid service fee (zero or more).' });
  if (!Number.isInteger(duration) || duration < 1) return res.status(400).json({ success: false, error: 'Enter a valid service duration.' });
  try {
    const result = await pool.query(`UPDATE services SET
      name = $3, category = NULLIF($4, ''), department = NULLIF($5, ''), description = NULLIF($6, ''),
      price = $7, duration_min = $8, updated_at = NOW()
      WHERE id = $1 AND provider_id = $2 AND status <> 'deleted' AND is_active = TRUE
      RETURNING id, provider_id, name, description, category, department, price, duration_min, code, status, is_active, created_at`, [
      req.params.id, req.providerId, name, String(b.category || ''), String(b.department || ''), String(b.description || ''), price, duration
    ]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Service record not found.' });
    return res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    console.error('Service update failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not update service in PostgreSQL.' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const rows = (await pool.query('SELECT * FROM provider_appointments WHERE provider_id = $1 ORDER BY created_at DESC', [req.providerId])).rows;
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load appointments.' });
  }
});

router.post('/appointments', async (req, res) => {
  const b = req.body || {};
  const patientName = String(b.patient_name || b.patient || '').trim();
  if (!patientName) return res.status(400).json({ success: false, error: 'Patient name is required.' });
  const phone = String(b.patient_phone || b.phone || '').trim();
  const email = String(b.patient_email || b.email || '').trim().toLowerCase();
  const sourceAllowed = new Set(['walkin', 'phone', 'qr', 'marketplace', 'telemedicine', 'website', 'manual']);
  const sourceInput = String(b.source || 'walkin').toLowerCase();
  const source = sourceAllowed.has(sourceInput) ? (sourceInput === 'manual' ? 'walkin' : sourceInput) : 'walkin';
  const requestedStatus = String(b.status || 'waiting').toLowerCase();
  const statusMap = { waiting:'waiting', pending:'pending', confirmed:'confirmed', checked_in:'checked_in', in_progress:'in_progress', completed:'completed', cancelled:'cancelled', no_show:'no_show' };
  const status = statusMap[requestedStatus] || 'waiting';
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT id FROM providers WHERE id=$1 FOR UPDATE', [req.providerId]);
    let patientRow = null;
    if (email) {
      const found = await client.query('SELECT * FROM patient_profiles WHERE LOWER(email) = $1 LIMIT 1', [email]);
      patientRow = found.rows[0] || null;
    }
    if (!patientRow && phone) {
      const found = await client.query('SELECT * FROM patient_profiles WHERE phone = $1 ORDER BY created_at ASC LIMIT 1', [phone]);
      patientRow = found.rows[0] || null;
    }
    if (patientRow) {
      const updated = await client.query(`UPDATE patient_profiles SET full_name = $1, phone = COALESCE(NULLIF($2,''), phone),
        email = COALESCE(NULLIF($3,''), email), updated_at = NOW() WHERE id = $4 RETURNING *`, [patientName, phone, email, patientRow.id]);
      patientRow = updated.rows[0];
    } else {
      const created = await client.query(`INSERT INTO patient_profiles(pid, full_name, phone, email)
        VALUES($1,$2,$3,$4) RETURNING *`, [makePublicId('PID'), patientName, phone || null, email || null]);
      patientRow = created.rows[0];
    }
    const countRes = await client.query(`SELECT COUNT(*)::int AS count FROM provider_appointments WHERE provider_id = $1 AND appointment_date = CURRENT_DATE`, [req.providerId]);
    const seq = Number(countRes.rows[0].count || 0) + 1;
    const token = String(b.token || `A-${String(seq).padStart(3, '0')}`);
    const bookingRef = String(b.booking_ref || b.bookingId || makePublicId('SAINO'));
    let doctorId = b.doctor_id ? Number(b.doctor_id) : null;
    if (doctorId) {
      const doctorCheck = await client.query('SELECT id, full_name, room, COALESCE(opd_fee, consultation_fee,0) AS fee FROM doctors WHERE id = $1 AND provider_id = $2 AND is_active = TRUE LIMIT 1', [doctorId, req.providerId]);
      if (!doctorCheck.rowCount) return await rollbackBadRequest(client, res, 'Selected doctor does not belong to this provider.');
      if (!b.doctor) b.doctor = doctorCheck.rows[0].full_name;
      if (!b.room) b.room = doctorCheck.rows[0].room;
      if (b.fee === undefined || b.fee === null || b.fee === '') b.fee = doctorCheck.rows[0].fee;
    }
    let serviceId = b.service_id ? Number(b.service_id) : null;
    let serviceName = String(b.service_name || b.service || '').trim();
    if (serviceId) {
      const serviceCheck = await client.query('SELECT id, name, price FROM services WHERE id = $1 AND provider_id = $2 AND is_active = TRUE LIMIT 1', [serviceId, req.providerId]);
      if (!serviceCheck.rowCount) return await rollbackBadRequest(client, res, 'Selected service does not belong to this provider.');
      serviceName = serviceCheck.rows[0].name;
      if (b.fee === undefined || b.fee === null || b.fee === '') b.fee = serviceCheck.rows[0].price;
    } else if (serviceName) {
      const serviceCheck = await client.query('SELECT id, name, price FROM services WHERE provider_id = $1 AND LOWER(name) = LOWER($2) AND is_active = TRUE LIMIT 1', [req.providerId, serviceName]);
      if (serviceCheck.rowCount) {
        serviceId = serviceCheck.rows[0].id;
        serviceName = serviceCheck.rows[0].name;
        if (b.fee === undefined || b.fee === null || b.fee === '') b.fee = serviceCheck.rows[0].price;
      }
    }
    const appointmentDate = String(b.appointment_date || b.date || '').trim() || new Date().toISOString().slice(0, 10);
    const slotTime = String(b.slot_time || b.time || '').trim() || null;
    const consultationType = String(b.consultation_type || (source === 'telemedicine' ? 'video' : 'in_person')).toLowerCase() === 'video' ? 'video' : 'in_person';
    const fee = b.fee === undefined || b.fee === null || b.fee === '' ? 0 : Math.max(0, Number(b.fee) || 0);
    const result = await client.query(`
      INSERT INTO provider_appointments(
        provider_id, booking_ref, token, patient_id, patient_name, patient_phone, patient_email,
        doctor_id, doctor, room, service_id, service_name, source, slot_time, fee, status,
        appointment_date, consultation_type, payment_status, payment_method, reason,
        checked_in_at, updated_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
        CASE WHEN $16 IN ('checked_in','in_progress','completed') THEN NOW() ELSE NULL END, NOW()) RETURNING *`, [
      req.providerId, bookingRef, token, patientRow.pid, patientName, phone || null, email || null,
      doctorId, b.doctor || null, b.room || null, serviceId, serviceName || null, source,
      slotTime, fee, status, appointmentDate, consultationType,
      String(b.payment_status || 'pending'), b.payment_method || null, b.reason || b.notes || null
    ]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, appointment: result.rows[0], rows: [result.rows[0]], patient: { pid: patientRow.pid } });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    console.error('Appointment save failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not save appointment to PostgreSQL.' });
  } finally {
    if (client) client.release();
  }
});

async function rollbackBadRequest(client, res, message) {
  try { await client.query('ROLLBACK'); } catch (_) {}
  res.status(400).json({ success: false, error: message });
  return undefined;
}

router.get('/staff', async (req, res) => {
  try {
    const rows = (await pool.query("SELECT * FROM provider_staff WHERE provider_id = $1 AND status <> 'deleted' ORDER BY id DESC", [req.providerId])).rows;
    res.json({ success: true, rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Could not load staff.' }); }
});

router.post('/staff', async (req, res) => {
  const b = req.body || {};
  if (!String(b.name || '').trim()) return res.status(400).json({ success: false, message: 'Staff name is required.' });
  try {
    const result = await pool.query(`INSERT INTO provider_staff(provider_id, name, email, avatar_url, role) VALUES($1,$2,$3,$4,$5) RETURNING *`, [
      req.providerId, String(b.name).trim(), b.email || null, b.avatar_url || null, b.role || 'Receptionist'
    ]);
    res.status(201).json({ success: true, staff: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not save staff member.' }); }
});

router.get('/payments', async (req, res) => {
  try {
    const [rowsRes, totalsRes] = await Promise.all([
      pool.query('SELECT * FROM provider_payments WHERE provider_id = $1 ORDER BY created_at DESC', [req.providerId]),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total,
                  COALESCE(SUM(amount) FILTER (WHERE LOWER(payment_method) LIKE '%cash%'),0)::numeric AS cash,
                  COALESCE(SUM(amount) FILTER (WHERE LOWER(payment_method) NOT LIKE '%cash%'),0)::numeric AS digital
                  FROM provider_payments WHERE provider_id = $1`, [req.providerId])
    ]);
    res.json({ success: true, rows: rowsRes.rows, totals: totalsRes.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Could not load payments.' }); }
});

router.post('/payments', async (req, res) => {
  const b = req.body || {};
  if (!String(b.patient_name || '').trim()) return res.status(400).json({ success: false, message: 'Patient name is required.' });
  try {
    const result = await pool.query(`INSERT INTO provider_payments(provider_id, patient_name, service_name, amount, payment_method, account_mask)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [
      req.providerId, String(b.patient_name).trim(), b.service_name || null,
      Math.max(0, Number(b.amount) || 0), b.payment_method || null, b.account_mask || null
    ]);
    res.status(201).json({ success: true, payment: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not save payment record.' }); }
});

router.put('/settings', async (req, res) => {
  const b = req.body || {};
  const updates = [];
  const values = [];
  const add = (column, value) => { if (value !== undefined && value !== null && String(value).trim() !== '') { values.push(value); updates.push(`${column} = $${values.length}`); } };
  add('name', b.name);
  add('city', b.city);
  if (updates.length) {
    values.push(req.providerId);
    try {
      await pool.query(`UPDATE providers SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`, values);
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Could not save provider settings.' });
    }
  }
  if (b.admin_name) {
    try { await pool.query('UPDATE users SET full_name = $1 WHERE id = $2', [String(b.admin_name).trim(), req.providerUserId]); }
    catch (err) { return res.status(500).json({ success: false, message: 'Could not update account name.' }); }
  }
  res.json({ success: true, message: 'Settings saved.' });
});


// Provider-scoped reviews. Values are normalised from the existing reviews table to tolerate its earlier schema variants.
router.get('/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT to_jsonb(r) AS raw
      FROM reviews r
      WHERE COALESCE(to_jsonb(r)->>'provider_id', to_jsonb(r)->>'hospital_id') = $1
        AND COALESCE(to_jsonb(r)->>'is_hidden', 'false') <> 'true'
      ORDER BY COALESCE(to_jsonb(r)->>'created_at', to_jsonb(r)->>'date', '') DESC
      LIMIT 250`, [String(req.providerId)]);
    const replies = await pool.query('SELECT review_id, response, created_at FROM provider_review_responses WHERE provider_id = $1', [req.providerId]);
    const replyMap = new Map(replies.rows.map(row => [String(row.review_id), row]));
    const rows = result.rows.map(({ raw }) => {
      const id = String(raw.id || raw.review_id || '');
      const reply = replyMap.get(id);
      return {
        id, patient_name: raw.patient_name || raw.patient || raw.user_name || raw.name || 'Patient',
        rating: Number(raw.rating || raw.stars || 0),
        comment: raw.comment || raw.review || raw.feedback || raw.message || '',
        created_at: raw.created_at || raw.date || null,
        verified_visit: Boolean(raw.verified_visit || raw.is_verified || raw.booking_id),
        response: reply ? reply.response : (raw.provider_response || raw.response || '')
      };
    });
    res.json({ success: true, rows });
  } catch (err) {
    console.error('Provider reviews load failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load reviews.' });
  }
});

router.post('/reviews/:reviewId/respond', async (req, res) => {
  const response = String((req.body || {}).response || '').trim();
  if (!response) return res.status(400).json({ success: false, error: 'Reply cannot be empty.' });
  try {
    const exists = await pool.query(`SELECT 1 FROM reviews r WHERE r.id::text = $1 AND
      COALESCE(to_jsonb(r)->>'provider_id', to_jsonb(r)->>'hospital_id') = $2 LIMIT 1`, [String(req.params.reviewId), String(req.providerId)]);
    if (!exists.rowCount) return res.status(404).json({ success: false, error: 'Review not found for this provider.' });
    const result = await pool.query(`
      INSERT INTO provider_review_responses(review_id, provider_id, response, responded_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (review_id, provider_id) DO UPDATE SET response = EXCLUDED.response, responded_by = EXCLUDED.responded_by, updated_at = NOW()
      RETURNING *`, [req.params.reviewId, req.providerId, response, req.providerUserId]);
    res.json({ success: true, response: result.rows[0] });
  } catch (err) {
    console.error('Provider review response failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not save review response.' });
  }
});

router.get('/qr', async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT q.*, (SELECT COUNT(*)::int FROM provider_qr_scans s WHERE s.qr_code_id = q.id) AS unique_scans,
             (SELECT COUNT(*)::int FROM provider_appointments a WHERE a.provider_id = q.provider_id AND a.source = 'qr'
               AND a.created_at >= q.created_at) AS attributed_bookings
      FROM provider_qr_codes q WHERE q.provider_id = $1 ORDER BY q.created_at DESC`, [req.providerId]);
    res.json({ success: true, rows: rows.rows });
  } catch (err) {
    console.error('Provider QR list failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load QR codes.' });
  }
});

router.post('/qr', async (req, res) => {
  const b = req.body || {};
  const label = String(b.label || 'Reception QR').trim().slice(0, 160);
  const branch = String(b.branch_name || '').trim().slice(0, 160) || null;
  try {
    const code = makePublicId('QR');
    const result = await pool.query(`
      INSERT INTO provider_qr_codes(provider_id, code, label, branch_name, destination_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
      req.providerId, code, label, branch,
      `/qr/${code}`, req.providerUserId
    ]);
    res.status(201).json({ success: true, qr: result.rows[0] });
  } catch (err) {
    console.error('Provider QR create failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not create QR code.' });
  }
});

router.patch('/qr/:id/status', async (req, res) => {
  const status = String((req.body || {}).status || '').toLowerCase();
  if (!['active', 'disabled'].includes(status)) return res.status(400).json({ success: false, error: 'Status must be active or disabled.' });
  try {
    const result = await pool.query(`UPDATE provider_qr_codes SET status = $1, updated_at = NOW()
      WHERE id = $2 AND provider_id = $3 RETURNING *`, [status, req.params.id, req.providerId]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'QR code not found.' });
    res.json({ success: true, qr: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not update QR status.' });
  }
});

// Update an appointment from reception: confirm, check in, start, complete, cancel or mark no-show.
router.patch('/appointments/:id', async (req, res) => {
  const b = req.body || {};
  const statusMap = {
    pending: 'pending', confirmed: 'confirmed', checked_in: 'checked_in', waiting: 'waiting',
    in_progress: 'in_progress', completed: 'completed', cancelled: 'cancelled', 'no-show': 'no_show', no_show: 'no_show'
  };
  const requested = String(b.status || '').toLowerCase();
  if (requested && !statusMap[requested]) return res.status(400).json({ success: false, error: 'Unsupported appointment status.' });
  try {
    const current = await pool.query('SELECT * FROM provider_appointments WHERE id = $1 AND provider_id = $2 LIMIT 1', [req.params.id, req.providerId]);
    if (!current.rowCount) return res.status(404).json({ success: false, error: 'Appointment not found.' });
    const prior = current.rows[0];
    const nextStatus = statusMap[requested] || prior.status;
    const shouldCreateVisit = ['checked_in', 'in_progress', 'completed'].includes(nextStatus);
    const visitId = prior.visit_id || (shouldCreateVisit ? makePublicId('VISIT') : null);
    const result = await pool.query(`UPDATE provider_appointments SET
      status = $1,
      room = COALESCE(NULLIF($2, ''), room),
      eta_minutes = COALESCE($3, eta_minutes),
      payment_status = COALESCE(NULLIF($4, ''), payment_status),
      checked_in_at = CASE WHEN $1 IN ('checked_in','in_progress','completed') THEN COALESCE(checked_in_at, NOW()) ELSE checked_in_at END,
      started_at = CASE WHEN $1 IN ('in_progress','completed') THEN COALESCE(started_at, NOW()) ELSE started_at END,
      completed_at = CASE WHEN $1 = 'completed' THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
      visit_id = COALESCE(visit_id, $5), updated_at = NOW()
      WHERE id = $6 AND provider_id = $7 RETURNING *`, [
      nextStatus, b.room || '', b.eta_minutes === undefined || b.eta_minutes === '' ? null : Math.max(0, Number(b.eta_minutes)),
      b.payment_status || '', visitId, req.params.id, req.providerId
    ]);
    const saved = result.rows[0];
    const roomChanged = b.room && String(b.room) !== String(prior.room || '');
    const etaChanged = b.eta_minutes !== undefined && b.eta_minutes !== '' && Number(b.eta_minutes) !== Number(prior.eta_minutes);
    if (prior.patient_id && (nextStatus !== prior.status || roomChanged || etaChanged)) {
      const statusMessages = {
        confirmed: 'Your appointment is confirmed by the provider.',
        checked_in: 'You have been checked in at the provider.',
        waiting: 'You are now in the live waiting queue.',
        in_progress: 'Your consultation is now in progress.',
        completed: 'Your consultation has been marked complete.',
        cancelled: 'Your appointment was cancelled by the provider.',
        no_show: 'The provider marked this appointment as no-show.'
      };
      const message = [statusMessages[nextStatus] || 'Your appointment details were updated.',
        saved.token ? `Queue token ${saved.token}.` : '', saved.room ? `Room ${saved.room}.` : '',
        saved.eta_minutes != null ? `Estimated wait ${saved.eta_minutes} minutes.` : ''].filter(Boolean).join(' ');
      await pool.query(`INSERT INTO patient_notifications(patient_id,booking_ref,type,title,message,payload)
        VALUES($1,$2,'booking_update',$3,$4,$5::jsonb)`, [
        saved.patient_id, saved.booking_ref, `Appointment ${nextStatus.replace(/_/g, ' ')}`, message,
        JSON.stringify({ status: saved.status, payment_status: saved.payment_status, token: saved.token,
          visit_id: saved.visit_id, room: saved.room, eta_minutes: saved.eta_minutes,
          appointment_date: saved.appointment_date, slot_time: saved.slot_time })
      ]);
    }
    res.json({ success: true, appointment: saved });
  } catch (err) {
    console.error('Appointment update failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not update appointment.' });
  }
});

module.exports = router;
