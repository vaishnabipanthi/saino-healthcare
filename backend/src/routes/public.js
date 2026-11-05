const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const providerRouter = require('./provider');
const razorpay = require('../services/razorpay');
const bookingFlow = require('../services/bookingFlow');
const router = express.Router();

const ensureTables = providerRouter.ensureTables || (async () => {});
const id = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
const getText = (obj, ...keys) => {
  for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') return String(obj[key]);
  return '';
};
const safeNumber = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const asId = (v) => (/^\d+$/.test(String(v ?? '').trim()) ? Number(v) : null);
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const jwtSecret = () => {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) { const err = new Error('Patient authentication is not configured.'); err.status = 503; throw err; }
  return secret;
};
async function ensureProviderLikesTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS provider_likes (
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    visitor_id VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(provider_id, visitor_id)
  )`);
}
const patientAuth = async (req, res, next) => {
  try {
    await ensureTables();
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ success: false, error: 'Verify your email or phone with OTP to continue.' });
    const claims = jwt.verify(match[1], jwtSecret(), { issuer: 'saino-health-patient' });
    if (claims.role !== 'patient' || !claims.patientId || !claims.pid) throw new Error('Invalid patient token');
    req.patient = claims;
    return next();
  } catch (_) { return res.status(401).json({ success: false, error: 'Your patient session expired. Verify OTP again.' }); }
};
async function ensureOtpTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS patient_otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), channel TEXT NOT NULL CHECK (channel IN ('email','phone')),
    destination TEXT NOT NULL, code_hash TEXT NOT NULL, full_name TEXT NOT NULL DEFAULT 'Patient',
    phone TEXT, email TEXT, expires_at TIMESTAMPTZ NOT NULL, attempts INT NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query('CREATE INDEX IF NOT EXISTS patient_otp_destination_created ON patient_otp_challenges(destination, created_at DESC)');
}
const otpHash = (idValue, code) => crypto.createHash('sha256').update(`${idValue}:${code}:${process.env.JWT_SECRET}`).digest('hex');
function localDevelopmentOtpAllowed(req) {
  if (process.env.OTP_DEV_MODE !== 'true' || process.env.NODE_ENV === 'production') return false;
  const address = String(req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '');
  return address === '127.0.0.1' || address === '::1';
}
async function deliverOtp(channel, destination, code, req) {
  const message = `Your SAINO verification code is ${code}. It expires in 5 minutes.`;
  if (channel === 'email') {
    if (!process.env.RESEND_API_KEY || !process.env.OTP_FROM_EMAIL) {
      if (localDevelopmentOtpAllowed(req)) return { development_code: code };
      const e = new Error('Email OTP is not configured. Set RESEND_API_KEY and OTP_FROM_EMAIL in backend/.env.'); e.status = 503; throw e;
    }
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.OTP_FROM_EMAIL, to: [destination], subject: 'Your SAINO verification code', text: message }) });
    if (!response.ok) { const e = new Error('Email OTP delivery failed. Please try again.'); e.status = 502; throw e; }
    return {};
  }
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!authKey || !templateId) {
    if (localDevelopmentOtpAllowed(req)) return { development_code: code };
    const e = new Error('SMS OTP is not configured. Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID in backend/.env.'); e.status = 503; throw e;
  }
  const mobile = destination.replace(/\D/g, '');
  const response = await fetch('https://control.msg91.com/api/v5/flow', { method: 'POST', headers: { authkey: authKey, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ template_id: templateId, recipients: [{ mobiles: mobile, VAR1: code, VAR2: '5 minutes' }] }) });
  if (!response.ok) { const e = new Error('SMS OTP delivery failed. Please try again.'); e.status = 502; throw e; }
}

/* PATIENT PASSWORD AUTH — REGISTER + LOGIN */

function patientLoginIdentifier(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return { email: raw, phone: null };
  }

  const phone = raw.replace(/[\s()-]/g, '');

  if (/^\d{10}$/.test(phone)) {
    return { email: null, phone: '+91' + phone };
  }

  if (/^91\d{10}$/.test(phone)) {
    return { email: null, phone: '+' + phone };
  }

  if (/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { email: null, phone };
  }

  return null;
}

function patientPasswordSession(patient) {
  const token = jwt.sign(
    {
      role: 'patient',
      patientId: String(patient.id),
      pid: String(patient.pid),
      name: patient.full_name,
      phone: patient.phone || '',
      email: patient.email || ''
    },
    jwtSecret(),
    {
      expiresIn: '30d',
      issuer: 'saino-health-patient'
    }
  );

  return {
    success: true,
    token,
    patient: {
      id: patient.pid,
      name: patient.full_name,
      phone: patient.phone || '',
      email: patient.email || ''
    }
  };
}

// REGISTER
router.post('/auth/register', async (req, res) => {
  try {
    await ensureTables();

    const identifier = patientLoginIdentifier(req.body?.identifier);
    const fullName = String(req.body?.full_name || '').trim();
    const password = String(req.body?.password || '');

    if (!identifier || !fullName || fullName.length > 200 ||
        password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        error: 'Enter a valid name, email/phone and password (8–128 characters).'
      });
    }

    const existing = await pool.query(
      `SELECT id FROM patient_profiles
       WHERE ${identifier.email ? 'LOWER(email) = $1' : 'phone = $1'}
       LIMIT 1`,
      [identifier.email || identifier.phone]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        error: 'This patient profile already exists. Please contact support for secure account setup or recovery.'
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const pid = id('PID');

    const result = await pool.query(
      `INSERT INTO patient_profiles
       (pid, full_name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, pid, full_name, phone, email`,
      [
        pid,
        fullName,
        identifier.phone,
        identifier.email,
        hash
      ]
    );

    return res.status(201).json(
      patientPasswordSession(result.rows[0])
    );

  } catch (err) {
    console.error('Patient register error:', err.message);

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'This patient profile already exists.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Registration failed.'
    });
  }
});

// LOGIN
router.post('/auth/login', async (req, res) => {
  try {
    await ensureTables();

    const identifier = patientLoginIdentifier(req.body?.identifier);
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Enter your email/phone and password.'
      });
    }

    const result = await pool.query(
      `SELECT id, pid, full_name, phone, email, password_hash
       FROM patient_profiles
       WHERE ${identifier.email ? 'LOWER(email) = $1' : 'phone = $1'}
       LIMIT 1`,
      [identifier.email || identifier.phone]
    );

    const patient = result.rows[0];

    if (!patient || !patient.password_hash ||
        !(await bcrypt.compare(password, patient.password_hash))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or password not set. Contact support for secure account recovery.'
      });
    }

    return res.json(patientPasswordSession(patient));

  } catch (err) {
    console.error('Patient login error:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Login failed.'
    });
  }
});

router.post('/auth/otp/send', async (req, res) => {
  try {
    await ensureTables(); await ensureOtpTable();
    jwtSecret();
    const channel = String(req.body?.channel || '').toLowerCase();
    const destination = String(req.body?.destination || '').trim().toLowerCase();
    const fullName = String(req.body?.full_name || '').trim().slice(0, 160) || 'Patient';
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!['email','phone'].includes(channel)) return res.status(400).json({ success: false, error: 'Choose email or phone for OTP.' });
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    let destinationNormalized = destination;
    if (channel === 'phone') {
      const compact = destination.replace(/[\s()-]/g, '');
      if (!/^\+?\d{8,15}$/.test(compact)) return res.status(400).json({ success: false, error: 'Enter a valid phone number with country code.' });
      destinationNormalized = /^\d{10}$/.test(compact) ? `+91${compact}` : compact.startsWith('91') && compact.length === 12 ? `+${compact}` : compact;
    }
    const recent = await pool.query(`SELECT COUNT(*)::int AS n FROM patient_otp_challenges WHERE destination=$1 AND created_at > NOW()-INTERVAL '15 minutes'`, [destinationNormalized]);
    if (recent.rows[0].n >= 5) return res.status(429).json({ success: false, error: 'Too many OTP requests. Please wait and try again.' });
    await pool.query('UPDATE patient_otp_challenges SET consumed_at=NOW() WHERE destination=$1 AND consumed_at IS NULL', [destinationNormalized]);
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const rawPhone = (phone || (channel === 'phone' ? destinationNormalized : '')).replace(/[\s()-]/g, '');
    const storedPhone = rawPhone ? (/^\d{10}$/.test(rawPhone) ? `+91${rawPhone}` : rawPhone.startsWith('91') && rawPhone.length === 12 ? `+${rawPhone}` : rawPhone) : '';
    const inserted = await pool.query(`INSERT INTO patient_otp_challenges(channel,destination,code_hash,full_name,phone,email,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '5 minutes') RETURNING id`, [channel, destinationNormalized, otpHash('pending', otp), fullName, storedPhone, email || (channel === 'email' ? destinationNormalized : '')]);
    const challengeId = inserted.rows[0].id;
    await pool.query('UPDATE patient_otp_challenges SET code_hash=$1 WHERE id=$2', [otpHash(challengeId, otp), challengeId]);
    let delivery;
    try { delivery = await deliverOtp(channel, destinationNormalized, otp, req); }
    catch (error) { await pool.query('DELETE FROM patient_otp_challenges WHERE id=$1', [challengeId]); throw error; }
    res.json({ success: true, challenge_id: challengeId,
      message: delivery?.development_code ? 'Local development OTP generated. Do not use this mode in production.' : `OTP sent to your ${channel}.`,
      ...(delivery?.development_code ? { development_code: delivery.development_code } : {}) });
  } catch (err) { res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'OTP could not be sent right now.' }); }
});

router.post('/auth/otp/verify', async (req, res) => {
  let client;
  try {
    await ensureTables(); await ensureOtpTable();
    const challengeId = String(req.body?.challenge_id || '');
    const code = String(req.body?.code || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(code)) return res.status(400).json({ success: false, error: 'Enter the 6-digit OTP.' });
    client = await pool.connect(); await client.query('BEGIN');
    const found = await client.query('SELECT * FROM patient_otp_challenges WHERE id=$1 AND consumed_at IS NULL AND expires_at > NOW() FOR UPDATE', [challengeId]);
    if (!found.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'OTP expired. Request a new code.' }); }
    const challenge = found.rows[0];
    if (challenge.attempts >= 5) { await client.query('ROLLBACK'); return res.status(429).json({ success: false, error: 'Too many attempts. Request a new OTP.' }); }
    if (challenge.code_hash !== otpHash(challenge.id, code)) {
      await client.query('UPDATE patient_otp_challenges SET attempts=attempts+1 WHERE id=$1', [challenge.id]); await client.query('COMMIT');
      return res.status(400).json({ success: false, error: 'That OTP is incorrect.' });
    }
    await client.query('UPDATE patient_otp_challenges SET consumed_at=NOW() WHERE id=$1', [challenge.id]);
    let patient;
    if (challenge.email) {
      const foundPatient = await client.query('SELECT * FROM patient_profiles WHERE LOWER(email)=$1 LIMIT 1', [challenge.email]); patient = foundPatient.rows[0];
    }
    if (!patient && challenge.phone) {
      const foundPatient = await client.query('SELECT * FROM patient_profiles WHERE phone=$1 ORDER BY created_at ASC LIMIT 1', [challenge.phone]); patient = foundPatient.rows[0];
    }
    if (patient) {
      const updated = await client.query(`UPDATE patient_profiles SET full_name=CASE WHEN $1='Patient' THEN full_name ELSE $1 END,
        phone=COALESCE(NULLIF($2,''),phone), email=COALESCE(NULLIF($3,''),email), updated_at=NOW() WHERE id=$4 RETURNING *`, [challenge.full_name, challenge.phone, challenge.email, patient.id]); patient = updated.rows[0];
    } else {
      const created = await client.query('INSERT INTO patient_profiles(pid,full_name,phone,email) VALUES($1,$2,$3,$4) RETURNING *', [id('PID'), challenge.full_name, challenge.phone || null, challenge.email || null]); patient = created.rows[0];
    }
    await client.query('COMMIT');
    const token = jwt.sign({ role: 'patient', patientId: String(patient.id), pid: String(patient.pid), name: patient.full_name, phone: patient.phone || '', email: patient.email || '', verifiedChannel: challenge.channel, verifiedDestination: challenge.destination }, jwtSecret(), { expiresIn: '30d', issuer: 'saino-health-patient' });
    res.json({ success: true, token, patient: { id: patient.pid, name: patient.full_name, phone: patient.phone || '', email: patient.email || '' } });
  } catch (err) { if (client) await client.query('ROLLBACK').catch(() => {}); res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'OTP verification failed.' }); }
  finally { if (client) client.release(); }
});

async function loadPublishedProviders(providerId = null) {
  await ensureTables();
  await ensureProviderLikesTable();
  const params = [];
  let idWhere = '';
  if (providerId !== null) { params.push(String(providerId)); idWhere = `AND p.id::text = $${params.length}`; }
  const providersRes = await pool.query(`
    SELECT to_jsonb(p) AS raw
    FROM providers p
    WHERE LOWER(COALESCE(to_jsonb(p)->>'verification_status','')) = 'verified'
      AND COALESCE(to_jsonb(p)->>'is_published','false') = 'true'
      AND LOWER(COALESCE(to_jsonb(p)->>'status','active')) NOT IN ('suspended','rejected','inactive')
      ${idWhere}
    ORDER BY COALESCE(to_jsonb(p)->>'updated_at', to_jsonb(p)->>'created_at','') DESC`, params);
  if (!providersRes.rows.length) return [];

  const raws = providersRes.rows.map(r => r.raw);
  const providerIds = raws.map(raw => String(raw.id));
  const [doctorsRes, servicesRes, reviewsRes, staffRes, likesRes] = await Promise.all([
    pool.query(`SELECT to_jsonb(d) AS raw FROM doctors d WHERE to_jsonb(d)->>'provider_id' = ANY($1::text[]) AND COALESCE((to_jsonb(d)->>'is_public')::boolean, FALSE) AND COALESCE((to_jsonb(d)->>'is_active')::boolean, TRUE)
      AND COALESCE(to_jsonb(d)->>'is_active','true') <> 'false' AND LOWER(COALESCE(to_jsonb(d)->>'status','active')) <> 'deleted'
      ORDER BY COALESCE(to_jsonb(d)->>'id','')`, [providerIds]),
    pool.query(`SELECT to_jsonb(s) AS raw FROM services s WHERE to_jsonb(s)->>'provider_id' = ANY($1::text[]) AND COALESCE((to_jsonb(s)->>'is_public')::boolean, FALSE) AND COALESCE((to_jsonb(s)->>'is_active')::boolean, TRUE)
      AND COALESCE(to_jsonb(s)->>'is_active','true') <> 'false' AND LOWER(COALESCE(to_jsonb(s)->>'status','active')) <> 'deleted'
      ORDER BY COALESCE(to_jsonb(s)->>'id','')`, [providerIds]),
    pool.query(`SELECT to_jsonb(r) AS raw FROM reviews r WHERE COALESCE(to_jsonb(r)->>'is_hidden','false') <> 'true'
      ORDER BY COALESCE(to_jsonb(r)->>'created_at', to_jsonb(r)->>'date','') DESC LIMIT 500`, []),
    pool.query(`SELECT id, provider_id, name, role, avatar_url FROM provider_staff
      WHERE provider_id::text = ANY($1::text[]) AND status <> 'deleted'
        AND LOWER(role) IN ('nurse','nursing staff') ORDER BY id`, [providerIds]),
    pool.query(`SELECT provider_id::text, COUNT(*)::int AS likes_count FROM provider_likes
      WHERE provider_id::text = ANY($1::text[]) GROUP BY provider_id`, [providerIds])
  ]);
  const likesByProvider = new Map(likesRes.rows.map(row => [String(row.provider_id), Number(row.likes_count || 0)]));
  const groupByProvider = (rows) => {
    const grouped = new Map();
    for (const row of rows) {
      const raw = row.raw;
      const pid = String(raw.provider_id || raw.hospital_id || '');
      if (!grouped.has(pid)) grouped.set(pid, []);
      grouped.get(pid).push(raw);
    }
    return grouped;
  };
  const doctorsByProvider = groupByProvider(doctorsRes.rows);
  const servicesByProvider = groupByProvider(servicesRes.rows);
  const reviewsByProvider = groupByProvider(reviewsRes.rows);
  const staffByProvider = new Map();
  for (const member of staffRes.rows) {
    const pid = String(member.provider_id);
    if (!staffByProvider.has(pid)) staffByProvider.set(pid, []);
    staffByProvider.get(pid).push(member);
  }

  return raws.map(raw => {
    const pid = String(raw.id);
    const doctors = (doctorsByProvider.get(pid) || []).map(d => ({
      id: d.id, name: getText(d, 'full_name', 'name', 'doctor_name'),
      qualification: getText(d, 'qualification', 'degree'),
      department: getText(d, 'department', 'specialization'), experience_years: safeNumber(d.experience_years),
      avatar_url: getText(d, 'avatar_url', 'image_url', 'photo_url'),
      opd_fee: d.opd_fee == null && d.consultation_fee == null && d.fee == null ? null : safeNumber(d.opd_fee ?? d.consultation_fee ?? d.fee),
      fee: d.opd_fee == null && d.consultation_fee == null && d.fee == null ? null : safeNumber(d.opd_fee ?? d.consultation_fee ?? d.fee),
      room: getText(d, 'room'), shift_timings: getText(d, 'shift_timings', 'timings'),
      nmc_no: getText(d, 'nmc_no', 'license_number'), status: getText(d, 'status') || 'active'
    })).filter(d => d.name);
    const careTeam = (staffByProvider.get(pid) || []).map(member => ({
      id: member.id, name: String(member.name || ''), role: String(member.role || 'Nurse'), avatar_url: member.avatar_url || ''
    })).filter(member => member.name);
    const services = (servicesByProvider.get(pid) || []).map(s => ({
      id: s.id, name: getText(s, 'name', 'service_name'),
      description: getText(s, 'description'), category: getText(s, 'category'),
      department: getText(s, 'department'),
      price: s.price == null && s.fee == null ? null : safeNumber(s.price ?? s.fee),
      fee: s.price == null && s.fee == null ? null : safeNumber(s.price ?? s.fee),
      duration_min: safeNumber(s.duration_min), status: getText(s, 'status') || 'active'
    })).filter(s => s.name);
    const reviews = (reviewsByProvider.get(pid) || []).map(r => ({
      id: r.id, rating: safeNumber(r.rating || r.stars),
      comment: getText(r, 'comment', 'review', 'feedback'),
      user: getText(r, 'patient_name', 'patient', 'user_name') || 'Patient',
      date: getText(r, 'created_at', 'date'),
verified_visit: r.is_verified === true
    })).filter(r => r.comment || r.rating);
    const category = getText(raw, 'category', 'provider_type') || 'hospital';
    const firstDoctor = doctors[0] || {};
    const image = getText(raw, 'cover_image_url', 'image_url', 'image', 'photo_url');
    const logo = getText(raw, 'logo_url', 'logo', 'image_url');
    const address = getText(raw, 'address', 'address_line', 'location');
    const city = getText(raw, 'city', 'district', 'province');
    const rating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : raw.rating === undefined ? 0 : safeNumber(raw.rating);
    const reviewsCount = reviews.length || safeNumber(raw.reviews_count || raw.review_count);
    const departments = [...new Set([
      ...doctors.map(d => d.department), ...services.map(s => s.department || s.category)
    ].filter(Boolean))];
    return {
      ...raw, id: String(raw.id), name: getText(raw, 'name') || 'Healthcare Provider', category,
      provider_type: category, verification_status: getText(raw, 'verification_status') || 'pending',
verified: getText(raw, 'verification_status').toLowerCase() === 'verified',
      plan: getText(raw, 'plan') || 'Listed', badgeLabel: getText(raw, 'plan') || 'Saino Verified',
      rating, reviewsCount, reviews_count: reviewsCount, reviews, likesCount: likesByProvider.get(String(raw.id)) || 0, interestedCount: 0,
      address, location: address, city, area: getText(raw, 'district', 'province'),
      phone: getText(raw, 'phone'), email: getText(raw, 'email'), website: getText(raw, 'website', 'website_url'),
      about: getText(raw, 'about', 'description'), description: getText(raw, 'description', 'about'),
      image: image || logo || '', cover_image_url: image || '', logo, logo_url: logo,
      openingHours: getText(raw, 'opening_hours', 'hours_open'),
      leadDoctor: firstDoctor.name || '', leadDoctorRole: firstDoctor.department || '', leadDoctorImage: firstDoctor.avatar_url || '',
      departments, doctors, careTeam, services, availability: doctors.map(d => ({ doctor: d.name, day: 'Schedule on request', time: d.shift_timings || 'Not provided' })),
      photos: Array.isArray(raw.gallery_images) ? raw.gallery_images : []
    };
  });
}

router.get('/providers', async (_req, res) => {
  try {
    const providers = await loadPublishedProviders();
    res.json({ success: true, providers, count: providers.length });
  } catch (err) {
    console.error('Public provider list failed:', err.message);
    res.status(503).json({ success: false, error: 'Marketplace data could not be loaded from PostgreSQL.' });
  }
});

router.get('/provider-likes', async (req, res) => {
  try {
    await ensureProviderLikesTable();
    const visitorId = String(req.query.visitor_id || '').trim();
    if (!/^[a-zA-Z0-9_-]{16,80}$/.test(visitorId)) return res.status(400).json({ success: false, error: 'A valid visitor session is required.' });
    const result = await pool.query(`SELECT provider_id::text AS provider_id, COUNT(*)::int AS likes_count,
      BOOL_OR(visitor_id=$1) AS is_liked FROM provider_likes GROUP BY provider_id`, [visitorId]);
    res.json({ success: true, rows: result.rows });
  } catch (err) {
    console.error('Provider like state lookup failed:', err.message);
    res.status(503).json({ success: false, error: 'Like counts are unavailable.' });
  }
});

router.get('/providers/:id', async (req, res) => {
  try {
    const providers = await loadPublishedProviders(req.params.id);
    if (!providers.length) return res.status(404).json({ success: false, error: 'Provider is not published or was not found.' });
    res.json({ success: true, provider: providers[0] });
  } catch (err) {
    console.error('Public provider detail failed:', err.message);
    res.status(503).json({ success: false, error: 'Provider details are unavailable.' });
  }
});

router.get('/providers/:id/qr', async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(`SELECT q.id,q.code,q.label,q.branch_name,q.status,q.created_at
      FROM provider_qr_codes q JOIN providers p ON p.id=q.provider_id
      WHERE q.provider_id::text=$1
  AND q.status='active'
  AND q.label='Booking QR'
  AND p.verification_status='verified'
  AND p.is_published=TRUE
  AND LOWER(COALESCE(p.status, 'active'))
      NOT IN ('suspended', 'rejected', 'inactive')
ORDER BY q.created_at ASC
LIMIT 1;`, [String(req.params.id)]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'No active provider booking QR has been generated yet.' });
    const qr = result.rows[0];
    res.json({ success: true, qr, url: `/api/public/qr/${encodeURIComponent(qr.code)}` });
  } catch (err) {
    console.error('Public provider QR lookup failed:', err.message);
    res.status(503).json({ success: false, error: 'Provider booking QR is unavailable.' });
  }
});

router.post('/providers/:id/like', async (req, res) => {
  try {
    await ensureProviderLikesTable();
    const providerId = String(req.params.id);
    const visitorId = String((req.body || {}).visitor_id || '').trim();
    if (!/^\d+$/.test(providerId) || !/^[a-zA-Z0-9_-]{16,80}$/.test(visitorId)) {
      return res.status(400).json({ success: false, error: 'A valid provider and visitor session are required.' });
    }
    const exists = await pool.query(`SELECT 1 FROM providers WHERE id::text=$1 AND verification_status='verified' AND is_published=TRUE`, [providerId]);
    if (!exists.rowCount) return res.status(404).json({ success: false, error: 'Provider listing is unavailable.' });
    if ((req.body || {}).liked === true) {
      await pool.query('INSERT INTO provider_likes(provider_id,visitor_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [providerId, visitorId]);
    } else {
      await pool.query('DELETE FROM provider_likes WHERE provider_id=$1 AND visitor_id=$2', [providerId, visitorId]);
    }
    const count = await pool.query('SELECT COUNT(*)::int AS likes_count FROM provider_likes WHERE provider_id=$1', [providerId]);
    res.json({ success: true, liked: (req.body || {}).liked === true, likes_count: Number(count.rows[0].likes_count || 0) });
  } catch (err) {
    console.error('Provider like update failed:', err.message);
    res.status(503).json({ success: false, error: 'Like could not be saved.' });
  }
});

router.post('/providers/:id/reviews', patientAuth, async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    await ensureTables();

    const providerId = String(req.params.id || '');
    const bookingRef = String(req.body?.booking_ref || '').trim();
    const patientPid = String(req.patient?.pid || '').trim();
    const patientName = String(
      req.patient?.name || req.patient?.full_name || 'Patient'
    ).trim().slice(0, 200);

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!/^\d+$/.test(providerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider.'
      });
    }

    if (!patientPid) {
      return res.status(401).json({
        success: false,
        error: 'Please log in again.'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Choose a rating from 1 to 5.'
      });
    }

    if (!comment || comment.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Write a review of up to 2,000 characters.'
      });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const provider = await client.query(`
      SELECT id
      FROM providers
      WHERE id = $1
        AND verification_status = 'verified'
        AND is_published = TRUE
      LIMIT 1
    `, [providerId]);

    if (!provider.rowCount) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        error: 'Hospital not found.'
      });
    }

    let appointmentId = null;
    let isVerified = false;

    // Booking reference supplied = verified appointment review.
    if (bookingRef) {
      const appointment = await client.query(`
        SELECT a.id
        FROM provider_appointments a
        WHERE a.booking_ref = $1
          AND a.patient_id = $2
          AND a.provider_id = $3
          AND LOWER(a.status) = 'completed'
        LIMIT 1
        FOR UPDATE OF a
      `, [bookingRef, patientPid, providerId]);

      if (!appointment.rowCount) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(403).json({
          success: false,
          error: 'Only your completed appointment can be reviewed.'
        });
      }

      appointmentId = appointment.rows[0].id;
      isVerified = true;

      const existing = await client.query(`
        SELECT id
        FROM reviews
        WHERE appointment_id = $1
        LIMIT 1
      `, [appointmentId]);

      if (existing.rowCount) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          error: 'You have already reviewed this appointment.'
        });
      }
    }

    // No booking reference = direct, unverified review.
    // Patient identity always comes from authenticated session.
    const inserted = await client.query(`
      INSERT INTO reviews (
        provider_id,
        appointment_id,
        patient_pid,
        patient_name,
        rating,
        comment,
        is_verified,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING
        id,
        patient_name,
        rating,
        comment,
        is_verified,
        created_at
    `, [
      providerId,
      appointmentId,
      patientPid,
      patientName,
      rating,
      comment,
      isVerified
    ]);

    const summary = await client.query(`
      SELECT
        COUNT(*)::int AS count,
        ROUND(AVG(rating)::numeric, 1) AS average
      FROM reviews
      WHERE provider_id = $1
        AND COALESCE(is_hidden, FALSE) = FALSE
    `, [providerId]);

    await client.query('COMMIT');
    transactionStarted = false;

    const row = inserted.rows[0];

    return res.status(201).json({
      success: true,
      review: {
        id: row.id,
        patient_name: row.patient_name,
        user: row.patient_name,
        rating: Number(row.rating),
        comment: row.comment,
        created_at: row.created_at,
        date: row.created_at,
        is_verified: row.is_verified,
        likes_count: 0,
        is_own_review: true
      },
      reviews_count: Number(summary.rows[0].count || 0),
      rating_average: Number(summary.rows[0].average || 0)
    });

  } catch (err) {
    if (client && transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'You have already reviewed this appointment.'
      });
    }

    console.error('Public review submission failed:', err);

    return res.status(503).json({
      success: false,
      error: 'Review could not be saved. Please try again.'
    });

  } finally {
    if (client) client.release();
  }
});


// LIKE / UNLIKE REVIEW
router.post('/providers/:id/reviews/:reviewId/like', patientAuth, async (req, res) => {
  try {
    const providerId = String(req.params.id || '');
    const reviewId = String(req.params.reviewId || '');
    const patientPid = String(req.patient.pid || '');

    if (!/^\d+$/.test(providerId) || !/^\d+$/.test(reviewId)) {
      return res.status(400).json({ success: false, error: 'Invalid review.' });
    }

    const review = await pool.query(`
      SELECT id FROM reviews
      WHERE id = $1 AND provider_id = $2
        AND COALESCE(is_hidden, FALSE) = FALSE
    `, [reviewId, providerId]);

    if (!review.rowCount) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    const inserted = await pool.query(`
      INSERT INTO review_likes (review_id, patient_pid)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING review_id
    `, [reviewId, patientPid]);

    let liked = true;

    if (!inserted.rowCount) {
      await pool.query(`
        DELETE FROM review_likes
        WHERE review_id = $1 AND patient_pid = $2
      `, [reviewId, patientPid]);

      liked = false;
    }

    const count = await pool.query(`
      SELECT COUNT(*)::int AS likes_count
      FROM review_likes WHERE review_id = $1
    `, [reviewId]);

    return res.json({
      success: true,
      liked,
      likes_count: count.rows[0].likes_count
    });

  } catch (err) {
    console.error('Review like failed:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Could not update review like.'
    });
  }
});


// DELETE OWN REVIEW — direct and appointment-based
router.delete('/providers/:id/reviews/:reviewId', patientAuth, async (req, res) => {
  try {
    const providerId = String(req.params.id || '');
    const reviewId = String(req.params.reviewId || '');
    const patientPid = String(req.patient?.pid || '').trim();

    if (!/^\d+$/.test(providerId) || !/^\d+$/.test(reviewId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review.'
      });
    }

    if (!patientPid) {
      return res.status(401).json({
        success: false,
        error: 'Please log in again.'
      });
    }

    const deleted = await pool.query(`
      DELETE FROM reviews
      WHERE id = $1
        AND provider_id = $2
        AND patient_pid = $3
      RETURNING id
    `, [reviewId, providerId, patientPid]);

    if (!deleted.rowCount) {
      return res.status(404).json({
        success: false,
        error: 'Your review was not found.'
      });
    }

    const summary = await pool.query(`
      SELECT
        COUNT(*)::int AS count,
        ROUND(AVG(rating)::numeric, 1) AS average
      FROM reviews
      WHERE provider_id = $1
        AND COALESCE(is_hidden, FALSE) = FALSE
    `, [providerId]);

    return res.json({
      success: true,
      deleted_review_id: deleted.rows[0].id,
      reviews_count: Number(summary.rows[0].count || 0),
      rating_average: Number(summary.rows[0].average || 0)
    });

  } catch (err) {
    console.error('Review deletion failed:', err);

    return res.status(503).json({
      success: false,
      error: 'Could not delete review.'
    });
  }
});

// GET: Logged-in patient's review for a booking
router.get('/bookings/:bookingRef/review', patientAuth, async (req, res) => {
  try {
    const bookingRef = String(req.params.bookingRef || '').trim();

    const result = await pool.query(`
      SELECT
        r.id,
        r.provider_id,
        r.patient_name,
        r.rating,
        r.comment,
        r.created_at,
        r.is_verified
      FROM provider_appointments a
      JOIN reviews r ON r.appointment_id = a.id
      WHERE a.booking_ref = $1
        AND a.patient_id = $2
        AND COALESCE(r.is_hidden, FALSE) = FALSE
      ORDER BY r.created_at DESC
      LIMIT 1
    `, [bookingRef, req.patient.pid]);

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        error: 'Review not found for this booking.'
      });
    }

    return res.json({
      success: true,
      review: result.rows[0]
    });

  } catch (err) {
    console.error('Booking review lookup failed:', err.message);

    return res.status(503).json({
      success: false,
      error: 'Could not load booking review.'
    });
  }
});

// GET: Reviews liked by the currently logged-in patient
router.get('/providers/:id/review-likes/me', patientAuth, async (req, res) => {
  try {
    const providerId = String(req.params.id || '');

    if (!/^\d+$/.test(providerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider.'
      });
    }

    const result = await pool.query(`
      SELECT l.review_id
      FROM review_likes l
      JOIN reviews r ON r.id = l.review_id
      WHERE r.provider_id::text = $1
        AND l.patient_pid = $2
        AND COALESCE(r.is_hidden, FALSE) = FALSE
    `, [providerId, req.patient.pid]);

    return res.json({
      success: true,
      liked_review_ids: result.rows.map(row => String(row.review_id))
    });

  } catch (err) {
    console.error('Patient review likes lookup failed:', err.message);

    return res.status(503).json({
      success: false,
      error: 'Could not load liked reviews.'
    });
  }
});

 // GET: Reviews owned by the logged-in patient
router.get('/providers/:id/reviews/mine', patientAuth, async (req, res) => {
  try {
    const providerId = String(req.params.id || '');
    const patientPid = String(req.patient?.pid || '').trim();

    if (!/^\d+$/.test(providerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider.'
      });
    }

    if (!patientPid) {
      return res.status(401).json({
        success: false,
        error: 'Please log in again.'
      });
    }

    const result = await pool.query(`
      SELECT id
      FROM reviews
      WHERE provider_id = $1
        AND patient_pid = $2
        AND COALESCE(is_hidden, FALSE) = FALSE
    `, [providerId, patientPid]);

    return res.json({
      success: true,
      own_review_ids: result.rows.map(row => String(row.id))
    });

  } catch (err) {
    console.error('Own reviews lookup failed:', err.message);

    return res.status(503).json({
      success: false,
      error: 'Could not load your reviews.'
    });
  }
});

// GET: Live public reviews for a provider
router.get('/providers/:id/reviews-live', async (req, res) => {
  try {
    const providerId = String(req.params.id || '');

    if (!/^\d+$/.test(providerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider.'
      });
    }

    const result = await pool.query(`
      SELECT
        r.id,
        r.provider_id,
        r.patient_name,
        r.rating,
        r.comment,
        r.is_verified,
        r.created_at,
        COUNT(l.review_id)::int AS likes_count
      FROM reviews r
      LEFT JOIN review_likes l ON l.review_id = r.id
      WHERE r.provider_id = $1
        AND COALESCE(r.is_hidden, FALSE) = FALSE
      GROUP BY
  r.id, r.provider_id, r.patient_name,
  r.rating, r.comment, r.is_verified, r.created_at
      ORDER BY r.created_at DESC
    `, [providerId]);

    return res.json({
      success: true,
      reviews: result.rows
    });

  } catch (err) {
    console.error('Live reviews loading failed:', err.message);

    return res.status(503).json({
      success: false,
      error: 'Could not load reviews.'
    });
  }
});


router.post('/bookings', async (req, res) => {
  let client;
  try {
    await ensureTables();
    const b = req.body || {};
    const providerId = String(b.provider_id || '').trim();
   const patientName = String(b.patient_name || (req.patient && req.patient.name) || '').trim();
    const phone = String(b.patient_phone || (req.patient && (req.patient.verifiedChannel === 'phone' ? req.patient.verifiedDestination : req.patient.phone)) || '').trim();
    const email = String(b.patient_email || (req.patient && (req.patient.verifiedChannel === 'email' ? req.patient.verifiedDestination : req.patient.email)) || '').trim().toLowerCase();
    const date = String(b.appointment_date || '').trim();
    const time = String(b.slot_time || '').trim();
    const consultationType = String(b.consultation_type || 'in_person').toLowerCase() === 'video' ? 'video' : 'in_person';
    if (!providerId || !patientName || (!phone && !email) || !date || !time) {
      return res.status(400).json({ success: false, error: 'Provider, patient name, a verified phone or email, appointment date and time are required.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
      return res.status(400).json({ success: false, error: 'Choose a valid appointment date.' });
    }
    if (date < todayIST()) {
      return res.status(400).json({ success: false, error: 'Past date par booking nahi ho sakti. Aaj ya aage ki date chuniye.' });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    const providerRes = await client.query(`SELECT p.* FROM providers p WHERE p.id::text = $1
      AND LOWER(COALESCE(to_jsonb(p)->>'verification_status','')) = 'verified'
      AND COALESCE(to_jsonb(p)->>'is_published','false') = 'true'
      AND LOWER(COALESCE(to_jsonb(p)->>'status','active')) NOT IN ('suspended','rejected','inactive') LIMIT 1 FOR UPDATE`, [providerId]);
    if (!providerRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'This provider is not currently available for public booking.' });
    }
    const provider = providerRes.rows[0];

    let qrCode = null;
    let source = 'marketplace';
    if (b.qr_code) {
      const qrRes = await client.query(`SELECT q.* FROM provider_qr_codes q WHERE q.code = $1 AND q.provider_id = $2 AND q.status = 'active' LIMIT 1`, [String(b.qr_code), provider.id]);
      if (!qrRes.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'The reception QR is invalid or disabled.' });
      }
      qrCode = qrRes.rows[0]; source = 'qr';
    } else if (String(b.source || '').toLowerCase() === 'qr') {
      source = 'qr';
    }

    let doctorId = asId(b.doctor_id);
    let doctorName = String(b.doctor_name || '').trim() || null;
    let room = null;
    let fee = null;
    if (doctorId) {
      const d = await client.query(`SELECT id, full_name, room, COALESCE(opd_fee, consultation_fee) AS fee
        FROM doctors WHERE id = $1 AND provider_id = $2 AND is_active = TRUE AND is_public = TRUE LIMIT 1`, [doctorId, provider.id]);
      if (!d.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Selected doctor is not available for this provider.' });
      }
      doctorName = doctorName || d.rows[0].full_name;
      room = d.rows[0].room;
      fee = d.rows[0].fee == null ? null : safeNumber(d.rows[0].fee);
    }

    let serviceId = asId(b.service_id);
    let serviceName = String(b.service_name || '').trim() || null;
    if (serviceId) {
      const svc = await client.query('SELECT id, name, price FROM services WHERE id = $1 AND provider_id = $2 AND is_active = TRUE AND is_public = TRUE LIMIT 1', [serviceId, provider.id]);
      if (!svc.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Selected service is not available for this provider.' });
      }
      serviceName = svc.rows[0].name;
      fee = svc.rows[0].price == null ? null : safeNumber(svc.rows[0].price);
    } else if (serviceName) {
      const svc = await client.query('SELECT id, name, price FROM services WHERE provider_id = $1 AND LOWER(name) = LOWER($2) AND is_active = TRUE AND is_public = TRUE LIMIT 1', [provider.id, serviceName]);
      if (svc.rowCount) { serviceId = svc.rows[0].id; serviceName = svc.rows[0].name; fee = svc.rows[0].price == null ? null : safeNumber(svc.rows[0].price); }
    }
    if (fee === null) fee = 0;// Fee is sourced from the provider's DB record, never from a client-submitted amount.
    if (await bookingFlow.lockAppointmentSlot(client, provider.id, doctorId, date, time)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'This doctor already has an appointment at the selected date and time.' });
    }

    let patient = null;
    if (email) {
      const found = await client.query('SELECT * FROM patient_profiles WHERE LOWER(email) = $1 LIMIT 1', [email]);
      patient = found.rows[0] || null;
    }
    if (!patient && phone) {
      const found = await client.query('SELECT * FROM patient_profiles WHERE phone = $1 ORDER BY created_at ASC LIMIT 1', [phone]);
      patient = found.rows[0] || null;
    }
    if (patient) {
      const updated = await client.query(`UPDATE patient_profiles SET full_name=$1, phone=COALESCE(NULLIF($2,''),phone),
        email=COALESCE(NULLIF($3,''),email), updated_at=NOW() WHERE id=$4 RETURNING *`, [patientName, phone, email, patient.id]);
      patient = updated.rows[0];
    } else {
      const inserted = await client.query(`INSERT INTO patient_profiles(pid, full_name, phone, email) VALUES($1,$2,$3,$4) RETURNING *`, [id('PID'), patientName, phone || null, email || null]);
      patient = inserted.rows[0];
    }

    
const bookingId = id('SAINO');
const token = null;
const trackingToken = crypto.randomBytes(32).toString('hex');

    const paymentRequired = false;
    let paymentOrder = null;
    let paymentUnavailable = false;
    if (paymentRequired) {
      try { paymentOrder = await razorpay.createOrder(Math.round(fee * 100), 'INR', bookingId); }
      catch (error) {
        // Keep the real appointment request and queue token if local credentials
        // have not been configured yet. It stays pending_payment and is never
        // presented as a confirmed/paid appointment; payment can be retried later.
        if (error.status === 503) paymentUnavailable = true;
        else throw error;
      }
    }
    const paymentMethod = String(b.payment_method || 'cash_at_hospital').trim();
    const paymentRef = String(b.payment_reference || '').trim();
    const paymentStatus = 'pending';
    const status = 'pending';

    const appointment = await client.query(`INSERT INTO provider_appointments(
      provider_id, booking_ref, token, tracking_token, patient_id, patient_name, patient_phone, patient_email,
      doctor_id, doctor, room, service_id, service_name, source, slot_time, fee, status,
      appointment_date, consultation_type, payment_status, payment_method, reason, updated_at
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW()) RETURNING *`, [
      provider.id, bookingId, token, trackingToken, patient.pid, patientName, phone, email || null,
      doctorId, doctorName, room, serviceId, serviceName, source, time, fee, status, date,
      consultationType, paymentStatus, paymentMethod, String(b.notes || '').trim() || null
    ]);

    // Admin Panel & Provider Payment Ledger me payment record insert karein
    await client.query(`INSERT INTO provider_payments(
      provider_id, patient_name, service_name, amount, payment_method, account_mask, status
    ) VALUES($1,$2,$3,$4,$5,$6,$7)`, [
      provider.id,
      patientName,
      serviceName || doctorName || 'OPD Consultation',
      fee,
      paymentMethod === 'razorpay_qr' ? 'Razorpay QR / UPI' : 'Pay in Hospital (Cash)',
      paymentRef ? `UTR: ${paymentRef} (${bookingId})` : bookingId,
      paymentStatus
    ]);


    if (paymentOrder) {
      await client.query('UPDATE provider_appointments SET razorpay_order_id=$1 WHERE id=$2', [paymentOrder.order.id, appointment.rows[0].id]);
    }
    await client.query(`INSERT INTO admin_notifications(title, message, provider_id)
      VALUES($1,$2,$3)`, ['New patient booking', `${patientName} submitted booking ${bookingId} for ${provider.name}.`, provider.id]);
    await client.query(`INSERT INTO patient_notifications(patient_id, booking_ref, type, title, message, payload)
      VALUES($1,$2,'booking_update',$3,$4,$5::jsonb)`, [
      patient.pid, bookingId, 'Booking request received',
      paymentUnavailable ? `${provider.name}: your request is saved. The queue token will appear in live tracking after provider confirmation. Online payment is not configured yet.` : `${provider.name}: your request is saved. The queue token will appear in live tracking after provider confirmation.`,
      JSON.stringify({ provider_id: String(provider.id), provider_name: provider.name, status, payment_status: 'pending', appointment_date: date, slot_time: time, room, doctor_name: doctorName, amount: fee })
    ]);
    if (qrCode) {
      await client.query(`UPDATE provider_qr_codes SET updated_at = NOW() WHERE id = $1`, [qrCode.id]);
    }
    await client.query('COMMIT');
    res.status(201).json({
      success: true, message: paymentUnavailable
        ? 'Booking request saved. Online payment is not configured yet; this appointment is not confirmed.'
        : paymentRequired
        ? 'Booking saved. Complete payment to confirm the booking request.'
        : 'Booking request saved and sent to the provider for confirmation.',
      payment_required: paymentRequired,
      payment_unavailable: paymentUnavailable,
      payment: paymentOrder ? { key_id: paymentOrder.keyId, order_id: paymentOrder.order.id,
        amount: paymentOrder.order.amount, currency: paymentOrder.order.currency } : null,
      booking: {
        booking_id: appointment.rows[0].booking_ref, patient_id: appointment.rows[0].patient_id,
        visit_id: appointment.rows[0].visit_id, token: appointment.rows[0].token,
        tracking_token: appointment.rows[0].tracking_token,
        status: appointment.rows[0].status, payment_status: appointment.rows[0].payment_status,
        payment_unavailable: paymentUnavailable, payment_required: paymentRequired,
        provider_name: provider.name, provider_id: String(provider.id), consultation_type: consultationType,
        provider_address: provider.address || provider.address_line || '', provider_city: provider.city || '',
        provider_phone: provider.phone || '', room: room || null, doctor_name: doctorName || null,
        amount: fee, currency: 'INR', appointment_date: date, slot_time: time
      }
    });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch (_) {} }
    console.error('Public booking save failed:', err.message);
    res.status(err.status || 500).json({ success: false, error: err.status === 503
      ? 'Razorpay is not configured. Your booking was not saved; contact SAINO support.'
      : err.status === 502 ? 'Razorpay could not create a payment order. Your booking was not saved; retry shortly.'
      : 'Booking could not be saved. Please retry or contact support.' });
  } finally {
    if (client) client.release();
  }
});

router.post('/bookings/payment/verify', patientAuth, async (req, res) => {
  try {
    await ensureTables();
    const orderId = String(req.body?.razorpay_order_id || '');
    const paymentId = String(req.body?.razorpay_payment_id || '');
    const signature = String(req.body?.razorpay_signature || '');
    const bookingRef = String(req.body?.booking_id || '');
    if (!orderId || !paymentId || !bookingRef || !razorpay.verifySignature(orderId, paymentId, signature)) {
      return res.status(400).json({ success: false, error: 'Payment verification failed.' });
    }
    const captured = await razorpay.fetchCapturedPayment(paymentId);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT a.*, p.name AS provider_name, p.address, p.address_line, p.city, p.phone
        FROM provider_appointments a JOIN providers p ON p.id=a.provider_id
        WHERE a.booking_ref=$1 AND a.razorpay_order_id=$2 FOR UPDATE OF a`, [bookingRef, orderId]);
      if (!found.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Payment order does not match this booking.' });
      }
      const appointment = found.rows[0];
      if (String(appointment.patient_id) !== String(req.patient.pid)) { await client.query('ROLLBACK'); return res.status(403).json({ success: false, error: 'This booking belongs to another patient.' }); }
      if (captured.order_id !== orderId || captured.status !== 'captured' ||
          Number(captured.amount) !== Math.round(Number(appointment.fee) * 100) || captured.currency !== 'INR') {
        await client.query('ROLLBACK');
        return res.status(402).json({ success: false, error: 'Captured payment details do not match the booking amount.' });
      }
      if (appointment.payment_status !== 'paid') {
        await client.query(`UPDATE provider_appointments SET payment_status='paid', payment_method='razorpay',
          razorpay_payment_id=$1, status='pending', updated_at=NOW() WHERE id=$2`, [paymentId, appointment.id]);
        await client.query('INSERT INTO admin_notifications(title,message,provider_id) VALUES($1,$2,$3)',
          ['Paid patient booking', `Patient booking ${bookingRef} payment completed for ${appointment.provider_name}.`, appointment.provider_id]);
        await client.query(`INSERT INTO patient_notifications(patient_id,booking_ref,type,title,message,payload)
          VALUES($1,$2,'payment_update','Payment received','Your appointment payment was received. The provider will confirm your visit.', $3::jsonb)`,
          [appointment.patient_id, bookingRef, JSON.stringify({ payment_status: 'paid', status: 'pending', provider_name: appointment.provider_name, token: appointment.token })]);
      }
      await client.query('COMMIT');
      return res.json({ success: true, booking: {
        booking_id: appointment.booking_ref, patient_id: appointment.patient_id, visit_id: appointment.visit_id,
        token: appointment.token, status: 'pending', payment_status: 'paid', provider_name: appointment.provider_name,
        provider_id: String(appointment.provider_id), consultation_type: appointment.consultation_type,
        provider_address: appointment.address || appointment.address_line || '', provider_city: appointment.city || '',
        provider_phone: appointment.phone || '', room: appointment.room, doctor_name: appointment.doctor,
        amount: Number(appointment.fee), currency: 'INR', appointment_date: appointment.appointment_date, slot_time: appointment.slot_time
      }});
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally { client.release(); }
  } catch (err) {
    console.error('Patient Razorpay verification failed:', err.message);
    return res.status(err.status || 500).json({ success: false, error: err.status === 503
      ? 'Razorpay is not configured.' : 'Payment could not be verified. Contact SAINO support if money was deducted.' });
  }
});

