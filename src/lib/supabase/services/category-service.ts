import { createClient, createAdminClient } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import type { Category, CategoryInsert, CategoryUpdate } from '@/types/database'

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

// Category operations
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    return this.getAllCategories()
  },

  async getAllCategories(): Promise<{ data: Category[] }> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

      if (error) {
        throw new DatabaseError('Failed to fetch categories', error)
      }

      return { data: data || [] }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch categories', error as Error)
    }
  },

  async createCategory(category: CategoryInsert): Promise<Category> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

      if (error) {
        throw new DatabaseError('Failed to create category', error)
      }

      return data as Category
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create category', error as Error)
    }
  },

  async updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    try {
      const supabase = getClient()
      const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

      if (error) {
        throw new DatabaseError('Failed to update category', error)
      }

      return data as Category
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update category', error as Error)
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const supabase = getClient()
      const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to delete category', error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to delete category', error as Error)
    }
  },
}