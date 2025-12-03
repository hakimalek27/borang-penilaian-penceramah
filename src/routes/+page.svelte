<script lang="ts">
	import type { PageData } from './$types';
	import EvaluatorInfo from '$lib/components/form/EvaluatorInfo.svelte';
	import LecturerCard from '$lib/components/form/LecturerCard.svelte';
	import CommentSection from '$lib/components/form/CommentSection.svelte';
	import { FormProgress } from '$lib/components/form';
	import { Button } from '$lib/components/ui';
	import type { EvaluatorInfo as EvaluatorInfoType, EvaluationRatings } from '$lib/types/database';
	import { validateEvaluatorInfo, isRatingsComplete } from '$lib/utils/validation';
	import { calculateProgress, type FormState, type RatingState } from '$lib/utils/progress';
	import { saveDraft, loadDraft, hasDraft, clearDraft, getDraftAge, formatDraftAge } from '$lib/stores/draft';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Form state
	let evaluator: EvaluatorInfoType = $state({
		nama: '',
		umur: 0,
		alamat: '',
		tarikh: data.today
	});

	let evaluatorErrors: Record<string, string> = $state({});
	
	// Track which lecturers are expanded and their ratings
	let expandedLecturers: Set<string> = $state(new Set());
	let lecturerRatings: Record<string, { ratings: EvaluationRatings; recommendation: boolean | null }> = $state({});
	
	// Comments
	let komenPenceramah = $state('');
	let cadanganMasjid = $state('');
	
	// Submission state
	let isSubmitting = $state(false);
	let submitMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let showSuccessModal = $state(false);
	
	// Draft state
	let showDraftModal = $state(false);
	let draftAge = $state<string | null>(null);

	// Calculate form progress
	const formProgress = $derived(() => {
		const ratingsMap = new Map<string, RatingState>();
		for (const [id, data] of Object.entries(lecturerRatings)) {
			ratingsMap.set(id, {
				q1_tajuk: data.ratings.q1_tajuk,
				q2_ilmu: data.ratings.q2_ilmu,
				q3_penyampaian: data.ratings.q3_penyampaian,
				q4_masa: data.ratings.q4_masa,
				recommendation: data.recommendation
			});
		}
		
		const formState: FormState = {
			evaluatorInfo: {
				nama: evaluator.nama,
				umur: evaluator.umur,
				alamat: evaluator.alamat,
				tarikh: evaluator.tarikh
			},
			selectedLecturers: Array.from(expandedLecturers),
			completedRatings: ratingsMap
		};
		
		return calculateProgress(formState);
	});

	// Auto-save draft on changes
	$effect(() => {
		if (browser && (evaluator.nama || expandedLecturers.size > 0)) {
			const draftData = {
				evaluatorInfo: {
					nama: evaluator.nama,
					umur: evaluator.umur,
					alamat: evaluator.alamat,
					tarikh: evaluator.tarikh
				},
				selectedLecturers: Array.from(expandedLecturers),
				ratings: lecturerRatings,
				komenPenceramah,
				cadanganMasjid
			};
			saveDraft(draftData);
		}
	});

	// Check for existing draft on mount
	onMount(() => {
		if (hasDraft()) {
			const age = getDraftAge();
			if (age !== null) {
				draftAge = formatDraftAge(age);
				showDraftModal = true;
			}
		}
	});

	function restoreDraft() {
		const draft = loadDraft();
		if (draft) {
			evaluator = {
				nama: draft.evaluatorInfo.nama,
				umur: typeof draft.evaluatorInfo.umur === 'number' ? draft.evaluatorInfo.umur : parseInt(draft.evaluatorInfo.umur as string) || 0,
				alamat: draft.evaluatorInfo.alamat,
				tarikh: draft.evaluatorInfo.tarikh || data.today
			};
			expandedLecturers = new Set(draft.selectedLecturers);
			lecturerRatings = draft.ratings || {};
			komenPenceramah = draft.komenPenceramah || '';
			cadanganMasjid = draft.cadanganMasjid || '';
		}
		showDraftModal = false;
	}

	function discardDraft() {
		clearDraft();
		showDraftModal = false;
	}

	function closeSuccessModal() {
		showSuccessModal = false;
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Month names in Malay
	const monthNames = [
		'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
		'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
	];

	function toggleLecturer(sessionId: string) {
		if (expandedLecturers.has(sessionId)) {
			expandedLecturers.delete(sessionId);
		} else {
			expandedLecturers.add(sessionId);
			// Initialize ratings if not exists
			if (!lecturerRatings[sessionId]) {
				lecturerRatings[sessionId] = {
					ratings: { q1_tajuk: null, q2_ilmu: null, q3_penyampaian: null, q4_masa: null },
					recommendation: null
				};
			}
		}
		expandedLecturers = new Set(expandedLecturers);
	}

	function updateRating(sessionId: string, question: keyof EvaluationRatings, value: number) {
		if (lecturerRatings[sessionId]) {
			lecturerRatings[sessionId].ratings[question] = value;
		}
	}

	function updateRecommendation(sessionId: string, value: boolean) {
		if (lecturerRatings[sessionId]) {
			lecturerRatings[sessionId].recommendation = value;
		}
	}

	async function handleSubmit() {
		submitMessage = null;
		
		// Validate evaluator info
		const validation = validateEvaluatorInfo(evaluator);
		if (!validation.isValid) {
			evaluatorErrors = {};
			for (const error of validation.errors) {
				evaluatorErrors[error.field] = error.message;
			}
			return;
		}
		evaluatorErrors = {};

		// Collect complete evaluations
		const evaluations: Array<{
			sessionId: string;
			lecturerId: string;
			ratings: EvaluationRatings;
			recommendation: boolean;
		}> = [];

		for (const [sessionId, data] of Object.entries(lecturerRatings)) {
			if (isRatingsComplete(data.ratings) && data.recommendation !== null) {
				const session = Object.values($state.snapshot(data)).length > 0 
					? findSession(sessionId) 
					: null;
				if (session?.lecturer_id) {
					evaluations.push({
						sessionId,
						lecturerId: session.lecturer_id,
						ratings: data.ratings as EvaluationRatings,
						recommendation: data.recommendation
					});
				}
			}
		}

		if (evaluations.length === 0) {
			submitMessage = { 
				type: 'error', 
				text: 'Sila lengkapkan sekurang-kurangnya satu penilaian penceramah.' 
			};
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/evaluations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					evaluator,
					evaluations,
					komenPenceramah: komenPenceramah || null,
					cadanganMasjid: cadanganMasjid || null
				})
			});

			const result = await response.json();

			if (response.ok) {
				// Show success modal
				showSuccessModal = true;
				// Reset form
				resetForm();
			} else {
				submitMessage = { type: 'error', text: result.error || 'Ralat semasa menghantar penilaian.' };
			}
		} catch (error) {
			submitMessage = { type: 'error', text: 'Ralat rangkaian. Sila cuba lagi.' };
		} finally {
			isSubmitting = false;
		}
	}

	function handleClearDraft() {
		if (confirm('Adakah anda pasti mahu padam draft? Semua data yang diisi akan hilang.')) {
			clearDraft();
			resetForm();
			submitMessage = { type: 'success', text: 'Draft telah dipadam.' };
		}
	}

	function findSession(sessionId: string) {
		for (const sessions of Object.values(data.sessionsByWeek)) {
			const found = sessions.find(s => s.id === sessionId);
			if (found) return found;
		}
		return null;
	}

	function resetForm() {
		evaluator = { nama: '', umur: 0, alamat: '', tarikh: data.today };
		expandedLecturers = new Set();
		lecturerRatings = {};
		komenPenceramah = '';
		cadanganMasjid = '';
		clearDraft();
	}
