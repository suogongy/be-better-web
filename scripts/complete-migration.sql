-- 完整的数据库迁移脚本：从多用户系统转换为单用户系统
-- 并添加性能优化字段

-- 第一步：为 posts 表添加分类和标签 ID 数组字段
-- 用于优化博客列表查询性能

-- 添加分类 ID 数组字段
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}';

-- 添加标签 ID 数组字段  
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS tag_ids UUID[] DEFAULT '{}';

-- 创建索引以优化数组查询性能
CREATE INDEX IF NOT EXISTS idx_posts_category_ids 
ON posts USING gin(category_ids);

CREATE INDEX IF NOT EXISTS idx_posts_tag_ids
ON posts USING gin(tag_ids);

-- 添加注释
COMMENT ON COLUMN posts.category_ids IS '文章分类ID数组，用于优化查询性能';
COMMENT ON COLUMN posts.tag_ids IS '文章标签ID数组，用于优化查询性能';

-- 第二步：将现有关系表数据迁移到 posts 表的新字段
-- 这个脚本将 post_categories 和 post_tags 表的数据迁移到 posts 表的数组字段

-- 更新所有文章的 category_ids 字段
UPDATE posts 
SET category_ids = (
  SELECT COALESCE(ARRAY_AGG(category_id), '{}')
  FROM post_categories 
  WHERE post_categories.post_id = posts.id
)
WHERE EXISTS (
  SELECT 1 FROM post_categories 
  WHERE post_categories.post_id = posts.id
);

-- 更新所有文章的 tag_ids 字段
UPDATE posts 
SET tag_ids = (
  SELECT COALESCE(ARRAY_AGG(tag_id), '{}')
  FROM post_tags 
  WHERE post_tags.post_id = posts.id
)
WHERE EXISTS (
  SELECT 1 FROM post_tags 
  WHERE post_tags.post_id = posts.id
);

-- 第三步：简化 posts 表，移除 user_id 外键（如果存在）
-- 首先检查外键约束是否存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_user_id_fkey') THEN
        ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;
END
$$;

-- 移除 user_id 字段（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_id') THEN
        ALTER TABLE posts DROP COLUMN user_id;
    END IF;
END
$$;

-- 第四步：删除不需要的用户相关表（如果存在）
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_social_links CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- 第五步：创建或更新搜索索引（如果不存在）
-- 为标题和内容创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON posts USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('simple', content));

-- 第六步：优化现有索引
-- 确保状态索引存在
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);

-- 第七步：验证迁移结果
-- 查看迁移后的数据样例
SELECT 
  id,
  title,
  ARRAY_LENGTH(category_ids, 1) as category_count,
  ARRAY_LENGTH(tag_ids, 1) as tag_count,
  category_ids,
  tag_ids
FROM posts 
WHERE ARRAY_LENGTH(category_ids, 1) > 0 OR ARRAY_LENGTH(tag_ids, 1) > 0
LIMIT 10;

-- 第八步：更新 RLS 策略为单用户模式
-- 由于所有操作都是管理员执行，简化安全策略
DROP POLICY IF EXISTS "Users can view published posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- 创建简化的管理员策略
CREATE POLICY "Admin can manage all posts" ON posts
  USING (true)  -- 管理员可以访问所有文章
  WITH CHECK (true);

-- 确保 RLS 已启用
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 迁移完成！
-- 注意：此脚本保留了 post_categories 和 post_tags 表以确保向后兼容性
-- 新的查询将使用数组字段进行优化，同时关系表仍然存在以支持现有的功能