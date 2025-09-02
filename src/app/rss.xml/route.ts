import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  const supabase = createClient()
  
  try {
    // 获取所有已发布的博客文章
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        categories(name, color),
        tags:post_tags(tag:tags(name))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // 生成 RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Be Better - 个人博客</title>
    <description>一个结合个人博客和日常日程管理的现代化平台</description>
    <link>${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}</link>
    <atom:link href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts?.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.content?.substring(0, 200) + '...'}]]></description>
      <link>${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/user/${post.user_id}/blog/${post.id}</link>
      <guid isPermaLink="true">${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/user/${post.user_id}/blog/${post.id}</guid>
      <pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate>
      ${post.author ? `<author><![CDATA[${post.author.name || post.author.email}]]></author>` : ''}
      ${post.categories?.length ? `<category><![CDATA[${post.categories[0].name}]]></category>` : ''}
      ${post.tags?.map(tag => `<category><![CDATA[${tag.tag.name}]]></category>`).join('')}
    </item>
    `).join('')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}