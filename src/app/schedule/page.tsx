'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { taskService } from '@/lib/supabase/database'
import { TaskList } from '@/components/tasks/task-list'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskStats } from '@/components/tasks/task-stats'
import { TaskCalendar } from '@/components/tasks/task-calendar'
import { TaskFilters } from '@/components/tasks/task-filters'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, BarChart3 } from 'lucide-react'
import type { Task } from '@/types/database'

interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  category?: string
  priority?: 'low' | 'medium' | 'high'
  search?: string
  sortBy?: 'due_date' | 'priority' | 'created_at' | 'title'
  sortOrder?: 'asc' | 'desc'
  date?: string
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<TaskFilters>({
    sortBy: 'due_date',
    sortOrder: 'asc'
  })
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'stats'>('list')

  // Load tasks and categories
  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [tasksData, categoriesData] = await Promise.all([
        taskService.getTasks(user.id, {
          ...filters,
          limit: 100
        }),
        taskService.getTaskCategories(user.id)
      ])
      
      setTasks(tasksData)
      setCategories(categoriesData)
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载任务失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters])

  const handleCreateTask = async (taskData: any) => {
    if (!user) return
    
    try {
      await taskService.createTask({
        ...taskData,
        user_id: user.id
      })
      
      addToast({
        title: '成功',
        description: '任务创建成功。',
        variant: 'success',
      })
      
      setShowTaskForm(false)
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await taskService.updateTask(taskId, updates)
      
      addToast({
        title: '成功',
        description: '任务更新成功。',
        variant: 'success',
      })
      
      setEditingTask(null)
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '更新任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId)
      
      addToast({
        title: '成功',
        description: '任务删除成功。',
        variant: 'success',
      })
      
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '删除任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteTask = async (taskId: string, completionData?: any) => {
    try {
      await taskService.completeTask(taskId, completionData)
      
      addToast({
        title: '成功',
        description: '任务完成成功。',
        variant: 'success',
      })
      
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '完成任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleTaskMove = async (taskId: string, newDate: string) => {
    try {
      await taskService.updateTask(taskId, {
        due_date: newDate
      })
      
      addToast({
        title: '成功',
        description: '任务重新安排成功。',
        variant: 'success',
      })
      
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '重新安排任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleDateClick = (date: Date) => {
    // Set filter to show tasks for this specific date
    setFilters({
      ...filters,
      date: date.toISOString().split('T')[0]
    })
    setCurrentView('list')
  }

  const handleCreateTaskForDate = (date: Date) => {
    // Pre-fill the form with the selected date
    setShowTaskForm(true)
    // We'll handle the date pre-filling in the form component later
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能访问您的日程安排。
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">我的日程安排</h1>
          <p className="text-muted-foreground mt-1">
            管理您的任务，保持高效
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {/* View Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={currentView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('list')}
              className="rounded-r-none"
            >
              列表
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('calendar')}
              className="rounded-none border-x-0"
            >
              <Calendar className="h-4 w-4 mr-2" />
              日历
            </Button>
            <Button
              variant={currentView === 'stats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('stats')}
              className="rounded-l-none"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              统计
            </Button>
          </div>
          
          <Button onClick={() => setShowTaskForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新任务
          </Button>
        </div>
      </div>

      {/* Stats View */}
      {currentView === 'stats' && (
        <TaskStats userId={user.id} />
      )}

      {/* List/Calendar View */}
      {(currentView === 'list' || currentView === 'calendar') && (
        <>
          {/* Filters */}
          <TaskFilters
            filters={filters}
            categories={categories}
            onFiltersChange={setFilters}
            className="mb-6"
          />

          {/* Task Content */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading text="加载任务..." />
            </div>
          ) : currentView === 'list' ? (
            <TaskList
              tasks={tasks}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
              onUpdate={handleUpdateTask}
            />
          ) : (
            <TaskCalendar
              tasks={tasks}
              onTaskClick={setEditingTask}
              onDateClick={handleDateClick}
              onTaskMove={handleTaskMove}
              onCreateTask={handleCreateTaskForDate}
            />
          )}
        </>
      )}

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskForm
          task={editingTask}
          categories={categories}
          onSubmit={editingTask ? 
            (data: any) => handleUpdateTask(editingTask.id, data) : 
            handleCreateTask
          }
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}