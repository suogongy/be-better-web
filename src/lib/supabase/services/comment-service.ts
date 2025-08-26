import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'

import type { Comment } from '@/types/database'

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
      let query = supabase
        .from('comments')
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
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_id', parentId)
      .eq('status', status)
      .order('created_at', { ascending: true })

    if (error) {
      throw new DatabaseError('Failed to fetch comment replies', error)
    }

    return data || []
  },

  async createComment(comment: {
    post_id: string
    parent_id?: string
    author_name: string
    author_email: string
    author_website?: string
    content: string
    ip_address?: string
    user_agent?: string
  }): Promise<Comment> {
    // Basic spam detection
    const isSpam = this.detectSpam(comment)
    const status = isSpam ? 'spam' : 'pending'

    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...comment,
        status,
      } as any)
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
    const { data, error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update comment status', error)
    }

    return data
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
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
    let query = supabase
      .from('comments')
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
    let query = supabase
      .from('comments')
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

    data?.forEach((comment: any) => {
      stats[comment.status as keyof typeof stats]++
    })

    return stats
  },

  // Basic spam detection logic
  detectSpam(comment: {
    author_name: string
    author_email: string
    content: string
    author_website?: string
  }): boolean {
    const { content, author_name, author_email, author_website } = comment

    // Basic spam indicators
    const spamKeywords = [
      'viagra', 'casino', 'poker', 'loan', 'mortgage', 'credit',
      'free money', 'click here', 'buy now', 'limited time',
      'make money', 'work from home', 'earn cash'
    ]

    const contentLower = content.toLowerCase()
    const nameLower = author_name.toLowerCase()
    const emailLower = author_email.toLowerCase()
    const websiteLower = author_website?.toLowerCase() || ''

    // Check for spam keywords
    const hasSpamKeywords = spamKeywords.some(keyword => 
      contentLower.includes(keyword) || 
      nameLower.includes(keyword) ||
      websiteLower.includes(keyword)
    )

    // Check for excessive URLs
    const urlCount = (content.match(/https?:\/\//g) || []).length
    const hasExcessiveUrls = urlCount > 2

    // Check for suspicious patterns
    const hasSuspiciousEmail = emailLower.includes('temp') || 
                              emailLower.includes('throwaway') ||
                              emailLower.includes('spam')

    // Check content quality
    const isVeryShort = content.trim().length < 10
    const isAllCaps = content === content.toUpperCase() && content.length > 20
    const hasExcessivePunctuation = (content.match(/[!?]{3,}/g) || []).length > 0

    return hasSpamKeywords || 
           hasExcessiveUrls || 
           hasSuspiciousEmail || 
           isVeryShort || 
           isAllCaps || 
           hasExcessivePunctuation
  },

  /**
   * 检查内容是否为垃圾信息
   * @param content 评论内容
   * @param authorName 作者姓名
   * @param authorEmail 作者邮箱
   * @returns 是否为垃圾信息
   */
  isSpam(content: string, authorName: string, authorEmail: string): boolean {
    // Check for spam keywords
    const spamKeywords = ['viagra', 'casino', 'lottery', 'win money', '投资', '赚钱', '赌博']
    const contentLower = content.toLowerCase()
    const nameLower = authorName.toLowerCase()
    const emailLower = authorEmail.toLowerCase()
    const hasSpamKeywords = spamKeywords.some(keyword => 
      contentLower.includes(keyword) || 
      nameLower.includes(keyword) || 
      emailLower.includes(keyword)
    )

    // Check for excessive URLs
    const urlCount = (content.match(/https?:\/\//g) || []).length
    const hasExcessiveUrls = urlCount > 3

    // Check for suspicious email patterns
    const suspiciousEmails = ['noreply', 'no-reply', 'admin']
    const hasSuspiciousEmail = suspiciousEmails.some(pattern => emailLower.includes(pattern)) ||
                               emailLower.includes('spam')

    // Check content quality
    const isVeryShort = content.trim().length < 10
    const isAllCaps = content === content.toUpperCase() && content.length > 20
    const hasExcessivePunctuation = (content.match(/[!?]{3,}/g) || []).length > 0

    return hasSpamKeywords || 
           hasExcessiveUrls || 
           hasSuspiciousEmail || 
           isVeryShort || 
           isAllCaps || 
           hasExcessivePunctuation
  },

  /**
   * 获取文章的评论数量
   * @param postId 文章ID
   * @returns 评论数量
   */
  async getCommentCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .eq('status', 'approved')

    if (error) {
      throw new DatabaseError('Failed to fetch comment count', error)
    }

    return count || 0
  }
}