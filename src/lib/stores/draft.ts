/**
 * Draft Storage Utility
 * Saves and restores form draft from localStorage
 */
import { browser } from '$app/environment';

const DRAFT_KEY = 'evaluation_form_draft';
const DRAFT_VERSION = 1;

export interface DraftData {
	version: number;
	timestamp: number;
	evaluatorInfo: {
		nama: string;
		umur: string | number;
		alamat: string;
		tarikh: string;
	};
	selectedLecturers: string[];
	ratings: Record<string, {
		q1_tajuk: number | null;
		q2_ilmu: number | null;
		q3_penyampaian: number | null;
		q4_masa: number | null;
		recommendation: boolean | null;
	}>;
	komenPenceramah: string;
	cadanganMasjid: string;
}

/**
 * Save draft to localStorage
 */
export function saveDraft(data: Omit<DraftData, 'version' | 'timestamp'>): void {
	if (!browser) return;

	const draft: DraftData = {
		...data,
		version: DRAFT_VERSION,
		timestamp: Date.now()
	};

	try {
		localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
	} catch (error) {
		console.error('[Draft] Failed to save draft:', error);
	}
}

/**
 * Load draft from localStorage
 */
export function loadDraft(): DraftData | null {
	if (!browser) return null;

	try {
		const stored = localStorage.getItem(DRAFT_KEY);
		if (!stored) return null;

		const draft = JSON.parse(stored) as DraftData;
		
		// Check version compatibility
		if (draft.version !== DRAFT_VERSION) {
			clearDraft();
			return null;
		}

		return draft;
	} catch (error) {
		console.error('[Draft] Failed to load draft:', error);
		return null;
	}
}

/**
 * Check if draft exists
 */
export function hasDraft(): boolean {
	if (!browser) return false;

	try {
		const stored = localStorage.getItem(DRAFT_KEY);
		if (!stored) return false;

		const draft = JSON.parse(stored) as DraftData;
		return draft.version === DRAFT_VERSION;
	} catch {
		return false;
	}
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): void {
	if (!browser) return;

	try {
		localStorage.removeItem(DRAFT_KEY);
	} catch (error) {
		console.error('[Draft] Failed to clear draft:', error);
	}
}

/**
 * Get draft age in minutes
 */
export function getDraftAge(): number | null {
	const draft = loadDraft();
	if (!draft) return null;

	const ageMs = Date.now() - draft.timestamp;
	return Math.floor(ageMs / 60000);
}

/**
 * Format draft age for display
 */
export function formatDraftAge(minutes: number): string {
	if (minutes < 1) return 'baru sahaja';
	if (minutes < 60) return `${minutes} minit yang lalu`;
	
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} jam yang lalu`;
	
	const days = Math.floor(hours / 24);
	return `${days} hari yang lalu`;
}

/**
 * Validate draft data structure
 */
export function validateDraft(draft: unknown): draft is DraftData {
	if (!draft || typeof draft !== 'object') return false;
	
	const d = draft as Record<string, unknown>;
	
	return (
		typeof d.version === 'number' &&
		typeof d.timestamp === 'number' &&
		typeof d.evaluatorInfo === 'object' &&
		Array.isArray(d.selectedLecturers) &&
		typeof d.ratings === 'object'
	);
}

/**
 * Create empty draft data
 */
export function createEmptyDraft(): Omit<DraftData, 'version' | 'timestamp'> {
	return {
		evaluatorInfo: {
			nama: '',
			umur: '',
			alamat: '',
			tarikh: new Date().toISOString().split('T')[0]
		},
		selectedLecturers: [],
		ratings: {},
		komenPenceramah: '',
		cadanganMasjid: ''
	};
}
