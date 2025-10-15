'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowLeft, Tag as TagIcon, FolderOpen, Eye, MessageCircle } from 'lucide-react'
import { BlogService } from '@/lib/supabase/services/blog-service'
import { postService } from '@/lib/supabase/services/post-service'
import { createClient } from '@/lib/supabase/client'
import { MarkdownPreview } from '@/components/editor/markdown-preview'
import { Post } from '@/types/database'

interface Category {
  id: string
  name: string
  color?: string | null
}

interface TagItem {
  id: string
  name: string
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post & { categories?: Category[]; tags?: TagItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)

        // 获取文章详情
        const postDetail = await postService.getPost(postId)

        if (postDetail) {
          setPost({
            ...postDetail,
            categories: [],
            tags: []
          })
        } else {
          setError('文章不存在')
        }
      } catch (err) {
        console.error('Failed to fetch post:', err)
        setError('加载文章失败')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId])


  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{error || '文章不存在'}</h1>
            <Button asChild>
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回博客列表
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const readingTime = estimateReadingTime(post.content)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Button
            variant="outline"
            asChild
            className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              返回博客列表
            </Link>
          </Button>
        </div>

        {/* 文章头部 */}
        <header className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-10">
            {/* 文章标题 */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 leading-tight">
              {post.title}
            </h1>

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-8 text-gray-600 dark:text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <time dateTime={post.published_at || post.created_at} className="font-medium">
                  {formatDate(post.published_at || post.created_at)}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">{readingTime} 分钟阅读</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">{post.view_count || 0} 次浏览</span>
              </div>
              {post.comment_count !== undefined && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium">{post.comment_count} 条评论</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readingTime} 分钟阅读
            </div>
            </div>
          </div>
        </header>

        {/* 文章内容 */}
        <main className="mb-16">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* 摘要 */}
            {post.excerpt && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 border-b border-gray-200/50 dark:border-gray-700/50">
                <p className="text-lg text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "{post.excerpt}"
                </p>
              </div>
            )}

            {/* 正文 */}
            <div className="p-10">
              <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
                <MarkdownPreview content={post.content} wide={true} />
              </div>
            </div>

            {/* 文章底部装饰 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 h-2"></div>
          </div>
        </main>
      </div>
    )
  }
}