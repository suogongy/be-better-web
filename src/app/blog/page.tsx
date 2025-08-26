'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { postService, categoryService, tagService, commentService } from '@/lib/supabase/database'
import Link from 'next/link'
import { Calendar, Clock, Eye, MessageCircle, Search, Filter } from 'lucide-react'

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
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  const loadData = async () => {
    try {
      setLoading(true)
      const [postsData, categoriesData, tagsData] = await Promise.all([
        postService.getPosts({
          status: 'published',
          limit: POSTS_PER_PAGE,
          offset: (currentPage - 1) * POSTS_PER_PAGE,
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          tag: selectedTag !== 'all' ? selectedTag : undefined,
        }),
        categoryService.getCategories(),
        tagService.getTags(),
      ])
      
      // Load comment counts for each post
      const postsWithComments = await Promise.all(
        (postsData.data || []).map(async (post) => {
          try {
            const comments = await commentService.getComments(post.id, { status: 'approved' })
            return { ...post, comment_count: comments.length }
          } catch (error) {
            console.error(`Failed to load comment count for post ${post.id}:`, error)
            return { ...post, comment_count: 0 }
          }
        })
      )
      
      setPosts(postsWithComments)
      setTotalPosts(postsData.total || 0)
      setCategories(categoriesData)
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentPage, searchTerm, selectedCategory, selectedTag])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedTag('all')
    setCurrentPage(1)
  }

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights on productivity, personal growth, and the journey to being better every day.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="pl-10"
            />
          </div>
          <Button type="submit">
            Search
          </Button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory('all')
                setCurrentPage(1)
              }}
            >
              All Categories
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
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedTag === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedTag('all')
                setCurrentPage(1)
              }}
            >
              All Tags
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
              >
                {tag.name}
              </Button>
            ))}
          </div>

          {/* Reset Filters */}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Posts Grid */}
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
          <h3 className="text-xl font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedTag !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No blog posts have been published yet.'}
          </p>
          <Button onClick={resetFilters} variant="outline">
            Clear Filters
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
                  {post.excerpt || 'No excerpt available'}
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
                    {post.reading_time || estimateReadingTime(post.excerpt || '')} min read
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {post.view_count || 0} views
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count || 0} comments
                  </div>
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <Button className="w-full">
                    Read More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
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
                    >
                      {page}
                    </Button>
                  </div>
                )
              })}
          </div>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        Showing {posts.length} of {totalPosts} posts
        {(searchTerm || selectedCategory !== 'all' || selectedTag !== 'all') && (
          <span> (filtered)</span>
        )}
      </div>

      {/* Newsletter CTA */}
      <div className="bg-muted rounded-lg p-8 mt-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
        <p className="text-muted-foreground mb-6">
          Get the latest posts and productivity insights delivered to your inbox.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button>Subscribe</Button>
        </div>
      </div>
    </div>
  )
}