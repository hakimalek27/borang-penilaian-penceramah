-- Migration: Relax bulan/tahun constraints untuk sesi tetap (bulan=0, tahun=0)
-- Jalankan di server: psql -U bpp_app -d bpp -f scripts/migrate-constraints.sql

BEGIN;

-- Fix bulan constraint (allow 0 for "sesi tetap")
ALTER TABLE lecture_sessions DROP CONSTRAINT IF EXISTS lecture_sessions_bulan_check;
ALTER TABLE lecture_sessions ADD CONSTRAINT lecture_sessions_bulan_check CHECK (bulan >= 0 AND bulan <= 12);

-- Fix tahun constraint (allow 0 for "sesi tetap")
ALTER TABLE lecture_sessions DROP CONSTRAINT IF EXISTS lecture_sessions_tahun_check;
ALTER TABLE lecture_sessions ADD CONSTRAINT lecture_sessions_tahun_check CHECK (tahun >= 0);

-- Clean up expired sessions
DELETE FROM admin_sessions WHERE expires_at < NOW();

COMMIT;
