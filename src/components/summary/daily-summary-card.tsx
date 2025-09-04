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
  ExternalLink,
  Plus
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailySummary } from '@/types/database'

interface DailySummaryCardProps {
  summary: DailySummary | null
  userId?: string
  onEdit: () => void
  onRegenerateTasks: () => void
  onGenerateBlog?: () => void
}

export function DailySummaryCard({ summary, userId, onEdit, onRegenerateTasks, onGenerateBlog }: DailySummaryCardProps) {
  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'bg-green-100 text-green-800 border-green-200' }
    if (score >= 60) return { label: '良好', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (score >= 40) return { label: '一般', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: '需改进', color: 'bg-red-100 text-red-800 border-red-200' }
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
    if (!rating) return '未知'
    if (rating >= 5) return '非常高'
    if (rating >= 4) return '高'
    if (rating >= 3) return '中等'
    if (rating >= 2) return '低'
    return '非常低'
  }

  // Handle case when summary is null
  if (!summary) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">暂无总结数据</h3>
        <p className="text-muted-foreground mb-4">
          未找到所选日期的总结数据。
        </p>
        <Button onClick={onEdit}>
          <Plus className="h-4 w-4 mr-2" />
          创建总结
        </Button>
      </div>
    )
  }

  const productivityLevel = getProductivityLevel(summary.productivity_score || 0)

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(parseISO(summary.summary_date), 'EEEE, MMMM d, yyyy', { locale: zhCN })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerateTasks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重新生成
            </Button>
            {onGenerateBlog && (
              <Button variant="outline" size="sm" onClick={onGenerateBlog}>
                <Wand2 className="h-4 w-4 mr-2" />
                生成博客
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
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
              <div className="text-sm text-muted-foreground">任务完成数</div>
              <div className="text-xs text-muted-foreground mt-1">
                完成率 {Math.round(summary.completion_rate || 0)}%
              </div>
            </div>

            {/* Time Tracking */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {summary.total_actual_time || 0}分钟
              </div>
              <div className="text-sm text-muted-foreground">实际用时</div>
              <div className="text-xs text-muted-foreground mt-1">
                对比计划 {summary.total_planned_time || 0}分钟
              </div>
            </div>

            {/* Productivity Score */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {Math.round(summary.productivity_score || 0)}%
              </div>
              <div className="text-sm text-muted-foreground">效率评分</div>
              <Badge className={`text-xs mt-1 ${productivityLevel.color}`}>
                {productivityLevel.label}
              </Badge>
            </div>

            {/* Mood & Energy */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl mb-2">{getMoodEmoji(summary.mood_rating)}</div>
              <div className="text-sm text-muted-foreground">
                心情: {summary.mood_rating || '未评分'}/5
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                精力: {getEnergyLevel(summary.energy_rating)}
              </div>
            </div>
          </div>

          {/* Progress Visualization */}
          {summary.total_tasks > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">任务进度</span>
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
                <span>{summary.completed_tasks} 已完成</span>
                <span>{(summary.total_tasks || 0) - (summary.completed_tasks || 0)} 剩余</span>
              </div>
            </div>
          )}

          {/* Time Efficiency */}
          {summary.total_planned_time && summary.total_actual_time && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">时间效率</span>
                <span className="text-sm text-muted-foreground">
                  {summary.total_planned_time > 0 
                    ? Math.round((summary.total_planned_time / summary.total_actual_time) * 100)
                    : 0
                  }% 高效
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">计划:</span>
                  <span>{summary.total_planned_time}分钟</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">实际:</span>
                  <span>{summary.total_actual_time}分钟</span>
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
                成就
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
                挑战
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
                明日目标
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
              笔记与反思
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
              <span className="font-medium">博客文章已生成</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              已根据此总结自动生成一篇博客文章。
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href={`/blog/${summary.generated_post_id}`} target="_blank">
                查看文章
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}