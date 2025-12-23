// TypeScript types untuk database Sistem Penilaian Kuliah

export type Hari = 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu' | 'Ahad';
export type JenisKuliah = 'Subuh' | 'Maghrib' | 'Tazkirah Jumaat';

export interface Lecturer {
	id: string;
	nama: string;
	gambar_url: string | null;
	keterangan: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface LecturerCreate {
	nama: string;
	gambar_url?: string | null;
	keterangan?: string | null;
	sort_order?: number;
}

export interface LecturerUpdate {
	nama?: string;
	gambar_url?: string | null;
	keterangan?: string | null;
	sort_order?: number;
}

export interface LectureSession {
	id: string;
	lecturer_id: string | null;
	bulan: number;
	tahun: number;
	minggu: number;
	hari: Hari;
	jenis_kuliah: JenisKuliah;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	lecturer?: Lecturer;
}

export interface SessionCreate {
	lecturer_id: string;
	bulan: number;
	tahun: number;
	minggu: number;
	hari: Hari;
	jenis_kuliah: JenisKuliah;
	is_active?: boolean;
}

export interface SessionUpdate {
	lecturer_id?: string;
	bulan?: number;
	tahun?: number;
	minggu?: number;
	hari?: Hari;
	jenis_kuliah?: JenisKuliah;
	is_active?: boolean;
}


export interface EvaluationRatings {
	q1_tajuk: number | null;
	q2_ilmu: number | null;
	q3_penyampaian: number | null;
	q4_masa: number | null;
}

export interface Evaluation {
	id: string;
	session_id: string | null;
	lecturer_id: string | null;
	nama_penilai: string;
	umur: number;
	alamat: string;
	tarikh_penilaian: string;
	q1_tajuk: number;
	q2_ilmu: number;
	q3_penyampaian: number;
	q4_masa: number;
	cadangan_teruskan: boolean | null;
	komen_penceramah: string | null;
	cadangan_masjid: string | null;
	created_at: string;
	session?: LectureSession;
	lecturer?: Lecturer;
}

export interface EvaluatorInfo {
	nama: string;
	umur: number;
	alamat: string;
	tarikh: string;
}

export interface EvaluationSubmission {
	evaluator: EvaluatorInfo;
	evaluations: {
		sessionId: string;
		lecturerId: string;
		ratings: EvaluationRatings;
		recommendation: boolean;
	}[];
	komenPenceramah?: string;
	cadanganMasjid?: string;
}

export interface WeeklySchedule {
	[week: number]: {
		sessions: LectureSession[];
		lecturers: Map<string, Lecturer>;
	};
}

export interface LecturerScore {
	lecturerId: string;
	lecturerName: string;
	avgQ1: number;
	avgQ2: number;
	avgQ3: number;
	avgQ4: number;
	avgOverall: number;
	totalEvaluations: number;
}

export interface ReportFilters {
	month: number;
	year: number;
	week: number | null;
	lecturerId: string | null;
	lectureType: JenisKuliah | null;
}

// Validation types
export interface ValidationError {
	field: string;
	message: string;
}

export interface FormValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}
