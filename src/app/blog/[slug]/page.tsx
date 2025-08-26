import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { postService } from '@/lib/supabase/database'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CommentList } from '@/components/blog/comment-list'
import Link from 'next/link'
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from 'lucide-react'

interface PageProps {
  params: { slug: string }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await postService.getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const title = `${post.title} | Be Better Web`
  const description = post.excerpt || 'Read this insightful blog post on Be Better Web.'
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/blog/${post.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: ['Be Better Web'],
      images: post.featured_image ? [
        {
          url: post.featured_image,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:published_time': post.published_at || post.created_at,
      'article:modified_time': post.updated_at,
      'article:author': 'Be Better Web',
      'article:section': 'Blog',
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await postService.getPostBySlug(params.slug)

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
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
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

        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.published_at || post.created_at}>
              {formatDate(post.published_at || post.created_at)}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {readingTime} min read
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {(post.view_count || 0) + 1} views
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
        {/* Share Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Share this post</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = window.location.href
                const text = `Check out this blog post: ${post.title}`
                if (navigator.share) {
                  navigator.share({ title: post.title, text, url })
                } else {
                  navigator.clipboard.writeText(url)
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`
                window.open(url, '_blank')
              }}
            >
              Tweet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
                window.open(url, '_blank')
              }}
            >
              LinkedIn
            </Button>
          </div>
        </div>

        {/* Navigation to Other Posts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Previous Post</h4>
              <p className="text-sm text-muted-foreground">
                Coming soon - navigation to previous post
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Next Post</h4>
              <p className="text-sm text-muted-foreground">
                Coming soon - navigation to next post
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Enjoyed this post?</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to get notified about new posts and productivity insights.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </footer>

      {/* Comments Section */}
      <section className="border-t pt-12 mt-12">
        <CommentList postId={post.id} />
      </section>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featured_image,
            author: {
              '@type': 'Person',
              name: 'Be Better Web',
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
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'}/blog/${post.slug}`,
            },
          }),
        }}
      />
    </article>
  )
}