import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/server/supabase';
import { validateEvaluatorInfo, isRatingsComplete, sanitizeString } from '$lib/utils/validation';
import { sendNotificationSafe, type EvaluationSummary } from '$lib/server/email';
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

		// Check if recommendation section is enabled
		const { data: settings } = await supabase
			.from('settings')
			.select('value')
			.eq('key', 'show_recommendation_section')
			.single();
		
		const showRecommendation = settings?.value !== false;

		// Filter only complete evaluations
		// If recommendation is hidden, don't require it
		const completeEvaluations = evaluations.filter(
			(e) => isRatingsComplete(e.ratings) && (showRecommendation ? e.recommendation !== null : true)
		);

		if (completeEvaluations.length === 0) {
			return json(
				{ error: 'Sila lengkapkan sekurang-kurangnya satu penilaian penceramah' },
				{ status: 400 }
			);
		}

		// Get lecturer names for email notifications
		const lecturerIds = [...new Set(completeEvaluations.map(e => e.lecturerId))];
		const { data: lecturers } = await supabase
			.from('lecturers')
			.select('id, nama')
			.in('id', lecturerIds);
		
		const lecturerMap = new Map(lecturers?.map(l => [l.id, l.nama]) || []);

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
			cadangan_teruskan: showRecommendation ? evaluation.recommendation : null,
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

		// Send email notifications (non-blocking)
		// This runs in the background and won't affect the response
		for (const evaluation of completeEvaluations) {
			const ratings = evaluation.ratings;
			const overallRating = (
				(ratings.q1_tajuk || 0) + 
				(ratings.q2_ilmu || 0) + 
				(ratings.q3_penyampaian || 0) + 
				(ratings.q4_masa || 0)
			) / 4;

			const summary: EvaluationSummary = {
				evaluatorName: evaluator.nama,
				lecturerName: lecturerMap.get(evaluation.lecturerId) || 'Unknown',
				date: evaluator.tarikh,
				overallRating,
				recommendation: evaluation.recommendation ?? false
			};

			// Fire and forget - don't await
			sendNotificationSafe(summary);
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
