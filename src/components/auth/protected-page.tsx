'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedPageProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * 简单的页面保护组件
 * 未登录用户会自动重定向到登录页面
 */
export function ProtectedPage({ children, redirectTo = '/auth/login' }: ProtectedPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 如果没有加载且用户未登录，重定向
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // 未登录状态（useEffect 会处理重定向，这里返回 null）
  if (!user) {
    return null
  }

  // 已登录，显示内容
  return <>{children}</>
}