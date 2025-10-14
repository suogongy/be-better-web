# 精简版多用户路由结构指南

## 简化的路由架构

### 1. 核心路由结构

#### 全局路由（所有用户可访问）
```
/                           # 首页 - 平台介绍
/auth/login                 # 登录页面
/auth/register              # 注册页面
/blog                       # 全站博客列表（所有公开文章）
/blog/[id]                  # 博客详情页
/about                      # 关于页面
```

#### 用户个人空间路由
```
/user/[username]             # 个人首页（显示简介和最新文章）
/user/[username]/blog        # 个人博客列表
/user/[username]/blog/[id]   # 个人博客详情页
```

#### 用户管理后台路由
```
/dashboard                   # 用户控制台
/dashboard/blog              # 博客管理
/dashboard/blog/new          # 新建博客
/dashboard/blog/[id]/edit    # 编辑博客
/dashboard/settings          # 个人设置
```

#### 管理员路由
```
/admin                       # 管理员面板
/admin/users                 # 用户管理
/admin/content               # 内容管理
```

### 2. Next.js App Router 实现结构

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (public)/
│   ├── page.tsx                    # 首页
│   ├── about/
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
├── dashboard/
│   ├── page.tsx                   # 用户控制台
│   ├── blog/
│   │   ├── page.tsx               # 博客管理
│   │   ├── new/
│   │   │   └── page.tsx           # 新建博客
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx       # 编辑博客
│   └── settings/
│       └── page.tsx               # 个人设置
└── admin/
    ├── page.tsx                   # 管理员面板
    ├── users/
    │   └── page.tsx               # 用户管理
    └── content/
        └── page.tsx               # 内容管理
```

### 3. 简化的中间件配置

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

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

### 4. 简化的类型定义

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
  is_admin: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

// types/blog.ts
export interface Post {
  id: string
  user_id: string
  user?: User // 关联用户信息
  title: string
  content?: string
  excerpt?: string
  featured_image?: string
  status: 'draft' | 'published' | 'archived'
  type: 'manual' | 'schedule_generated'
  meta_title?: string
  meta_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  // 关联数据
  categories?: Category[]
  tags?: Tag[]
  comments_count?: number
}

export interface Comment {
  id: string
  post_id: string
  user_id?: string
  user?: User
  parent_id?: string
  author_name?: string
  author_email?: string
  author_website?: string
  content: string
  status: 'pending' | 'approved' | 'spam' | 'rejected'
  is_author: boolean
  created_at: string
  updated_at: string
  replies?: Comment[]
}
```

### 5. 简化的 API 路由示例

```typescript
// app/api/posts/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const userId = searchParams.get('user_id')
  const username = searchParams.get('username')

  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, name, username, avatar_url),
      categories(name),
      tags(name),
      blog_comments(count)
    `)
    .eq('status', 'published')

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        ...body,
        user_id: user.id,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### 6. 简化的用户页面组件

```typescript
// app/(public)/user/[username]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useUserByUsername } from '@/lib/hooks/use-users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, User as UserIcon } from 'lucide-react'
import Link from 'next/link'

export default function UserProfile() {
  const params = useParams()
  const username = params.username as string

  const { user: profile, loading, error } = useUserByUsername(username)

  if (loading) return <div>Loading...</div>
  if (error || !profile) return <div>User not found</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                @{username}
              </p>
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 7. 简化的 Hooks

```typescript
// lib/hooks/use-users.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/user'

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .single()

      if (error) throw error
      return data as User
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
          blog_comments(count)
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId
  })
}
```

### 8. 实施步骤

1. **执行数据库迁移**：
   ```bash
   psql -h localhost -U postgres -d your_database -f docs/sql/simplified-multi-user-migration.sql
   ```

2. **更新路由结构**：
   - 创建新的路由文件
   - 更新中间件配置
   - 实现权限控制

3. **重构组件**：
   - 更新类型定义
   - 修改 API 路由
   - 重构前端组件

4. **测试功能**：
   - 用户注册/登录
   - 博客创建/编辑
   - 评论功能
   - 权限控制

这个精简版本保留了核心的博客功能，去除了复杂的社交和统计功能，更适合当前的轻量级需求。