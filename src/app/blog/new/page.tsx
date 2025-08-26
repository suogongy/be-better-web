'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { postService } from '@/lib/supabase/database'
import { BlogPostForm } from '@/components/blog/blog-post-form'
import { LoadingError } from '@/components/ui/loading-error'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewBlogPostPage() {
  const { user, loading, error } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 如果用户未登录，显示登录提示
  if (!loading && !error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您需要登录才能创建文章。</p>
          <Link href="/auth/login">
            <Button>登录</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    category_id?: string;
    tags?: string[];
    status: 'draft' | 'published';
  }) => {
    if (!user) return

    try {
      setIsSubmitting(true)
      
      const post = await postService.createPost({
        ...data,
        author_id: user.id,
        published_at: data.status === 'published' ? new Date().toISOString() : null
      })

      addToast({
        title: '成功',
        description: `文章${data.status === 'published' ? '发布' : '保存'}成功！`,
        variant: 'success',
      })

      // Redirect to the new post
      router.push(`/blog/${post.slug}`)
    } catch (error: any) {
      console.error('Failed to create post:', error)
      addToast({
        title: '错误',
        description: error.message || '创建文章失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoadingError loading={loading} error={error}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">创建新文章</h1>
            <p className="text-muted-foreground mt-1">
              撰写您的下一篇博客文章
            </p>
          </div>
          <Link href="/blog">
            <Button variant="outline">
              返回博客
            </Button>
          </Link>
        </div>

        {/* Blog Post Form */}
        <BlogPostForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </LoadingError>
  )
}