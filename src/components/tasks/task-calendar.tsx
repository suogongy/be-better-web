'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Repeat
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDateClick: (date: Date) => void
  onTaskMove: (taskId: string, newDate: string) => void
  onCreateTask: (date: Date) => void
  className?: string
}

interface CalendarTask extends Task {
  displayDate: Date
}

export function TaskCalendar({ 
  tasks, 
  onTaskClick, 
  onDateClick, 
  onTaskMove, 
  onCreateTask,
  className 
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)

  // Transform tasks to calendar tasks with display dates
  const calendarTasks: CalendarTask[] = tasks
    .filter(task => task.due_date)
    .map(task => ({
      ...task,
      displayDate: parseISO(task.due_date!)
    }))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTasksForDate = (date: Date): CalendarTask[] => {
    return calendarTasks.filter(task => 
      isSameDay(task.displayDate, date)
    )
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 border-red-600'
      case 'medium':
        return 'bg-yellow-500 border-yellow-600'
      case 'low':
        return 'bg-green-500 border-green-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'opacity-60 line-through'
      case 'in_progress':
        return 'border-l-4 border-blue-500'
      case 'cancelled':
        return 'opacity-40 line-through'
      default:
        return ''
    }
  }

  const handleDragStart = (e: React.DragEvent, task: CalendarTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDragOverDate(null)
    
    if (draggedTask && !isSameDay(draggedTask.displayDate, date)) {
      onTaskMove(draggedTask.id, format(date, 'yyyy-MM-dd'))
    }
    
    setDraggedTask(null)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Task Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map(day => {
            const dayTasks = getTasksForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isDragOver = dragOverDate && isSameDay(dragOverDate, day)
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-background min-h-[100px] p-2 cursor-pointer transition-colors",
                  !isCurrentMonth && "text-muted-foreground bg-muted/50",
                  isDayToday && "bg-primary/5 border-primary",
                  isDragOver && "bg-blue-50 border-2 border-blue-300 border-dashed"
                )}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => onDateClick(day)}
              >
                {/* Date Number */}
                <div className={cn(
                  "flex items-center justify-between mb-1",
                  isDayToday && "font-bold text-primary"
                )}>
                  <span className="text-sm">
                    {format(day, 'd')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateTask(day)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Tasks */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                      }}
                      className={cn(
                        "text-xs p-1 rounded cursor-pointer border-l-2 hover:shadow-sm transition-all",
                        getPriorityColor(task.priority),
                        getStatusColor(task.status),
                        "text-white bg-opacity-90"
                      )}
                      title={`${task.title}${task.due_time ? ` at ${task.due_time}` : ''}${task.is_recurring ? ' (重复任务)' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {task.due_time && (
                          <Clock className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {task.title}
                        </span>
                        {task.is_recurring && (
                          <Repeat className="h-3 w-3 flex-shrink-0 text-white" />
                        )}
                      </div>
                      {task.category && (
                        <div className="text-xs opacity-90 truncate">
                          {task.category}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTasks.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>高优先级</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>中优先级</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>低优先级</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded border-l-2 border-blue-700"></div>
            <span>进行中</span>
          </div>
        </div>
        
        {/* Drag Instructions */}
        {draggedTask && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            将 "{draggedTask.title}" 拖动到不同日期以重新安排
          </div>
        )}
      </CardContent>
    </Card>
  )
}