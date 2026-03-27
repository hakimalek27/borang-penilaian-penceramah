import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { validateEvaluatorInfo, isRatingsComplete, sanitizeString } from '$lib/utils/validation';
import type { EvaluationSubmission } from '$lib/types/database';

export const POST: RequestHandler = async ({ request }) => {
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

		const values: unknown[] = [];
		const placeholders = records
			.map((r, i) => {
				const base = i * 12;
				values.push(
					r.session_id,
					r.lecturer_id,
					r.nama_penilai,
					r.umur,
					r.alamat,
					r.tarikh_penilaian,
					r.q1_tajuk,
					r.q2_ilmu,
					r.q3_penyampaian,
					r.q4_masa,
					r.komen_penceramah,
					r.cadangan_masjid
				);
				return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12})`;
			})
			.join(', ');

		const insertSql = `
			INSERT INTO evaluations (
				session_id,
				lecturer_id,
				nama_penilai,
				umur,
				alamat,
				tarikh_penilaian,
				q1_tajuk,
				q2_ilmu,
				q3_penyampaian,
				q4_masa,
				komen_penceramah,
				cadangan_masjid
			)
			VALUES ${placeholders}
			RETURNING id
		`;

		const result = await query(insertSql, values);

		return json({
			success: true,
			message: 'Penilaian berjaya dihantar',
			count: result.rowCount || 0
		});
	} catch (error) {
		console.error('Server error:', error);
		return json(
			{ error: 'Ralat pelayan. Sila cuba lagi.' },
			{ status: 500 }
		);
	}
};
