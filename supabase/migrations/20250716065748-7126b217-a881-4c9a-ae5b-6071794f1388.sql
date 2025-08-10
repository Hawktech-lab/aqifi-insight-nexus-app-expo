-- Allow users to update their own kyc_status when resubmitting
CREATE POLICY "Users can update their own kyc_status to pending" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND kyc_status = 'pending');