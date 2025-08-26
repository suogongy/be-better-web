import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'

import type { Category } from '@/types/database'

// Category operations
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch categories', error)
    }

    return data || []
  },

  async createCategory(category: any): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create category', error)
    }

    return data
  },

  async updateCategory(id: string, updates: any): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update category', error)
    }

    return data
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete category', error)
    }
  },
}