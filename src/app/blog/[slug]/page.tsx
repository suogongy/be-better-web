import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { postService } from '@/lib/supabase/database'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CommentList } from '@/components/blog/comment-list'
import { ShareButtons } from '@/components/blog/share-buttons'
import { NewsletterSubscription } from '@/components/blog/newsletter-subscription'
import Link from 'next/link'
import { Calendar, Clock, Eye, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

// 生成SEO元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await postService.getPostBySlugWithRelations(slug)

  if (!post) {
    return {
      title: '文章未找到',
      description: '请求的博客文章不存在。',
    }
  }

  const title = `${post.title} | Be Better Web`
  const description = post.excerpt || '阅读这篇关于生产力提升和个人成长的深度文章。'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'
  const url = `${siteUrl}/blog/${post.slug}`

  return {
    title,
    description,
    keywords: [
      '博客',
      '生产力',
      '个人成长',
      '效率提升',
      '工作效率',
      '时间管理',
      post.title
    ],
    authors: [{ name: 'Be Better Web' }],
    creator: 'Be Better Web',
    publisher: 'Be Better Web',
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: ['Be Better Web'],
      siteName: 'Be Better Web',
      locale: 'zh_CN',
      images: post.featured_image ? [
        {
          url: post.featured_image,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : [{
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Be Better Web - 生产力提升和个人成长博客',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@bebetterweb',
      images: post.featured_image ? [post.featured_image] : [`${siteUrl}/og-image.jpg`],
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
    other: {
      'article:published_time': post.published_at || post.created_at,
      'article:modified_time': post.updated_at,
      'article:author': 'Be Better Web',
      'article:section': '博客',
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await postService.getPostBySlugWithRelations(slug)

  if (!post) {
    notFound()
  }

  // Increment view count
  try {
    await postService.incrementViewCount(post.id)
  } catch (error) {
    // Non-critical error, continue rendering
    console.error('Failed to increment view count:', error)
  }

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  const readingTime = estimateReadingTime(post.content || '')

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回导航 */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回博客列表
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* 分类和标签 */}
        {((post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories?.map((category: any) => (
              <Badge key={category.id} variant="default" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {post.tags?.map((tag: any) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* 文章元数据 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.published_at || post.created_at}>
              {formatDate(post.published_at || post.created_at)}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {readingTime} 分钟阅读
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {(post.view_count || 0) + 1} 次阅读
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      <div 
        className="prose dark:prose-invert max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />

      {/* Article Footer */}
      <footer className="border-t pt-8">
        {/* 分享按钮 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">分享这篇文章</h3>
          <ShareButtons title={post.title} />
        </div>

        {/* 文章导航 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">上一篇</h4>
              <p className="text-sm text-muted-foreground">
                正在开发中 - 文章导航功能
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">下一篇</h4>
              <p className="text-sm text-muted-foreground">
                正在开发中 - 文章导航功能
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 行动召唤 */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">喜欢这篇文章吗？</h3>
            <p className="text-muted-foreground mb-4">
              订阅我们的邮件列表，获取最新的文章和生产力提升技巧。
            </p>
            <NewsletterSubscription />
          </CardContent>
        </Card>
      </footer>

      {/* 评论区域 */}
      <section className="border-t pt-12 mt-12">
        <CommentList postId={post.id} />
      </section>

      {/* JSON-LD 结构化数据用于SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featured_image || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/og-image.jpg`,
            author: {
              '@type': 'Person',
              name: 'Be Better Web',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Be Better Web',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/logo.png`,
              },
            },
            datePublished: post.published_at || post.created_at,
            dateModified: post.updated_at,
            wordCount: post.content ? post.content.split(/\s+/).length : 0,
            timeRequired: `PT${readingTime}M`,
            inLanguage: 'zh-CN',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/blog/${post.slug}`,
            },
            keywords: ['生产力', '个人成长', '效率提升', '博客'].join(','),
            articleSection: '博客',
            genre: '生产力提升',
          }),
        }}
      />
    </article>
  )
}