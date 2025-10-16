-- Run this in Supabase SQL Editor to verify the system

-- 1. Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'send-task-reminders-every-5-minutes';

-- 2. Check recent reminders
SELECT 
  tr.*,
  t.title as task_title,
  t.due_date,
  p.email as user_email
FROM task_reminders tr
JOIN tasks t ON tr.task_id = t.id
JOIN profiles p ON tr.user_id = p.id
ORDER BY tr.created_at DESC
LIMIT 10;

-- 3. Check your email notification preference
SELECT id, email, full_name, notification_email 
FROM profiles 
WHERE email = 'your-email@example.com'; -- Replace with your email

-- 4. Manually trigger a test (creates a reminder for testing)
-- Uncomment and run if you want to test immediately:
/*
INSERT INTO task_reminders (task_id, user_id, reminder_scheduled_at, reminder_sent)
SELECT 
  id as task_id,
  user_id,
  NOW() + INTERVAL '1 minute' as reminder_scheduled_at,
  false as reminder_sent
FROM tasks
WHERE due_date > NOW()
LIMIT 1;
*/
