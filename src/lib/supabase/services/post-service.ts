import { createClient, createAdminClient } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import { Post, PostInsert, PostUpdate } from '@/types/database'

// 获取客户端实例
const getClient = () => {
  // 在服务端优先使用管理员客户端
  if (typeof window === 'undefined') {
    const adminClient = createAdminClient()
    if (adminClient) {
      return adminClient
    }
  }
  
  // 否则使用普通客户端
  return createClient()
}

// Post operations
export const postService = {
  /**
   * 根据ID获取文章详情
   * @param id 文章ID
   * @returns 文章详情或null
   */
  async getPost(id: string): Promise<Post | null> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError('Failed to fetch post', error)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch post', error as Error)
    }
  },

  /**
   * 获取文章列表（优化版）
   * @param options 查询选项
   * @returns 文章列表和总数
   */
  async getPosts(options: {
    page?: number
    limit?: number
    categoryId?: string
    tagId?: string
    search?: string
    status?: 'draft' | 'published' | 'archived'
    userId?: string
  } = {}) {
    return this.getPostsWithOptimizedQuery(options)
  },

  /**
   * 使用优化的查询获取文章列表
   */
  async getPostsWithOptimizedQuery(options: {
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
      status,
      userId
    } = options

    try {
      const supabase = getClient()
      
      // 构建基础查询
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)

      // 应用过滤条件
      if (status) {
        query = query.eq('status', status)
      }
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (search) {
        // 使用 ILIKE 搜索（对中文更友好）
        query = query.or(`
          title.ilike.%${search}%,
          content.ilike.%${search}%,
          excerpt.ilike.%${search}%
        `)
      }

      // 排序
      query = query.order('created_at', { ascending: false })

      const { data: postsData, error, count } = await query

      if (error) {
        throw new DatabaseError('Failed to fetch posts', error)
      }

      // 如果需要按分类或标签过滤，则在应用层进行过滤
      let filteredData = postsData || []
      
      // 根据分类ID过滤（使用 EXISTS 子查询优化）
      if (categoryId) {
        const { data: postIdsInCategory } = await supabase
          .from('post_categories')
          .select('post_id')
          .eq('category_id', categoryId)
        
        const postIds = postIdsInCategory?.map(p => p.post_id) || []
        filteredData = filteredData.filter((post: Post) => postIds.includes(post.id))
      }
      
      // 根据标签ID过滤
      if (tagId) {
        const { data: postIdsWithTag } = await supabase
          .from('post_tags')
          .select('post_id')
          .eq('tag_id', tagId)
        
        const postIds = postIdsWithTag?.map(p => p.post_id) || []
        filteredData = filteredData.filter((post: Post) => postIds.includes(post.id))
      }

      return {
        data: filteredData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch posts', error as Error)
    }
  },

  /**
   * 获取文章列表（回退方法）
   */
  async getPostsFallback(options: {
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
      status,
      userId
    } = options

    try {
      const supabase = getClient()
      
      // 构建基础查询
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)

      // 应用过滤条件
      if (status) {
        query = query.eq('status', status)
      }
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      // 排序
      query = query.order('created_at', { ascending: false })

      const { data: postsData, error, count } = await query

      if (error) {
        throw new DatabaseError('Failed to fetch posts', error)
      }

      // 如果需要按分类或标签过滤，则在应用层进行过滤
      let filteredData = postsData || []
      
      // 根据分类ID过滤
      if (categoryId) {
        const { data: postCategories, error: postCategoriesError } = await supabase
          .from('post_categories')
          .select('post_id')
          .eq('category_id', categoryId)
        
        if (postCategoriesError) {
          throw new DatabaseError('Failed to fetch post categories', postCategoriesError)
        }
        
        const postIdsInCategory = postCategories.map((pc: { post_id: string }) => pc.post_id)
        filteredData = filteredData.filter((post: Post) => postIdsInCategory.includes(post.id))
      }
      
      // 根据标签ID过滤
      if (tagId) {
        const { data: postTags, error: postTagsError } = await supabase
          .from('post_tags')
          .select('post_id')
          .eq('tag_id', tagId)
        
        if (postTagsError) {
          throw new DatabaseError('Failed to fetch post tags', postTagsError)
        }
        
        const postIdsWithTag = postTags.map((pt: { post_id: string }) => pt.post_id)
        filteredData = filteredData.filter((post: Post) => postIdsWithTag.includes(post.id))
      }

      return {
        data: filteredData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch posts', error as Error)
    }
  },

  /**
   * 获取文章关联的分类ID列表
   * @param postId 文章ID
   * @returns 分类ID列表
   */
  async getPostCategories(postId: string): Promise<string[]> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('post_categories')
        .select('category_id')
        .eq('post_id', postId)

      if (error) {
        throw new DatabaseError('Failed to fetch post categories', error)
      }

      return data.map((item: { category_id: string }) => item.category_id)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch post categories', error as Error)
    }
  },

  /**
   * 获取文章关联的标签ID列表
   * @param postId 文章ID
   * @returns 标签ID列表
   */
  async getPostTags(postId: string): Promise<string[]> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', postId)

      if (error) {
        throw new DatabaseError('Failed to fetch post tags', error)
      }

      return data.map((item: { tag_id: string }) => item.tag_id)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch post tags', error as Error)
    }
  },

  /**
   * 创建文章
   * @param data 文章数据
   * @param categoryIds 分类ID列表（可选）
   * @param tagIds 标签ID列表（可选）
   * @returns 创建的文章
   */
  async createPost(data: PostInsert, categoryIds?: string[], tagIds?: string[]): Promise<Post> {
    try {
      const supabase = getClient()
      
      // 准备包含 category_ids 和 tag_ids 的数据
      const postData = {
        ...data,
        category_ids: categoryIds || [],
        tag_ids: tagIds || []
      }
      
      const { data: post, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single()

      if (error) {
        console.error('创建文章失败，数据:', postData)
        console.error('数据库错误:', error)
        throw new DatabaseError('Failed to create post', error)
      }

      // 同时维护关系表以确保向后兼容
      if (categoryIds && categoryIds.length > 0) {
        await this.updatePostCategories(post.id, categoryIds)
      }
      
      if (tagIds && tagIds.length > 0) {
        await this.updatePostTags(post.id, tagIds)
      }

      return post as Post
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create post', error as Error)
    }
  },

  /**
   * 更新文章
   * @param id 文章ID
   * @param data 更新数据
   * @param categoryIds 分类ID列表（可选）
   * @param tagIds 标签ID列表（可选）
   * @returns 更新后的文章
   */
  async updatePost(id: string, data: PostUpdate, categoryIds?: string[], tagIds?: string[]): Promise<Post> {
    try {
      const supabase = getClient()
      
      // 准备更新数据，包含 category_ids 和 tag_ids
      const updateData = {
        ...data,
        ...(categoryIds !== undefined && { category_ids: categoryIds }),
        ...(tagIds !== undefined && { tag_ids: tagIds })
      }
      
      const { data: post, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to update post', error)
      }

      // 同时维护关系表以确保向后兼容
      if (categoryIds !== undefined) {
        await this.updatePostCategories(id, categoryIds)
      }
      
      if (tagIds !== undefined) {
        await this.updatePostTags(id, tagIds)
      }

      return post as Post
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update post', error as Error)
    }
  },

  /**
   * 更新文章的分类关联
   * @param postId 文章ID
   * @param categoryIds 分类ID列表
   */
  async updatePostCategories(postId: string, categoryIds: string[]): Promise<void> {
    try {
      const supabase = getClient()
      
      // 先删除所有现有的分类关联
      const { error: deleteError } = await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', postId)
      
      if (deleteError) {
        console.warn('删除现有分类关联时出错（可能是表不存在）:', deleteError)
        // 如果表不存在，我们跳过关系表的更新，只使用数组字段
        return
      }
      
      // 然后添加新的分类关联
      if (categoryIds.length > 0) {
        const postCategories = categoryIds.map(categoryId => ({
          post_id: postId,
          category_id: categoryId
        }))
        
        const { error } = await supabase
          .from('post_categories')
          .insert(postCategories)
          
        if (error) {
          console.warn('插入分类关联时出错（可能是表不存在）:', error)
          // 如果表不存在，我们跳过关系表的更新，只使用数组字段
          return
        }
      }
    } catch (error) {
      console.warn('更新文章分类关联时出错:', error)
      // 不抛出错误，因为数组字段已经更新了
    }
  },

  /**
   * 更新文章的标签关联
   * @param postId 文章ID
   * @param tagIds 标签ID列表
   */
  async updatePostTags(postId: string, tagIds: string[]): Promise<void> {
    try {
      const supabase = getClient()
      
      // 先删除所有现有的标签关联
      const { error: deleteError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId)
      
      if (deleteError) {
        console.warn('删除现有标签关联时出错（可能是表不存在）:', deleteError)
        // 如果表不存在，我们跳过关系表的更新，只使用数组字段
        return
      }
      
      // 然后添加新的标签关联
      if (tagIds.length > 0) {
        const postTags = tagIds.map(tagId => ({
          post_id: postId,
          tag_id: tagId
        }))
        
        const { error } = await supabase
          .from('post_tags')
          .insert(postTags)
          
        if (error) {
          console.warn('插入标签关联时出错（可能是表不存在）:', error)
          // 如果表不存在，我们跳过关系表的更新，只使用数组字段
          return
        }
      }
    } catch (error) {
      console.warn('更新文章标签关联时出错:', error)
      // 不抛出错误，因为数组字段已经更新了
    }
  },

  /**
   * 删除文章
   * @param id 文章ID
   */
  async deletePost(id: string): Promise<void> {
    try {
      const supabase = getClient()
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to delete post', error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to delete post', error as Error)
    }
  },

  /**
   * 批量获取文章及其关联数据（优化性能）
   * @param postIds 文章ID列表
   * @returns 带有关联数据的文章列表
   */
  async getPostsWithRelations(postIds: string[]): Promise<any[]> {
    if (postIds.length === 0) return []

    try {
      const supabase = getClient()
      
      // 并行获取所有关联数据
      const [postsData, categoriesData, tagsData, commentCounts] = await Promise.all([
        // 获取文章基本信息
        supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false }),
        
        // 获取所有文章的分类
        supabase
          .from('post_categories')
          .select(`
            post_id,
            categories (
              id,
              name,
              color
            )
          `)
          .in('post_id', postIds),
        
        // 获取所有文章的标签
        supabase
          .from('post_tags')
          .select(`
            post_id,
            tags (
              id,
              name
            )
          `)
          .in('post_id', postIds),
        
        // 获取所有文章的评论数
        supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds)
          .eq('status', 'approved')
      ])

      // 处理分类数据
      const postCategoriesMap = new Map<string, any[]>()
      categoriesData.data?.forEach(item => {
        if (!postCategoriesMap.has(item.post_id)) {
          postCategoriesMap.set(item.post_id, [])
        }
        postCategoriesMap.get(item.post_id)?.push(item.categories)
      })

      // 处理标签数据
      const postTagsMap = new Map<string, any[]>()
      tagsData.data?.forEach(item => {
        if (!postTagsMap.has(item.post_id)) {
          postTagsMap.set(item.post_id, [])
        }
        postTagsMap.get(item.post_id)?.push(item.tags)
      })

      // 处理评论数
      const postCommentCounts = new Map<string, number>()
      commentCounts.data?.forEach(comment => {
        const count = postCommentCounts.get(comment.post_id) || 0
        postCommentCounts.set(comment.post_id, count + 1)
      })

      // 组装最终数据
      return (postsData.data || []).map(post => ({
        ...post,
        categories: postCategoriesMap.get(post.id) || [],
        tags: postTagsMap.get(post.id) || [],
        comment_count: postCommentCounts.get(post.id) || 0
      }))
    } catch (error) {
      console.error('Failed to fetch posts with relations:', error)
      return []
    }
  },

  /**
   * 增加文章浏览量
   * @param id 文章ID
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      const supabase = getClient()
      
      // 先获取当前浏览量
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', id)
        .single()
      
      if (fetchError) {
        console.error('Failed to fetch post for view count increment:', {
          error: fetchError.message || fetchError,
          postId: id
        })
        return
      }
      
      // 计算新的浏览量
      const currentViewCount = post?.view_count || 0
      
      // 更新浏览量
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          view_count:currentViewCount + 1
        })
        .eq('id', id)
        
      if (updateError) {
        console.error('Failed to increment view count:', {
          error: updateError.message || updateError,
          postId: id
        })
      }
    } catch (error) {
      console.error('Error in incrementViewCount:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        postId: id
      })
    }
  }
}