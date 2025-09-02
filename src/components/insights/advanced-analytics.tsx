'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  RefreshCw,
  PieChart,
  Zap,
  Timer,
  BookOpen,
  CheckCircle
} from 'lucide-react'
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface AnalyticsData {
  productivity: {
    daily: Array<{
      date: string
      productivity: number
      tasks_completed: number
      tasks_total: number
      habits_completed: number
      habits_total: number
      mood: number
    }>
    weekly: Array<{
      week: string
      productivity: number
      task_completion_rate: number
      habit_completion_rate: number
      avg_mood: number
    }>
    monthly: Array<{
      month: string
      productivity: number
      task_completion_rate: number
      habit_completion_rate: number
      avg_mood: number
    }>
  }
  insights: {
    best_time_of_day: string
    worst_time_of_day: string
    most_productive_day: string
    least_productive_day: string
    top_habits: Array<{
      name: string
      impact: number
      completion_rate: number
    }>
    productivity_trends: {
      direction: 'up' | 'down' | 'stable'
      change_percentage: number
    }
    focus_patterns: {
      avg_focus_time: number
      best_focus_periods: string[]
    }
  }
  achievements: Array<{
    id: string
    title: string
    description: string
    date: string
    icon: string
  }>
}

export function AdvancedAnalytics() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const loadAnalytics = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      // 模拟API调用 - 实际项目中需要替换为真实的API
      const mockData: AnalyticsData = generateMockAnalytics()
      setAnalytics(mockData)
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载分析数据失败。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalytics = (): AnalyticsData => {
    // 生成模拟数据
    const generateDailyData = (days: number) => {
      return Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), i)
        return {
          date: format(date, 'yyyy-MM-dd'),
          productivity: Math.floor(Math.random() * 40) + 60,
          tasks_completed: Math.floor(Math.random() * 8) + 2,
          tasks_total: 10,
          habits_completed: Math.floor(Math.random() * 5) + 1,
          habits_total: 6,
          mood: Math.floor(Math.random() * 3) + 3
        }
      }).reverse()
    }

    return {
      productivity: {
        daily: generateDailyData(30),
        weekly: [
          { week: '第1周', productivity: 75, task_completion_rate: 0.8, habit_completion_rate: 0.75, avg_mood: 4 },
          { week: '第2周', productivity: 82, task_completion_rate: 0.85, habit_completion_rate: 0.8, avg_mood: 4.2 },
          { week: '第3周', productivity: 78, task_completion_rate: 0.82, habit_completion_rate: 0.78, avg_mood: 3.8 },
          { week: '第4周', productivity: 85, task_completion_rate: 0.88, habit_completion_rate: 0.85, avg_mood: 4.5 }
        ],
        monthly: [
          { month: '1月', productivity: 72, task_completion_rate: 0.75, habit_completion_rate: 0.7, avg_mood: 3.8 },
          { month: '2月', productivity: 78, task_completion_rate: 0.8, habit_completion_rate: 0.75, avg_mood: 4 },
          { month: '3月', productivity: 82, task_completion_rate: 0.85, habit_completion_rate: 0.8, avg_mood: 4.2 }
        ]
      },
      insights: {
        best_time_of_day: '上午 9-11点',
        worst_time_of_day: '下午 2-4点',
        most_productive_day: '周二',
        least_productive_day: '周五',
        top_habits: [
          { name: '晨间运动', impact: 15, completion_rate: 85 },
          { name: '阅读', impact: 12, completion_rate: 75 },
          { name: '冥想', impact: 10, completion_rate: 70 }
        ],
        productivity_trends: {
          direction: 'up',
          change_percentage: 12.5
        },
        focus_patterns: {
          avg_focus_time: 45,
          best_focus_periods: ['上午 9-11点', '下午 4-6点']
        }
      },
      achievements: [
        { id: '1', title: '连续7天完成任务', description: '保持高效工作一周', date: '2024-01-15', icon: '🔥' },
        { id: '2', title: '习惯达人', description: '完成100个习惯记录', date: '2024-01-10', icon: '⭐' },
        { id: '3', title: '生产力之星', description: '月度生产力达到90%', date: '2024-01-05', icon: '🚀' }
      ]
    }
  }

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="正在加载高级分析..." />
      </div>
    )
  }

  if (!analytics || !user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">需要登录</h3>
        <p className="text-muted-foreground">
          请登录以查看高级分析
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前生产力</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.productivity.daily[analytics.productivity.daily.length - 1]?.productivity || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              较昨日 {analytics.insights.productivity_trends.direction === 'up' ? '+' : ''}
              {analytics.insights.productivity_trends.change_percentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳时段</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.insights.best_time_of_day}
            </div>
            <p className="text-xs text-muted-foreground">
              平均专注 {analytics.insights.focus_patterns.avg_focus_time} 分钟
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">习惯影响</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.insights.top_habits[0]?.impact || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.insights.top_habits[0]?.name || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成就解锁</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.achievements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              本月获得
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <Tabs defaultValue="productivity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productivity">生产力分析</TabsTrigger>
          <TabsTrigger value="habits">习惯洞察</TabsTrigger>
          <TabsTrigger value="patterns">模式识别</TabsTrigger>
          <TabsTrigger value="achievements">成就系统</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                生产力趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">本周平均</span>
                      <Badge variant="secondary">
                        {analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.productivity || 0}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.productivity || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">任务完成率</span>
                      <Badge variant="secondary">
                        {(analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.task_completion_rate * 100 || 0).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.task_completion_rate * 100 || 0)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">习惯完成率</span>
                      <Badge variant="secondary">
                        {(analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.habit_completion_rate * 100 || 0).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${(analytics.productivity.weekly[analytics.productivity.weekly.length - 1]?.habit_completion_rate * 100 || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 日生产力趋势 */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">过去30天生产力趋势</h4>
                  <div className="grid grid-cols-30 gap-1">
                    {analytics.productivity.daily.map((day, index) => (
                      <div key={day.date} className="text-center">
                        <div 
                          className="w-full h-20 bg-secondary rounded-t transition-all hover:bg-primary/20 cursor-pointer"
                          style={{ 
                            height: `${day.productivity * 0.8}px`,
                            backgroundColor: day.productivity >= 80 ? '#10b981' : 
                                             day.productivity >= 60 ? '#3b82f6' : 
                                             day.productivity >= 40 ? '#f59e0b' : '#ef4444'
                          }}
                          title={`${format(new Date(day.date), 'MM/dd')}: ${day.productivity}%`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {index % 5 === 0 ? format(new Date(day.date), 'MM/dd') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                习惯影响力分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.top_habits.map((habit, index) => (
                  <div key={habit.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{habit.name}</div>
                        <div className="text-sm text-muted-foreground">
                          完成率: {habit.completion_rate}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        +{habit.impact}%
                      </div>
                      <div className="text-xs text-muted-foreground">生产力提升</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  精力模式
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">高效时段</span>
                    <Badge variant="default">{analytics.insights.best_time_of_day}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">低效时段</span>
                    <Badge variant="destructive">{analytics.insights.worst_time_of_day}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">最佳工作日</span>
                    <Badge variant="default">{analytics.insights.most_productive_day}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">最具挑战日</span>
                    <Badge variant="secondary">{analytics.insights.least_productive_day}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  专注模式
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analytics.insights.focus_patterns.avg_focus_time}分钟
                    </div>
                    <div className="text-sm text-muted-foreground">平均专注时长</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">最佳专注时段:</div>
                    {analytics.insights.focus_patterns.best_focus_periods.map((period, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {period}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                最近成就
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border rounded-lg text-center">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-medium mb-1">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(achievement.date), 'yyyy年MM月dd日')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}