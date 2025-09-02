'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { LoadingError } from '@/components/ui/loading-error'
import { ProductivityInsights } from '@/components/insights/productivity-insights'
import { AdvancedAnalytics } from '@/components/insights/advanced-analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, BarChart3 } from 'lucide-react'
import { useState } from 'react'

export default function InsightsPage() {
  const { user, loading, error } = useAuth()
  const [view, setView] = useState<'basic' | 'advanced'>('basic')

  // 如果用户未登录，显示登录提示
  if (!loading && !error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能查看您的生产力洞察。
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <LoadingError loading={loading} error={error}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              生产力洞察
            </h1>
            <p className="text-muted-foreground mt-1">
              发现您的生产力数据中的模式和关联
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant={view === 'basic' ? 'default' : 'outline'}
              onClick={() => setView('basic')}
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              基础洞察
            </Button>
            <Button
              variant={view === 'advanced' ? 'default' : 'outline'}
              onClick={() => setView('advanced')}
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              高级分析
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {view === 'basic' ? <ProductivityInsights /> : <AdvancedAnalytics />}
      </div>
    </LoadingError>
  )
}