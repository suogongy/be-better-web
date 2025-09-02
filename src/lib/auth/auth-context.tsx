'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { userService } from '@/lib/supabase/services/index'
import { User } from '@/types/database'
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { getErrorMessage, isNetworkError } from '@/lib/utils/error-handler'
import { authStorage } from './auth-storage'

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
  const authCheckRef = useRef(false)

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

  // 简化的认证检查
  const checkAuth = async () => {
    if (authCheckRef.current) return
    authCheckRef.current = true
    
    try {
      console.log('🔍 开始认证检查...')
      
      // 首先尝试从本地存储获取状态
      const cachedUser = authStorage.getAuthState()
      if (cachedUser && !user) {
        console.log('📱 从缓存恢复用户状态')
        setUser(cachedUser as User)
        setLoading(false)
        // 异步验证状态
        validateAuthState()
        return
      }
      
      // 使用getUser方法检查认证状态
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (!mountedRef.current) return
      
      if (userError) {
        console.warn('⚠️ 认证检查失败:', getErrorMessage(userError))
        setError(`认证检查失败: ${getErrorMessage(userError)}`)
        setUser(null)
        authStorage.clearAuthState()
      } else if (userData?.user) {
        console.log('✅ 认证检查成功')
        const mappedUser = mapSupabaseUserToUser(userData.user)
        setUser(mappedUser)
        setError(null)
        
        // 保存到本地存储
        authStorage.saveAuthState(mappedUser)
        
        // 异步确保用户资料存在
        ensureUserProfile(userData.user).catch((profileError) => {
          console.warn('⚠️ 用户资料同步失败:', profileError)
        })
      } else {
        console.log('ℹ️ 用户未登录')
        setUser(null)
        setError(null)
        authStorage.clearAuthState()
      }
    } catch (error: unknown) {
      if (!mountedRef.current) return
      
      console.error('❌ 认证检查异常:', error)
      setError(`认证检查失败: ${getErrorMessage(error) || '未知错误'}`)
      setUser(null)
      authStorage.clearAuthState()
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        console.log('✅ 认证检查完成')
      }
    }
  }

  // 验证认证状态
  const validateAuthState = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError || !userData?.user) {
        console.log('❌ 缓存状态无效，清除缓存')
        setUser(null)
        authStorage.clearAuthState()
        return
      }
      
      console.log('✅ 缓存状态有效')
    } catch (error) {
      console.error('验证认证状态失败:', error)
      setUser(null)
      authStorage.clearAuthState()
    }
  }

  useEffect(() => {
    mountedRef.current = true

    if (typeof window === 'undefined') {
      console.log('在服务端环境中，跳过认证检查')
      setLoading(false)
      return
    }

    if (!supabase) {
      console.error('❌ Supabase 客户端不可用')
      setLoading(false)
      setError('Supabase 客户端初始化失败')
      return
    }

    // 执行认证检查
    checkAuth()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('🔄 认证状态变更:', event, session?.user?.id ? `用户: ${session.user.id.substring(0, 8)}...` : '无用户')
      
      if (!mountedRef.current) return
      
      if (session?.user) {
        try {
          await ensureUserProfile(session.user)
          const mappedUser = mapSupabaseUserToUser(session.user)
          setUser(mappedUser)
          setError(null)
          
          // 保存到本地存储
          authStorage.saveAuthState(mappedUser)
        } catch (error) {
          console.error('❌ 用户资料同步失败:', error)
          setError('用户资料同步失败')
        }
      } else {
        setUser(null)
        setError(null)
        authStorage.clearAuthState()
      }
      
      setLoading(false)
    })

    return () => {
      mountedRef.current = false
      authCheckRef.current = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      console.log(`🔐 尝试登录用户: ${email}`)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error(`❌ 登录失败: ${getErrorMessage(error)}`)
        return { error }
      }

      console.log(`✅ 登录请求成功`)
      return { error: null }
    } catch (error: unknown) {
      console.error('❌ 登录过程出错:', error)

      if (isNetworkError(error)) {
        const networkError = { message: '无法连接到认证服务，请检查网络连接。' } as AuthError
        setError(networkError.message)
        return { error: networkError }
      }

      const authError = (error instanceof Error ? error : new Error('登录过程中发生未知错误')) as AuthError
      setError(authError.message || '登录过程中发生未知错误')
      return { error: authError }
    }
  }

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
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
        return { error: { message: '无法连接到认证服务，请检查网络连接。' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase client is not available.' } as AuthError }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (!error) {
        // 清除本地存储
        authStorage.clearAuthState()
      }
      
      return { error }
    } catch (error: unknown) {
      console.error('SignOut error:', error)
      if (isNetworkError(error)) {
        return { error: { message: '无法连接到认证服务，请检查网络连接。' } as AuthError }
      }
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
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
        return { error: { message: '无法连接到认证服务，请检查网络连接。' } as AuthError }
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