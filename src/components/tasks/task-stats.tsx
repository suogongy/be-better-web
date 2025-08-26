'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { taskService } from '@/lib/supabase/database'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target,
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface TaskStatsProps {
  userId: string
}

interface StatsData {
  total: number
  completed: number
  pending: number
  inProgress: number
  cancelled: number
  completionRate: number
  avgCompletionTime: number
}

export function TaskStats({ userId }: TaskStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<StatsData | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('week')

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const today = new Date()
      const weekStart = startOfWeek(today)
      const weekEnd = endOfWeek(today)
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)

      const [allTimeStats, weekStats, monthStats] = await Promise.all([
        taskService.getTaskStats(userId),
        taskService.getTaskStats(userId, {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        }),
        taskService.getTaskStats(userId, {
          start: monthStart.toISOString(),
          end: monthEnd.toISOString()
        })
      ])

      setStats(allTimeStats)
      setWeeklyStats(weekStats)
      setMonthlyStats(monthStats)
    } catch (error) {
      console.error('Failed to load task statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStats = () => {
    switch (selectedPeriod) {
      case 'week':
        return weeklyStats
      case 'month':
        return monthlyStats
      default:
        return stats
    }
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      default:
        return 'All Time'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading statistics..." />
      </div>
    )
  }

  const currentStats = getCurrentStats()

  if (!currentStats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Statistics Available</h3>
          <p className="text-muted-foreground">
            Start creating and completing tasks to see your productivity analytics.
          </p>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = currentStats.total > 0 
    ? Math.round((currentStats.completed / currentStats.total) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex rounded-lg border p-1">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' }
          ].map(period => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as any)}
              className="text-xs"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{currentStats.total}</p>
              </div>
              <Circle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{currentStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{Math.round(currentStats.completionRate)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Completion Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                <p className="text-2xl font-bold">
                  {currentStats.avgCompletionTime > 0 
                    ? `${Math.round(currentStats.avgCompletionTime)}m`
                    : 'N/A'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Overview - {getPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Task Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-semibold">{currentStats.completed}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-semibold">{currentStats.inProgress}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-semibold">{currentStats.pending}</span>
                </div>
                
                {currentStats.cancelled > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <span className="font-semibold">{currentStats.cancelled}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Productivity Score */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Productivity Score</span>
                  <Badge variant={progressPercentage >= 80 ? 'default' : progressPercentage >= 60 ? 'secondary' : 'destructive'}>
                    {progressPercentage >= 80 ? 'Excellent' : 
                     progressPercentage >= 60 ? 'Good' : 
                     progressPercentage >= 40 ? 'Fair' : 'Needs Improvement'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on your completion rate and task management habits.
                </p>
              </div>

              {/* Insights */}
              <div className="space-y-3">
                {currentStats.completionRate >= 80 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Great job!</p>
                      <p className="text-xs text-green-700">You're maintaining excellent task completion rates.</p>
                    </div>
                  </div>
                )}

                {currentStats.inProgress > currentStats.completed && currentStats.total > 5 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Focus needed</p>
                      <p className="text-xs text-yellow-700">You have more tasks in progress than completed. Consider focusing on fewer tasks at once.</p>
                    </div>
                  </div>
                )}

                {currentStats.avgCompletionTime > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Time tracking</p>
                      <p className="text-xs text-blue-700">
                        Your average task completion time is {Math.round(currentStats.avgCompletionTime)} minutes.
                      </p>
                    </div>
                  </div>
                )}

                {currentStats.total === 0 && (
                  <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Get started</p>
                      <p className="text-xs text-gray-700">Create your first tasks to start tracking your productivity.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      {stats && weeklyStats && monthlyStats && (
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">This Week</p>
                <p className="text-xl font-bold">{weeklyStats.completed}/{weeklyStats.total}</p>
                <p className="text-xs text-muted-foreground">{Math.round(weeklyStats.completionRate)}% completion</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">This Month</p>
                <p className="text-xl font-bold">{monthlyStats.completed}/{monthlyStats.total}</p>
                <p className="text-xs text-muted-foreground">{Math.round(monthlyStats.completionRate)}% completion</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">All Time</p>
                <p className="text-xl font-bold">{stats.completed}/{stats.total}</p>
                <p className="text-xs text-muted-foreground">{Math.round(stats.completionRate)}% completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}