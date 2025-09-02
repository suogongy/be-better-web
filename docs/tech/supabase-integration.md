# Supabase 集成使用文档

## 概述

本文档详细说明了 Be Better Web 项目中 Supabase 的集成和使用方式。项目使用 Supabase 作为后端服务，包括数据库、认证和存储功能。

## 目录结构

```
src/lib/supabase/
├── client.ts              # Supabase 客户端配置和实例管理
├── services/              # 数据库服务层
│   ├── index.ts           # 服务统一导出
│   ├── database-error.ts  # 数据库错误处理
│   ├── post-service.ts    # 文章相关服务
│   ├── category-service.ts # 分类相关服务
│   ├── tag-service.ts     # 标签相关服务
│   ├── comment-service.ts # 评论相关服务
│   ├── task-service.ts    # 任务相关服务
│   ├── user-service.ts    # 用户相关服务
│   ├── summary-service.ts # 摘要相关服务
│   └── export-service.ts  # 导出相关服务
└── schema-final.sql       # 数据库 schema 定义
```

## 客户端配置

### 环境变量

项目需要以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 客户端实例

项目提供了两种客户端实例：

1. **普通客户端** - 用于常规数据库操作
2. **管理员客户端** - 用于需要更高权限的操作

```typescript
import { createClient, createAdminClient } from '@/lib/supabase/client'

// 创建普通客户端
const client = createClient()

// 创建管理员客户端
const adminClient = createAdminClient()
```

## 服务层架构

所有数据库操作都通过服务层进行，每个实体都有对应的服务模块。

### 使用示例

```typescript
import { postService } from '@/lib/supabase/services'

// 获取文章列表
const { data, total, page, limit, totalPages } = await postService.getPosts({
  page: 1,
  limit: 10,
  status: 'published'
})

// 获取单篇文章
const post = await postService.getPost('post-id')

// 创建文章
const newPost = await postService.createPost({
  title: 'New Post',
  content: 'Post content'
})
```

## 错误处理

所有数据库操作都使用统一的错误处理机制：

```typescript
import { DatabaseError } from '@/lib/supabase/services'

try {
  const post = await postService.getPost('post-id')
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.getFullMessage())
  }
}
```

## 最佳实践

### 1. 客户端实例管理

- 浏览器端使用单例模式，避免重复创建实例
- 服务端每次请求都创建新实例
- 优先使用管理员客户端进行服务端操作

### 2. 查询优化

- 合理使用分页，避免一次性加载大量数据
- 只查询需要的字段，避免使用 `select('*')`（特殊情况除外）
- 合理使用索引字段进行过滤

### 3. 错误处理

- 捕获并正确处理所有数据库错误
- 提供有意义的错误消息
- 区分不同类型的错误并做相应处理

## 数据模型

### 用户 (users)
- `id`: UUID (主键)
- `email`: 邮箱 (唯一)
- `name`: 姓名
- `avatar_url`: 头像URL
- `bio`: 个人简介
- `website`: 网站
- `social_links`: 社交链接 (JSON)
- `preferences`: 用户偏好设置 (JSON)
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 文章 (posts)
- `id`: UUID (主键)
- `user_id`: 作者ID
- `title`: 标题
- `content`: 内容
- `excerpt`: 摘要
- `featured_image`: 特色图片
- `status`: 状态 (draft, published, archived)
- `type`: 类型 (manual, schedule_generated)
- `meta_title`: SEO标题
- `meta_description`: SEO描述
- `published_at`: 发布时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 分类 (categories)
- `id`: UUID (主键)
- `name`: 名称 (唯一)
- `description`: 描述
- `color`: 颜色
- `created_at`: 创建时间

### 标签 (tags)
- `id`: UUID (主键)
- `name`: 名称 (唯一)
- `created_at`: 创建时间

### 评论 (comments)
- `id`: UUID (主键)
- `post_id`: 文章ID
- `parent_id`: 父评论ID (用于回复)
- `author_name`: 作者姓名
- `author_email`: 作者邮箱
- `author_website`: 作者网站
- `content`: 内容
- `status`: 状态 (pending, approved, spam, rejected)
- `ip_address`: IP地址
- `user_agent`: 用户代理
- `created_at`: 创建时间

### 任务 (tasks)
- `id`: UUID (主键)
- `user_id`: 用户ID
- `title`: 标题
- `description`: 描述
- `category`: 分类
- `priority`: 优先级 (low, medium, high)
- `status`: 状态 (pending, in_progress, completed, cancelled)
- `progress`: 进度 (0-100)
- `estimated_minutes`: 预估时间(分钟)
- `actual_minutes`: 实际时间(分钟)
- `due_date`: 截止日期
- `due_time`: 截止时间
- `is_recurring`: 是否重复
- `recurrence_pattern`: 重复模式 (JSON)
- `completion_notes`: 完成备注
- `completed_at`: 完成时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 安全考虑

1. **行级安全 (RLS)**: 数据库使用行级安全策略控制数据访问
2. **权限分离**: 不同操作使用不同权限级别的客户端
3. **环境变量**: 敏感信息通过环境变量管理，不在代码中硬编码
4. **输入验证**: 所有输入数据都经过验证

## 性能优化

1. **连接复用**: 浏览器端复用客户端连接
2. **分页查询**: 大量数据使用分页加载
3. **索引优化**: 数据库表设计时考虑查询性能
4. **缓存策略**: 合理使用客户端缓存

## 故障排除

### 常见问题

1. **环境变量缺失**: 检查 `.env.local` 文件是否包含所有必需的环境变量
2. **认证失败**: 确认 Supabase 项目配置正确
3. **权限错误**: 检查 RLS 策略是否正确配置
4. **连接超时**: 检查网络连接和 Supabase 服务状态

### 调试技巧

```typescript
// 检查配置状态
import { getConfigStatus } from '@/lib/supabase/client'

console.log(getConfigStatus())

// 启用详细日志
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', 'post-id')
  .then(result => {
    console.log('Query result:', result)
    return result
  })
```