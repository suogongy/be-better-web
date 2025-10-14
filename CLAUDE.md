# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。分析和输出分析结论请用中文。

## 项目概述

**Be Better Web** 是一个现代化的个人网站平台，结合了博客管理与日常生产力、日程管理功能。基于 Next.js 15、React 19 和 Supabase 构建，该系统作为单一管理员系统，用于管理博客同时跟踪日常任务并自动从完成的日程生成博客内容。

### 核心功能
- **博客管理**：功能完整的博客系统，支持分类、标签和富文本编辑
- **日程管理**：任务跟踪与进度监控和每日总结
- **自动博客生成**：从日程总结自动创建博客文章
- **管理员认证**：单一管理员登录系统
- **响应式设计**：移动优先的界面，支持深色/浅色主题
- **数据分析**：生产力跟踪和性能指标

## 技术栈详解

### 前端技术栈
- **Next.js 15.5.0**：使用 App Router 的全栈框架
  - 服务端组件 (SSR)
  - 静态站点生成 (SSG)
  - API 路由
  - 中间件支持
- **React 19.1.0**：UI 库
  - Hooks API
  - 并发特性
  - 严格模式
- **TypeScript 5+**：类型安全
  - 严格模式配置
  - 全面的类型定义
  - 接口和类型别名
- **Tailwind CSS v4**：样式框架
  - 实用类优先
  - 响应式设计
  - 暗色模式支持
  - 自定义主题

### 状态管理与数据获取
- **React Context**：全局状态管理
  - 认证状态
  - 主题设置
- **SWR**：服务端状态管理
  - 数据获取
  - 缓存策略
  - 重新验证
- **React Hook Form**：表单管理
  - 高性能表单
  - 内置验证
  - 字段级错误处理

### 后端与服务
- **Supabase**：后端即服务
  - PostgreSQL 数据库
  - 认证系统
  - 实时订阅
  - 文件存储
  - 边缘函数
- **Zod**：模式验证
  - 运行时类型检查
  - 表单验证
  - API 响应验证

### UI 组件库
- **Radix UI**：无头组件基础
  - 可访问性优先
  - 键盘导航
  - 屏幕阅读器支持
- **Lucide React**：图标库
  - 1000+ 图标
  - 可定制
  - 轻量级
- **Framer Motion**：动画库
  - 手势动画
  - 页面过渡
  - 拖拽交互

### 开发工具
- **ESLint 9+**：代码检查
  - Next.js 推荐配置
  - TypeScript 规则
  - 最佳实践
- **Jest**：测试框架
  - 单元测试
  - 集成测试
  - 快照测试
- **Turbopack**：构建工具
  - 增量构建
  - 快速热重载

## 代码规范

### TypeScript 规范
```typescript
// 1. 使用严格的类型定义
interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

// 2. 使用泛型提高复用性
interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

// 3. 使用联合类型和字面量类型
type PostStatus = 'draft' | 'published' | 'archived'

// 4. 使用工具类型
type PostPreview = Pick<Post, 'id' | 'title' | 'excerpt'>
```

### React 组件规范
```typescript
// 1. 使用函数组件和 Hooks
const BlogPost: React.FC<BlogPostProps> = ({ post, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <article className="blog-post">
      {/* JSX 内容 */}
    </article>
  )
}

// 2. 使用 TypeScript 接口定义 Props
interface BlogPostProps {
  post: Post
  onEdit: (id: string) => void
  className?: string
}

// 3. 使用自定义 Hooks 复用逻辑
const useBlogPosts = (filters?: PostFilters) => {
  const [posts, setPosts] = useState<Post[]>([])
  // ...
  return { posts, loading, error }
}
```

### 命名约定
```typescript
// 文件命名：kebab-case
// blog-post-list.tsx
// user-profile.service.ts

// 组件命名：PascalCase
const BlogPostCard = () => {}

// 变量和函数：camelCase
const blogPosts = []
const fetchBlogPosts = () => {}

// 常量：SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'

// 接口：PascalCase，以 I 开头（可选）
interface IUserProfile {}

// 类型：PascalCase
type PostStatus = 'draft' | 'published'
```

