import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'

import type { Category, CategoryInsert, CategoryUpdate } from '@/types/database'

// Category operations
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch categories', error)
    }

    return data || []
  },

  async createCategory(category: CategoryInsert): Promise<Category> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create category', error)
    }

    return data
  },

  async updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
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
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete category', error)
    }
  },
}