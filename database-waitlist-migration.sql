-- Database Migration for Waitlist System with Viralloops Integration
-- Run this in your Supabase SQL Editor

-- 1. Add Viralloops configuration and feature flag to app_configuration table
INSERT INTO app_configuration (config_key, config_value, config_category, description) VALUES
('waitlist_enabled', 'true', 'third_party', 'Enable/disable waitlist feature (true/false)'),
('viralloops_api_key', 'vl_dummy_api_key_1234567890abcdef', 'third_party', 'Viralloops API Key'),
('viralloops_campaign_id', 'dummy_campaign_12345', 'third_party', 'Viralloops Campaign ID (UCID)'),
('viralloops_api_url', 'https://app.viral-loops.com/api/v2', 'third_party', 'Viralloops API Base URL')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 2. Create waitlist_users table
CREATE TABLE IF NOT EXISTS waitlist_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_by_code TEXT,
  status TEXT NOT NULL DEFAULT 'on_waitlist' CHECK (status IN ('pending_kyc', 'kyc_completed', 'on_waitlist', 'invited', 'active')),
  waitlist_position INTEGER,
  total_points INTEGER DEFAULT 0,
  kyc_points INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  social_points INTEGER DEFAULT 0,
  kyc_completed_at TIMESTAMPTZ,
  viralloops_participant_id TEXT,
  viralloops_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'kyc_completed', 'active')),
  points_awarded INTEGER DEFAULT 0,
  points_awarded_at TIMESTAMPTZ,
  viralloops_referral_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create social_shares table
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'instagram', 'other')),
  share_url TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  points_awarded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('kyc_completion', 'referral', 'social_share', 'bonus', 'adjustment')),
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- References to referrals.id, social_shares.id, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create leaderboard view (cached or computed)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  kyc_points INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  social_points INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  social_shares_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_users_user_id ON waitlist_users(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_referral_code ON waitlist_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_status ON waitlist_users(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_position ON waitlist_users(waitlist_position);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_status ON social_shares(status);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_cache(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard_cache(total_points DESC);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE waitlist_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for waitlist_users
CREATE POLICY "Users can view their own waitlist status" ON waitlist_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public waitlist info" ON waitlist_users
  FOR SELECT USING (true); -- Allow viewing referral codes and basic info

CREATE POLICY "System can insert waitlist users" ON waitlist_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own waitlist status" ON waitlist_users
  FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create RLS policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" ON referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own referrals" ON referrals
  FOR UPDATE USING (auth.uid() = referrer_user_id);

-- 11. Create RLS policies for social_shares
CREATE POLICY "Users can view their own social shares" ON social_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert social shares" ON social_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own social shares" ON social_shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can verify social shares" ON social_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 12. Create RLS policies for points_transactions
CREATE POLICY "Users can view their own points transactions" ON points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert points transactions" ON points_transactions
  FOR INSERT WITH CHECK (true);

-- 13. Create RLS policies for leaderboard_cache
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache
  FOR SELECT USING (true);

CREATE POLICY "System can update leaderboard" ON leaderboard_cache
  FOR ALL USING (true);

-- 14. Create function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  -- Generate a unique code based on user ID and random string
  code := UPPER(SUBSTRING(MD5(user_id::TEXT || NOW()::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
  
  -- Check if code already exists
  SELECT EXISTS(SELECT 1 FROM waitlist_users WHERE referral_code = code) INTO exists_check;
  
  -- If exists, try again with different random
  WHILE exists_check LOOP
    code := UPPER(SUBSTRING(MD5(user_id::TEXT || NOW()::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM waitlist_users WHERE referral_code = code) INTO exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 15. Create function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Insert points transaction
  INSERT INTO points_transactions (user_id, transaction_type, points, description, reference_id)
  VALUES (p_user_id, p_type, p_points, p_description, p_reference_id)
  RETURNING id INTO transaction_id;
  
  -- Update waitlist_users points
  UPDATE waitlist_users
  SET 
    total_points = total_points + p_points,
    kyc_points = CASE WHEN p_type = 'kyc_completion' THEN kyc_points + p_points ELSE kyc_points END,
    referral_points = CASE WHEN p_type = 'referral' THEN referral_points + p_points ELSE referral_points END,
    social_points = CASE WHEN p_type = 'social_share' THEN social_points + p_points ELSE social_points END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to update waitlist position
CREATE OR REPLACE FUNCTION update_waitlist_positions()
RETURNS void AS $$
BEGIN
  -- Update positions based on total points (descending) and created_at (ascending)
  UPDATE waitlist_users wu
  SET waitlist_position = subq.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) as rank
    FROM waitlist_users
    WHERE status = 'on_waitlist'
  ) subq
  WHERE wu.id = subq.id;
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to update leaderboard cache
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS void AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM leaderboard_cache;
  
  -- Rebuild leaderboard
  INSERT INTO leaderboard_cache (user_id, total_points, rank, kyc_points, referral_points, social_points, referrals_count, social_shares_count)
  SELECT 
    wu.user_id,
    wu.total_points,
    wu.waitlist_position,
    wu.kyc_points,
    wu.referral_points,
    wu.social_points,
    COALESCE(ref_counts.count, 0) as referrals_count,
    COALESCE(share_counts.count, 0) as social_shares_count
  FROM waitlist_users wu
  LEFT JOIN (
    SELECT referrer_user_id, COUNT(*) as count
    FROM referrals
    WHERE status IN ('completed', 'kyc_completed', 'active')
    GROUP BY referrer_user_id
  ) ref_counts ON wu.user_id = ref_counts.referrer_user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM social_shares
    WHERE status = 'verified'
    GROUP BY user_id
  ) share_counts ON wu.user_id = share_counts.user_id
  WHERE wu.status = 'on_waitlist'
  ORDER BY wu.total_points DESC, wu.created_at ASC;
  
  -- Update last_updated timestamp
  UPDATE leaderboard_cache SET last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 18. Create trigger to update waitlist positions when points change
CREATE OR REPLACE FUNCTION trigger_update_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_waitlist_positions();
  PERFORM update_leaderboard_cache();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_positions_on_points_change
  AFTER INSERT OR UPDATE ON points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_waitlist_positions();

-- 19. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waitlist_users_updated_at
  BEFORE UPDATE ON waitlist_users
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

CREATE TRIGGER update_social_shares_updated_at
  BEFORE UPDATE ON social_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

-- 20. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON waitlist_users TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON social_shares TO authenticated;
GRANT ALL ON points_transactions TO authenticated;
GRANT SELECT ON leaderboard_cache TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_points(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;

