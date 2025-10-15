import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'

import type { Comment, CommentInsert, CommentUpdate } from '@/types/database'

// Comment operations
export const commentService = {
  /**
   * 获取文章评论
   * @param postId 文章ID
   * @param options 查询选项
   * @returns 评论列表
   */
  async getComments(postId: string, options?: {
    status?: 'pending' | 'approved' | 'spam' | 'rejected'
    includeReplies?: boolean
  }): Promise<Comment[]> {
    try {
      if (!supabase) throw new DatabaseError('Supabase client is not initialized')
      
      let query = supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)

      if (options?.status) {
        query = query.eq('status', options.status)
      } else {
        // 默认只显示已批准的评论
        query = query.eq('status', 'approved')
      }

      if (!options?.includeReplies) {
        query = query.is('parent_id', null)
      }

      query = query.order('created_at', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Database error in getComments:', error)
        throw new DatabaseError('Failed to fetch comments', error)
      }

      return data || []
    } catch (error) {
      console.error('Exception in getComments:', error)
      throw error
    }
  },

  async getCommentReplies(parentId: string, status: string = 'approved'): Promise<Comment[]> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')

    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('parent_id', parentId)
      .eq('status', status)
      .order('created_at', { ascending: true })

    if (error) {
      throw new DatabaseError('Failed to fetch comment replies', error)
    }

    return data || []
  },

  async createComment(comment: CommentInsert): Promise<Comment> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')

    // Basic spam detection
    const isSpam = this.detectSpam(comment)
    const status = isSpam ? 'spam' : 'pending'

    // Add status to the comment data before insertion
    const commentWithStatus = {
      ...comment,
      status
    }

    const { data, error } = await supabase
      .from('blog_comments')
      .insert(commentWithStatus)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create comment', error)
    }

    return data
  },

  async updateCommentStatus(
    id: string, 
    status: 'pending' | 'approved' | 'spam' | 'rejected'
  ): Promise<Comment> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('blog_comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update comment status', error)
    }

    return data
  },

  async updateComment(id: string, updates: CommentUpdate): Promise<Comment> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('blog_comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update comment', error)
    }

    return data
  },

  async deleteComment(id: string): Promise<void> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete comment', error)
    }
  },

  async getCommentsForModeration(options?: {
    status?: 'pending' | 'spam'
    limit?: number
    offset?: number
  }): Promise<{ data: Comment[]; total: number }> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    let query = supabase
      .from('blog_comments')
      .select('*', { count: 'exact' })

    if (options?.status) {
      query = query.eq('status', options.status)
    } else {
      query = query.in('status', ['pending', 'spam'])
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      const offset = options?.offset || 0
      query = query.range(offset, offset + options.limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch comments for moderation', error)
    }

    return {
      data: data || [],
      total: count || 0
    }
  },

  async getCommentStats(postId?: string): Promise<{
    total: number
    approved: number
    pending: number
    spam: number
    rejected: number
  }> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    let query = supabase
      .from('blog_comments')
      .select('status')

    if (postId) {
      query = query.eq('post_id', postId)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch comment statistics', error)
    }

    const stats = {
      total: data?.length || 0,
      approved: 0,
      pending: 0,
      spam: 0,
      rejected: 0,
    }

    data?.forEach((comment: { status: string }) => {
      const statusKey = comment.status as keyof typeof stats
      if (statusKey in stats) {
        stats[statusKey]++
      }
    })

    return stats
  },

  // Helper function to detect spam (simplified)
  detectSpam(comment: Partial<CommentInsert>): boolean {
    const spamKeywords = ['viagra', 'casino', 'lottery', 'money']
    const content = comment.content?.toLowerCase() || ''
    const name = comment.author_name?.toLowerCase() || ''
    const email = comment.author_email?.toLowerCase() || ''
    const website = comment.author_website?.toLowerCase() || ''

    return spamKeywords.some(keyword => 
      content.includes(keyword) || 
      name.includes(keyword) || 
      email.includes(keyword) || 
      website.includes(keyword)
    )
  },

  /**
   * 获取文章的评论数量
   * @param postId 文章ID
   * @returns 评论数量
   */
  async getCommentCount(postId: string): Promise<number> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { count, error } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .eq('status', 'approved')

    if (error) {
      throw new DatabaseError('Failed to fetch comment count', error)
    }

    return count || 0
  }
}