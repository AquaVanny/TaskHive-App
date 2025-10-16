-- Find ALL recent tasks (regardless of due_date)
-- This will show if your task was created

SELECT 
  t.id,
  t.title,
  t.due_date,
  t.created_at,
  t.user_id,
  p.email as creator_email,
  p.notification_email,
  NOW() as current_time,
  CASE 
    WHEN t.due_date IS NULL THEN 'NO DUE DATE SET'
    WHEN t.due_date < NOW() THEN 'PAST DUE DATE'
    ELSE 'FUTURE DUE DATE'
  END as due_date_status
FROM tasks t
JOIN profiles p ON t.user_id = p.id
WHERE t.created_at > NOW() - INTERVAL '1 hour'  -- Tasks created in last hour
ORDER BY t.created_at DESC;

-- Also check if reminders exist for recent tasks
SELECT 
  tr.id,
  tr.task_id,
  t.title,
  tr.reminder_scheduled_at,
  tr.reminder_sent,
  tr.created_at,
  NOW() as current_time
FROM task_reminders tr
JOIN tasks t ON tr.task_id = t.id
WHERE tr.created_at > NOW() - INTERVAL '1 hour'
ORDER BY tr.created_at DESC;
