-- Add referral system to profiles table
ALTER TABLE profiles 
ADD COLUMN referral_code VARCHAR(20) UNIQUE,
ADD COLUMN referred_by_code VARCHAR(20),
ADD COLUMN referral_points_earned INTEGER DEFAULT 0,
ADD COLUMN referral_count INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_referred_by_code ON profiles(referred_by_code);

-- Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code
        new_code := UPPER(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle referral rewards
CREATE OR REPLACE FUNCTION process_referral_signup()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id UUID;
    referral_reward_points INTEGER := 5; -- Points to award for successful referral
BEGIN
    -- Only process if this is a new profile with a referral code
    IF NEW.referred_by_code IS NOT NULL AND OLD IS NULL THEN
        -- Find the referrer by their referral code
        SELECT id INTO referrer_id 
        FROM profiles 
        WHERE referral_code = NEW.referred_by_code;
        
        -- If referrer exists, award points and increment count
        IF referrer_id IS NOT NULL THEN
            -- Award points to the referrer
            UPDATE profiles 
            SET 
                referral_points_earned = referral_points_earned + referral_reward_points,
                referral_count = referral_count + 1
            WHERE id = referrer_id;
            
            -- Create earnings transaction for the referrer
            INSERT INTO earnings_transactions (
                user_id,
                amount,
                points,
                transaction_type,
                description
            ) VALUES (
                referrer_id,
                0, -- No monetary amount, just points
                referral_reward_points,
                'referral_bonus',
                'Referral bonus for ' || NEW.first_name || ' ' || NEW.last_name
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically process referral rewards
CREATE TRIGGER trigger_process_referral_signup
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION process_referral_signup();

-- Update existing profiles to have referral codes
UPDATE profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;
