# 多用户路由结构重构指南

## 路由架构设计

### 1. 新路由结构

#### 全局路由（所有用户可访问）
```
/                           # 首页 - 平台介绍和功能展示
/features                   # 功能详细介绍页
/about                      # 关于我们
/contact                    # 联系我们
/docs                       # 帮助文档
/auth/login                 # 登录页面
/auth/register              # 注册页面
/auth/reset-password        # 密码重置
/blog                       # 全站博客列表（所有公开文章）
/blog/[id]                  # 博客详情页（跨用户）
/search                     # 全站搜索
/explore                    # 发现页面（推荐用户和内容）
```

#### 用户个人空间路由
```
/user/[username]             # 个人首页
/user/[username]/blog        # 个人博客列表
/user/[username]/blog/[id]   # 个人博客详情页
/user/[username]/about       # 个人资料页
/user/[username]/followers   # 关注者列表
/user/[username]/following   # 正在关注列表
/user/[username]/schedule    # 个人日程（如果公开）
/user/[username]/habits      # 个人习惯（如果公开）
/user/[username]/insights    # 个人数据分析（如果公开）
```

#### 用户管理后台路由
```
/dashboard                   # 用户控制台
/dashboard/blog              # 博客管理
/dashboard/blog/new          # 新建博客
/dashboard/blog/[id]/edit    # 编辑博客
/dashboard/schedule          # 日程管理
dashboard/habits             # 习惯管理
dashboard/insights           # 数据分析
dashboard/settings           # 个人设置
dashboard/notifications      # 通知中心
dashboard/analytics          # 访问统计
```

#### 管理员路由
```
/admin                       # 管理员面板
/admin/users                 # 用户管理
/admin/content               # 内容审核
/admin/reports               # 举报管理
/admin/analytics             # 全站统计
/admin/settings              # 系统设置
```

### 2. 路由迁移映射

#### 当前 → 新路由
```
当前路由                    → 新路由
/blog                       → /blog（保持不变，但显示所有公开文章）
/blog/[id]                  → /blog/[id]（保持不变）
/blog/admin/*               → /dashboard/blog/*
/dashboard                  → /dashboard（用户控制台）
/schedule                   → /dashboard/schedule
/habits                     → /dashboard/habits
/insights                   → /dashboard/insights
/admin                      → /admin（管理员面板）
/auth/login                 → /auth/login（保持不变）
```

### 3. Next.js App Router 实现结构

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
├── (public)/
│   ├── page.tsx                    # 首页
│   ├── features/
│   │   └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── docs/
│   │   └── page.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── explore/
│   │   └── page.tsx
│   ├── blog/
│   │   ├── page.tsx               # 全站博客列表
│   │   └── [id]/
│   │       └── page.tsx           # 博客详情
│   └── user/
│       └── [username]/
│           ├── page.tsx           # 个人首页
│           ├── blog/
│           │   ├── page.tsx       # 个人博客列表
│           │   └── [id]/
│           │       └── page.tsx   # 个人博客详情
│           ├── about/
│           │   └── page.tsx       # 个人资料
│           ├── followers/
│           │   └── page.tsx       # 关注者
│           ├── following/
│           │   └── page.tsx       # 正在关注
│           ├── schedule/
│           │   └── page.tsx       # 公开日程
│           ├── habits/
│           │   └── page.tsx       # 公开习惯
│           └── insights/
│               └── page.tsx       # 公开数据分析
├── dashboard/
│   ├── page.tsx                   # 用户控制台
│   ├── blog/
│   │   ├── page.tsx               # 博客管理
│   │   ├── new/
│   │   │   └── page.tsx           # 新建博客
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx       # 编辑博客
│   ├── schedule/
│   │   └── page.tsx               # 日程管理
│   ├── habits/
│   │   └── page.tsx               # 习惯管理
│   ├── insights/
│   │   └── page.tsx               # 数据分析
│   ├── settings/
│   │   └── page.tsx               # 个人设置
│   ├── notifications/
│   │   └── page.tsx               # 通知中心
│   └── analytics/
│       └── page.tsx               # 访问统计
└── admin/
    ├── page.tsx                   # 管理员面板
    ├── users/
    │   └── page.tsx               # 用户管理
    ├── content/
    │   └── page.tsx               # 内容审核
    ├── reports/
    │   └── page.tsx               # 举报管理
    ├── analytics/
    │   └── page.tsx               # 全站统计
    └── settings/
        └── page.tsx               # 系统设置
