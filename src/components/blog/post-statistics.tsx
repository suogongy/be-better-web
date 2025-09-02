'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  MessageCircle, 
  Heart, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  Users,
  Clock
} from 'lucide-react'
import { format, subDays, subWeeks, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface PostStats {
  id: string
  title: string
  view_count: number
  comment_count: number
  like_count: number
  share_count: number
  published_at: string
  daily_views: Array<{
    date: string
    views: number
  }>
  top_referrers: Array<{
    source: string
    count: number
  }>
  engagement_rate: number
  avg_reading_time: number
}

interface PostStatisticsProps {
  postId: string
  className?: string
}

export function PostStatistics({ postId, className }: PostStatisticsProps) {
  const [stats, setStats] = useState<PostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  // 模拟获取统计数据
  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // 这里应该是真实的API调用
      const mockStats: PostStats = {
        id: postId,
        title: '示例文章标题',
        view_count: 1250,
        comment_count: 23,
        like_count: 89,
        share_count: 15,
        published_at: '2024-01-01',
        daily_views: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
          views: Math.floor(Math.random() * 100) + 20
        })).reverse(),
        top_referrers: [
          { source: 'Google', count: 450 },
          { source: '直接访问', count: 320 },
          { source: 'Twitter', count: 180 },
          { source: 'LinkedIn', count: 120 },
          { source: '其他', count: 180 }
        ],
        engagement_rate: 8.5,
        avg_reading_time: 3.5
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [postId, timeRange])

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getChangePercentage = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            文章统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  // 计算时间段内的数据
  const getViewsForTimeRange = () => {
    const now = new Date()
    let days = 7
    
    switch (timeRange) {
      case 'day':
        days = 1
        break
      case 'month':
        days = 30
        break
      default:
        days = 7
    }
    
    const recentViews = stats.daily_views.slice(-days)
    return recentViews.reduce((sum, day) => sum + day.views, 0)
  }

  const getPreviousPeriodViews = () => {
    const now = new Date()
    let days = 7
    let previousDays = 7
    
    switch (timeRange) {
      case 'day':
        days = 1
        previousDays = 1
        break
      case 'month':
        days = 30
        previousDays = 30
        break
      default:
        days = 7
        previousDays = 7
    }
    
    const previousViews = stats.daily_views.slice(-(days + previousDays), -days)
    return previousViews.reduce((sum, day) => sum + day.views, 0)
  }

  const currentViews = getViewsForTimeRange()
  const previousViews = getPreviousPeriodViews()
  const changePercentage = getChangePercentage(currentViews, previousViews)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            文章统计
          </CardTitle>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">浏览量</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(currentViews)}</div>
            <div className="flex items-center justify-center gap-1 text-xs">
              {changePercentage > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : changePercentage < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-600" />
              ) : null}
              <span className={changePercentage > 0 ? 'text-green-600' : changePercentage < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                {changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">评论</span>
            </div>
            <div className="text-2xl font-bold">{stats.comment_count}</div>
            <div className="text-xs text-muted-foreground">
              参与度 {(stats.engagement_rate * 10).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">点赞</span>
            </div>
            <div className="text-2xl font-bold">{stats.like_count}</div>
            <div className="text-xs text-muted-foreground">
              {((stats.like_count / stats.view_count) * 100).toFixed(1)}% 点赞率
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">阅读时长</span>
            </div>
            <div className="text-2xl font-bold">{stats.avg_reading_time}分</div>
            <div className="text-xs text-muted-foreground">
              平均停留时间
            </div>
          </div>
        </div>

        {/* 流量来源 */}
        <div>
          <h4 className="font-medium mb-3">流量来源</h4>
          <div className="space-y-2">
            {stats.top_referrers.map((referrer, index) => (
              <div key={referrer.source} className="flex items-center justify-between">
                <span className="text-sm">{referrer.source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(referrer.count / stats.view_count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-12 text-right">
                    {formatNumber(referrer.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 发布信息 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            发布于 {format(new Date(stats.published_at), 'yyyy年MM月dd日', { locale: zhCN })}
          </div>
          <Badge variant="outline">
            总浏览量 {formatNumber(stats.view_count)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}