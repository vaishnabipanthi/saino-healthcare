// Ek provider ki listing tabhi admin ko bheji ja sakti hai jab ye sab bhare hon.
// Yahi check admin approve par bhi chalta hai (server side), taaki frontend bypass na ho sake.
const REQUIRED_FIELDS = [
  { key: 'name', label: 'Hospital / clinic ka naam', ok: (p) => !!String(p.name || '').trim() },
  { key: 'phone', label: 'Phone number', ok: (p) => !!String(p.phone || '').trim() },
  { key: 'email', label: 'Email', ok: (p) => !!String(p.email || '').trim() },
  { key: 'address', label: 'Address', ok: (p) => !!String(p.address || p.address_line || '').trim() },
  { key: 'city', label: 'City', ok: (p) => !!String(p.city || '').trim() },
  { key: 'registration_no', label: 'Registration number', ok: (p) => !!String(p.registration_no || '').trim() },
  { key: 'description', label: 'About / description', ok: (p) => !!String(p.description || '').trim() },
  { key: 'cover_image_url', label: 'Cover photo', ok: (p) => !!String(p.cover_image_url || '').trim() },
];

async function getCompleteness(db, providerId) {
  const pr = await db.query('SELECT * FROM providers WHERE id = $1', [providerId]);
  const p = pr.rows[0];
  if (!p) return null;
  const docs = (await db.query(
    `SELECT COUNT(*) FILTER (WHERE COALESCE(NULLIF(TRIM(full_name),''), NULLIF(TRIM(name),'')) IS NOT NULL
                              AND COALESCE(opd_fee, consultation_fee, 0) > 0)::int AS priced,
            COUNT(*)::int AS total
     FROM doctors WHERE provider_id = $1 AND is_active = TRUE AND status <> 'deleted'`, [providerId])).rows[0];
  const svc = (await db.query(
    `SELECT COUNT(*)::int AS total FROM services WHERE provider_id = $1 AND is_active = TRUE AND status <> 'deleted'`, [providerId])).rows[0];

  const missing = REQUIRED_FIELDS.filter((f) => !f.ok(p)).map((f) => f.label);
  if (!docs.total) missing.push('Kam se kam 1 doctor');
  else if (!docs.priced) missing.push('Doctor ki OPD fee (fee > 0)');
  if (!svc.total) missing.push('Kam se kam 1 service / department');

  const totalChecks = REQUIRED_FIELDS.length + 2;
  const done = totalChecks - missing.length;
  return {
    complete: missing.length === 0,
    missing,
    percent: Math.max(0, Math.round((done / totalChecks) * 100)),
    counts: { doctors: docs.total, services: svc.total },
    verification_status: p.verification_status,
    is_published: !!p.is_published,
  };
}

module.exports = { getCompleteness };