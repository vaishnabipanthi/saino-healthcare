// SAINO search (YouTube-jaisa):
//  - suggest: har akshar par dropdown (GET /?q=&mode=suggest)
//  - full:    Enter / "sab dekhein" (GET /?q=&mode=full)
//  - popular: empty box par DB se sabse common terms (GET /popular)
// Ranking: prefix > word-start > contains > typo-tolerant (pg_trgm similarity)
// Multi-word: har token kisi na kisi field me hona chahiye ("cardio norvic" dono).
const express = require('express');
const pool = require('../config/db');
const { wrap, HttpError } = require('../utils/search-http');

const clean = (raw) => {
  const q = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (q.length < 2) throw new HttpError(400, 'Kam se kam 2 akshar likhein');
  return q;
};

// Entity definitions. Har query (id, title, subtitle, type, provider_id) return karti hai.
// haystack = title + subtitle (dono me saari searchable info hai).
function entityDefs(scope, pid) {
  const pubProv = `LOWER(COALESCE(p.verification_status,'')) = 'verified' AND p.is_published = TRUE`;
  if (scope === 'public') return {
    providers: `SELECT p.id, p.name AS title, CONCAT_WS(' · ', p.category, p.city) AS subtitle,
        'provider' AS type, p.id AS provider_id FROM providers p WHERE ${pubProv}`,
    doctors: `SELECT d.id, d.full_name AS title, CONCAT_WS(' · ', d.department, d.specialization, p.name) AS subtitle,
        'doctor' AS type, p.id AS provider_id FROM doctors d JOIN providers p ON p.id = d.provider_id
        WHERE d.is_active = TRUE AND ${pubProv}`,
    services: `SELECT s.id, s.name AS title, CONCAT_WS(' · ', s.category, s.department, p.name) AS subtitle,
        'service' AS type, p.id AS provider_id FROM services s JOIN providers p ON p.id = s.provider_id
        WHERE s.is_active = TRUE AND ${pubProv}`,
  };
  if (scope === 'provider') return {
    doctors: `SELECT d.id, d.full_name AS title, CONCAT_WS(' · ', d.department, d.specialization) AS subtitle,
        'doctor' AS type, NULL::bigint AS provider_id FROM doctors d WHERE d.provider_id = ${pid} AND d.is_active = TRUE`,
    services: `SELECT s.id, s.name AS title, CONCAT_WS(' · ', s.category, s.department) AS subtitle,
        'service' AS type, NULL::bigint AS provider_id FROM services s WHERE s.provider_id = ${pid} AND s.is_active = TRUE`,
    appointments: `SELECT a.id, a.patient_name AS title, CONCAT_WS(' · ', a.booking_ref, a.token, a.status, a.patient_phone) AS subtitle,
        'appointment' AS type, NULL::bigint AS provider_id FROM provider_appointments a WHERE a.provider_id = ${pid}`,
  };
  return { // admin
    providers: `SELECT p.id, p.name AS title, CONCAT_WS(' · ', p.city, p.verification_status, p.email, p.phone) AS subtitle,
        'provider' AS type, p.id AS provider_id FROM providers p`,
    bookings: `SELECT a.id, a.patient_name AS title, CONCAT_WS(' · ', a.booking_ref, a.token, p.name, a.status, a.patient_phone) AS subtitle,
        'booking' AS type, a.provider_id FROM provider_appointments a JOIN providers p ON p.id = a.provider_id`,
    patients: `SELECT pp.id, pp.full_name AS title, CONCAT_WS(' · ', pp.pid, pp.phone, pp.email) AS subtitle,
        'patient' AS type, NULL::bigint AS provider_id FROM patient_profiles pp`,
    users: `SELECT u.id, u.full_name AS title, CONCAT_WS(' · ', u.email, u.role) AS subtitle,
        'user' AS type, NULL::bigint AS provider_id FROM users u`,
  };
}

