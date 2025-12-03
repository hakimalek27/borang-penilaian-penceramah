<script lang="ts">
	import { Button, Input } from '$lib/components/ui';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	const error = $derived(form?.error || '');
</script>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1>Panel Admin</h1>
			<p>Masjid Al-Muttaqin Wangsa Melawati</p>
		</div>

		{#if error}
			<div class="alert alert-error">
				{error}
			</div>
		{/if}

		<form method="POST" use:enhance={() => {
			isLoading = true;
			return async ({ update }) => {
				isLoading = false;
				await update();
			};
		}}>
			<Input 
				label="Email"
				type="email"
				name="email"
				bind:value={email}
				placeholder="admin@example.com"
				required
				autocomplete="email"
			/>

			<Input 
				label="Kata Laluan"
				type="password"
				name="password"
				bind:value={password}
				placeholder="Masukkan kata laluan"
				required
				autocomplete="current-password"
			/>

			<Button type="submit" size="lg" loading={isLoading}>
				Log Masuk
			</Button>
		</form>

		<div class="back-link">
			<a href="/">← Kembali ke Borang Penilaian</a>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
	}

	.login-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-header h1 {
		color: #1a5f2a;
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.login-header p {
		color: #666;
		font-size: 0.9rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	form :global(button) {
		width: 100%;
		margin-top: 1rem;
	}

	.back-link {
		text-align: center;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
	}

	.back-link a {
		color: #666;
		font-size: 0.9rem;
	}

	.back-link a:hover {
		color: #1a5f2a;
	}

	.alert-error {
		background: #ffebee;
		color: #c62828;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
</style>
