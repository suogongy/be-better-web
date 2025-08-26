'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { postService, categoryService, tagService, commentService } from '@/lib/supabase/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Clock, Eye, MessageCircle, Search, Filter, AlertCircle } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt?: string
  slug: string
  published_at?: string
  view_count: number
  featured_image?: string
  user_id: string
  reading_time?: number
  created_at: string
  updated_at: string
  status: 'draft' | 'published' | 'archived'
  content?: string
  comment_count?: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  // 状态管理
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [mounted, setMounted] = useState(false)

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  // 客户端挂载检查
  useEffect(() => {
    setMounted(true)
  }, [])

  // 数据加载函数
  const loadData = async () => {
    // 检查Supabase配置
    if (!isSupabaseConfigured()) {
      setError('数据库配置错误，请检查Supabase配置')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // 并行加载基础数据
      const [categoriesData, tagsData] = await Promise.all([
        categoryService.getCategories().catch(() => []),
        tagService.getTags().catch(() => []),
      ])
      
      setCategories(categoriesData)
      setTags(tagsData)
      
      // 加载文章数据
      const postsData = await postService.getPostsWithFilters({
        status: 'published',
        limit: POSTS_PER_PAGE,
        offset: (currentPage - 1) * POSTS_PER_PAGE,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        tag: selectedTag !== 'all' ? selectedTag : undefined,
      })
      
      // 为文章加载评论数量（简化版本，避免过多并发请求）
      const postsWithComments = (postsData.data || []).map(post => ({
        ...post,
        comment_count: 0 // 暂时设为0，避免过多API调用导致loading问题
      }))
      
      setPosts(postsWithComments)
      setTotalPosts(postsData.total || 0)
      
    } catch (error) {
      console.error('Failed to load blog data:', error)
      setError('加载博客数据失败，请稍后重试')
      // 设置空数据以防止无限loading
      setPosts([])
      setTotalPosts(0)
    } finally {
      setLoading(false)
    }
  }

  // 依赖项变化时重新加载数据
  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [mounted, currentPage, searchTerm, selectedCategory, selectedTag])

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  // 重置过滤器
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedTag('all')
    setCurrentPage(1)
  }

  // 估算阅读时间
  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  // 如果组件未挂载，显示loading骨架
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="h-12 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">博客</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          分享生产力提升、个人成长和每日进步的心得体会
        </p>
      </div>

      {/* 错误状态显示 */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">加载失败</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setError(null)
              loadData()
            }}
          >
            重试
          </Button>
        </div>
      )}

      {/* 搜索和过滤器 */}
      <div className="mb-8 space-y-4">
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文章..."
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            搜索
          </Button>
        </form>

        {/* 过滤器 */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">筛选：</span>
          </div>
          
          {/* 分类过滤 */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory('all')
                setCurrentPage(1)
              }}
              disabled={loading}
            >
              所有分类
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category.slug)
                  setCurrentPage(1)
                }}
                disabled={loading}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* 标签过滤 */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedTag === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedTag('all')
                setCurrentPage(1)
              }}
              disabled={loading}
            >
              所有标签
            </Button>
            {tags.slice(0, 5).map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTag === tag.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTag(tag.slug)
                  setCurrentPage(1)
                }}
                disabled={loading}
              >
                {tag.name}
              </Button>
            ))}
          </div>

          {/* 清除过滤器 */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            disabled={loading}
          >
            清除筛选
          </Button>
        </div>
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">暂无文章</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedTag !== 'all'
              ? '试试调整搜索条件或筛选条件'
              : '尚未发布任何博客文章'}
          </p>
          <Button onClick={resetFilters} variant="outline">
            清除筛选
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2 hover:text-primary">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt || '暂无摘要'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.reading_time || estimateReadingTime(post.excerpt || '')} 分钟
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {post.view_count || 0} 次阅读
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count || 0} 条评论
                  </div>
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <Button className="w-full">
                    阅读更多
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <Button
            variant="outline"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            上一页
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 7) return true
                if (page === 1 || page === totalPages) return true
                if (Math.abs(page - currentPage) <= 2) return true
                return false
              })
              .map((page, index, array) => {
                const prevPage = array[index - 1]
                const showEllipsis = prevPage && page - prevPage > 1
                
                return (
                  <div key={page} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 py-1 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  </div>
                )
              })}
          </div>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 结果信息 */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        显示 {posts.length} / {totalPosts} 篇文章
        {(searchTerm || selectedCategory !== 'all' || selectedTag !== 'all') && (
          <span> （已筛选）</span>
        )}
      </div>

      {/* 订阅通知 */}
      <div className="bg-muted rounded-lg p-8 mt-16 text-center">
        <h3 className="text-2xl font-bold mb-4">保持更新</h3>
        <p className="text-muted-foreground mb-6">
          订阅我们的邮件列表，获取最新的文章和生产力提升技巧。
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="输入您的邮箱"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button>订阅</Button>
        </div>
      </div>
    </div>
  )
}