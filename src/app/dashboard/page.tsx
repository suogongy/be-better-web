'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { ProtectedPage } from '@/components/auth/protected-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Calendar, BookOpen, TrendingUp, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedPage>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">仪表板</h1>
            <p className="text-muted-foreground mt-1">
              欢迎回来，{user?.email}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Link href="/schedule">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                添加任务
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link href="/schedule">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-lg">日程安排</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  查看和管理您的日常任务和日程
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/blog">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <BookOpen className="h-8 w-8 text-green-600" />
                <CardTitle className="text-lg">博客管理</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  创建、编辑和管理您的博客文章
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/insights">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <CardTitle className="text-lg">数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  查看您的生产力趋势和洞察
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/summary">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <CardTitle className="text-lg">每日总结</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  记录和回顾您的每日总结
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>最近任务</CardTitle>
              <CardDescription>
                您最近创建的任务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">示例任务</p>
                    <p className="text-sm text-gray-500">今天 14:30</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    进行中
                  </span>
                </div>
                <p className="text-center text-gray-500 text-sm">
                  暂无更多任务
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近博客</CardTitle>
              <CardDescription>
                您最近发布的博客文章
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">示例博客文章</p>
                    <p className="text-sm text-gray-500">昨天</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    已发布
                  </span>
                </div>
                <p className="text-center text-gray-500 text-sm">
                  暂无更多文章
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedPage>
  )
}