'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'
import { CheckCircle, Calendar, BookOpen, TrendingUp, AlertCircle, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { NewsletterSubscription } from '@/components/newsletter/newsletter-subscription'

export default function Home() {
  const { user, loading, error } = useAuth()
  const [retryCount, setRetryCount] = useState(0)

  // 如果认证服务未配置，显示配置提示
  if (error && error.includes('未配置')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
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

  // 如果认证服务连接超时，显示网络错误
  if (error && (error.includes('超时') || error.includes('连接失败'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">连接问题</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <Button onClick={() => {
              setRetryCount(prev => prev + 1)
              window.location.reload()
            }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重新加载
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果正在加载且超过一定时间，显示加载状态和重试选项
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loading text="加载中..." />
          <p className="mt-4 text-gray-600 dark:text-gray-300">正在检查认证状态...</p>
          {retryCount > 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              重试次数: {retryCount}
            </p>
          )}
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setRetryCount(prev => prev + 1)
              window.location.reload()
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            您的个人
            <span className="text-blue-600 dark:text-blue-400"> 博客 </span>
            &
            <span className="text-green-600 dark:text-green-400"> 生产力 </span>
            平台
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            将您的个人博客与日常日程管理相结合。
            跟踪您的生产力，反思您的进步，并自动
            从您的每日总结中生成博客内容。
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  开始您的旅程
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  浏览博客
                </Button>
              </Link>
            </div>
          )}
          {user && (
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg">
                  进入仪表板
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            功能特性
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle>博客管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  创建、编辑和管理您的个人博客文章，支持富文本编辑和标签分类。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <CardTitle>日程规划</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  制定每日、每周计划，跟踪任务完成情况，提高工作效率。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle>生产力分析</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  可视化展示您的生产力数据，生成周报和月报，帮助您持续改进。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              订阅博客更新
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              获取最新的文章、生产力技巧和网站更新
            </p>
          </div>
          <NewsletterSubscription />
        </div>
      </section>
    </div>
  )
}