import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: '联系我们 - Be Better Web',
  description: '联系我们，获取帮助或提供反馈',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">联系我们</h1>
          <p className="mt-2 text-gray-600">
            有任何问题或建议？我们很乐意听到您的声音。
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              通过邮件联系
            </h2>
            <p className="text-gray-600 mb-4">
              发送邮件至：<a href="mailto:support@bebetterweb.com" className="text-blue-600 hover:underline">
                support@bebetterweb.com
              </a>
            </p>
            <p className="text-gray-600">
              我们通常会在 24 小时内回复您的邮件。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              反馈建议
            </h2>
            <p className="text-gray-600 mb-4">
              您的使用体验对我们非常重要。如果您有任何改进建议或功能需求，请随时告诉我们。
            </p>
            <Link href="/dashboard">
              <Button>访问控制台</Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">常见问题</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">如何开始使用？</h3>
              <p className="text-gray-600">注册账号后，您可以立即开始创建任务、设置目标并跟踪您的进度。</p>
            </div>
            <div>
              <h3 className="font-medium">数据是否安全？</h3>
              <p className="text-gray-600">我们使用 industry-standard 加密技术保护您的数据，并定期进行备份。</p>
            </div>
            <div>
              <h3 className="font-medium">是否支持移动设备？</h3>
              <p className="text-gray-600">是的，Be Better Web 完全响应式设计，支持所有设备。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}