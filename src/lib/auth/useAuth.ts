/**
 * Authentication hook with manual user profile creation
 * Handles all user registration logic in application code (no database triggers)
 */

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/database'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setAuthState({ user: null, loading: false, error: error.message })
          return
        }

        if (session?.user) {
          // Ensure user profile exists in public.users table
          await ensureUserProfile(session.user)
        }

        setAuthState({ user: session?.user || null, loading: false, error: null })
      } catch (error) {
        setAuthState({ user: null, loading: false, error: 'Failed to load session' })
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Create user profile when user signs in for the first time
          await ensureUserProfile(session.user)
        }
        
        setAuthState({ 
          user: session?.user || null, 
          loading: false, 
          error: null 
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Ensure user profile exists in public.users table
  const ensureUserProfile = async (user: User) => {
    try {
      await userService.createUserFromAuth(user)
    } catch (error) {
      console.warn('Failed to create user profile:', error)
      // Don't throw error, as this is not critical for auth
    }
  }

  // Sign up with automatic profile creation
  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return { data: null, error }
      }

      // User profile will be created automatically in the auth state change handler
      setAuthState(prev => ({ ...prev, loading: false }))
      return { data, error: null }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: 'Sign up failed' }))
      return { data: null, error: { message: 'Sign up failed' } }
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return { data: null, error }
      }

      // User profile will be ensured in the auth state change handler
      return { data, error: null }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: 'Sign in failed' }))
      return { data: null, error: { message: 'Sign in failed' } }
    }
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }))
    }
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signUp,
    signIn,
    signOut
  }
}