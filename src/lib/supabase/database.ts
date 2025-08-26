import { supabase } from './client'
import type { User, Post, Category, Tag, Comment, Task, DailySummary } from '@/types/database'

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// User operations
export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new DatabaseError('Failed to fetch user profile', error)
    }

    return data
  },

  async updateProfile(userId: string, updates: any): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update user profile', error)
    }

    return data
  },

  async createProfile(user: { id: string; email: string; name?: string }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create user profile', error)
    }

    return data
  },
}

// Post operations
export const postService = {
  async getPosts(options?: {
    status?: 'draft' | 'published' | 'archived'
    userId?: string
    limit?: number
    offset?: number
    search?: string
    category?: string
    tag?: string
  }): Promise<{ data: Post[]; total: number }> {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })

    // Apply filters
    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`)
    }

    // For now, skip category and tag filtering until we have proper junction table queries
    // TODO: Implement category and tag filtering with proper joins

    // Apply ordering
    query = query.order('published_at', { ascending: false, nullsFirst: false })
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    if (options?.limit) {
      const offset = options?.offset || 0
      query = query.range(offset, offset + options.limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch posts', error)
    }

    return {
      data: data || [],
      total: count || 0
    }
  },

  // Simplified method for basic post fetching without joins
  async getPostsSimple(options?: {
    status?: 'draft' | 'published' | 'archived'
    userId?: string
    limit?: number
    offset?: number
  }): Promise<Post[]> {
    let query = supabase.from('posts').select('*')

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch posts', error)
    }

    return data || []
  },

  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch post', error)
    }

    return data
  },

  async getPostBySlug(slug: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch post by slug', error)
    }

    return data
  },

  async createPost(post: any): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert(post as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create post', error)
    }

    return data
  },

  async updatePost(id: string, updates: any): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update post', error)
    }

    return data
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete post', error)
    }
  },

  async incrementViewCount(id: string): Promise<void> {
    // Simple increment - fetch current count, then update
    const { data: currentPost } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', id)
      .single()
    
    if (currentPost) {
      const { error } = await supabase
        .from('posts')
        .update({ view_count: (currentPost.view_count || 0) + 1 } as any)
        .eq('id', id)

      if (error) {
        throw new DatabaseError('Failed to increment view count', error)
      }
    }
  },
}

// Category operations
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch categories', error)
    }

    return data || []
  },

  async createCategory(category: any): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create category', error)
    }

    return data
  },

  async updateCategory(id: string, updates: any): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update category', error)
    }

    return data
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete category', error)
    }
  },
}

// Tag operations
export const tagService = {
  async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch tags', error)
    }

    return data || []
  },

  async createTag(tag: { name: string; slug: string }): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create tag', error)
    }

    return data
  },

  async updateTag(id: string, updates: any): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update tag', error)
    }

    return data
  },

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete tag', error)
    }
  },
}

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

    const categories = [...new Set(data?.map(item => item.category).filter(Boolean) || [])]
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

    const stats = data?.reduce((acc, task) => {
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
      .insert(taskData as any)
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
  }): Promise<Task> {
    const updateData = { ...updates }

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

// Daily summary operations
export const summaryService = {
  async getSummary(userId: string, date: string): Promise<DailySummary | null> {
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch daily summary', error)
    }

    return data
  },

  async getSummaries(userId: string, options?: {
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<DailySummary[]> {
    let query = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('summary_date', { ascending: false })

    if (options?.startDate) {
      query = query.gte('summary_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('summary_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch daily summaries', error)
    }

    return data || []
  },

  async generateDailySummary(userId: string, date: string): Promise<DailySummary> {
    // Get tasks for the specified date
    const tasks = await taskService.getTasks(userId, {
      date: date
    })

    // Calculate summary metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    const totalPlannedTime = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
    const totalActualTime = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.actual_minutes || 0), 0)
    
    // Calculate productivity score based on multiple factors
    let productivityScore = 0
    if (totalTasks > 0) {
      const completionFactor = completionRate / 100 // 0-1
      const timeFactor = totalPlannedTime > 0 && totalActualTime > 0 
        ? Math.min(totalPlannedTime / totalActualTime, 2) / 2 // 0-1, capped at 2x efficiency
        : 0.5 // neutral if no time data
      const taskVolumeFactor = Math.min(totalTasks / 5, 1) // 0-1, normalized to 5 tasks
      
      productivityScore = ((completionFactor * 0.5) + (timeFactor * 0.3) + (taskVolumeFactor * 0.2)) * 100
    }

    const summaryData = {
      user_id: userId,
      summary_date: date,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: Math.round(completionRate * 100) / 100,
      total_planned_time: totalPlannedTime,
      total_actual_time: totalActualTime,
      productivity_score: Math.round(productivityScore * 100) / 100,
      auto_blog_generated: false
    }

    // Check if summary already exists
    const existingSummary = await this.getSummary(userId, date)
    if (existingSummary) {
      return this.updateSummary(userId, date, summaryData)
    } else {
      return this.createSummary(summaryData)
    }
  },

  async createSummary(summary: {
    user_id: string
    summary_date: string
    total_tasks?: number
    completed_tasks?: number
    completion_rate?: number
    total_planned_time?: number
    total_actual_time?: number
    productivity_score?: number
    mood_rating?: number
    energy_rating?: number
    notes?: string
    achievements?: any[]
    challenges?: any[]
    tomorrow_goals?: any[]
    auto_blog_generated?: boolean
  }): Promise<DailySummary> {
    const { data, error } = await supabase
      .from('daily_summaries')
      .insert(summary as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create daily summary', error)
    }

    return data
  },

  async updateSummary(userId: string, date: string, updates: {
    total_tasks?: number
    completed_tasks?: number
    completion_rate?: number
    total_planned_time?: number
    total_actual_time?: number
    productivity_score?: number
    mood_rating?: number
    energy_rating?: number
    notes?: string
    achievements?: any[]
    challenges?: any[]
    tomorrow_goals?: any[]
    auto_blog_generated?: boolean
    generated_post_id?: string
  }): Promise<DailySummary> {
    const { data, error } = await supabase
      .from('daily_summaries')
      .update(updates)
      .eq('user_id', userId)
      .eq('summary_date', date)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update daily summary', error)
    }

    return data
  },

  async deleteSummary(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('daily_summaries')
      .delete()
      .eq('user_id', userId)
      .eq('summary_date', date)

    if (error) {
      throw new DatabaseError('Failed to delete daily summary', error)
    }
  },

  async getProductivityTrends(userId: string, days: number = 30): Promise<{
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
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const summaries = await this.getSummaries(userId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: days
    })

    const daily = summaries.map(s => ({
      date: s.summary_date,
      completion_rate: s.completion_rate || 0,
      productivity_score: s.productivity_score || 0,
      total_tasks: s.total_tasks || 0,
      completed_tasks: s.completed_tasks || 0
    }))

    // Calculate averages
    const avg_completion_rate = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.completion_rate, 0) / daily.length 
      : 0
    
    const avg_productivity_score = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.productivity_score, 0) / daily.length 
      : 0
    
    const avg_tasks_per_day = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.total_tasks, 0) / daily.length 
      : 0

    // Calculate trend direction (simple linear trend)
    let trend_direction: 'up' | 'down' | 'stable' = 'stable'
    if (daily.length >= 7) {
      const recentWeek = daily.slice(0, 7)
      const olderWeek = daily.slice(-7)
      
      const recentAvg = recentWeek.reduce((sum, d) => sum + d.productivity_score, 0) / recentWeek.length
      const olderAvg = olderWeek.reduce((sum, d) => sum + d.productivity_score, 0) / olderWeek.length
      
      if (recentAvg > olderAvg + 5) trend_direction = 'up'
      else if (recentAvg < olderAvg - 5) trend_direction = 'down'
    }

    return {
      daily: daily.reverse(), // Most recent first
      averages: {
        avg_completion_rate: Math.round(avg_completion_rate * 100) / 100,
        avg_productivity_score: Math.round(avg_productivity_score * 100) / 100,
        avg_tasks_per_day: Math.round(avg_tasks_per_day * 100) / 100,
        trend_direction
      }
    }
  },

  async getWeeklyInsights(userId: string, weekOffset: number = 0): Promise<{
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
  }> {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() - (weekOffset * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const summaries = await this.getSummaries(userId, {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0]
    })

    const dailyBreakdown = []
    let totalTasks = 0
    let completedTasks = 0
    let totalScore = 0
    let bestDay: string | null = null
    let worstDay: string | null = null
    let bestScore = -1
    let worstScore = 101

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(weekStart.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const summary = summaries.find(s => s.summary_date === dateStr)
      const dayTasks = summary?.total_tasks || 0
      const dayCompleted = summary?.completed_tasks || 0
      const dayScore = summary?.productivity_score || 0

      totalTasks += dayTasks
      completedTasks += dayCompleted
      totalScore += dayScore

      if (dayScore > bestScore) {
        bestScore = dayScore
        bestDay = dateStr
      }
      if (dayScore < worstScore && dayTasks > 0) {
        worstScore = dayScore
        worstDay = dateStr
      }

      dailyBreakdown.push({
        date: dateStr,
        day_name: dayNames[currentDate.getDay()],
        tasks: dayTasks,
        completed: dayCompleted,
        score: dayScore
      })
    }

    return {
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      productivity_score: totalScore / 7,
      best_day: bestDay,
      worst_day: worstDay,
      daily_breakdown: dailyBreakdown
    }
  },

  async generateBlogPost(userId: string, summaryId: string, template: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const summary = await this.getSummary(userId, summaryId)
    if (!summary) {
      throw new DatabaseError('Summary not found')
    }

    const tasks = await taskService.getTasks(userId, {
      date: summary.summary_date
    })

    // Generate blog content based on template
    switch (template) {
      case 'daily':
        return this.generateDailyBlogPost(summary, tasks)
      case 'weekly':
        return this.generateWeeklyBlogPost(userId, summary.summary_date)
      case 'monthly':
        return this.generateMonthlyBlogPost(userId, summary.summary_date)
      default:
        return this.generateDailyBlogPost(summary, tasks)
    }
  },

  private async generateDailyBlogPost(summary: DailySummary, tasks: any[]): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const date = new Date(summary.summary_date)
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const completionRate = Math.round(summary.completion_rate || 0)
    const productivityScore = Math.round(summary.productivity_score || 0)
    
    // Generate title
    let title: string
    if (productivityScore >= 80) {
      title = `Crushing It: A Highly Productive ${dateStr}`
    } else if (productivityScore >= 60) {
      title = `Steady Progress: My ${dateStr} Journey`
    } else if (productivityScore >= 40) {
      title = `Mixed Results: Lessons from ${dateStr}`
    } else {
      title = `Learning & Growing: Reflections on ${dateStr}`
    }

    // Generate content
    let content = `# ${title}\n\n`
    
    content += `Today was ${dateStr}, and I wanted to share my daily productivity journey with you.\n\n`
    
    // Overview section
    content += `## 📊 Daily Overview\n\n`
    content += `- **Tasks Completed**: ${summary.completed_tasks}/${summary.total_tasks} (${completionRate}%)\n`
    content += `- **Productivity Score**: ${productivityScore}%\n`
    
    if (summary.total_planned_time && summary.total_actual_time) {
      const efficiency = Math.round((summary.total_planned_time / summary.total_actual_time) * 100)
      content += `- **Time Efficiency**: ${efficiency}% (${summary.total_actual_time}m spent vs ${summary.total_planned_time}m planned)\n`
    }
    
    if (summary.mood_rating) {
      const moodText = summary.mood_rating >= 4 ? 'Great' : summary.mood_rating >= 3 ? 'Good' : 'Challenging'
      content += `- **Mood**: ${moodText} (${summary.mood_rating}/5)\n`
    }
    
    if (summary.energy_rating) {
      const energyText = summary.energy_rating >= 4 ? 'High' : summary.energy_rating >= 3 ? 'Medium' : 'Low'
      content += `- **Energy Level**: ${energyText} (${summary.energy_rating}/5)\n`
    }
    
    content += `\n`

    // Achievements section
    if (summary.achievements && summary.achievements.length > 0) {
      content += `## 🎉 Today's Achievements\n\n`
      summary.achievements.forEach((achievement: string) => {
        content += `- ${achievement}\n`
      })
      content += `\n`
    }

    // Challenges section
    if (summary.challenges && summary.challenges.length > 0) {
      content += `## 🧗 Challenges Faced\n\n`
      summary.challenges.forEach((challenge: string) => {
        content += `- ${challenge}\n`
      })
      content += `\n`
    }

    // Task breakdown
    if (tasks.length > 0) {
      content += `## ✅ Task Breakdown\n\n`
      const completedTasks = tasks.filter(t => t.status === 'completed')
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
      const pendingTasks = tasks.filter(t => t.status === 'pending')
      
      if (completedTasks.length > 0) {
        content += `**Completed:**\n`
        completedTasks.forEach((task: any) => {
          content += `- ✅ ${task.title}${task.category ? ` (${task.category})` : ''}\n`
        })
        content += `\n`
      }
      
      if (inProgressTasks.length > 0) {
        content += `**In Progress:**\n`
        inProgressTasks.forEach((task: any) => {
          content += `- 🔄 ${task.title} (${task.progress || 0}% complete)\n`
        })
        content += `\n`
      }
      
      if (pendingTasks.length > 0) {
        content += `**Pending:**\n`
        pendingTasks.forEach((task: any) => {
          content += `- ⏳ ${task.title}\n`
        })
        content += `\n`
      }
    }

    // Tomorrow's goals
    if (summary.tomorrow_goals && summary.tomorrow_goals.length > 0) {
      content += `## 🎯 Tomorrow's Goals\n\n`
      summary.tomorrow_goals.forEach((goal: string) => {
        content += `- ${goal}\n`
      })
      content += `\n`
    }

    // Personal notes
    if (summary.notes) {
      content += `## 💭 Personal Reflections\n\n`
      content += `${summary.notes}\n\n`
    }

    // Closing
    content += `## 🚀 Wrapping Up\n\n`
    if (productivityScore >= 70) {
      content += `Overall, today was a productive day! I'm feeling good about the progress made and looking forward to tomorrow's challenges.\n\n`
    } else if (productivityScore >= 50) {
      content += `Today had its ups and downs, but I learned valuable lessons that will help me improve tomorrow.\n\n`
    } else {
      content += `Today was challenging, but every difficult day teaches us something valuable. Tomorrow is a new opportunity to grow and improve.\n\n`
    }
    
    content += `How was your day? I'd love to hear about your own productivity journey in the comments below!\n\n`
    content += `---\n\n*This post was automatically generated from my daily productivity tracking. I believe in transparency and sharing both successes and struggles on the path to continuous improvement.*`

    // Generate excerpt
    const excerpt = `A reflection on my ${dateStr} productivity journey - completed ${summary.completed_tasks}/${summary.total_tasks} tasks with a ${productivityScore}% productivity score.`

    // Generate tags
    const tags = ['daily-summary', 'productivity', 'self-improvement']
    if (productivityScore >= 80) tags.push('high-performance')
    if (summary.achievements && summary.achievements.length > 0) tags.push('achievements')
    if (summary.challenges && summary.challenges.length > 0) tags.push('lessons-learned')
    if (summary.mood_rating && summary.mood_rating >= 4) tags.push('positive-mindset')
    
    // Add category-based tags
    const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))]
    categories.forEach(category => {
      if (category && category.length > 0) {
        tags.push(category.toLowerCase().replace(/\s+/g, '-'))
      }
    })

    return {
      title,
      content,
      excerpt,
      tags: tags.slice(0, 10) // Limit to 10 tags
    }
  },

  private async generateWeeklyBlogPost(userId: string, date: string): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const weeklyData = await this.getWeeklyInsights(userId, 0)
    
    const title = `Weekly Wrap-Up: Productivity Insights for ${weeklyData.week_start} to ${weeklyData.week_end}`
    
    let content = `# ${title}\n\n`
    content += `This week was filled with challenges, achievements, and valuable lessons. Here's my comprehensive weekly productivity review.\n\n`
    
    // Weekly stats
    content += `## 📈 Weekly Statistics\n\n`
    content += `- **Total Tasks**: ${weeklyData.total_tasks}\n`
    content += `- **Completed**: ${weeklyData.completed_tasks} (${Math.round(weeklyData.completion_rate)}%)\n`
    content += `- **Average Productivity Score**: ${Math.round(weeklyData.productivity_score)}%\n`
    
    if (weeklyData.best_day) {
      const bestDayData = weeklyData.daily_breakdown.find(d => d.date === weeklyData.best_day)
      content += `- **Best Day**: ${bestDayData?.day_name} (${Math.round(bestDayData?.score || 0)}% productivity)\n`
    }
    
    content += `\n## 📊 Daily Breakdown\n\n`
    weeklyData.daily_breakdown.forEach(day => {
      const emoji = day.score >= 80 ? '🔥' : day.score >= 60 ? '✅' : day.score >= 40 ? '⚡' : '📝'
      content += `- **${day.day_name}**: ${emoji} ${day.completed}/${day.tasks} tasks (${Math.round(day.score)}% score)\n`
    })
    
    content += `\n*This weekly summary was generated from my daily productivity tracking data.*`
    
    const excerpt = `My weekly productivity review: ${weeklyData.completed_tasks}/${weeklyData.total_tasks} tasks completed with ${Math.round(weeklyData.completion_rate)}% completion rate.`
    
    return {
      title,
      content,
      excerpt,
      tags: ['weekly-summary', 'productivity', 'self-improvement', 'progress-tracking']
    }
  },

  private async generateMonthlyBlogPost(userId: string, date: string): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const currentDate = new Date(date)
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const summaries = await this.getSummaries(userId, {
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0]
    })
    
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const title = `Monthly Review: ${monthName} Productivity Journey`
    
    const totalTasks = summaries.reduce((sum, s) => sum + (s.total_tasks || 0), 0)
    const completedTasks = summaries.reduce((sum, s) => sum + (s.completed_tasks || 0), 0)
    const avgScore = summaries.length > 0 
      ? summaries.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / summaries.length 
      : 0
    
    let content = `# ${title}\n\n`
    content += `As ${monthName} comes to a close, I want to reflect on the month's productivity journey and share key insights.\n\n`
    
    content += `## 🎯 Monthly Highlights\n\n`
    content += `- **Days Tracked**: ${summaries.length}\n`
    content += `- **Total Tasks**: ${totalTasks}\n`
    content += `- **Completed Tasks**: ${completedTasks} (${Math.round((completedTasks/totalTasks) * 100)}%)\n`
    content += `- **Average Productivity Score**: ${Math.round(avgScore)}%\n\n`
    
    content += `*This monthly review was compiled from ${summaries.length} days of productivity tracking data.*`
    
    const excerpt = `My ${monthName} productivity review: ${completedTasks}/${totalTasks} tasks completed across ${summaries.length} tracked days.`
    
    return {
      title,
      content,
      excerpt,
      tags: ['monthly-summary', 'productivity', 'self-improvement', 'monthly-review']
    }
  },

  async createBlogPostFromSummary(userId: string, summaryId: string, template: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    try {
      // Generate blog content
      const blogData = await this.generateBlogPost(userId, summaryId, template)
      
      // Create the blog post
      const post = await postService.createPost({
        user_id: userId,
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt,
        slug: this.generateSlug(blogData.title),
        status: 'draft', // Start as draft for review
        type: 'schedule_generated',
        meta_title: blogData.title,
        meta_description: blogData.excerpt
      })
      
      // Update summary to mark blog as generated
      await this.updateSummary(userId, summaryId, {
        auto_blog_generated: true,
        generated_post_id: post.id
      })
      
      return post
    } catch (error) {
      throw new DatabaseError('Failed to create blog post from summary', error)
    }
  },

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100)
  },
}

