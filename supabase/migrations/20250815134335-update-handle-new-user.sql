-- Update handle_new_user function to create welcome activity
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
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
