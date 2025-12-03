<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Don't show admin layout on login page
	const isLoginPage = $derived($page.url.pathname === '/admin/login');

	const menuItems = [
		{ href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/penceramah', label: 'Tetapan Penceramah', icon: '👤' },
		{ href: '/admin/jadual', label: 'Tetapan Jadual', icon: '📅' },
		{ href: '/admin/laporan', label: 'Laporan Penilaian', icon: '📈' },
		{ href: '/admin/komen', label: 'Komen & Cadangan', icon: '💬' },
		{ href: '/admin/qrcode', label: 'QR Code Borang', icon: '📱' }
	];

	let sidebarOpen = $state(false);

	async function handleLogout() {
		await fetch('/admin/logout', { method: 'POST' });
		goto('/admin/login');
	}
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="admin-layout">
		<!-- Mobile header -->
		<header class="mobile-header">
			<button class="menu-toggle" onclick={() => sidebarOpen = !sidebarOpen}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
			</button>
			<span class="header-title">Panel Admin</span>
		</header>

		<!-- Sidebar -->
		<aside class="sidebar" class:open={sidebarOpen}>
			<div class="sidebar-header">
				<h2>Panel Admin</h2>
				<p>Masjid Al-Muttaqin</p>
			</div>

			<nav class="sidebar-nav">
				{#each menuItems as item}
					<a 
						href={item.href} 
						class="nav-item"
						class:active={$page.url.pathname === item.href}
						onclick={() => sidebarOpen = false}
					>
						<span class="nav-icon">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
					</a>
				{/each}
			</nav>

			<div class="sidebar-footer">
				<div class="admin-info">
					<span class="admin-email">{data.admin?.email || 'Admin'}</span>
				</div>
				<button class="logout-btn" onclick={handleLogout}>
					Log Keluar
				</button>
			</div>
		</aside>

		<!-- Overlay for mobile -->
		{#if sidebarOpen}
			<div class="overlay" onclick={() => sidebarOpen = false}></div>
		{/if}

		<!-- Main content -->
		<main class="main-content">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
	}

	.mobile-header {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 56px;
		background: #1a5f2a;
		color: white;
		padding: 0 1rem;
		align-items: center;
		gap: 1rem;
		z-index: 100;
	}

	.menu-toggle {
		background: none;
		border: none;
		color: white;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		font-weight: 600;
	}

	.sidebar {
		width: 260px;
		background: #1a5f2a;
		color: white;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 200;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header h2 {
		font-size: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.sidebar-header p {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.nav-item.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border-left: 3px solid white;
	}

	.nav-icon {
		font-size: 1.25rem;
	}

	.sidebar-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.admin-info {
		margin-bottom: 0.75rem;
	}

	.admin-email {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.logout-btn {
		width: 100%;
		padding: 0.625rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: white;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.overlay {
		display: none;
	}

	.main-content {
		flex: 1;
		margin-left: 260px;
		padding: 2rem;
		background: #f5f5f5;
		min-height: 100vh;
	}

	@media (max-width: 768px) {
		.mobile-header {
			display: flex;
		}

		.sidebar {
			transform: translateX(-100%);
			transition: transform 0.3s ease;
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 150;
		}

		.main-content {
			margin-left: 0;
			padding: 1rem;
			padding-top: calc(56px + 1rem);
		}
	}
</style>
