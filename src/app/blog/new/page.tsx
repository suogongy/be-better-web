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
        <Loading text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to create posts.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
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
        title: 'Success!',
        description: `Post ${data.status === 'published' ? 'published' : 'saved as draft'} successfully.`,
        variant: 'success',
      })

      router.push('/blog')
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
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
          ← Back to Blog
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create New Post</h1>
      </div>

      <BlogPostForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  )
}