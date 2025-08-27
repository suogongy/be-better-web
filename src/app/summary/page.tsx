'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast-provider'
import { Calendar, Plus, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, BarChart3 } from 'lucide-react'
import { LoadingError } from '@/components/ui/loading-error'
import { DailySummaryCard } from '@/components/summary/daily-summary-card'
import { ProductivityChart } from '@/components/summary/productivity-chart'
import { WeeklyInsights } from '@/components/summary/weekly-insights'
import { SummaryForm } from '@/components/summary/summary-form'
import { BlogGenerationForm } from '@/components/summary/blog-generation-form'
import { summaryService } from '@/lib/supabase/services/index'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { addDays, subDays } from 'date-fns'
import { DailySummary } from '@/types/database'

export default function SummaryPage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const { addToast } = useToast()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentSummary, setCurrentSummary] = useState<DailySummary | null>(null)
  const [recentSummaries, setRecentSummaries] = useState<DailySummary[]>([])
  const [productivityTrends, setProductivityTrends] = useState<unknown>(null)
  const [weeklyInsights, setWeeklyInsights] = useState<unknown>(null)
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
      const updatedSummary = await summaryService.updateSummary(user.id, dateStr, updates)
      
      setCurrentSummary(updatedSummary)
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

  const handleCreateSummary = async (summaryData: any) => {
    if (!user) return
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const summary = await summaryService.createSummary({
        ...summaryData,
        user_id: user.id,
        date: dateStr
      })
      
      setCurrentSummary(summary)
      setShowSummaryForm(false)
      addToast({
        title: '成功',
        description: '总结创建成功。',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建总结失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateBlog = async (blogData: any) => {
    if (!user) return
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const blogPost = await summaryService.generateBlogFromSummary(user.id, dateStr, blogData)
      
      addToast({
        title: '成功',
        description: '博客文章生成成功。',
        variant: 'success',
      })
      
      setShowBlogForm(false)
      // Redirect to the new blog post
      window.open(`/blog/${blogPost.slug}`, '_blank')
    } catch (error) {
      addToast({
        title: '错误',
        description: '生成博客文章失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleRegenerateTasks = async () => {
    if (!user) return
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const summary = await summaryService.regenerateTasks(user.id, dateStr)
      
      setCurrentSummary(summary)
      addToast({
        title: '成功',
        description: '任务重新生成成功。',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: '错误',
        description: '重新生成任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleWeekChange = (weekOffset: number) => {
    setSelectedDate(addDays(selectedDate, weekOffset * 7))
  }

  // 如果用户未登录，显示登录提示
  if (!authLoading && !authError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能查看您的每日总结。
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
    <LoadingError loading={authLoading} error={authError}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">每日总结</h1>
            <p className="text-muted-foreground mt-1">
              记录和回顾您的每日总结
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button onClick={() => setShowSummaryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建总结
            </Button>
            <Button variant="outline" onClick={handleGenerateSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              自动生成
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {format(selectedDate, 'yyyy年MM月dd日')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE')}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentView === 'daily' ? 'default' : 'outline'}
            onClick={() => setCurrentView('daily')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            每日总结
          </Button>
          <Button
            variant={currentView === 'trends' ? 'default' : 'outline'}
            onClick={() => setCurrentView('trends')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            趋势分析
          </Button>
          <Button
            variant={currentView === 'weekly' ? 'default' : 'outline'}
            onClick={() => setCurrentView('weekly')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            周度洞察
          </Button>
        </div>

        {/* Content */}
        {currentView === 'daily' && (
          <DailySummaryCard
            summary={currentSummary}
            onEdit={() => setShowSummaryForm(true)}
            onRegenerateTasks={handleRegenerateTasks}
            onGenerateBlog={currentSummary ? () => setShowBlogForm(true) : undefined}
          />
        )}

        {currentView === 'trends' && (
          <ProductivityChart data={productivityTrends} loading={loading} />
        )}

        {currentView === 'weekly' && (
          <WeeklyInsights data={weeklyInsights} loading={loading} onWeekChange={handleWeekChange} />
        )}

        {/* Summary Form Modal */}
        {showSummaryForm && (
          <SummaryForm
            onSubmit={handleCreateSummary}
            onCancel={() => setShowSummaryForm(false)}
            date={format(selectedDate, 'yyyy-MM-dd')}
            summary={currentSummary}
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
    </LoadingError>
  )
}