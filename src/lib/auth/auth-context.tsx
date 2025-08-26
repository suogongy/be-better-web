'use client'

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/database'
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error: AuthError | null }>
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
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const isConfigured = isSupabaseConfigured()

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user: User) => {
    try {
      console.log(`🔍 为用户 ${user.id.substring(0, 8)}... 创建配置文件`)
      
      const profilePromise = userService.createUserFromAuth({
        id: user.id,
        email: user.email || '',
        user_metadata: {
          name: user.user_metadata?.name
        }
      })
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 8000)
      )
      await Promise.race([profilePromise, timeoutPromise])
      console.log('✅ 配置文件创建成功')
    } catch (error) {
      console.warn('⚠️ 配置文件创建失败（非关键）:', error instanceof Error ? error.message : String(error))
      // Don't throw error, as this is not critical for auth
    }
  }

  useEffect(() => {
    // If Supabase is not configured, set loading to false immediately
    if (!isConfigured) {
      console.warn('⚠️ Supabase 未配置 - 跳过认证检查')
      setLoading(false)
      setError('认证服务未配置，请检查环境设置')
      return
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log('📋 在服务端环境中，跳过认证检查')
      setLoading(false)
      return
    }

    let mounted = true
    
    // Get initial session with timeout
    const getSession = async () => {
      try {
        console.log('🔍 开始认证会话检查...')
        
        const sessionStart = Date.now()
        
        // Create timeout promise
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => {
            console.warn('⏰ Supabase 认证检查超时 (5秒)')
            reject(new Error('Session check timeout'))
          }, 5000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])
        
        if (!mounted) return
        
        const sessionTime = Date.now() - sessionStart
        console.log(`✅ 会话检查完成，耗时 ${sessionTime}ms`)
        
        if (error) {
          console.warn('会话检查出现错误，继续无认证运行')
          setUser(null)
        } else {
          if (session?.user) {
            console.log('✅ 找到用户会话:', session.user.email || session.user.id.substring(0, 8) + '...')
            setUser(session.user)
            // Ensure user profile exists (non-blocking)
            ensureUserProfile(session.user).catch(() => {})
          } else {
            console.log('❌ 未找到用户会话')
            setUser(null)
          }
        }
      } catch (error: any) {
        if (!mounted) return
        
        if (error.message === 'Session check timeout') {
          console.warn('会话检查超时，继续无认证运行（这通常是网络延迟导致的）')
        } else {
          console.warn('会话检查错误，继续无认证运行:', error.message)
        }
        setUser(null)
      } finally {
        if (mounted) {
          console.log('✅ 认证检查完成，应用准备就绪')
          setLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return
      
      console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户')
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Create user profile when user signs in (non-blocking)
        ensureUserProfile(session.user).catch(() => {})
      }
      
      setUser(session?.user ?? null)
      setLoading(false)
      setError(null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, isConfigured])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      console.error('SignIn error:', error)
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      return { error }
    } catch (error: any) {
      console.error('SignUp error:', error)
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
      setError(null)
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error: any) {
      console.error('SignOut error:', error)
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
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error: any) {
      console.error('Reset password error:', error)
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        return { error: { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError }
      }
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    loading,
    error,
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