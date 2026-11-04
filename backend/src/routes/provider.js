const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const flow = require('../services/bookingFlow');
const razorpay = require('../services/razorpay');

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
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      ALTER TABLE providers
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_status VARCHAR(40) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS city VARCHAR(120),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'pending';

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

      ALTER TABLE provider_appointments
        ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_appointments_tracking_token
        ON provider_appointments(tracking_token) WHERE tracking_token IS NOT NULL;

      CREATE TABLE IF NOT EXISTS provider_staff (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(100) NOT NULL DEFAULT 'Receptionist',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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
        currency VARCHAR(8) NOT NULL DEFAULT 'NPR',
        payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
        payment_reference VARCHAR(200),
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
    `);

    // Repair missing generated-ID defaults in older hand-created tables without touching existing IDs.
    for (const table of ['users', 'providers', 'doctors', 'services', 'appointments', 'reviews']) {
      await ensureIdDefault(table);
    }

    // Ensure user-created databases that were bootstrapped with the initial schema
    // can still store provider profile, patient and booking fields without destructive changes.
    await flow.ensureBookingSchema(pool);
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

    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'provider', TRUE)
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
        'draft', 'draft', FALSE, NOW(), NOW()
      ) RETURNING *`,
      [user.id, name, category, type, plan, email, phone,
        b.registration_no || null, b.vatpan || null, contactPerson,
        String(b.city || 'Kathmandu').trim(), String(b.address || '').trim()]
    );
    const provider = providerResult.rows[0];

    await client.query(
      `INSERT INTO admin_notifications (title, message, provider_id)
       VALUES ($1, $2, $3)`,
      ['New Provider Registration (draft)', `${name} ne account banaya. Profile complete hone ke baad hi admin ko dikhega.`, provider.id]
    );
    await client.query(
      `INSERT INTO provider_subscriptions(provider_id, plan, amount, currency, payment_status)
       VALUES ($1, $2, $3, 'NPR', $4)`,
      [provider.id, plan, planAmount(plan), plan === 'Saino Free' ? 'not_required' : 'pending']
    );

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      message: 'Registration saved. Sign in to open your provider dashboard; marketplace publication waits for admin verification.',
      provider: { id: provider.id, name: provider.name, email: provider.email, plan: provider.plan, verification_status: provider.verification_status }
    });
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    console.error('Provider registration failed:', err.message);
    return res.status(500).json({ success: false, error: 'Provider registration could not be saved. Check backend database connection and schema.' });
  } finally {
    if (client) client.release();
  }
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
              p.id AS provider_id, p.name AS provider_name, p.plan, p.verification_status
       FROM users u
       JOIN providers p ON p.owner_user_id = u.id
       WHERE LOWER(u.email) = $1 AND u.role = 'provider'
       LIMIT 1`,
      [email]
    );
    const record = result.rows[0];
    if (!record || !record.is_active || !record.password_hash || !(await bcrypt.compare(password, record.password_hash))) {
      return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
    }

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
router.get('/completeness', async (req, res) => {
  try {
    const c = await getCompleteness(pool, req.providerId);
    return res.json({ success: true, ...c });
  } catch (err) {
    console.error('Completeness failed:', err.message);
    return res.status(500).json({ success: false, error: 'Profile status load nahi ho paya.' });
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
      return res.status(400).json({ success: false, error: 'Pehle ye details bharein, phir admin ko bhejein.', missing: c.missing, percent: c.percent });
    }
    if (c.verification_status === 'verified') {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'Aapki listing pehle se verified hai.', status: 'verified' });
    }
    await client.query(`UPDATE providers SET verification_status = 'pending', status = 'pending', is_published = FALSE, updated_at = NOW() WHERE id = $1`, [req.providerId]);
    await client.query(`INSERT INTO admin_notifications (title, message, provider_id) VALUES ($1, $2, $3)`,
      ['Provider submitted for verification', `${req.provider.name} ki profile complete hai (${c.counts.doctors} doctor, ${c.counts.services} service). Review karein.`, req.providerId]);
    await client.query('COMMIT');
    return res.json({ success: true, message: 'Admin ko bhej diya gaya. Approve hone par aapki listing home page par dikhegi.', status: 'pending' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Submit for review failed:', err.message);
    return res.status(500).json({ success: false, error: 'Submit nahi ho paya, dobara try karein.' });
  } finally {
    client.release();
  }
});
// Provider notifications
router.get('/notifications', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, appointment_id, title, message, is_read, created_at
       FROM provider_notifications
       WHERE provider_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.providerId]
    );

    res.json({ success: true, rows: result.rows });
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Could not load notifications.'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE provider_notifications
       SET is_read = TRUE
       WHERE id = $1 AND provider_id = $2
       RETURNING *`,
      [req.params.id, req.providerId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Mark read error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Could not update notification.'
    });
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
  try {
    const result = await pool.query(`
      INSERT INTO doctors (
        provider_id, full_name, specialization, department, phone, consultation_fee, opd_fee,
        avatar_url, qualification, experience_years, nmc_no, room, followup_fee, shift_timings,
        is_active, status
      ) VALUES ($1,$2,$3,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,'active')
      RETURNING id, provider_id, full_name AS name, avatar_url, qualification,
        COALESCE(department, specialization) AS department, experience_years, nmc_no, room,
        COALESCE(opd_fee, consultation_fee, 0) AS opd_fee, followup_fee, shift_timings, status`, [
      req.providerId, String(b.name).trim(), b.department || null, b.phone || null,
      Math.max(0, Number(b.opd_fee) || 0), b.avatar_url || null, b.qualification || null,
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
  const name = String(b.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'Doctor name is required.' });
  const experience = Number(b.experience_years);
  const opdFee = Number(b.opd_fee);
  const followupFee = Number(b.followup_fee);
  if (!Number.isInteger(experience) || experience < 0 ||
      !Number.isFinite(opdFee) || opdFee < 0 ||
      !Number.isFinite(followupFee) || followupFee < 0) {
    return res.status(400).json({ success: false, error: 'Enter valid experience and fee values.' });
  }
  try {
    const result = await pool.query(`
      UPDATE doctors SET
        full_name = $1, name = $1, specialization = $2, department = $2,
        phone = $3, consultation_fee = $4, opd_fee = $4, avatar_url = $5,
        qualification = $6, experience_years = $7, nmc_no = $8, room = $9,
        followup_fee = $10, shift_timings = $11, updated_at = NOW()
      WHERE id = $12 AND provider_id = $13 AND status <> 'deleted'
      RETURNING id, provider_id, full_name AS name, avatar_url, qualification,
        COALESCE(department, specialization) AS department, experience_years, nmc_no, room,
        COALESCE(opd_fee, consultation_fee, 0) AS opd_fee, followup_fee, shift_timings, status`,
      [name, b.department || null, b.phone || null, opdFee, b.avatar_url || null,
        b.qualification || null, experience, b.nmc_no || null, b.room || null,
        followupFee, b.shift_timings || null, req.params.id, req.providerId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Doctor not found.' });
    res.json({ success: true, doctor: result.rows[0] });
  } catch (err) {
    console.error('Doctor update failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not update doctor.' });
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
        gallery_images = COALESCE($13::jsonb, gallery_images),
        updated_at = NOW()
      WHERE id = $12 RETURNING *`, [
      b.name, b.phone, b.description, b.logo_url, b.cover_image_url,
      b.address || b.address_line, b.city, b.state, b.pincode, b.upi_id,
null, req.providerId,
Array.isArray(b.gallery_images) ? JSON.stringify(b.gallery_images) : null
    ]);
    const c = await getCompleteness(pool, req.providerId);
    return res.json({ success: true, provider: result.rows[0], profile_completion_pct: c.percent, missing: c.missing });
  } catch (err) {
    console.error('Provider profile update failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not save provider profile.' });
  }
});

// Queue actions: ab asli appointments par chalte hain (pehle ye client ka bheja JSON hi save kar deta tha)
router.post('/queue/:action', async (req, res) => {
  const action = req.params.action;
  if (!['call-next', 'done', 'skip'].includes(action)) return res.status(400).json({ success: false, error: 'Unknown queue action.' });
  const doctorId = req.body && req.body.doctor_id ? Number(req.body.doctor_id) : null;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const today = flow.todayTz();
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`queue:${req.providerId}:${doctorId || 0}:${today}`]);
    const filter = doctorId ? 'AND doctor_id = $3' : '';
    const params = doctorId ? [req.providerId, today, doctorId] : [req.providerId, today];
    const serving = (await client.query(`SELECT * FROM provider_appointments WHERE provider_id = $1 AND appointment_date = $2::date
      AND status = 'in_progress' ${filter} ORDER BY started_at DESC NULLS LAST LIMIT 1 FOR UPDATE`, params)).rows[0];
    let row;
    if (action === 'call-next') {
      if (serving) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'A patient is already in consultation. Complete or skip first.' }); }
      const next = (await client.query(`SELECT * FROM provider_appointments WHERE provider_id = $1 AND appointment_date = $2::date
        AND status IN ('confirmed','waiting','checked_in','arrived')
AND COALESCE(arrival_status, 'not_requested') <> 'pending'
${filter}
ORDER BY token_no NULLS LAST, created_at
LIMIT 1 FOR UPDATE`, params)).rows[0];
      if (!next) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'No accepted patient is waiting.' }); }
      row = await flow.changeStatus(client, next, 'in_progress', {});
    } else {
      if (!serving) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'No patient is currently in consultation.' }); }
      row = await flow.changeStatus(client, serving, action === 'done' ? 'completed' : 'checked_in', {});
    }
    await client.query('COMMIT');
    res.json({ success: true, appointment: row });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    console.error('Queue action failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not update the queue.' });
  } finally { if (client) client.release(); }
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
      INSERT INTO services(provider_id, name, description, category, department, price, duration_min, code, status, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',TRUE) RETURNING *`, [
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
  const price = Number(b.price);
  const duration = Number(b.duration_min);
  if (!name) return res.status(400).json({ success: false, error: 'Service name is required.' });
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(duration) || duration < 1) {
    return res.status(400).json({ success: false, error: 'Enter a valid service price and duration.' });
  }
  try {
    const result = await pool.query(`
      UPDATE services SET name = $1, description = $2, category = $3, department = $4,
        price = $5, duration_min = $6, updated_at = NOW()
      WHERE id = $7 AND provider_id = $8 AND status <> 'deleted'
      RETURNING id, provider_id, name, description, category, department, price,
        duration_min, code, status, is_active, created_at`,
      [name, b.description || null, b.category || null, b.department || null,
        price, duration, req.params.id, req.providerId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Service not found.' });
    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    console.error('Service update failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not update service.' });
  }
});

router.get('/reports/export-csv', async (req, res) => {
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if ((from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)) {
    return res.status(400).json({ success: false, error: 'Enter a valid report date range.' });
  }
  const csvCell = (value) => {
    let text = value == null ? '' : String(value);
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  try {
    const values = [req.providerId];
    const clauses = ['provider_id = $1'];
    if (from) {
      values.push(from);
      clauses.push(`appointment_date >= $${values.length}::date`);
    }
    if (to) {
      values.push(to);
      clauses.push(`appointment_date <= $${values.length}::date`);
    }
    const result = await pool.query(`
      SELECT booking_ref, patient_id, visit_id, patient_name, patient_phone, patient_email,
        appointment_date, slot_time, doctor, service_name, source, consultation_type,
        status, payment_status, payment_method, fee, token, room, created_at
      FROM provider_appointments
      WHERE ${clauses.join(' AND ')}
      ORDER BY appointment_date DESC, slot_time DESC, created_at DESC`, values);
    const columns = [
      'Booking ID', 'PID', 'Visit ID', 'Patient', 'Phone', 'Email', 'Appointment Date',
      'Time', 'Doctor', 'Service', 'Source', 'Consultation Type', 'Status',
      'Payment Status', 'Payment Method', 'Fee (INR)', 'Token', 'Room', 'Created At'
    ];
    const records = result.rows.map((row) => [
      row.booking_ref, row.patient_id, row.visit_id, row.patient_name, row.patient_phone,
      row.patient_email, row.appointment_date, row.slot_time, row.doctor, row.service_name,
      row.source, row.consultation_type, row.status, row.payment_status, row.payment_method,
      row.fee, row.token, row.room, row.created_at
    ]);
    const csv = [columns, ...records].map((record) => record.map(csvCell).join(',')).join('\r\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="saino-provider-appointments.csv"',
      'Cache-Control': 'no-store'
    });
    res.send(`\uFEFF${csv}`);
  } catch (err) {
    console.error('Provider report export failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not export appointment report.' });
  }
});

// Provider confirms a patient's arrival request
router.patch('/appointments/:id/confirm-arrival', async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT *
       FROM provider_appointments
       WHERE id = $1 AND provider_id = $2
       LIMIT 1
       FOR UPDATE`,
      [req.params.id, req.providerId]
    );

    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Appointment not found.'
      });
    }

    const appointment = result.rows[0];

    if (
      appointment.arrival_status !== 'pending' ||
      String(appointment.status).toLowerCase() !== 'confirmed'
    ) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'There is no pending arrival request for this appointment.'
      });
    }

    // Reuse existing booking flow for check-in and patient notification
    const updated = await flow.changeStatus(
      client,
      appointment,
      'checked_in',
      {}
    );

    await client.query(
      `UPDATE provider_appointments
       SET arrival_status = 'confirmed',
           arrival_reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [appointment.id]
    );

    // Mark arrival-request notifications as handled
    await client.query(
      `UPDATE provider_notifications
       SET is_read = TRUE
       WHERE provider_id = $1
         AND appointment_id = $2
         AND title = 'Patient Arrival Request'
         AND is_read = FALSE`,
      [req.providerId, appointment.id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Patient arrival confirmed successfully.',
      appointment: {
        ...updated,
        arrival_status: 'confirmed'
      }
    });

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Confirm arrival failed:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Could not confirm patient arrival.'
    });

  } finally {
    if (client) client.release();
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
    let token = b.token ? String(b.token) : null;
    let tokenNo = null;
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
    const appointmentDate = String(b.appointment_date || b.date || '').trim() || flow.todayTz();
    const slotTime = String(b.slot_time || b.time || '').trim() || null;
    if (await flow.lockAppointmentSlot(client, req.providerId, doctorId, appointmentDate, slotTime)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'This doctor already has an appointment at the selected date and time.' });
    }
    if (!token && ['waiting', 'checked_in', 'confirmed', 'in_progress'].includes(status)) {
      const t = await flow.nextToken(client, req.providerId, appointmentDate);
      token = t.token; tokenNo = t.token_no;
    }
    const consultationType = String(b.consultation_type || (source === 'telemedicine' ? 'video' : 'in_person')).toLowerCase() === 'video' ? 'video' : 'in_person';
    const fee = b.fee === undefined || b.fee === null || b.fee === '' ? 0 : Math.max(0, Number(b.fee) || 0);
    const result = await client.query(`
      
      INSERT INTO provider_appointments(
        provider_id, booking_ref, token, patient_id, patient_name, patient_phone, patient_email,
        doctor_id, doctor, room, service_id, service_name, source, slot_time, fee, status,
        appointment_date, consultation_type, payment_status, payment_method, reason,
        checked_in_at, updated_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
        CASE WHEN $22::boolean THEN NOW() ELSE NULL END, NOW()) RETURNING *`, [
      req.providerId, bookingRef, token, patientRow.pid, patientName, phone || null, email || null,
      doctorId, b.doctor || null, b.room || null, serviceId, serviceName || null, source,
      slotTime, fee, status, appointmentDate, consultationType,
      String(b.payment_status || 'pending'), b.payment_method || null, b.reason || b.notes || null,
      ['checked_in', 'in_progress', 'completed'].includes(status)
    ]);
    if (tokenNo !== null) await client.query('UPDATE provider_appointments SET token_no = $1 WHERE id = $2', [tokenNo, result.rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, appointment: { ...result.rows[0], token_no: tokenNo }, rows: [result.rows[0]], patient: { pid: patientRow.pid } });
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
    const result = await pool.query(`INSERT INTO provider_staff(provider_id, name, email, role) VALUES($1,$2,$3,$4) RETURNING *`, [
      req.providerId, String(b.name).trim(), b.email || null, b.role || 'Receptionist'
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
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Lock this provider while checking/creating its main QR.
    const providerResult = await client.query(
      `SELECT id, verification_status, is_published
       FROM providers
       WHERE id = $1
       FOR UPDATE`,
      [req.providerId]
    );

    const provider = providerResult.rows[0];

    if (
      !provider ||
      provider.verification_status !== 'verified' ||
      provider.is_published !== true
    ) {
      await client.query('ROLLBACK');

      return res.status(403).json({
        success: false,
        error: 'Only verified and published providers can generate a booking QR.'
      });
    }

    // Reuse the existing main booking QR.
    const existing = await client.query(
      `SELECT *
       FROM provider_qr_codes
       WHERE provider_id = $1
         AND label = 'Booking QR'
       ORDER BY created_at ASC
       LIMIT 1`,
      [req.providerId]
    );

    if (existing.rowCount) {
      await client.query('COMMIT');

      return res.json({
        success: true,
        already_exists: true,
        qr: existing.rows[0]
      });
    }

    const code = makePublicId('QR');

    const result = await client.query(
      `INSERT INTO provider_qr_codes
       (provider_id, code, label, branch_name, destination_url, created_by)
       VALUES ($1, $2, 'Booking QR', NULL, $3, $4)
       RETURNING *`,
      [
        req.providerId,
        code,
        `/qr/${code}`,
        req.providerUserId
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      already_exists: false,
      qr: result.rows[0]
    });

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Provider QR create failed:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Could not create booking QR.'
    });

  } finally {
    if (client) client.release();
  }
});

