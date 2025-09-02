'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { taskService } from '@/lib/supabase/services/index'
import { TaskList } from '@/components/tasks/task-list'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskStats } from '@/components/tasks/task-stats'
import { TaskCalendar } from '@/components/tasks/task-calendar'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TemplateSelector } from '@/components/tasks/template-selector'
import { LoadingError } from '@/components/ui/loading-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, CalendarIcon, BarChart3, LayoutTemplate } from 'lucide-react'
import type { Task } from '@/types/database'

interface TaskFilterOptions {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  category?: string
  priority?: 'low' | 'medium' | 'high'
  search?: string
  sortBy?: 'due_date' | 'priority' | 'created_at' | 'title'
  sortOrder?: 'asc' | 'desc'
  date?: string
}

export default function SchedulePage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const { addToast } = useToast()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: 'due_date',
    sortOrder: 'asc'
  })
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'stats'>('list')

  // Load tasks and categories
  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // 获取基础任务数据
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

  const handleCreateTask = async (taskData: unknown) => {
    if (!user) return
    
    try {
      await taskService.createTask({
        ...taskData as Partial<Task>,
        user_id: user.id
      } as any)
      
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

  const handleApplyTemplate = async (templateId: string, options?: {
    startDate?: Date
    offsetDays?: number
    customizations?: Record<string, any>
  }) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/templates/${templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      })

      if (response.ok) {
        const data = await response.json()
        addToast({
          title: '成功',
          description: `成功应用模板，创建了 ${data.tasks.length} 个任务。`,
          variant: 'success',
        })
        loadData()
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '应用模板失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return
    
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
    if (!user) return
    
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

  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    if (!user) return
    
    try {
      await taskService.updateTask(taskId, { status: newStatus })
      loadData()
    } catch (error) {
      addToast({
        title: '错误',
        description: '移动任务失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleTaskComplete = async (taskId: string, completionData?: {
    actual_minutes?: number
    completion_notes?: string
  }) => {
    if (!user) return
    
    try {
      await taskService.updateTask(taskId, { 
        status: 'completed',
        ...completionData
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

  // 如果用户未登录，显示登录提示
  if (!authLoading && !authError && !user) {
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
    <LoadingError loading={authLoading} error={authError}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">日程安排</h1>
            <p className="text-muted-foreground mt-1">
              管理您的任务、截止日期和日程
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button onClick={() => setShowTaskForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加任务
            </Button>
            <TemplateSelector onApplyTemplate={handleApplyTemplate} />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            onClick={() => setCurrentView('list')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            列表视图
          </Button>
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            日历视图
          </Button>
          <Button
            variant={currentView === 'stats' ? 'default' : 'outline'}
            onClick={() => setCurrentView('stats')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            统计视图
          </Button>
        </div>

        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={(newFilters) => setFilters(newFilters as TaskFilterOptions)}
          categories={categories}
        />

        {/* Content */}
        {currentView === 'list' && (
          <TaskList
            tasks={tasks}
            loading={loading}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onComplete={handleTaskComplete}
            onUpdate={handleUpdateTask}
          />
        )}

        {currentView === 'calendar' && (
          <TaskCalendar
            tasks={tasks}
            onDateClick={handleDateClick}
            onCreateTask={handleCreateTaskForDate}
            onTaskClick={() => {}}
            onTaskMove={() => {}}
          />
        )}

        {currentView === 'stats' && (
          <TaskStats tasks={tasks} />
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
            categories={categories}
          />
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
            onCancel={() => setEditingTask(null)}
            categories={categories}
          />
        )}
      </div>
    </LoadingError>
  )
}