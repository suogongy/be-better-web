'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingError } from '@/components/ui/loading-error'
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
        comment_count: 0 // 默认值，实际数量会在后续加载
      }))
      
      setPosts(postsWithComments)
      setTotalPosts(postsData.total)
      
      // 异步加载每篇文章的评论数量
      const commentCounts = await Promise.all(
        (postsData.data || []).map(post => 
          commentService.getCommentCount(post.id).catch(() => 0)
        )
      )
      
      // 更新文章列表，添加实际评论数量
      setPosts(prev => prev.map((post, index) => ({
        ...post,
        comment_count: commentCounts[index] || 0
      })))
      
    } catch (err) {
      console.error('加载博客文章失败:', err)
      setError('加载文章失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和过滤条件变化时重新加载
  useEffect(() => {
    setCurrentPage(1) // 重置到第一页
  }, [searchTerm, selectedCategory, selectedTag])

  useEffect(() => {
    loadData()
  }, [searchTerm, selectedCategory, selectedTag, currentPage])

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  // 处理分类选择
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  // 处理标签选择
  const handleTagSelect = (tagId: string) => {
    setSelectedTag(tagId)
    setCurrentPage(1)
  }

  // 渲染文章列表
  const renderPosts = () => {
    if (loading) {
      return (
        <div className="col-span-full flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="col-span-full">
          <LoadingError 
            loading={false}
            error={error} 
            onRetry={loadData}
          >
            <div></div>
          </LoadingError>
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">没有找到文章</h3>
          <p className="mt-1 text-muted-foreground">
            当前筛选条件下没有找到相关文章。
          </p>
        </div>
      )
    }

    return posts.map((post) => (
      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <Link href={`/blog/${post.slug}`} className="block">
          {post.featured_image ? (
            <div className="relative aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">
                {post.title.charAt(0)}
              </span>
            </div>
          )}
        </Link>
        
        <CardHeader className="pb-2">
          <Link href={`/blog/${post.slug}`} className="hover:no-underline">
            <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
          </Link>
          <CardDescription className="line-clamp-2 mt-1">
            {post.excerpt || '这篇文章暂无摘要内容。'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
            </div>
            
            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.reading_time} 分钟阅读</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.view_count} 次浏览</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count} 条评论</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {categories
              .filter(cat => (post as any).category_id === cat.id)
              .map(category => (
                <Badge 
                  key={category.id} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            
            {tags
              .filter(tag => 
                (post as any).post_tags?.some((pt: any) => pt.tag_id === tag.id)
              )
              .map(tag => (
                <Badge 
                  key={tag.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleTagSelect(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    ))
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">博客文章</h1>
        <p className="text-lg text-muted-foreground">
          探索关于生产力提升、个人成长和效率优化的深度内容
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索文章..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategorySelect('all')}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              全部分类
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">标签:</span>
            <Button
              variant={selectedTag === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTagSelect('all')}
            >
              全部
            </Button>
            
            {tags.slice(0, 10).map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTag === tag.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTagSelect(tag.id)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {renderPosts()}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = 
                totalPages <= 5 
                  ? i + 1 
                  : currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}