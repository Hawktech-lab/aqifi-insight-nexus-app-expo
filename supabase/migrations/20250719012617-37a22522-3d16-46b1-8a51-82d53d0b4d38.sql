-- Update user profiles with correct total earnings from transactions
UPDATE public.profiles 
SET total_earnings = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM public.earnings_transactions 
  WHERE user_id = profiles.user_id
)
WHERE EXISTS (
  SELECT 1 FROM public.earnings_transactions 
  WHERE user_id = profiles.user_id
);

-- Ensure the triggers exist and are working properly
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS award_survey_points_trigger ON public.user_surveys;
DROP TRIGGER IF EXISTS award_task_points_trigger ON public.user_tasks;

-- Recreate the triggers properly
CREATE TRIGGER award_survey_points_trigger
    AFTER UPDATE ON public.user_surveys
    FOR EACH ROW
    EXECUTE FUNCTION public.award_survey_points();

CREATE TRIGGER award_task_points_trigger
    AFTER UPDATE ON public.user_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.award_task_points();