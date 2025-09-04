import { NextRequest, NextResponse } from 'next/server'
import { BlogService } from '@/lib/supabase/services/blog-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '6'),
      categoryId: searchParams.get('categoryId') || undefined,
      tagId: searchParams.get('tagId') || undefined,
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') || 'published') as 'draft' | 'published' | 'archived',
      // 移除了 userId 参数，现在是单用户系统
    }

    // 使用优化的服务获取数据
    const result = await BlogService.getBlogList(options)

    // 并行获取分类和标签统计（用于过滤器）
    const [categoryTagStats] = await Promise.all([
      BlogService.getCategoryAndTagStats()
    ])

    return NextResponse.json({
      ...result,
      filters: {
        categories: categoryTagStats.categories,
        tags: categoryTagStats.tags
      }
    })
  } catch (error) {
    console.error('Blog API error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch blog posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}