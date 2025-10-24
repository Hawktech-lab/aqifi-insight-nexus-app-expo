-- Database Migration for Location Data Streams
-- Run this in your Supabase SQL editor

-- 1. Create location_data table
CREATE TABLE IF NOT EXISTS location_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  altitude DECIMAL,
  heading DECIMAL,
  speed DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('gps', 'network', 'passive')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_data_user_id ON location_data(user_id);
CREATE INDEX IF NOT EXISTS idx_location_data_timestamp ON location_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_data_location_type ON location_data(location_type);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own location data" ON location_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location data" ON location_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location data" ON location_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location data" ON location_data
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure data_streams table exists with correct structure
CREATE TABLE IF NOT EXISTS data_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_type TEXT NOT NULL CHECK (stream_type IN ('steps', 'device_metadata', 'email_metadata', 'wifi', 'spatial', 'location', 'behavioral')),
  is_enabled BOOLEAN DEFAULT FALSE,
  data_count INTEGER DEFAULT 0,
  earnings_rate DECIMAL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for data_streams
CREATE INDEX IF NOT EXISTS idx_data_streams_user_id ON data_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_data_streams_stream_type ON data_streams(stream_type);

-- 7. Enable RLS for data_streams
ALTER TABLE data_streams ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for data_streams
CREATE POLICY "Users can view their own data streams" ON data_streams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data streams" ON data_streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data streams" ON data_streams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data streams" ON data_streams
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for updated_at
CREATE TRIGGER update_data_streams_updated_at 
  BEFORE UPDATE ON data_streams 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert default data streams for existing users (optional)
-- This will create default streams for users who don't have any
INSERT INTO data_streams (user_id, stream_type, is_enabled, data_count, earnings_rate)
SELECT 
  u.id,
  stream_type,
  FALSE,
  0,
  CASE 
    WHEN stream_type = 'location' THEN 0.005
    WHEN stream_type = 'behavioral' THEN 0.004
    WHEN stream_type = 'email_metadata' THEN 0.003
    WHEN stream_type = 'device_metadata' THEN 0.002
    WHEN stream_type = 'spatial' THEN 0.002
    WHEN stream_type = 'steps' THEN 0.001
    WHEN stream_type = 'wifi' THEN 0.001
    ELSE 0.001
  END
FROM auth.users u
CROSS JOIN (VALUES 
  ('steps'), ('device_metadata'), ('email_metadata'), 
  ('wifi'), ('spatial'), ('location'), ('behavioral')
) AS v(stream_type)
WHERE NOT EXISTS (
  SELECT 1 FROM data_streams ds 
  WHERE ds.user_id = u.id AND ds.stream_type = v.stream_type
);

-- 12. Create a function to get user's total earnings from location data
CREATE OR REPLACE FUNCTION get_location_earnings(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_earnings DECIMAL;
BEGIN
  SELECT COALESCE(SUM(ld.earnings_rate), 0)
  INTO total_earnings
  FROM location_data ld
  JOIN data_streams ds ON ds.user_id = ld.user_id AND ds.stream_type = 'location'
  WHERE ld.user_id = user_uuid;
  
  RETURN total_earnings;
END;
$$ LANGUAGE plpgsql;

-- 13. Grant necessary permissions (removed sequence grants since we use UUID with gen_random_uuid())
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON location_data TO authenticated;
GRANT ALL ON data_streams TO authenticated;

-- 14. Spatial data table (optional but recommended for raw visits)
CREATE TABLE IF NOT EXISTS spatial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cell_lat DECIMAL NOT NULL,
  cell_lon DECIMAL NOT NULL,
  dwell_ms INTEGER NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_spatial_data_user_id ON spatial_data(user_id);
CREATE INDEX IF NOT EXISTS idx_spatial_data_cell ON spatial_data(cell_lat, cell_lon);
CREATE INDEX IF NOT EXISTS idx_spatial_data_visited_at ON spatial_data(visited_at);

-- Enable RLS and policies
ALTER TABLE spatial_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spatial data" ON spatial_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spatial data" ON spatial_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spatial data" ON spatial_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spatial data" ON spatial_data
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON spatial_data TO authenticated;

-- 15. Behavioral analytics events
CREATE TABLE IF NOT EXISTS behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  device_fingerprint_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_events_user_id ON behavioral_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_type ON behavioral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_created_at ON behavioral_events(created_at);

ALTER TABLE behavioral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavioral events" ON behavioral_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral events" ON behavioral_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT ALL ON behavioral_events TO authenticated;

-- 16. Device Fingerprinting Tables
-- Device fingerprints table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_brand TEXT,
  device_model TEXT,
  device_manufacturer TEXT,
  os_type TEXT CHECK (os_type IN ('ios', 'android')),
  os_version TEXT,
  os_build_number TEXT,
  os_api_level INTEGER,
  processor_type TEXT,
  processor_cores INTEGER,
  processor_frequency TEXT,
  architecture TEXT,
  total_ram_mb INTEGER,
  available_ram_mb INTEGER,
  total_storage_gb INTEGER,
  available_storage_gb INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,
  screen_density DECIMAL,
  screen_scale DECIMAL,
  screen_refresh_rate INTEGER,
  network_type TEXT,
  carrier_name TEXT,
  carrier_country TEXT,
  ip_address TEXT,
  app_version TEXT,
  app_build_number TEXT,
  app_installation_date TIMESTAMPTZ,
  has_camera BOOLEAN,
  has_gps BOOLEAN,
  has_bluetooth BOOLEAN,
  has_nfc BOOLEAN,
  has_fingerprint_sensor BOOLEAN,
  has_face_recognition BOOLEAN,
  battery_level INTEGER,
  is_charging BOOLEAN,
  battery_health TEXT,
  is_tablet BOOLEAN,
  is_emulator BOOLEAN,
  is_rooted BOOLEAN,
  is_jailbroken BOOLEAN,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device sessions table
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  location_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device permissions table
CREATE TABLE IF NOT EXISTS device_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for device fingerprinting tables
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_device_id ON device_fingerprints(device_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_created_at ON device_fingerprints(created_at);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint_id ON device_sessions(device_fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_token ON device_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_device_sessions_started_at ON device_sessions(session_started_at);

CREATE INDEX IF NOT EXISTS idx_device_permissions_user_id ON device_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_permissions_fingerprint_id ON device_permissions(device_fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_device_permissions_type ON device_permissions(permission_type);

-- Enable RLS for device fingerprinting tables
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_fingerprints
CREATE POLICY "Users can view their own device fingerprints" ON device_fingerprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device fingerprints" ON device_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device fingerprints" ON device_fingerprints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device fingerprints" ON device_fingerprints
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for device_sessions
CREATE POLICY "Users can view their own device sessions" ON device_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions" ON device_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions" ON device_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sessions" ON device_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for device_permissions
CREATE POLICY "Users can view their own device permissions" ON device_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device permissions" ON device_permissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device permissions" ON device_permissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device permissions" ON device_permissions
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions for device fingerprinting tables
GRANT ALL ON device_fingerprints TO authenticated;
GRANT ALL ON device_sessions TO authenticated;
GRANT ALL ON device_permissions TO authenticated;

-- Create trigger for device_fingerprints updated_at
CREATE TRIGGER update_device_fingerprints_updated_at 
  BEFORE UPDATE ON device_fingerprints 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
