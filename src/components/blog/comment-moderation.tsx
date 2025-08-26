'use client'

import { useState, useEffect } from 'react'
import { commentService } from '@/lib/supabase/database'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Check, 
  X, 
  Shield, 
  Trash2, 
  AlertTriangle, 
  MessageCircle,
  Eye,
  Filter
} from 'lucide-react'

interface Comment {
  id: string
  post_id: string
  parent_id?: string | null
  author_name: string
  author_email: string
  author_website?: string | null
  content: string
  status: 'pending' | 'approved' | 'spam' | 'rejected'
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

interface CommentStats {
  total: number
  approved: number
  pending: number
  spam: number
  rejected: number
}

export function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    spam: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'spam' | 'all'>('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { addToast } = useToast()

  const ITEMS_PER_PAGE = 10

  const loadComments = async () => {
    try {
      setLoading(true)
      
      // Load comments for moderation
      const filterStatus = activeTab === 'all' ? undefined : (activeTab as 'pending' | 'spam')
      const { data, total } = await commentService.getCommentsForModeration({
        status: filterStatus,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      })
      
      setComments(data)
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))
      
      // Load statistics
      const commentStats = await commentService.getCommentStats()
      setStats(commentStats)
    } catch (error) {
      console.error('Failed to load comments:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load comments for moderation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [activeTab, currentPage])

  const handleStatusUpdate = async (
    commentId: string, 
    newStatus: 'approved' | 'spam' | 'rejected'
  ) => {
    try {
      await commentService.updateCommentStatus(commentId, newStatus)
      
      addToast({
        title: 'Success',
        description: `Comment ${newStatus} successfully`,
        variant: 'success',
      })
      
      loadComments()
    } catch (error) {
      console.error('Failed to update comment status:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update comment status',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) {
      return
    }

    try {
      await commentService.deleteComment(commentId)
      
      addToast({
        title: 'Success',
        description: 'Comment deleted successfully',
        variant: 'success',
      })
      
      loadComments()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Comment Moderation</h1>
        <p className="text-muted-foreground">
          Manage and moderate comments across all blog posts
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Spam</p>
                <p className="text-2xl font-bold text-red-600">{stats.spam}</p>
              </div>
              <Shield className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-gray-600">{stats.rejected}</p>
              </div>
              <X className="h-4 w-4 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Comments to Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: string) => {
            setActiveTab(value as 'pending' | 'spam' | 'all')
            setCurrentPage(1)
          }}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="spam">
                Spam ({stats.spam})
              </TabsTrigger>
              <TabsTrigger value="all">
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No comments to review</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? 'All comments have been moderated'
                      : `No ${activeTab} comments found`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentModerationItem
                      key={comment.id}
                      comment={comment}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface CommentModerationItemProps {
  comment: Comment
  onStatusUpdate: (id: string, status: 'approved' | 'spam' | 'rejected') => void
  onDelete: (id: string) => void
}

function CommentModerationItem({ 
  comment, 
  onStatusUpdate, 
  onDelete 
}: CommentModerationItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{comment.author_name}</h4>
            <Badge
              variant={
                comment.status === 'approved' ? 'default' :
                comment.status === 'pending' ? 'secondary' :
                comment.status === 'spam' ? 'destructive' : 'outline'
              }
            >
              {comment.status}
            </Badge>
            <time 
              className="text-sm text-muted-foreground"
              dateTime={comment.created_at}
            >
              {formatDate(comment.created_at)}
            </time>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          <div>Email: {comment.author_email}</div>
          {comment.author_website && (
            <div>Website: {comment.author_website}</div>
          )}
          {comment.ip_address && (
            <div>IP: {comment.ip_address}</div>
          )}
        </div>

        <div className="prose prose-sm max-w-none mb-4">
          <p className="whitespace-pre-wrap bg-muted p-3 rounded">
            {comment.content}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {comment.status !== 'approved' && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate(comment.id, 'approved')}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Approve
            </Button>
          )}
          
          {comment.status !== 'spam' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusUpdate(comment.id, 'spam')}
              className="flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Mark as Spam
            </Button>
          )}
          
          {comment.status !== 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(comment.id, 'rejected')}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(comment.id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}