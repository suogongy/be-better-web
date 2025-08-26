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
  AlertTriangle
} from 'lucide-react'
import type { ProductivityCorrelation, WeeklyPattern } from '@/types/advanced'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ProductivityInsights() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [correlations, setCorrelations] = useState<ProductivityCorrelation[]>([])
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([])
  const [loading, setLoading] = useState(true)

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
        title: 'Error',
        description: 'Failed to load productivity insights.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
        <Loading text="Analyzing your productivity patterns..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold">{bestDay?.day_name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {bestDay ? Math.round(bestDay.avg_productivity) : 0}% avg productivity
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Habits Impact</p>
                <p className="text-2xl font-bold">{correlations.length}</p>
                <p className="text-xs text-muted-foreground">tracked correlations</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pattern Strength</p>
                <p className="text-2xl font-bold">
                  {correlations.filter(c => c.correlation_strength === 'strong').length}
                </p>
                <p className="text-xs text-muted-foreground">strong correlations</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Productivity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyPatterns.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Pattern Data</h3>
              <p className="text-muted-foreground">
                Complete more daily summaries to see your weekly patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyPatterns.map(day => (
                <div
                  key={day.day_of_week}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 font-medium">
                      {dayNames[day.day_of_week]}
                    </div>
                    <div className="flex items-center gap-2">
                      {day.day_name === bestDay?.day_name && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                      {day.day_name === worstDay?.day_name && worstDay.day_name !== bestDay?.day_name && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {Math.round(day.avg_productivity)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Productivity</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {Math.round(day.avg_mood)}
                      </div>
                      <div className="text-xs text-muted-foreground">Mood</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {Math.round(day.avg_habits_completed)}
                      </div>
                      <div className="text-xs text-muted-foreground">Habits</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {Math.round(day.task_completion_rate)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                    </div>
                    
                    <Badge className={getProductivityColor(day.avg_productivity)}>
                      {day.avg_productivity >= 80 ? 'Excellent' :
                       day.avg_productivity >= 60 ? 'Good' :
                       day.avg_productivity >= 40 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habit Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habit-Productivity Correlations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {correlations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Correlation Data</h3>
              <p className="text-muted-foreground">
                Track habits for a few weeks to see how they impact your productivity.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {correlations.map((correlation, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCorrelationIcon(correlation.productivity_impact)}
                      <div>
                        <div className="font-medium">{correlation.habit_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(correlation.completion_rate)}% completion rate
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {correlation.productivity_impact > 0 ? '+' : ''}{Math.round(correlation.productivity_impact)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                      
                      <Badge className={getCorrelationColor(correlation.correlation_strength)}>
                        {correlation.correlation_strength}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Best Day Insight */}
            {bestDay && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Peak Performance Day</h4>
                    <p className="text-sm text-green-700">
                      You're most productive on {bestDay.day_name}s with an average productivity score of {Math.round(bestDay.avg_productivity)}%. 
                      Consider scheduling your most important tasks on this day.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strong Habit Correlations */}
            {correlations.filter(c => c.correlation_strength === 'strong').length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">High-Impact Habits</h4>
                    <p className="text-sm text-blue-700">
                      You have {correlations.filter(c => c.correlation_strength === 'strong').length} habit{correlations.filter(c => c.correlation_strength === 'strong').length > 1 ? 's' : ''} with strong productivity correlations. 
                      Focus on maintaining these habits for consistent performance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Improvement Opportunity */}
            {worstDay && bestDay && worstDay.day_name !== bestDay.day_name && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Improvement Opportunity</h4>
                    <p className="text-sm text-yellow-700">
                      Your productivity on {worstDay.day_name}s ({Math.round(worstDay.avg_productivity)}%) is lower than your best day. 
                      Try applying successful strategies from {bestDay.day_name}s to improve this day.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Collection Insight */}
            {correlations.length === 0 && weeklyPatterns.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Brain className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800">Building Your Profile</h4>
                    <p className="text-sm text-gray-700">
                      Keep tracking your daily summaries and habits to unlock personalized insights about your productivity patterns.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}