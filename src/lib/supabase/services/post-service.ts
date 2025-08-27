import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'
import { Post } from '@/types/database'
import { userService } from './user-service'

// Post operations
export const postService = {

  async getPost(id: string): Promise<Post | null> {
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

    // 构建查询
    let query = supabase
      .from('posts')
      .select(`
        *,
        post_categories(category_id),
        post_tags(tag_id)
      `, { count: 'exact' })

    // 应用过滤条件
    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // 获取所有相关数据
    const { data: posts, error: postsError, count } = await query
    if (postsError) throw new DatabaseError('Failed to fetch posts', postsError)

    // 如果需要按分类或标签过滤
    let filteredPosts = posts || []
    if (categoryId || tagId) {
      let postIds: string[] = []
      
      if (categoryId) {
        // 获取该分类下的文章ID
        const { data: postCategoriesData, error: postCategoriesError } = await supabase
          .from('post_categories')
          .select('post_id')
          .eq('category_id', categoryId)
        
        if (postCategoriesError) throw new DatabaseError('Failed to fetch post categories', postCategoriesError)
        
        postIds = postCategoriesData?.map((pc: any) => pc.post_id) || []
        
        // 如果没有匹配的文章，直接返回空结果
        if (postIds && postIds.length === 0) {
          return { data: [], total: 0 }
        }
      }
      
      if (tagId && filteredPosts.length > 0) {
        // 获取该标签下的文章ID
        const { data: postTagsData, error: postTagsError } = await supabase
          .from('post_tags')
          .select('post_id')
          .eq('tag_id', tagId)
        
        if (postTagsError) throw new DatabaseError('Failed to fetch post tags', postTagsError)
        
        const tagPostIds = postTagsData?.map((pt: any) => pt.post_id) || []
        
        if (postIds.length > 0) {
          // 如果已经按分类过滤，取交集
          const intersection = postIds.filter(id => tagPostIds.includes(id))
          postIds.splice(0, postIds.length, ...intersection)
        } else {
          // 否则直接使用标签过滤结果
          postIds.push(...tagPostIds)
        }
        
        if (postIds.length === 0) {
          filteredPosts = []
        }
      }
      
      // 应用文章ID过滤
      if (postIds.length > 0) {
        filteredPosts = (posts || []).filter((post: any) => postIds.includes(post.id))
      }
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

    // 获取所有相关的分类和标签ID
    const postIds = paginatedPosts.map((post: any) => post.id)
    const { data: postCategories, error: postCategoriesError } = await supabase
      .from('post_categories')
      .select('post_id, category_id')
      .in('post_id', postIds)
    
    if (postCategoriesError) throw new DatabaseError('Failed to fetch post categories', postCategoriesError)

    const { data: postTags, error: postTagsError } = await supabase
      .from('post_tags')
      .select('post_id, tag_id')
      .in('post_id', postIds)
    
    if (postTagsError) throw new DatabaseError('Failed to fetch post tags', postTagsError)

    const categoryIds = postCategories?.map((pc: any) => pc.category_id) || []
    const tagIds = postTags?.map((pt: any) => pt.tag_id) || []

    // 获取分类和标签数据
    const [categories, tags] = await Promise.all([
      categoryIds.length > 0
        ? supabase.from('categories').select('*').in('id', categoryIds).then(res => res.data)
        : Promise.resolve([]),
      tagIds.length > 0
        ? supabase.from('tags').select('*').in('id', tagIds).then(res => res.data)
        : Promise.resolve([])
    ])

    // 组装数据
    const transformedData = paginatedPosts.map((post: any) => {
      const relatedCategoryIds = postCategories?.filter((pc: any) => pc.post_id === post.id).map((pc: any) => pc.category_id) || []
      const relatedTagIds = postTags?.filter((pt: any) => pt.post_id === post.id).map((pt: any) => pt.tag_id) || []
      
      const postCategories_data = categories?.filter((cat: any) => relatedCategoryIds.includes(cat.id)) || []
      const postTags_data = tags?.filter((tag: any) => relatedTagIds.includes(tag.id)) || []
      
      return {
        ...post,
        categories: postCategories_data,
        tags: postTags_data
      }
    })

    return {
      data: transformedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  },

  async getPostWithRelations(id: string): Promise<any | null> {
    // 首先获取基础post数据
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch post', error)
    }

    if (!post) return null

    // 手动获取关联的categories数据
    const { data: postCategories } = await supabase
      .from('post_categories')
      .select('category_id')
      .eq('post_id', post.id)

    // 手动获取关联的tags数据
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('tag_id')
      .eq('post_id', post.id)

    // 获取category详细信息
    const categoryIds = postCategories?.map((pc: { category_id: string }) => pc.category_id) || []
    const { data: categories } = categoryIds.length > 0 ? await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds) : { data: [] }

    // 获取tag详细信息
    const tagIds = postTags?.map((pt: { tag_id: string }) => pt.tag_id) || []
    const { data: tags } = tagIds.length > 0 ? await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds) : { data: [] }

    // 组合数据
    const transformedData = {
      ...post,
      categories: categories || [],
      tags: tags || [],
      category_ids: categoryIds,
      tag_ids: tagIds
    }

    return transformedData
  },

  async getPostBySlugWithRelations(slug: string): Promise<any | null> {
    // 首先获取基础post数据
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch post by slug', error)
    }

    if (!post) return null

    // 手动获取关联的categories数据
    const { data: postCategories } = await supabase
      .from('post_categories')
      .select('category_id')
      .eq('post_id', post.id)

    // 手动获取关联的tags数据
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('tag_id')
      .eq('post_id', post.id)

    // 获取category详细信息
    const categoryIds = postCategories?.map((pc: { category_id: string }) => pc.category_id) || []
    const { data: categories } = categoryIds.length > 0 ? await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds) : { data: [] }

    // 获取tag详细信息
    const tagIds = postTags?.map((pt: { tag_id: string }) => pt.tag_id) || []
    const { data: tags } = tagIds.length > 0 ? await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds) : { data: [] }

    // 组合数据
    const transformedData = {
      ...post,
      categories: categories || [],
      tags: tags || [],
      category_ids: categoryIds,
      tag_ids: tagIds
    }

    return transformedData
  },

  async getPostsWithFilters(options?: {
    page?: number
    limit?: number
    categoryId?: string
    tagId?: string
    search?: string
    status?: 'draft' | 'published' | 'archived'
    userId?: string
  }): Promise<{ data: any[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        categoryId,
        tagId,
        search,
        status,
        userId
      } = options || {}

      const offset = (page - 1) * limit

      // 如果需要按分类或标签过滤，先获取符合条件的文章ID
      let postIds: string[] | null = null
      if (categoryId || tagId) {
        // 获取满足分类条件的文章ID
        if (categoryId) {
          const { data: postCategoriesData, error: postCategoriesError } = await supabase
            .from('post_categories')
            .select('post_id')
            .eq('category_id', categoryId)
          
          if (postCategoriesError) {
            console.error('Error fetching post categories:', postCategoriesError)
            return { data: [], total: 0 }
          }
          
          postIds = postCategoriesData?.map((pc: any) => pc.post_id) || []
          
          // 如果没有匹配的文章，直接返回空结果
          if (postIds && postIds.length === 0) {
            return { data: [], total: 0 }
          }
        }
        
        // 获取满足标签条件的文章ID
        if (tagId) {
          const { data: postTagsData, error: postTagsError } = await supabase
            .from('post_tags')
            .select('post_id')
            .eq('tag_id', tagId)
          
          if (postTagsError) {
            console.error('Error fetching post tags:', postTagsError)
            return { data: [], total: 0 }
          }
          
          const tagPostIds = postTagsData?.map((pt: any) => pt.post_id) || []
          
          // 如果已经有分类过滤结果，取交集
          if (postIds && postIds.length > 0) {
            postIds = postIds.filter(id => tagPostIds.includes(id))
          } else {
            // 否则直接使用标签过滤结果
            postIds = tagPostIds
          }
          
          // 如果没有匹配的文章，直接返回空结果
          if (postIds && postIds.length === 0) {
            return { data: [], total: 0 }
          }
        }
      }

      // 构建posts查询
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })

      // 如果有过滤后的post_ids，只查询这些posts
      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds)
      }

      // 应用其他过滤条件
      if (status) {
        query = query.eq('status', status)
      }

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (search) {
        // 限制搜索词长度，防止过长的查询
        const searchTerm = search.slice(0, 100)
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`)
      }

      // 应用排序
      query = query.order('published_at', { ascending: false, nullsFirst: false })
      query = query.order('created_at', { ascending: false })

      // 应用分页
      query = query.range(offset, offset + limit - 1)

      const { data: posts, error, count } = await query

      if (error) {
        console.error('Error fetching posts:', error)
        throw new DatabaseError('Failed to fetch posts with filters', error)
      }

      if (!posts || posts.length === 0) {
        return { data: [], total: count || 0 }
      }

      // 简化版本：不加载关联数据，减少复杂性和API调用
      // 直接返回posts数据，避免过多的数据库查询导致loading问题
      const transformedData = posts.map((post: any) => ({
        ...post,
        categories: [], // 暂时为空，避免额外查询
        tags: [], // 暂时为空，避免额外查询
        category_ids: [],
        tag_ids: []
      }))

      return {
        data: transformedData,
        total: count || 0
      }
      
    } catch (error) {
      console.error('Error in getPostsWithFilters:', error)
      // 返回空结果而不是抛出错误，避免页面崩溃
      return { data: [], total: 0 }
    }
  },

  async createPost(post: any): Promise<Post> {
    // Validate user exists (manual foreign key check)
    if (post.user_id) {
      const userExists = await userService.validateUserExists(post.user_id)
      if (!userExists) {
        throw new DatabaseError('User does not exist', { code: 'USER_NOT_FOUND' })
      }
    }

    // Separate category_ids and tag_ids from post data
    const { category_ids, tag_ids, ...postData } = post
    
    // Create the post first
    const { data: createdPost, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()

    if (postError) {
      throw new DatabaseError('Failed to create post', postError)
    }

    // Handle category relationships
    if (category_ids && category_ids.length > 0) {
      // Validate categories exist
      for (const categoryId of category_ids) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('id', categoryId)
          .single()
        
        if (!category) {
          // Clean up the post if category validation fails
          await supabase.from('posts').delete().eq('id', createdPost.id)
          throw new DatabaseError(`Category ${categoryId} does not exist`, { code: 'CATEGORY_NOT_FOUND' })
        }
      }

      const categoryRelations = category_ids.map((categoryId: string) => ({
        post_id: createdPost.id,
        category_id: categoryId
      }))
      
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryRelations)
      
      if (categoryError) {
        // If category insertion fails, clean up the post
        await supabase.from('posts').delete().eq('id', createdPost.id)
        throw new DatabaseError('Failed to create post categories', categoryError)
      }
    }

    // Handle tag relationships
    if (tag_ids && tag_ids.length > 0) {
      // Validate tags exist
      for (const tagId of tag_ids) {
        const { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('id', tagId)
          .single()
        
        if (!tag) {
          // Clean up the post and categories if tag validation fails
          await supabase.from('post_categories').delete().eq('post_id', createdPost.id)
          await supabase.from('posts').delete().eq('id', createdPost.id)
          throw new DatabaseError(`Tag ${tagId} does not exist`, { code: 'TAG_NOT_FOUND' })
        }
      }

      const tagRelations = tag_ids.map((tagId: string) => ({
        post_id: createdPost.id,
        tag_id: tagId
      }))
      
      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(tagRelations)
      
      if (tagError) {
        // If tag insertion fails, clean up the post and categories
        await supabase.from('post_categories').delete().eq('post_id', createdPost.id)
        await supabase.from('posts').delete().eq('id', createdPost.id)
        throw new DatabaseError('Failed to create post tags', tagError)
      }
    }

    return createdPost
  },

  async updatePost(id: string, updates: any): Promise<Post> {
    // Separate category_ids and tag_ids from updates
    const { category_ids, tag_ids, ...postUpdates } = updates
    
    // Update the post data
    const { data: updatedPost, error: postError } = await supabase
      .from('posts')
      .update(postUpdates)
      .eq('id', id)
      .select()
      .single()

    if (postError) {
      throw new DatabaseError('Failed to update post', postError)
    }

    // Handle category relationships update
    if (category_ids !== undefined) {
      // Remove existing categories
      await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', id)
      
      // Add new categories
      if (category_ids.length > 0) {
        const categoryRelations = category_ids.map((categoryId: string) => ({
          post_id: id,
          category_id: categoryId
        }))
        
        const { error: categoryError } = await supabase
          .from('post_categories')
          .insert(categoryRelations)
        
        if (categoryError) {
          throw new DatabaseError('Failed to update post categories', categoryError)
        }
      }
    }

    // Handle tag relationships update
    if (tag_ids !== undefined) {
      // Remove existing tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id)
      
      // Add new tags
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId
        }))
        
        const { error: tagError } = await supabase
          .from('post_tags')
          .insert(tagRelations)
        
        if (tagError) {
          throw new DatabaseError('Failed to update post tags', tagError)
        }
      }
    }

    return updatedPost
  },

  async deletePost(id: string): Promise<void> {
    // Manual cascade deletion - handle relationships in application code
    try {
      // 1. Delete related data first (no foreign key constraints now)
      await Promise.all([
        supabase.from('post_categories').delete().eq('post_id', id),
        supabase.from('post_tags').delete().eq('post_id', id),
        supabase.from('comments').delete().eq('post_id', id)
      ])
      
      // 2. Update daily_summaries to remove references to this post
      await supabase
        .from('daily_summaries')
        .update({ generated_post_id: null })
        .eq('generated_post_id', id)
      
      // 3. Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to delete post', error)
      }
    } catch (error) {
      throw new DatabaseError('Failed to delete post and related data', error)
    }
  },

  async incrementViewCount(id: string): Promise<void> {
    // Simple increment - fetch current count, then update
    const { data: currentPost } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', id)
      .single()
    
    if (currentPost) {
      const { error } = await supabase
        .from('posts')
        .update({ view_count: (currentPost.view_count || 0) + 1 })
        .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to increment view count', error)
      }
    }
  },
}