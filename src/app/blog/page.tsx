'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { postService,categoryService,tagService } from '@/lib/supabase/services/index'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Post } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {AlertCircle} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  created_at: string
  post_count?: number
}

interface TagItem {
  id: string
  name: string
  slug: string
  created_at: string
  post_count?: number
}

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  
  // 展开状态
  const [showFilters, setShowFilters] = useState(false)

  // 检查Supabase配置
  const isConfigured = isSupabaseConfigured()

  const loadPosts = async () => {
    if (!isConfigured) return
    
    try {
      setLoading(true)
      // @ts-ignore
      const postsData = await postService.getPosts({
        page: currentPage,
        limit: POSTS_PER_PAGE,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        tagId: selectedTag || undefined,
        status: 'published'
      })

      // 获取评论数量
      const postsWithComments = (postsData.data || []).map((post: any) => ({
        ...post,
        comment_count: post.comment_count || 0
      }))

      setPosts(postsWithComments)
      setTotal(postsData.total)
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriesAndTags = async () => {
    if (!isConfigured) return
    
    try {
      // @ts-ignore
      const [categoriesData, tagsData] = await Promise.all([
        categoryService.getCategories(),
        tagService.getTags()
      ])
      
      setCategories(categoriesData || [])
      setTags(tagsData || [])
    } catch (error) {
      console.error('加载分类和标签失败:', error)
    }
  }

  useEffect(() => {
    loadPosts()
    loadCategoriesAndTags()
  }, [currentPage, searchTerm, selectedCategory, selectedTag])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setSelectedTag(null)
    setCurrentPage(1)
  }

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">功能受限</h1>
          <p className="text-muted-foreground mb-4">
            此功能需要数据库支持。请配置Supabase以启用完整功能。
          </p>
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">博客</h1>
          <p className="text-lg text-muted-foreground">
            探索我们的文章、见解和想法
          </p>
        </div>

        {/* 搜索和过滤 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>文章搜索</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? '隐藏过滤器' : '显示过滤器'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索文章..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  搜索
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* 分类过滤 */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      分类
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedCategory ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                      >
                        全部
                      </Button>
                      {categories.map(category => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex items-center gap-1"
                        >
                          {category.name}
                          <Badge variant="secondary" className="ml-1">
                            {category.post_count}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 标签过滤 */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      标签
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTag ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => setSelectedTag(null)}
                      >
                        全部
                      </Button>
                      {tags.slice(0, 10).map(tag => (
                        <Button
                          key={tag.id}
                          variant={selectedTag === tag.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTag(tag.id)}
                          className="flex items-center gap-1"
                        >
                          #{tag.name}
                          <Badge variant="secondary" className="ml-1">
                            {tag.post_count}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(searchTerm || selectedCategory || selectedTag) && (
                <div className="pt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    清除所有过滤器
                  </Button>
                </div>
              )}
            </form>
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
                {searchTerm || selectedCategory || selectedTag 
                  ? '没有匹配您搜索条件的文章。请尝试其他关键词或过滤器。' 
                  : '目前还没有发布的文章。'}
              </p>
              {(searchTerm || selectedCategory || selectedTag) && (
                <Button onClick={clearFilters}>清除过滤器</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {posts.map(post => {
                const readingTime = estimateReadingTime(post.content || '')
                return (
                  <Card key={post.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2 text-lg">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                          {post.title}
                        </Link>
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.categories?.slice(0, 2).map(category => (
                          <Badge 
                            key={category.id} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => {
                              setSelectedCategory(category.id)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            {category.name}
                          </Badge>
                        ))}
                        {post.tags?.slice(0, 2).map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="flex items-center gap-1 text-xs cursor-pointer hover:bg-outline/80"
                            onClick={() => {
                              setSelectedTag(tag.id)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            <TagIcon className="h-3 w-3" />
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={post.published_at || post.created_at}>
                              {formatDate(post.published_at || post.created_at)}
                            </time>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {readingTime}分钟
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.view_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count || 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
                </Button>
                
                <span className="text-sm">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
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