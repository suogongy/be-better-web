-- 移除文章统计和相关文章功能的数据库迁移

-- 1. 移除posts表中的view_count字段
ALTER TABLE public.posts DROP COLUMN IF EXISTS view_count;

-- 注意：这个迁移假设没有其他相关的统计表需要删除
-- 如果有其他统计相关的表（如post_stats、post_views等），请在此处添加删除语句

-- 迁移完成
-- 请在运行此脚本前备份数据库