router.post('/bookings/:bookingRef/payment', patientAuth, async (req, res) => {
  try {
    await ensureTables();
    const found = await pool.query(`SELECT a.id, a.booking_ref, a.fee, a.payment_status, a.status, a.patient_id,
      p.name AS provider_name FROM provider_appointments a JOIN providers p ON p.id=a.provider_id
      WHERE a.booking_ref=$1 LIMIT 1`, [req.params.bookingRef, phone]);
    if (!found.rowCount) return res.status(404).json({ success: false, error: 'Booking was not found.' });
    const booking = found.rows[0];
    if (String(booking.patient_id) !== String(req.patient.pid)) return res.status(403).json({ success: false, error: 'This booking belongs to another patient.' });
    if (booking.payment_status === 'paid') return res.status(409).json({ success: false, error: 'This booking is already paid.' });
    if (booking.status !== 'pending_payment' || Number(booking.fee) <= 0) {
      return res.status(409).json({ success: false, error: 'This booking is not awaiting payment.' });
    }
    const paymentOrder = await razorpay.createOrder(Math.round(Number(booking.fee) * 100), 'INR', `${booking.booking_ref}-${Date.now()}`);
    await pool.query('UPDATE provider_appointments SET razorpay_order_id=$1, updated_at=NOW() WHERE id=$2 AND payment_status <> \'paid\'', [paymentOrder.order.id, booking.id]);
    return res.json({ success: true, payment_required: true,
      payment: { key_id: paymentOrder.keyId, order_id: paymentOrder.order.id, amount: paymentOrder.order.amount, currency: paymentOrder.order.currency },
      booking: { booking_id: booking.booking_ref, provider_name: booking.provider_name }
    });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.status === 503
      ? 'Razorpay is not configured.' : 'A payment retry order could not be created.' });
  }
});

