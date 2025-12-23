-- Migration: Form Settings
-- Allow admin to configure form visibility options

-- Create settings table if not exists
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger to settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Allow null on cadangan_teruskan column for when recommendation section is hidden
ALTER TABLE evaluations 
  ALTER COLUMN cadangan_teruskan DROP NOT NULL;

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('show_recommendation_section', 'true'::jsonb),
  ('email_notifications_enabled', 'false'::jsonb),
  ('alert_threshold', '2.0'::jsonb),
  ('admin_emails', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS policies for settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update settings
CREATE POLICY "Admins can read settings" ON settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Allow public to read form-related settings (for the evaluation form)
CREATE POLICY "Public can read form settings" ON settings
  FOR SELECT TO anon
  USING (key IN ('show_recommendation_section'));
