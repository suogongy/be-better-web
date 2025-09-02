# 个人网站技术设计文档

## 1. 技术栈

### 1.1 前端框架
- **Next.js 15.5.0**：带有App Router的React框架
- **React 19.1.0**：最新React版本，具有并发功能
- **TypeScript 5+**：具有最新TS功能的类型安全开发
- **Tailwind CSS v4**：用于快速样式的实用优先CSS框架

### 1.2 后端和数据库
- **Supabase**：带有PostgreSQL数据库的后端即服务
- **Supabase Auth**：认证和用户管理
- **Supabase Storage**：文件和媒体存储
- **Supabase Edge Functions**：用于自定义逻辑的无服务器函数

### 1.3 开发工具
- **ESLint 9+**：代码检查和质量保证
- **Turbopack**：用于开发和生产构建的快速打包器
- **PostCSS**：CSS处理和优化
- **Prettier**：代码格式化（推荐添加）

### 1.4 附加库
- **@supabase/supabase-js**：Supabase客户端库
- **@tiptap/react**：博客文章的富文本编辑器
- **react-hook-form**：表单处理和验证
- **zod**：模式验证库
- **date-fns**：日期操作和格式化
- **framer-motion**：动画库
- **react-hot-toast**：吐司通知
- **lucide-react**：图标库

## 2. 架构设计

### 2.1 项目结构
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # 受保护的管理路由
│   │   ├── admin/
│   │   ├── blog/
│   │   └── schedule/
│   ├── blog/                     # 公共博客路由
│   │   ├── [slug]/
│   │   └── category/[name]/
│   ├── api/                      # API路由
│   │   ├── auth/
│   │   ├── blog/
│   │   └── schedule/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 可重用组件
│   ├── ui/                       # 基础UI组件
│   ├── blog/                     # 博客特定组件
│   ├── schedule/                 # 日程特定组件
│   ├── forms/                    # 表单组件
│   └── layout/                   # 布局组件
├── lib/                          # 实用库
│   ├── supabase/                 # Supabase配置
│   ├── auth/                     # 认证实用程序
│   ├── validation/               # Zod模式
│   ├── utils/                    # 通用实用程序
│   └── hooks/                    # 自定义React hooks
├── types/                        # TypeScript类型定义
├── styles/                       # 附加样式
└── constants/                    # 应用程序常量
```

### 2.2 数据库模式

#### 2.2.1 用户表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  social_links JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.2 博客文章表
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  type VARCHAR(20) DEFAULT 'manual', -- 'manual' 或 'schedule_generated'
  meta_title VARCHAR(255),
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);
```

#### 2.2.3 分类表
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7), -- 十六进制颜色代码
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.4 标签表
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.5 文章-分类连接表
```sql
CREATE TABLE post_categories (
  post_id UUID,
  category_id UUID,
  PRIMARY KEY (post_id, category_id)
);
```

#### 2.2.6 文章-标签连接表
```sql
CREATE TABLE post_tags (
  post_id UUID,
  tag_id UUID,
  PRIMARY KEY (post_id, tag_id)
);
```

#### 2.2.7 评论表
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  parent_id UUID,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_website VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'spam'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.8 任务表
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  progress INTEGER DEFAULT 0, -- 0-100
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  due_date DATE,
  due_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB, -- 存储重复规则
  completion_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.9 每日摘要表
```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  summary_date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  total_planned_time INTEGER, -- 分钟
  total_actual_time INTEGER, -- 分钟
  productivity_score DECIMAL(5,2),
  mood_rating INTEGER, -- 1-5分级
  energy_rating INTEGER, -- 1-5分级
  notes TEXT,
  achievements JSONB,
  challenges JSONB,
  tomorrow_goals JSONB,
  auto_blog_generated BOOLEAN DEFAULT FALSE,
  generated_post_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);
```

### 2.3 API设计

#### 2.3.1 认证端点
```typescript
// Supabase Auth处理大部分认证操作
// 自定义API路由用于附加功能

// POST /api/auth/profile
interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  website?: string;
  social_links?: Record<string, string>;
}

// GET /api/auth/preferences
// PUT /api/auth/preferences
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  auto_blog_generation: boolean;
  default_blog_category: string;
}
```

