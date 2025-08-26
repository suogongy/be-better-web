'use client'

import { Loading } from '@/components/ui/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Calendar, BookOpen, TrendingUp, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoading(false)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载控制台..." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载控制台..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          欢迎使用 Be Better Web！
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          这里是您的生产力和内容概览。
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新任务</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/schedule">
              <Button variant="outline" size="sm" className="w-full">
                添加任务
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新文章</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/blog/new">
              <Button variant="outline" size="sm" className="w-full">
                写文章
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日程安排</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/schedule">
              <Button variant="outline" size="sm" className="w-full">
                查看任务
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据分析</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" disabled>
              即将推出
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近动态</CardTitle>
            <CardDescription>您最新的任务和文章</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    欢迎使用 Be Better Web
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    您的控制台已经准备就绪
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  刚刚
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>今日概览</CardTitle>
            <CardDescription>您今天的进度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">已完成任务</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">已发布文章</span>
                </div>
                <span className="text-2xl font-bold">0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">生产力评分</span>
                </div>
                <span className="text-2xl font-bold">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>快速入门</CardTitle>
          <CardDescription>
            完成这些步骤以充分利用 Be Better Web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">控制台正在工作！</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">2</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <Link href="/schedule" className="text-primary hover:underline">
                  添加您的第一个任务
                </Link>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">3</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <Link href="/blog/new" className="text-primary hover:underline">
                  撰写您的第一篇博客文章
                </Link>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">4</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                完成您的每日总结
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}