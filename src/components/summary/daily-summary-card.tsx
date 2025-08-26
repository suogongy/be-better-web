'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit,
  RefreshCw,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  Star,
  AlertTriangle,
  Calendar,
  Wand2,
  ExternalLink
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { DailySummary } from '@/types/database'

interface DailySummaryCardProps {
  summary: DailySummary
  onEdit: () => void
  onRegenerateTasks: () => void
  onGenerateBlog?: () => void
}

export function DailySummaryCard({ summary, onEdit, onRegenerateTasks, onGenerateBlog }: DailySummaryCardProps) {
  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' }
    if (score >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  const getMoodEmoji = (rating?: number) => {
    if (!rating) return '😐'
    if (rating >= 5) return '😄'
    if (rating >= 4) return '😊'
    if (rating >= 3) return '😐'
    if (rating >= 2) return '😔'
    return '😢'
  }

  const getEnergyLevel = (rating?: number) => {
    if (!rating) return 'Unknown'
    if (rating >= 5) return 'Very High'
    if (rating >= 4) return 'High'
    if (rating >= 3) return 'Medium'
    if (rating >= 2) return 'Low'
    return 'Very Low'
  }

  const productivityLevel = getProductivityLevel(summary.productivity_score || 0)

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(parseISO(summary.summary_date), 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerateTasks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            {onGenerateBlog && (
              <Button variant="outline" size="sm" onClick={onGenerateBlog}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Blog
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Task Completion */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {summary.completed_tasks}/{summary.total_tasks}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(summary.completion_rate || 0)}% completion rate
              </div>
            </div>

            {/* Time Tracking */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {summary.total_actual_time || 0}m
              </div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
              <div className="text-xs text-muted-foreground mt-1">
                vs {summary.total_planned_time || 0}m planned
              </div>
            </div>

            {/* Productivity Score */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {Math.round(summary.productivity_score || 0)}%
              </div>
              <div className="text-sm text-muted-foreground">Productivity</div>
              <Badge className={`text-xs mt-1 ${productivityLevel.color}`}>
                {productivityLevel.label}
              </Badge>
            </div>

            {/* Mood & Energy */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl mb-2">{getMoodEmoji(summary.mood_rating)}</div>
              <div className="text-sm text-muted-foreground">
                Mood: {summary.mood_rating || 'Not rated'}/5
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Energy: {getEnergyLevel(summary.energy_rating)}
              </div>
            </div>
          </div>

          {/* Progress Visualization */}
          {summary.total_tasks > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Task Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(summary.completion_rate || 0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${summary.completion_rate || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{summary.completed_tasks} completed</span>
                <span>{(summary.total_tasks || 0) - (summary.completed_tasks || 0)} remaining</span>
              </div>
            </div>
          )}

          {/* Time Efficiency */}
          {summary.total_planned_time && summary.total_actual_time && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Time Efficiency</span>
                <span className="text-sm text-muted-foreground">
                  {summary.total_planned_time > 0 
                    ? Math.round((summary.total_planned_time / summary.total_actual_time) * 100)
                    : 0
                  }% efficient
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planned:</span>
                  <span>{summary.total_planned_time}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual:</span>
                  <span>{summary.total_actual_time}m</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements */}
        {summary.achievements && summary.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Star className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Challenges */}
        {summary.challenges && summary.challenges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{challenge}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tomorrow's Goals */}
        {summary.tomorrow_goals && summary.tomorrow_goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="h-5 w-5" />
                Tomorrow's Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.tomorrow_goals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {summary.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes & Reflections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Blog Generation */}
      {summary.auto_blog_generated && summary.generated_post_id && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Blog Post Generated</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              A blog post has been automatically generated from this summary.
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href={`/blog/post/${summary.generated_post_id}`} target="_blank">
                View Post
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}