router.get('/patient/notifications', patientAuth, async (req, res) => {
  try {
    await ensureTables();
    const rows = await pool.query(`SELECT id, booking_ref, type, title, message, payload, is_read, created_at
      FROM patient_notifications WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 100`, [req.patient.pid]);
    return res.json({ success: true, rows: rows.rows, unread: rows.rows.filter(row => !row.is_read).length });
  } catch (err) {
    console.error('Patient notifications load failed:', err.message);
    return res.status(503).json({ success: false, error: 'Patient notifications are unavailable.' });
  }
});

router.patch('/patient/notifications/:id/read', patientAuth, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(`UPDATE patient_notifications SET is_read=TRUE, read_at=NOW()
      WHERE id=$1 AND patient_id=$2 RETURNING id,is_read,read_at`, [req.params.id, req.patient.pid]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Notification not found.' });
    return res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    return res.status(503).json({ success: false, error: 'Notification could not be marked as read.' });
  }
});
// Patient sends arrival request to reception
router.post('/bookings/:bookingRef/arrival-request', patientAuth, async (req, res) => {
  let client;

  try {
    await ensureTables();

    client = await pool.connect();
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT *
       FROM provider_appointments
       WHERE booking_ref = $1
         AND patient_id = $2
       LIMIT 1
       FOR UPDATE`,
      [req.params.bookingRef, req.patient.pid]
    );

    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Booking not found in your account.'
      });
    }

    const booking = result.rows[0];
    const status = String(booking.status || '').toLowerCase();

    // Prevent duplicate requests and notifications
    if (booking.arrival_status === 'pending') {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        arrival_status: 'pending',
        message: 'Your arrival request is already waiting for reception confirmation.'
      });
    }

    if (booking.arrival_status === 'confirmed' ||
        ['checked_in', 'arrived', 'waiting', 'in_progress', 'completed'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'This appointment has already been checked in or processed.'
      });
    }

    if (status !== 'confirmed' || booking.arrival_status !== 'not_requested') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Arrival request is not available for this appointment.'
      });
    }

    if (booking.appointment_date instanceof Date
      ? booking.appointment_date.toISOString().slice(0, 10) !== todayIST()
      : String(booking.appointment_date).slice(0, 10) !== todayIST()) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'You can send an arrival request only on your appointment date.'
      });
    }

    if (booking.consultation_type === 'video') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Arrival request is only available for in-person appointments.'
      });
    }

    await client.query(
      `UPDATE provider_appointments
       SET arrival_status = 'pending',
           arrival_requested_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [booking.id]
    );

    await client.query(
      `INSERT INTO provider_notifications
       (provider_id, appointment_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [
        booking.provider_id,
        booking.id,
        'Patient Arrival Request',
        `${booking.patient_name} has arrived at reception. Booking ${booking.booking_ref}. Please confirm arrival or cancel the appointment.`
      ]
    );

    await client.query(
      `INSERT INTO patient_notifications
       (patient_id, booking_ref, type, title, message, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        booking.patient_id,
        booking.booking_ref,
        'arrival_request',
        'Arrival request sent',
        'Reception has been notified. Please wait for confirmation.',
        JSON.stringify({ arrival_status: 'pending' })
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      arrival_status: 'pending',
      message: 'Your arrival request has been sent to reception.'
    });

  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});

    console.error('Arrival request failed:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Could not send arrival request.'
    });

  } finally {
    if (client) client.release();
  }
});

