-- Add activities table for user activity tracking
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('survey_completed', 'survey_started', 'survey_available', 'reward_earned', 'profile_updated', 'task_completed')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (user_id, type, title, description, metadata)
  VALUES (p_user_id, p_type, p_title, p_description, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;

-- Insert some sample activities for existing users (optional)
-- This will create welcome activities for any existing users
INSERT INTO public.activities (user_id, type, title, description)
SELECT 
  p.user_id,
  'profile_updated',
  'Welcome to Aqifi Insight Nexus',
  'Your account has been created successfully'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities a 
  WHERE a.user_id = p.user_id 
  AND a.type = 'profile_updated' 
  AND a.title = 'Welcome to Aqifi Insight Nexus'
);
