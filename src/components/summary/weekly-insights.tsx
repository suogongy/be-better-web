'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface WeeklyInsightsProps {
  data: {
    week_start: string
    week_end: string
    total_tasks: number
    completed_tasks: number
    completion_rate: number
    productivity_score: number
    best_day: string | null
    worst_day: string | null
    daily_breakdown: Array<{
      date: string
      day_name: string
      tasks: number
      completed: number
      score: number
    }>
  } | null
  loading: boolean
  onWeekChange: (offset: number) => void
}

export function WeeklyInsights({ data, loading, onWeekChange }: WeeklyInsightsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading weekly insights..." />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Weekly Data</h3>
          <p className="text-muted-foreground">
            Complete daily summaries to see weekly insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getBestWorstDay = (type: 'best' | 'worst') => {
    const dayData = data.daily_breakdown.find(d => d.date === (type === 'best' ? data.best_day : data.worst_day))
    return dayData ? `${dayData.day_name} (${Math.round(dayData.score)}%)` : 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onWeekChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">
                Week of {format(parseISO(data.week_start), 'MMM d')} - {format(parseISO(data.week_end), 'MMM d, yyyy')}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onWeekChange(1)}
            >
              Next Week
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{data.total_tasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{data.completed_tasks}</p>
                <p className="text-xs text-muted-foreground">{Math.round(data.completion_rate)}% rate</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{Math.round(data.productivity_score)}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Day</p>
                <p className="text-sm font-bold">{getBestWorstDay('best')}</p>
                <p className="text-xs text-muted-foreground">Highest score</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.daily_breakdown.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">
                    {day.day_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(day.date), 'MMM d')}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Tasks */}
                  <div className="text-center">
                    <div className="text-sm font-medium">{day.completed}/{day.tasks}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  
                  {/* Completion Rate */}
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {day.tasks > 0 ? Math.round((day.completed / day.tasks) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                  </div>
                  
                  {/* Score Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(day.score)}`}>
                    {Math.round(day.score)}%
                  </div>
                  
                  {/* Best/Worst Indicators */}
                  <div className="w-6">
                    {day.date === data.best_day && (
                      <div title="Best day">
                        <Award className="h-5 w-5 text-yellow-500" />
                      </div>
                    )}
                    {day.date === data.worst_day && data.worst_day !== data.best_day && (
                      <div title="Lowest performing day">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* High Performance */}
            {data.completion_rate >= 80 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Excellent Week!</h4>
                    <p className="text-sm text-green-700">
                      You completed {Math.round(data.completion_rate)}% of your tasks this week. Outstanding performance!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Patterns */}
            {(() => {
              const weekdayPerformance = data.daily_breakdown.slice(1, 6).reduce((sum, day) => sum + day.score, 0) / 5
              const weekendPerformance = (data.daily_breakdown[0].score + data.daily_breakdown[6].score) / 2
              
              if (weekdayPerformance > weekendPerformance + 10) {
                return (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Weekday Warrior</h4>
                        <p className="text-sm text-blue-700">
                          You perform better during weekdays ({Math.round(weekdayPerformance)}%) than weekends ({Math.round(weekendPerformance)}%). 
                          Consider setting lighter goals for weekends.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              } else if (weekendPerformance > weekdayPerformance + 10) {
                return (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-800">Weekend Energy</h4>
                        <p className="text-sm text-purple-700">
                          You&apos;re more productive on weekends ({Math.round(weekendPerformance)}%) than weekdays ({Math.round(weekdayPerformance)})%. 
                          Consider redistributing some weekend tasks to weekdays.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Low Performance */}
            {data.completion_rate < 50 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Room for Improvement</h4>
                    <p className="text-sm text-yellow-700">
                      This week&apos;s completion rate was {Math.round(data.completion_rate)}%. 
                      Consider setting fewer, more realistic daily goals to build momentum.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Consistency Check */}
            {(() => {
              const scores = data.daily_breakdown.map(d => d.score)
              const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
              const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
              const standardDeviation = Math.sqrt(variance)
              
              if (standardDeviation < 15) {
                return (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800">Consistent Performance</h4>
                        <p className="text-sm text-green-700">
                          Your daily scores were consistent this week, showing good routine and habits.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              } else if (standardDeviation > 25) {
                return (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-800">Variable Performance</h4>
                        <p className="text-sm text-orange-700">
                          Your daily scores varied significantly this week. Consider identifying what made your best days successful.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}