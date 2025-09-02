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
import { SimpleSummaryForm } from '@/components/summary/simple-summary-form'
import { BlogGenerationForm } from '@/components/summary/blog-generation-form'
import { summaryService } from '@/lib/supabase/services/index'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { addDays, subDays } from 'date-fns'
import { DailySummary } from '@/types/database'
import { DatabaseError } from '@/lib/supabase/services/index'

// 定义错误类型
interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function getErrorMessage(error: unknown) {
  if (isErrorWithMessage(error)) return error.message
  return String(error)
}

// 定义表单数据类型
interface SummaryFormData {
  mood_rating?: number
  energy_rating?: number
  notes?: string
  achievements?: string[]
  challenges?: string[]
  tomorrow_goals?: string[]
}

// 定义博客生成数据类型
interface BlogGenerationData {
  template: 'daily' | 'weekly' | 'monthly'
  includeTaskBreakdown: boolean
  includePersonalNotes: boolean
  includeProductivityStats: boolean
  tone: 'professional' | 'casual' | 'motivational' | 'reflective'
  publishImmediately: boolean
}

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
      
      const summary = await summaryService.getSummary(user.id, dateStr)
      const recentData = await summaryService.getSummaries(user.id, { limit: 7 })
      
      setCurrentSummary(summary)
      setRecentSummaries(recentData)
      // 移除不存在的方法调用
    } catch (error) {
      console.error('加载总结数据失败:', error)
      addToast({
        title: '错误',
        description: `加载总结数据失败: ${getErrorMessage(error)}`,
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
      console.error('生成总结失败:', error)
      addToast({
        title: '错误',
        description: `生成总结失败: ${getErrorMessage(error)}`,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateSummary = async (updates: Partial<DailySummary>) => {
    if (!user || !currentSummary) return
    
    try {
      console.log('更新总结数据:', updates)
      
      // 构建更新数据，只包含有值的字段
      const updateData: any = {}
      
      if (updates.mood_rating !== undefined) {
        updateData.mood_rating = updates.mood_rating
      }
      if (updates.energy_rating !== undefined) {
        updateData.energy_rating = updates.energy_rating
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes
      }
      // 数组字段需要明确包含，即使是空数组
      if (updates.achievements !== undefined) {
        updateData.achievements = updates.achievements
      }
      if (updates.challenges !== undefined) {
        updateData.challenges = updates.challenges
      }
      if (updates.tomorrow_goals !== undefined) {
        updateData.tomorrow_goals = updates.tomorrow_goals
      }
      
      console.log('最终更新数据:', updateData)
      
      const updatedSummary = await summaryService.updateSummary(currentSummary.id, updateData)
      
      // 刷新数据
      await loadSummaryData()
      
      // 关闭表单
      setShowSummaryForm(false)
      
      addToast({
        title: '成功',
        description: '总结更新成功。',
        variant: 'success',
      })
    } catch (error) {
      console.error('更新总结失败:', error)
      addToast({
        title: '错误',
        description: `更新总结失败: ${getErrorMessage(error)}`,
        variant: 'destructive',
      })
      throw error // 重新抛出错误，让表单组件处理
    }
  }

  const handleCreateSummary = async (summaryData: SummaryFormData) => {
    if (!user) return
    
    try {
      console.log('开始创建总结:', summaryData)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      // 构建符合数据库要求的数据
      const createData: any = {
        user_id: user.id,
        summary_date: dateStr,
        total_tasks: 0,
        completed_tasks: 0,
        completion_rate: 0,
        auto_blog_generated: false
      }
      
      // 只有当字段有值时才添加
      if (summaryData.mood_rating !== undefined) {
        createData.mood_rating = summaryData.mood_rating
      }
      if (summaryData.energy_rating !== undefined) {
        createData.energy_rating = summaryData.energy_rating
      }
      if (summaryData.notes) {
        createData.notes = summaryData.notes
      }
      // 数组字段需要明确包含，即使是空数组
      if (summaryData.achievements !== undefined) {
        createData.achievements = summaryData.achievements
      }
      if (summaryData.challenges !== undefined) {
        createData.challenges = summaryData.challenges
      }
      if (summaryData.tomorrow_goals !== undefined) {
        createData.tomorrow_goals = summaryData.tomorrow_goals
      }
      
      console.log('最终提交数据:', createData)
      
      const summary = await summaryService.createSummary(createData)
      
      // 刷新数据
      await loadSummaryData()
      
      // 关闭表单
      setShowSummaryForm(false)
      
      addToast({
        title: '成功',
        description: '总结创建成功。',
        variant: 'success',
      })
    } catch (error) {
      console.error('创建总结失败:', error)
      addToast({
        title: '错误',
        description: `创建总结失败: ${getErrorMessage(error)}`,
        variant: 'destructive',
      })
      throw error // 重新抛出错误，让表单组件处理
    }
  }

  const handleGenerateBlog = async (blogData: BlogGenerationData) => {
    if (!user || !currentSummary) return
    
    try {
      console.log('开始生成博客，数据:', blogData)
      const result = await summaryService.generateBlogFromSummary(user.id, currentSummary.id)
      
      addToast({
        title: '成功',
        description: '博客文章生成成功。',
        variant: 'success',
      })
      
      setShowBlogForm(false)
      // Redirect to the new blog post
      window.open(`/user/${user.id}/blog/${result.post.id}`, '_blank')
    } catch (error) {
      console.error('生成博客文章失败:', error)
      if (error instanceof DatabaseError) {
        console.error('数据库错误详情:', error.originalError)
      }
      addToast({
        title: '错误',
        description: `生成博客文章失败: ${getErrorMessage(error)}`,
        variant: 'destructive',
      })
    }
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
            disabled
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            趋势分析
          </Button>
          <Button
            variant={currentView === 'weekly' ? 'default' : 'outline'}
            onClick={() => setCurrentView('weekly')}
            disabled
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            周度洞察
          </Button>
        </div>

        {/* Content */}
        {currentView === 'daily' && (
          <DailySummaryCard
            summary={currentSummary}
            userId={user?.id}
            onEdit={() => setShowSummaryForm(true)}
            onRegenerateTasks={() => {}}
            onGenerateBlog={currentSummary ? () => setShowBlogForm(true) : undefined}
          />
        )}

        {currentView === 'trends' && (
          <ProductivityChart data={null} loading={loading} />
        )}

        {currentView === 'weekly' && (
          <WeeklyInsights data={null} loading={loading} onWeekChange={() => {}} />
        )}

        {/* Summary Form Modal */}
        {showSummaryForm && (
          <SummaryForm
            onSubmit={currentSummary ? handleUpdateSummary : handleCreateSummary}
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