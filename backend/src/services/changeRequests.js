// Provider profile, doctor and service edits are reviewed before they reach the public listing.
const pool = require('../config/db');
const { TEMPLATE, validate, allowedFields } = require('../config/providerTemplate');

const colCache = {};
async function colsOf(db, table) {
  if (colCache[table]) return colCache[table];
  const { rows } = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
  return (colCache[table] = new Set(rows.map((r) => r.column_name)));
}

// Map template fields to compatible database columns, including older doctor name fields.
const COLMAP = {
  profile: { table: 'providers', map: { name: ['name'], category: ['category'], registration_no: ['registration_no'], contact_person: ['contact_person'],
    description: ['description'], address: ['address', 'address_line'], city: ['city'], district: ['district'], latitude: ['latitude'], longitude: ['longitude'],
    phone: ['phone'], email: ['email'], website: ['website'], opening_hours: ['opening_hours'], cover_image_url: ['cover_image_url'], logo_url: ['logo_url'] } },
  doctor: { table: 'doctors', map: { name: ['full_name', 'name'], department: ['department'], specialization: ['specialization'], qualification: ['qualification'],
    nmc_no: ['nmc_no'], experience_years: ['experience_years'], room: ['room'], opd_fee: ['opd_fee', 'consultation_fee'], followup_fee: ['followup_fee'],
    shift_timings: ['shift_timings'], avatar_url: ['avatar_url'] } },
  service: { table: 'services', map: { name: ['name'], category: ['category'], department: ['department'], price: ['price'], duration_min: ['duration_min'], description: ['description'] } },
};

// Template data -> sirf wahi columns jo table me exist karte hain
async function toColumns(db, entity, data) {
  const cols = await colsOf(db, COLMAP[entity].table);
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    for (const col of (COLMAP[entity].map[key] || [])) if (cols.has(col)) out[col] = val;
  }
  return out;
}

async function submitChange({ providerId, entity, action, entityId, input }) {
  action = action || 'update';
  if (!TEMPLATE.entities[entity]) throw Object.assign(new Error('Invalid entity.'), { status: 400 });
  if (!['create', 'update', 'archive'].includes(action)) throw Object.assign(new Error('Invalid action.'), { status: 400 });
  if (entity === 'profile') {
    entityId = providerId;   // profile ka id = provider ka id
  } else if (action !== 'create') {
    const id = Number(entityId);
    if (!Number.isInteger(id)) throw Object.assign(new Error('Invalid entity ID.'), { status: 400 });
    const own = await pool.query(`SELECT 1 FROM ${COLMAP[entity].table} WHERE id = $1 AND provider_id = $2`, [id, providerId]);
    if (!own.rows[0]) throw Object.assign(new Error('This record does not belong to your provider account.'), { status: 404 });
    entityId = id;
  } else entityId = null;
  if (entity === 'profile') action = 'update';
  if (entity === 'profile' && action !== 'update') throw Object.assign(new Error('Profile sirf update ho sakti hai'), { status: 400 });

  const v = validate(entity, action, input);
  if (v.error) throw Object.assign(new Error(v.error), { status: 400 });

  // Naya request purani pending request ko replace karti hai (admin ki queue saaf rahe)
  await pool.query(`UPDATE provider_change_requests SET status = 'superseded', reviewed_at = NOW()
    WHERE provider_id = $1 AND entity = $2 AND status = 'pending' AND COALESCE(entity_id, 0) = COALESCE($3, 0)`,
    [providerId, entity, entityId]);
  const { rows } = await pool.query(
    `INSERT INTO provider_change_requests (provider_id, entity, entity_id, action, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [providerId, entity, entityId, action, JSON.stringify(v.data)]);
  return rows[0];
}

async function applyChange(client, change) {
  const { entity, action, entity_id: entityId, provider_id: pid } = change;
  const data = change.data || {};
  const table = COLMAP[entity].table;

  if (entity === 'profile') {
    const cols = await toColumns(client, 'profile', data);
    const keys = Object.keys(cols);
    if (keys.length) {
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await client.query(`UPDATE providers SET ${sets} WHERE id = $1`, [pid, ...keys.map((k) => cols[k])]);
    }
    return;
  }
  if (action === 'archive') {
    await client.query(`UPDATE ${table} SET is_active = FALSE, is_public = FALSE WHERE id = $1 AND provider_id = $2`, [entityId, pid]);
    return;
  }
  const cols = await toColumns(client, entity, data);
  cols.is_active = true;
  cols.is_public = true;
  const keys = Object.keys(cols);
  if (action === 'create') {
    const colList = ['provider_id', ...keys].join(', ');
    const ph = ['$1', ...keys.map((_, i) => `$${i + 2}`)].join(', ');
    await client.query(`INSERT INTO ${table} (${colList}) VALUES (${ph})`, [pid, ...keys.map((k) => cols[k])]);
  } else {
    const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
    await client.query(`UPDATE ${table} SET ${sets} WHERE id = $1 AND provider_id = $2`, [entityId, pid, ...keys.map((k) => cols[k])]);
  }
}

async function approveChange(changeId, adminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM provider_change_requests WHERE id = $1 AND status = 'pending' FOR UPDATE`, [changeId]);
    if (!rows[0]) { await client.query('ROLLBACK'); throw Object.assign(new Error('Pending request not found.'), { status: 404 }); }
    await applyChange(client, rows[0]);
    await client.query(`UPDATE provider_change_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = $2 WHERE id = $1`, [changeId, adminId || null]);
    await client.query('COMMIT');
    return rows[0];
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
}

async function rejectChange(changeId, adminId, note) {
  const { rowCount } = await pool.query(
    `UPDATE provider_change_requests SET status = 'rejected', review_note = $3, reviewed_at = NOW(), reviewed_by = $2
     WHERE id = $1 AND status = 'pending'`, [changeId, adminId || null, note || null]);
  if (!rowCount) throw Object.assign(new Error('Pending request not found.'), { status: 404 });
}

async function ensureChangeTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS provider_change_requests (
    id BIGSERIAL PRIMARY KEY, provider_id BIGINT NOT NULL, entity TEXT NOT NULL, entity_id BIGINT,
    action TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
    review_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), reviewed_at TIMESTAMPTZ, reviewed_by BIGINT)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS pcr_status_idx ON provider_change_requests (status, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS pcr_provider_idx ON provider_change_requests (provider_id, created_at DESC)`);
  // Public visibility: naye/edited doctors aur services approve hone tak hidden. Default FALSE.
  await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE`);
  for (const col of ['latitude NUMERIC', 'longitude NUMERIC', 'opening_hours TEXT', 'website TEXT', 'district TEXT']) {
    await pool.query(`ALTER TABLE providers ADD COLUMN IF NOT EXISTS ${col}`);
  }
}

module.exports = { submitChange, approveChange, rejectChange, ensureChangeTables, COLMAP };
