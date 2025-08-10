-- Create KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'id_front', 'id_back', 'selfie', 'address_proof'
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  id_number TEXT NOT NULL,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for kyc_documents
CREATE POLICY "Users can view their own KYC documents"
ON public.kyc_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own KYC documents"
ON public.kyc_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents"
ON public.kyc_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS policies for kyc_submissions
CREATE POLICY "Users can view their own KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC submissions"
ON public.kyc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add updated_at trigger for kyc tables
CREATE TRIGGER update_kyc_documents_updated_at
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();