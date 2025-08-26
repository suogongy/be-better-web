import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'

import type { Tag } from '@/types/database'

// Tag operations
export const tagService = {
  async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch tags', error)
    }

    return data || []
  },

  async createTag(tag: { name: string; slug: string }): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create tag', error)
    }

    return data
  },

  async updateTag(id: string, updates: any): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update tag', error)
    }

    return data
  },

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete tag', error)
    }
  },
}