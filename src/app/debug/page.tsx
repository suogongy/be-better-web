'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { NetworkDiagnostics } from '@/lib/utils/network-diagnostics'
import { EnvChecker } from '@/lib/utils/env-checker'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Database,
  Globe,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string
  responseTime?: number
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  // 获取环境变量信息
  useEffect(() => {
    const vars = EnvChecker.getEnvSummary()
    setEnvVars(vars)
  }, [])

  // 运行所有诊断测试
  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    const tests = [
      testEnvironmentVariables,
      testNetworkConnectivity,
      testSupabaseConfiguration,
      testSupabaseConnection,
      testDatabaseAccess,
      testAdvancedNetworkDiagnostics
    ]

    for (const test of tests) {
      const result = await test()
      setResults(prev => [...prev, result])
      // 添加小延迟以便用户看到进度
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunning(false)
  }

  // 测试环境变量
  const testEnvironmentVariables = async (): Promise<TestResult> => {
    const check = EnvChecker.checkSupabaseConfig()
    
    if (!check.isValid) {
      return {
        name: '环境变量配置',
        status: 'error',
        message: '环境变量配置存在问题',
        details: check.issues.join(', ')
      }
    }

    if (check.warnings.length > 0) {
      return {
        name: '环境变量配置',
        status: 'warning',
        message: '环境变量配置有警告',
        details: check.warnings.join(', ')
      }
    }

    return {
      name: '环境变量配置',
      status: 'success',
      message: '环境变量配置正确',
      details: '所有必需的环境变量都已正确设置'
    }
  }

  // 测试网络连接
  const testNetworkConnectivity = async (): Promise<TestResult> => {
    try {
      const result = await NetworkDiagnostics.testBasicConnectivity()
      
      if (result.success) {
        return {
          name: '网络连接',
          status: 'success',
          message: '网络连接正常',
          details: `响应时间: ${result.responseTime}ms`,
          responseTime: result.responseTime
        }
      } else {
        return {
          name: '网络连接',
          status: 'error',
          message: '网络连接失败',
          details: result.error || result.details || '未知错误'
        }
      }
    } catch (error: any) {
      return {
        name: '网络连接',
        status: 'error',
        message: '网络连接测试异常',
        details: error.message
      }
    }
  }

  // 测试 Supabase 配置
  const testSupabaseConfiguration = async (): Promise<TestResult> => {
    const isConfigured = isSupabaseConfigured()
    
    if (!isConfigured) {
      return {
        name: 'Supabase 配置',
        status: 'error',
        message: 'Supabase 客户端配置无效',
        details: '请检查环境变量是否正确设置'
      }
    }

    return {
      name: 'Supabase 配置',
      status: 'success',
      message: 'Supabase 客户端配置正确',
      details: '客户端已正确初始化'
    }
  }

  // 测试 Supabase 连接
  const testSupabaseConnection = async (): Promise<TestResult> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      return {
        name: 'Supabase 连接',
        status: 'error',
        message: 'Supabase URL 未配置',
        details: '请在环境变量中设置 NEXT_PUBLIC_SUPABASE_URL'
      }
    }
    
    try {
      const result = await NetworkDiagnostics.testSupabaseConnection(supabaseUrl)
      
      if (result.success) {
        return {
          name: 'Supabase 连接',
          status: 'success',
          message: 'Supabase 服务可访问',
          details: `响应时间: ${result.responseTime}ms`,
          responseTime: result.responseTime
        }
      } else {
        return {
          name: 'Supabase 连接',
          status: 'error',
          message: 'Supabase 连接失败',
          details: result.error || result.details || '未知错误',
          responseTime: result.responseTime
        }
      }
    } catch (error: any) {
      return {
        name: 'Supabase 连接',
        status: 'error',
        message: 'Supabase 连接测试异常',
        details: error.message
      }
    }
  }

  // 测试数据库访问
  const testDatabaseAccess = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const supabase = createClient()
      // 尝试一个简单的数据库查询
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (error) {
        // 如果是权限错误，说明连接正常但权限有问题
        if (error.code === 'PGRST116') {
          return {
            name: '数据库访问',
            status: 'warning',
            message: '数据库连接正常，但权限受限',
            details: '这是正常的，匿名用户通常无法访问用户表',
            responseTime
          }
        }
        
        return {
          name: '数据库访问',
          status: 'error',
          message: '数据库访问失败',
          details: error.message,
          responseTime
        }
      }

      return {
        name: '数据库访问',
        status: 'success',
        message: '数据库访问成功',
        details: `响应时间: ${responseTime}ms`,
        responseTime
      }
    } catch (error: any) {
      return {
        name: '数据库访问',
        status: 'error',
        message: '数据库访问异常',
        details: error.message
      }
    }
  }

  // 高级网络诊断测试
  const testAdvancedNetworkDiagnostics = async (): Promise<TestResult> => {
    try {
      const results = await NetworkDiagnostics.testMultipleEndpoints()
      const successCount = results.filter(r => r.success).length
      const totalCount = results.length
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount
      
      if (successCount === totalCount) {
        return {
          name: '高级网络诊断',
          status: 'success',
          message: '所有网络端点连接正常',
          details: `成功率: ${successCount}/${totalCount}, 平均响应时间: ${Math.round(avgResponseTime)}ms`,
          responseTime: avgResponseTime
        }
      } else if (successCount > 0) {
        return {
          name: '高级网络诊断',
          status: 'warning',
          message: '部分网络端点连接异常',
          details: `成功率: ${successCount}/${totalCount}, 可能存在网络问题`,
          responseTime: avgResponseTime
        }
      } else {
        return {
          name: '高级网络诊断',
          status: 'error',
          message: '所有网络端点连接失败',
          details: '网络连接存在严重问题，请检查网络设置',
          responseTime: 0
        }
      }
    } catch (error: any) {
      return {
        name: '高级网络诊断',
        status: 'error',
        message: '网络诊断测试异常',
        details: error.message
      }
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      success: '成功',
      error: '错误',
      warning: '警告',
      pending: '进行中'
    }

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">系统诊断工具</h1>
          <p className="text-muted-foreground">
            诊断 Supabase 连接和配置问题
          </p>
        </div>

        {/* Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              环境变量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <span className="text-sm text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="flex justify-center mb-6">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                诊断中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                开始诊断
              </>
            )}
          </Button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">诊断结果</h2>
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      {result.responseTime && (
                        <span className="text-xs text-gray-500">
                          {result.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>有用的链接</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Supabase 控制台
              </a>
              <a 
                href="https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Next.js 集成指南
              </a>
              <a 
                href="/ENVIRONMENT_SETUP.md" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                环境变量配置指南
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
