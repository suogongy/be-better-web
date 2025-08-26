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
        title: 'Error',
        description: 'Failed to load summary data. Please try again.',
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
        title: 'Success',
        description: 'Daily summary generated successfully.',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to generate summary. Please try again.',
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
        title: 'Success',
        description: 'Summary updated successfully.',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update summary. Please try again.',
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
        title: 'Success',
        description: `Blog post "${result.title}" ${blogData.publishImmediately ? 'published' : 'saved as draft'} successfully.`,
        variant: 'success',
      })
      
      setShowBlogForm(false)
      
      // Refresh summary to show updated blog generation status
      loadSummaryData()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to generate blog post. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to access daily summaries.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
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
          <h1 className="text-3xl font-bold">Daily Summary</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily productivity and insights
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
              Daily
            </Button>
            <Button
              variant={currentView === 'trends' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('trends')}
              className="rounded-none border-x-0"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </Button>
            <Button
              variant={currentView === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('weekly')}
              className="rounded-l-none"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Weekly
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
                  Previous Day
                </Button>
                
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                      ? 'Today' 
                      : format(selectedDate, 'EEEE')
                    }
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateDate('next')}
                >
                  Next Day
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={loadSummaryData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading text="Loading summary..." />
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
                <h3 className="text-lg font-semibold mb-2">No Summary Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a summary for {format(selectedDate, 'MMMM d, yyyy')} to track your productivity.
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={handleGenerateSummary}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Summary
                  </Button>
                  <Button variant="outline" onClick={() => setShowSummaryForm(true)}>
                    Manual Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Summaries */}
          {recentSummaries.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Summaries</CardTitle>
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
                          {summary.completed_tasks}/{summary.total_tasks} tasks • {Math.round(summary.completion_rate || 0)}% completion
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(summary.productivity_score || 0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
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