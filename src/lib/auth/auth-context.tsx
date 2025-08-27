'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/services/index'
import { User } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { getErrorMessage, getErrorName, isNetworkError, isTimeoutError } from '@/lib/utils/error-handler'

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
      // 先尝试获取现有资料
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

  useEffect(() => {
    mountedRef.current = true
    
    // If Supabase is not configured, set loading to false immediately
    if (!isConfigured) {
      console.warn('⚠️ Supabase 未配置 - 跳过认证检查')
      setLoading(false)
      setError('认证服务未配置，请检查环境设置')
      return
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log('在服务端环境中，跳过认证检查')
      setLoading(false)
      return
    }

    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Supabase 客户端不可用')
      setLoading(false)
      setError('Supabase 客户端初始化失败')
      return
    }

    // Get initial session with improved error handling
    const getSession = async () => {
      try {
        console.log('🔍 开始认证会话检查...')
        console.log('window?', typeof window)
        console.log('localStorage?', typeof localStorage)
        console.log('supabase client ready?', !!supabase)
        
        // 尝试使用 getUser (在浏览器环境中更可靠)
        const useGetUser = typeof window !== 'undefined' && supabase.auth.getUser
        console.log(`🔄 开始认证检查 (使用 ${useGetUser ? 'getUser' : 'getSession'} 方法)`)

        if (useGetUser) {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          
          if (!mountedRef.current) return
          
          if (userError) {
            console.warn('⚠️ getUser 失败:', getErrorMessage(userError))
            setError(`认证检查失败: ${getErrorMessage(userError)}`)
            setUser(null)
          } else {
            if (userData?.user) {
              console.log('✅ getUser 成功获取用户信息')
              setUser(mapSupabaseUserToUser(userData.user))
              setError(null)
              // Ensure user profile exists (non-blocking)
              ensureUserProfile(userData.user).catch((profileError) => {
                console.warn('⚠️ 用户资料同步失败:', profileError)
              })
            } else {
              console.log('ℹ️ getUser 未返回用户信息，用户未登录')
              setUser(null)
              setError(null)
            }
          }
        } else {
          // 降级到 getSession 方法
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          
          if (!mountedRef.current) return
          
          if (sessionError) {
            console.warn('⚠️ getSession 失败:', getErrorMessage(sessionError))
            setError(`认证检查失败: ${getErrorMessage(sessionError)}`)
            setUser(null)
          } else {
            if (sessionData?.session?.user) {
              console.log('✅ getSession 成功获取用户信息')
              setUser(mapSupabaseUserToUser(sessionData.session.user))
              setError(null)
              // Ensure user profile exists (non-blocking)
              ensureUserProfile(sessionData.session.user).catch((profileError) => {
                console.warn('⚠️ 用户资料同步失败:', profileError)
              })
            } else {
              console.log('ℹ️ getSession 未返回用户信息，用户未登录')
              setUser(null)
              setError(null)
            }
          }
        }
      } catch (error: unknown) {
        if (!mountedRef.current) return
        
        console.error('❌ 会话检查异常:', error)
        
        // 更详细的错误分类
        if (isTimeoutError(error)) {
          setError('认证检查超时，可能是网络连接问题或 Supabase 服务不可用')
        } else if (isNetworkError(error)) {
          setError('网络连接失败，请检查网络设置')
        } else if (getErrorMessage(error)?.includes('Failed to fetch')) {
          setError('无法连接到认证服务，请检查网络连接')
        } else {
          setError(`认证检查失败: ${getErrorMessage(error) || '未知错误'}`)
        }
        
        setUser(null)
      } finally {
        if (mountedRef.current) {
          console.log('✅ 认证检查完成，应用准备就绪')
          setLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id ? `用户: ${session.user.id.substring(0, 8)}...` : '无用户')
      
      if (!mountedRef.current) return
      
      if (session?.user) {
        try {
          await ensureUserProfile(session.user)
          setUser(mapSupabaseUserToUser(session.user))
          setError(null)
        } catch (error) {
          console.error('❌ Failed to ensure user profile:', error)
          setError('用户资料同步失败')
        }
      } else {
        setUser(null)
        setError(null)
      }
      
      setLoading(false)
    })

    return () => {
      mountedRef.current = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, isConfigured])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }

    try {
      console.log(`🔐 尝试登录用户: ${email}`)

      // Clear any previous errors
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error(`❌ 登录失败: ${getErrorMessage(error)}`)
        return { error }
      }

      console.log(`✅ 登录请求成功，等待认证状态变更...`)
      return { error: null }
    } catch (error: unknown) {
      console.error('❌ 登录过程出错:', error)

      // Handle network errors
      if (isNetworkError(error)) {
        const networkError = { message: 'Unable to connect to authentication service. Please check your network connection.' } as AuthError
        setError(networkError.message)
        return { error: networkError }
      }

      // Handle other errors
      const authError = (error instanceof Error ? error : new Error('登录过程中发生未知错误')) as AuthError
      setError(authError.message || '登录过程中发生未知错误')
      return { error: authError }
    }
  }

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication service not configured. Please check your environment settings.' } as AuthError }
    }
    
    if (!supabase) {
      return { error: { message: 'Supabase client is not available.' } as AuthError }
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
    } catch (error: unknown) {
      console.error('SignUp error:', error)
      if (isNetworkError(error)) {
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
    
    if (!supabase) {
      return { error: { message: 'Supabase client is not available.' } as AuthError }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error: unknown) {
      console.error('SignOut error:', error)
      if (isNetworkError(error)) {
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
    
    if (!supabase) {
      return { error: { message: 'Supabase client is not available.' } as AuthError }
    }
    
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      if (isNetworkError(error)) {
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