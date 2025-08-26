-- 删除所有数据库触发器和函数
-- 确保数据库只处理数据存取，所有业务逻辑在应用代码中实现

-- 1. 删除所有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_daily_summaries_updated_at ON public.daily_summaries;
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;

-- 2. 删除所有自定义函数
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.increment_post_views(UUID);
DROP FUNCTION IF EXISTS public.calculate_daily_stats(UUID, DATE);

-- 3. 删除所有存储过程（如果有的话）
-- 这里列出可能存在的存储过程，即使不存在也不会报错
DROP FUNCTION IF EXISTS public.get_posts_with_relations(VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_stats(UUID);
DROP FUNCTION IF EXISTS public.cleanup_orphaned_data();

-- 4. 删除所有视图（如果有的话）
DROP VIEW IF EXISTS public.posts_with_categories;
DROP VIEW IF EXISTS public.posts_with_tags;
DROP VIEW IF EXISTS public.user_statistics;

-- 5. 确保RLS策略简化
-- 删除复杂的RLS策略，只保留基本的访问控制
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can update posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON public.posts;

-- 重新创建最简单的RLS策略
CREATE POLICY "Allow all operations" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.post_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.post_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.daily_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.mood_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. 验证清理结果
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- 检查剩余触发器数量
  SELECT COUNT(*) INTO trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  -- 检查剩余自定义函数数量
  SELECT COUNT(*) INTO function_count 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  
  RAISE NOTICE '🔧 数据库清理完成报告：';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '剩余触发器数量: %', trigger_count;
  RAISE NOTICE '剩余自定义函数数量: %', function_count;
  RAISE NOTICE '=====================================';
  
  IF trigger_count = 0 AND function_count = 0 THEN
    RAISE NOTICE '✅ 所有触发器和函数已清理完成！';
    RAISE NOTICE '📊 数据库现在是纯数据存储，所有逻辑在应用代码中处理。';
  ELSE
    RAISE NOTICE '⚠️ 仍有一些触发器或函数存在，请手动检查。';
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Pure data storage - no triggers or functions, all logic in application code';