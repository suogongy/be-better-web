'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface AuthStatusProps {
  children: React.ReactNode
  showLoading?: boolean
}

/**
 * 认证状态检查组件
 * 仅在初始化时显示加载状态，不拦截未登录用户
 */
export function AuthStatus({ children, showLoading = true }: AuthStatusProps) {
  const { loading, error } = useAuth()

  // 仅在初始加载时显示加载状态
  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">正在初始化...</p>
        </div>
      </div>
    )
  }

  // 只在关键错误时显示（如网络错误、配置错误）
  if (error && !loading && isCriticalError(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">服务错误</h3>
                <p className="text-sm mb-4">{error}</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    刷新页面
                  </Button>
                  <Link href="/debug">
                    <Button variant="ghost" size="sm" className="w-full">
                      查看诊断信息
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

  // 正常状态，显示子组件
  return <>{children}</>
}

/**
 * 判断是否为关键错误
 */
function isCriticalError(error: string): boolean {
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
 * 认证成功指示器组件
 * 用于显示用户已成功登录的状态
 */
export function AuthSuccessIndicator() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">已登录: {user.name || user.email}</span>
      </div>
    </div>
  )
}
