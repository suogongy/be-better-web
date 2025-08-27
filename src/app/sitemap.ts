import { MetadataRoute } from 'next'
import { postService } from '@/lib/supabase/services/index'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'

  // Static routes
  const staticRoutes = [
    '',
    '/blog',
    '/auth/login',
    '/auth/register',
    '/dashboard',
    '/schedule',
    '/summary',
    '/habits',
    '/mood',
    '/insights',
    '/export',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    // Get published blog posts
    const posts = await postService.getPosts({
      status: 'published',
      limit: 1000
    })

    const blogRoutes = posts.data.map((post: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...blogRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}