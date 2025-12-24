<script lang="ts">
	import { RadioGroup } from '$lib/components/ui';
	import type { EvaluationRatings } from '$lib/types/database';

	interface Props {
		sessionId: string;
		ratings?: EvaluationRatings;
		recommendation?: boolean | null;
		showRecommendation?: boolean;
		onRatingChange: (question: keyof EvaluationRatings, value: number) => void;
		onRecommendationChange: (value: boolean) => void;
	}

	let { 
		sessionId,
		ratings = { q1_tajuk: null, q2_ilmu: null, q3_penyampaian: null, q4_masa: null },
		recommendation = null,
		showRecommendation = true,
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

	// Handle rating change directly without local state
	function handleRatingChange(question: keyof EvaluationRatings, value: number) {
		onRatingChange(question, value);
	}

	function handleRecommendationChange(value: boolean) {
		onRecommendationChange(value);
	}
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
								name="{sessionId}_{question.key}"
								value={option.value}
								checked={ratings?.[question.key] === option.value}
								onchange={() => handleRatingChange(question.key, option.value)}
							/>
							<span class="rating-label">{option.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
	{/each}

	{#if showRecommendation}
		<div class="recommendation-section">
			<p class="question-text">Cadangan untuk diteruskan?</p>
			<div class="recommendation-options">
				{#each recommendationOptions as option}
					<label class="recommendation-option">
						<input 
							type="radio" 
							name="{sessionId}_recommendation"
							value={option.value}
							checked={recommendation === option.value}
							onchange={() => handleRecommendationChange(option.value)}
						/>
						<span class="recommendation-label">{option.label}</span>
					</label>
				{/each}
			</div>
		</div>
	{/if}
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