router.get('/booking-tracking/:trackingToken', async (req, res) => {
  try {
    await ensureTables();
    const trackingToken = String(req.params.trackingToken || '');
    if (!/^[a-f0-9]{64}$/i.test(trackingToken)) {
      return res.status(400).json({ success: false, error: 'Invalid booking tracking link.' });
    }

    const result = await pool.query(`
      SELECT a.booking_ref, a.patient_name, a.status, a.payment_status, a.token,
        a.appointment_date, a.slot_time, a.consultation_type, a.doctor AS doctor_name,
        a.room, a.service_name, a.fee AS amount, a.eta_minutes,
        p.name AS provider_name,
        CASE
          WHEN LOWER(a.status) IN ('waiting', 'checked_in')
          THEN 1 + (
            SELECT COUNT(*)::int
            FROM provider_appointments ahead
            WHERE ahead.provider_id = a.provider_id
              AND ahead.appointment_date = a.appointment_date
              AND LOWER(ahead.status) IN ('waiting', 'checked_in')
              AND ahead.created_at < a.created_at
          )
          ELSE NULL
        END AS queue_position,
        (
          SELECT serving.token
          FROM provider_appointments serving
          WHERE serving.provider_id = a.provider_id
            AND serving.appointment_date = a.appointment_date
            AND LOWER(serving.status) = 'in_progress'
          ORDER BY serving.started_at DESC NULLS LAST
          LIMIT 1
        ) AS now_serving_token
      FROM provider_appointments a
      JOIN providers p ON p.id = a.provider_id
      WHERE a.tracking_token = $1
      LIMIT 1
    `, [trackingToken]);

    if (!result.rowCount) {
      return res.status(404).json({ success: false, error: 'Booking not found for this tracking link.' });
    }

    const booking = result.rows[0];
    const tokenVisible = ['confirmed', 'checked_in', 'waiting', 'in_progress', 'completed']
      .includes(String(booking.status || '').toLowerCase());
    return res.json({
      success: true,
      booking: {
        ...booking,
        booking_id: booking.booking_ref,
        token: tokenVisible ? booking.token : null,
        queue: {
          token: tokenVisible ? booking.token : null,
          position: booking.queue_position == null ? null : Number(booking.queue_position),
          now_serving_token: booking.now_serving_token || null,
          eta_minutes: booking.eta_minutes == null ? null : Number(booking.eta_minutes),
          room: booking.room || null
        }
      }
    });
  } catch (err) {
    console.error('Public booking tracking failed:', err.message);
    return res.status(503).json({ success: false, error: 'Booking tracking is unavailable.' });
  }
});

