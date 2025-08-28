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
   * 获取文章列表
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
   * @returns 创建的文章
   */
  async createPost(data: PostInsert): Promise<Post> {
    try {
      const supabase = getClient()
      const { data: post, error } = await supabase
        .from('posts')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to create post', error)
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
   * @returns 更新后的文章
   */
  async updatePost(id: string, data: PostUpdate): Promise<Post> {
    try {
      const supabase = getClient()
      const { data: post, error } = await supabase
        .from('posts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to update post', error)
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
        throw new DatabaseError('Failed to fetch post for view count increment', fetchError)
      }
      
      // 更新浏览量
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          view_count: (post as { view_count: number }).view_count + 1
        })
        .eq('id', id)
        
      if (updateError) {
        throw new DatabaseError('Failed to increment view count', updateError)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to increment view count', error as Error)
    }
  }
}