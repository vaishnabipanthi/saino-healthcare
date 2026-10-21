// Test ke rows hatao (smoke / gate / booking tests se bane). DEFAULT: sirf dikhata hai.
// Chalane ke liye:  node scripts/purge-test-data.js          (dry run)
//                   node scripts/purge-test-data.js --yes    (asli delete)
const pool = require('../src/config/db');

// Test rows ki pehchan: test emails ya test naam. Real hospital ke email/naam se match nahi karega.
const TEST_PROVIDER_WHERE = `(
  LOWER(COALESCE(email,'')) LIKE '%.test'
  OR LOWER(COALESCE(email,'')) LIKE '%@x.com'
  OR name IN ('Test Clinic','Renamed Clinic','Norvic Test Hospital','Other Hospital')
)`;

(async () => {
  const apply = process.argv.includes('--yes');
  const list = await pool.query(`SELECT id, name, email, verification_status FROM providers WHERE ${TEST_PROVIDER_WHERE} ORDER BY id`);
  console.log(`Test providers mile: ${list.rows.length}`);
  list.rows.forEach(r => console.log(`  #${r.id}  ${r.name}  <${r.email}>  [${r.verification_status}]`));
  if (!list.rows.length) return pool.end();
  if (!apply) { console.log('\nDry run. Delete karne ke liye --yes ke saath chalao.'); return pool.end(); }

  const ids = list.rows.map(r => r.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Har statement savepoint me: ek table na ho ya column alag ho to baaki delete rukega nahi
    const step = async (label, sql, params) => {
      await client.query('SAVEPOINT s');
      try { const r = await client.query(sql, params); await client.query('RELEASE SAVEPOINT s'); return r.rowCount; }
      catch (e) { await client.query('ROLLBACK TO SAVEPOINT s'); console.log(`  (skip ${label}: ${e.message.split('\n')[0]})`); return 0; }
    };
    await step('billing_events', 'DELETE FROM billing_events WHERE provider_id = ANY($1)', [ids]);
    await step('admin_notifications', 'DELETE FROM admin_notifications WHERE provider_id = ANY($1)', [ids]);
    await step('provider_appointments', 'DELETE FROM provider_appointments WHERE provider_id = ANY($1)', [ids]);
    await step('doctors', 'DELETE FROM doctors WHERE provider_id = ANY($1)', [ids]);
    await step('services', 'DELETE FROM services WHERE provider_id = ANY($1)', [ids]);
    await step('reviews', 'DELETE FROM reviews WHERE provider_id = ANY($1)', [ids]);
    await step('memberships', 'DELETE FROM memberships WHERE provider_id = ANY($1)', [ids]);
    await client.query('DELETE FROM providers WHERE id = ANY($1)', [ids]);
    // Users: sirf test email wale jo ab kisi provider se juda nahi
    await step('users', `DELETE FROM users u WHERE (LOWER(u.email) LIKE '%.test' OR LOWER(u.email) LIKE '%@x.com')
      AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id)`, []);
    await client.query('COMMIT');
    console.log(`\nDelete ho gaya: ${ids.length} test providers aur unke bookings/doctors/services.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Delete fail, kuch nahi badla:', e.message);
  } finally { client.release(); await pool.end(); }
})();
