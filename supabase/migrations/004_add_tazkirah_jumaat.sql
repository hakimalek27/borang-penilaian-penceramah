-- Migration: Tambah jenis kuliah "Tazkirah Jumaat"
-- Sistem Penilaian Kuliah Masjid Al-Muttaqin

-- Step 1: Ubah saiz column jenis_kuliah dari VARCHAR(10) ke VARCHAR(20)
-- "Tazkirah Jumaat" = 15 karakter, perlu lebih dari 10
ALTER TABLE lecture_sessions 
ALTER COLUMN jenis_kuliah TYPE VARCHAR(20);

-- Step 2: Drop CHECK constraint sedia ada untuk jenis_kuliah
ALTER TABLE lecture_sessions 
DROP CONSTRAINT IF EXISTS lecture_sessions_jenis_kuliah_check;

-- Step 3: Tambah CHECK constraint baru dengan "Tazkirah Jumaat"
ALTER TABLE lecture_sessions 
ADD CONSTRAINT lecture_sessions_jenis_kuliah_check 
CHECK (jenis_kuliah IN ('Subuh', 'Maghrib', 'Tazkirah Jumaat'));

-- Nota: UNIQUE constraint (bulan, tahun, minggu, hari, jenis_kuliah) 
-- tidak perlu diubah kerana ia sudah membenarkan jenis_kuliah berbeza
-- pada hari yang sama