#### 2.3.2 博客端点
```typescript
// GET /api/blog/posts
interface GetPostsQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  status?: 'published' | 'draft';
  search?: string;
  sort?: 'date' | 'title' | 'views';
  order?: 'asc' | 'desc';
}

// GET /api/blog/posts/[slug]
// POST /api/blog/posts
// PUT /api/blog/posts/[id]
// DELETE /api/blog/posts/[id]
interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: 'draft' | 'published';
  categories: string[];
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
}

// GET /api/blog/categories
// POST /api/blog/categories
// PUT /api/blog/categories/[id]
// DELETE /api/blog/categories/[id]

// GET /api/blog/tags
// POST /api/blog/tags

// GET /api/blog/comments/[post_id]
// POST /api/blog/comments
// PUT /api/blog/comments/[id]/status
interface CreateCommentRequest {
  post_id: string;
  parent_id?: string;
  author_name: string;
  author_email: string;
  author_website?: string;
  content: string;
}
```

#### 2.3.3 日程端点
```typescript
// GET /api/schedule/tasks
interface GetTasksQuery {
  date?: string; // YYYY-MM-DD
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

// POST /api/schedule/tasks
// PUT /api/schedule/tasks/[id]
// DELETE /api/schedule/tasks/[id]
interface CreateTaskRequest {
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  due_time?: string;
  estimated_minutes?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

// GET /api/schedule/summaries
// GET /api/schedule/summaries/[date]
// POST /api/schedule/summaries
// PUT /api/schedule/summaries/[date]
interface CreateSummaryRequest {
  summary_date: string;
  mood_rating?: number;
  energy_rating?: number;
  notes?: string;
  achievements?: string[];
  challenges?: string[];
  tomorrow_goals?: string[];
}

// POST /api/schedule/generate-blog
interface GenerateBlogRequest {
  summary_date: string;
  template?: 'default' | 'detailed' | 'minimal';
  include_tasks?: boolean;
  include_metrics?: boolean;
  auto_publish?: boolean;
}
```

### 2.4 组件架构

#### 2.4.1 UI组件（src/components/ui/）
```typescript
// 使用Tailwind CSS的基础组件
- Button
- Input
- Textarea
- Select
- Checkbox
- RadioGroup
- Badge
- Card
- Modal
- Dropdown
- DatePicker
- TimePicker
- Progress
- Spinner
- Toast
- Tooltip
- Tabs
- Accordion
```

#### 2.4.2 博客组件（src/components/blog/）
```typescript
// BlogPostCard.tsx
interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    featured_image?: string;
    published_at: string;
    view_count: number;
    categories: Category[];
    tags: Tag[];
  };
  showActions?: boolean;
}

// BlogEditor.tsx
interface BlogEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  autosave?: boolean;
}

// CommentSection.tsx
interface CommentSectionProps {
  postId: string;
  allowNewComments?: boolean;
}

// CategoryFilter.tsx
// TagCloud.tsx
// BlogSearch.tsx
// RelatedPosts.tsx
```

#### 2.4.3 日程组件（src/components/schedule/）
```typescript
// TaskList.tsx
interface TaskListProps {
  date?: Date;
  category?: string;
  showCompleted?: boolean;
  editable?: boolean;
}

// TaskForm.tsx
interface TaskFormProps {
  task?: Task;
  onSubmit: (task: TaskData) => void;
  onCancel: () => void;
}

// DailySummary.tsx
interface DailySummaryProps {
  date: Date;
  tasks: Task[];
  summary?: DailySummary;
  onSave: (summary: DailySummaryData) => void;
}

// Calendar.tsx
// ProgressChart.tsx
// ProductivityMetrics.tsx
// HabitTracker.tsx
```

### 2.5 状态管理

#### 2.5.1 客户端状态
```typescript
// 使用React内置状态管理
// Context用于全局状态（认证、主题、通知）
// React Hook Form用于表单状态
// SWR或React Query用于服务器状态

// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
}

// ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: string) => void;
  resolvedTheme: 'light' | 'dark';
}
```

#### 2.5.2 服务器状态
```typescript
// API调用的自定义hooks
// useBlogPosts.ts
export function useBlogPosts(params?: GetPostsQuery) {
  return useSWR(['posts', params], () => fetchPosts(params));
}

// useTasks.ts
export function useTasks(params?: GetTasksQuery) {
  return useSWR(['tasks', params], () => fetchTasks(params));
}

// useComments.ts
export function useComments(postId: string) {
  return useSWR(['comments', postId], () => fetchComments(postId));
}
```

## 3. 实施计划

### 3.1 第一阶段：基础（第1-2周）
1. **项目设置**
   - 初始化Supabase项目
   - 设置数据库模式和RLS策略
   - 配置认证
   - 设置基本项目结构