</script>

<!-- Draft Restore Modal -->
{#if showDraftModal}
	<div class="modal-overlay" onclick={discardDraft}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-icon">📝</div>
			<h2 class="modal-title">Draft Ditemui</h2>
			<p class="modal-message">
				Anda mempunyai draft borang yang belum dihantar dari {draftAge}.
			</p>
			<p class="modal-submessage">
				Adakah anda mahu meneruskan mengisi borang tersebut?
			</p>
			<div class="modal-buttons">
				<button class="modal-button" onclick={restoreDraft}>
					Ya, Teruskan
				</button>
				<button class="modal-button secondary" onclick={discardDraft}>
					Tidak, Mula Baru
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Success Modal -->
{#if showSuccessModal}
	<div class="modal-overlay" onclick={closeSuccessModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-icon">✅</div>
			<h2 class="modal-title">Terima Kasih!</h2>
			<p class="modal-message">
				Penilaian anda telah berjaya dihantar dan akan disemak oleh pihak pentadbiran Masjid Al-Muttaqin.
			</p>
			<p class="modal-submessage">
				Jazakallahu khairan atas maklum balas anda. Semoga Allah memberkati usaha kita bersama.
			</p>
			<button class="modal-button" onclick={closeSuccessModal}>
				Tutup
			</button>
		</div>
	</div>
{/if}

<main class="container">
	<!-- Banner -->
	<header class="banner">
		<img 
			src="/images/masjid-banner.jpg" 
			alt="Masjid Al-Muttaqin Wangsa Melawati" 
			class="banner-image"
			onerror={(e) => (e.currentTarget.style.display = 'none')}
		/>
		<h1>Borang Maklum Balas Kuliah Bulanan</h1>
		<p class="subtitle">Masjid Al-Muttaqin Wangsa Melawati, Kuala Lumpur</p>
		<p class="month-info">{monthNames[data.currentMonth - 1]} {data.currentYear}</p>
	</header>

	<!-- Progress Indicator -->
	<FormProgress progress={formProgress()} />

	{#if submitMessage}
		<div class="alert alert-{submitMessage.type}">
			{submitMessage.text}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<!-- Bahagian A: Maklumat Penilai -->
		<section class="section">
			<h2 class="section-title">Bahagian A: Maklumat Penilai</h2>
			<EvaluatorInfo 
				bind:nama={evaluator.nama}
				bind:umur={evaluator.umur}
				bind:alamat={evaluator.alamat}
				bind:tarikh={evaluator.tarikh}
				errors={evaluatorErrors}
			/>
		</section>

		<!-- Bahagian B: Pilihan Penceramah -->
		<section class="section">
			<h2 class="section-title">Bahagian B: Penilaian Penceramah</h2>
			<p class="section-desc">Klik pada kad penceramah untuk memberi penilaian.</p>
			
			{#each [1, 2, 3, 4, 5] as week}
				<div class="week-section">
					<h3 class="week-title">Minggu {week}</h3>
					{#if data.sessionsByWeek[week]?.length > 0}
						<div class="lecturer-grid">
							{#each data.sessionsByWeek[week] as session}
								<LecturerCard 
									{session}
									isExpanded={expandedLecturers.has(session.id)}
									ratings={lecturerRatings[session.id]?.ratings}
									recommendation={lecturerRatings[session.id]?.recommendation}
									onToggle={() => toggleLecturer(session.id)}
									onRatingChange={(q, v) => updateRating(session.id, q, v)}
									onRecommendationChange={(v) => updateRecommendation(session.id, v)}
								/>
							{/each}
						</div>
					{:else}
						<p class="no-lectures">Tiada kuliah dijadualkan untuk minggu ini.</p>
					{/if}
				</div>
			{/each}
		</section>

		<!-- Bahagian C: Komen -->
		<section class="section">
			<h2 class="section-title">Bahagian C: Komen & Cadangan (Pilihan)</h2>
			<CommentSection 
				bind:komenPenceramah
				bind:cadanganMasjid
			/>
		</section>

		<!-- Petunjuk Skala -->
		<div class="scale-legend">
			<strong>Petunjuk Skala:</strong>
			<span>1 = Sangat Rendah</span>
			<span>2 = Rendah</span>
			<span>3 = Tinggi</span>
			<span>4 = Sangat Tinggi</span>
		</div>

		<!-- Submit Button -->
		<div class="submit-section">
			<Button type="submit" size="lg" loading={isSubmitting}>
				Hantar Penilaian
			</Button>
			{#if formProgress() > 0}
				<button type="button" class="clear-draft-btn" onclick={handleClearDraft}>
					🗑️ Padam Draft
				</button>
			{/if}
		</div>
	</form>
</main>

<style>
	/* Success Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.modal-title {
		font-size: 1.5rem;
		color: #1a5f2a;
		margin-bottom: 1rem;
	}

	.modal-message {
		color: #333;
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	.modal-submessage {
		color: #666;
		font-size: 0.9rem;
		font-style: italic;
		margin-bottom: 1.5rem;
	}

	.modal-button {
		background: #1a5f2a;
		color: white;
		border: none;
		padding: 0.875rem 2rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.modal-button:hover {
		background: #145022;
	}

	.modal-button.secondary {
		background: #6c757d;
	}

	.modal-button.secondary:hover {
		background: #5a6268;
	}

	.modal-buttons {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.clear-draft-btn {
		display: block;
		margin: 1rem auto 0;
		background: none;
		border: none;
		color: #999;
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0.5rem 1rem;
		transition: color 0.2s ease;
	}

	.clear-draft-btn:hover {
		color: #dc3545;
	}

	.banner {
		text-align: center;
		margin-bottom: 2rem;
	}

	.banner-image {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
		border-radius: 0.75rem;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		color: #1a5f2a;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: #666;
		font-size: 1rem;
	}

	.month-info {
		color: #1a5f2a;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.section-desc {
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}

	.week-section {
		margin-bottom: 1.5rem;
	}

	.week-title {
		font-size: 1rem;
		color: #333;
		margin-bottom: 0.75rem;
		padding-left: 0.5rem;
		border-left: 3px solid #1a5f2a;
	}

	.lecturer-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.no-lectures {
		color: #999;
		font-style: italic;
		padding: 1rem;
		text-align: center;
		background: #f9f9f9;
		border-radius: 0.5rem;
	}

	.scale-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		padding: 1rem;
		background: #f0f7f1;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	.scale-legend strong {
		width: 100%;
		color: #1a5f2a;
	}

	.scale-legend span {
		color: #555;
	}

	.submit-section {
		text-align: center;
		padding: 1rem 0 2rem;
	}

	@media (min-width: 640px) {
		h1 {
			font-size: 1.75rem;
		}

		.scale-legend {
			flex-wrap: nowrap;
		}

		.scale-legend strong {
			width: auto;
		}
	}
</style>
