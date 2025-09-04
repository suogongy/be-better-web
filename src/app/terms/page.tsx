import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: '服务条款 - Be Better Web',
  description: 'Be Better Web 的服务条款和使用条件',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">服务条款</h1>
          <p className="mt-2 text-gray-600">
            最后更新：2024年9月4日
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              1. 接受条款
            </h2>
            <p className="text-gray-600">
              使用 Be Better Web 服务即表示您同意受本服务条款的约束。如果您不同意这些条款，
              请不要使用我们的服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              2. 服务描述
            </h2>
            <p className="text-gray-600 mb-3">
              Be Better Web 是一个个人生产力管理平台，提供以下服务：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>任务管理和跟踪</li>
              <li>习惯养成和追踪</li>
              <li>日程安排和规划</li>
              <li>数据分析和报告</li>
              <li>博客内容管理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              3. 用户账户
            </h2>
            <p className="text-gray-600 mb-3">
              3.1 您需要创建账户才能使用某些功能。您同意提供准确、完整和最新的信息。
            </p>
            <p className="text-gray-600 mb-3">
              3.2 您有责任保护账户的安全，并对账户下的所有活动负责。
            </p>
            <p className="text-gray-600">
              3.3 如果发现任何未经授权的使用，请立即通知我们。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 用户行为</h2>
            <p className="text-gray-600 mb-3">
              您同意不会：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>使用服务进行任何非法活动</li>
              <li>侵犯他人的知识产权</li>
              <li>上传恶意软件或病毒</li>
<li>干扰或破坏服务的正常运行</li>
              <li>试图未经授权访问系统或数据</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 数据隐私</h2>
            <p className="text-gray-600">
              我们重视您的隐私。有关我们如何收集、使用和保护您的信息，
              请参阅我们的隐私政策。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 免责声明</h2>
            <p className="text-gray-600 mb-3">
              服务按"现状"提供，不提供任何明示或暗示的保证。我们不保证服务的
              不间断性、准确性或无错误性。
            </p>
            <p className="text-gray-600">
              在法律允许的最大范围内，我们对任何直接、间接、偶然、特殊或后果性
              损害不承担责任。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 服务变更</h2>
            <p className="text-gray-600">
              我们保留随时修改或终止服务的权利，恕不另行通知。我们对您或
              第三方不承担任何责任。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 条款修改</h2>
            <p className="text-gray-600">
              我们可能随时更新这些条款。更新后的条款将在网站上发布时生效。
              继续使用服务即表示您接受修改后的条款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. 联系我们</h2>
            <p className="text-gray-600">
              如果您对这些条款有任何疑问，请通过 <a href="mailto:support@bebetterweb.com" className="text-blue-600 hover:underline">
                support@bebetterweb.com
              </a> 联系我们。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}