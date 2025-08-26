'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Loading } from '@/components/ui/loading'
import { CommentModeration } from '@/components/blog/comment-moderation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CommentModerationPage() {
  const { user, loading: authLoading } = useAuth()

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
          <p className="text-gray-600 mb-4">您需要登录才能访问评论管理。</p>
          <Link href="/auth/login">
            <Button>登录</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/blog/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回博客管理
        </Link>
      </div>

      {/* Comment Moderation */}
      <CommentModeration />
    </div>
  )
}