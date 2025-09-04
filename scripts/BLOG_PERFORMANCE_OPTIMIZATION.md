# 博客查询性能优化方案

## 概述

本方案通过以下优化策略提升博客列表查询性能：

1. **单表查询**：将分类和标签ID直接存储在posts表的数组字段中，避免多表JOIN
2. **本地缓存**：分类和标签数据缓存在服务内存中，定期同步
3. **批量组装**：在内存中快速组装完整的文章信息

## 实施步骤

### 1. 执行数据库迁移

```bash
# 1. 添加新字段到 posts 表
psql -d your_database -f scripts/add-post-category-tag-arrays.sql

# 2. 迁移现有数据
psql -d your_database -f scripts/migrate-category-tag-arrays.sql
```

### 2. 重启应用

应用重启后会自动：
- 初始化分类和标签缓存
- 使用新的查询逻辑
- 自动同步缓存数据（每10秒）

### 3. 验证优化效果

```bash
# 运行性能测试
npm run test:performance
```

## 性能提升预期

- **查询复杂度**：从 O(n*m) 降低到 O(n)
- **数据库请求**：从 3-4 个减少到 1 个
- **响应时间**：预计减少 60-80%
- **并发能力**：显著提升

## 技术细节

### 数据库变更

```sql
-- 新增字段
ALTER TABLE posts ADD COLUMN category_ids UUID[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN tag_ids UUID[] DEFAULT '{}';

-- 创建索引
CREATE INDEX idx_posts_category_ids ON posts USING gin(category_ids);
CREATE INDEX idx_posts_tag_ids ON posts USING gin(tag_ids);
```

### 查询优化

**优化前**：
```sql
-- 需要多表JOIN
SELECT p.*, c.*, t.*
FROM posts p
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
```

**优化后**：
```sql
-- 单表查询
SELECT * FROM posts
WHERE status = 'published'
  AND category_ids @> ARRAY['category-id']::uuid[]
```

### 缓存机制

- **初始化**：应用启动时加载所有分类和标签
- **同步间隔**：每10秒自动同步一次
- **内存结构**：使用Map实现O(1)查找
- **数据一致性**：保证最终一致性

## 向后兼容性

1. **关系表保留**：post_categories 和 post_tags 表仍然保留
2. **双写机制**：创建/更新文章时同时更新新字段和关系表
3. **降级策略**：如果新查询失败，自动回退到原查询方式

## 监控和调试

### 查看缓存状态

```typescript
import { categoryTagCache } from '@/lib/cache/category-tag-cache'

console.log(categoryTagCache.getStatus())
```

### 手动刷新缓存

```typescript
await categoryTagCache.refresh()
```

## 注意事项

1. **内存使用**：分类和标签数据量小，内存占用可忽略
2. **数据一致性**：缓存同步有10秒延迟，对分类和标签的修改不会立即反映
3. **扩展性**：如需支持更多分类和标签，可调整缓存同步间隔

## 故障排除

### 缓存未初始化

检查应用启动日志，确保缓存初始化成功：
```
[INFO] Category and tag cache initialized
```

### 查询仍然慢

1. 确认数据库索引已创建
2. 检查是否使用了优化后的查询方法
3. 查看数据库慢查询日志

### 分类标签信息为空

1. 检查缓存是否包含数据
2. 手动刷新缓存：`await categoryTagCache.refresh()`
3. 确认 posts 表中的 category_ids 和 tag_ids 字段有数据