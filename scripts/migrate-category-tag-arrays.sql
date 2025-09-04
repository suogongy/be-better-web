-- 将现有关系表数据迁移到 posts 表的新字段
-- 这个脚本将 post_categories 和 post_tags 表的数据迁移到 posts 表的数组字段

-- 1. 更新所有文章的 category_ids 字段
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

-- 2. 更新所有文章的 tag_ids 字段
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

-- 3. 验证迁移结果
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

-- 4. 检查是否有文章没有被正确迁移
-- 检查有分类关联但 category_ids 为空的文章
SELECT 
  p.id,
  p.title,
  COUNT(pc.category_id) as actual_category_count
FROM posts p
LEFT JOIN post_categories pc ON p.id = pc.post_id
WHERE p.category_ids IS NULL 
  OR ARRAY_LENGTH(p.category_ids, 1) = 0
GROUP BY p.id, p.title
HAVING COUNT(pc.category_id) > 0;

-- 检查有标签关联但 tag_ids 为空的文章
SELECT 
  p.id,
  p.title,
  COUNT(pt.tag_id) as actual_tag_count
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
WHERE p.tag_ids IS NULL 
  OR ARRAY_LENGTH(p.tag_ids, 1) = 0
GROUP BY p.id, p.title
HAVING COUNT(pt.tag_id) > 0;

-- 注意：执行此脚本后，建议保留关系表以确保向后兼容性
-- 新的查询将使用数组字段进行优化，同时关系表仍然存在以支持现有的功能