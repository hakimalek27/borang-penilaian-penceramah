import type { PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import type { LectureSession, Lecturer, Hari, JenisKuliah } from '$lib/types/database';

// Define day order (Isnin = 1, Ahad = 7)
const dayOrder: Record<Hari, number> = {
	'Isnin': 1,
	'Selasa': 2,
	'Rabu': 3,
	'Khamis': 4,
	'Jumaat': 5,
	'Sabtu': 6,
	'Ahad': 7
};

// Define lecture type order (Subuh first, then Tazkirah Jumaat, then Maghrib)
const lectureTypeOrder: Record<JenisKuliah, number> = {
	'Subuh': 1,
	'Tazkirah Jumaat': 2,
	'Maghrib': 3
};

// Sort sessions by day and lecture type
function sortSessions(sessions: (LectureSession & { lecturer: Lecturer | null })[]) {
	return sessions.sort((a, b) => {
		// First sort by day
		const dayDiff = dayOrder[a.hari] - dayOrder[b.hari];
		if (dayDiff !== 0) return dayDiff;
		
		// Then sort by lecture type
		return lectureTypeOrder[a.jenis_kuliah] - lectureTypeOrder[b.jenis_kuliah];
	});
}

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createClient(cookies);
	
	// Get current month and year
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	// Fetch active sessions for current month with lecturer info
	const { data: sessions, error: sessionsError } = await supabase
		.from('lecture_sessions')
		.select(`
			*,
			lecturer:lecturers(*)
		`)
		.eq('bulan', currentMonth)
		.eq('tahun', currentYear)
		.eq('is_active', true);

	if (sessionsError) {
		console.error('Error fetching sessions:', sessionsError);
	}

	// Fetch form settings
	const { data: settings } = await supabase
		.from('settings')
		.select('key, value')
		.eq('key', 'show_recommendation_section')
		.single();

	const showRecommendationSection = settings?.value !== false;

	// Group sessions by week and sort properly
	const sessionsByWeek: Record<number, (LectureSession & { lecturer: Lecturer | null })[]> = {};
	
	for (let week = 1; week <= 5; week++) {
		sessionsByWeek[week] = [];
	}

	if (sessions) {
		for (const session of sessions) {
			if (sessionsByWeek[session.minggu]) {
				sessionsByWeek[session.minggu].push(session);
			}
		}
		
		// Sort each week's sessions
		for (let week = 1; week <= 5; week++) {
			sessionsByWeek[week] = sortSessions(sessionsByWeek[week]);
		}
	}

	return {
		sessionsByWeek,
		currentMonth,
		currentYear,
		today: now.toISOString().split('T')[0],
		session: null,
		showRecommendationSection
	};
};
