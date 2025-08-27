import { supabase } from '../client'
import { DatabaseError } from './database-error'
import type { User, UserInsert, UserUpdate } from '@/types/database'

// User operations
export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new DatabaseError('Failed to fetch user profile', error)
    }

    return data
  },

  async updateProfile(userId: string, updates: UserUpdate): Promise<User> {
    
    const { data, error } = await supabase!
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update user profile', error)
    }

    return data
  },

  async createProfile(user: UserInsert): Promise<User> {
    
    // Manual user creation without database triggers
    const userData: UserInsert = {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase!
      .from('users')
      .upsert(userData)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create user profile', error)
    }

    return data
  },

  async createUserFromAuth(authUser: { id: string; email?: string; user_metadata?: { name?: string } }): Promise<User> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    console.log('🔍 createUserFromAuth called with user:', authUser.id)
    
    // Helper function to create user profile when user registers
    // Call this after successful authentication signup
    const email = authUser.email || ''
    const userData: UserInsert = {
      id: authUser.id,
      email: email,
      name: authUser.user_metadata?.name || email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📦 Prepared user data:', userData)
    
    try {
      console.log('📡 Starting database upsert operation...')
      const start = Date.now()
      
      const { data, error } = await supabase
        .from('users')
        .upsert(userData)
        .select()
        .single()
      
      const time = Date.now() - start
      console.log(`⏱️ Database upsert completed in ${time}ms`)
      
      if (error) {
        console.error('❌ Database upsert error:', error)
        throw new DatabaseError('Failed to create user profile from auth', error)
      }

      console.log('✅ User profile created successfully:', data.id)
      return data
    } catch (error) {
      console.error('💥 createUserFromAuth failed:', error)
      throw error
    }
  },


  async deleteUser(userId: string): Promise<void> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new DatabaseError('Failed to delete user', error)
    }
  }
}