router.get('/bookings/:bookingRef', patientAuth, async (req, res) => {
  try {
    await ensureTables();

    const result = await pool.query(`
      SELECT
        a.booking_ref, a.patient_id, a.visit_id,
        a.status, a.payment_status, a.token, a.tracking_token,
        a.appointment_date, a.slot_time, a.consultation_type,
        a.doctor AS doctor_name, a.room, a.service_name,
        a.fee AS amount, a.eta_minutes, a.updated_at,
a.arrival_status, a.arrival_requested_at, a.arrival_reviewed_at,
EXISTS (
  SELECT 1
  FROM reviews r
  WHERE r.appointment_id = a.id
) AS has_review,
        p.id AS provider_id,
        p.name AS provider_name,
        COALESCE(p.address, p.address_line, '') AS provider_address,
        COALESCE(p.city, '') AS provider_city,
        COALESCE(p.phone, '') AS provider_phone,

        CASE
          WHEN LOWER(a.status) IN ('waiting', 'checked_in')
          THEN 1 + (
            SELECT COUNT(*)::int
            FROM provider_appointments ahead
            WHERE ahead.provider_id = a.provider_id
              AND ahead.appointment_date = a.appointment_date
              AND LOWER(ahead.status) IN ('waiting', 'checked_in')
              AND ahead.created_at < a.created_at
          )
          ELSE NULL
        END AS queue_position,

        (
          SELECT serving.token
          FROM provider_appointments serving
          WHERE serving.provider_id = a.provider_id
            AND serving.appointment_date = a.appointment_date
            AND LOWER(serving.status) = 'in_progress'
          ORDER BY serving.started_at DESC NULLS LAST
          LIMIT 1
        ) AS now_serving_token,

        (
          SELECT COUNT(*)::int
          FROM provider_appointments waiting
          WHERE waiting.provider_id = a.provider_id
            AND waiting.appointment_date = a.appointment_date
            AND LOWER(waiting.status) IN ('waiting', 'checked_in')
        ) AS queue_waiting

      FROM provider_appointments a
      JOIN providers p ON p.id = a.provider_id
      WHERE a.booking_ref = $1
        AND a.patient_id = $2
      LIMIT 1
    `, [req.params.bookingRef, req.patient.pid]);

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found in your patient account.'
      });
    }

    const booking = result.rows[0];

    return res.json({
      success: true,
      booking: {
        ...booking,
        queue: {
          token: booking.token,
          position: booking.queue_position == null
            ? null
            : Number(booking.queue_position),
          people_waiting: Number(booking.queue_waiting || 0),
          now_serving_token: booking.now_serving_token || null,
          eta_minutes: booking.eta_minutes == null
            ? null
            : Number(booking.eta_minutes),
          room: booking.room || null
        }
      }
    });

  } catch (err) {
    console.error('Booking status lookup failed:', err.message);

    return res.status(503).json({
      success: false,
      error: 'Booking status is unavailable.'
    });
  }
});


