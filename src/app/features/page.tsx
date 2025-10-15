import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Star, Zap, Brain, BarChart3, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: '功能特性 - Be Better Web',
  description: '探索 Be Better Web 的强大功能，助力您的个人成长',
}

export default function FeaturesPage() {
  const features = [
    {
      icon: CheckCircle,
      title: '任务管理',
      description: '创建、组织和跟踪您的任务，设置优先级和截止日期，确保重要事项不被遗漏。',
      color: 'text-blue-600'
    },
    {
      icon: Star,
      title: '习惯追踪',
      description: '建立良好的习惯，通过每日打卡和可视化进度追踪，保持持续的动力。',
      color: 'text-yellow-600'
    },
    {
      icon: Zap,
      title: '日程安排',
      description: '智能日程管理，自动生成每日计划，帮助您高效利用每一分钟。',
      color: 'text-purple-600'
    },
    {
      icon: Brain,
      title: 'AI 助手 (待开发)',
      description: '智能 AI 助手，根据您的需求自动制定计划，解析为可执行的日程任务，让目标管理更加智能高效。',
      color: 'text-green-600'
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '详细的统计报告和洞察，帮助您了解自己的表现，持续改进。',
      color: 'text-red-600'
    },
    {
      icon: Calendar,
      title: '博客记录',
      description: '记录您的成长历程，分享经验心得，建立个人知识库。',
      color: 'text-indigo-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">强大功能，助力成长</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Be Better Web 提供全方位的个人成长工具，帮助您管理任务、培养习惯、追踪进度，
            让每一天都成为更好的自己。
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <Icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-white p-8 rounded-lg shadow mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">为什么选择 Be Better Web？</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">简单易用</h3>
                <p className="text-gray-600">直观的界面设计，无需学习即可上手使用。</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">全方位追踪</h3>
                <p className="text-gray-600">从任务到习惯，从日程到心情，全面记录您的生活。</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">智能提醒</h3>
                <p className="text-gray-600">恰到好处的提醒，让您不错过任何重要事项。</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">数据洞察</h3>
                <p className="text-gray-600">深度分析您的行为模式，提供有价值的改进建议。</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">了解更多</h2>
          <p className="text-gray-600 mb-6">探索 Be Better Web 的强大功能</p>
          <div className="space-x-4">
            <Link href="/blog">
              <Button size="lg">浏览博客</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">关于我们</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}