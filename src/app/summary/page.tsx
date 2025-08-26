'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { summaryService } from '@/lib/supabase/database'
import { DailySummaryCard } from '@/components/summary/daily-summary-card'
import { SummaryForm } from '@/components/summary/summary-form'
import { ProductivityChart } from '@/components/summary/productivity-chart'
import { WeeklyInsights } from '@/components/summary/weekly-insights'
import { BlogGenerationForm } from '@/components/summary/blog-generation-form'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Calendar,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { format, parseISO, addDays, subDays } from 'date-fns'
import type { DailySummary } from '@/types/database'

export default function SummaryPage() {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentSummary, setCurrentSummary] = useState<DailySummary | null>(null)
  const [recentSummaries, setRecentSummaries] = useState<DailySummary[]>([])
  const [productivityTrends, setProductivityTrends] = useState<any>(null)
  const [weeklyInsights, setWeeklyInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSummaryForm, setShowSummaryForm] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [currentView, setCurrentView] = useState<'daily' | 'trends' | 'weekly'>('daily')

  // Load data for the selected date
  const loadSummaryData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      const [summary, recentData, trendsData, weeklyData] = await Promise.all([
        summaryService.getSummary(user.id, dateStr),
        summaryService.getSummaries(user.id, { limit: 7 }),
        summaryService.getProductivityTrends(user.id, 30),
        summaryService.getWeeklyInsights(user.id, 0)
      ])
      
      setCurrentSummary(summary)
      setRecentSummaries(recentData)
      setProductivityTrends(trendsData)
      setWeeklyInsights(weeklyData)
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载总结数据失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSummaryData()
    }
  }, [user, selectedDate])

  const handleGenerateSummary = async () => {
    if (!user) return
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const summary = await summaryService.generateDailySummary(user.id, dateStr)
      
      setCurrentSummary(summary)
      addToast({
        title: '成功',
        description: '每日总结生成成功。',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: '错误',
        description: '生成总结失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateSummary = async (updates: any) => {
    if (!user) return
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const summary = await summaryService.updateSummary(user.id, dateStr, updates)
      
      setCurrentSummary(summary)
      setShowSummaryForm(false)
      addToast({
        title: '成功',
        description: '总结更新成功。',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: '错误',
        description: '更新总结失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)
    )
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const handleGenerateBlog = async (blogData: any) => {
    if (!user || !currentSummary) return
    
    try {
      const result = await summaryService.createBlogPostFromSummary(
        user.id,
        currentSummary.id,
        blogData
      )
      
      addToast({
        title: '成功',
        description: `博客文章“${result.title}”${blogData.publishImmediately ? '已发布' : '已保存为草稿'}成功。`,
        variant: 'success',
      })
      
      setShowBlogForm(false)
      
      // Refresh summary to show updated blog generation status
      loadSummaryData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '生成博客文章失败，请重试。',
        variant: 'destructive',
      })
    }
  }

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
              您需要登录才能访问每日总结。
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
          <h1 className="text-3xl font-bold">每日总结</h1>
          <p className="text-muted-foreground mt-1">
            跟踪您的每日生产力和洞察
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {/* View Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={currentView === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('daily')}
              className="rounded-r-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              每日
            </Button>
            <Button
              variant={currentView === 'trends' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('trends')}
              className="rounded-none border-x-0"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              趋势
            </Button>
            <Button
              variant={currentView === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('weekly')}
              className="rounded-l-none"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              周报
            </Button>
          </div>
        </div>
      </div>

      {/* Daily View */}
      {currentView === 'daily' && (
        <>
          {/* Date Navigation */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一天
                </Button>
                
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                      ? '今天' 
                      : format(selectedDate, 'EEEE')
                    }
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateDate('next')}
                >
                  下一天
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  今天
                </Button>
                <Button variant="outline" size="sm" onClick={loadSummaryData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading text="加载总结..." />
            </div>
          ) : currentSummary ? (
            <DailySummaryCard
              summary={currentSummary}
              onEdit={() => setShowSummaryForm(true)}
              onRegenerateTasks={handleGenerateSummary}
              onGenerateBlog={() => setShowBlogForm(true)}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">暂无总结</h3>
                <p className="text-muted-foreground mb-4">
                  为 {format(selectedDate, 'MMMM d, yyyy')} 生成总结来跟踪您的生产力。
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={handleGenerateSummary}>
                    <Plus className="h-4 w-4 mr-2" />
                    生成总结
                  </Button>
                  <Button variant="outline" onClick={() => setShowSummaryForm(true)}>
                    手动输入
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Summaries */}
          {recentSummaries.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>最近的总结</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recentSummaries.slice(0, 5).map(summary => (
                    <div 
                      key={summary.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => setSelectedDate(parseISO(summary.summary_date))}
                    >
                      <div>
                        <div className="font-medium">{format(parseISO(summary.summary_date), 'EEEE, MMM d')}</div>
                        <div className="text-sm text-muted-foreground">
                          {summary.completed_tasks}/{summary.total_tasks} 任务 • {Math.round(summary.completion_rate || 0)}% 完成率
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(summary.productivity_score || 0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">评分</div>
                      </div>
                    </div>
                  ))}\n                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Trends View */}
      {currentView === 'trends' && (
        <ProductivityChart
          data={productivityTrends}
          loading={loading}
        />
      )}

      {/* Weekly View */}
      {currentView === 'weekly' && (
        <WeeklyInsights
          data={weeklyInsights}
          loading={loading}
          onWeekChange={(offset: number) => {
            // Handle week navigation if needed
          }}
        />
      )}

      {/* Summary Form Modal */}
      {showSummaryForm && (
        <SummaryForm
          summary={currentSummary}
          date={format(selectedDate, 'yyyy-MM-dd')}
          onSubmit={handleUpdateSummary}
          onCancel={() => setShowSummaryForm(false)}
        />
      )}
      
      {/* Blog Generation Form Modal */}
      {showBlogForm && currentSummary && (
        <BlogGenerationForm
          summary={currentSummary}
          onGenerate={handleGenerateBlog}
          onCancel={() => setShowBlogForm(false)}
        />
      )}
    </div>
  )
}