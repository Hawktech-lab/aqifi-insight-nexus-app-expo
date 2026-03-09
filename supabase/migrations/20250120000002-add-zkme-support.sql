-- Migration: Add zkMe support to KYC system
-- Description: Adds zkMe-specific columns and credential types to support zero-knowledge proof verification

-- Create enum for verification methods first
CREATE TYPE verification_method AS ENUM ('traditional', 'zkme');

-- Create enum for zkMe credential types first
CREATE TYPE zkme_credential_type AS ENUM (
  'proof_of_citizenship',
  'proof_of_location', 
  'proof_of_age',
  'aml_check',
  'proof_of_accredited_investor'
);

-- Add zkMe-specific columns to kyc_documents table
ALTER TABLE kyc_documents 
ADD COLUMN credential_type zkme_credential_type,
ADD COLUMN zkme_proof_id VARCHAR(255),
ADD COLUMN verification_timestamp TIMESTAMP WITH TIME ZONE;

-- Add zkMe verification data to kyc_submissions table
ALTER TABLE kyc_submissions 
ADD COLUMN zkme_verification_id VARCHAR(255),
ADD COLUMN verified_attributes JSONB,
ADD COLUMN verification_method verification_method DEFAULT 'traditional';

-- Add indexes for better performance
CREATE INDEX idx_kyc_documents_credential_type ON kyc_documents(credential_type);
CREATE INDEX idx_kyc_documents_zkme_proof_id ON kyc_documents(zkme_proof_id);
CREATE INDEX idx_kyc_submissions_zkme_verification_id ON kyc_submissions(zkme_verification_id);
CREATE INDEX idx_kyc_submissions_verification_method ON kyc_submissions(verification_method);

-- Add comments for documentation
COMMENT ON COLUMN kyc_documents.credential_type IS 'Type of zkMe credential (proof_of_citizenship, proof_of_location, etc.)';
COMMENT ON COLUMN kyc_documents.zkme_proof_id IS 'Unique identifier for the zkMe proof';
COMMENT ON COLUMN kyc_documents.verification_timestamp IS 'When the credential was verified by zkMe';
COMMENT ON COLUMN kyc_submissions.zkme_verification_id IS 'Unique identifier for the zkMe verification session';
COMMENT ON COLUMN kyc_submissions.verified_attributes IS 'JSON array of verified zkMe credentials and their attributes';
COMMENT ON COLUMN kyc_submissions.verification_method IS 'Method used for verification (traditional document upload or zkMe)';

-- Create a view for zkMe verification status
CREATE OR REPLACE VIEW zkme_verification_status AS
SELECT 
  s.id as submission_id,
  s.user_id,
  s.verification_method,
  s.zkme_verification_id,
  s.verified_attributes,
  s.created_at as submission_created_at,
  s.reviewed_at,
  s.rejection_reason,
  p.kyc_status,
  COUNT(d.id) as credential_count,
  COUNT(CASE WHEN d.credential_type IS NOT NULL THEN 1 END) as zkme_credential_count
FROM kyc_submissions s
LEFT JOIN profiles p ON s.user_id = p.user_id
LEFT JOIN kyc_documents d ON s.user_id = d.user_id
WHERE s.verification_method = 'zkme'
GROUP BY s.id, s.user_id, s.verification_method, s.zkme_verification_id, 
         s.verified_attributes, s.created_at, s.reviewed_at, s.rejection_reason, p.kyc_status;

-- Create a function to get zkMe verification summary
CREATE OR REPLACE FUNCTION get_zkme_verification_summary(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  verification_method verification_method,
  zkme_verification_id VARCHAR,
  credential_count BIGINT,
  verified_credentials JSONB,
  verification_status VARCHAR,
  last_verified_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    s.verification_method,
    s.zkme_verification_id,
    COUNT(d.id) as credential_count,
    s.verified_attributes as verified_credentials,
    p.kyc_status as verification_status,
    MAX(d.verification_timestamp) as last_verified_at
  FROM kyc_submissions s
  LEFT JOIN profiles p ON s.user_id = p.user_id
  LEFT JOIN kyc_documents d ON s.user_id = d.user_id
  WHERE s.user_id = user_uuid 
    AND s.verification_method = 'zkme'
  GROUP BY s.user_id, s.verification_method, s.zkme_verification_id, 
           s.verified_attributes, p.kyc_status;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update zkMe verification status
CREATE OR REPLACE FUNCTION update_zkme_verification_status(
  user_uuid UUID,
  verification_id VARCHAR,
  credentials JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  submission_exists BOOLEAN;
BEGIN
  -- Check if submission exists
  SELECT EXISTS(
    SELECT 1 FROM kyc_submissions 
    WHERE user_id = user_uuid 
      AND verification_method = 'zkme'
  ) INTO submission_exists;
  
  IF NOT submission_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update submission with zkMe data
  UPDATE kyc_submissions 
  SET 
    zkme_verification_id = verification_id,
    verified_attributes = credentials,
    updated_at = NOW()
  WHERE user_id = user_uuid 
    AND verification_method = 'zkme';
  
  -- Update profile KYC status
  UPDATE profiles 
  SET 
    kyc_status = 'verified',
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get zkMe credential details
CREATE OR REPLACE FUNCTION get_zkme_credentials(user_uuid UUID)
RETURNS TABLE (
  credential_type zkme_credential_type,
  proof_id VARCHAR,
  verified_at TIMESTAMP,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.credential_type,
    d.zkme_proof_id as proof_id,
    d.verification_timestamp as verified_at,
    CASE 
      WHEN d.credential_type IS NOT NULL THEN 'verified'
      ELSE 'not_verified'
    END as status
  FROM kyc_documents d
  WHERE d.user_id = user_uuid 
    AND d.credential_type IS NOT NULL
  ORDER BY d.verification_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON zkme_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_zkme_verification_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_zkme_verification_status(UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_zkme_credentials(UUID) TO authenticated;

-- Insert sample zkMe credential types for reference
INSERT INTO kyc_documents (user_id, document_type, file_url, credential_type, zkme_proof_id, verification_timestamp)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'proof_of_citizenship', '', 'proof_of_citizenship', 'sample_proof_1', NOW()),
  ('00000000-0000-0000-0000-000000000000', 'proof_of_location', '', 'proof_of_location', 'sample_proof_2', NOW())
ON CONFLICT DO NOTHING;

-- Clean up sample data
DELETE FROM kyc_documents WHERE user_id = '00000000-0000-0000-0000-000000000000';
