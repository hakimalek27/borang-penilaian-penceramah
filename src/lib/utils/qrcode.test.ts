/**
 * QR Code Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 18: QR Code Round-Trip**
 * **Validates: Requirements 14.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateQRCode, validateQRCodeUrl, generateQRCodeBuffer } from './qrcode';

describe('QR Code Utils', () => {
	describe('generateQRCode', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 18: QR Code Round-Trip**
		 * **Validates: Requirements 14.2**
		 * 
		 * For any valid URL string, when encoded into a QR code,
		 * the generation should succeed and produce a valid data URL
		 */
		it('should generate valid QR code data URL for any valid URL', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.webUrl(),
					async (url) => {
						const dataUrl = await generateQRCode(url);
						
						// Should return a valid data URL
						expect(dataUrl).toMatch(/^data:image\/png;base64,/);
						
						// Should have base64 content
						const base64Part = dataUrl.split(',')[1];
						expect(base64Part).toBeTruthy();
						expect(base64Part.length).toBeGreaterThan(0);
						
						// Should be valid base64
						expect(() => Buffer.from(base64Part, 'base64')).not.toThrow();
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Property: QR code generation is deterministic
		 * Same URL should produce same QR code
		 */
		it('should generate same QR code for same URL', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.webUrl(),
					async (url) => {
						const qr1 = await generateQRCode(url);
						const qr2 = await generateQRCode(url);
						
						expect(qr1).toBe(qr2);
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * Property: Different URLs should produce different QR codes
		 */
		it('should generate different QR codes for different URLs', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.webUrl(),
					fc.webUrl(),
					async (url1, url2) => {
						fc.pre(url1 !== url2);
						
						const qr1 = await generateQRCode(url1);
						const qr2 = await generateQRCode(url2);
						
						expect(qr1).not.toBe(qr2);
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should throw error for empty URL', async () => {
			await expect(generateQRCode('')).rejects.toThrow('URL is required');
		});

		it('should throw error for non-string URL', async () => {
			// @ts-expect-error Testing invalid input
			await expect(generateQRCode(null)).rejects.toThrow('URL is required');
			// @ts-expect-error Testing invalid input
			await expect(generateQRCode(undefined)).rejects.toThrow('URL is required');
		});

		it('should accept custom options', async () => {
			const url = 'https://example.com';
			const dataUrl = await generateQRCode(url, {
				width: 200,
				margin: 4,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
			
			expect(dataUrl).toMatch(/^data:image\/png;base64,/);
		});
	});

	describe('validateQRCodeUrl', () => {
		/**
		 * Property: All valid URLs should pass validation
		 */
		it('should validate all valid URLs', () => {
			fc.assert(
				fc.property(
					fc.webUrl(),
					(url) => {
						expect(validateQRCodeUrl(url)).toBe(true);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Property: Empty or null URLs should fail validation
		 */
		it('should reject empty URLs', () => {
			expect(validateQRCodeUrl('')).toBe(false);
			// @ts-expect-error Testing invalid input
			expect(validateQRCodeUrl(null)).toBe(false);
			// @ts-expect-error Testing invalid input
			expect(validateQRCodeUrl(undefined)).toBe(false);
		});

		/**
		 * Property: Non-empty strings within QR code capacity should be valid
		 */
		it('should accept non-empty strings within capacity', () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1, maxLength: 2953 }),
					(str) => {
						// Should return true for any non-empty string within capacity
						expect(validateQRCodeUrl(str)).toBe(true);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('generateQRCodeBuffer', () => {
		/**
		 * Property: Buffer generation should work for any valid URL
		 */
		it('should generate valid buffer for any valid URL', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.webUrl(),
					async (url) => {
						const buffer = await generateQRCodeBuffer(url);
						
						// Should return a Buffer
						expect(Buffer.isBuffer(buffer)).toBe(true);
						
						// Should have content
						expect(buffer.length).toBeGreaterThan(0);
						
						// Should be valid PNG (starts with PNG signature)
						const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
						expect(buffer.subarray(0, 4).equals(pngSignature)).toBe(true);
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should throw error for empty URL', async () => {
			await expect(generateQRCodeBuffer('')).rejects.toThrow('URL is required');
		});
	});

	describe('Integration: QR Code Generation Flow', () => {
		/**
		 * Property: Full flow - URL validation + QR generation should work together
		 */
		it('should validate and generate QR code for valid URLs', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.webUrl(),
					async (url) => {
						// First validate
						const isValid = validateQRCodeUrl(url);
						expect(isValid).toBe(true);
						
						// Then generate
						const dataUrl = await generateQRCode(url);
						expect(dataUrl).toMatch(/^data:image\/png;base64,/);
					}
				),
				{ numRuns: 50 }
			);
		});
	});
});
