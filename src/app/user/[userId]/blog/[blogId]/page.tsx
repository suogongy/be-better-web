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
    userId: string
    blogId: string
  }
}

// 生成SEO元数据
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { userId, blogId } = await params
  const post = await postService.getPost(blogId)

  if (!post || post.user_id !== userId) {
    return {
      title: '文章未找到',
      description: '请求的文章不存在。',
    }
  }

  const title = `${post.title} | Be Better Web`
  const description = post.excerpt || post.content?.slice(0, 160) || '博客文章'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'
  const url = `${siteUrl}/user/${userId}/blog/${blogId}`

  return {
    title,
    description,
    keywords: [
      '博客',
      '生产力',
      '个人成长',
      '效率提升'
    ],
    authors: [{ name: 'Be Better Web' }],
    creator: 'Be Better Web',
    publisher: 'Be Better Web',
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Be Better Web',
      locale: 'zh_CN',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: post.status === 'published',
      follow: post.status === 'published',
      googleBot: {
        index: post.status === 'published',
        follow: post.status === 'published',
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { userId, blogId } = await params

  const post = await postService.getPost(blogId)

  if (!post || post.user_id !== userId || post.status !== 'published') {
    notFound()
  }

  // 增加浏览量
  try {
    await postService.incrementViewCount(post.id)
  } catch (error) {
    console.error('增加浏览量失败:', error)
  }

  // 获取作者信息
  let author = null
  if (post.user_id) {
    try {
      author = await userService.getProfile(post.user_id)
    } catch (error) {
      console.error('获取作者信息失败:', error)
    }
  }

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  const readingTime = estimateReadingTime(post.content || '')

  // 获取相邻文章
  const allPosts = await postService.getPosts({
    status: 'published',
    userId: post.user_id // 只获取同一作者的文章
  })

  const currentIndex = allPosts.data.findIndex((p: any) => p.id === post.id)
  const prevPost = currentIndex > 0 ? allPosts.data[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.data.length - 1 ? allPosts.data[currentIndex + 1] : null

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回导航 */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回博客列表
        </Link>
      </div>

      {/* 文章导航 */}
      <div className="flex justify-between items-center mb-12">
        {prevPost ? (
          <Button variant="outline" asChild className="flex items-center gap-2">
            <Link href={`/user/${userId}/blog/${prevPost.id}`}>
              <ArrowLeft className="h-4 w-4" />
              {prevPost.title}
            </Link>
          </Button>
        ) : (
          <div></div>
        )}
        
        {nextPost ? (
          <Button variant="outline" asChild className="flex items-center gap-2">
            <Link href={`/user/${userId}/blog/${nextPost.id}`}>
              {nextPost.title}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        ) : (
          <div></div>
        )}
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

        {/* 作者信息 */}
        {author && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                {author.name ? author.name.charAt(0).toUpperCase() : author.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium">
                <Link href={`/blog/user/${author.id}`} className="hover:text-primary">
                  {author.name || author.email}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <time dateTime={post.published_at || post.created_at}>
                  {formatDate(post.published_at || post.created_at)}
                </time>
              </div>
            </div>
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
      <div className="prose dark:prose-invert max-w-none mb-12">
        {post.content && <MDXContent content={post.content} />}
      </div>

      {/* Article Footer */}
      <footer className="border-t pt-8">
        {/* 分享按钮 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">分享这篇文章</h3>
          <ShareButtons title={post.title} />
        </div>
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
              name: author?.name || author?.email || 'Be Better Web',
              url: author ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/blog/user/${author.id}` : undefined,
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
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/user/${userId}/blog/${blogId}`,
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