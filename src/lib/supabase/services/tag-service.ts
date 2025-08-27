import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'

import type { Tag, TagInsert, TagUpdate } from '@/types/database'

// Tag operations
export const tagService = {
  async getTags(): Promise<Tag[]> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch tags', error)
    }

    return data || []
  },

  async createTag(tag: TagInsert): Promise<Tag> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create tag', error)
    }

    return data
  },

  async updateTag(id: string, updates: TagUpdate): Promise<Tag> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
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
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete tag', error)
    }
  },
}