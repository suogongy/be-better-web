-- 移除多用户体系 - 数据库修改脚本

-- 1. 简化 posts 表，移除 user_id 外键
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE posts DROP COLUMN IF EXISTS user_id;

-- 2. 为所有现有文章设置默认管理员ID（如果需要保留用户信息）
-- 或者直接删除用户ID字段，因为现在只有管理员

-- 3. 可选：如果需要保留简单的用户信息，可以创建一个简单的管理员配置表
-- DROP TABLE IF EXISTS admin_config CASCADE;
-- CREATE TABLE admin_config (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     email TEXT NOT NULL UNIQUE,
--     password_hash TEXT NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 4. 删除不需要的表和字段
-- 如果不需要用户个人资料，可以删除以下表：
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_social_links CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- 5. 简化 comments 表，移除用户关联（可选，如果评论也需要匿名化）
-- ALTER TABLE comments DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE comments ADD COLUMN author_name TEXT;
-- ALTER TABLE comments ADD COLUMN author_email TEXT;

-- 6. 创建或更新 RLS 策略
-- 由于所有操作都是管理员执行，可以简化安全策略

-- 注意：执行此脚本前请备份数据！