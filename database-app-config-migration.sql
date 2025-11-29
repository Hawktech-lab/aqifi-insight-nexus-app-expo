-- Database Migration for App-Level Configuration (Sensitive Keys)
-- This table stores sensitive configuration values like API keys, OAuth keys, etc.
-- Run this in your Supabase SQL editor
--
-- PREREQUISITE: Ensure the profiles table has a 'role' column.
-- If not, run this first:
--   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 1. Create app_configuration table
CREATE TABLE IF NOT EXISTS app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  config_category TEXT NOT NULL CHECK (config_category IN ('oauth', 'api_keys', 'third_party', 'supabase', 'zkme')),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create configuration change history table for app config
CREATE TABLE IF NOT EXISTS app_config_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES app_configuration(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_configuration(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_configuration(config_category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_configuration(is_active);
CREATE INDEX IF NOT EXISTS idx_app_config_history_config_id ON app_config_change_history(config_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config_change_history ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for app_configuration
-- Public read access to active configs (needed for app to function)
CREATE POLICY "Public read access to active app configs" ON app_configuration
  FOR SELECT USING (is_active = true);

-- Admin full access to app configs
CREATE POLICY "Admin full access to app configs" ON app_configuration
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Create RLS policies for app_config_change_history
CREATE POLICY "Admin read access to app config history" ON app_config_change_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System insert access to app config history" ON app_config_change_history
  FOR INSERT WITH CHECK (true);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for updated_at
CREATE TRIGGER update_app_configuration_updated_at 
  BEFORE UPDATE ON app_configuration 
  FOR EACH ROW 
  EXECUTE FUNCTION update_app_config_updated_at();

-- 9. Create function to log app config changes
CREATE OR REPLACE FUNCTION log_app_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.config_value != NEW.config_value THEN
    INSERT INTO app_config_change_history (config_id, old_value, new_value, changed_by)
    VALUES (NEW.id, OLD.config_value, NEW.config_value, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for app config change logging
CREATE TRIGGER log_app_config_changes
  AFTER UPDATE ON app_configuration
  FOR EACH ROW
  EXECUTE FUNCTION log_app_config_change();

-- 11. Insert initial configuration values
-- NOTE: Replace these with your actual values. These are placeholders.
-- You should update these values after running the migration.
INSERT INTO app_configuration (config_key, config_value, config_category, description) VALUES
-- Supabase Configuration
('supabase_url', 'https://uyamvlctjacvevyfdnez.supabase.co', 'supabase', 'Supabase project URL'),
('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg', 'supabase', 'Supabase anonymous key'),

-- Google OAuth Configuration
('google_client_id', '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com', 'oauth', 'Google OAuth Client ID (Android/iOS)'),
('google_client_id_web', '364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com', 'oauth', 'Google OAuth Client ID (Web)'),
('google_client_id_android', '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com', 'oauth', 'Google OAuth Client ID (Android)'),
('google_client_id_ios', '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com', 'oauth', 'Google OAuth Client ID (iOS)'),

-- Gmail API Configuration
('gmail_api_key', 'AIzaSyA0mIQdqC2HFih2zRhR9NI8VK6RLD3TV-A', 'api_keys', 'Gmail API Key'),

-- ZkMe KYC Configuration
('zkme_mch_no', 'M2025100726873377054742374045622', 'zkme', 'ZkMe Merchant Number (MCH No)'),
('zkme_api_key', '2d101ff5.efad7b1af7955af9a6ae3036481c97e4', 'zkme', 'ZkMe API Key'),
('zkme_program_no', '202510080002', 'zkme', 'ZkMe Program Number')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON app_configuration TO authenticated;
GRANT ALL ON app_configuration TO authenticated;
GRANT SELECT ON app_config_change_history TO authenticated;

-- 13. Create a function to get all active app configs as JSON
CREATE OR REPLACE FUNCTION get_app_configs()
RETURNS JSON AS $$
DECLARE
  config_json JSON;
BEGIN
  SELECT json_object_agg(config_key, config_value)
  INTO config_json
  FROM app_configuration
  WHERE is_active = true;
  
  RETURN config_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_app_configs() TO authenticated;

