import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'

import type { Task } from '@/types/database'

// Task operations
export const taskService = {
  async getTasks(userId: string, options?: {
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    date?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
    limit?: number
    offset?: number
    sortBy?: 'due_date' | 'priority' | 'created_at' | 'title'
    sortOrder?: 'asc' | 'desc'
    search?: string
  }): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.date) {
      query = query.eq('due_date', options.date)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    // Sorting
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    
    if (sortBy === 'priority') {
      // Custom priority sorting: high -> medium -> low
      query = query.order('priority', { 
        ascending: sortOrder === 'asc' ? false : true,
        foreignTable: undefined,
        nullsFirst: false
      })
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    } else if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch tasks', error)
    }

    return data || []
  },

  async getTaskById(id: string, userId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch task', error)
    }

    return data
  },

  async getTaskCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null)

    if (error) {
      throw new DatabaseError('Failed to fetch task categories', error)
    }

    const categories = [...new Set(data?.map((item: { category: string }) => item.category).filter(Boolean) || [])]
    return categories
  },

  async getTaskStats(userId: string, dateRange?: { start: string; end: string }): Promise<{
    total: number
    completed: number
    pending: number
    inProgress: number
    cancelled: number
    completionRate: number
    avgCompletionTime: number
  }> {
    let query = supabase
      .from('tasks')
      .select('status, actual_minutes, completed_at')
      .eq('user_id', userId)

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch task statistics', error)
    }

    const stats = data?.reduce((acc: {
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
      cancelled: number;
      totalTime: number;
      completedWithTime: number;
    }, task: {
      status: string;
      actual_minutes?: number;
      completed_at?: string;
    }) => {
      acc.total++
      switch (task.status) {
        case 'completed':
          acc.completed++
          if (task.actual_minutes) {
            acc.totalTime += task.actual_minutes
            acc.completedWithTime++
          }
          break
        case 'pending':
          acc.pending++
          break
        case 'in_progress':
          acc.inProgress++
          break
        case 'cancelled':
          acc.cancelled++
          break
      }
      return acc
    }, {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      cancelled: 0,
      totalTime: 0,
      completedWithTime: 0
    }) || {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      cancelled: 0,
      totalTime: 0,
      completedWithTime: 0
    }

    return {
      total: stats.total,
      completed: stats.completed,
      pending: stats.pending,
      inProgress: stats.inProgress,
      cancelled: stats.cancelled,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      avgCompletionTime: stats.completedWithTime > 0 ? stats.totalTime / stats.completedWithTime : 0
    }
  },

  async createTask(task: {
    user_id: string
    title: string
    description?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    progress?: number
    estimated_minutes?: number
    due_date?: string
    due_time?: string
    is_recurring?: boolean
    recurrence_pattern?: Record<string, any>
  }): Promise<Task> {
    const taskData = {
      ...task,
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      progress: 0,
      is_recurring: task.is_recurring || false
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create task', error)
    }

    return data
  },

  async updateTask(id: string, updates: {
    title?: string
    description?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    progress?: number
    estimated_minutes?: number
    actual_minutes?: number
    due_date?: string
    due_time?: string
    completion_notes?: string
    completed_at?: string
  }): Promise<Task> {
    const updateData: Partial<{
      title?: string;
      description?: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high';
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      progress?: number;
      estimated_minutes?: number;
      actual_minutes?: number;
      due_date?: string;
      due_time?: string;
      completion_notes?: string;
      completed_at?: string;
    }> = { ...updates }

    // Auto-set completed_at when marking as completed
    if (updates.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString()
      updateData.progress = 100
    }

    // Clear completed_at when status changes from completed
    if (updates.status && updates.status !== 'completed') {
      updateData.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update task', error)
    }

    return data
  },

  async completeTask(id: string, completionData?: {
    actual_minutes?: number
    completion_notes?: string
  }): Promise<Task> {
    const updates = {
      status: 'completed' as const,
      progress: 100,
      completed_at: new Date().toISOString(),
      ...completionData
    }

    return this.updateTask(id, updates)
  },

  async batchUpdateTasks(taskIds: string[], updates: {
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    category?: string
    priority?: 'low' | 'medium' | 'high'
  }): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .in('id', taskIds)
      .select()

    if (error) {
      throw new DatabaseError('Failed to batch update tasks', error)
    }

    return data || []
  },

  async duplicateTask(id: string, userId: string): Promise<Task> {
    const originalTask = await this.getTaskById(id, userId)
    if (!originalTask) {
      throw new DatabaseError('Task not found')
    }

    const { id: _, created_at, updated_at, completed_at, ...taskData } = originalTask
    
    return this.createTask({
      ...taskData,
      title: `${taskData.title} (Copy)`,
      status: 'pending',
      progress: 0,
      actual_minutes: undefined,
      completion_notes: undefined
    })
  },

  async generateRecurringTasks(userId: string, baseTask: Task, pattern: any, endDate?: Date): Promise<Task[]> {
    const tasks: Task[] = []
    const { type, interval, daysOfWeek, dayOfMonth, maxOccurrences } = pattern
    
    if (!baseTask.due_date) {
      throw new DatabaseError('Base task must have a due date for recurring tasks')
    }

    let currentDate = new Date(baseTask.due_date)
    let occurrenceCount = 0
    const maxDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    const maxOccurs = maxOccurrences || 100 // Safety limit

    while (currentDate <= maxDate && occurrenceCount < maxOccurs) {
      // Skip the first occurrence if it's the same as the base task
      if (occurrenceCount > 0 || currentDate.toISOString().split('T')[0] !== baseTask.due_date) {
        const newTask = await this.createTask({
          ...baseTask,
          id: undefined,
          title: baseTask.title,
          due_date: currentDate.toISOString().split('T')[0],
          status: 'pending',
          progress: 0,
          actual_minutes: undefined,
          completion_notes: undefined,
          completed_at: undefined,
          is_recurring: false, // Individual instances are not recurring
          recurrence_pattern: undefined
        })
        tasks.push(newTask)
      }

      // Calculate next occurrence
      switch (type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval)
          break
        
        case 'weekly':
          if (daysOfWeek && daysOfWeek.length > 0) {
            // Find next occurrence day
            let found = false
            for (let i = 1; i <= 7; i++) {
              const nextDate = new Date(currentDate)
              nextDate.setDate(currentDate.getDate() + i)
              if (daysOfWeek.includes(nextDate.getDay())) {
                currentDate = nextDate
                found = true
                break
              }
            }
            if (!found) {
              // Jump to next week's first day
              currentDate.setDate(currentDate.getDate() + 7 * interval)
              while (!daysOfWeek.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1)
              }
            }
          } else {
            currentDate.setDate(currentDate.getDate() + 7 * interval)
          }
          break
        
        case 'monthly':
          if (dayOfMonth) {
            currentDate.setMonth(currentDate.getMonth() + interval)
            currentDate.setDate(Math.min(dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()))
          } else {
            currentDate.setMonth(currentDate.getMonth() + interval)
          }
          break
        
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + interval)
          break
        
        default:
          throw new DatabaseError('Invalid recurrence type')
      }

      occurrenceCount++
    }

    return tasks
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete task', error)
    }
  },
}