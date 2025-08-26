'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface ProductivityChartProps {
  data: {
    daily: Array<{
      date: string
      completion_rate: number
      productivity_score: number
      total_tasks: number
      completed_tasks: number
    }>
    averages: {
      avg_completion_rate: number
      avg_productivity_score: number
      avg_tasks_per_day: number
      trend_direction: 'up' | 'down' | 'stable'
    }
  } | null
  loading: boolean
}

export function ProductivityChart({ data, loading }: ProductivityChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading productivity trends..." />
      </div>
    )
  }

  if (!data || data.daily.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Trend Data</h3>
          <p className="text-muted-foreground">
            Complete more daily summaries to see your productivity trends.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const maxScore = Math.max(...data.daily.map(d => d.productivity_score), 100)
  const maxTasks = Math.max(...data.daily.map(d => d.total_tasks), 1)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold">{Math.round(data.averages.avg_completion_rate)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Productivity</p>
                <p className="text-2xl font-bold">{Math.round(data.averages.avg_productivity_score)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Tasks/Day</p>
                <p className="text-2xl font-bold">{Math.round(data.averages.avg_tasks_per_day * 10) / 10}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trend</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${getTrendColor(data.averages.trend_direction)}`}>
                  {getTrendIcon(data.averages.trend_direction)}
                  {data.averages.trend_direction === 'up' ? 'Rising' : 
                   data.averages.trend_direction === 'down' ? 'Falling' : 'Stable'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Productivity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Productivity Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Completion Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>Task Volume</span>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.daily.map((day, index) => (
                <div key={day.date} className="flex items-center gap-3 py-2">
                  {/* Date */}
                  <div className="w-20 text-xs text-muted-foreground flex-shrink-0">
                    {format(parseISO(day.date), 'MMM dd')}
                  </div>
                  
                  {/* Productivity Score Bar */}
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        {/* Productivity Score */}
                        <div 
                          className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                          style={{ width: `${(day.productivity_score / maxScore) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {Math.round(day.productivity_score)}%
                          </span>
                        </div>
                        
                        {/* Completion Rate Overlay */}
                        <div 
                          className="absolute top-0 bg-green-500 h-3 rounded-full opacity-70"
                          style={{ width: `${day.completion_rate}%` }}
                        />
                        
                        {/* Task Volume Indicator */}
                        <div 
                          className="absolute bottom-0 bg-gray-400 h-1 rounded-full"
                          style={{ width: `${(day.total_tasks / maxTasks) * 100}%` }}
                        />
                      </div>
                      
                      {/* Values */}
                      <div className="w-24 text-xs text-right">
                        <div>{day.completed_tasks}/{day.total_tasks}</div>
                        <div className="text-muted-foreground">{Math.round(day.completion_rate)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Footer */}
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Showing last {data.daily.length} days of productivity data
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.averages.trend_direction === 'up' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Great Progress!</h4>
                    <p className="text-sm text-green-700">
                      Your productivity is trending upward. Keep up the excellent work!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.averages.trend_direction === 'down' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Room for Improvement</h4>
                    <p className="text-sm text-red-700">
                      Your productivity has been declining. Consider reviewing your task planning and time management strategies.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.averages.avg_completion_rate >= 80 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">High Achiever</h4>
                    <p className="text-sm text-blue-700">
                      You consistently complete most of your tasks. Consider taking on more challenging goals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.averages.avg_completion_rate < 50 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Task Planning Tip</h4>
                    <p className="text-sm text-yellow-700">
                      Consider setting fewer, more achievable daily tasks to build momentum and confidence.
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