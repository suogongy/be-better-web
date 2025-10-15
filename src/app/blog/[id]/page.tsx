'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowLeft, Tag as TagIcon, FolderOpen } from 'lucide-react'
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回博客列表
          </Link>
        </Button>
      </div>

      {/* 文章内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>
          
          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readingTime} 分钟阅读
            </div>
            </div>

          {/* 分类和标签 */}
          {(post.categories?.length || post.tags?.length) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.categories?.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <FolderOpen className="h-3 w-3" />
                  {category.name}
                </Badge>
              ))}
              {post.tags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <TagIcon className="h-3 w-3" />
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* 摘要 */}
          {post.excerpt && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground italic">{post.excerpt}</p>
            </div>
          )}
          
          {/* 正文 */}
          <MarkdownPreview content={post.content} wide={true} />
        </CardContent>
      </Card>

      </div>
  )
}