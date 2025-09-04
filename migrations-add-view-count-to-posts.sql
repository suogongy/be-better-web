-- 为posts表添加view_count字段的数据库迁移

-- 1. 添加view_count字段
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. 为现有文章设置默认值
UPDATE public.posts 
SET view_count = 0 
WHERE view_count IS NULL;

-- 3. 设置非空约束
ALTER TABLE public.posts 
ALTER COLUMN view_count SET NOT NULL;

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count);

-- 迁移完成
-- 请在运行此脚本前备份数据库
