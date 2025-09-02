'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { PostStatistics } from './post-statistics'

interface PostStatsWrapperProps {
  postId: string
  authorId: string
}

export function PostStatsWrapper({ postId, authorId }: PostStatsWrapperProps) {
  const { user } = useAuth()
  
  // 只有文章作者才能查看统计
  if (!user || user.id !== authorId) {
    return null
  }
  
  return <PostStatistics postId={postId} />
}