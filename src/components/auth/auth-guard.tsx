'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * 认证守卫组件
 * 用于保护需要登录的页面，未登录用户会被重定向到登录页面
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, loading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 只在没有加载状态且确定用户未登录时重定向
    if (!loading && !user && !isCriticalError(error)) {
      router.push(redirectTo)
    }
  }, [user, loading, error, router, redirectTo])

  // 如果正在加载，显示加载状态
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">正在验证登录状态...</p>
        </div>
      </div>
    )
  }

  // 如果有关键错误，显示错误信息
  if (error && isCriticalError(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">服务错误</h3>
                <p className="text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  刷新页面
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // 如果用户未登录，显示登录提示
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">需要登录</h3>
                <p className="text-sm mb-4">
                  此页面需要登录后才能访问。
                </p>
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button size="sm" className="w-full">
                      立即登录
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" size="sm" className="w-full">
                      注册账户
                    </Button>
                  </Link>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // 用户已登录，显示受保护的内容
  return <>{children}</>
}

/**
 * 判断是否为关键错误
 */
function isCriticalError(error: string | null): boolean {
  if (!error) return false
  
  const criticalErrors = [
    'Supabase client is not available',
    '无法连接到认证服务',
    '网络错误',
    '配置错误',
    '初始化失败'
  ]
  
  return criticalErrors.some(criticalError => 
    error.toLowerCase().includes(criticalError.toLowerCase())
  )
}

/**
 * 可选认证守卫组件
 * 用于显示不同的内容给登录和未登录用户
 */
export function OptionalAuthGuard({ 
  children, 
  guestFallback 
}: { 
  children: React.ReactNode
  guestFallback?: React.ReactNode 
}) {
  const { user, loading } = useAuth()

  // 如果正在加载或配置无效，显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    )
  }

  // 如果用户未登录，显示访客内容
  if (!user) {
    return guestFallback || null
  }

  // 用户已登录，显示受保护的内容
  return <>{children}</>
}
