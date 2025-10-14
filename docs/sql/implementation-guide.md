# 多用户系统重构实施指南

## 实施建议和注意事项

### 1. 数据库迁移策略

#### 备份策略
```bash
# 1. 完整数据库备份
pg_dump -h your-db-host -U your-username -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 关键表备份
pg_dump -h your-db-host -U your-username -d your-database -t posts -t users -t tasks > critical_tables_backup.sql
```

#### 迁移顺序
1. **第一阶段**：执行 `multi-user-migration.sql`
   - 恢复多用户架构
   - 添加用户相关表和字段
   - 设置新的 RLS 策略

2. **第二阶段**：执行 `user-registration-enhancement.sql`
   - 增强用户注册系统
   - 添加社交功能
   - 实现通知系统

3. **验证阶段**：数据完整性检查
   ```sql
   -- 检查用户数据完整性
   SELECT COUNT(*) as posts_without_user FROM posts WHERE user_id IS NULL;
   SELECT COUNT(*) as tasks_without_user FROM tasks WHERE user_id IS NULL;

   -- 检查用户名唯一性
   SELECT username, COUNT(*) as count FROM users GROUP BY username HAVING COUNT(*) > 1;
   ```

### 2. 代码重构要点

#### 环境变量配置
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 新增多用户配置
NEXT_PUBLIC_SITE_URL=https://be-better-web.vercel.app
NEXT_PUBLIC_ENABLE_USER_REGISTRATION=true
NEXT_PUBLIC_DEFAULT_USER_SETTINGS_PUBLIC=true

# 邮件服务配置（用于用户验证）
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@be-better-web.com
FROM_NAME=Be Better Web
```

#### 类型定义更新
```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  name?: string
  username: string
  avatar_url?: string
  bio?: string
  website?: string
  social_links: Record<string, string>
  preferences: Record<string, any>
  is_admin: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  job_title?: string
  avatar_url?: string
  cover_image_url?: string
  social_links: Record<string, string>
  skills: string[]
  interests: string[]
  birth_date?: string
  show_email: boolean
  show_location: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  email_notifications: boolean
  blog_public: boolean
  profile_public: boolean
  calendar_public: boolean
  created_at: string
  updated_at: string
}

// types/blog.ts (更新)
export interface Post {
  id: string
  user_id: string
  user?: User // 关联用户信息
  title: string
  content?: string
  excerpt?: string
  featured_image?: string
  status: 'draft' | 'published' | 'archived'
  visibility: 'public' | 'unlisted' | 'private'
  type: 'manual' | 'schedule_generated'
  meta_title?: string
  meta_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  // 关联数据
  categories?: Category[]
  tags?: Tag[]
  likes_count?: number
  comments_count?: number
  user_liked?: boolean
}
```

#### API 路由更新
```typescript
// app/api/posts/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  category_ids: z.array(z.string()).optional(),
  tag_names: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const userId = searchParams.get('user_id') // 特定用户的文章
  const username = searchParams.get('username') // 通过用户名查询

  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, name, username, avatar_url),
      categories(name),
      tags(name),
      post_likes(count),
      blog_comments(count)
    `)
    .eq('status', 'published')
    .eq('visibility', 'public')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (username) {
    query = query.eq('users.username', username)
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // 检查用户认证
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        ...validatedData,
        user_id: user.id,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 处理分类和标签关联
    if (validatedData.category_ids?.length) {
      await supabase.from('post_categories').insert(
        validatedData.category_ids.map(categoryId => ({
          post_id: post.id,
          category_id: categoryId
        }))
      )
    }

    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### 3. 前端组件重构

#### 更新 Context 和 Hooks
```typescript
// lib/auth/auth-context.tsx (更新)
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabase'
import { User, UserProfile } from '@/types/user'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUserProfile = async (userId: string) => {
    try {
      // 加载用户基本信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setProfile(userData)

      // 加载用户详细资料
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      setUserProfile(profileData)
    } catch (err) {
      console.error('Error loading user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  useEffect(() => {
    // 获取初始会话
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication error')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
          setUserProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    userProfile,
    loading,
    error,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### 新的 Hooks
```typescript
// lib/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User, UserProfile } from '@/types/user'

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles(*)
        `)
        .eq('username', username)
        .eq('is_public', true)
        .single()

      if (error) throw error
      return data as User & { user_profiles: UserProfile }
    },
    enabled: !!username
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, profile }: { userId: string, profile: Partial<UserProfile> }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, ...profile })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })
}

export function useFollowUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ followerId, followingId }: { followerId: string, followingId: string }) => {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({ follower_id: followerId, following_id: followingId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })
}
```

### 4. 关键实施步骤

#### 步骤 1：数据库迁移
```bash
# 1. 备份数据库
psql -h localhost -U postgres -d be_better_web -f backup.sql

# 2. 执行迁移脚本
psql -h localhost -U postgres -d be_better_web -f docs/sql/multi-user-migration.sql

# 3. 验证迁移结果
psql -h localhost -U postgres -d be_better_web -c "SELECT COUNT(*) FROM users WHERE user_id IS NULL;"
```

#### 步骤 2：创建管理员用户
```sql
-- 创建默认管理员用户
INSERT INTO public.users (email, name, username, is_admin)
VALUES ('admin@be-better-web.com', 'Administrator', 'admin', true)
ON CONFLICT (email) DO UPDATE SET is_admin = true;
```

#### 步骤 3：更新现有数据
```sql
-- 为现有文章分配用户
UPDATE posts SET user_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1) WHERE user_id IS NULL;

