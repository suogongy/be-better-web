'use client'

import { useState, useEffect } from 'react'
import { commentService } from '@/lib/supabase/services/index'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast-provider'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { MessageCircle, ExternalLink, Reply, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CommentForm } from '@/components/blog/comment-form'

interface Comment {
  id: string
  post_id: string
  parent_id?: string | null
  author_name: string
  author_email: string
  author_website?: string | null
  content: string
  status: 'pending' | 'approved' | 'spam' | 'rejected'
  created_at: string
}

interface CommentWithReplies extends Comment {
  replies?: Comment[]
}

interface CommentListProps {
  postId: string
  showModeration?: boolean
}

/**
 * 评论列表组件
 * 负责加载和显示文章的评论及回复
 */
export function CommentList({ postId, showModeration = false }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const { addToast } = useToast()

  /**
   * 加载评论数据
   * 包括顶级评论和各自的回复
   */
  const loadComments = async () => {
    try {
      setLoading(true)
      
      // 获取顶级评论
      const topLevelComments = await commentService.getComments(postId, {
        status: showModeration ? undefined : 'approved',
        includeReplies: false,
      })

      // 为每条评论加载回复
      const commentsWithReplies: CommentWithReplies[] = await Promise.all(
        topLevelComments.map(async (comment) => {
          const replies = await commentService.getCommentReplies(
            comment.id,
            showModeration ? undefined : 'approved'
          )
          return { ...comment, replies }
        })
      )

      setComments(commentsWithReplies)
    } catch (error) {
      console.error('加载评论失败:', error)
      addToast({
        title: '错误',
        description: '加载评论失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [postId, showModeration])

  const handleCommentSubmitted = () => {
    setReplyingTo(null)
    loadComments()
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 评论计数 */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          {comments.length === 0 
            ? '还没有评论' 
            : `${comments.length} 条评论`
          }
        </h3>
        {showModeration && (
          <Link href="/blog/admin/comments">
            <Button variant="outline" size="sm" className="ml-2 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              评论管理
            </Button>
          </Link>
        )}
      </div>

      {/* 评论内容 */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">成为第一个评论的人</h4>
            <p className="text-muted-foreground">
              分享您的想法，开始讨论！
            </p>
            {!showModeration && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>📝 评论需要管理员审核后才会显示</p>
                <Link href="/blog/admin/comments" className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
                  <Shield className="h-3 w-3" />
                  管理员可以在这里审核评论
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              replyingTo={replyingTo}
              onCommentSubmitted={handleCommentSubmitted}
              postId={postId}
              showModeration={showModeration}
            />
          ))}
        </div>
      )}

      {/* 主评论表单 */}
      <CommentForm
        postId={postId}
        onCommentSubmitted={handleCommentSubmitted}
        showTitle={true}
      />
    </div>
  )
}

interface CommentItemProps {
  comment: CommentWithReplies
  onReply: (commentId: string) => void
  replyingTo: string | null
  onCommentSubmitted: () => void
  postId: string
  showModeration: boolean
  level?: number
}

/**
 * 单个评论项组件
 * 支持嵌套显示回复评论
 */
function CommentItem({
  comment,
  onReply,
  replyingTo,
  onCommentSubmitted,
  postId,
  showModeration,
  level = 0,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id
  const maxDepth = 3 // 最大嵌套层级

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card>
        <CardContent className="p-4">
          {/* 评论头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                </Avatar>
                {comment.author_website ? (
                  <a
                    href={comment.author_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {comment.author_name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  comment.author_name
                )}
              </h4>
              
              {showModeration && (
                <Badge
                  variant={
                    comment.status === 'approved' ? 'default' :
                    comment.status === 'pending' ? 'secondary' :
                    comment.status === 'spam' ? 'destructive' : 'outline'
                  }
                >
                  {comment.status === 'approved' ? '已批准' :
                   comment.status === 'pending' ? '待审核' :
                   comment.status === 'spam' ? '垃圾' : '已拒绝'}
                </Badge>
              )}
              
              <time 
                className="text-sm text-muted-foreground"
                dateTime={comment.created_at}
              >
                {formatDate(comment.created_at)}
              </time>
            </div>
          </div>

          {/* 评论内容 */}
          <div className="prose prose-sm max-w-none mb-3">
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* 评论操作 */}
          <div className="flex items-center gap-2">
            {level < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                回复
              </Button>
            )}
          </div>

          {/* 回复表单 */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentSubmitted={onCommentSubmitted}
                onCancel={() => onReply(comment.id)}
                placeholder={`回复 ${comment.author_name}...`}
                showTitle={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              replyingTo={replyingTo}
              onCommentSubmitted={onCommentSubmitted}
              postId={postId}
              showModeration={showModeration}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}