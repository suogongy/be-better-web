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
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 如果配置无效，不进行重定向
    if (!isConfigured) return

    // 如果加载完成且用户未登录，重定向到登录页面
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, isConfigured, router, redirectTo])

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

  // 如果配置无效，显示配置错误
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">认证服务未配置</h3>
                <p className="text-sm mb-4">
                  无法验证用户身份，请检查系统配置。
                </p>
                <Link href="/debug">
                  <Button variant="outline" size="sm">
                    查看诊断信息
                  </Button>
                </Link>
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
  const { user, loading, isConfigured } = useAuth()

  // 如果正在加载或配置无效，显示加载状态
  if (loading || !isConfigured) {
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
