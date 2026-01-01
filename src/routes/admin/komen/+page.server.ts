import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createClient(cookies);

	// Get date range filters from URL params
	const dateFrom = url.searchParams.get('from') || null;
	const dateTo = url.searchParams.get('to') || null;

	// Build query for comments
	let commentsQuery = supabase
		.from('evaluations')
		.select(`
			id,
			nama_penilai,
			tarikh_penilaian,
			komen_penceramah
		`)
		.not('komen_penceramah', 'is', null)
		.neq('komen_penceramah', '');

	// Apply date range filters
	if (dateFrom) {
		commentsQuery = commentsQuery.gte('tarikh_penilaian', dateFrom);
	}
	if (dateTo) {
		commentsQuery = commentsQuery.lte('tarikh_penilaian', dateTo);
	}

	const { data: allComments } = await commentsQuery.order('tarikh_penilaian', { ascending: false });

	// Build query for suggestions
	let suggestionsQuery = supabase
		.from('evaluations')
		.select(`
			id,
			nama_penilai,
			tarikh_penilaian,
			cadangan_masjid
		`)
		.not('cadangan_masjid', 'is', null)
		.neq('cadangan_masjid', '');

	// Apply date range filters
	if (dateFrom) {
		suggestionsQuery = suggestionsQuery.gte('tarikh_penilaian', dateFrom);
	}
	if (dateTo) {
		suggestionsQuery = suggestionsQuery.lte('tarikh_penilaian', dateTo);
	}

	const { data: allSuggestions } = await suggestionsQuery.order('tarikh_penilaian', { ascending: false });

	// Remove duplicate comments (same person, same date, same comment)
	const uniqueComments: Array<{ id: string; nama_penilai: string; tarikh: string; komen: string }> = [];
	const seenComments = new Set<string>();

	if (allComments) {
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
	}

	// Remove duplicate suggestions (same person, same date, same suggestion)
	const uniqueSuggestions: Array<{ id: string; nama_penilai: string; tarikh: string; cadangan: string }> = [];
	const seenSuggestions = new Set<string>();

	if (allSuggestions) {
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
	// Clear komen from a specific evaluation (set to null)
	clearKomen: async ({ request, cookies }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const tarikh = formData.get('tarikh') as string;
		const komen = formData.get('komen') as string;

		if (!nama || !tarikh || !komen) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const supabase = createClient(cookies);

		// Clear komen for all evaluations with same nama, tarikh, and komen
		const { error } = await supabase
			.from('evaluations')
			.update({ komen_penceramah: null })
			.eq('nama_penilai', nama)
			.eq('tarikh_penilaian', tarikh)
			.eq('komen_penceramah', komen);

		if (error) {
			console.error('Error clearing komen:', error);
			return fail(500, { error: 'Ralat semasa memadam komen' });
		}

		return { success: true };
	},

	// Clear cadangan from a specific evaluation (set to null)
	clearCadangan: async ({ request, cookies }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const tarikh = formData.get('tarikh') as string;
		const cadangan = formData.get('cadangan') as string;

		if (!nama || !tarikh || !cadangan) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const supabase = createClient(cookies);

		// Clear cadangan for all evaluations with same nama, tarikh, and cadangan
		const { error } = await supabase
			.from('evaluations')
			.update({ cadangan_masjid: null })
			.eq('nama_penilai', nama)
			.eq('tarikh_penilaian', tarikh)
			.eq('cadangan_masjid', cadangan);

		if (error) {
			console.error('Error clearing cadangan:', error);
			return fail(500, { error: 'Ralat semasa memadam cadangan' });
		}

		return { success: true };
	}
};
