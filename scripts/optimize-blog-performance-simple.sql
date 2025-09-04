-- 数据库性能优化脚本（免费版 Supabase）
-- 只包含索引，不包含存储过程

-- 添加搜索相关的索引（使用 simple 配置）
CREATE INDEX IF NOT EXISTS idx_posts_search ON public.posts USING gin(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, ''))
);

-- 为 title、content、excerpt 分别创建索引以提高 LIKE 查询性能
CREATE INDEX IF NOT EXISTS idx_posts_title_like ON public.posts USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_posts_content_like ON public.posts USING gin(to_tsvector('simple', content));
CREATE INDEX IF NOT EXISTS idx_posts_excerpt_like ON public.posts USING gin(to_tsvector('simple', excerpt));

-- 添加复合索引以优化分类和标签过滤
CREATE INDEX IF NOT EXISTS idx_post_categories_composite ON public.post_categories(category_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_composite ON public.post_tags(tag_id, post_id);

-- 为 posts 表添加浏览量索引（如果经常按浏览量排序）
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);

-- 为常用的查询条件添加索引
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC) WHERE status = 'published';

-- 为评论表添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON public.comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at);

-- 优化 posts 表的全文搜索（支持英文分词）
-- 注意：对于中文，我们主要依靠 ILIKE 查询