```

### 4. 路由权限控制

#### 中间件配置 (middleware.ts)
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 获取路由信息
  const { pathname } = req.nextUrl

  // 需要登录的路由
  const protectedRoutes = ['/dashboard', '/admin']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 需要管理员权限的路由
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 检查用户权限
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (isAdminRoute && session) {
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!user?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 5. 页面组件示例

#### 首页 (app/(public)/page.tsx)
```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import { BookOpen, Calendar, Users, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Be Better Web
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            连接创作者的博客与生产力平台。分享知识，追踪成长，建立联系。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto">
                探索内容
              </Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  进入控制台
                </Button>
              </Link>
            ) : (
              <Link href="/auth/register">
                <Button size="lg" variant="outline">
                  立即加入
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            平台功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle>博客创作</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  强大的博客编辑器，支持富文本、标签分类和SEO优化。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <CardTitle>日程管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  智能任务管理，习惯追踪，生产力分析。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle>社交互动</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  关注喜欢的创作者，评论互动，建立联系。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
                <CardTitle>数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  详细的数据统计，帮助了解内容表现和用户增长。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            准备开始您的创作之旅？
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            加入我们的社区，与数千名创作者一起分享知识和成长。
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-3">
              免费注册
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
```

#### 用户个人首页 (app/(public)/user/[username]/page.tsx)
```typescript
'use client'

import { useParams } from 'next/navigation'
import { useUserByUsername } from '@/lib/hooks/use-users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, BookOpen, Users, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function UserProfile() {
  const params = useParams()
  const username = params.username as string

  const { user: profile, loading, error } = useUserByUsername(username)

  if (loading) return <div>Loading...</div>
  if (error || !profile) return <div>User not found</div>

  const { user, profile: userProfile, stats } = profile

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {userProfile?.display_name || user.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                @{username}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                {userProfile?.bio}
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats?.posts_count || 0} 文章</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats?.followers_count || 0} 关注者</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats?.following_count || 0} 关注中</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button>关注</Button>
              <Button variant="outline">私信</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>最新文章</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 这里渲染用户的最新博客文章 */}
                  <p className="text-gray-500 dark:text-gray-400">
                    暂无公开文章
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Preview (if public) */}
            {userProfile?.show_schedule && (
              <Card>
                <CardHeader>
                  <CardTitle>日程安排</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 这里渲染公开的日程信息 */}
                    <p className="text-gray-500 dark:text-gray-400">
                      暂无公开日程
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>快速链接</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/user/${username}/blog`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    查看所有文章
                  </Button>
                </Link>
                <Link href={`/user/${username}/about`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    个人资料
                  </Button>
                </Link>
                <Link href={`/user/${username}/followers`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    关注者
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>兴趣标签</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userProfile?.skills?.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6. 数据获取 Hooks

#### useUserByUsername Hook
```typescript
// lib/hooks/use-users.ts
import { useUser } from '@/lib/auth/auth-context'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      // 获取用户基本信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, username, is_public')
        .eq('username', username)
        .eq('is_public', true)
        .single()

      if (userError) throw userError

      // 获取用户详细资料
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // 获取用户统计
      const { data: stats, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      return {
        user,
        profile: profile || {},
        stats: stats || {}
      }
    },
    enabled: !!username
  })
}

export function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          categories(name),
          tags(name),
          post_likes(count),
          blog_comments(count)
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId
  })
}
```

### 7. 迁移步骤

#### 第一阶段：基础架构
1. 执行数据库迁移脚本
2. 创建新的路由结构
3. 实现基础的用户认证和权限控制
4. 迁移现有的博客功能到新路由

#### 第二阶段：用户功能
1. 实现用户注册和登录
2. 创建用户个人资料页面
3. 实现用户空间路由
4. 添加用户设置功能

#### 第三阶段：社交功能
1. 实现关注/粉丝系统
2. 添加评论和点赞功能
3. 实现通知系统
4. 添加推荐算法

#### 第四阶段：优化和扩展
1. 实现搜索功能
2. 添加数据分析
3. 优化性能和用户体验
4. 添加管理员功能

### 8. 注意事项

1. **URL 友好性**：确保用户名是 URL 友好的，避免特殊字符
2. **SEO 优化**：为每个用户页面添加合适的 meta 标签
3. **性能优化**：实现适当的缓存策略
4. **安全性**：确保所有用户数据都有适当的访问控制
5. **数据迁移**：确保现有数据能够正确迁移到新的多用户结构
6. **向后兼容**：考虑旧的 URL 重定向到新路由

这个路由架构设计支持多用户系统，同时保持了良好的用户体验和SEO友好性。