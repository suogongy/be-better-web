import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { postService, userService } from '@/lib/supabase/services/index'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Eye, AlertCircle, BookOpen } from 'lucide-react'

interface PageProps {
  params: Promise<{ userId: string }>
}

// 生成SEO元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const user = await userService.getProfile(userId)

  if (!user) {
    return {
      title: '用户未找到',
      description: '请求的用户不存在。',
    }
  }

  const title = `${user.name || user.email} 的博客 | Be Better Web`
  const description = `查看 ${user.name || user.email} 发布的所有博客文章。`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'
  const url = `${siteUrl}/blog/user/${userId}`

  return {
    title,
    description,
    keywords: [
      '博客',
      '生产力',
      '个人成长',
      '效率提升',
      '用户博客',
      user.name || user.email
    ],
    authors: [{ name: user.name || user.email }],
    creator: user.name || user.email,
    publisher: 'Be Better Web',
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      siteName: 'Be Better Web',
      locale: 'zh_CN',
    },
    alternates: {
      canonical: url,
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
}

const POSTS_PER_PAGE = 6

export default async function UserBlogPage({ params }: PageProps) {
  const { userId } = await params
  
  // 检查Supabase配置
  if (!isSupabaseConfigured()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">功能受限</h1>
          <p className="text-muted-foreground mb-4">
            此功能需要数据库支持。请配置Supabase以启用完整功能。
          </p>
          <Button asChild>
            <Link href="/blog">返回博客列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  const user = await userService.getProfile(userId)

  if (!user) {
    notFound()
  }

  // 获取用户的文章
  const { data: posts, total } = await postService.getPosts({
    userId: userId,
    status: 'published',
    limit: POSTS_PER_PAGE,
  })

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回导航 */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回博客列表
        </Link>
      </div>

      {/* 用户信息头部 */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary-foreground">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
        <p className="text-muted-foreground mt-2">
          共发布了 {total} 篇文章
        </p>
      </div>

      {/* 文章列表 */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无文章</h3>
            <p className="text-muted-foreground mb-4">
              该用户尚未发布任何文章。
            </p>
            <Button asChild>
              <Link href="/blog">查看所有博客</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => {
            const readingTime = estimateReadingTime(post.content || '')
            return (
              <Card key={post.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2 text-lg">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {post.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories?.slice(0, 2).map((category: any) => (
                      <Badge key={category.id} variant="secondary" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                    {post.tags?.slice(0, 2).map((tag: any) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.published_at || post.created_at}>
                          {formatDate(post.published_at || post.created_at)}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {readingTime}分钟
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}