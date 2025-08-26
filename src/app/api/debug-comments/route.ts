import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  
  if (!postId) {
    return NextResponse.json({ error: 'Missing postId parameter' }, { status: 400 })
  }
  
  try {
    // 查询文章信息
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, slug')
      .eq('id', postId)
      .single()
    
    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found', postError }, { status: 404 })
    }
    
    // 查询所有评论（不过滤状态）
    const { data: allComments, error: allError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (allError) {
      return NextResponse.json({ error: 'Failed to fetch comments', allError }, { status: 500 })
    }
    
    // 按状态统计
    const statusStats: Record<string, number> = {}
    allComments?.forEach(comment => {
      statusStats[comment.status] = (statusStats[comment.status] || 0) + 1
    })
    
    // 查询已批准的评论
    const { data: approvedComments, error: approvedError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    
    if (approvedError) {
      return NextResponse.json({ error: 'Failed to fetch approved comments', approvedError }, { status: 500 })
    }
    
    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug
      },
      totalComments: allComments?.length || 0,
      approvedComments: approvedComments?.length || 0,
      statusStats,
      allComments: allComments || [],
      approvedCommentsList: approvedComments || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}