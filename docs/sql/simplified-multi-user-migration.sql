-- 精简版多用户系统迁移脚本
-- 只保留核心的博客和基础用户功能

-- ========================================
-- 1. 恢复多用户架构
-- ========================================

-- 为现有表添加 user_id 字段（如果不存在）
DO $$
BEGIN
    -- 检查并添加 posts 表的 user_id 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE posts ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- 检查并创建简化版 users 表（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100),
            avatar_url TEXT,
            bio TEXT,
            website VARCHAR(255),
            is_admin BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT TRUE,
            username VARCHAR(50) UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 检查并添加 users 表的缺失字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- ========================================
-- 2. 简化的评论系统
-- ========================================

-- 删除旧的评论表（如果存在）
DROP TABLE IF EXISTS public.comments CASCADE;

-- 创建新的博客评论表
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 登录用户评论
    parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100), -- 游客评论名称
    author_email VARCHAR(255), -- 游客评论邮箱
    author_website VARCHAR(255), -- 游客评论网站
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
    is_author BOOLEAN DEFAULT FALSE, -- 是否是文章作者回复
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 基础索引
-- ========================================

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_public ON public.users(is_public);

-- 博客相关索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_public ON public.posts(user_id, status) WHERE status = 'published';

-- 评论相关索引
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON public.blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON public.blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON public.blog_comments(created_at DESC);

-- ========================================
-- 4. 简化的 RLS 安全策略
-- ========================================

-- 删除现有简化策略
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can update posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON public.posts;

-- 用户资料策略
CREATE POLICY "公开用户资料所有人可见" ON public.users
    FOR SELECT USING (is_public = true);

CREATE POLICY "用户可以查看自己的资料" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 博客文章策略
CREATE POLICY "已发布文章所有人可见" ON public.posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "用户可以查看自己的所有文章" ON public.posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建文章" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的文章" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文章" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- 评论策略
CREATE POLICY "已批准评论所有人可见" ON public.blog_comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "用户可以查看自己文章的评论" ON public.blog_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = blog_comments.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "用户可以创建评论" ON public.blog_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR  -- 登录用户评论
        (user_id IS NULL AND author_email IS NOT NULL)  -- 游客评论
    );

CREATE POLICY "文章作者可以管理评论" ON public.blog_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = blog_comments.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "文章作者可以删除评论" ON public.blog_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = blog_comments.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- ========================================
-- 5. 简化的触发器和函数
-- ========================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON public.blog_comments;
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 生成用户名的函数
CREATE OR REPLACE FUNCTION generate_username()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    counter INTEGER := 1;
BEGIN
    -- 基于邮箱前缀生成用户名
    new_username := split_part(NEW.email, '@', 1);

    -- 确保用户名唯一
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
        new_username := split_part(NEW.email, '@', 1) || counter;
        counter := counter + 1;
    END LOOP;

    NEW.username := new_username;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_username_trigger ON public.users;
CREATE TRIGGER generate_username_trigger BEFORE INSERT ON public.users
    FOR EACH ROW WHEN (NEW.username IS NULL) EXECUTE FUNCTION generate_username();

-- ========================================
-- 6. 数据迁移（如果需要）
-- ========================================

-- 如果存在现有的文章数据，需要分配给默认管理员用户
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- 检查是否有需要分配 user_id 的文章
    IF EXISTS (SELECT 1 FROM public.posts WHERE user_id IS NULL) THEN
        -- 创建或获取管理员用户
        SELECT id INTO admin_user_id FROM public.users WHERE is_admin = TRUE LIMIT 1;

        IF admin_user_id IS NULL THEN
            -- 创建默认管理员用户
            INSERT INTO public.users (email, name, is_admin, username)
            VALUES ('admin@be-better-web.com', 'Administrator', TRUE, 'admin')
            ON CONFLICT (email) DO UPDATE SET is_admin = TRUE
            RETURNING id INTO admin_user_id;
        END IF;

        -- 将现有文章分配给管理员
        UPDATE public.posts SET user_id = admin_user_id WHERE user_id IS NULL;

        -- 同样处理其他表的数据
        UPDATE public.tasks SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.daily_summaries SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.habits SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.habit_logs SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.mood_logs SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.data_exports SET user_id = admin_user_id WHERE user_id IS NULL;
        UPDATE public.productivity_insights SET user_id = admin_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- ========================================
-- 7. 权限设置
-- ========================================

-- 确保认证用户有基本权限
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;

-- 匿名用户权限（只读）
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.blog_comments TO anon;

COMMIT;

-- ========================================
-- 8. 清理不需要的表和索引
-- ========================================

-- 删除可能存在的复杂功能表
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.user_subscribers CASCADE;
DROP TABLE IF EXISTS public.user_analytics CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.user_verifications CASCADE;
DROP TABLE IF EXISTS public.user_login_history CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_follow_categories CASCADE;
DROP TABLE IF EXISTS public.categorized_follows CASCADE;
DROP TABLE IF EXISTS public.user_interests CASCADE;
DROP TABLE IF EXISTS public.recommended_posts CASCADE;
DROP TABLE IF EXISTS public.recommended_users CASCADE;
DROP TABLE IF EXISTS public.notification_types CASCADE;
DROP TABLE IF EXISTS public.user_notifications CASCADE;
DROP TABLE IF EXISTS public.user_notification_settings CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;
DROP TABLE IF EXISTS public.user_reports CASCADE;
DROP TABLE IF EXISTS public.user_bans CASCADE;

-- 删除可能存在的复杂索引
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_user_subscribers_subscribed_to;
DROP INDEX IF EXISTS idx_user_subscribers_subscriber;
DROP INDEX IF EXISTS idx_user_analytics_user_date;
DROP INDEX IF EXISTS idx_comment_likes_comment_id;
DROP INDEX IF EXISTS idx_comment_likes_user_id;
DROP INDEX IF EXISTS idx_post_likes_post_id;
DROP INDEX IF EXISTS idx_post_likes_user_id;
DROP INDEX IF EXISTS idx_user_follows_follower;
DROP INDEX IF EXISTS idx_user_follows_following;
DROP INDEX IF EXISTS idx_user_favorites_user_id;
DROP INDEX IF EXISTS idx_user_favorites_post_id;

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '=== 精简版多用户系统迁移完成 ===';
    RAISE NOTICE '保留功能：';
    RAISE NOTICE '1. 基础用户管理';
    RAISE NOTICE '2. 博客文章系统';
    RAISE NOTICE '3. 标签和分类';
    RAISE NOTICE '4. 评论系统';
    RAISE NOTICE '5. 基础权限控制';
    RAISE NOTICE '';
    RAISE NOTICE '已移除功能：';
    RAISE NOTICE '1. 统计分析';
    RAISE NOTICE '2. 通知系统';
    RAISE NOTICE '3. 社交功能（关注、点赞等）';
    RAISE NOTICE '4. 复杂的用户设置';
    RAISE NOTICE '5. 推荐系统';
    RAISE NOTICE '';
    RAISE NOTICE '请检查：';
    RAISE NOTICE '1. 确认所有现有数据已正确分配给用户';
    RAISE NOTICE '2. 测试用户注册和登录功能';
    RAISE NOTICE '3. 验证博客文章创建和编辑';
    RAISE NOTICE '4. 测试评论功能';
END $$;