router.use('/search', require('./search').publicSearch);

router.get('/qr/:code', async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(`
  SELECT q.*,
         p.name AS provider_name,
         p.verification_status,
         p.is_published,
         p.status AS provider_status
  FROM provider_qr_codes q
  JOIN providers p ON p.id = q.provider_id
  WHERE q.code = $1
  LIMIT 1
`, [req.params.code]);

if (
  !result.rowCount ||
  result.rows[0].status !== 'active' ||
  result.rows[0].verification_status !== 'verified' ||
  !result.rows[0].is_published ||
  ['suspended', 'rejected', 'inactive'].includes(
    String(result.rows[0].provider_status || 'active').toLowerCase()
  )
) {
      return res.status(410).send('<!doctype html><html><meta charset="utf-8"><title>SAINO QR unavailable</title><body style="font-family:Arial;padding:40px"><h2>This SAINO QR code is unavailable</h2><p>The provider has not published its listing or this QR code has been disabled.</p><a href="/">Return to SAINO Health</a></body></html>');
    }
    const qr = result.rows[0];
    await pool.query('UPDATE provider_qr_codes SET total_scans = total_scans + 1 WHERE id = $1', [qr.id]);
    const visitorHash = crypto.createHash('sha256').update(`${req.ip || ''}|${req.get('user-agent') || ''}|${qr.id}`).digest('hex');
    await pool.query(`INSERT INTO provider_qr_scans(qr_code_id, visitor_hash) VALUES($1,$2)
    ON CONFLICT (qr_code_id, visitor_hash) WHERE visitor_hash IS NOT NULL DO NOTHING`, [qr.id, visitorHash]);
          
      const frontendUrl = (
        process.env.FRONTEND_URL ||
        'https://saino-healthcare-kappa.vercel.app'
      ).replace(/\/+$/, '');

      const bookingUrl = new URL(frontendUrl + '/');

      bookingUrl.searchParams.set('providerId', String(qr.provider_id));
      bookingUrl.searchParams.set('source', 'qr');
      bookingUrl.searchParams.set('qr', qr.code);
      bookingUrl.hash = 'marketplace';

      return res.redirect(302, bookingUrl.toString());

  } catch (err) {
    console.error('QR redirect failed:', err.message);
    res.status(503).send('SAINO QR could not be opened. Please try again later.');
  }
});
// ==========================================
// COMMUNITY DISCUSSIONS
// ==========================================

