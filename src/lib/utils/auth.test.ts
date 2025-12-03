import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Admin route paths that require authentication
 */
const protectedAdminRoutes = [
	'/admin/dashboard',
	'/admin/penceramah',
	'/admin/jadual',
	'/admin/laporan'
];

/**
 * Routes that don't require authentication
 */
const publicRoutes = [
	'/admin/login',
	'/',
	'/api/evaluations'
];

/**
 * Simulates the auth guard logic from +layout.server.ts
 */
function shouldRedirectToLogin(pathname: string, isAuthenticated: boolean, isAdmin: boolean): boolean {
	// Login page is always accessible
	if (pathname === '/admin/login') {
		return false;
	}

	// Non-admin routes don't need auth check
	if (!pathname.startsWith('/admin')) {
		return false;
	}

	// Admin routes require authentication
	if (!isAuthenticated) {
		return true;
	}

	// Authenticated but not admin should redirect
	if (!isAdmin) {
		return true;
	}

	return false;
}

/**
 * Checks if a path is a protected admin route
 */
function isProtectedAdminRoute(pathname: string): boolean {
	return pathname.startsWith('/admin') && pathname !== '/admin/login';
}

/**
 * **Feature: sistem-penilaian-kuliah, Property 7: Admin Route Protection**
 * **Validates: Requirements 6.4**
 * 
 * For any route under /admin/* (except /admin/login), when accessed by an unauthenticated user,
 * the request SHALL result in a redirect to /admin/login.
 */
describe('Property 7: Admin Route Protection', () => {
	it('should redirect unauthenticated users from all protected admin routes', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...protectedAdminRoutes),
				(route) => {
					const shouldRedirect = shouldRedirectToLogin(route, false, false);
					expect(shouldRedirect).toBe(true);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not redirect from login page regardless of auth status', () => {
		fc.assert(
			fc.property(
				fc.boolean(),
				fc.boolean(),
				(isAuthenticated, isAdmin) => {
					const shouldRedirect = shouldRedirectToLogin('/admin/login', isAuthenticated, isAdmin);
					expect(shouldRedirect).toBe(false);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should redirect authenticated non-admin users from protected routes', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...protectedAdminRoutes),
				(route) => {
					// Authenticated but not admin
					const shouldRedirect = shouldRedirectToLogin(route, true, false);
					expect(shouldRedirect).toBe(true);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should allow authenticated admin users to access protected routes', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...protectedAdminRoutes),
				(route) => {
					// Authenticated and is admin
					const shouldRedirect = shouldRedirectToLogin(route, true, true);
					expect(shouldRedirect).toBe(false);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not affect public routes', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...publicRoutes.filter(r => !r.startsWith('/admin'))),
				fc.boolean(),
				fc.boolean(),
				(route, isAuthenticated, isAdmin) => {
					const shouldRedirect = shouldRedirectToLogin(route, isAuthenticated, isAdmin);
					expect(shouldRedirect).toBe(false);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should correctly identify protected admin routes', () => {
		// Generate random admin sub-paths
		const adminPathArb = fc.stringMatching(/^\/admin\/[a-z]+$/).filter(
			p => p !== '/admin/login' && p.length > 7
		);

		fc.assert(
			fc.property(adminPathArb, (path) => {
				expect(isProtectedAdminRoute(path)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	it('should not mark /admin/login as protected', () => {
		expect(isProtectedAdminRoute('/admin/login')).toBe(false);
	});
});

describe('Auth Guard Edge Cases', () => {
	it('should handle root admin path', () => {
		// /admin should be protected
		expect(shouldRedirectToLogin('/admin', false, false)).toBe(true);
		expect(shouldRedirectToLogin('/admin', true, true)).toBe(false);
	});

	it('should handle nested admin paths', () => {
		const nestedPaths = [
			'/admin/penceramah/123',
			'/admin/jadual/edit',
			'/admin/laporan/export'
		];

		for (const path of nestedPaths) {
			// Unauthenticated should redirect
			expect(shouldRedirectToLogin(path, false, false)).toBe(true);
			// Authenticated admin should not redirect
			expect(shouldRedirectToLogin(path, true, true)).toBe(false);
		}
	});
});
