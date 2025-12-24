import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/server/supabase';
import { validateEvaluatorInfo, isRatingsComplete, sanitizeString } from '$lib/utils/validation';
import type { EvaluationSubmission } from '$lib/types/database';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body: EvaluationSubmission = await request.json();
		const { evaluator, evaluations, komenPenceramah, cadanganMasjid } = body;

		// Validate evaluator info
		const validation = validateEvaluatorInfo(evaluator);
		if (!validation.isValid) {
			return json(
				{ error: 'Maklumat penilai tidak lengkap', details: validation.errors },
				{ status: 400 }
			);
		}

		const supabase = createClient(cookies);

		// Filter only complete evaluations
		const completeEvaluations = evaluations.filter(
			(e) => isRatingsComplete(e.ratings)
		);

		if (completeEvaluations.length === 0) {
			return json(
				{ error: 'Sila lengkapkan sekurang-kurangnya satu penilaian penceramah' },
				{ status: 400 }
			);
		}

		// Prepare evaluation records
		const records = completeEvaluations.map((evaluation) => ({
			session_id: evaluation.sessionId,
			lecturer_id: evaluation.lecturerId,
			nama_penilai: sanitizeString(evaluator.nama),
			umur: evaluator.umur,
			alamat: sanitizeString(evaluator.alamat),
			tarikh_penilaian: evaluator.tarikh,
			q1_tajuk: evaluation.ratings.q1_tajuk,
			q2_ilmu: evaluation.ratings.q2_ilmu,
			q3_penyampaian: evaluation.ratings.q3_penyampaian,
			q4_masa: evaluation.ratings.q4_masa,
			komen_penceramah: komenPenceramah ? sanitizeString(komenPenceramah) : null,
			cadangan_masjid: cadanganMasjid ? sanitizeString(cadanganMasjid) : null
		}));

		// Insert evaluations
		const { data, error } = await supabase
			.from('evaluations')
			.insert(records)
			.select();

		if (error) {
			console.error('Database error:', error);
			return json(
				{ error: 'Ralat semasa menyimpan penilaian. Sila cuba lagi.' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Penilaian berjaya dihantar',
			count: data?.length || 0
		});
	} catch (error) {
		console.error('Server error:', error);
		return json(
			{ error: 'Ralat pelayan. Sila cuba lagi.' },
			{ status: 500 }
		);
	}
};