async function runSearch({ scope, pid, q, limit }) {
  const tokens = q.split(' ').slice(0, 5);
  const defs = entityDefs(scope, pid);
  const out = {};
  await Promise.all(Object.entries(defs).map(async ([group, base]) => {
    const sql = `
      WITH e AS (${base}),
      scored AS (
        SELECT e.*,
          (CASE WHEN e.title ILIKE $1 || '%' THEN 100
                WHEN e.title ILIKE '% ' || $1 || '%' THEN 60
                WHEN e.title ILIKE '%' || $1 || '%' THEN 40 ELSE 0 END
           + 25 * word_similarity($1, COALESCE(e.title,''))
           + 5  * word_similarity($1, COALESCE(e.subtitle,''))) AS score
        FROM e
        WHERE (
          (SELECT bool_and((COALESCE(e.title,'') || ' ' || COALESCE(e.subtitle,'')) ILIKE '%' || t || '%')
             FROM unnest($2::text[]) AS t)
          OR word_similarity($1, COALESCE(e.title,'')) > 0.45
        )
      )
      SELECT id, title, subtitle, type, provider_id, score
      FROM scored
      ORDER BY score DESC, title ASC
      LIMIT ${limit}`;
    const { rows } = await pool.query(sql, [q, tokens]);
    out[group] = rows.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle || '', type: r.type, providerId: r.provider_id }));
  }));
  return out;
}

// Result ko ek flat list me bhi de dete hain (dropdown me ek saath dikhane ke liye)
const flatten = (groups, max) => Object.entries(groups).flatMap(([g, items]) => items.map((i) => ({ ...i, group: g }))).slice(0, max);

const searchRouter = express.Router();

searchRouter.get('/', wrap(async (req, res) => {
  const q = clean(req.query.q);
  const full = req.query.mode === 'full';
  const groups = await runSearch({ scope: res.locals.scope, pid: res.locals.pid, q, limit: full ? 20 : 4 });
  res.json({ success: true, q, mode: full ? 'full' : 'suggest', groups, items: flatten(groups, full ? 60 : 12) });
}));

searchRouter.get('/popular', wrap(async (req, res) => {
  const { scope, pid } = res.locals;
  const { rows } = scope === 'public'
    ? await pool.query(`SELECT s.category AS term, COUNT(*)::int AS n FROM services s JOIN providers p ON p.id = s.provider_id
        WHERE s.is_active AND s.category IS NOT NULL AND LOWER(COALESCE(p.verification_status,''))='verified' AND p.is_published
        GROUP BY s.category ORDER BY n DESC LIMIT 6`)
    : await pool.query(`SELECT COALESCE(NULLIF(department,''), category) AS term, COUNT(*)::int AS n FROM services
        WHERE provider_id = $1 AND is_active AND COALESCE(NULLIF(department,''), category) IS NOT NULL
        GROUP BY 1 ORDER BY n DESC LIMIT 6`, [pid]);
  res.json({ success: true, terms: rows.map((r) => r.term) });
}));

const withScope = (scope, extra) => express.Router().use((req, res, next) => { res.locals.scope = scope; if (extra) extra(req, res); next(); }, searchRouter);

module.exports = {
  publicSearch: withScope('public'),
  providerSearch: withScope('provider', (req, res) => { res.locals.pid = Number(req.providerId); }),
  adminSearch: withScope('admin'),
  // Indexes: search tez rahe, data badhne par bhi. Server start par ek baar chalta hai.
  ensureSearchIndexes: async () => {
    const stmts = [
      'CREATE EXTENSION IF NOT EXISTS pg_trgm',
      'CREATE INDEX IF NOT EXISTS providers_name_trgm ON providers USING gin (name gin_trgm_ops)',
      'CREATE INDEX IF NOT EXISTS doctors_name_trgm ON doctors USING gin (full_name gin_trgm_ops)',
      'CREATE INDEX IF NOT EXISTS services_name_trgm ON services USING gin (name gin_trgm_ops)',
      'CREATE INDEX IF NOT EXISTS appts_patient_trgm ON provider_appointments USING gin (patient_name gin_trgm_ops)',
    ];
    for (const s of stmts) {
      try { await pool.query(s); } catch (e) { console.warn('search index skipped:', e.message); }
    }
  },
};