### 文件组织规范
```
src/
├── app/                    # Next.js App Router
│   ├── [slug]/            # 动态路由
│   ├── (auth)/           # 路由组
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/           # 组件目录
│   ├── ui/              # 基础 UI 组件
│   ├── blog/            # 博客相关组件
│   └── layout/          # 布局组件
├── lib/                 # 工具库
│   ├── utils/           # 通用工具函数
│   ├── services/        # API 服务
│   └── hooks/           # 自定义 Hooks
└── types/               # TypeScript 类型定义
```

### API 设计规范
```typescript
// 1. 使用 RESTful 设计
GET    /api/posts              # 获取文章列表
GET    /api/posts/[id]         # 获取单篇文章
POST   /api/posts              # 创建文章
PUT    /api/posts/[id]         # 更新文章
DELETE /api/posts/[id]         # 删除文章

// 2. 统一的响应格式
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// 3. 使用 Zod 验证请求体
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(['draft', 'published'])
})
```

### 样式规范
```typescript
// 1. 使用 Tailwind 实用类
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">

// 2. 响应式设计
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 3. 状态样式
<button className={`px-4 py-2 rounded-lg ${
  isActive 
    ? 'bg-blue-500 text-white' 
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
}`}>

// 4. 暗色模式支持
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### 错误处理规范
```typescript
// 1. 使用 Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logErrorToService(error, errorInfo)
  }
}

// 2. 自定义错误类
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 3. 统一的错误处理
const handleAsync = async <T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> => {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}
```

### 性能优化规范
```typescript
// 1. 使用 React.memo 优化组件渲染
const BlogPostCard = React.memo(function BlogPostCard({ post }: BlogPostCardProps) {
  return <div>{post.title}</div>
})

// 2. 使用 useMemo 和 useCallback
const filteredPosts = useMemo(() => {
  return posts.filter(filterFn)
}, [posts, filterFn])

const handleSubmit = useCallback(async (data: FormData) => {
  await submitPost(data)
}, [submitPost])

// 3. 动态导入
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// 4. 图片优化
<Image
  src={post.coverImage}
  alt={post.title}
  width={800}
  height={400}
  priority // 重要图片预加载
/>
```

## 数据库设计

### 核心表结构
```sql
-- 文章表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  type TEXT NOT NULL DEFAULT 'manual',
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER DEFAULT 0,
  featured_image TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分类表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 索引优化
```sql
-- 搜索优化
CREATE INDEX idx_posts_title_search ON posts USING gin(to_tsvector('simple', title));
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('simple', content));

-- 过滤优化
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC NULLS LAST);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);

-- 关联查询优化
CREATE INDEX idx_post_categories_post_id ON post_categories(post_id);
CREATE INDEX idx_post_categories_category_id ON post_categories(category_id);
```

### RLS 策略
```sql
-- 启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 创建策略（简化版，单一管理员）
CREATE POLICY "Admin can manage all posts" ON posts
  USING (true)  -- 管理员可以访问所有文章
  WITH CHECK (true);
```

## 开发工作流

### 环境设置
1. **安装依赖**
   ```bash
   npm install
   ```

2. **环境变量配置**
   ```env
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   
   # 应用配置
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NODE_ENV=development
   ```

3. **数据库设置**
   ```bash
   # 执行数据库脚本
   npm run setup-db
   ```

### 可用脚本
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run test         # 运行测试
npm run test:watch   # 监听模式运行测试
npm run test:coverage # 运行测试覆盖率
```

### Git 工作流
```bash
# 功能开发
git checkout -b feature/blog-enhancement

# 提交规范
git commit -m "feat(blog): add comment system"

# 推送到远程
git push origin feature/blog-enhancement

# 创建 Pull Request
```

### 提交信息规范
```
<type>(<scope>): <subject>

# 类型说明
feat: 新功能
fix: 修复
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建或辅助工具变动

