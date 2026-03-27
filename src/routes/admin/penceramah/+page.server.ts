import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Upload config
const PROD_UPLOAD_DIR = '/var/www/mamkl.my/bpp/uploads/penceramah';
const DEV_UPLOAD_DIR = 'static/uploads/penceramah';
const PROD_URL_PREFIX = 'https://bpp.mamkl.my/upload/penceramah';
const DEV_URL_PREFIX = '/uploads/penceramah';

function getUploadDir(): string {
	return process.env.NODE_ENV === 'production' ? PROD_UPLOAD_DIR : DEV_UPLOAD_DIR;
}

function getUrlPrefix(): string {
	return process.env.NODE_ENV === 'production' ? PROD_URL_PREFIX : DEV_URL_PREFIX;
}

async function saveUpload(file: File): Promise<string> {
	const dir = getUploadDir();
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}

	const ext = file.name.split('.').pop();
	const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
	const filePath = path.join(dir, fileName);

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);

	return `${getUrlPrefix()}/${fileName}`;
}

async function removeUploadByUrl(url: string | null): Promise<void> {
	if (!url) return;

	// Extract filename from URL
	const fileName = url.split('/').pop();
	if (!fileName) return;

	const dir = getUploadDir();
	const filePath = path.join(dir, fileName);

	try {
		await unlink(filePath);
	} catch {
		// File may not exist, ignore
	}
}

export const load: PageServerLoad = async () => {
	const result = await query(
		'SELECT * FROM lecturers ORDER BY sort_order ASC, nama ASC'
	);

	return {
		lecturers: result.rows
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const keterangan = formData.get('keterangan') as string;
		const sort_order = parseInt(formData.get('sort_order') as string) || 0;
		const gambar = formData.get('gambar') as File | null;

		if (!nama || nama.trim() === '') {
			return fail(400, { error: 'Nama penceramah diperlukan' });
		}

		let gambar_url: string | null = null;

		if (gambar && gambar.size > 0) {
			try {
				gambar_url = await saveUpload(gambar);
			} catch (err) {
				console.error('Error uploading image:', err);
				return fail(500, { error: 'Ralat semasa memuat naik gambar' });
			}
		}

		try {
			await query(
				'INSERT INTO lecturers (nama, gambar_url, keterangan, sort_order) VALUES ($1, $2, $3, $4)',
				[nama.trim(), gambar_url, keterangan?.trim() || null, sort_order]
			);
		} catch (err) {
			console.error('Error creating lecturer:', err);
			return fail(500, { error: 'Ralat semasa menambah penceramah' });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const nama = formData.get('nama') as string;
		const keterangan = formData.get('keterangan') as string;
		const sort_order = parseInt(formData.get('sort_order') as string) || 0;
		const gambar = formData.get('gambar') as File | null;

		if (!id || !nama || nama.trim() === '') {
			return fail(400, { error: 'ID dan nama penceramah diperlukan' });
		}

		let gambar_url_update = '';
		let params: unknown[] = [nama.trim(), keterangan?.trim() || null, sort_order, id];

		if (gambar && gambar.size > 0) {
			// Get existing photo to delete
			const existing = await query('SELECT gambar_url FROM lecturers WHERE id = $1', [id]);
			if (existing.rows[0]?.gambar_url) {
				await removeUploadByUrl(existing.rows[0].gambar_url);
			}

			try {
				const newUrl = await saveUpload(gambar);
				gambar_url_update = ', gambar_url = $5';
				params.push(newUrl);
			} catch (err) {
				console.error('Error uploading image:', err);
				return fail(500, { error: 'Ralat semasa memuat naik gambar' });
			}
		}

		try {
			await query(
				`UPDATE lecturers SET nama = $1, keterangan = $2, sort_order = $3${gambar_url_update} WHERE id = $4`,
				params
			);
		} catch (err) {
			console.error('Error updating lecturer:', err);
			return fail(500, { error: 'Ralat semasa mengemaskini penceramah' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID penceramah diperlukan' });
		}

		// Get photo URL before deleting
		const existing = await query('SELECT gambar_url FROM lecturers WHERE id = $1', [id]);
		if (existing.rows[0]?.gambar_url) {
			await removeUploadByUrl(existing.rows[0].gambar_url);
		}

		try {
			await query('DELETE FROM lecturers WHERE id = $1', [id]);
		} catch (err) {
			console.error('Error deleting lecturer:', err);
			return fail(500, { error: 'Ralat semasa memadam penceramah' });
		}

		return { success: true };
	}
};
