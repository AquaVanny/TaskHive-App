-- Check ALL tasks created in last hour (no auth filter)

-- 1. Count all recent tasks
SELECT COUNT(*) as total_recent_tasks
FROM tasks
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 2. Show all recent tasks with user info
SELECT 
  t.id,
  t.title,
  t.description,
  t.due_date,
  t.status,
  t.created_at,
  t.user_id,
  p.email as creator_email
FROM tasks t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE t.created_at > NOW() - INTERVAL '1 hour'
ORDER BY t.created_at DESC;

-- 3. Check if the specific task ID exists
SELECT 
  id,
  title,
  due_date,
  created_at,
  user_id
FROM tasks
WHERE id = 'aecd861a-f0fe-4cea-8d78-706954d87995';

-- 4. Check task_reminders for that task
SELECT * FROM task_reminders
WHERE task_id = 'aecd861a-f0fe-4cea-8d78-706954d87995';
