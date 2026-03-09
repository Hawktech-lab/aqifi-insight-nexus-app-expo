-- Update handle_new_user function to include referral code from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  referral_code_from_meta TEXT;
  referrer_user_id UUID;
BEGIN
  -- Get referral code from user metadata
  referral_code_from_meta := NEW.raw_user_meta_data ->> 'referral_code';
  
  -- If referral code exists, find the referrer
  IF referral_code_from_meta IS NOT NULL THEN
    -- Try to find referrer in waitlist_users first
    SELECT user_id INTO referrer_user_id
    FROM public.waitlist_users
    WHERE referral_code = UPPER(referral_code_from_meta)
    LIMIT 1;
    
    -- If not found in waitlist_users, try profiles table
    IF referrer_user_id IS NULL THEN
      SELECT user_id INTO referrer_user_id
      FROM public.profiles
      WHERE referral_code = UPPER(referral_code_from_meta)
      LIMIT 1;
    END IF;
  END IF;
  
  -- Insert profile with referral code if found
  INSERT INTO public.profiles (user_id, first_name, last_name, referred_by_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN referral_code_from_meta IS NOT NULL THEN UPPER(referral_code_from_meta)
      ELSE NULL
    END
  );
  
  -- Initialize default data streams
  INSERT INTO public.data_streams (user_id, stream_type, is_enabled, earnings_rate)
  VALUES 
    (NEW.id, 'steps', false, 0.001),
    (NEW.id, 'device_metadata', false, 0.005),
    (NEW.id, 'email_metadata', false, 0.01),
    (NEW.id, 'wifi', false, 0.002),
    (NEW.id, 'spatial', false, 0.01),
    (NEW.id, 'location', false, 0.005),
    (NEW.id, 'behavioral', false, 0.008);
    
  -- Create welcome activity
  INSERT INTO public.activities (user_id, type, title, description)
  VALUES (NEW.id, 'profile_updated', 'Welcome to Aqifi Insight Nexus', 'Your account has been created successfully');
    
  RETURN NEW;
END;
$$;