2. **核心UI组件**
   - 实现基础UI组件库
   - 设置布局组件
   - 创建响应式导航
   - 实现主题系统

3. **认证系统**
   - 实现登录/注册页面
   - 设置受保护路由
   - 创建认证上下文和hooks
   - 基本个人资料管理

### 3.2 Phase 2: Blog System (Week 3-4)
1. **Blog Core Features**
   - Post creation and editing with rich text editor
   - Category and tag management
   - Draft and publish system
   - Public blog pages with SEO optimization

2. **Blog Management**
   - Admin dashboard for post management
   - Bulk operations for posts
   - Media library and image uploads
   - Search and filtering functionality

3. **Comment System**
   - Comment display and threading
   - Comment moderation system
   - Spam protection
   - Email notifications

### 3.3 Phase 3: Schedule System (Week 5-6)
1. **Task Management**
   - Task CRUD operations
   - Priority and category system
   - Due date and time management
   - Progress tracking

2. **Calendar Integration**
   - Calendar view for tasks
   - Daily/weekly/monthly views
   - Drag and drop task scheduling
   - Recurring task support

3. **Analytics and Summaries**
   - Daily summary creation
   - Progress metrics and charts
   - Productivity insights
   - Goal tracking

### 3.4 Phase 4: Integration Features (Week 7-8)
1. **Blog Generation**
   - Auto-generate blogs from summaries
   - Template system for generated content
   - Review and editing before publishing
   - Integration with existing blog system

2. **Advanced Features**
   - Habit tracking
   - Mood and energy logging
   - Advanced analytics
   - Export functionality

3. **Performance and SEO**
   - Optimize for Core Web Vitals
   - Implement proper meta tags
   - Set up sitemap and RSS feed
   - Image optimization

### 3.5 Phase 5: Polish and Deploy (Week 9-10)
1. **Testing and Quality Assurance**
   - Comprehensive testing
   - Performance optimization
   - Security audit
   - Accessibility improvements

2. **Documentation and Deployment**
   - User documentation
   - Deployment setup
   - Monitoring and analytics
   - Backup systems

## 4. Security Considerations

### 4.1 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Users can read published posts" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summaries" ON daily_summaries
  FOR ALL USING (auth.uid() = user_id);
```

### 4.2 Input Validation
```typescript
// Zod schemas for all API inputs
export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  status: z.enum(['draft', 'published']),
  categories: z.array(z.string().uuid()),
  tags: z.array(z.string()),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().date().optional(),
});
```

### 4.3 Content Security
- Sanitize HTML content in blog posts
- Validate file uploads
- Rate limiting on API endpoints
- CSRF protection
- XSS prevention

## 5. Performance Optimization

### 5.1 Database Optimization
- Proper indexing on frequently queried columns
- Query optimization and pagination
- Connection pooling
- Database function for complex queries

### 5.2 Frontend Optimization
- Next.js Image optimization
- Static generation for public pages
- Code splitting and lazy loading
- Service worker for caching

### 5.3 Caching Strategy
- Static page caching
- API response caching
- CDN for static assets
- Browser caching headers

## 6. Deployment and DevOps

### 6.1 Environment Setup
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 6.2 Deployment Options
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative with similar features
- **Railway/Render**: Alternative hosting platforms
- **Self-hosted**: Docker containerization option

### 6.3 Monitoring and Analytics
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database and auth monitoring
- **Google Analytics**: User behavior tracking
- **Sentry**: Error tracking and performance monitoring

## 7. Testing Strategy

### 7.1 Unit Testing
- Jest for utility functions
- React Testing Library for components
- Test coverage requirements

### 7.2 Integration Testing
- API endpoint testing
- Database integration tests
- Authentication flow testing

### 7.3 End-to-End Testing
- Playwright or Cypress for E2E tests
- Critical user journey testing
- Cross-browser compatibility

This technical design provides a comprehensive blueprint for implementing the personal website with blog and schedule management features using modern web technologies and best practices.

## 8. Vercel 部署实施指南

### 8.1 部署准备

#### 8.1.1 环境配置优化
```typescript
// next.config.ts - Vercel优化配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 性能优化
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  // 图片优化配置
  images: {
    domains: ['your-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // 压缩和优化
  compress: true,

  // 安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

#### 8.1.2 构建脚本配置
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "preview": "next build && next start"
  }
}
```

### 8.2 Vercel 项目配置

#### 8.2.1 vercel.json 配置
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["fra1"],
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### 8.2.2 环境变量设置
在Vercel控制台中设置以下环境变量：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth 配置（如果使用）
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# 生产环境标识
NODE_ENV=production

# 站点配置
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 分析工具（可选）
NEXT_PUBLIC_GA_ID=GA-TRACKING-ID
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 8.3 部署流程

#### 步骤1：代码准备
```bash
# 1. 确保所有更改已提交
git add .
git commit -m "Prepare for production deployment"
git push origin main