-- 更新其他表的 user_id
UPDATE tasks SET user_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1) WHERE user_id IS NULL;
UPDATE daily_summaries SET user_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1) WHERE user_id IS NULL;
```

#### 步骤 4：代码重构
1. 更新类型定义
2. 修改 API 路由
3. 重构前端组件
4. 更新认证逻辑

#### 步骤 5：测试验证
```bash
# 启动开发服务器
npm run dev

# 测试关键功能
# 1. 用户注册
# 2. 用户登录
# 3. 创建文章
# 4. 查看用户页面
# 5. 权限控制
```

### 5. 性能优化建议

#### 数据库优化
```sql
-- 创建复合索引
CREATE INDEX idx_posts_user_status_visibility ON posts(user_id, status, visibility);
CREATE INDEX idx_posts_published_public ON posts(published_at DESC) WHERE status = 'published' AND visibility = 'public';

-- 分区表（如果数据量大）
-- 考虑按时间分区 posts 表
```

#### 缓存策略
```typescript
// lib/cache/user-cache.ts
import { cache } from 'react'

export const getUserByUsername = cache(async (username: string) => {
  const supabase = createClient()
  return await supabase.from('users').select('*').eq('username', username).single()
})

export const getUserPosts = cache(async (userId: string, limit = 10) => {
  const supabase = createClient()
  return await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
})
```

#### CDN 和静态资源
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-project.storage.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // 启用压缩
  compress: true,
  // 启用实验性功能
  experimental: {
    optimizeCss: true,
  },
}
```

### 6. 安全考虑

#### 输入验证
```typescript
// lib/validation/user-validation.ts
import { z } from 'zod'

export const usernameSchema = z.string()
  .min(3, '用户名至少3个字符')
  .max(20, '用户名最多20个字符')
  .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符')

export const userRegistrationSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8个字符'),
  username: usernameSchema,
  name: z.string().min(1, '请输入姓名').max(50, '姓名最多50个字符'),
})
```

#### 权限控制
```typescript
// lib/auth/permissions.ts
export function canEditPost(userId: string, postUserId: string): boolean {
  return userId === postUserId
}

export function canViewPost(post: { visibility: string, user_id: string }, currentUserId?: string): boolean {
  if (post.visibility === 'public') return true
  if (post.visibility === 'private' && currentUserId === post.user_id) return true
  return false
}

export function canManageUsers(currentUser: { is_admin: boolean }): boolean {
  return currentUser.is_admin
}
```

### 7. 监控和日志

#### 错误监控
```typescript
// lib/monitoring/error-tracking.ts
export function trackError(error: Error, context?: Record<string, any>) {
  console.error('[Error Tracking]', error.message, context)

  // 发送到监控服务（如 Sentry）
  if (typeof window !== 'undefined') {
    // 客户端错误上报
  }
}

export function trackUserAction(action: string, properties?: Record<string, any>) {
  console.log('[User Action]', action, properties)

  // 发送分析数据
}
```

#### 性能监控
```typescript
// lib/monitoring/performance.ts
export function measurePageLoad(pageName: string) {
  if (typeof window !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const loadTime = navigation.loadEventEnd - navigation.fetchStart

    console.log(`[Performance] ${pageName} loaded in ${loadTime}ms`)
  }
}
```

### 8. 部署注意事项

#### 环境变量检查清单
```bash
# 必需的环境变量
NEXT_PUBLIC_SUPABASE_URL=✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=✓
SUPABASE_SERVICE_ROLE_KEY=✓
NEXT_PUBLIC_SITE_URL=✓

# 邮件服务配置
SMTP_HOST=✓
SMTP_PORT=✓
SMTP_USER=✓
SMTP_PASSWORD=✓
FROM_EMAIL=✓
```

#### 数据库连接池配置
```env
# Supabase 连接池设置
SUPABASE_DB_POOL_SIZE=10
SUPABASE_DB_CONNECTION_TIMEOUT=30
```

#### 健康检查
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('users').select('count').single()

    if (error) throw error

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      user_count: data.count
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### 9. 回滚计划

如果迁移出现问题，回滚步骤：

```bash
# 1. 停止应用服务
# 2. 恢复数据库备份
psql -h localhost -U postgres -d be_better_web < backup_YYYYMMDD_HHMMSS.sql

# 3. 恢复代码版本
git checkout previous-stable-tag

# 4. 重启服务
npm run build && npm start
```

### 10. 后续优化建议

1. **搜索引擎优化**：为每个用户页面添加 sitemap
2. **内容推荐**：实现基于用户兴趣的推荐算法
3. **实时通知**：使用 WebSocket 实现实时通知
4. **图片优化**：实现图片 CDN 和懒加载
5. **国际化**：支持多语言
6. **移动端优化**：PWA 支持
7. **API 限流**：防止恶意请求
8. **内容审核**：自动内容审核系统

这个实施指南提供了完整的多用户系统重构方案，确保项目能够平滑地从单管理员模式迁移到多用户平台。