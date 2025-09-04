import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle, MessageSquare, BookOpen, LifeBuoy } from 'lucide-react'

export const metadata: Metadata = {
  title: '帮助中心 - Be Better Web',
  description: '获取 Be Better Web 的使用帮助和技术支持',
}

export default function HelpPage() {
  const helpCategories = [
    {
      icon: BookOpen,
      title: '入门指南',
      description: '新用户快速上手教程',
      links: [
        { text: '如何注册账号', href: '/help/getting-started/signup' },
        { text: '首次登录设置', href: '/help/getting-started/first-login' },
        { text: '界面导览', href: '/help/getting-started/tour' },
      ]
    },
    {
      icon: HelpCircle,
      title: '常见问题',
      description: '用户最常遇到的问题',
      links: [
        { text: '忘记密码怎么办', href: '/help/faq/forgot-password' },
        { text: '如何删除账户', href: '/help/faq/delete-account' },
        { text: '数据如何备份', href: '/help/faq/backup' },
        { text: '同步问题解决', href: '/help/faq/sync' },
      ]
    },
    {
      icon: MessageSquare,
      title: '功能使用',
      description: '各项功能的详细说明',
      links: [
        { text: '任务管理', href: '/help/features/tasks' },
        { text: '习惯追踪', href: '/help/features/habits' },
        { text: '日程安排', href: '/help/features/schedule' },
        { text: '博客功能', href: '/help/features/blog' },
      ]
    },
    {
      icon: LifeBuoy,
      title: '技术支持',
      description: '获取技术帮助',
      links: [
        { text: '联系客服', href: '/contact' },
        { text: '报告问题', href: '/help/support/report-issue' },
        { text: '功能建议', href: '/help/support/feature-request' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">帮助中心</h1>
          <p className="mt-2 text-gray-600">
            我们在这里为您提供帮助
          </p>
        </div>

        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="max-w-2xl">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              搜索帮助文档
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="输入关键词搜索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {helpCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <Icon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {category.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="block text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      {link.text} →
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-blue-50 p-8 rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">没有找到答案？</h2>
            <p className="text-gray-600 mb-6">
              我们的客服团队随时准备为您提供帮助
            </p>
            <div className="space-x-4">
              <Link href="/contact">
                <Button size="lg">联系客服</Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg">查看文档</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">在线支持</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">&lt; 1小时</div>
            <div className="text-gray-600">平均响应时间</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600">满意度</div>
          </div>
        </div>
      </div>
    </div>
  )
}