# 2. 创建生产标签（推荐）
git tag v1.0.0
git push origin v1.0.0
```

#### 步骤2：Vercel部署
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Import Project"
3. 连接GitHub仓库并选择项目
4. Vercel会自动检测Next.js配置
5. 设置环境变量
6. 点击 "Deploy"

#### 步骤3：域名配置
```bash
# 在Vercel项目设置中：
# 1. 进入 Settings > Domains
# 2. 添加自定义域名
# 3. 配置DNS记录指向Vercel
```

### 8.4 Supabase 生产配置

#### 8.4.1 生产数据库设置
```sql
-- 在Supabase生产环境中运行：

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 设置生产级RLS策略
-- 确保所有表都有适当的行级安全策略

-- 3. 配置生产环境变量
-- 更新回调URL为生产域名
```

#### 8.4.2 备份策略
```bash
# 设置自动备份
# Supabase > Settings > Database > Backups
# 启用每日备份
```

### 8.5 性能优化

#### 8.5.1 静态资源优化
```typescript
// src/app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Website Title',
  description: 'Your website description',
  openGraph: {
    title: 'Your Website Title',
    description: 'Your website description',
    url: 'https://your-domain.com',
    siteName: 'Your Site Name',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Website Title',
    description: 'Your website description',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

#### 8.5.2 缓存策略
```typescript
// src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { path, tag } = await request.json()

  if (path) {
    revalidatePath(path)
  }

  if (tag) {
    revalidateTag(tag)
  }

  return Response.json({ revalidated: true, now: Date.now() })
}
```

### 8.6 监控和维护

#### 8.6.1 Vercel Analytics
Vercel内置分析提供：
- 实时性能指标
- 错误跟踪和日志
- 用户行为分析
- 地理位置统计
- Core Web Vitals监控

#### 8.6.2 外部监控设置
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", "https://your-domain.com"],
    }),
  ],
})
```

#### 8.6.3 运行状态监控
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查Supabase连接
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        nextjs: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### 8.7 SEO 和性能优化

#### 8.7.1 XML站点地图
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://your-domain.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://your-domain.com/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://your-domain.com/schedule',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]
}
```

#### 8.7.2 robots.txt
```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/'],
    },
    sitemap: 'https://your-domain.com/sitemap.xml',
  }
}
```

### 8.8 故障排除

#### 常见部署问题
1. **构建失败**
   ```bash
   # 检查本地构建
   npm run build

   # 检查TypeScript错误
   npm run type-check

   # 检查依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **环境变量问题**
   - 确保所有必需的环境变量已设置
   - 检查变量名称拼写
   - 验证Supabase密钥有效性

3. **数据库连接问题**
   - 检查生产数据库URL和密钥
   - 验证RLS策略配置
   - 确保防火墙设置正确

4. **性能问题**
   - 监控Core Web Vitals
   - 检查图片优化
   - 验证缓存策略
   - 分析包大小

### 8.9 部署清单

#### 预部署检查
- [ ] 所有功能在本地测试通过
- [ ] 生产环境变量配置正确
- [ ] Supabase生产数据库设置完成
- [ ] 自定义域名DNS配置正确
- [ ] SEO设置完成

#### 部署执行
- [ ] 代码推送到Git仓库
- [ ] Vercel项目创建成功
- [ ] 环境变量设置完成
- [ ] 构建和部署成功

#### 部署后验证
- [ ] 网站正常加载
- [ ] 所有核心功能工作正常
- [ ] 性能指标达标
- [ ] SEO设置正确
- [ ] 监控工具正常运行

#### 维护设置
- [ ] 备份策略实施
- [ ] 监控警报配置
- [ ] 定期性能测试
- [ ] 用户反馈收集机制

此技术设计文档为使用现代Web技术和最佳实践实施具有博客和日程管理功能的个人网站提供了全面的蓝图。Vercel部署指南确保了项目的顺利上线和稳定运行。