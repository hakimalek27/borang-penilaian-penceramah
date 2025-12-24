/**
 * Form Progress Calculation Utility
 * Calculates completion percentage for the evaluation form
 */

export interface FormState {
	evaluatorInfo: {
		nama: string;
		umur: string | number;
		alamat: string;
		tarikh: string;
	};
	selectedLecturers: string[];
	completedRatings: Map<string, RatingState> | Record<string, RatingState>;
}

export interface RatingState {
	q1_tajuk: number | null;
	q2_ilmu: number | null;
	q3_penyampaian: number | null;
	q4_masa: number | null;
}

/**
 * Calculate form completion progress (0-100)
 * @param formState - Current form state
 * @returns Progress percentage
 */
export function calculateProgress(formState: FormState): number {
	const weights = {
		evaluatorInfo: 30, // 30% for evaluator info
		lecturerSelection: 20, // 20% for selecting at least one lecturer
		ratings: 50 // 50% for completing ratings
	};

	let progress = 0;

	// Calculate evaluator info progress (30%)
	const evaluatorProgress = calculateEvaluatorProgress(formState.evaluatorInfo);
	progress += (evaluatorProgress / 100) * weights.evaluatorInfo;

	// Calculate lecturer selection progress (20%)
	if (formState.selectedLecturers.length > 0) {
		progress += weights.lecturerSelection;
	}

	// Calculate ratings progress (50%)
	if (formState.selectedLecturers.length > 0) {
		const ratingsProgress = calculateRatingsProgress(
			formState.selectedLecturers,
			formState.completedRatings
		);
		progress += (ratingsProgress / 100) * weights.ratings;
	}

	return Math.round(progress);
}

/**
 * Calculate evaluator info completion (0-100)
 */
export function calculateEvaluatorProgress(info: FormState['evaluatorInfo']): number {
	const fields = [
		{ value: info.nama, weight: 25 },
		{ value: info.umur, weight: 25 },
		{ value: info.alamat, weight: 25 },
		{ value: info.tarikh, weight: 25 }
	];

	let progress = 0;
	for (const field of fields) {
		if (isFieldFilled(field.value)) {
			progress += field.weight;
		}
	}

	return progress;
}

/**
 * Check if a field is filled
 */
function isFieldFilled(value: string | number | null | undefined): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number') return value > 0;
	return false;
}

/**
 * Calculate ratings completion progress (0-100)
 */
export function calculateRatingsProgress(
	selectedLecturers: string[],
	completedRatings: Map<string, RatingState> | Record<string, RatingState>
): number {
	if (selectedLecturers.length === 0) return 0;

	let totalFields = 0;
	let completedFields = 0;

	// Convert to Map if it's a Record
	const ratingsMap = completedRatings instanceof Map 
		? completedRatings 
		: new Map(Object.entries(completedRatings));

	for (const lecturerId of selectedLecturers) {
		const ratings = ratingsMap.get(lecturerId);
		
		// Each lecturer has 4 rating fields
		totalFields += 4;

		if (ratings) {
			if (ratings.q1_tajuk !== null) completedFields++;
			if (ratings.q2_ilmu !== null) completedFields++;
			if (ratings.q3_penyampaian !== null) completedFields++;
			if (ratings.q4_masa !== null) completedFields++;
		}
	}

	if (totalFields === 0) return 0;
	return Math.round((completedFields / totalFields) * 100);
}

/**
 * Check if form is ready for submission (100% complete)
 */
export function isFormComplete(formState: FormState): boolean {
	return calculateProgress(formState) === 100;
}

/**
 * Get progress status message
 */
export function getProgressStatus(progress: number): string {
	if (progress === 0) return 'Belum mula';
	if (progress < 30) return 'Baru bermula';
	if (progress < 60) return 'Separuh siap';
	if (progress < 100) return 'Hampir siap';
	return 'Sedia untuk hantar';
}

/**
 * Get progress color class
 */
export function getProgressColor(progress: number): string {
	if (progress < 30) return 'progress-low';
	if (progress < 60) return 'progress-medium';
	if (progress < 100) return 'progress-high';
	return 'progress-complete';
}
