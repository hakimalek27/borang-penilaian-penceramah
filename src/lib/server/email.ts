/**
 * Email Notification Service
 * Handles sending email notifications to admins when new evaluations are submitted
 */

export interface EvaluationSummary {
	evaluatorName: string;
	lecturerName: string;
	date: string;
	overallRating: number;
	recommendation: boolean;
}

export interface EmailConfig {
	enabled: boolean;
	adminEmails: string[];
	fromEmail?: string;
	fromName?: string;
}

export interface EmailResult {
	success: boolean;
	error?: string;
}

// Default configuration
const DEFAULT_CONFIG: EmailConfig = {
	enabled: false,
	adminEmails: [],
	fromEmail: 'noreply@masjid-almuttaqin.com',
	fromName: 'Sistem Penilaian Kuliah'
};

let currentConfig: EmailConfig = { ...DEFAULT_CONFIG };

/**
 * Get current email configuration
 */
export function getEmailConfig(): EmailConfig {
	return { ...currentConfig };
}

/**
 * Update email configuration
 */
export function setEmailConfig(config: Partial<EmailConfig>): void {
	currentConfig = { ...currentConfig, ...config };
}

/**
 * Check if email notifications are enabled
 */
export function isEmailEnabled(): boolean {
	return currentConfig.enabled && currentConfig.adminEmails.length > 0;
}

/**
 * Enable or disable email notifications
 */
export function setEmailEnabled(enabled: boolean): void {
	currentConfig.enabled = enabled;
}

/**
 * Format evaluation summary for email
 */
export function formatEmailContent(summary: EvaluationSummary): {
	subject: string;
	body: string;
	html: string;
} {
	const { evaluatorName, lecturerName, date, overallRating, recommendation } = summary;
	
	const subject = `Penilaian Baru: ${lecturerName} - ${date}`;
	
	const body = `
Penilaian Baru Diterima

Maklumat Penilaian:
- Penilai: ${evaluatorName}
- Penceramah: ${lecturerName}
- Tarikh: ${date}
- Purata Skor: ${overallRating.toFixed(2)}/4.00
- Cadangan Diteruskan: ${recommendation ? 'Ya' : 'Tidak'}

---
Sistem Penilaian Kuliah
Masjid Al-Muttaqin Wangsa Melawati
`.trim();

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #1a5f2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
		.info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
		.label { font-weight: bold; width: 150px; color: #555; }
		.value { flex: 1; }
		.score { font-size: 1.2em; color: #1a5f2a; font-weight: bold; }
		.recommendation { padding: 5px 10px; border-radius: 4px; display: inline-block; }
		.recommendation.yes { background: #d4edda; color: #155724; }
		.recommendation.no { background: #f8d7da; color: #721c24; }
		.footer { text-align: center; padding: 15px; color: #666; font-size: 0.9em; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>Penilaian Baru Diterima</h2>
		</div>
		<div class="content">
			<div class="info-row">
				<span class="label">Penilai:</span>
				<span class="value">${escapeHtml(evaluatorName)}</span>
			</div>
			<div class="info-row">
				<span class="label">Penceramah:</span>
				<span class="value">${escapeHtml(lecturerName)}</span>
			</div>
			<div class="info-row">
				<span class="label">Tarikh:</span>
				<span class="value">${escapeHtml(date)}</span>
			</div>
			<div class="info-row">
				<span class="label">Purata Skor:</span>
				<span class="value score">${overallRating.toFixed(2)}/4.00</span>
			</div>
			<div class="info-row">
				<span class="label">Cadangan Diteruskan:</span>
				<span class="value">
					<span class="recommendation ${recommendation ? 'yes' : 'no'}">
						${recommendation ? 'Ya' : 'Tidak'}
					</span>
				</span>
			</div>
		</div>
		<div class="footer">
			Sistem Penilaian Kuliah<br>
			Masjid Al-Muttaqin Wangsa Melawati
		</div>
	</div>
</body>
</html>
`.trim();

	return { subject, body, html };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	const htmlEntities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate evaluation summary has all required fields
 */
export function validateEvaluationSummary(summary: EvaluationSummary): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!summary.evaluatorName || typeof summary.evaluatorName !== 'string') {
		errors.push('evaluatorName is required');
	}
	if (!summary.lecturerName || typeof summary.lecturerName !== 'string') {
		errors.push('lecturerName is required');
	}
	if (!summary.date || typeof summary.date !== 'string') {
		errors.push('date is required');
	}
	if (typeof summary.overallRating !== 'number' || summary.overallRating < 1 || summary.overallRating > 4) {
		errors.push('overallRating must be a number between 1 and 4');
	}
	if (typeof summary.recommendation !== 'boolean') {
		errors.push('recommendation must be a boolean');
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Send email notification for new evaluation
 * This is a mock implementation - in production, integrate with Resend, SendGrid, or Supabase Edge Functions
 */
export async function sendEvaluationNotification(summary: EvaluationSummary): Promise<EmailResult> {
	// Validate summary
	const validation = validateEvaluationSummary(summary);
	if (!validation.valid) {
		return { success: false, error: `Invalid summary: ${validation.errors.join(', ')}` };
	}

	// Check if enabled
	if (!isEmailEnabled()) {
		// Return success but don't send - notifications are disabled
		return { success: true };
	}

	const config = getEmailConfig();
	const { subject, html } = formatEmailContent(summary);

	try {
		// In production, replace this with actual email sending logic
		// Example with Resend:
		// const resend = new Resend(process.env.RESEND_API_KEY);
		// await resend.emails.send({
		//   from: `${config.fromName} <${config.fromEmail}>`,
		//   to: config.adminEmails,
		//   subject,
		//   html
		// });

		// For now, log the email (mock implementation)
		console.log('[Email Service] Would send email:', {
			to: config.adminEmails,
			subject,
			htmlLength: html.length
		});

		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('[Email Service] Failed to send email:', errorMessage);
		
		// Return error but don't throw - email failure should not block evaluation submission
		return { success: false, error: errorMessage };
	}
}

/**
 * Send email notification with error handling that doesn't block the main operation
 * This ensures evaluation submission succeeds even if email fails
 */
export async function sendNotificationSafe(summary: EvaluationSummary): Promise<void> {
	try {
		const result = await sendEvaluationNotification(summary);
		if (!result.success && result.error) {
			console.error('[Email Service] Notification failed (non-blocking):', result.error);
		}
	} catch (error) {
		// Catch any unexpected errors - never let email failure propagate
		console.error('[Email Service] Unexpected error (non-blocking):', error);
	}
}