// Comment operations
export const commentService = {
  async getComments(postId: string, options?: {
    status?: 'pending' | 'approved' | 'spam' | 'rejected'
    includeReplies?: boolean
  }): Promise<Comment[]> {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)

    if (options?.status) {
      query = query.eq('status', options.status)
    } else {
      // Default to approved comments for public viewing
      query = query.eq('status', 'approved')
    }

    if (!options?.includeReplies) {
      query = query.is('parent_id', null)
    }

    query = query.order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch comments', error)
    }

    return data || []
  },

  async getCommentReplies(parentId: string, status: string = 'approved'): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_id', parentId)
      .eq('status', status)
      .order('created_at', { ascending: true })

    if (error) {
      throw new DatabaseError('Failed to fetch comment replies', error)
    }

    return data || []
  },

  async createComment(comment: {
    post_id: string
    parent_id?: string
    author_name: string
    author_email: string
    author_website?: string
    content: string
    ip_address?: string
    user_agent?: string
  }): Promise<Comment> {
    // Basic spam detection
    const isSpam = this.detectSpam(comment)
    const status = isSpam ? 'spam' : 'pending'

    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...comment,
        status,
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create comment', error)
    }

    return data
  },

  async updateCommentStatus(
    id: string, 
    status: 'pending' | 'approved' | 'spam' | 'rejected'
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update comment status', error)
    }

    return data
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete comment', error)
    }
  },

  async getCommentsForModeration(options?: {
    status?: 'pending' | 'spam'
    limit?: number
    offset?: number
  }): Promise<{ data: Comment[]; total: number }> {
    let query = supabase
      .from('comments')
      .select('*', { count: 'exact' })

    if (options?.status) {
      query = query.eq('status', options.status)
    } else {
      query = query.in('status', ['pending', 'spam'])
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      const offset = options?.offset || 0
      query = query.range(offset, offset + options.limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch comments for moderation', error)
    }

    return {
      data: data || [],
      total: count || 0
    }
  },

  async getCommentStats(postId?: string): Promise<{
    total: number
    approved: number
    pending: number
    spam: number
    rejected: number
  }> {
    let query = supabase
      .from('comments')
      .select('status')

    if (postId) {
      query = query.eq('post_id', postId)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch comment statistics', error)
    }

    const stats = {
      total: data?.length || 0,
      approved: 0,
      pending: 0,
      spam: 0,
      rejected: 0,
    }

    data?.forEach(comment => {
      stats[comment.status as keyof typeof stats]++
    })

    return stats
  },

  // Basic spam detection logic
  detectSpam(comment: {
    author_name: string
    author_email: string
    content: string
    author_website?: string
  }): boolean {
    const { content, author_name, author_email, author_website } = comment

    // Basic spam indicators
    const spamKeywords = [
      'viagra', 'casino', 'poker', 'loan', 'mortgage', 'credit',
      'free money', 'click here', 'buy now', 'limited time',
      'make money', 'work from home', 'earn cash'
    ]

    const contentLower = content.toLowerCase()
    const nameLower = author_name.toLowerCase()
    const emailLower = author_email.toLowerCase()
    const websiteLower = author_website?.toLowerCase() || ''

    // Check for spam keywords
    const hasSpamKeywords = spamKeywords.some(keyword => 
      contentLower.includes(keyword) || 
      nameLower.includes(keyword) ||
      websiteLower.includes(keyword)
    )

    // Check for excessive URLs
    const urlCount = (content.match(/https?:\/\//g) || []).length
    const hasExcessiveUrls = urlCount > 2

    // Check for suspicious patterns
    const hasSuspiciousEmail = emailLower.includes('temp') || 
                              emailLower.includes('throwaway') ||
                              emailLower.includes('spam')

    // Check content quality
    const isVeryShort = content.trim().length < 10
    const isAllCaps = content === content.toUpperCase() && content.length > 20
    const hasExcessivePunctuation = (content.match(/[!?]{3,}/g) || []).length > 0

    return hasSpamKeywords || 
           hasExcessiveUrls || 
           hasSuspiciousEmail || 
           isVeryShort || 
           isAllCaps || 
           hasExcessivePunctuation
  },
}