-- Comprehensive Email Notification Diagnostics
-- Run each section in your Supabase SQL Editor

-- ============================================
-- SECTION 1: Check if Cron Job is Running
-- ============================================
SELECT 
  jobname, 
  schedule, 
  active,
  jobid
FROM cron.job 
WHERE jobname = 'send-task-reminders-every-5-minutes';
-- Expected: 1 row with active = true

-- ============================================
-- SECTION 2: Check Recent Tasks with Due Dates
-- ============================================
SELECT 
  t.id,
  t.title,
  t.due_date,
  t.created_at,
  t.user_id,
  p.email as creator_email,
  p.notification_email,
  NOW() as current_time,
  t.due_date - INTERVAL '30 minutes' as reminder_time
FROM tasks t
JOIN profiles p ON t.user_id = p.id
WHERE t.due_date > NOW()
ORDER BY t.created_at DESC
LIMIT 10;
-- This shows tasks and when their reminders should trigger

-- ============================================
-- SECTION 3: Check if Reminders Were Created
-- ============================================
SELECT 
  tr.id,
  tr.task_id,
  t.title as task_title,
  t.due_date,
  tr.reminder_scheduled_at,
  tr.reminder_sent,
  tr.created_at,
  p.email as user_email,
  p.notification_email as email_enabled,
  NOW() as current_time,
  CASE 
    WHEN tr.reminder_sent THEN 'Already Sent'
    WHEN tr.reminder_scheduled_at <= NOW() THEN 'Should Have Been Sent'
    ELSE 'Scheduled for Future'
  END as status
FROM task_reminders tr
JOIN tasks t ON tr.task_id = t.id
JOIN profiles p ON tr.user_id = p.id
ORDER BY tr.created_at DESC
LIMIT 20;
-- This shows if reminders exist and their status

-- ============================================
-- SECTION 4: Check Your Profile Email Settings
-- ============================================
SELECT 
  id,
  email,
  full_name,
  notification_email,
  notification_push,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
-- Verify notification_email is TRUE

-- ============================================
-- SECTION 5: Check Cron Job Execution History
-- ============================================
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'send-task-reminders-every-5-minutes'
)
ORDER BY start_time DESC
LIMIT 10;
-- Shows recent cron job executions and any errors

-- ============================================
-- SECTION 6: Test - Create Manual Reminder (OPTIONAL)
-- ============================================
-- Uncomment to manually create a reminder that should trigger immediately
/*
INSERT INTO task_reminders (task_id, user_id, reminder_scheduled_at, reminder_sent)
SELECT 
  t.id as task_id,
  t.user_id,
  NOW() + INTERVAL '2 minutes' as reminder_scheduled_at,
  false as reminder_sent
FROM tasks t
WHERE t.due_date > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM task_reminders tr 
    WHERE tr.task_id = t.id
  )
LIMIT 1
RETURNING *;
*/

-- ============================================
-- SECTION 7: Check Edge Function Logs
-- ============================================
-- You need to check this in Supabase Dashboard:
-- Dashboard → Edge Functions → send-task-reminder → Logs
-- Look for any errors or successful executions
