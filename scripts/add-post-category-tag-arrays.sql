-- 为 posts 表添加分类和标签 ID 数组字段
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