'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { insightsService } from '@/lib/supabase/advanced-services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { 
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Clock,
  Activity,
  Brain,
  Lightbulb,
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ProductivityCorrelation, WeeklyPattern } from '@/types/advanced'

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dayNamesEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ProductivityInsights() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [correlations, setCorrelations] = useState<ProductivityCorrelation[]>([])
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadInsights = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [correlationsData, patternsData] = await Promise.all([
        insightsService.getProductivityCorrelations(user.id),
        insightsService.getWeeklyPatterns(user.id)
      ])
      
      setCorrelations(correlationsData)
      setWeeklyPatterns(patternsData)
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载生产力洞察失败。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshInsights = async () => {
    if (!user) return
    
    try {
      setRefreshing(true)
      const [correlationsData, patternsData] = await Promise.all([
        insightsService.getProductivityCorrelations(user.id),
        insightsService.getWeeklyPatterns(user.id)
      ])
      
      setCorrelations(correlationsData)
      setWeeklyPatterns(patternsData)
      
      addToast({
        title: '成功',
        description: '生产力洞察已刷新。',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: '错误',
        description: '刷新生产力洞察失败。',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadInsights()
    }
  }, [user])

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getCorrelationColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'moderate':
        return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'weak':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getCorrelationIcon = (impact: number) => {
    if (impact > 10) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (impact > 0) return <Activity className="h-4 w-4 text-blue-600" />
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />
  }

  const bestDay = weeklyPatterns.reduce((best, day) => 
    day.avg_productivity > (best?.avg_productivity || 0) ? day : best
  , weeklyPatterns[0])

  const worstDay = weeklyPatterns.reduce((worst, day) => 
    day.avg_productivity < (worst?.avg_productivity || 100) ? day : worst
  , weeklyPatterns[0])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="正在分析您的生产力模式..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">需要登录</h3>
        <p className="text-muted-foreground">
          请登录以查看您的生产力洞察
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">生产力洞察</h2>
        <button 
          onClick={refreshInsights}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新数据'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳生产力日</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestDay ? dayNames[bestDay.day_of_week] : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              平均 {bestDay?.avg_productivity.toFixed(1)}% 效率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最具挑战日</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {worstDay ? dayNames[worstDay.day_of_week] : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              平均 {worstDay?.avg_productivity.toFixed(1)}% 效率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高任务完成</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyPatterns.reduce((max, day) => 
                Math.max(max, day.task_completion_rate * 100 || 0), 0
              ).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              最高任务完成率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">习惯完成</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyPatterns.reduce((max, day) => 
                Math.max(max, day.avg_habits_completed || 0), 0
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              日均习惯完成数
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              每周模式分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyPatterns.map((pattern) => (
                <div key={`${pattern.day_of_week}-${pattern.day_name}`} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {dayNames[pattern.day_of_week]}
                    </span>
                    <Badge className={getProductivityColor(pattern.avg_productivity || 0)}>
                      {(pattern.avg_productivity || 0).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${Math.min(100, pattern.avg_productivity || 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pattern.task_completion_rate ? `${(pattern.task_completion_rate * 100).toFixed(0)}%` : 'N/A'} 完成率
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              相关性分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlations.map((correlation) => (
                <div key={correlation.habit_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCorrelationIcon(correlation.productivity_impact)}
                    <div>
                      <div className="font-medium capitalize">
                        {correlation.habit_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        习惯完成率: {correlation.completion_rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Badge className={getCorrelationColor(correlation.correlation_strength)}>
                    {(correlation.productivity_impact > 0 ? '+' : '') + correlation.productivity_impact.toFixed(1)}%
                  </Badge>
                </div>
              ))}
              
              {correlations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                  <p>暂无足够的数据来分析相关性</p>
                  <p className="text-sm mt-2">继续使用应用以积累更多数据</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            洞察说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ul className="space-y-2">
              <li><strong>最佳生产力日</strong>：根据您的历史数据，您在这一天通常表现最佳</li>
              <li><strong>最具挑战日</strong>：您在这一天可能需要额外的动力和支持</li>
              <li><strong>每周模式分析</strong>：显示您一周中每天的生产力水平</li>
              <li><strong>相关性分析</strong>：展示您的习惯与整体生产力之间的关系</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              💡 提示：定期查看这些洞察，调整您的计划和习惯，以提高整体生产力。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}