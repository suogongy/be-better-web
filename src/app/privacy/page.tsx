import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Lock, Eye, Server, Cookie, Share2 } from 'lucide-react'

export const metadata: Metadata = {
  title: '隐私政策 - Be Better Web',
  description: 'Be Better Web 的隐私政策和数据处理说明',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">隐私政策</h1>
          <p className="mt-2 text-gray-600">
            最后更新：2024年9月4日
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              我们承诺
            </h2>
            <p className="text-gray-600">
              Be Better Web 承诺保护您的隐私。本隐私政策说明了我们如何收集、使用、
              存储和保护您的个人信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              1. 信息收集
            </h2>
            <p className="text-gray-600 mb-3">
              我们收集以下类型的信息：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>账户信息：</strong>姓名、邮箱地址等注册信息</li>
              <li><strong>使用数据：</strong>任务、习惯、日程等您输入的内容</li>
              <li><strong>日志信息：</strong>访问时间、IP地址、设备信息</li>
              <li><strong>Cookie：</strong>用于改善用户体验</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              2. 信息使用
            </h2>
            <p className="text-gray-600 mb-3">
              我们使用您的信息来：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>提供和改进我们的服务</li>
              <li>个性化您的体验</li>
              <li>发送重要通知</li>
              <li>分析使用情况以优化功能</li>
              <li>防止欺诈和滥用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Server className="mr-2 h-5 w-5" />
              3. 数据存储
            </h2>
            <p className="text-gray-600 mb-3">
              您的数据存储在安全的云服务器上，采用以下保护措施：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>加密存储和传输</li>
              <li>定期备份</li>
              <li>访问权限控制</li>
              <li>安全审计</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Cookie className="mr-2 h-5 w-5" />
              4. Cookie 使用
            </h2>
            <p className="text-gray-600 mb-3">
              我们使用 Cookie 来：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>记住您的登录状态</li>
              <li>保存您的偏好设置</li>
              <li>分析网站使用情况</li>
              <li>提供个性化内容</li>
            </ul>
            <p className="text-gray-600 mt-3">
              您可以通过浏览器设置控制 Cookie，但这可能影响某些功能的使用。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              5. 信息共享
            </h2>
            <p className="text-gray-600 mb-3">
              我们不会出售、交易或转让您的个人信息，除非：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>获得您的明确同意</li>
              <li>法律要求或政府命令</li>
              <li>保护我们的权利和财产</li>
              <li>向信任的服务提供商（需遵守保密协议）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 您的权利</h2>
            <p className="text-gray-600 mb-3">
              您对个人信息拥有以下权利：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>访问和获取您的数据副本</li>
              <li>更正不准确的信息</li>
              <li>删除您的账户和数据</li>
              <li>反对或限制某些处理</li>
              <li>数据可移植性</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 数据安全</h2>
            <p className="text-gray-600">
              我们采取合理的安全措施保护您的数据，包括：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>SSL/TLS 加密</li>
              <li>定期安全评估</li>
              <li>员工培训和保密协议</li>
              <li>入侵检测系统</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 儿童隐私</h2>
            <p className="text-gray-600">
              我们的服务不面向 13 岁以下的儿童。我们不会故意收集儿童的个人信息。
              如果发现收集了儿童信息，我们会立即删除。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. 国际数据传输</h2>
            <p className="text-gray-600">
              您的信息可能被传输并存储到您所在国家或地区以外的服务器。
              我们会采取适当措施确保您的数据得到适当保护。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. 政策更新</h2>
            <p className="text-gray-600">
              我们可能不时更新本隐私政策。重大变更会在网站上通知您。
              继续使用服务即表示您接受更新后的政策。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. 联系我们</h2>
            <p className="text-gray-600">
              如果您对本隐私政策有任何疑问或投诉，请通过 
              <a href="mailto:privacy@bebetterweb.com" className="text-blue-600 hover:underline">
                privacy@bebetterweb.com
              </a> 联系我们。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}