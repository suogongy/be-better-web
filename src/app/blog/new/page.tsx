'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { postService } from '@/lib/supabase/services/index'
import { useAuth } from '@/lib/auth/useAuth'
import { useToast } from '@/components/ui/toast-provider'
import { Button } from '@/components/ui/button'
import { BlogPostForm } from '@/components/blog/blog-post-form'
import { LoadingError } from '@/components/ui/loading-error'
import Link from 'next/link'

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
    title: string
    slug: string
    content: string
    status: 'draft' | 'published'
    excerpt?: string
    category_ids?: string[]
    tag_ids?: string[]
  }) => {
    if (!user) {
      addToast({
        title: "错误",
        description: "请先登录",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const postData = {
        ...data,
        excerpt: data.excerpt || '',
        category_id: data.category_ids?.[0],
        tags: data.tag_ids
      }
      
      const result = await postService.createPost(postData)
      
      addToast({
        title: "成功",
        description: "文章创建成功"
      })
      
      router.push(`/blog/${result.slug}`)
    } catch (error: any) {
      console.error('创建文章失败:', error)
      addToast({
        title: "错误",
        description: error.message || "创建文章失败",
        variant: "destructive"
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
        />

      </div>
    </LoadingError>
  )
}