async function ensureCommunityDiscussionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_discussions (
      id BIGSERIAL PRIMARY KEY,
      patient_name VARCHAR(150) NOT NULL DEFAULT 'Patient',
      question TEXT NOT NULL,
      details TEXT,
      provider_name VARCHAR(200),
      city VARCHAR(100),
      category VARCHAR(100) DEFAULT 'General',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_community_discussions_created
    ON community_discussions(created_at DESC)
  `);
}

router.get('/community-discussions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, patient_name, question, details,
             provider_name, city, category, created_at
      FROM community_discussions
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      discussions: result.rows
    });
  } catch (error) {
    console.error('GET community discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load discussions'
    });
  }
});

// POST: Submit a new discussion question
router.post('/community-discussions', async (req, res) => {
  try {
    await ensureCommunityDiscussionsTable();

    const patientName = String(req.body.patient_name || 'Patient').trim();
    const question = String(req.body.question || '').trim();
    const details = String(req.body.details || '').trim();
    const providerName = String(req.body.provider_name || '').trim();
    const city = String(req.body.city || '').trim();
    const category = String(req.body.category || 'General').trim();

    if (!question || question.length < 10 || question.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Question must contain 10 to 2000 characters.'
      });
    }

    if (patientName.length > 150 || providerName.length > 200 ||
        city.length > 100 || category.length > 100 || details.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'One or more fields exceed the allowed length.'
      });
    }

    const result = await pool.query(`
      INSERT INTO community_discussions
        (patient_name, question, details, provider_name, city, category)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, patient_name, question, details,
        provider_name, city, category, created_at
    `, [
      patientName || 'Patient',
      question,
      details || null,
      providerName || null,
      city || null,
      category || 'General'
    ]);

    res.status(201).json({
      success: true,
      discussion: result.rows[0]
    });

  } catch (err) {
    console.error('Community discussion submission failed:', err.message);
    res.status(503).json({
      success: false,
      error: 'Your question could not be saved.'
    });
  }
});


module.exports = router;
