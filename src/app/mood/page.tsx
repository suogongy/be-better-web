'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { LoadingError } from '@/components/ui/loading-error'
import { MoodLogger } from '@/components/mood/mood-logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export default function MoodPage() {
  const { user, loading, error } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleMoodAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  // 如果用户未登录，显示登录提示
  if (!loading && !error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能跟踪您的心情。
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              心情跟踪
            </h1>
            <p className="text-muted-foreground mt-1">
              跟踪您的每日心情、精力和健康状态
            </p>
          </div>
        </div>

        {/* Main Content */}
        <MoodLogger key={refreshKey} onLogAdded={handleMoodAdded} />
      </div>
    </LoadingError>
  )
}