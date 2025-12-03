<script lang="ts">
	import type { LectureSession, Lecturer, EvaluationRatings } from '$lib/types/database';
	import EvaluationForm from './EvaluationForm.svelte';

	interface Props {
		session: LectureSession & { lecturer: Lecturer | null };
		isExpanded: boolean;
		ratings?: EvaluationRatings;
		recommendation?: boolean | null;
		onToggle: () => void;
		onRatingChange: (question: keyof EvaluationRatings, value: number) => void;
		onRecommendationChange: (value: boolean) => void;
	}

	let { 
		session, 
		isExpanded, 
		ratings,
		recommendation,
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
				<span class="lecture-type" class:subuh={session.jenis_kuliah === 'Subuh'}>
					Kuliah {session.jenis_kuliah}
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
				{ratings}
				{recommendation}
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
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: box-shadow 0.2s ease;
	}

	.lecturer-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.lecturer-card.expanded {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		width: 100%;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		min-height: 80px;
	}

	.card-header:focus {
		outline: 2px solid #1a5f2a;
		outline-offset: -2px;
	}

	.lecturer-photo {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: #f0f0f0;
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
		font-size: 1.75rem;
		background: #e0e0e0;
	}

	.lecturer-info {
		flex: 1;
		min-width: 0;
	}

	.lecturer-name {
		font-size: 1rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.lecture-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.lecture-type {
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: #e8f5e9;
		color: #1a5f2a;
		font-weight: 500;
	}

	.lecture-type.subuh {
		background: #fff3e0;
		color: #e65100;
	}

	.lecture-day {
		color: #666;
	}

	.expand-icon {
		color: #666;
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
	}

	.card-body {
		padding: 1rem;
		border-top: 1px solid #eee;
		background: #fafafa;
	}
</style>
