-- Storage bucket untuk gambar penceramah
-- Jalankan di Supabase Dashboard > Storage > Policies

-- Create bucket (run in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lecturer-photos', 'lecturer-photos', true);

-- Storage policies for lecturer-photos bucket

-- Public can view photos
CREATE POLICY "Public can view lecturer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'lecturer-photos');

-- Admin can upload photos
CREATE POLICY "Admin can upload lecturer photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecturer-photos' 
  AND EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- Admin can update photos
CREATE POLICY "Admin can update lecturer photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lecturer-photos' 
  AND EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- Admin can delete photos
CREATE POLICY "Admin can delete lecturer photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lecturer-photos' 
  AND EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
