-- Create enum types
CREATE TYPE public.kyc_status AS ENUM ('not_started', 'pending', 'verified', 'rejected');
CREATE TYPE public.data_stream_type AS ENUM ('steps', 'device_metadata', 'email_metadata', 'wifi', 'spatial', 'location', 'behavioral');
CREATE TYPE public.connection_type AS ENUM ('wallet', 'health_kit', 'google_fit', 'email');
CREATE TYPE public.task_status AS ENUM ('available', 'completed', 'expired');
CREATE TYPE public.survey_status AS ENUM ('available', 'completed', 'expired');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  country TEXT,
  avatar_url TEXT,
  kyc_status kyc_status DEFAULT 'not_started',
  profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_connections table for wallets and external services
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type connection_type NOT NULL,
  connection_name TEXT NOT NULL,
  connection_address TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data_streams table for user data permissions
CREATE TABLE public.data_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_type data_stream_type NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  earnings_rate DECIMAL(8,4) DEFAULT 0,
  data_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stream_type)
);

-- Create tasks table for available missions/tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER DEFAULT 0,
  reward_amount DECIMAL(8,2) DEFAULT 0,
  status task_status DEFAULT 'available',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_tasks table for tracking user task completion
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status task_status DEFAULT 'available',
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_earned DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  typeform_id TEXT,
  reward_points INTEGER DEFAULT 0,
  reward_amount DECIMAL(8,2) DEFAULT 0,
  status survey_status DEFAULT 'available',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_surveys table for tracking survey participation
CREATE TABLE public.user_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  status survey_status DEFAULT 'available',
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_earned DECIMAL(8,2) DEFAULT 0,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, survey_id)
);

-- Create earnings_transactions table for tracking all earnings
CREATE TABLE public.earnings_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'data_stream', 'task', 'survey', 'bonus'
  reference_id UUID, -- references to task_id, survey_id, etc.
  amount DECIMAL(8,2) NOT NULL,
  points INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_connections
CREATE POLICY "Users can view their own connections" ON public.user_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own connections" ON public.user_connections
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for data_streams
CREATE POLICY "Users can view their own data streams" ON public.data_streams
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data streams" ON public.data_streams
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for tasks (public read, no write for users)
CREATE POLICY "Anyone can view available tasks" ON public.tasks
  FOR SELECT USING (status = 'available');

-- Create RLS policies for user_tasks
CREATE POLICY "Users can view their own task progress" ON public.user_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own task progress" ON public.user_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for surveys (public read, no write for users)
CREATE POLICY "Anyone can view available surveys" ON public.surveys
  FOR SELECT USING (status = 'available');

-- Create RLS policies for user_surveys
CREATE POLICY "Users can view their own survey progress" ON public.user_surveys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own survey progress" ON public.user_surveys
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for earnings_transactions
CREATE POLICY "Users can view their own earnings" ON public.earnings_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup
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
    
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_streams_updated_at BEFORE UPDATE ON public.data_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample tasks
INSERT INTO public.tasks (title, description, reward_points, reward_amount) VALUES
('Complete Profile', 'Fill out your complete profile information', 100, 5.00),
('Connect Wallet', 'Link your first cryptocurrency wallet', 200, 10.00),
('Enable Health Data', 'Allow health data sharing for rewards', 150, 7.50),
('First Survey', 'Complete your first survey', 300, 15.00);

-- Insert some sample surveys
INSERT INTO public.surveys (title, description, reward_points, reward_amount, typeform_id) VALUES
('Consumer Preferences Survey', 'Help us understand consumer behavior patterns', 500, 25.00, 'sample-typeform-1'),
('Technology Usage Survey', 'Share your technology usage habits', 400, 20.00, 'sample-typeform-2'),
('Lifestyle Preferences', 'Tell us about your lifestyle and preferences', 600, 30.00, 'sample-typeform-3');