router.patch('/qr/:id/status', async (req, res) => {
  const status = String((req.body || {}).status || '').toLowerCase();

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be active or disabled.'
    });
  }

  try {
    const result = await pool.query(`
      UPDATE provider_qr_codes q
      SET status = $1::text,
          updated_at = NOW()
      FROM providers p
      WHERE q.id = $2
        AND q.provider_id = $3
        AND p.id = q.provider_id
        AND (
          $1::text = 'disabled'
          OR (
            p.verification_status = 'verified'
            AND p.is_published = TRUE
            AND LOWER(COALESCE(p.status, 'active'))
                NOT IN ('suspended', 'rejected', 'inactive')
          )
        )
      RETURNING q.*
    `, [status, req.params.id, req.providerId]);

    if (!result.rowCount) {
      return res.status(403).json({
        success: false,
        error: 'QR not found or provider is not approved for activation.'
      });
    }

    return res.json({
      success: true,
      qr: result.rows[0]
    });

  } catch (err) {
    console.error('Provider QR status update failed:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Could not update QR status.'
    });
  }
});
// Update an appointment: accept (token milta hai), decline (reason), check in, start, complete, cancel, no-show.

router.patch('/appointments/:id', async (req, res) => {
  const b = req.body || {};
  const statusMap = {
    pending: 'pending', confirmed: 'confirmed', checked_in: 'checked_in', waiting: 'waiting',
    in_progress: 'in_progress', completed: 'completed', cancelled: 'cancelled', 'no-show': 'no_show', no_show: 'no_show'
  };
  const action = String(b.action || '').toLowerCase();
  let requested = String(b.status || '').toLowerCase();
  if (action === 'accept') requested = 'confirmed';
  if (action === 'decline') requested = 'cancelled';
  if (requested && !statusMap[requested]) return res.status(400).json({ success: false, error: 'Unsupported appointment status.' });
  if (action === 'decline' && !String(b.reason || '').trim()) return res.status(400).json({ success: false, error: 'Please give a reason for declining.' });
  let client; let refundTarget = null; let row;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM provider_appointments WHERE id = $1 AND provider_id = $2 LIMIT 1 FOR UPDATE', [req.params.id, req.providerId]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Appointment not found.' }); }
    const prior = current.rows[0];
    const priorStatus = String(prior.status || '').trim().toLowerCase();
    // Arrival request cancellation requires a reason
