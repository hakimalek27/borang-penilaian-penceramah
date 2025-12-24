<script lang="ts">
	import type { LectureSession, Lecturer, EvaluationRatings } from '$lib/types/database';
	import EvaluationForm from './EvaluationForm.svelte';

	interface Props {
		session: LectureSession & { lecturer: Lecturer | null };
		isExpanded: boolean;
		ratings?: EvaluationRatings;
		recommendation?: boolean | null;
		showRecommendation?: boolean;
		onToggle: () => void;
		onRatingChange: (question: keyof EvaluationRatings, value: number) => void;
		onRecommendationChange: (value: boolean) => void;
	}

	let { 
		session, 
		isExpanded, 
		ratings,
		recommendation,
		showRecommendation = true,
		onToggle, 
		onRatingChange,
		onRecommendationChange
	}: Props = $props();

	const lecturer = $derived(session.lecturer);
</script>

<div class="lecturer-card" class:expanded={isExpanded}>
	<button 
		type="button"
		class="card-header" 
		onclick={onToggle}
		aria-expanded={isExpanded}
	>
		<div class="lecturer-photo">
			{#if lecturer?.gambar_url}
				<img src={lecturer.gambar_url} alt={lecturer.nama} />
			{:else}
				<div class="placeholder-avatar">👤</div>
			{/if}
		</div>
		<div class="lecturer-info">
			<h4 class="lecturer-name">{lecturer?.nama || 'Penceramah'}</h4>
			<div class="lecture-details">
				<span class="lecture-type" class:subuh={session.jenis_kuliah === 'Subuh'} class:tazkirah={session.jenis_kuliah === 'Tazkirah Jumaat'}>
					{session.jenis_kuliah === 'Tazkirah Jumaat' ? session.jenis_kuliah : `Kuliah ${session.jenis_kuliah}`}
				</span>
				<span class="lecture-day">{session.hari}</span>
			</div>
		</div>
		<div class="expand-icon" class:rotated={isExpanded}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</div>
	</button>

	{#if isExpanded}
		<div class="card-body">
			<EvaluationForm 
				sessionId={session.id}
				{ratings}
				{recommendation}
				{showRecommendation}
				{onRatingChange}
				{onRecommendationChange}
			/>
		</div>
	{/if}
</div>

<style>
	.lecturer-card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		overflow: hidden;
		transition: all 0.2s ease;
		border: 1px solid #e8e8e8;
	}

	.lecturer-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: #d0d0d0;
	}

	.lecturer-card.expanded {
		box-shadow: 0 4px 16px rgba(26, 95, 42, 0.15);
		border-color: #1a5f2a;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem;
		width: 100%;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		min-height: 72px;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	.card-header:focus-visible {
		outline: 2px solid #1a5f2a;
		outline-offset: -2px;
	}

	.card-header:active {
		background: #f8f8f8;
	}

	.lecturer-photo {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.lecturer-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-avatar {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
	}

	.lecturer-info {
		flex: 1;
		min-width: 0;
	}

	.lecturer-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.lecture-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.lecture-type {
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
		background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
		color: #1a5f2a;
		font-weight: 600;
	}

	.lecture-type.subuh {
		background: linear-gradient(135deg, #fff3e0, #ffe0b2);
		color: #e65100;
	}

	.lecture-type.tazkirah {
		background: linear-gradient(135deg, #e3f2fd, #bbdefb);
		color: #1565c0;
	}

	.lecture-day {
		color: #888;
		font-weight: 500;
	}

	.expand-icon {
		color: #999;
		transition: transform 0.25s ease;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border-radius: 50%;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
		background: #e8f5e9;
		color: #1a5f2a;
	}

	.expand-icon svg {
		width: 18px;
		height: 18px;
	}

	.card-body {
		padding: 1rem;
		border-top: 1px solid #e8e8e8;
		background: linear-gradient(to bottom, #fafafa, #f5f5f5);
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.card-header {
			padding: 0.75rem;
			gap: 0.625rem;
			min-height: 64px;
		}

		.lecturer-photo {
			width: 46px;
			height: 46px;
		}

		.placeholder-avatar {
			font-size: 1.25rem;
		}

		.lecturer-name {
			font-size: 0.9rem;
		}

		.lecture-details {
			font-size: 0.7rem;
		}

		.expand-icon {
			width: 24px;
			height: 24px;
		}

		.expand-icon svg {
			width: 16px;
			height: 16px;
		}

		.card-body {
			padding: 0.875rem;
		}
	}

	/* Extra small screens */
	@media (max-width: 360px) {
		.lecturer-photo {
			width: 40px;
			height: 40px;
		}

		.lecturer-name {
			font-size: 0.85rem;
		}
	}
</style>
