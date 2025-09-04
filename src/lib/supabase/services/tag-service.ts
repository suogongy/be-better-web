import { createClient, createAdminClient } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import type { Tag, TagInsert, TagUpdate } from '@/types/database'

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

// Tag operations
export const tagService = {
  async getTags(): Promise<Tag[]> {
    return this.getAllTags()
  },

  async getAllTags(): Promise<{ data: Tag[] }> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

      if (error) {
        throw new DatabaseError('Failed to fetch tags', error)
      }

      return { data: data || [] }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch tags', error as Error)
    }
  },

  async createTag(tag: TagInsert): Promise<Tag> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()

      if (error) {
        throw new DatabaseError('Failed to create tag', error)
      }

      return data as Tag
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create tag', error as Error)
    }
  },

  async updateTag(id: string, updates: TagUpdate): Promise<Tag> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

      if (error) {
        throw new DatabaseError('Failed to update tag', error)
      }

      return data as Tag
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update tag', error as Error)
    }
  },

  async deleteTag(id: string): Promise<void> {
    try {
      const supabase = getClient()
      const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to delete tag', error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to delete tag', error as Error)
    }
  },
}