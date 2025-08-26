'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar,
  Flag,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'
import { format, isToday, isPast, parseISO } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onComplete: (taskId: string, completionData?: any) => void
  onUpdate: (taskId: string, updates: any) => void
}

export function TaskList({ tasks, onEdit, onDelete, onComplete, onUpdate }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      if (newStatus === 'completed') {
        await onComplete(task.id)
      } else {
        await onUpdate(task.id, { status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
      // Handle error appropriately - could show a toast notification
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const formatDueDate = (dueDate?: string, dueTime?: string) => {
    if (!dueDate) return null
    
    const date = parseISO(dueDate)
    const dateStr = isToday(date) 
      ? 'Today' 
      : format(date, 'MMM d')
    
    return dueTime ? `${dateStr} at ${dueTime}` : dateStr
  }

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false
    return isPast(parseISO(dueDate))
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无任务</h3>
            <p>创建您的第一个任务，开始跟踪您的生产力。</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group tasks by status
  const groupedTasks = tasks.reduce((groups, task) => {
    const status = task.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(task)
    return groups
  }, {} as Record<Task['status'], Task[]>)

  const statusOrder: Task['status'][] = ['pending', 'in_progress', 'completed', 'cancelled']
  const statusLabels = {
    pending: '待办',
    in_progress: '进行中', 
    completed: '已完成',
    cancelled: '已取消'
  }

  return (
    <div className="space-y-6">
      {statusOrder.map(status => {
        const statusTasks = groupedTasks[status] || []
        if (statusTasks.length === 0) return null

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">{statusLabels[status]}</h2>
              <Badge variant="secondary" className="text-xs">
                {statusTasks.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {statusTasks.map(task => (
                <Card 
                  key={task.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    task.status === 'completed' && "opacity-75"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Status Checkbox */}
                      <button
                        onClick={() => handleStatusChange(
                          task, 
                          task.status === 'completed' ? 'pending' : 'completed'
                        )}
                        className="mt-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={cn(
                              "font-semibold",
                              task.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {task.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(
                                  task,
                                  task.status === 'in_progress' ? 'pending' : 'in_progress'
                                )}
                                title={task.status === 'in_progress' ? '暂停' : '开始'}
                              >
                                {task.status === 'in_progress' ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(task)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(task.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Task Meta Information */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {/* Priority */}
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getPriorityColor(task.priority))}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            {task.priority}
                          </Badge>

                          {/* Status */}
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getStatusColor(task.status))}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>

                          {/* Category */}
                          {task.category && (
                            <Badge variant="outline" className="text-xs">
                              {task.category}
                            </Badge>
                          )}

                          {/* Due Date */}
                          {task.due_date && (
                            <div className={cn(
                              "flex items-center gap-1 text-muted-foreground",
                              isDueSoon(task.due_date) && task.status !== 'completed' && "text-red-600"
                            )}>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDueDate(task.due_date, task.due_time)}</span>
                            </div>
                          )}

                          {/* Estimated Time */}
                          {task.estimated_minutes && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{task.estimated_minutes}m</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {task.progress > 0 && task.status !== 'completed' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">进度</span>
                              <span className="text-muted-foreground">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Completion Info */}
                        {task.status === 'completed' && task.completed_at && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            已完成 {format(parseISO(task.completed_at), 'MMM d, yyyy \'\u4e8e\' h:mm a')}
                            {task.actual_minutes && (
                              <span className="ml-2">
                                • 耗时 {task.actual_minutes} 分钟
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}