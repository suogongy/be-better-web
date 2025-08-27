import { createClient, createAdminClient } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import { Post, PostInsert, PostUpdate } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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
      
      // 构建查询
      let query = supabase
        .from('posts')
        .select(`
          *,
          post_categories(category_id),
          post_tags(tag_id)
        `, { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)

      // 应用过滤条件
      if (status) {
        query = query.eq('status', status)
      }
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (categoryId) {
        query = query.contains('post_categories', [{ category_id: categoryId }])
      }
      
      if (tagId) {
        query = query.contains('post_tags', [{ tag_id: tagId }])
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      // 排序
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw new DatabaseError('Failed to fetch posts', error)
      }

      return {
        data: data,
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
   * 根据slug获取文章
   * @param slug 文章slug
   * @returns 文章详情或null
   */
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError('Failed to fetch post by slug', error)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch post by slug', error as Error)
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
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to create post', error)
      }

      return post
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

      return post
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