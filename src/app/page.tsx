'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'
import { CheckCircle, Calendar, BookOpen, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            一站式解决方案
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>博客管理</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  使用富文本编辑器创建、编辑和组织您的博客文章。
                  支持分类、标签和SEO优化。
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>日程规划</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  通过优先级、截止日期和进度跟踪来组织您的日常任务。
                  培养更好的习惯并实现您的目标。
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  通过详细的分析和洞察跟踪您的生产力。
                  监控您的进度并识别改进领域。
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>自动博客</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  从您的每日总结自动生成博客文章。
                  与他人分享您的生产力之旅。
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              准备好变得更好了吗？
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              加入成千上万通过博客掌控自己的生产力
              并分享自己旅程的人们。
            </p>
            <Link href="/auth/register">
              <Button size="lg">
                创建您的免费账户
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
