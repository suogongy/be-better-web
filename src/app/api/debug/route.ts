import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 检查 posts 表的列
    const { data: columns, error: columnsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
    
    if (columnsError) {
      return NextResponse.json({ 
        error: 'Failed to query posts table',
        details: columnsError.message 
      }, { status: 500 })
    }
    
    // 检查是否有数据
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json({ 
        error: 'Failed to count posts',
        details: countError.message 
      }, { status: 500 })
    }
    
    // 获取一个示例来查看字段
    const { data: sample, error: sampleError } = await supabase
      .from('posts')
      .select('id, title, category_ids, tag_ids')
      .limit(1)
    
    return NextResponse.json({
      success: true,
      postsCount: count,
      samplePost: sample?.[0] || null,
      hasCategoryIds: sample?.[0]?.category_ids !== undefined,
      hasTagIds: sample?.[0]?.tag_ids !== undefined,
      columns: columns?.length ? Object.keys(columns[0]) : []
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}