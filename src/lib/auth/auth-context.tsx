'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/services/index'
import { User } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AuthError, Session } from '@supabase/supabase-js'

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

  // 获取用户资料
  const getUserProfile = async (user: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar_url: data.avatar_url,
        bio: data.bio,
        website: data.website,
        social_links: data.social_links,
        preferences: data.preferences,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  }

  // 确保用户资料存在
  const ensureUserProfile = async (user: any) => {
    try {
      // 先尝试获取现有资料
      await getUserProfile(user)
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        // 用户不存在，创建新用户
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      } else {
        throw error
      }
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
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        try {
          await ensureUserProfile(session.user)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
            bio: session.user.user_metadata?.bio,
            website: session.user.user_metadata?.website,
            social_links: session.user.user_metadata?.social_links,
            preferences: session.user.user_metadata?.preferences,
            created_at: session.user.created_at,
            updated_at: new Date().toISOString()
          })
        } catch (error) {
          console.error('Failed to ensure user profile:', error)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
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