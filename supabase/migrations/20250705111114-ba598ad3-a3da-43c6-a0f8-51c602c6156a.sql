-- Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create RLS policy for admins to manage surveys
CREATE POLICY "Admins can manage surveys" ON public.surveys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policy for admins to manage tasks  
CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policy for admins to view all user progress
CREATE POLICY "Admins can view all user surveys" ON public.user_surveys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all user tasks" ON public.user_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policy for admins to view all earnings
CREATE POLICY "Admins can view all earnings" ON public.earnings_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert earnings transaction when user completes survey
CREATE OR REPLACE FUNCTION public.award_survey_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get survey reward info
    INSERT INTO public.earnings_transactions (
      user_id, 
      transaction_type, 
      reference_id, 
      amount, 
      points, 
      description
    )
    SELECT 
      NEW.user_id,
      'survey',
      NEW.survey_id,
      s.reward_amount,
      s.reward_points,
      'Survey completion: ' || s.title
    FROM public.surveys s
    WHERE s.id = NEW.survey_id;
    
    -- Update user's total earnings
    UPDATE public.profiles 
    SET total_earnings = total_earnings + (
      SELECT COALESCE(reward_amount, 0) FROM public.surveys WHERE id = NEW.survey_id
    )
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for survey completion
CREATE TRIGGER award_survey_points_trigger
  AFTER UPDATE ON public.user_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.award_survey_points();

-- Insert earnings transaction when user completes task
CREATE OR REPLACE FUNCTION public.award_task_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get task reward info
    INSERT INTO public.earnings_transactions (
      user_id, 
      transaction_type, 
      reference_id, 
      amount, 
      points, 
      description
    )
    SELECT 
      NEW.user_id,
      'task',
      NEW.task_id,
      t.reward_amount,
      t.reward_points,
      'Task completion: ' || t.title
    FROM public.tasks t
    WHERE t.id = NEW.task_id;
    
    -- Update user's total earnings
    UPDATE public.profiles 
    SET total_earnings = total_earnings + (
      SELECT COALESCE(reward_amount, 0) FROM public.tasks WHERE id = NEW.task_id
    )
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
CREATE TRIGGER award_task_points_trigger
  AFTER UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.award_task_points();