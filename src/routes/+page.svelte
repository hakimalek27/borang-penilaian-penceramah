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
	let lecturerRatings: Record<string, { ratings: EvaluationRatings }> = $state({});
	
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
				q4_masa: data.ratings.q4_masa
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
			// Transform lecturerRatings to flat format for draft storage
			const flatRatings: Record<string, { q1_tajuk: number | null; q2_ilmu: number | null; q3_penyampaian: number | null; q4_masa: number | null }> = {};
			for (const [id, data] of Object.entries(lecturerRatings)) {
				flatRatings[id] = {
					q1_tajuk: data.ratings.q1_tajuk,
					q2_ilmu: data.ratings.q2_ilmu,
					q3_penyampaian: data.ratings.q3_penyampaian,
					q4_masa: data.ratings.q4_masa
				};
			}
			
			const draftData = {
				evaluatorInfo: {
					nama: evaluator.nama,
					umur: evaluator.umur,
					alamat: evaluator.alamat,
					tarikh: evaluator.tarikh
				},
				selectedLecturers: Array.from(expandedLecturers),
				ratings: flatRatings,
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
			// Transform flat ratings back to nested format
			const nestedRatings: Record<string, { ratings: { q1_tajuk: number | null; q2_ilmu: number | null; q3_penyampaian: number | null; q4_masa: number | null } }> = {};
			for (const [id, ratings] of Object.entries(draft.ratings || {})) {
				nestedRatings[id] = { ratings };
			}
			lecturerRatings = nestedRatings;
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
					ratings: { q1_tajuk: null, q2_ilmu: null, q3_penyampaian: null, q4_masa: null }
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
		}> = [];

		for (const [sessionId, ratingData] of Object.entries(lecturerRatings)) {
			if (isRatingsComplete(ratingData.ratings)) {
				const session = Object.values($state.snapshot(ratingData)).length > 0 
					? findSession(sessionId) 
					: null;
				if (session?.lecturer_id) {
					evaluations.push({
						sessionId,
						lecturerId: session.lecturer_id,
						ratings: ratingData.ratings as EvaluationRatings
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
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
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
									onToggle={() => toggleLecturer(session.id)}
									onRatingChange={(q, v) => updateRating(session.id, q, v)}
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
		align-items: flex-end;
		justify-content: center;
		z-index: 1000;
		padding: 0;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		background: white;
		border-radius: 1.5rem 1.5rem 0 0;
		padding: 1.5rem;
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
		max-width: 100%;
		width: 100%;
		text-align: center;
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
		max-height: 90vh;
		overflow-y: auto;
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(100%);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
	}

	.modal-title {
		font-size: 1.25rem;
		color: #1a5f2a;
		margin-bottom: 0.75rem;
		font-weight: 700;
	}

	.modal-message {
		color: #333;
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 0.5rem;
	}

	.modal-submessage {
		color: #666;
		font-size: 0.85rem;
		font-style: italic;
		margin-bottom: 1.25rem;
	}

	.modal-button {
		background: #1a5f2a;
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		max-width: 280px;
		touch-action: manipulation;
	}

	.modal-button:hover {
		background: #145022;
		transform: scale(1.02);
	}

	.modal-button:active {
		transform: scale(0.98);
	}

	.modal-button.secondary {
		background: #f5f5f5;
		color: #666;
	}

	.modal-button.secondary:hover {
		background: #e8e8e8;
	}

	.modal-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.clear-draft-btn {
		display: block;
		margin: 1rem auto 0;
		background: none;
		border: none;
		color: #999;
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0.75rem 1rem;
		transition: color 0.2s ease;
		touch-action: manipulation;
	}

	.clear-draft-btn:hover {
		color: #dc3545;
	}

	.banner {
		text-align: center;
		margin-bottom: 1.5rem;
		padding-top: 0.5rem;
	}

	.banner-image {
		width: calc(100% + 1.5rem);
		margin-left: -0.75rem;
		max-height: 150px;
		object-fit: cover;
		border-radius: 0;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 1.25rem;
		color: #1a5f2a;
		margin-bottom: 0.25rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.subtitle {
		color: #666;
		font-size: 0.9rem;
	}

	.month-info {
		display: inline-block;
		background: linear-gradient(135deg, #1a5f2a, #2d8a3e);
		color: white;
		font-weight: 600;
		margin-top: 0.75rem;
		padding: 0.5rem 1.25rem;
		border-radius: 2rem;
		font-size: 0.9rem;
	}

	.section-desc {
		color: #666;
		font-size: 0.85rem;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.week-section {
		margin-bottom: 1.25rem;
	}

	.week-title {
		font-size: 0.9rem;
		color: #1a5f2a;
		margin-bottom: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: linear-gradient(90deg, #f0f7f1, transparent);
		border-left: 3px solid #1a5f2a;
		border-radius: 0 0.25rem 0.25rem 0;
		font-weight: 600;
	}

	.lecturer-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.no-lectures {
		color: #999;
		font-style: italic;
		padding: 1rem;
		text-align: center;
		background: #f9f9f9;
		border-radius: 0.5rem;
		font-size: 0.9rem;
	}

	.scale-legend {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, #f0f7f1, #e8f5e9);
		border-radius: 0.75rem;
		font-size: 0.8rem;
		margin-bottom: 1.25rem;
	}

	.scale-legend strong {
		grid-column: 1 / -1;
		color: #1a5f2a;
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.scale-legend span {
		color: #555;
		background: white;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		text-align: center;
		font-weight: 500;
	}

	.submit-section {
		text-align: center;
		padding: 1rem 0;
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
		position: sticky;
		bottom: 0;
		background: linear-gradient(to top, #f5f5f5 80%, transparent);
		margin: 0 -0.75rem;
		padding-left: 0.75rem;
		padding-right: 0.75rem;
	}

	/* Desktop improvements */
	@media (min-width: 640px) {
		.modal-overlay {
			align-items: center;
			padding: 1rem;
		}

		.modal-content {
			border-radius: 1rem;
			max-width: 420px;
			padding: 2rem;
		}

		.modal-buttons {
			flex-direction: row;
			justify-content: center;
		}

		.modal-button {
			width: auto;
		}

		.banner-image {
			width: 100%;
			margin-left: 0;
			max-height: 200px;
			border-radius: 0.75rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.scale-legend {
			display: flex;
			flex-wrap: nowrap;
			gap: 1rem;
		}

		.scale-legend strong {
			width: auto;
		}

		.scale-legend span {
			background: transparent;
			padding: 0;
		}

		.submit-section {
			position: static;
			background: transparent;
			margin: 0;
			padding: 1rem 0 2rem;
		}
	}

	/* Extra small screens */
	@media (max-width: 360px) {
		h1 {
			font-size: 1.1rem;
		}

		.subtitle {
			font-size: 0.8rem;
		}

		.month-info {
			font-size: 0.8rem;
			padding: 0.4rem 1rem;
		}

		.scale-legend {
			font-size: 0.75rem;
		}
	}
</style>
