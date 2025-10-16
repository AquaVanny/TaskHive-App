-- Check if tasks are being created at all

-- 1. Count tasks created in last hour
SELECT COUNT(*) as recent_tasks_count
FROM tasks
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 2. Show recent tasks (any that exist)
SELECT 
  id,
  title,
  due_date,
  created_at,
  user_id
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check tasks INSERT policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tasks' AND cmd = 'INSERT';

-- 4. Check if there are any issues with your user_id
SELECT 
  auth.uid() as current_user_id,
  (SELECT COUNT(*) FROM tasks WHERE user_id = auth.uid()) as your_task_count;
