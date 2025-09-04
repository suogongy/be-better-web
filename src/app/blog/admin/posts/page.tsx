'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { postService } from '@/lib/supabase/services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Post } from '@/types/database'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const POSTS_PER_PAGE = 10

export default function PostsAdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const loadPosts = async () => {
    try {
      setLoading(true)
      const { data, total } = await postService.getPosts({
        page: currentPage,
        limit: POSTS_PER_PAGE,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      })
      
      setPosts(data || [])
      setTotal(total)
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [currentPage, searchTerm, statusFilter])

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return
    }

    try {
      await postService.deletePost(postId)
      await loadPosts() // 重新加载列表
    } catch (error) {
      console.error('删除文章失败:', error)
      alert('删除文章失败，请重试')
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: '草稿', variant: 'secondary' as const },
      published: { label: '已发布', variant: 'default' as const },
      archived: { label: '已归档', variant: 'outline' as const }
    }
    
    const config = variants[status as keyof typeof variants] || variants.draft
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const totalPages = Math.ceil(total / POSTS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题和操作 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">文章管理</h1>
            <p className="text-muted-foreground mt-1">
              管理您的所有博客文章
            </p>
          </div>
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              新建文章
            </Link>
          </Button>
        </div>

        {/* 搜索和过滤 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文章标题或内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  全部
                </Button>
                <Button
                  variant={statusFilter === 'published' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('published')}
                >
                  已发布
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  草稿
                </Button>
                <Button
                  variant={statusFilter === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('archived')}
                >
                  已归档
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 文章列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">没有找到文章</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? '没有匹配您搜索条件的文章。请尝试其他关键词或过滤器。' 
                  : '您还没有创建任何文章。'}
              </p>
              <Button asChild>
                <Link href="/blog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一篇文章
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold leading-tight">
                            <Link 
                              href={`/blog/${post.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          {getStatusBadge(post.status)}
                        </div>
                        
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.created_at)}
                          </div>
                          {post.status === 'published' && post.published_at && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              浏览 {post.view_count || 0} 次
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/blog/${post.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/blog/${post.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页 ({total} 篇文章)
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}