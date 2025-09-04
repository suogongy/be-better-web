# 数据库迁移指南

## 概述
此迁移将多用户博客系统转换为单一管理员系统，并优化性能。

## 迁移步骤

### 1. 备份数据库（重要！）
在执行任何迁移之前，请确保：
- 在 Supabase Dashboard 中创建数据库备份
- 导出所有重要数据

### 2. 执行迁移脚本

#### 方法一：通过 Supabase Dashboard SQL Editor
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "SQL Editor"
4. 创建新查询
5. 复制 `scripts/complete-migration.sql` 的内容并执行

#### 方法二：通过 Supabase CLI
```bash
# 登录到 Supabase
npx supabase login

# 执行 SQL 脚本
npx supabase db shell --file scripts/complete-migration.sql
```

### 3. 验证迁移结果

#### 检查表结构
```sql
-- 检查新字段是否添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('category_ids', 'tag_ids', 'user_id');
```

#### 检查数据迁移
```sql
-- 检查分类和标签数据是否正确迁移
SELECT 
  id,
  title,
  ARRAY_LENGTH(category_ids, 1) as category_count,
  ARRAY_LENGTH(tag_ids, 1) as tag_count
FROM posts 
LIMIT 10;
```

#### 检查性能
```sql
-- 测试新查询的性能
EXPLAIN ANALYZE
SELECT * FROM posts 
WHERE category_ids @> ARRAY['your-category-id-here']::uuid[];
```

### 4. 测试应用程序功能

#### 测试博客列表
1. 访问 `/blog` 页面
2. 检查文章是否正确显示
3. 测试过滤功能（分类、标签、搜索）

#### 测试文章详情
1. 点击文章标题进入详情页
2. 检查文章内容是否正确显示
3. 验证分类和标签是否正确显示

#### 测试管理功能
1. 访问 `/blog/new` 创建新文章
2. 测试编辑和删除功能
3. 验证分类和标签的分配

### 5. 回滚计划（如果需要）

如果迁移出现问题，可以执行以下回滚操作：

```sql
-- 回滚脚本（如果需要）
-- 1. 重新添加 user_id 字段（如果需要）
ALTER TABLE posts ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 2. 更新所有文章为管理员ID
UPDATE posts SET user_id = 'your-admin-user-id';

-- 3. 重新添加外键约束
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 4. 恢复原来的 RLS 策略
DROP POLICY IF EXISTS "Admin can manage all posts" ON posts;
CREATE POLICY "Users can view published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
```

## 迁移后的优化

### 性能监控
- 监控博客列表页面的加载时间
- 检查数据库查询性能
- 监控 API 响应时间

### 缓存策略
- 确保分类和标签缓存正常工作
- 验证 CDN 缓存设置
- 检查浏览器缓存策略

### SEO 优化
- 验证文章 URL 结构
- 检查 sitemap.xml 是否正确生成
- 确保 RSS feed 正常工作

## 常见问题

### Q: 迁移后文章无法显示？
A: 检查 posts 表中的 category_ids 和 tag_ids 字段是否正确填充数据。

### Q: 过滤功能不工作？
A: 确保 category_ids 和 tag_ids 字段上有 GIN 索引。

### Q: 性能没有改善？
A: 检查查询是否使用了新的数组字段，而不是关联表。

## 联系信息
如果在迁移过程中遇到问题，请：
1. 检查 Supabase Dashboard 中的错误日志
2. 查看浏览器控制台的错误信息
3. 参考项目文档或联系开发团队