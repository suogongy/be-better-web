import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Code, Users, Lightbulb } from 'lucide-react'

export const metadata: Metadata = {
  title: '文档 - Be Better Web',
  description: 'Be Better Web 的使用文档和开发指南',
}

export default function DocsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">文档中心</h1>
          <p className="mt-2 text-gray-600">
            学习如何使用 Be Better Web，了解开发详情
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                用户指南
              </h2>
              <div className="space-y-3">
                <Link href="/docs/getting-started" className="block text-blue-600 hover:underline">
                  快速开始 →
                </Link>
                <Link href="/docs/tasks" className="block text-blue-600 hover:underline">
                  任务管理 →
                </Link>
                <Link href="/docs/habits" className="block text-blue-600 hover:underline">
                  习惯追踪 →
                </Link>
                <Link href="/docs/schedule" className="block text-blue-600 hover:underline">
                  日程安排 →
                </Link>
                <Link href="/docs/blog" className="block text-blue-600 hover:underline">
                  博客功能 →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Code className="mr-2 h-5 w-5" />
                开发文档
              </h2>
              <div className="space-y-3">
                <Link href="/docs/api" className="block text-blue-600 hover:underline">
                  API 参考 →
                </Link>
                <Link href="/docs/integration" className="block text-blue-600 hover:underline">
                  第三方集成 →
                </Link>
                <Link href="/docs/webhooks" className="block text-blue-600 hover:underline">
                  Webhooks →
                </Link>
                <Link href="/docs/contributing" className="block text-blue-600 hover:underline">
                  贡献指南 →
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                社区
              </h2>
              <div className="space-y-3">
                <Link href="/docs/community" className="block text-blue-600 hover:underline">
                  社区指南 →
                </Link>
                <Link href="/docs/faq" className="block text-blue-600 hover:underline">
                  常见问题 →
                </Link>
                <Link href="/docs/best-practices" className="block text-blue-600 hover:underline">
                  最佳实践 →
                </Link>
                <Link href="/docs/showcase" className="block text-blue-600 hover:underline">
                  用户案例 →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" />
                其他资源
              </h2>
              <div className="space-y-3">
                <Link href="/docs/videos" className="block text-blue-600 hover:underline">
                  视频教程 →
                </Link>
                <Link href="/docs/templates" className="block text-blue-600 hover:underline">
                  模板库 →
                </Link>
                <Link href="/docs/changelog" className="block text-blue-600 hover:underline">
                  更新日志 →
                </Link>
                <Link href="/docs/roadmap" className="block text-blue-600 hover:underline">
                  产品路线图 →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">需要帮助？</h2>
          <p className="text-gray-600 mb-4">
            如果您在文档中找不到答案，可以：
          </p>
          <div className="space-x-4">
            <Link href="/contact">
              <Button>联系我们</Button>
            </Link>
            <Link href="/help">
              <Button variant="outline">获取帮助</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}