# 示例
feat(blog): add comment system
fix(auth): resolve login issue on mobile
docs(api): update API documentation
```

## 测试规范

### 测试策略
- **单元测试**：测试工具函数和独立组件
- **集成测试**：测试组件间的交互
- **端到端测试**：测试完整用户流程

### 测试工具
- **Jest**：测试框架
- **React Testing Library**：React 组件测试
- **Playwright**：端到端测试

### 测试示例
```typescript
// 组件测试
describe('BlogPostCard', () => {
  it('should render post title and excerpt', () => {
    const post = mockPost
    render(<BlogPostCard post={post} />)
    
    expect(screen.getByText(post.title)).toBeInTheDocument()
    expect(screen.getByText(post.excerpt)).toBeInTheDocument()
  })
})

// API 测试
describe('Blog API', () => {
  it('should return posts list', async () => {
    const response = await fetch('/api/blog')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

## 部署指南

### Vercel 部署（推荐）
1. **连接仓库**
   - 在 Vercel 中导入 GitHub 仓库

2. **配置环境变量**
   - 设置所有必需的环境变量

3. **自动部署**
   - 推送到 main 分支自动部署

### 环境配置
- **开发环境**：本地开发，热重载
- **预览环境**：每个 PR 自动部署预览
- **生产环境**：优化的构建，CDN 加速

## 性能优化

### 前端优化
- **代码分割**：路由级别的代码分割
- **懒加载**：图片和组件懒加载
- **缓存策略**：SWR 数据缓存
- **预加载**：关键资源预加载

### 数据库优化
- **查询优化**：使用索引和合适的查询
- **连接池**：Supabase 管理连接
- **批量操作**：减少数据库请求次数

### 监控指标
- **Core Web Vitals**：LCP、FID、CLS
- **加载性能**：FCP、TTI
- **运行时性能**：内存使用、渲染时间

## 安全考虑

### 认证安全
- **Supabase Auth**：安全的认证系统
- **会话管理**：安全的会话处理
- **密码安全**：由 Supabase 处理

### 数据安全
- **RLS 策略**：行级安全保护
- **输入验证**：Zod 模式验证
- **SQL 注入防护**：参数化查询

### 环境安全
- **密钥管理**：环境变量存储敏感信息
- **CORS 配置**：适当的跨域设置
- **HTTPS**：全站 HTTPS

## 调试指南

### 常见问题
1. **认证问题**：检查 Supabase 配置和环境变量
2. **数据库连接**：确认 Supabase 项目状态
3. **构建错误**：检查 TypeScript 错误
4. **性能问题**：使用 Next.js 分析工具

### 调试工具
- **Next.js Dev Tools**：内置开发工具
- **Supabase Dashboard**：数据库监控
- **React DevTools**：组件调试
- **Chrome DevTools**：性能分析

### 日志记录
```typescript
// 结构化日志
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  }
}
```

## 近期改动 - 单管理员系统 (2024)

系统已从多用户平台简化为单一管理员系统：

### 移除的功能
- **用户注册**：不再支持，仅管理员登录
- **用户个人资料**：移除所有用户相关的表和功能
- **个人页面**：移除 `/user/[userId]` 路由
- **多用户博客 URL**：博客文章现在使用 `/blog/[id]` 而不是 `/user/[userId]/blog/[id]`

### 数据库改动
- 移除了 `posts` 表的 `user_id` 列
- 删除了用户相关的表
- 简化了 RLS 策略

### 代码改动
- 更新了所有博客文章 URL 使用新模式
- 移除了查询中的用户过滤
- 简化了认证流程
- 更新了导航和 UI 组件

### 迁移步骤
1. 执行 `scripts/remove-multi-user.sql` 更新数据库架构
2. 所有现有博客文章保持可访问
3. 管理员登录方式不变

---

本指南为 Claude AI 助手提供了 Be Better Web 项目的全面概述。代码库遵循现代 React 和 Next.js 最佳实践，重点关注类型安全、性能和用户体验。
- 不要频繁生成过多文档