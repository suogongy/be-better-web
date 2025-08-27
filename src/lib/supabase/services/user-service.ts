import { supabase } from '../client'
import { DatabaseError } from './index'
import type { User } from '@/types/database'

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

  async updateProfile(userId: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates as Partial<User>)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update user profile', error)
    }

    return data
  },

  async createProfile(user: { id: string; email: string; name?: string }): Promise<User> {
    // Manual user creation without database triggers
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
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
    console.log('🔍 createUserFromAuth called with user:', authUser.id)
    
    // Helper function to create user profile when user registers
    // Call this after successful authentication signup
    const userData = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email,
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


  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch user', error)
    }

    return data
  },

  async validateUserExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false // No rows returned
      throw new DatabaseError('Failed to validate user exists', error)
    }

    return !!data
  },
}

