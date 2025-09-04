'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

export default function DebugPage() {
  const { user, loading, error, signOut } = useAuth()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleClearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">诊断页面</h1>
          <p className="text-gray-600 dark:text-gray-400">
            查看应用状态和诊断信息
          </p>
        </div>

        {/* 认证状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              认证状态
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {user && <CheckCircle className="h-4 w-4 text-green-500" />}
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            </CardTitle>
            <CardDescription>
              当前用户的认证状态信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">加载状态</p>
                <p className="font-mono">{loading ? '加载中...' : '已完成'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">用户状态</p>
                <p className="font-mono">{user ? '已登录' : '未登录'}</p>
              </div>
              {user && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">用户ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">邮箱</p>
                    <p className="font-mono text-sm">{user.email}</p>
                  </div>
                </>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>错误：</strong> {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 环境信息 */}
        <Card>
          <CardHeader>
            <CardTitle>环境信息</CardTitle>
            <CardDescription>
              当前运行环境的信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">运行环境</p>
                <p className="font-mono">{process.env.NODE_ENV}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">部署平台</p>
                <p className="font-mono">
                  {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
                    ? 'Vercel' 
                    : '本地开发'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Supabase URL</p>
                <p className="font-mono text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Supabase Key</p>
                <p className="font-mono text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>调试操作</CardTitle>
            <CardDescription>
              一些有用的调试操作
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新页面
              </Button>
              <Button variant="outline" onClick={handleClearStorage}>
                清除存储并刷新
              </Button>
              {user && (
                <Button variant="destructive" onClick={signOut}>
                  退出登录
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 导航测试 */}
        <Card>
          <CardHeader>
            <CardTitle>导航测试</CardTitle>
            <CardDescription>
              测试各个页面的导航是否正常
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/" className="text-blue-600 hover:underline">首页</a>
              <a href="/blog" className="text-blue-600 hover:underline">博客</a>
              <a href="/dashboard" className="text-blue-600 hover:underline">控制台</a>
              <a href="/contact" className="text-blue-600 hover:underline">联系我们</a>
              <a href="/about" className="text-blue-600 hover:underline">关于我们</a>
              <a href="/features" className="text-blue-600 hover:underline">功能特性</a>
              <a href="/docs" className="text-blue-600 hover:underline">文档</a>
              <a href="/help" className="text-blue-600 hover:underline">帮助</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}