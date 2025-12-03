-- Sistem Penilaian Kuliah Masjid Al-Muttaqin
-- Initial Database Schema

-- Lecturers table (Penceramah)
CREATE TABLE lecturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  gambar_url TEXT,
  keterangan TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lecture sessions table (Jadual Kuliah)
CREATE TABLE lecture_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2024),
  minggu INTEGER NOT NULL CHECK (minggu >= 1 AND minggu <= 5),
  hari VARCHAR(10) NOT NULL CHECK (hari IN ('Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad')),
  jenis_kuliah VARCHAR(10) NOT NULL CHECK (jenis_kuliah IN ('Subuh', 'Maghrib')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bulan, tahun, minggu, hari, jenis_kuliah)
);

-- Evaluations table (Penilaian)
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES lecture_sessions(id) ON DELETE SET NULL,
  lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  
  -- Evaluator info (Maklumat Penilai)
  nama_penilai VARCHAR(255) NOT NULL,
  umur INTEGER NOT NULL CHECK (umur >= 1 AND umur <= 150),
  alamat TEXT NOT NULL,
  tarikh_penilaian DATE NOT NULL,
  
  -- Ratings 1-4 scale (Penilaian)
  q1_tajuk INTEGER NOT NULL CHECK (q1_tajuk >= 1 AND q1_tajuk <= 4),
  q2_ilmu INTEGER NOT NULL CHECK (q2_ilmu >= 1 AND q2_ilmu <= 4),
  q3_penyampaian INTEGER NOT NULL CHECK (q3_penyampaian >= 1 AND q3_penyampaian <= 4),
  q4_masa INTEGER NOT NULL CHECK (q4_masa >= 1 AND q4_masa <= 4),
  
  -- Recommendation (Cadangan untuk diteruskan)
  cadangan_teruskan BOOLEAN NOT NULL,
  
  -- Optional comments (Komen)
  komen_penceramah TEXT,
  cadangan_masjid TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table (untuk role checking)
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evaluations_session ON evaluations(session_id);
CREATE INDEX idx_evaluations_lecturer ON evaluations(lecturer_id);
CREATE INDEX idx_evaluations_tarikh ON evaluations(tarikh_penilaian);
CREATE INDEX idx_sessions_bulan_tahun ON lecture_sessions(bulan, tahun);
CREATE INDEX idx_sessions_lecturer ON lecture_sessions(lecturer_id);
CREATE INDEX idx_lecturers_sort ON lecturers(sort_order);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_lecturers_updated_at
  BEFORE UPDATE ON lecturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lecture_sessions_updated_at
  BEFORE UPDATE ON lecture_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
