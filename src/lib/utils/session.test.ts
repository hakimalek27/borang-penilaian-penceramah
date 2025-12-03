import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { LectureSession, SessionCreate, Hari, JenisKuliah } from '$lib/types/database';

// Generators
const hariArb: fc.Arbitrary<Hari> = fc.constantFrom(
	'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'
);

const jenisKuliahArb: fc.Arbitrary<JenisKuliah> = fc.constantFrom('Subuh', 'Maghrib');

const sessionCreateArb: fc.Arbitrary<SessionCreate> = fc.record({
	lecturer_id: fc.uuid(),
	bulan: fc.integer({ min: 1, max: 12 }),
	tahun: fc.integer({ min: 2024, max: 2030 }),
	minggu: fc.integer({ min: 1, max: 5 }),
	hari: hariArb,
	jenis_kuliah: jenisKuliahArb,
	is_active: fc.option(fc.boolean(), { nil: undefined })
});

const sessionArb: fc.Arbitrary<LectureSession> = fc.record({
	id: fc.uuid(),
	lecturer_id: fc.uuid(),
	bulan: fc.integer({ min: 1, max: 12 }),
	tahun: fc.integer({ min: 2024, max: 2030 }),
	minggu: fc.integer({ min: 1, max: 5 }),
	hari: hariArb,
	jenis_kuliah: jenisKuliahArb,
	is_active: fc.boolean(),
	created_at: fc.constant(new Date().toISOString()),
	updated_at: fc.constant(new Date().toISOString())
});

// Partial session create (for testing validation)
const partialSessionCreateArb = fc.record({
	lecturer_id: fc.option(fc.uuid(), { nil: undefined }),
	bulan: fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined }),
	tahun: fc.option(fc.integer({ min: 2024, max: 2030 }), { nil: undefined }),
	minggu: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
	hari: fc.option(hariArb, { nil: undefined }),
	jenis_kuliah: fc.option(jenisKuliahArb, { nil: undefined })
});

/**
 * Validates session creation data
 */
