-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the task reminder function to run every 5 minutes
SELECT cron.schedule(
  'send-task-reminders-every-5-minutes',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://zljgjxiwoedzwbmgeivd.supabase.co/functions/v1/send-task-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsamdqeGl3b2VkendibWdlaXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzMyMzAsImV4cCI6MjA3NTI0OTIzMH0.gJ4Aj6UROfTVjfoJi_5HgiwBCG_ctZbMpTAhgTvd6ew"}'::jsonb,
        body:=concat('{"scheduled_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);