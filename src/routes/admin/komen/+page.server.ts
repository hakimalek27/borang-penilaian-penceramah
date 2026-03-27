import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	// Get date range filters from URL params
	const dateFrom = url.searchParams.get('from') || null;
	const dateTo = url.searchParams.get('to') || null;

	// Build query for comments
	let commentsSql = `
		SELECT id, nama_penilai, tarikh_penilaian, komen_penceramah
		FROM evaluations
		WHERE komen_penceramah IS NOT NULL AND komen_penceramah != ''
	`;
	const commentsParams: unknown[] = [];
	let paramIndex = 1;

	if (dateFrom) {
		commentsSql += ` AND tarikh_penilaian >= $${paramIndex}`;
		commentsParams.push(dateFrom);
		paramIndex++;
	}
	if (dateTo) {
		commentsSql += ` AND tarikh_penilaian <= $${paramIndex}`;
		commentsParams.push(dateTo);
		paramIndex++;
	}
	commentsSql += ` ORDER BY tarikh_penilaian DESC`;

	interface CommentRow {
		id: string;
		nama_penilai: string;
		tarikh_penilaian: string;
		komen_penceramah: string;
	}
	let allComments: CommentRow[] = [];
	try {
		const result = await query(commentsSql, commentsParams);
		allComments = result.rows;
	} catch (error) {
		console.error('Error fetching comments:', error);
	}

	// Build query for suggestions
	let suggestionsSql = `
		SELECT id, nama_penilai, tarikh_penilaian, cadangan_masjid
		FROM evaluations
		WHERE cadangan_masjid IS NOT NULL AND cadangan_masjid != ''
	`;
	const suggestionsParams: unknown[] = [];
	paramIndex = 1;

	if (dateFrom) {
		suggestionsSql += ` AND tarikh_penilaian >= $${paramIndex}`;
		suggestionsParams.push(dateFrom);
		paramIndex++;
	}
	if (dateTo) {
		suggestionsSql += ` AND tarikh_penilaian <= $${paramIndex}`;
		suggestionsParams.push(dateTo);
		paramIndex++;
	}
	suggestionsSql += ` ORDER BY tarikh_penilaian DESC`;

	interface SuggestionRow {
		id: string;
		nama_penilai: string;
		tarikh_penilaian: string;
		cadangan_masjid: string;
	}
	let allSuggestions: SuggestionRow[] = [];
	try {
		const result = await query(suggestionsSql, suggestionsParams);
		allSuggestions = result.rows;
	} catch (error) {
		console.error('Error fetching suggestions:', error);
	}

	// Remove duplicate comments
	const uniqueComments: Array<{ id: string; nama_penilai: string; tarikh: string; komen: string }> = [];
	const seenComments = new Set<string>();

	for (const item of allComments) {
		const key = `${item.nama_penilai}-${item.tarikh_penilaian}-${item.komen_penceramah}`;
		if (!seenComments.has(key)) {
			seenComments.add(key);
			uniqueComments.push({
				id: item.id,
				nama_penilai: item.nama_penilai,
				tarikh: item.tarikh_penilaian,
				komen: item.komen_penceramah
			});
		}
	}

	// Remove duplicate suggestions
	const uniqueSuggestions: Array<{ id: string; nama_penilai: string; tarikh: string; cadangan: string }> = [];
	const seenSuggestions = new Set<string>();

	for (const item of allSuggestions) {
		const key = `${item.nama_penilai}-${item.tarikh_penilaian}-${item.cadangan_masjid}`;
		if (!seenSuggestions.has(key)) {
			seenSuggestions.add(key);
			uniqueSuggestions.push({
				id: item.id,
				nama_penilai: item.nama_penilai,
				tarikh: item.tarikh_penilaian,
				cadangan: item.cadangan_masjid
			});
		}
	}

	return {
		lecturerComments: uniqueComments,
		mosqueSuggestions: uniqueSuggestions,
		filters: {
			dateFrom,
			dateTo
		}
	};
};

export const actions: Actions = {
	clearKomen: async ({ request }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const tarikh = formData.get('tarikh') as string;
		const komen = formData.get('komen') as string;

		if (!nama || !tarikh || !komen) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		try {
			await query(
				`UPDATE evaluations SET komen_penceramah = NULL
				 WHERE nama_penilai = $1 AND tarikh_penilaian = $2 AND komen_penceramah = $3`,
				[nama, tarikh, komen]
			);
			return { success: true };
		} catch (error) {
			console.error('Error clearing komen:', error);
			return fail(500, { error: 'Ralat semasa memadam komen' });
		}
	},

	clearCadangan: async ({ request }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const tarikh = formData.get('tarikh') as string;
		const cadangan = formData.get('cadangan') as string;

		if (!nama || !tarikh || !cadangan) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		try {
			await query(
				`UPDATE evaluations SET cadangan_masjid = NULL
				 WHERE nama_penilai = $1 AND tarikh_penilaian = $2 AND cadangan_masjid = $3`,
				[nama, tarikh, cadangan]
			);
			return { success: true };
		} catch (error) {
			console.error('Error clearing cadangan:', error);
			return fail(500, { error: 'Ralat semasa memadam cadangan' });
		}
	}
};
