import { NextResponse } from 'next/server'
import { postService, commentService } from '@/lib/supabase/services/index'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  
  if (!postId) {
    return NextResponse.json({ error: 'Missing postId parameter' }, { status: 400 })
  }
  
  try {
    // 查询文章信息
    const post = await postService.getPost(postId!)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 查询所有评论（不过滤状态）
    const allComments = await commentService.getComments(postId!, {
      includeReplies: true
    })

    // 按状态统计
    const statusStats: Record<string, number> = {}
    allComments?.forEach(comment => {
      statusStats[comment.status] = (statusStats[comment.status] || 0) + 1
    })

    // 查询已批准的评论
    const approvedComments = await commentService.getComments(postId!, {
      status: 'approved',
      includeReplies: false
    })
    
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}