-- Database Migration for Structured Configuration System
-- Run this in your Supabase SQL editor

-- 1. Create data stream configurations table
CREATE TABLE IF NOT EXISTS data_stream_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_type TEXT NOT NULL CHECK (stream_type IN ('location', 'steps', 'device_metadata', 'email_metadata', 'wifi', 'spatial', 'behavioral')),
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  default_value TEXT NOT NULL,
  min_value TEXT,
  max_value TEXT,
  unit TEXT,
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(stream_type, config_key)
);

-- 2. Create configuration change history table
CREATE TABLE IF NOT EXISTS config_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES data_stream_configs(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user sessions table for config versioning
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  config_version TEXT, -- Hash of current config for change detection
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_stream_configs_stream_type ON data_stream_configs(stream_type);
CREATE INDEX IF NOT EXISTS idx_data_stream_configs_active ON data_stream_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_config_change_history_config_id ON config_change_history(config_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE data_stream_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for data_stream_configs
CREATE POLICY "Public read access to active configs" ON data_stream_configs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access to configs" ON data_stream_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- 7. Create RLS policies for config_change_history
CREATE POLICY "Admin read access to config history" ON config_change_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "System insert access to config history" ON config_change_history
  FOR INSERT WITH CHECK (true);

-- 8. Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for updated_at
CREATE TRIGGER update_data_stream_configs_updated_at 
  BEFORE UPDATE ON data_stream_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_config_updated_at();

-- 11. Create function to log config changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.config_value != NEW.config_value THEN
    INSERT INTO config_change_history (config_id, old_value, new_value, changed_by)
    VALUES (NEW.id, OLD.config_value, NEW.config_value, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create trigger for config change logging
CREATE TRIGGER log_data_stream_config_changes
  AFTER UPDATE ON data_stream_configs
  FOR EACH ROW
  EXECUTE FUNCTION log_config_change();

-- 13. Create function to get config hash for versioning
CREATE OR REPLACE FUNCTION get_config_version()
RETURNS TEXT AS $$
DECLARE
  config_hash TEXT;
BEGIN
  SELECT md5(string_agg(stream_type || config_key || config_value, '' ORDER BY stream_type, config_key))
  INTO config_hash
  FROM data_stream_configs
  WHERE is_active = true;
  
  RETURN config_hash;
END;
$$ LANGUAGE plpgsql;

-- 14. Insert initial configuration data
INSERT INTO data_stream_configs (stream_type, config_key, config_value, default_value, min_value, max_value, unit, description) VALUES
-- Location stream configurations
('location', 'update_interval', '300000', '300000', '60000', '1800000', 'milliseconds', 'How often to collect location data (5 minutes default)'),
('location', 'distance_filter', '100', '100', '10', '1000', 'meters', 'Minimum distance to trigger location update'),
('location', 'accuracy', 'balanced', 'balanced', 'low', 'high', 'accuracy_level', 'GPS accuracy setting (low, balanced, high)'),
('location', 'background_updates', 'false', 'false', 'false', 'true', 'boolean', 'Enable background location updates'),
('location', 'earnings_rate', '0.005', '0.005', '0.001', '0.01', 'dollars', 'Earnings per location data point'),

-- Steps stream configurations
('steps', 'sync_interval', '900000', '900000', '300000', '3600000', 'milliseconds', 'How often to sync step data (15 minutes default)'),
('steps', 'earnings_rate', '0.001', '0.001', '0.0005', '0.005', 'dollars', 'Earnings per step data point'),

-- WiFi stream configurations
('wifi', 'scan_interval', '600000', '600000', '300000', '1800000', 'milliseconds', 'How often to scan WiFi networks (10 minutes default)'),
('wifi', 'earnings_rate', '0.001', '0.001', '0.0005', '0.003', 'dollars', 'Earnings per WiFi scan'),

-- Device metadata configurations
('device_metadata', 'sync_interval', '86400000', '86400000', '3600000', '604800000', 'milliseconds', 'How often to sync device metadata (24 hours default)'),
('device_metadata', 'earnings_rate', '0.002', '0.002', '0.001', '0.005', 'dollars', 'Earnings per device metadata sync'),

-- Email metadata configurations
('email_metadata', 'sync_interval', '3600000', '3600000', '1800000', '86400000', 'milliseconds', 'How often to sync email metadata (1 hour default)'),
('email_metadata', 'earnings_rate', '0.003', '0.003', '0.001', '0.008', 'dollars', 'Earnings per email metadata sync'),

-- Spatial data configurations
('spatial', 'update_interval', '600000', '600000', '300000', '1800000', 'milliseconds', 'How often to collect spatial data (10 minutes default)'),
('spatial', 'earnings_rate', '0.002', '0.002', '0.001', '0.005', 'dollars', 'Earnings per spatial data point'),

-- Behavioral data configurations
('behavioral', 'sync_interval', '1800000', '1800000', '900000', '7200000', 'milliseconds', 'How often to sync behavioral data (30 minutes default)'),
('behavioral', 'earnings_rate', '0.004', '0.004', '0.002', '0.01', 'dollars', 'Earnings per behavioral data sync')
ON CONFLICT (stream_type, config_key) DO NOTHING;

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON data_stream_configs TO authenticated;
GRANT ALL ON config_change_history TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
