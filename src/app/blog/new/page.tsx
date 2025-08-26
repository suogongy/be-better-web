'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { postService } from '@/lib/supabase/database'
import { BlogPostForm } from '@/components/blog/blog-post-form'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewBlogPostPage() {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  if (!user) {
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
    excerpt?: string;
    content: string;
    status: 'draft' | 'published';
  }) => {
    setIsSubmitting(true)
    try {
      const postData = {
        ...data,
        user_id: user.id,
        published_at: data.status === 'published' ? new Date().toISOString() : null,
      }

      await postService.createPost(postData)

      addToast({
        title: '成功！',
        description: `文章${data.status === 'published' ? '已发布' : '已保存为草稿'}成功。`,
        variant: 'success',
      })

      router.push('/blog')
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建文章失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/blog')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
          ← 返回博客
        </Link>
        <h1 className="text-3xl font-bold mt-2">创建新文章</h1>
      </div>

      <BlogPostForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  )
}