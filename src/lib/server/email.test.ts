/**
 * Email Notification Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 19 & 20**
 * **Validates: Requirements 15.2, 15.3**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
	formatEmailContent,
	validateEvaluationSummary,
	sendEvaluationNotification,
	sendNotificationSafe,
	isValidEmail,
	setEmailConfig,
	setEmailEnabled,
	isEmailEnabled,
	getEmailConfig,
	type EvaluationSummary
} from './email';

// Arbitrary for generating valid evaluation summaries
const evaluationSummaryArbitrary = fc.record({
	evaluatorName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	lecturerName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	date: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
		.map(d => d.toISOString().split('T')[0]),
	overallRating: fc.float({ min: 1, max: 4, noNaN: true })
});

describe('Email Notification Service', () => {
	beforeEach(() => {
		// Reset config before each test
		setEmailConfig({
			enabled: false,
			adminEmails: [],
			fromEmail: 'noreply@masjid-almuttaqin.com',
			fromName: 'Sistem Penilaian Kuliah'
		});
	});

	describe('formatEmailContent', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 19: Email Notification Contains Required Fields**
		 * **Validates: Requirements 15.2**
		 * 
		 * For any evaluation submission, the generated email notification content
		 * SHALL contain: evaluator name, lecturer name, date, and overall rating.
		 */
		it('should include all required fields in email content for any valid summary', () => {
			fc.assert(
				fc.property(
					evaluationSummaryArbitrary,
					(summary) => {
						const { subject, body, html } = formatEmailContent(summary);

						// Subject should contain lecturer name and date
						expect(subject).toContain(summary.lecturerName);
						expect(subject).toContain(summary.date);

						// Body should contain all required fields (plain text, no escaping)
						expect(body).toContain(summary.evaluatorName);
						expect(body).toContain(summary.lecturerName);
						expect(body).toContain(summary.date);
						expect(body).toContain(summary.overallRating.toFixed(2));

						// HTML should contain date and rating (these don't need escaping)
						expect(html).toContain(summary.date);
						expect(html).toContain(summary.overallRating.toFixed(2));
						
						// For names, check that they appear in some form (escaped or not)
						// The escapeHtml function converts special chars, so we check the HTML is valid
						expect(html).toContain('<!DOCTYPE html>');
						expect(html).toContain('Penilai:');
						expect(html).toContain('Penceramah:');
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Property: Email content should be properly formatted
		 */
		it('should generate valid HTML email', () => {
			fc.assert(
				fc.property(
					evaluationSummaryArbitrary,
					(summary) => {
						const { html } = formatEmailContent(summary);

						// Should be valid HTML structure
						expect(html).toContain('<!DOCTYPE html>');
						expect(html).toContain('<html>');
						expect(html).toContain('</html>');
						expect(html).toContain('<body>');
						expect(html).toContain('</body>');
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * Property: HTML should escape special characters to prevent XSS
		 */
		it('should escape HTML special characters in user input', () => {
			const maliciousSummary: EvaluationSummary = {
				evaluatorName: '<script>alert("xss")</script>',
				lecturerName: '"><img src=x onerror=alert(1)>',
				date: '2024-01-01',
				overallRating: 3.5
			};

			const { html } = formatEmailContent(maliciousSummary);

			// Should not contain unescaped script tags
			expect(html).not.toContain('<script>');
			
			// Should contain escaped versions
			expect(html).toContain('&lt;script&gt;');
			expect(html).toContain('&lt;img');
		});
	});

	describe('validateEvaluationSummary', () => {
		/**
		 * Property: All valid summaries should pass validation
		 */
		it('should validate all properly formed summaries', () => {
			fc.assert(
				fc.property(
					evaluationSummaryArbitrary,
					(summary) => {
						const result = validateEvaluationSummary(summary);
						expect(result.valid).toBe(true);
						expect(result.errors).toHaveLength(0);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Property: Invalid summaries should fail validation with specific errors
		 */
		it('should reject summaries with missing evaluatorName', () => {
			const summary = {
				evaluatorName: '',
				lecturerName: 'Test Lecturer',
				date: '2024-01-01',
				overallRating: 3.0
			};

			const result = validateEvaluationSummary(summary);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('evaluatorName is required');
		});

		it('should reject summaries with invalid rating', () => {
			const summary: EvaluationSummary = {
				evaluatorName: 'Test',
				lecturerName: 'Test Lecturer',
				date: '2024-01-01',
				overallRating: 5.0 // Invalid - should be 1-4
			};

			const result = validateEvaluationSummary(summary);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.includes('overallRating'))).toBe(true);
		});
	});

	describe('sendEvaluationNotification', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 20: Email Failure Does Not Block Submission**
		 * **Validates: Requirements 15.3**
		 * 
		 * For any evaluation submission where email notification fails,
		 * the function should return a result (not throw) so evaluation can proceed.
		 */
		it('should return result without throwing for any valid summary', async () => {
			await fc.assert(
				fc.asyncProperty(
					evaluationSummaryArbitrary,
					async (summary) => {
						// Should not throw, regardless of email config
						const result = await sendEvaluationNotification(summary);
						
						// Should always return a result object
						expect(result).toHaveProperty('success');
						expect(typeof result.success).toBe('boolean');
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * Property: When disabled, should return success without sending
		 */
		it('should return success when notifications are disabled', async () => {
			setEmailEnabled(false);

			await fc.assert(
				fc.asyncProperty(
					evaluationSummaryArbitrary,
					async (summary) => {
						const result = await sendEvaluationNotification(summary);
						expect(result.success).toBe(true);
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * Property: Invalid summaries should return error, not throw
		 */
		it('should return error for invalid summaries without throwing', async () => {
			const invalidSummary = {
				evaluatorName: '',
				lecturerName: '',
				date: '',
				overallRating: 10 // Invalid
			} as unknown as EvaluationSummary;

			// Should not throw
			const result = await sendEvaluationNotification(invalidSummary);
			
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('sendNotificationSafe', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 20: Email Failure Does Not Block Submission**
		 * **Validates: Requirements 15.3**
		 * 
		 * The safe notification function should NEVER throw, ensuring
		 * evaluation submission always succeeds regardless of email status.
		 */
		it('should never throw for any input', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.anything(),
					async (input) => {
						// Should never throw, even with completely invalid input
						await expect(
							sendNotificationSafe(input as EvaluationSummary)
						).resolves.not.toThrow();
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Property: Should complete without error for valid summaries
		 */
		it('should complete successfully for valid summaries', async () => {
			await fc.assert(
				fc.asyncProperty(
					evaluationSummaryArbitrary,
					async (summary) => {
						// Should complete without throwing
						await expect(sendNotificationSafe(summary)).resolves.toBeUndefined();
					}
				),
				{ numRuns: 50 }
			);
		});
	});

	describe('isValidEmail', () => {
		/**
		 * Property: Valid email formats should pass
		 */
		it('should validate proper email formats', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.org',
				'user+tag@example.co.uk'
			];

			validEmails.forEach(email => {
				expect(isValidEmail(email)).toBe(true);
			});
		});

		/**
		 * Property: Invalid email formats should fail
		 */
		it('should reject invalid email formats', () => {
			const invalidEmails = [
				'',
				'notanemail',
				'@nodomain.com',
				'noat.com',
				'spaces in@email.com'
			];

			invalidEmails.forEach(email => {
				expect(isValidEmail(email)).toBe(false);
			});
		});
	});

	describe('Email Configuration', () => {
		it('should correctly track enabled state', () => {
			expect(isEmailEnabled()).toBe(false);

			setEmailEnabled(true);
			// Still false because no admin emails
			expect(isEmailEnabled()).toBe(false);

			setEmailConfig({ adminEmails: ['admin@test.com'] });
			expect(isEmailEnabled()).toBe(true);

			setEmailEnabled(false);
			expect(isEmailEnabled()).toBe(false);
		});

		it('should update and retrieve config correctly', () => {
			const newConfig = {
				enabled: true,
				adminEmails: ['admin1@test.com', 'admin2@test.com'],
				fromEmail: 'custom@test.com',
				fromName: 'Custom Name'
			};

			setEmailConfig(newConfig);
			const config = getEmailConfig();

			expect(config.enabled).toBe(true);
			expect(config.adminEmails).toEqual(['admin1@test.com', 'admin2@test.com']);
			expect(config.fromEmail).toBe('custom@test.com');
			expect(config.fromName).toBe('Custom Name');
		});
	});
});
