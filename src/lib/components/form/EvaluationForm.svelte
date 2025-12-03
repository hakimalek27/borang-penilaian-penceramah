<script lang="ts">
	import { RadioGroup } from '$lib/components/ui';
	import type { EvaluationRatings } from '$lib/types/database';

	interface Props {
		ratings?: EvaluationRatings;
		recommendation?: boolean | null;
		onRatingChange: (question: keyof EvaluationRatings, value: number) => void;
		onRecommendationChange: (value: boolean) => void;
	}

	let { 
		ratings = { q1_tajuk: null, q2_ilmu: null, q3_penyampaian: null, q4_masa: null },
		recommendation = null,
		onRatingChange,
		onRecommendationChange
	}: Props = $props();

	const ratingOptions = [
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' },
		{ value: 4, label: '4' }
	];

	const recommendationOptions = [
		{ value: true, label: 'Ya' },
		{ value: false, label: 'Tidak' }
	];

	const questions = [
		{ key: 'q1_tajuk' as const, text: 'Penceramah mengikut tajuk yang telah ditetapkan' },
		{ key: 'q2_ilmu' as const, text: 'Penceramah mempunyai ilmu pengetahuan dalam tajuk yang disampaikan' },
		{ key: 'q3_penyampaian' as const, text: 'Penyampaian penceramah jelas dan berkesan' },
		{ key: 'q4_masa' as const, text: 'Penceramah menepati jadual dan masa yang ditetapkan' }
	];

	// Local state for binding
	let localRatings = $state({
		q1_tajuk: ratings?.q1_tajuk ?? null,
		q2_ilmu: ratings?.q2_ilmu ?? null,
		q3_penyampaian: ratings?.q3_penyampaian ?? null,
		q4_masa: ratings?.q4_masa ?? null
	});

	let localRecommendation = $state<boolean | null>(recommendation ?? null);

	// Watch for changes and propagate
	$effect(() => {
		if (localRatings.q1_tajuk !== null && localRatings.q1_tajuk !== ratings?.q1_tajuk) {
			onRatingChange('q1_tajuk', localRatings.q1_tajuk);
		}
	});

	$effect(() => {
		if (localRatings.q2_ilmu !== null && localRatings.q2_ilmu !== ratings?.q2_ilmu) {
			onRatingChange('q2_ilmu', localRatings.q2_ilmu);
		}
	});

	$effect(() => {
		if (localRatings.q3_penyampaian !== null && localRatings.q3_penyampaian !== ratings?.q3_penyampaian) {
			onRatingChange('q3_penyampaian', localRatings.q3_penyampaian);
		}
	});

	$effect(() => {
		if (localRatings.q4_masa !== null && localRatings.q4_masa !== ratings?.q4_masa) {
			onRatingChange('q4_masa', localRatings.q4_masa);
		}
	});

	$effect(() => {
		if (localRecommendation !== null && localRecommendation !== recommendation) {
			onRecommendationChange(localRecommendation);
		}
	});
</script>

<div class="evaluation-form">
	<p class="form-instruction">Sila berikan penilaian anda (1-4):</p>
	
	{#each questions as question, index}
		<div class="question-row">
			<span class="question-number">{index + 1}.</span>
			<div class="question-content">
				<p class="question-text">{question.text}</p>
				<div class="rating-options">
					{#each ratingOptions as option}
						<label class="rating-option">
							<input 
								type="radio" 
								name={question.key}
								value={option.value}
								checked={localRatings[question.key] === option.value}
								onchange={() => localRatings[question.key] = option.value}
							/>
							<span class="rating-label">{option.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
	{/each}

	<div class="recommendation-section">
		<p class="question-text">Cadangan untuk diteruskan?</p>
		<div class="recommendation-options">
			{#each recommendationOptions as option}
				<label class="recommendation-option">
					<input 
						type="radio" 
						name="recommendation"
						value={option.value}
						checked={localRecommendation === option.value}
						onchange={() => localRecommendation = option.value}
					/>
					<span class="recommendation-label">{option.label}</span>
				</label>
			{/each}
		</div>
	</div>
</div>

<style>
	.evaluation-form {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.form-instruction {
		font-size: 0.8rem;
		color: #666;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.question-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.625rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e8e8e8;
	}

	.question-number {
		font-weight: 700;
		color: #1a5f2a;
		min-width: 1.25rem;
		font-size: 0.85rem;
	}

	.question-content {
		flex: 1;
	}

	.question-text {
		font-size: 0.85rem;
		color: #333;
		margin-bottom: 0.625rem;
		line-height: 1.4;
	}

	.rating-options {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-start;
	}

	.rating-option {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		touch-action: manipulation;
	}

	.rating-option input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.rating-label {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 2px solid #e0e0e0;
		border-radius: 0.625rem;
		font-weight: 700;
		font-size: 1rem;
		color: #888;
		transition: all 0.15s ease;
		background: white;
	}

	.rating-option input:checked + .rating-label {
		background: linear-gradient(135deg, #1a5f2a, #2d8a3e);
		border-color: #1a5f2a;
		color: white;
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(26, 95, 42, 0.3);
	}

	.rating-option:active .rating-label {
		transform: scale(0.95);
	}

	.rating-option input:focus-visible + .rating-label {
		box-shadow: 0 0 0 3px rgba(26, 95, 42, 0.3);
	}

	.recommendation-section {
		margin-top: 0.25rem;
		padding: 0.75rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e8e8e8;
	}

	.recommendation-section .question-text {
		font-weight: 600;
		color: #1a5f2a;
		margin-bottom: 0.75rem;
	}

	.recommendation-options {
		display: flex;
		gap: 0.75rem;
	}

	.recommendation-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.75rem 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 0.625rem;
		transition: all 0.15s ease;
		background: white;
		touch-action: manipulation;
	}

	.recommendation-option:active {
		transform: scale(0.98);
	}

	.recommendation-option:has(input:checked) {
		border-color: #1a5f2a;
		background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
	}

	.recommendation-option input {
		accent-color: #1a5f2a;
		width: 18px;
		height: 18px;
	}

	.recommendation-label {
		font-weight: 600;
		color: #333;
		font-size: 0.95rem;
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.question-row {
			padding: 0.5rem;
		}

		.question-text {
			font-size: 0.8rem;
		}

		.rating-label {
			width: 40px;
			height: 40px;
			font-size: 0.95rem;
		}

		.rating-options {
			gap: 0.25rem;
		}

		.recommendation-option {
			padding: 0.625rem 0.75rem;
		}

		.recommendation-label {
			font-size: 0.9rem;
		}
	}

	/* Extra small screens */
	@media (max-width: 360px) {
		.rating-label {
			width: 36px;
			height: 36px;
			font-size: 0.9rem;
			border-radius: 0.5rem;
		}
	}
</style>
