'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/services/index'
import { User } from '@/types/database'
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { getErrorMessage, isNetworkError } from '@/lib/utils/error-handler'

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
  const mountedRef = useRef(false)

  // 将Supabase User转换为我们的User类型
  const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      bio: supabaseUser.user_metadata?.bio,
      website: supabaseUser.user_metadata?.website,
      social_links: supabaseUser.user_metadata?.social_links,
      preferences: supabaseUser.user_metadata?.preferences,
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // 获取用户资料
  const getUserProfile = async (userId: string) => {
    try {
      const user = await userService.getProfile(userId)
      if (!user) {
        throw new Error('User profile not found')
      }
      return user
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  }

  // 确保用户资料存在
  const ensureUserProfile = async (supabaseUser: SupabaseUser) => {
    if (!supabase) {
      throw new Error('Supabase client is not available')
    }
    
    try {
      await getUserProfile(supabaseUser.id)
    } catch (error: unknown) {
      if (getErrorMessage(error).includes('PGRST116')) {
        // 用户不存在，创建新用户
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name,
            avatar_url: supabaseUser.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      } else {
        throw error
      }
    }
  }

  // 初始化认证状态
  const initializeAuth = async () => {
    if (!mountedRef.current) return
    
    try {
      // 获取当前会话
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.warn('获取会话失败:', sessionError.message)
        setLoading(false)
        return
      }

      if (session?.user) {
        try {
          // 确保用户资料存在
          await ensureUserProfile(session.user)
          const mappedUser = mapSupabaseUserToUser(session.user)
          setUser(mappedUser)
        } catch (profileError) {
          console.error('用户资料同步失败:', profileError)
          // 即使资料同步失败，也设置基本用户信息
          const mappedUser = mapSupabaseUserToUser(session.user)
          setUser(mappedUser)
        }
      }
    } catch (error) {
      console.error('认证初始化异常:', error)
      // 不设置错误状态，允许用户以访客身份浏览
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true

    // 在服务端不执行认证检查
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    if (!supabase) {
      console.error('Supabase 客户端不可用')
      setLoading(false)
      return
    }

    // 初始化认证状态
    initializeAuth()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        
        console.log('认证状态变化:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await ensureUserProfile(session.user)
            const mappedUser = mapSupabaseUserToUser(session.user)
            setUser(mappedUser)
            setError(null)
          } catch (error) {
            console.error('用户资料同步失败:', error)
            // 即使资料同步失败，也设置基本用户信息
            const mappedUser = mapSupabaseUserToUser(session.user)
            setUser(mappedUser)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const mappedUser = mapSupabaseUserToUser(session.user)
            setUser(mappedUser)
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error: unknown) {
      console.error('登录过程出错:', error)

      if (isNetworkError(error)) {
        const networkError = { message: '无法连接到认证服务，请检查网络连接。' } as AuthError
        setError(networkError.message)
        return { error: networkError }
      }

      const authError = (error instanceof Error ? error : new Error('登录过程中发生未知错误')) as AuthError
      setError(authError.message || '登录过程中发生未知错误')
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error: unknown) {
      console.error('注册过程出错:', error)

      const authError = (error instanceof Error ? error : new Error('注册过程中发生未知错误')) as AuthError
      setError(authError.message || '注册过程中发生未知错误')
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      
      setUser(null)
      
      if (error) {
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error: unknown) {
      console.error('退出登录出错:', error)
      setUser(null)
      
      if (isNetworkError(error)) {
        const networkError = { message: '无法连接到认证服务，请检查网络连接。' } as AuthError
        setError(networkError.message)
        return { error: networkError }
      }
      
      const authError = (error instanceof Error ? error : new Error('退出登录过程中发生未知错误')) as AuthError
      setError(authError.message || '退出登录过程中发生未知错误')
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error: unknown) {
      console.error('重置密码出错:', error)

      if (isNetworkError(error)) {
        const networkError = { message: '无法连接到认证服务，请检查网络连接。' } as AuthError
        setError(networkError.message)
        return { error: networkError }
      }

      const authError = (error instanceof Error ? error : new Error('重置密码过程中发生未知错误')) as AuthError
      setError(authError.message || '重置密码过程中发生未知错误')
      return { error: authError }
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