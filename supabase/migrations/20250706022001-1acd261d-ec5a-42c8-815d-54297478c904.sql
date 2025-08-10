-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule data collection every 15 minutes
SELECT cron.schedule(
  'collect-data-every-15-minutes',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://uyamvlctjacvevyfdnez.supabase.co/functions/v1/schedule-data-collection',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule more frequent activity data collection (every 5 minutes during active hours)
SELECT cron.schedule(
  'collect-activity-data-frequent',
  '*/5 6-22 * * *', -- every 5 minutes between 6 AM and 10 PM
  $$
  SELECT
    net.http_post(
        url:='https://uyamvlctjacvevyfdnez.supabase.co/functions/v1/collect-activity-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule location collection every 30 minutes
SELECT cron.schedule(
  'collect-location-data-regular',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://uyamvlctjacvevyfdnez.supabase.co/functions/v1/collect-location-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);