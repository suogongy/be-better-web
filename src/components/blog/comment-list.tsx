'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { commentService } from '@/lib/supabase/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommentForm } from './comment-form'
import { useToast } from '@/components/ui/toast-provider'
import { MessageCircle, Reply, ExternalLink } from 'lucide-react'

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

export function CommentList({ postId, showModeration = false }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const { addToast } = useToast()

  const loadComments = async () => {
    try {
      setLoading(true)
      
      // Get top-level comments
      const topLevelComments = await commentService.getComments(postId, {
        status: showModeration ? undefined : 'approved',
        includeReplies: false,
      })

      // Load replies for each comment
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
      console.error('Failed to load comments:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load comments',
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
      {/* Comment Count */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          {comments.length === 0 
            ? 'No comments yet' 
            : `${comments.length} comment${comments.length === 1 ? '' : 's'}`
          }
        </h3>
      </div>

      {/* Comments */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">Be the first to comment</h4>
            <p className="text-muted-foreground">
              Share your thoughts and start a discussion!
            </p>
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

      {/* Main Comment Form */}
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
  const maxDepth = 3 // Maximum nesting level

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card>
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">
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
                  {comment.status}
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

          {/* Comment Content */}
          <div className="prose prose-sm max-w-none mb-3">
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-2">
            {level < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentSubmitted={onCommentSubmitted}
                onCancel={() => onReply(comment.id)}
                placeholder={`Reply to ${comment.author_name}...`}
                showTitle={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replies */}
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