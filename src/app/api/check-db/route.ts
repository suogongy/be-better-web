import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 尝试查询带新字段的 posts
    const { data, error } = await supabase
      .from('posts')
      .select('id, category_ids, tag_ids')
      .limit(1)
    
    if (error) {
      // 如果错误提示列不存在，说明需要执行迁移
      if (error.message.includes('column "category_ids" does not exist') ||
          error.message.includes('column "tag_ids" does not exist')) {
        return NextResponse.json({
          needsMigration: true,
          error: 'Database columns not found',
          details: error.message
        })
      }
      
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      needsMigration: false,
      sample: data?.[0] || null,
      hasData: !!(data && data.length > 0)
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}