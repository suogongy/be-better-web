import type { Metadata } from 'next'

// Default SEO configuration
export const defaultSEO = {
  title: 'Be Better Web - Personal Productivity & Blogging Platform',
  description: 'Transform your productivity with comprehensive task management, habit tracking, mood logging, and insightful analytics. Create meaningful blog posts from your daily summaries.',
  keywords: 'productivity, task management, habit tracking, mood logging, blogging, personal development, analytics, daily summaries, time management',
  author: 'Be Better Web',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com',
  siteName: 'Be Better Web',
  locale: 'en_US',
  type: 'website',
}

// Generate metadata for pages
export function generateMetadata({
  title,
  description,
  keywords,
  image,
  path = '',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  tags,
}: {
  title?: string
  description?: string
  keywords?: string
  image?: string
  path?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
}): Metadata {
  const pageTitle = title ? `${title} | ${defaultSEO.siteName}` : defaultSEO.title
  const pageDescription = description || defaultSEO.description
  const pageKeywords = keywords || defaultSEO.keywords
  const canonicalUrl = `${defaultSEO.siteUrl}${path}`
  const imageUrl = image || `${defaultSEO.siteUrl}/og-default.png`

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: [{ name: author || defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.siteName,
    
    // Open Graph
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: defaultSEO.siteName,
      locale: defaultSEO.locale,
      type: type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        tags,
      }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
      creator: '@bebetterweb',
      site: '@bebetterweb',
    },

    // Additional metadata
    alternates: {
      canonical: canonicalUrl,
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
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
  }

  return metadata
}

// Generate structured data for different content types
export function generateStructuredData(type: 'website' | 'article' | 'blog' | 'organization', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
  }

  switch (type) {
    case 'website':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: defaultSEO.siteName,
        url: defaultSEO.siteUrl,
        description: defaultSEO.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${defaultSEO.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }

    case 'article':
      return {
        ...baseData,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        publisher: {
          '@type': 'Organization',
          name: defaultSEO.siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${defaultSEO.siteUrl}/logo.png`,
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url,
        },
      }

    case 'blog':
      return {
        ...baseData,
        '@type': 'Blog',
        name: `${defaultSEO.siteName} Blog`,
        description: 'Personal productivity insights and reflections',
        url: `${defaultSEO.siteUrl}/blog`,
        author: {
          '@type': 'Person',
          name: defaultSEO.author,
        },
        publisher: {
          '@type': 'Organization',
          name: defaultSEO.siteName,
        },
      }

    case 'organization':
      return {
        ...baseData,
        '@type': 'Organization',
        name: defaultSEO.siteName,
        url: defaultSEO.siteUrl,
        description: defaultSEO.description,
        logo: `${defaultSEO.siteUrl}/logo.png`,
        sameAs: [
          // Add social media URLs here
        ],
      }

    default:
      return baseData
  }
}

// SEO utilities
export const seoUtils = {
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100)
  },

  truncateDescription: (text: string, maxLength: number = 160): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3).trim() + '...'
  },

  extractKeywords: (content: string, maxKeywords: number = 10): string[] => {
    // Simple keyword extraction - in production, use more sophisticated methods
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word))

    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word)
  },

  generateBreadcrumbs: (path: string) => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = [
      { name: 'Home', url: '/' }
    ]

    let currentPath = ''
    segments.forEach(segment => {
      currentPath += `/${segment}`
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      breadcrumbs.push({ name, url: currentPath })
    })

    return breadcrumbs
  },

  generateCanonicalUrl: (path: string): string => {
    return `${defaultSEO.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  },
}