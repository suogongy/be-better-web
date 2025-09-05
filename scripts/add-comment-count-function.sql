-- 创建获取文章评论数的函数
CREATE OR REPLACE FUNCTION get_post_comment_counts(post_ids UUID[])
RETURNS TABLE(
    post_id UUID,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.post_id,
        COUNT(c.id)::bigint as comment_count
    FROM comments c
    WHERE c.post_id = ANY(post_ids)
        AND c.status = 'approved'
    GROUP BY c.post_id;
END;
$$ LANGUAGE plpgsql;

-- 为评论表的post_id和status字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status);

-- 添加注释
COMMENT ON FUNCTION get_post_comment_counts(UUID[]) IS '获取指定文章ID列表的评论数统计';