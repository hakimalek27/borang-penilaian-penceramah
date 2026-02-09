#!/usr/bin/env node
// Usage: node scripts/set-admin-password.js <email> <password>
// Example: node scripts/set-admin-password.js admin@example.com newpassword123

import bcrypt from 'bcryptjs';
import pg from 'pg';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
	console.error('Usage: node scripts/set-admin-password.js <email> <password>');
	process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://bpp_app:password@127.0.0.1:5432/bpp';
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: false });

try {
	const hash = await bcrypt.hash(password, 12);
	const result = await pool.query(
		'UPDATE admins SET password_hash = $1 WHERE email = $2 RETURNING id, email',
		[hash, email]
	);

	if (result.rowCount === 0) {
		console.error(`Admin with email "${email}" not found.`);
		process.exit(1);
	}

	console.log(`Password updated for: ${result.rows[0].email} (id: ${result.rows[0].id})`);
} catch (err) {
	console.error('Error:', err.message);
	process.exit(1);
} finally {
	await pool.end();
}
