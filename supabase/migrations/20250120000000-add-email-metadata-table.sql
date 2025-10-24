-- Migration: Add email metadata table
-- This migration creates the email_metadata table for storing email metadata without body content or attachments

-- 1. Create email_metadata table
CREATE TABLE IF NOT EXISTS email_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  subject TEXT,
  email_date TIMESTAMPTZ NOT NULL,
  thread_id TEXT,
  labels TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  email_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_metadata_user_id ON email_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_message_id ON email_metadata(message_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_email_date ON email_metadata(email_date);
CREATE INDEX IF NOT EXISTS idx_email_metadata_thread_id ON email_metadata(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_created_at ON email_metadata(created_at);

-- 3. Create unique constraint to prevent duplicate message processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_metadata_user_message_unique 
ON email_metadata(user_id, message_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own email metadata" ON email_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email metadata" ON email_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email metadata" ON email_metadata
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email metadata" ON email_metadata
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant necessary permissions
GRANT ALL ON email_metadata TO authenticated;

-- 7. Create function to get email metadata statistics
CREATE OR REPLACE FUNCTION get_email_metadata_stats(user_uuid UUID)
RETURNS TABLE (
  total_emails BIGINT,
  unread_emails BIGINT,
  last_collection_date TIMESTAMPTZ,
  points_earned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE NOT is_read) as unread_emails,
    MAX(created_at) as last_collection_date,
    COUNT(*) as points_earned
  FROM email_metadata
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get email metadata earnings
CREATE OR REPLACE FUNCTION get_email_metadata_earnings(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_earnings DECIMAL;
BEGIN
  SELECT COALESCE(COUNT(*) * 1.0, 0) -- 1 point per email
  INTO total_earnings
  FROM email_metadata
  WHERE user_id = user_uuid;
  
  RETURN total_earnings;
END;
$$ LANGUAGE plpgsql;

-- 9. Add email_metadata to the data_stream_type enum if not already present
-- Note: This might need to be done manually in Supabase dashboard if the enum already exists
-- ALTER TYPE data_stream_type ADD VALUE IF NOT EXISTS 'email_metadata';

-- 10. Create a view for email metadata summary
CREATE OR REPLACE VIEW email_metadata_summary AS
SELECT 
  user_id,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE NOT is_read) as unread_emails,
  COUNT(*) FILTER (WHERE is_important) as important_emails,
  COUNT(*) FILTER (WHERE has_attachments) as emails_with_attachments,
  MAX(email_date) as latest_email_date,
  MIN(email_date) as earliest_email_date,
  AVG(email_size) as avg_email_size,
  SUM(email_size) as total_email_size,
  MAX(created_at) as last_collection_date
FROM email_metadata
GROUP BY user_id;

-- 11. Grant permissions on the view
GRANT SELECT ON email_metadata_summary TO authenticated;

-- 12. Create RLS policy for the view
ALTER VIEW email_metadata_summary SET (security_invoker = true);

-- 13. Add comment to the table
COMMENT ON TABLE email_metadata IS 'Stores email metadata (headers only, no body content or attachments) for data stream collection';
COMMENT ON COLUMN email_metadata.message_id IS 'Unique identifier for the email message';
COMMENT ON COLUMN email_metadata.from_address IS 'Sender email address';
COMMENT ON COLUMN email_metadata.to_addresses IS 'Array of recipient email addresses';
COMMENT ON COLUMN email_metadata.subject IS 'Email subject line';
COMMENT ON COLUMN email_metadata.email_date IS 'Date when the email was sent';
COMMENT ON COLUMN email_metadata.thread_id IS 'Gmail thread ID for grouping related emails';
COMMENT ON COLUMN email_metadata.labels IS 'Array of Gmail labels applied to the email';
COMMENT ON COLUMN email_metadata.is_read IS 'Whether the email has been read';
COMMENT ON COLUMN email_metadata.is_important IS 'Whether the email is marked as important';
COMMENT ON COLUMN email_metadata.has_attachments IS 'Whether the email has attachments';
COMMENT ON COLUMN email_metadata.email_size IS 'Size of the email in bytes';