if (
  prior.arrival_status === 'pending' &&
  requested === 'cancelled' &&
  !String(b.reason || '').trim()
) {
  await client.query('ROLLBACK');

  return res.status(400).json({
    success: false,
    error: 'Please provide a cancellation reason for this arrival request.'
  });
}
    const next = statusMap[requested] || priorStatus;
    if (priorStatus === 'pending_payment' && ['confirmed', 'waiting', 'checked_in', 'in_progress', 'completed'].includes(next)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'The patient has not completed the online payment yet, so this request cannot be accepted.' });
    }
    row = await flow.changeStatus(client, prior, next, {
      room: b.room, eta: b.eta_minutes === undefined || b.eta_minutes === '' || b.eta_minutes === null ? null : Math.max(0, Number(b.eta_minutes)),
      paymentStatus: b.payment_status, reason: b.reason
    });
    // Close pending arrival request when appointment is cancelled
if (
  next === 'cancelled' &&
  priorStatus !== 'cancelled' &&
  prior.arrival_status === 'pending'
) {
  await client.query(
    `UPDATE provider_appointments
     SET arrival_status = 'cancelled',
         arrival_reviewed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [prior.id]
  );

  await client.query(
    `UPDATE provider_notifications
     SET is_read = TRUE
     WHERE provider_id = $1
       AND appointment_id = $2
       AND title = 'Patient Arrival Request'`,
    [req.providerId, prior.id]
  );
}
    if (next === 'cancelled' && priorStatus !== 'cancelled' && prior.payment_method === 'online' && prior.payment_status === 'paid' && prior.razorpay_payment_id) {
      refundTarget = { paymentId: prior.razorpay_payment_id, amount: Number(prior.amount_paid || prior.fee || 0), ref: prior.booking_ref, providerId: prior.provider_id, patient: prior.patient_name };
    }
   
    // Create notification only when appointment status changes
    if (priorStatus !== next) {
      const title = next === 'confirmed'
        ? 'Appointment Confirmed'
        : next === 'cancelled'
          ? 'Appointment Declined / Cancelled'
          : 'Appointment Status Updated';

      await client.query(
        `INSERT INTO provider_notifications
         (provider_id, appointment_id, title, message)
         VALUES ($1, $2, $3, $4)`,
        [
          req.providerId,
          prior.id,
          title,
          `Booking ${prior.booking_ref} (${prior.patient_name}): ${priorStatus} → ${next}`
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {

    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    console.error('Appointment update failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not update appointment.' });
  } finally { if (client) client.release(); }

  // Online paid booking decline hui to automatic refund (fail ho to admin ko manual action ke liye alert)
  if (refundTarget) {
    try {
      await razorpay.refund(refundTarget.paymentId, Math.round(refundTarget.amount * 100));
      await pool.query(`UPDATE provider_appointments SET payment_status = 'refunded', updated_at = NOW() WHERE id = $1`, [req.params.id]);
      await flow.notify(pool, refundTarget.ref, 'refund', 'Refund initiated', 'Your online payment is being refunded to the original payment method. It usually takes 5-7 working days.');
      row = { ...row, payment_status: 'refunded' };
    } catch (e) {
      console.error('Auto refund failed:', e.message);
      await pool.query(`UPDATE provider_appointments SET payment_status = 'refund_pending', updated_at = NOW() WHERE id = $1`, [req.params.id]);
      await pool.query(`INSERT INTO admin_notifications(title, message, provider_id) VALUES($1,$2,$3)`,
        ['Manual refund needed', `Booking ${refundTarget.ref} (${refundTarget.patient}) was declined after online payment but the automatic refund failed. Refund it from the Razorpay dashboard.`, refundTarget.providerId]);
      row = { ...row, payment_status: 'refund_pending' };
    }
  }
  res.json({ success: true, appointment: row });
});

module.exports = router;
router.ensureTables = initTables;