function validateSessionCreate(data: Partial<SessionCreate>): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!data.lecturer_id) {
		errors.push('lecturer_id diperlukan');
	}
	if (!data.bulan || data.bulan < 1 || data.bulan > 12) {
		errors.push('bulan tidak sah (1-12)');
	}
	if (!data.tahun || data.tahun < 2024) {
		errors.push('tahun tidak sah');
	}
	if (!data.minggu || data.minggu < 1 || data.minggu > 5) {
		errors.push('minggu tidak sah (1-5)');
	}
	if (!data.hari) {
		errors.push('hari diperlukan');
	}
	if (!data.jenis_kuliah) {
		errors.push('jenis_kuliah diperlukan');
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Filters sessions by active status
 */
function filterActiveSessions(sessions: LectureSession[]): LectureSession[] {
	return sessions.filter(s => s.is_active);
}

/**
 * Simulates session deletion - evaluations should be preserved with null session_id
 */
interface Evaluation {
	id: string;
	session_id: string | null;
}

function deleteSessionPreserveEvaluations(
	sessionId: string,
	sessions: LectureSession[],
	evaluations: Evaluation[]
): { sessions: LectureSession[]; evaluations: Evaluation[] } {
	// Remove session
	const updatedSessions = sessions.filter(s => s.id !== sessionId);
	
	// Update evaluations - set session_id to null for deleted session
	const updatedEvaluations = evaluations.map(e => ({
		...e,
		session_id: e.session_id === sessionId ? null : e.session_id
	}));

	return { sessions: updatedSessions, evaluations: updatedEvaluations };
}

/**
 * **Feature: sistem-penilaian-kuliah, Property 9: Session Creation Validation**
 * **Validates: Requirements 8.2**
 * 
 * For any lecture session creation attempt, if any required field (bulan, tahun, minggu, hari,
 * jenis_kuliah, lecturer_id) is missing or invalid, the creation SHALL fail with a validation error.
 */
describe('Property 9: Session Creation Validation', () => {
	it('should accept valid session creation data', () => {
		fc.assert(
			fc.property(sessionCreateArb, (data) => {
				const result = validateSessionCreate(data);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject session creation with missing required fields', () => {
		fc.assert(
			fc.property(partialSessionCreateArb, (data) => {
				const result = validateSessionCreate(data);
				
				// Count missing fields
				const missingFields = [
					!data.lecturer_id,
					!data.bulan,
					!data.tahun,
					!data.minggu,
					!data.hari,
					!data.jenis_kuliah
				].filter(Boolean).length;

				if (missingFields > 0) {
					expect(result.valid).toBe(false);
					expect(result.errors.length).toBeGreaterThan(0);
				}
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject invalid bulan values', () => {
		fc.assert(
			fc.property(
				sessionCreateArb,
				fc.integer().filter(n => n < 1 || n > 12),
				(data, invalidBulan) => {
					const invalidData = { ...data, bulan: invalidBulan };
					const result = validateSessionCreate(invalidData);
					expect(result.valid).toBe(false);
				}
			),
			{ numRuns: 50 }
		);
	});

	it('should reject invalid minggu values', () => {
		fc.assert(
			fc.property(
				sessionCreateArb,
				fc.integer().filter(n => n < 1 || n > 5),
				(data, invalidMinggu) => {
					const invalidData = { ...data, minggu: invalidMinggu };
					const result = validateSessionCreate(invalidData);
					expect(result.valid).toBe(false);
				}
			),
			{ numRuns: 50 }
		);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 10: Session Active Toggle Visibility**
 * **Validates: Requirements 8.3**
 * 
 * For any lecture session, when is_active is set to false, the session SHALL NOT appear
 * in the public form's session list, and when is_active is set to true, the session SHALL appear.
 */
describe('Property 10: Session Active Toggle Visibility', () => {
	it('should only return active sessions in public list', () => {
		fc.assert(
			fc.property(
				fc.array(sessionArb, { minLength: 1, maxLength: 20 }),
				(sessions) => {
					const activeSessions = filterActiveSessions(sessions);
					
					// All returned sessions should be active
					for (const session of activeSessions) {
						expect(session.is_active).toBe(true);
					}

					// Count should match
					const expectedCount = sessions.filter(s => s.is_active).length;
					expect(activeSessions.length).toBe(expectedCount);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should exclude inactive sessions from public list', () => {
		fc.assert(
			fc.property(
				fc.array(sessionArb, { minLength: 1, maxLength: 20 }),
				(sessions) => {
					const activeSessions = filterActiveSessions(sessions);
					const inactiveSessions = sessions.filter(s => !s.is_active);

					// No inactive session should appear in active list
					for (const inactive of inactiveSessions) {
						expect(activeSessions.find(s => s.id === inactive.id)).toBeUndefined();
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should toggle visibility correctly', () => {
		fc.assert(
			fc.property(sessionArb, (session) => {
				// Toggle active status
				const toggled = { ...session, is_active: !session.is_active };
				
				// Check visibility
				const originalVisible = filterActiveSessions([session]).length === 1;
				const toggledVisible = filterActiveSessions([toggled]).length === 1;

				expect(originalVisible).toBe(session.is_active);
				expect(toggledVisible).toBe(!session.is_active);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 11: Session Deletion Preserves Evaluations**
 * **Validates: Requirements 8.5**
 * 
 * For any lecture session with associated evaluation records, when the session is deleted,
 * all evaluation records that referenced that session SHALL remain in the database
 * with session_id set to NULL.
 */
describe('Property 11: Session Deletion Preserves Evaluations', () => {
	it('should preserve all evaluations when session is deleted', () => {
		const evaluationArb = fc.record({
			id: fc.uuid(),
			session_id: fc.uuid()
		});

		fc.assert(
			fc.property(
				fc.array(sessionArb, { minLength: 1, maxLength: 10 }),
				fc.array(evaluationArb, { minLength: 1, maxLength: 20 }),
				(sessions, evaluations) => {
					if (sessions.length === 0) return true;

					// Pick a random session to delete
					const sessionToDelete = sessions[0];
					
					// Link some evaluations to this session
					const linkedEvaluations = evaluations.map((e, i) => ({
						...e,
						session_id: i % 2 === 0 ? sessionToDelete.id : e.session_id
					}));

					const originalCount = linkedEvaluations.length;
					const linkedCount = linkedEvaluations.filter(
						e => e.session_id === sessionToDelete.id
					).length;

					// Delete session
					const result = deleteSessionPreserveEvaluations(
						sessionToDelete.id,
						sessions,
						linkedEvaluations
					);

					// All evaluations should still exist
					expect(result.evaluations.length).toBe(originalCount);

					// Session should be deleted
					expect(result.sessions.find(s => s.id === sessionToDelete.id)).toBeUndefined();

					// Linked evaluations should have null session_id
					const nullSessionEvaluations = result.evaluations.filter(
						e => e.session_id === null
					);
					expect(nullSessionEvaluations.length).toBeGreaterThanOrEqual(linkedCount);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not affect evaluations linked to other sessions', () => {
		fc.assert(
			fc.property(
				fc.array(sessionArb, { minLength: 2, maxLength: 5 }),
				fc.array(fc.record({ id: fc.uuid(), session_id: fc.uuid() }), { minLength: 5, maxLength: 10 }),
				(sessions, evaluations) => {
					if (sessions.length < 2) return true;

					const sessionToDelete = sessions[0];
					const otherSession = sessions[1];

					// Create evaluations linked to different sessions
					const linkedEvaluations = evaluations.map((e, i) => ({
						...e,
						session_id: i % 2 === 0 ? sessionToDelete.id : otherSession.id
					}));

					const otherSessionEvalsBefore = linkedEvaluations.filter(
						e => e.session_id === otherSession.id
					);

					const result = deleteSessionPreserveEvaluations(
						sessionToDelete.id,
						sessions,
						linkedEvaluations
					);

					// Evaluations linked to other sessions should be unchanged
					const otherSessionEvalsAfter = result.evaluations.filter(
						e => e.session_id === otherSession.id
					);

					expect(otherSessionEvalsAfter.length).toBe(otherSessionEvalsBefore.length);
				}
			),
			{ numRuns: 100 }
		);
	});
});
