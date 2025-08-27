import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Loading } from './loading'
import { AlertCircle, Wifi, Settings, RefreshCw, ExternalLink } from 'lucide-react'

interface LoadingErrorProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
  children: React.ReactNode
}

export function LoadingError({ loading, error, onRetry, children }: LoadingErrorProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)

  // 测试网络连接
  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('正在测试连接...')
    
    try {
      // 测试基本网络连接
      const startTime = Date.now()
      const response = await fetch('https://httpbin.org/get', { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      })
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (response.ok) {
        setConnectionStatus(`网络连接正常 (${responseTime}ms)`)
      } else {
        setConnectionStatus(`网络连接异常 (状态码: ${response.status})`)
      }
    } catch (error) {
      setConnectionStatus(`网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  // 如果认证服务未配置，显示配置提示
  if (error && error.includes('未配置')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">配置提示</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              认证服务未配置。请检查您的环境变量设置。
            </p>
            <div className="space-y-2 text-sm text-left bg-gray-50 dark:bg-gray-800 p-4 rounded">
              <p>请确保在项目根目录创建 <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.local</code> 文件，包含：</p>
              <p><code>NEXT_PUBLIC_SUPABASE_URL=your-supabase-url</code></p>
              <p><code>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果认证服务连接超时或网络错误，显示网络错误
  if (error && (error.includes('超时') || error.includes('网络') || error.includes('连接'))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="text-center py-8">
            <Wifi className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">连接错误</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            
            {/* 连接状态显示 */}
            {connectionStatus && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm">{connectionStatus}</p>
              </div>
            )}
            
            {/* 诊断按钮 */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
              <Button 
                onClick={testConnection} 
                disabled={isTestingConnection}
                variant="outline"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    测试网络连接
                  </>
                )}
              </Button>
              
              <Button onClick={onRetry || (() => window.location.reload())}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
            </div>
            
            {/* 故障排除建议 */}
            <div className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">故障排除建议：</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>检查您的网络连接是否正常</li>
                <li>确认 Supabase 项目状态是否正常</li>
                <li>尝试刷新页面或重新启动开发服务器</li>
                <li>检查浏览器控制台是否有详细错误信息</li>
              </ul>
            </div>
            
            {/* 外部链接 */}
            <div className="mt-4 pt-4 border-t">
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                访问 Supabase 控制台
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果有其他错误，显示通用错误
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">发生错误</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果没有错误且不在加载，显示子组件
  return <>{children}</>
}
