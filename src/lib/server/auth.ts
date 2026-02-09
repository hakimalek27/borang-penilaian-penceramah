import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'bpp_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AdminUser {
	id: string;
	email: string;
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(adminId: string, cookies: Cookies): Promise<void> {
	const token = randomBytes(32).toString('hex');
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

	await query(
		'INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES ($1, $2, $3)',
		[adminId, tokenHash, expiresAt]
	);

	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE
	});
}

export async function getSession(cookies: Cookies): Promise<AdminUser | null> {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return null;

	const tokenHash = hashToken(token);

	const result = await query(
		`SELECT a.id, a.email FROM admin_sessions s
		 JOIN admins a ON a.id = s.admin_id
		 WHERE s.token_hash = $1 AND s.expires_at > NOW()
		 LIMIT 1`,
		[tokenHash]
	);

	if (result.rows.length === 0) {
		// Token invalid or expired - clear cookie
		cookies.delete(COOKIE_NAME, { path: '/' });
		return null;
	}

	return result.rows[0];
}

export async function deleteSession(cookies: Cookies): Promise<void> {
	const token = cookies.get(COOKIE_NAME);
	if (token) {
		const tokenHash = hashToken(token);
		await query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash]);
	}
	cookies.delete(COOKIE_NAME, { path: '/' });
}
