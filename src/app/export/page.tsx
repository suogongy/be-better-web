'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { DataExporter } from '@/components/export/data-exporter'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'

export default function ExportPage() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能导出您的数据。
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Download className="h-8 w-8 text-blue-600" />
            数据导出
          </h1>
          <p className="text-muted-foreground mt-1">
            导出您的生产力数据用于备份或分析
          </p>
        </div>
      </div>

      {/* Main Content */}
      <DataExporter />
    </div>
  )
}