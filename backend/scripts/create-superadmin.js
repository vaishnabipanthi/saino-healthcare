require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is missing in backend/.env');
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const email = (process.env.SUPERADMIN_EMAIL || await rl.question('Super Admin email: ')).trim().toLowerCase();
  const name = (process.env.SUPERADMIN_NAME || await rl.question('Super Admin full name: ')).trim();
  const password = process.env.SUPERADMIN_PASSWORD || await rl.question('Strong Super Admin password (input may be visible): ');
  rl.close();
  if (!email || !name || password.length < 12) throw new Error('Provide name/email and a password with at least 12 characters.');
  const pool = new Pool({ connectionString: dbUrl, ssl: ['localhost', '127.0.0.1', '::1'].includes(new URL(dbUrl).hostname) ? false : { rejectUnauthorized: false } });
  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
    const hash = await bcrypt.hash(password, 12);
    if (existing.rowCount && !['admin','superadmin'].includes(String(existing.rows[0].role).toLowerCase())) {
      throw new Error('That email is already assigned to a non-admin account. Use a separate Super Admin email.');
    }
    if (existing.rowCount) {
      await pool.query("UPDATE users SET full_name=$1, password_hash=$2, role='superadmin', is_active=TRUE, updated_at=NOW() WHERE id=$3", [name, hash, existing.rows[0].id]);
      console.log(`Updated Super Admin account: ${email}`);
    } else {
      await pool.query("INSERT INTO users(full_name,email,phone,password_hash,role,is_active) VALUES($1,$2,NULL,$3,'superadmin',TRUE)", [name, email, hash]);
      console.log(`Created Super Admin account: ${email}`);
    }
    console.log('Now open http://localhost:4000/admin/index.html and sign in.');
  } finally { await pool.end(); }
}

main().catch(err => { console.error('Super Admin setup failed:', err.message); process.exitCode = 1; });
