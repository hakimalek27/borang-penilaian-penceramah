import { Pool } from 'pg';
import { DATABASE_URL } from '$env/static/private';

const pool = new Pool({ connectionString: DATABASE_URL, ssl: false });

export const db = pool;
export const query = (text: string, params: unknown[] = []) => pool.query(text, params);
