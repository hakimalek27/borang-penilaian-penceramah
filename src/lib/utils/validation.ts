import type { EvaluatorInfo, ValidationError, FormValidationResult, EvaluationRatings } from '$lib/types/database';

/**
 * Validates evaluator information fields
 * Returns validation result with errors for any invalid/missing fields
 */
export function validateEvaluatorInfo(info: Partial<EvaluatorInfo>): FormValidationResult {
	const errors: ValidationError[] = [];

	// Validate nama
	if (!info.nama || info.nama.trim() === '') {
		errors.push({ field: 'nama', message: 'Nama penilai diperlukan' });
	}

	// Validate umur
	if (info.umur === undefined || info.umur === null) {
		errors.push({ field: 'umur', message: 'Umur diperlukan' });
	} else if (typeof info.umur !== 'number' || info.umur < 1 || info.umur > 150) {
		errors.push({ field: 'umur', message: 'Umur tidak sah' });
	}

	// Validate alamat
	if (!info.alamat || info.alamat.trim() === '') {
		errors.push({ field: 'alamat', message: 'Alamat diperlukan' });
	}

	// Validate tarikh
	if (!info.tarikh || info.tarikh.trim() === '') {
		errors.push({ field: 'tarikh', message: 'Tarikh diperlukan' });
	} else if (!isValidDate(info.tarikh)) {
		errors.push({ field: 'tarikh', message: 'Format tarikh tidak sah' });
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Validates that a date string is in valid YYYY-MM-DD format
 */
export function isValidDate(dateStr: string): boolean {
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(dateStr)) return false;

	const date = new Date(dateStr);
	return !isNaN(date.getTime());
}

/**
 * Checks if evaluation ratings are complete (all 4 questions answered)
 */
export function isRatingsComplete(ratings: EvaluationRatings): boolean {
	return (
		ratings.q1_tajuk !== null &&
		ratings.q2_ilmu !== null &&
		ratings.q3_penyampaian !== null &&
		ratings.q4_masa !== null &&
		isValidRating(ratings.q1_tajuk) &&
		isValidRating(ratings.q2_ilmu) &&
		isValidRating(ratings.q3_penyampaian) &&
		isValidRating(ratings.q4_masa)
	);
}

/**
 * Validates that a rating is within the valid range (1-4)
 */
export function isValidRating(rating: number | null): boolean {
	if (rating === null) return false;
	return rating >= 1 && rating <= 4 && Number.isInteger(rating);
}

/**
 * Sanitizes string input by trimming whitespace and escaping HTML
 */
export function sanitizeString(input: string): string {
	return input
		.trim()
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
