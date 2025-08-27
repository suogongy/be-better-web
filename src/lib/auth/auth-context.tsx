'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/services/index'
import { Database } from '@/types/database'
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'

// 用户类型定义
type User = Database['public']['Tables']['users']['Row']

// 认证状态类型
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isConfigured: boolean
}

// 认证上下文类型
interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  clearError: () => void
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 认证 Hook
 * @returns 认证上下文
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用')
  }
  return context
}

/**
 * 认证提供者组件
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 状态管理
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isConfigured: false,
  })

  // 检查配置状态
  const isConfigured = useMemo(() => isSupabaseConfigured(), [])

  // 更新状态的工具函数
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }))
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  // 将 Supabase 用户转换为应用用户
  const mapSupabaseUserToUser = useCallback((supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      bio: supabaseUser.user_metadata?.bio,
      website: supabaseUser.user_metadata?.website,
      social_links: supabaseUser.user_metadata?.social_links,
      preferences: supabaseUser.user_metadata?.preferences,
      created_at: supabaseUser.created_at,
      updated_at: new Date().toISOString()
    }
  }, [])

  // 确保用户资料存在于数据库中
  const ensureUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // 尝试获取现有资料
      await userService.getProfile(supabaseUser.id)
    } catch (error: unknown) {
      // 如果不存在则创建新资料
      const err = error as { code?: string }
      if (err.code === 'PGRST116') {
        try {
          // 使用用户服务创建资料
          await userService.createUserFromAuth({
            id: supabaseUser.id,
            email: supabaseUser.email,
            user_metadata: {
              name: supabaseUser.user_metadata?.name
            }
          })
        } catch (insertErr) {
          console.warn('⚠️ 创建用户资料异常:', insertErr)
        }
      }
    }
  }, [])

  // 处理认证状态变化
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('🔄 认证状态变化:', event)

    if (session?.user) {
      const user = mapSupabaseUserToUser(session.user)
      updateState({ 
        user, 
        error: null,
        loading: false 
      })

      // 确保用户资料存在
      if (event === 'SIGNED_IN') {
        await ensureUserProfile(session.user)
      }
    } else {
      updateState({ 
        user: null, 
        error: null,
        loading: false 
      })
    }
  }, [mapSupabaseUserToUser, updateState, ensureUserProfile])

  // 初始化认证
  useEffect(() => {
    // 更新配置状态
    updateState({ isConfigured })

    // 如果 Supabase 未配置，直接设置加载完成
    if (!isConfigured) {
      console.warn('⚠️ Supabase 未配置 - 跳过认证检查')
      updateState({ 
        loading: false, 
        error: '认证服务未配置，请检查环境设置' 
      })
      return
    }

    // 服务器端跳过认证检查
    if (typeof window === 'undefined') {
      updateState({ loading: false })
      return
    }

    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('开始认证检查...')
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.warn('⚠️ 会话检查失败:', error.message)
          updateState({ 
            error: `认证检查失败: ${error.message}`,
            user: null,
            loading: false 
          })
        } else if (session?.user) {
          console.log('✅ 用户已登录')
          const user = mapSupabaseUserToUser(session.user)
          updateState({ 
            user, 
            error: null,
            loading: false 
          })

          // 确保用户资料存在（非阻塞）
          ensureUserProfile(session.user).catch(err =>
            console.warn('⚠️ 用户资料同步失败:', err)
          )
        } else {
          console.log('ℹ️ 用户未登录')
          updateState({ 
            user: null, 
            error: null,
            loading: false 
          })
        }
      } catch (error) {
        if (!mounted) return

        console.error('❌ 认证检查异常:', error)
        const message = error instanceof Error ? error.message : '未知错误'
        updateState({ 
          error: `认证检查失败: ${message}`,
          user: null,
          loading: false 
        })
      }
    }

    initializeAuth()

    // 监听认证状态变化
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isConfigured, updateState, mapSupabaseUserToUser, ensureUserProfile, handleAuthStateChange])

  // 登录方法
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: '认证服务未配置' } as AuthError }
    }

    try {
      updateState({ loading: true, error: null })
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      console.error('登录错误:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : '登录失败'
        } as AuthError
      }
    } finally {
      updateState({ loading: false })
    }
  }, [isConfigured, updateState])

  // 注册方法
  const signUp = useCallback(async (email: string, password: string, metadata?: { name?: string }) => {
    if (!isConfigured) {
      return { error: { message: '认证服务未配置' } as AuthError }
    }

    try {
      updateState({ loading: true, error: null })
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })
      return { error }
    } catch (error) {
      console.error('注册错误:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : '注册失败'
        } as AuthError
      }
    } finally {
      updateState({ loading: false })
    }
  }, [isConfigured, updateState])

  // 登出方法
  const signOut = useCallback(async () => {
    if (!isConfigured) {
      return { error: { message: '认证服务未配置' } as AuthError }
    }

    try {
      updateState({ loading: true, error: null })
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('登出错误:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : '登出失败'
        } as AuthError
      }
    } finally {
      updateState({ loading: false })
    }
  }, [isConfigured, updateState])

  // 重置密码方法
  const resetPassword = useCallback(async (email: string) => {
    if (!isConfigured) {
      return { error: { message: '认证服务未配置' } as AuthError }
    }

    try {
      updateState({ error: null })
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      console.error('重置密码错误:', error)
      return {
        error: {
          message: error instanceof Error ? error.message : '重置密码失败'
        } as AuthError
      }
    }
  }, [isConfigured, updateState])

  // 上下文值
  const contextValue = useMemo<AuthContextType>(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  }), [authState, signIn, signUp, signOut, resetPassword, clearError])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}