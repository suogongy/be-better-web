-- 为 posts 表添加分类和标签 ID 数组字段（兼容版本）
-- 用于优化博客列表查询性能

-- 检查字段是否已存在，不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'category_ids') THEN
        ALTER TABLE posts ADD COLUMN category_ids UUID[] DEFAULT '{}';
        RAISE NOTICE 'Added category_ids column';
    ELSE
        RAISE NOTICE 'category_ids column already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tag_ids') THEN
        ALTER TABLE posts ADD COLUMN tag_ids UUID[] DEFAULT '{}';
        RAISE NOTICE 'Added tag_ids column';
    ELSE
        RAISE NOTICE 'tag_ids column already exists';
    END IF;
END $$;

-- 创建索引（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'idx_posts_category_ids') THEN
        CREATE INDEX idx_posts_category_ids ON posts USING gin(category_ids);
        RAISE NOTICE 'Created idx_posts_category_ids index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'idx_posts_tag_ids') THEN
        CREATE INDEX idx_posts_tag_ids ON posts USING gin(tag_ids);
        RAISE NOTICE 'Created idx_posts_tag_ids index';
    END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN posts.category_ids IS '文章分类ID数组，用于优化查询性能';
COMMENT ON COLUMN posts.tag_ids IS '文章标签ID数组，用于优化查询性能';