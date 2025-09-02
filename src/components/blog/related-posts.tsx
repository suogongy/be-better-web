'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface RelatedPost {
  id: string
  title: string
  excerpt: string
  slug: string
  featured_image?: string
  published_at: string
  categories?: Array<{
    name: string
    color?: string
  }>
  tags?: Array<{
    name: string
  }>
  similarity_score: number
}

interface RelatedPostsProps {
  currentPostId: string
  currentPostCategories?: string[]
  currentPostTags?: string[]
  currentPostContent?: string
  userId?: string
  maxPosts?: number
  className?: string
}

/**
 * 相关文章推荐组件
 * 基于分类、标签和内容相似度推荐相关文章
 */
export function RelatedPosts({
  currentPostId,
  currentPostCategories = [],
  currentPostTags = [],
  currentPostContent = '',
  userId,
  maxPosts = 3,
  className
}: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)

  // 计算内容相似度（简化版）
  const calculateContentSimilarity = (content1: string, content2: string): number => {
    const words1 = content1.toLowerCase().split(/\s+/)
    const words2 = content2.toLowerCase().split(/\s+/)
    
    const wordSet1 = new Set(words1)
    const wordSet2 = new Set(words2)
    
    const intersection = new Set([...wordSet1].filter(x => wordSet2.has(x)))
    const union = new Set([...wordSet1, ...wordSet2])
    
    return intersection.size / union.size // Jaccard 相似度
  }

  // 模拟获取相关文章（实际项目中应该从API获取）
  const fetchRelatedPosts = async () => {
    setLoading(true)
    
    try {
      // 这里应该是API调用，暂时使用模拟数据
      const mockPosts: RelatedPost[] = [
        {
          id: '1',
          title: '提高生产力的10个技巧',
          excerpt: '分享10个经过验证的技巧，帮助您提高日常工作效率...',
          slug: '10-tips-for-productivity',
          featured_image: '/api/placeholder/300/200',
          published_at: '2024-01-15',
          categories: [{ name: 'Productivity', color: '#3B82F6' }],
          tags: [{ name: 'productivity' }, { name: 'tips' }],
          similarity_score: 0.85
        },
        {
          id: '2',
          title: '如何建立有效的日常习惯',
          excerpt: '了解习惯形成的科学原理，建立持久的日常习惯...',
          slug: 'build-effective-daily-habits',
          published_at: '2024-01-10',
          categories: [{ name: 'Personal', color: '#10B981' }],
          tags: [{ name: 'habits' }, { name: 'personal-growth' }],
          similarity_score: 0.72
        },
        {
          id: '3',
          title: '时间管理：从混乱到有序',
          excerpt: '掌握时间管理的核心原则，让生活更有条理...',
          slug: 'time-management-chaos-to-order',
          published_at: '2024-01-05',
          categories: [{ name: 'Productivity', color: '#3B82F6' }],
          tags: [{ name: 'time-management' }, { name: 'organization' }],
          similarity_score: 0.68
        }
      ]
      
      // 按相似度排序
      mockPosts.sort((a, b) => b.similarity_score - a.similarity_score)
      
      setRelatedPosts(mockPosts.slice(0, maxPosts))
    } catch (error) {
      console.error('获取相关文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRelatedPosts()
  }, [currentPostId, currentPostCategories, currentPostTags])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            相关文章
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(maxPosts)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          相关文章
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relatedPosts.map((post) => (
            <div key={post.id} className="group">
              <Link 
                href={userId ? `/user/${userId}/blog/${post.id}` : `/blog/${post.slug}`}
                className="block"
              >
                <div className="flex gap-4">
                  {post.featured_image && (
                    <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        width={96}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {post.categories?.slice(0, 1).map((category) => (
                        <Badge 
                          key={category.name}
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${category.color}20`,
                            color: category.color 
                          }}
                          className="text-xs"
                        >
                          {category.name}
                        </Badge>
                      ))}
                      {post.similarity_score > 0.8 && (
                        <Badge variant="outline" className="text-xs">
                          高度相关
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button variant="outline" asChild className="w-full">
              <Link href="/blog">
                查看更多文章
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}