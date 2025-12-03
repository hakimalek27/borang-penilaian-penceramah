import type { LectureSession, Lecturer, WeeklySchedule } from '$lib/types/database';

/**
 * Groups lecture sessions by week number (1-5)
 * Each session appears in exactly one week group matching its minggu field
 */
export function groupSessionsByWeek(
	sessions: (LectureSession & { lecturer?: Lecturer | null })[]
): WeeklySchedule {
	const grouped: WeeklySchedule = {};

	// Initialize all weeks 1-5
	for (let week = 1; week <= 5; week++) {
		grouped[week] = {
			sessions: [],
			lecturers: new Map()
		};
	}

	// Group sessions by week
	for (const session of sessions) {
		const week = session.minggu;
		if (week >= 1 && week <= 5 && grouped[week]) {
			grouped[week].sessions.push(session);
			
			// Add lecturer to map if exists
			if (session.lecturer) {
				grouped[week].lecturers.set(session.lecturer.id, session.lecturer);
			}
		}
	}

	// Sort sessions within each week by day order
	const dayOrder: Record<string, number> = {
		'Isnin': 1,
		'Selasa': 2,
		'Rabu': 3,
		'Khamis': 4,
		'Jumaat': 5,
		'Sabtu': 6,
		'Ahad': 7
	};

	for (const week of Object.keys(grouped)) {
		grouped[Number(week)].sessions.sort((a, b) => {
			const dayDiff = (dayOrder[a.hari] || 0) - (dayOrder[b.hari] || 0);
			if (dayDiff !== 0) return dayDiff;
			// If same day, sort by lecture type (Subuh before Maghrib)
			return a.jenis_kuliah === 'Subuh' ? -1 : 1;
		});
	}

	return grouped;
}

/**
 * Checks if a session has all required display information
 */
export function hasRequiredLecturerInfo(
	session: LectureSession & { lecturer?: Lecturer | null }
): boolean {
	return (
		session.lecturer !== null &&
		session.lecturer !== undefined &&
		typeof session.lecturer.nama === 'string' &&
		session.lecturer.nama.length > 0 &&
		typeof session.jenis_kuliah === 'string' &&
		typeof session.hari === 'string'
	);
}

/**
 * Formats lecturer card display data
 */
export function formatLecturerCardData(
	session: LectureSession & { lecturer?: Lecturer | null }
): {
	nama: string;
	gambar_url: string | null;
	jenis_kuliah: string;
	hari: string;
} {
	return {
		nama: session.lecturer?.nama || 'Penceramah',
		gambar_url: session.lecturer?.gambar_url || null,
		jenis_kuliah: session.jenis_kuliah,
		hari: session.hari
	};
}
