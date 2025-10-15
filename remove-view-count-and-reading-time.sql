-- 移除博客浏览次数和阅读时间相关字段和逻辑
-- 执行此脚本将从数据库中清理所有相关的字段、索引和函数

-- 1. 移除 posts 表中的 view_count 字段
ALTER TABLE public.posts
DROP COLUMN IF EXISTS view_count;

-- 2. 移除与浏览量相关的索引（如果存在）
DROP INDEX IF EXISTS idx_posts_view_count;

-- 3. 移除浏览量相关的 RPC 函数（如果存在）
DROP FUNCTION IF EXISTS increment_post_view_count(post_id UUID);
DROP FUNCTION IF EXISTS increment_post_view(post_id UUID);

-- 4. 验证修改
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 显示当前 posts 表结构
\d public.posts;

-- 注意事项：
-- 1. 此操作将永久删除 view_count 列中的所有数据
-- 2. 如果有其他视图或函数依赖此字段，需要单独处理
-- 3. 建议在执行前备份数据库
-- 4. 执行后需要更新应用代码以移除对该字段的引用