import type { PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import type { LectureSession, Lecturer } from '$lib/types/database';

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
		.eq('is_active', true)
		.order('minggu', { ascending: true })
		.order('hari', { ascending: true });

	if (sessionsError) {
		console.error('Error fetching sessions:', sessionsError);
	}

	// Group sessions by week
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
	}

	return {
		sessionsByWeek,
		currentMonth,
		currentYear,
		today: now.toISOString().split('T')[0],
		session: null
	};
};
