import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { postService, userService } from '@/lib/supabase/services/index'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Clock, Eye, MessageCircle, ArrowLeft, User } from 'lucide-react'
import { CommentList } from '@/components/blog/comment-list'
import { CommentForm } from '@/components/blog/comment-form'
import { NewsletterSubscription } from '@/components/blog/newsletter-subscription'
import { MDXContent } from '@/components/blog/mdx-content'
import { ShareButtons } from '@/components/blog/share-buttons'
import { Badge } from '@/components/ui/badge'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// 生成SEO元数据
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  // Since we're removing slug support, we'll redirect to the new URL format
  return {
    title: '文章已迁移',
    description: '该文章已迁移到新的URL地址。',
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Since we're removing slug support, we'll redirect to the new URL format
  // This page will be removed in the future
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">文章地址已更新</h1>
        <p className="text-muted-foreground mb-6">
          该文章已迁移到新的URL地址。请使用新的地址访问。
        </p>
        <Button asChild>
          <Link href="/blog">返回博客列表</Link>
        </Button>
      </div>
    </div>
  )
}
