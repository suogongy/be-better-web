-- 清空所有表数据的SQL脚本
-- ⚠️ 警告：这将删除所有数据，仅适用于开发和测试环境！

-- 删除所有触发器和函数（纯数据库存储，无业务逻辑）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_daily_summaries_updated_at ON public.daily_summaries;
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- 清空所有表数据（按依赖关系顺序删除，避免冲突）
-- 1. 先删除关联数据
TRUNCATE TABLE public.post_categories CASCADE;
TRUNCATE TABLE public.post_tags CASCADE;
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.habit_logs CASCADE;
TRUNCATE TABLE public.mood_logs CASCADE;

-- 2. 删除主要业务数据
TRUNCATE TABLE public.daily_summaries CASCADE;
TRUNCATE TABLE public.tasks CASCADE;
TRUNCATE TABLE public.habits CASCADE;
TRUNCATE TABLE public.posts CASCADE;

-- 3. 删除分类和标签数据
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.tags CASCADE;

-- 4. 最后删除用户数据
TRUNCATE TABLE public.users CASCADE;

-- 5. 重新插入默认的分类和标签数据
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Productivity', 'productivity', 'Tips and insights about productivity and time management', '#3B82F6'),
  ('Personal', 'personal', 'Personal thoughts, experiences, and reflections', '#10B981'),
  ('Technology', 'technology', 'Technology-related posts and tutorials', '#8B5CF6'),
  ('Schedule', 'schedule', 'Posts generated from daily schedules and summaries', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES
  ('productivity', 'productivity'),
  ('time-management', 'time-management'),
  ('habits', 'habits'),
  ('goals', 'goals'),
  ('reflection', 'reflection'),
  ('weekly-review', 'weekly-review'),
  ('daily-summary', 'daily-summary'),
  ('tips', 'tips'),
  ('getting-started', 'getting-started'),
  ('tutorial', 'tutorial')
ON CONFLICT (slug) DO NOTHING;

-- 6. 重置所有序列（如果有的话）
-- 这确保ID从1开始重新计数
SELECT setval(pg_get_serial_sequence('public.categories', 'id'), 1, false) WHERE pg_get_serial_sequence('public.categories', 'id') IS NOT NULL;
SELECT setval(pg_get_serial_sequence('public.tags', 'id'), 1, false) WHERE pg_get_serial_sequence('public.tags', 'id') IS NOT NULL;

-- 7. 验证清空结果
DO $$
DECLARE
  table_name TEXT;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '📊 数据清空验证报告：';
  RAISE NOTICE '=====================================';
  
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename NOT IN ('categories', 'tags')  -- 跳过有默认数据的表
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM public.' || table_name INTO row_count;
    RAISE NOTICE '表 %: % 条记录', table_name, row_count;
  END LOOP;
  
  -- 检查分类和标签
  SELECT COUNT(*) INTO row_count FROM public.categories;
  RAISE NOTICE '表 categories: % 条记录 (应该有4个默认分类)', row_count;
  
  SELECT COUNT(*) INTO row_count FROM public.tags;
  RAISE NOTICE '表 tags: % 条记录 (应该有10个默认标签)', row_count;
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE '✅ 数据清空完成！可以开始全新的测试了。';
END $$;

COMMENT ON SCHEMA public IS 'Database reset completed - ready for fresh testing';