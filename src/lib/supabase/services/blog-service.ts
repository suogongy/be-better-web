import { createClient } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import { Post } from '@/types/database'
import { categoryTagCache } from '@/lib/cache/category-tag-cache'

export class BlogService {
  /**
   * 获取博客列表（优化版，减少请求数量）
   */
  static async getBlogList(options: {
    page?: number
    limit?: number
    categoryId?: string
    tagId?: string
    search?: string
    status?: 'draft' | 'published' | 'archived'
    userId?: string
  } = {}) {
    // 使用新的优化查询方法
    return this.getBlogListOptimized(options)
  }

  /**
   * 优化查询版本 - 使用批量查询减少请求数
   */
  static async getBlogListSimple(options: {
    page?: number
    limit?: number
    categoryId?: string
    tagId?: string
    search?: string
    status?: 'draft' | 'published' | 'archived'
    userId?: string
  } = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      tagId,
      search,
      status = 'published',
      userId
    } = options

    const supabase = createClient()
    const offset = (page - 1) * limit

    try {
      // 先应用分类和标签过滤（如果需要）
      let filteredPostIds: string[] = []
      
      if (categoryId || tagId) {
        // 获取符合过滤条件的文章ID
        if (categoryId) {
          const { data: categoryPosts } = await supabase
            .from('post_categories')
            .select('post_id')
            .eq('category_id', categoryId)
          
          filteredPostIds = categoryPosts?.map(p => p.post_id) || []
        }
        
        if (tagId) {
          const { data: tagPosts } = await supabase
            .from('post_tags')
            .select('post_id')
            .eq('tag_id', tagId)
          
          const tagPostIds = tagPosts?.map(p => p.post_id) || []
          filteredPostIds = categoryId 
            ? filteredPostIds.filter(id => tagPostIds.includes(id))
            : tagPostIds
        }
      }

      // 获取文章基本信息
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })

      if (status) query = query.eq('status', status)
      // 移除了用户过滤，现在是单用户系统
      if (search) {
        const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
        query = query.or(`title.ilike.%${escapedSearch}%,content.ilike.%${escapedSearch}%,excerpt.ilike.%${escapedSearch}%`)
      }
      
      // 如果有过滤条件，应用它们
      if (filteredPostIds.length > 0) {
        query = query.in('id', filteredPostIds)
      }

      const { data: posts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // 如果没有文章，直接返回
      if (!posts || posts.length === 0) {
        return {
          data: [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }

      // 只有在有文章时才获取关联数据
      const postIds = posts.map(p => p.id)
      
      // 单次批量获取所有关联数据
      const [
        categoriesData,
        tagsData
      ] = await Promise.all([
        // 获取所有文章的分类
        supabase
          .from('post_categories')
          .select('post_id, category_id, categories(id, name, color)')
          .in('post_id', postIds),
        
        // 获取所有文章的标签
        supabase
          .from('post_tags')
          .select('post_id, tag_id, tags(id, name)')
          .in('post_id', postIds)
      ])
      
      // 单独获取评论数
      const { data: commentsData } = await supabase
        .from('blog_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('status', 'approved')
      
      // 聚合每篇文章的评论数
      const commentCounts: Record<string, number> = {}
      commentsData?.forEach(item => {
        commentCounts[item.post_id] = (commentCounts[item.post_id] || 0) + 1
      })

      // 处理数据
      const postsWithRelations = posts.map(post => {
        const postCategories = categoriesData.data
          ?.filter(item => item.post_id === post.id)
          .map(item => item.categories) || []
          
        const postTags = tagsData.data
          ?.filter(item => item.post_id === post.id)
          .map(item => item.tags) || []

        return {
          ...post,
          categories: postCategories,
          tags: postTags,
          comment_count: commentCounts[post.id] || 0
        }
      })

      return {
        data: postsWithRelations,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      throw new DatabaseError('Failed to fetch blog list', error as Error)
    }
  }

  /**
   * 获取分类和标签的统计数据（优化版，使用聚合查询）
   */
  static async getCategoryAndTagStats() {
    const supabase = createClient()

    try {
      // 使用聚合查询一次性获取所有统计数据
      const [categoryCounts, tagCounts] = await Promise.all([
        // 获取所有分类的文章数
        supabase
          .from('post_categories')
          .select('category_id, count', { count: 'exact' })
          .then(({ data }) => {
            // 聚合每个分类的文章数
            const counts: Record<string, number> = {}
            data?.forEach(item => {
              counts[item.category_id] = (counts[item.category_id] || 0) + 1
            })
            return counts
          }),
        
        // 获取所有标签的文章数
        supabase
          .from('post_tags')
          .select('tag_id, count', { count: 'exact' })
          .then(({ data }) => {
            // 聚合每个标签的文章数
            const counts: Record<string, number> = {}
            data?.forEach(item => {
              counts[item.tag_id] = (counts[item.tag_id] || 0) + 1
            })
            return counts
          })
      ])

      // 并行获取分类和标签基本信息
      const [categoriesData, tagsData] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('name'),
        
        supabase
          .from('tags')
          .select('*')
          .order('name')
      ])

      // 组合数据
      const categoriesWithCount = (categoriesData.data || []).map(category => ({
        ...category,
        post_count: categoryCounts[category.id] || 0
      }))

      const tagsWithCount = (tagsData.data || []).map(tag => ({
        ...tag,
        post_count: tagCounts[tag.id] || 0
      }))

      return {
        categories: categoriesWithCount,
        tags: tagsWithCount
      }
    } catch (error) {
      console.error('Failed to fetch category and tag stats:', error)
      // 如果查询失败，回退到简单查询
      return this.getCategoryAndTagStatsSimple()
    }
  }

  /**
   * 简化版本的统计查询（备用方案）
   */
  static async getCategoryAndTagStatsSimple() {
    const supabase = createClient()

    try {
      // 使用单个查询获取所有统计数据
      const [categoriesWithPosts, tagsWithPosts] = await Promise.all([
        // 获取有文章的分类及其计数
        supabase
          .from('categories')
          .select(`
            *,
            post_categories(count)
          `)
          .order('name'),
        
        // 获取有文章的标签及其计数
        supabase
          .from('tags')
          .select(`
            *,
            post_tags(count)
          `)
          .order('name')
      ])

      return {
        categories: (categoriesWithPosts.data || []).map(cat => ({
          ...cat,
          post_count: cat.post_categories?.[0]?.count || 0
        })),
        tags: (tagsWithPosts.data || []).map(tag => ({
          ...tag,
          post_count: tag.post_tags?.[0]?.count || 0
        }))
      }
    } catch (error) {
      console.error('Simple stats query also failed:', error)
      return {
        categories: [],
        tags: []
      }
    }
  }

  /**
   * 优化查询版本 - 使用单表查询和本地缓存
   */
  static async getBlogListOptimized(options: {
    page?: number
    limit?: number
    categoryId?: string
    tagId?: string
    search?: string
    status?: 'draft' | 'published' | 'archived'
    userId?: string
  } = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      tagId,
      search,
      status = 'published',
      userId
    } = options

    const supabase = createClient()
    const offset = (page - 1) * limit

    try {
      // 确保缓存已初始化
      if (!categoryTagCache['isInitialized']) {
        await categoryTagCache.initialize()
      }

      // 构建查询 - 单表查询 posts
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })

      // 应用状态过滤
      if (status) query = query.eq('status', status)

      // 应用搜索过滤
      if (search) {
        const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
        query = query.or(`title.ilike.%${escapedSearch}%,content.ilike.%${escapedSearch}%,excerpt.ilike.%${escapedSearch}%`)
      }

      // 使用新的数组字段进行分类和标签过滤
      if (categoryId) {
        query = query.contains('category_ids', [categoryId])
      }
      
      if (tagId) {
        query = query.contains('tag_ids', [tagId])
      }

      // 执行查询
      const { data: posts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // 如果没有文章，直接返回
      if (!posts || posts.length === 0) {
        return {
          data: [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }

      // 获取评论数
      const postIds = posts.map(p => p.id)
      const { data: commentsData } = await supabase
        .from('blog_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('status', 'approved')
      
      // 聚合每篇文章的评论数
      const commentCounts: Record<string, number> = {}
      commentsData?.forEach(item => {
        commentCounts[item.post_id] = (commentCounts[item.post_id] || 0) + 1
      })

      // 使用本地缓存组装分类和标签信息
      const postsWithRelations = posts.map(post => {
        const categories = post.category_ids 
          ? categoryTagCache.getCategoriesByIds(post.category_ids)
          : []
          
        const tags = post.tag_ids
          ? categoryTagCache.getTagsByIds(post.tag_ids)
          : []

        return {
          ...post,
          categories,
          tags,
          comment_count: commentCounts[post.id] || 0
        }
      })

      return {
        data: postsWithRelations,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Optimized query failed, falling back to simple query:', error)
      // 如果新查询失败，回退到原来的方法
      return this.getBlogListSimple(options)
    }
  }
}