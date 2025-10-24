-- Device Fingerprinting Database Schema
-- This schema captures comprehensive device information for fingerprinting

-- Device fingerprints table - stores unique device identifiers and specifications
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL, -- Unique device identifier
  device_name TEXT,
  device_brand TEXT,
  device_model TEXT,
  device_manufacturer TEXT,
  
  -- Operating System Information
  os_type TEXT NOT NULL, -- 'ios' or 'android'
  os_version TEXT,
  os_build_number TEXT,
  os_api_level INTEGER, -- Android API level
  
  -- Hardware Specifications
  processor_type TEXT,
  processor_cores INTEGER,
  processor_frequency TEXT,
  architecture TEXT, -- 'arm64', 'x86', etc.
  
  -- Memory Information
  total_ram_mb INTEGER,
  available_ram_mb INTEGER,
  total_storage_gb INTEGER,
  available_storage_gb INTEGER,
  
  -- Display Information
  screen_width INTEGER,
  screen_height INTEGER,
  screen_density REAL,
  screen_scale REAL,
  screen_refresh_rate INTEGER,
  
  -- Network Information
  network_type TEXT, -- 'wifi', 'cellular', 'none'
  carrier_name TEXT,
  carrier_country TEXT,
  ip_address INET,
  
  -- App Information
  app_version TEXT,
  app_build_number TEXT,
  app_installation_date TIMESTAMP WITH TIME ZONE,
  
  -- Device Capabilities
  has_camera BOOLEAN DEFAULT false,
  has_gps BOOLEAN DEFAULT false,
  has_bluetooth BOOLEAN DEFAULT false,
  has_nfc BOOLEAN DEFAULT false,
  has_fingerprint_sensor BOOLEAN DEFAULT false,
  has_face_recognition BOOLEAN DEFAULT false,
  
  -- Battery Information
  battery_level INTEGER,
  is_charging BOOLEAN,
  battery_health TEXT,
  
  -- Device State
  is_tablet BOOLEAN DEFAULT false,
  is_emulator BOOLEAN DEFAULT false,
  is_rooted BOOLEAN DEFAULT false, -- Android only
  is_jailbroken BOOLEAN DEFAULT false, -- iOS only
  
  -- Timestamps
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Device verification status
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Device sessions table - tracks user sessions per device
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_ended_at TIMESTAMP WITH TIME ZONE,
  session_duration_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device analytics table - tracks device usage patterns
CREATE TABLE IF NOT EXISTS device_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'app_open', 'feature_used', 'session_start', 'session_end', 'error'
  event_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID REFERENCES device_sessions(id) ON DELETE SET NULL
);

-- Device permissions table - tracks user consent for data collection
CREATE TABLE IF NOT EXISTS device_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL, -- 'device_data', 'location', 'analytics', 'monetization'
  is_granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  consent_version TEXT, -- Terms and conditions version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device fingerprint hashes table - for quick device identification
CREATE TABLE IF NOT EXISTS device_fingerprint_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  hash_type TEXT NOT NULL, -- 'hardware', 'software', 'network', 'composite'
  hash_value TEXT NOT NULL,
  hash_algorithm TEXT DEFAULT 'sha256',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hash_type, hash_value)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_device_id ON device_fingerprints(device_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_os_type ON device_fingerprints(os_type);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_fingerprint_id ON device_sessions(device_fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_device_analytics_device_fingerprint_id ON device_analytics(device_fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_device_analytics_timestamp ON device_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_device_permissions_user_id ON device_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprint_hashes_hash_value ON device_fingerprint_hashes(hash_value);

-- Enable Row Level Security
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprint_hashes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_fingerprints
CREATE POLICY "Users can view their own device fingerprints" ON device_fingerprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device fingerprints" ON device_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device fingerprints" ON device_fingerprints
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for device_sessions
CREATE POLICY "Users can view their own device sessions" ON device_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions" ON device_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions" ON device_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for device_analytics
CREATE POLICY "Users can view their own device analytics" ON device_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device analytics" ON device_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for device_permissions
CREATE POLICY "Users can view their own device permissions" ON device_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device permissions" ON device_permissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device permissions" ON device_permissions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for device_fingerprint_hashes
CREATE POLICY "Users can view their own device fingerprint hashes" ON device_fingerprint_hashes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM device_fingerprints 
      WHERE device_fingerprints.id = device_fingerprint_hashes.device_fingerprint_id 
      AND device_fingerprints.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own device fingerprint hashes" ON device_fingerprint_hashes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM device_fingerprints 
      WHERE device_fingerprints.id = device_fingerprint_hashes.device_fingerprint_id 
      AND device_fingerprints.user_id = auth.uid()
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_device_fingerprints_updated_at 
  BEFORE UPDATE ON device_fingerprints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_permissions_updated_at 
  BEFORE UPDATE ON device_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get device fingerprint by hash
CREATE OR REPLACE FUNCTION get_device_fingerprint_by_hash(hash_val TEXT, hash_type_val TEXT DEFAULT 'composite')
RETURNS TABLE (
  device_fingerprint_id UUID,
  user_id UUID,
  device_id TEXT,
  device_name TEXT,
  os_type TEXT,
  os_version TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.id,
    df.user_id,
    df.device_id,
    df.device_name,
    df.os_type,
    df.os_version
  FROM device_fingerprints df
  JOIN device_fingerprint_hashes dfh ON df.id = dfh.device_fingerprint_id
  WHERE dfh.hash_value = hash_val 
  AND dfh.hash_type = hash_type_val
  AND df.is_active = true;
END;
$$ LANGUAGE plpgsql;



