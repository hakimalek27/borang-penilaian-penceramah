/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			admin: { id: string; email: string } | null;
		}
		interface PageData {
			admin?: { id: string; email: string } | null;
		}
	}
}

export {};
