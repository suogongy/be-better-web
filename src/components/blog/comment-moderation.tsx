'use client'

import { useState, useEffect } from 'react'
import { commentService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageCircle, Check, X as XIcon, AlertTriangle, Shield, Filter, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    spam: 0,
    rejected: 0
  })
  const { addToast } = useToast()
  const ITEMS_PER_PAGE = 10

  const loadComments = async () => {
    try {
      setLoading(true)
      
      // 加载待审核评论
      const filterStatus = activeTab === 'all' ? undefined : (activeTab as 'pending' | 'spam')
      const { data, total } = await commentService.getCommentsForModeration({
        status: filterStatus,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      })
      
      setComments(data)
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))
      
      // 加载统计数据
      const commentStats = await commentService.getCommentStats()
      setStats(commentStats)
    } catch (error) {
      console.error('加载评论失败:', error)
      addToast({
        title: "错误",
        description: "加载待审核评论失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [activeTab, currentPage])

  const handleStatusUpdate = async (commentId: string, newStatus: Comment['status']) => {
    try {
      await commentService.updateCommentStatus(commentId, newStatus)
      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, status: newStatus } : comment
      ))
      addToast({
        title: "成功",
        description: "评论状态已更新"
      })
    } catch (error) {
      console.error('更新评论状态失败:', error)
      addToast({
        title: "错误",
        description: "更新评论状态失败",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('您确定要永久删除这条评论吗？')) {
      return
    }

    try {
      await commentService.deleteComment(commentId)
      
      addToast({
        title: "成功",
        description: "评论已删除"
      })
      
      loadComments()
    } catch (error) {
      console.error('删除评论失败:', error)
      addToast({
        title: "错误",
        description: "删除评论失败",
        variant: "destructive"
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
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">评论管理</h1>
        <p className="text-muted-foreground">
          管理和审核所有博客文章的评论
        </p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总计</p>
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
                <p className="text-sm font-medium text-muted-foreground">已批准</p>
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
                <p className="text-sm font-medium text-muted-foreground">待审核</p>
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
                <p className="text-sm font-medium text-muted-foreground">垃圾评论</p>
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
                <p className="text-sm font-medium text-muted-foreground">已拒绝</p>
                <p className="text-2xl font-bold text-gray-600">{stats.rejected}</p>
              </div>
              <XIcon className="h-4 w-4 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 管理界面 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            待审核评论
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: string) => {
            setActiveTab(value as 'pending' | 'spam' | 'all')
            setCurrentPage(1)
          }}>
            <TabsList>
              <TabsTrigger value="pending">
                待审核 ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="spam">
                垃圾评论 ({stats.spam})
              </TabsTrigger>
              <TabsTrigger value="all">
                全部
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">没有待审核的评论</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? '所有评论都已审核完毕'
                      : activeTab === 'spam' 
                      ? '未找到垃圾评论'
                      : '未找到评论'
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

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    上一页
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    下一页
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
  onStatusUpdate: (id: string, status: Comment['status']) => void
  onDelete: (id: string) => void
}

const CommentModerationItem = ({ comment, onStatusUpdate, onDelete }: CommentModerationItemProps) => {
  const getStatusText = (status: Comment['status']) => {
    switch (status) {
      case 'approved': return '已批准'
      case 'pending': return '待审核'
      case 'spam': return '垃圾评论'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  return (
    <Card key={comment.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium">{comment.author_name}</h4>
          <Badge
            variant={
              comment.status === 'approved' ? 'default' :
              comment.status === 'pending' ? 'secondary' :
              comment.status === 'spam' ? 'destructive' : 'outline'
            }
          >
            {getStatusText(comment.status)}
          </Badge>
          <time 
            className="text-sm text-muted-foreground"
            dateTime={comment.created_at}
          >
            {formatDate(comment.created_at)}
          </time>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          <div>邮箱: {comment.author_email}</div>
          {comment.author_website && (
            <div>网站: {comment.author_website}</div>
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
              批准
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
              标记为垃圾
            </Button>
          )}
          
          {comment.status !== 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(comment.id, 'rejected')}
              className="flex items-center gap-1"
            >
              <XIcon className="h-3 w-3" />
              拒绝
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(comment.id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
