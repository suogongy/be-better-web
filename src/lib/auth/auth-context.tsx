'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'

// 简化的用户类型，只包含认证所需的基本信息
interface AdminUser {
  id: string
  email: string
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
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
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const mountedRef = useRef(false)

  // 初始化认证状态
  const initializeAuth = async () => {
    if (!mountedRef.current) return
    
    try {
      setLoading(true)
      setError(null)
      
      // 获取当前会话
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }
      
      if (session?.user) {
        // 验证是否为管理员邮箱（可选，根据需要配置）
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || session.user.email
        if (session.user.email === adminEmail) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          })
        } else {
          // 如果不是管理员邮箱，登出
          await supabase.auth.signOut()
        }
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      setError(error instanceof Error ? error.message : '初始化失败')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        })
      }
      
      return { error: null }
    } catch (error) {
      const authError = error as Error
      setError(authError.message)
      return { error: authError }
    }
  }

  // 登出
  const signOut = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
      return { error: null }
    } catch (error) {
      const authError = error as Error
      setError(authError.message)
      return { error: authError }
    }
  }

  // 监听认证状态变化
  useEffect(() => {
    mountedRef.current = true
    
    initializeAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          })
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )
    
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}