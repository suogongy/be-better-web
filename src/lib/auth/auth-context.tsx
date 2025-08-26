'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    // If Supabase is not configured, just set loading to false
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, isConfigured])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      console.error('SignIn error:', error)
      // Handle network errors specifically
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      console.error('SignUp error:', error)
      // Handle network errors specifically
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error: any) {
      console.error('SignOut error:', error)
      // Handle network errors specifically
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error: any) {
      console.error('Reset password error:', error)
      // Handle network errors specifically
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}