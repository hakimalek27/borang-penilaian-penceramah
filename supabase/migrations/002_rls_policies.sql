-- Row Level Security (RLS) Policies
-- Sistem Penilaian Kuliah Masjid Al-Muttaqin

-- Enable RLS on all tables
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- LECTURERS POLICIES
-- =====================

-- Public can view all lecturers
CREATE POLICY "Public can view lecturers" ON lecturers
  FOR SELECT
  USING (true);

-- Admin can insert lecturers
CREATE POLICY "Admin can insert lecturers" ON lecturers
  FOR INSERT
  WITH CHECK (is_admin());

-- Admin can update lecturers
CREATE POLICY "Admin can update lecturers" ON lecturers
  FOR UPDATE
  USING (is_admin());

-- Admin can delete lecturers
CREATE POLICY "Admin can delete lecturers" ON lecturers
  FOR DELETE
  USING (is_admin());

-- =====================
-- LECTURE SESSIONS POLICIES
-- =====================

-- Public can view active sessions only
CREATE POLICY "Public can view active sessions" ON lecture_sessions
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Admin can insert sessions
CREATE POLICY "Admin can insert sessions" ON lecture_sessions
  FOR INSERT
  WITH CHECK (is_admin());

-- Admin can update sessions
CREATE POLICY "Admin can update sessions" ON lecture_sessions
  FOR UPDATE
  USING (is_admin());

-- Admin can delete sessions
CREATE POLICY "Admin can delete sessions" ON lecture_sessions
  FOR DELETE
  USING (is_admin());

-- =====================
-- EVALUATIONS POLICIES
-- =====================

-- Public can insert evaluations (submit feedback)
CREATE POLICY "Public can insert evaluations" ON evaluations
  FOR INSERT
  WITH CHECK (true);

-- Only admin can view evaluations
CREATE POLICY "Admin can view evaluations" ON evaluations
  FOR SELECT
  USING (is_admin());

-- Admin can update evaluations
CREATE POLICY "Admin can update evaluations" ON evaluations
  FOR UPDATE
  USING (is_admin());

-- Admin can delete evaluations
CREATE POLICY "Admin can delete evaluations" ON evaluations
  FOR DELETE
  USING (is_admin());

-- =====================
-- ADMINS POLICIES
-- =====================

-- Only admins can view admin list
CREATE POLICY "Admin can view admins" ON admins
  FOR SELECT
  USING (is_admin());

-- Only existing admins can add new admins
CREATE POLICY "Admin can insert admins" ON admins
  FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can delete admins
CREATE POLICY "Admin can delete admins" ON admins
  FOR DELETE
  USING (is_admin());
