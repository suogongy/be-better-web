import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Target, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: '关于我们 - Be Better Web',
  description: '了解 Be Better Web 的使命和愿景',
}

export default function AboutPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">关于 Be Better Web</h1>
          <p className="mt-2 text-gray-600">
            帮助您成为更好的自己
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">我们的使命</h2>
            <p className="text-gray-600">
              Be Better Web 致力于为每个人提供简单而强大的生产力工具，帮助您设定目标、
              建立习惯、跟踪进度，并最终实现个人成长和自我提升。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <Target className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">目标导向</h3>
              <p className="text-gray-600">
                设定清晰的目标，分解为可执行的任务，让每一步都有明确的方向。
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold mb-2">社区支持</h3>
              <p className="text-gray-600">
                加入志同道合的社区，分享经验，互相激励，共同成长。
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="font-semibold mb-2">简单高效</h3>
              <p className="text-gray-600">
                简洁直观的界面设计，让您专注于最重要的事情，提高工作效率。
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">我们的故事</h2>
            <p className="text-gray-600 mb-4">
              Be Better Web 始于一个简单的想法：每个人都应该有机会成为更好的自己。
              我们相信，通过合适的工具和方法，任何人都可以实现自己的目标和梦想。
            </p>
            <p className="text-gray-600">
              经过不断的发展和改进，我们今天为您提供了一个全面的个人成长平台，
              包括任务管理、习惯追踪、博客记录等功能。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">加入我们</h2>
            <p className="text-gray-600 mb-4">
              准备好开始您的成长之旅了吗？立即注册账号，体验 Be Better Web 带来的改变。
            </p>
            <div className="space-x-4">
              <Link href="/auth/register">
                <Button>免费注册</Button>
              </Link>
              <Link href="/features">
                <Button variant="outline">了解功能</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}