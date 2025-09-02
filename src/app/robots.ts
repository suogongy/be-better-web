import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/',
          '/blog/*',
        ],
        disallow: [
          '/dashboard/',
          '/schedule/',
          '/summary/',
          '/habits/',
          '/mood/',
          '/insights/',
          '/export/',
          '/auth/',
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/blog/',
          '/blog/*',
        ],
        disallow: [
          '/dashboard/',
          '/schedule/',
          '/summary/',
          '/habits/',
          '/mood/',
          '/insights/',
          '/export/',
          '/auth/',
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}