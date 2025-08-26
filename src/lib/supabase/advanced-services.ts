import { supabase } from './client'
import { DatabaseError } from './database'
import type { 
  Habit, 
  HabitLog, 
  HabitWithLogs, 
  HabitStats,
  MoodLog,
  MoodStats,
  DataExport,
  ExportOptions,
  ProductivityInsight,
  ProductivityCorrelation,
  WeeklyPattern 
} from '@/types/advanced'

// Habit operations
export const habitService = {
  async getHabits(userId: string, options?: {
    includeInactive?: boolean
    category?: string
    limit?: number
  }): Promise<HabitWithLogs[]> {
    let query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!options?.includeInactive) {
      query = query.eq('is_active', true)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: habits, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch habits', error)
    }

    // Get recent logs for each habit
    const habitsWithLogs: HabitWithLogs[] = []
    for (const habit of habits || []) {
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habit.id)
        .order('log_date', { ascending: false })
        .limit(7)

      const completionRate = await this.getHabitCompletionRate(habit.id, 30)
      
      habitsWithLogs.push({
        ...habit,
        recent_logs: logs || [],
        completion_rate: completionRate,
        current_streak: habit.streak_count
      })
    }

    return habitsWithLogs
  },

  async createHabit(habit: {
    user_id: string
    name: string
    description?: string
    category?: string
    frequency?: 'daily' | 'weekly' | 'monthly'
    target_count?: number
    color?: string
    icon?: string
    reminder_time?: string
    reminder_enabled?: boolean
  }): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habit,
        frequency: habit.frequency || 'daily',
        target_count: habit.target_count || 1,
        color: habit.color || '#3B82F6',
        icon: habit.icon || 'circle',
        reminder_enabled: habit.reminder_enabled || false
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create habit', error)
    }

    return data
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update habit', error)
    }

    return data
  },

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete habit', error)
    }
  },

  async logHabit(log: {
    habit_id: string
    user_id: string
    log_date: string
    completed_count?: number
    target_count?: number
    notes?: string
    mood_after?: number
  }): Promise<HabitLog> {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert({
        ...log,
        completed_count: log.completed_count || 1,
        target_count: log.target_count || 1
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to log habit', error)
    }

    // Update habit streaks
    await this.updateHabitStreak(log.habit_id)

    return data
  },

  async getHabitLogs(habitId: string, options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<HabitLog[]> {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .order('log_date', { ascending: false })

    if (options?.startDate) {
      query = query.gte('log_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('log_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch habit logs', error)
    }

    return data || []
  },

  async getHabitStats(userId: string): Promise<HabitStats> {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)

    if (habitsError) {
      throw new DatabaseError('Failed to fetch habits for stats', habitsError)
    }

    const totalHabits = habits?.length || 0
    const activeHabits = habits?.filter(h => h.is_active).length || 0

    // Get today's completed habits
    const today = new Date().toISOString().split('T')[0]
    const { data: todayLogs } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('log_date', today)

    const completedToday = todayLogs?.length || 0

    // Get longest streak
    const longestStreak = habits?.reduce((max, habit) => 
      Math.max(max, habit.best_streak || 0), 0) || 0

    // Calculate overall completion rate (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let totalExpected = 0
    let totalCompleted = 0

    for (const habit of habits?.filter(h => h.is_active) || []) {
      const expectedCount = this.calculateExpectedLogs(habit, thirtyDaysAgo, new Date())
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('completed_count')
        .eq('habit_id', habit.id)
        .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])

      totalExpected += expectedCount
      totalCompleted += logs?.reduce((sum, log) => sum + log.completed_count, 0) || 0
    }

    const completionRate = totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0

    return {
      total_habits: totalHabits,
      active_habits: activeHabits,
      completed_today: completedToday,
      longest_streak: longestStreak,
      completion_rate: Math.round(completionRate * 100) / 100
    }
  },

  async getHabitCompletionRate(habitId: string, days: number = 30): Promise<number> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: habit } = await supabase
      .from('habits')
      .select('frequency, target_count')
      .eq('id', habitId)
      .single()

    if (!habit) return 0

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('completed_count, target_count')
      .eq('habit_id', habitId)
      .gte('log_date', startDate.toISOString().split('T')[0])

    const expectedCount = this.calculateExpectedLogs(habit, startDate, new Date())
    const actualCount = logs?.reduce((sum, log) => sum + log.completed_count, 0) || 0

    return expectedCount > 0 ? (actualCount / expectedCount) * 100 : 0
  },

  private calculateExpectedLogs(habit: any, startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (habit.frequency) {
      case 'daily':
        return days * (habit.target_count || 1)
      case 'weekly':
        return Math.ceil(days / 7) * (habit.target_count || 1)
      case 'monthly':
        return Math.ceil(days / 30) * (habit.target_count || 1)
      default:
        return 0
    }
  },

  async updateHabitStreak(habitId: string): Promise<void> {
    // This would call the database function to update streaks
    const { error } = await supabase.rpc('calculate_habit_streak', {
      p_habit_id: habitId
    })

    if (error) {
      console.warn('Failed to update habit streak:', error)
    }
  },

  async getHabitCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null)

    if (error) {
      throw new DatabaseError('Failed to fetch habit categories', error)
    }

    const categories = [...new Set(data?.map(h => h.category).filter(Boolean))]
    return categories
  }
}

// Mood logging operations
export const moodService = {
  async logMood(mood: {
    user_id: string
    log_date: string
    log_time?: string
    mood_rating: number
    energy_level?: number
    stress_level?: number
    sleep_quality?: number
    notes?: string
    tags?: string[]
    weather?: string
    location?: string
  }): Promise<MoodLog> {
    const { data, error } = await supabase
      .from('mood_logs')
      .insert({
        ...mood,
        log_time: mood.log_time || new Date().toTimeString().split(' ')[0]
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to log mood', error)
    }

    return data
  },

  async getMoodLogs(userId: string, options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<MoodLog[]> {
    let query = supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .order('log_time', { ascending: false })

    if (options?.startDate) {
      query = query.gte('log_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('log_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch mood logs', error)
    }

    return data || []
  },

  async getMoodStats(userId: string, days: number = 30): Promise<MoodStats> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: logs, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate.toISOString().split('T')[0])
      .order('log_date', { ascending: true })

    if (error) {
      throw new DatabaseError('Failed to fetch mood stats', error)
    }

    if (!logs || logs.length === 0) {
      return {
        avg_mood: 0,
        avg_energy: 0,
        avg_stress: 0,
        mood_trend: 'stable',
        best_day: '',
        worst_day: ''
      }
    }

    const avgMood = logs.reduce((sum, log) => sum + log.mood_rating, 0) / logs.length
    const avgEnergy = logs.reduce((sum, log) => sum + (log.energy_level || 0), 0) / logs.length
    const avgStress = logs.reduce((sum, log) => sum + (log.stress_level || 0), 0) / logs.length

    // Calculate trend
    const firstHalf = logs.slice(0, Math.floor(logs.length / 2))
    const secondHalf = logs.slice(Math.floor(logs.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, log) => sum + log.mood_rating, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.mood_rating, 0) / secondHalf.length
    
    let moodTrend: 'up' | 'down' | 'stable' = 'stable'
    if (secondAvg > firstAvg + 0.5) moodTrend = 'up'
    else if (secondAvg < firstAvg - 0.5) moodTrend = 'down'

    // Find best and worst days
    const sortedByMood = [...logs].sort((a, b) => b.mood_rating - a.mood_rating)
    const bestDay = sortedByMood[0]?.log_date || ''
    const worstDay = sortedByMood[sortedByMood.length - 1]?.log_date || ''

    return {
      avg_mood: Math.round(avgMood * 100) / 100,
      avg_energy: Math.round(avgEnergy * 100) / 100,
      avg_stress: Math.round(avgStress * 100) / 100,
      mood_trend: moodTrend,
      best_day: bestDay,
      worst_day: worstDay
    }
  },

  async updateMoodLog(id: string, updates: Partial<MoodLog>): Promise<MoodLog> {
    const { data, error } = await supabase
      .from('mood_logs')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update mood log', error)
    }

    return data
  },

  async deleteMoodLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete mood log', error)
    }
  }
}

// Data export operations
export const exportService = {
  async createExport(userId: string, options: ExportOptions): Promise<DataExport> {
    const { data, error } = await supabase
      .from('data_exports')
      .insert({
        user_id: userId,
        export_type: options.type,
        format: options.format,
        date_range_start: options.dateRange.start,
        date_range_end: options.dateRange.end,
        status: 'pending'
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create export request', error)
    }

    // Trigger export processing (would be handled by a background job)
    this.processExport(data.id).catch(console.error)

    return data
  },

  async getExports(userId: string): Promise<DataExport[]> {
    const { data, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError('Failed to fetch exports', error)
    }

    return data || []
  },

  async processExport(exportId: string): Promise<void> {
    // This would be handled by a background job service
    // For now, we'll just simulate the process
    
    try {
      await supabase
        .from('data_exports')
        .update({ status: 'processing' })
        .eq('id', exportId)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In a real implementation, this would generate the actual file
      const fileUrl = `https://example.com/exports/${exportId}.json`

      await supabase
        .from('data_exports')
        .update({ 
          status: 'completed',
          file_url: fileUrl,
          file_size: 1024
        })
        .eq('id', exportId)

    } catch (error) {
      await supabase
        .from('data_exports')
        .update({ status: 'failed' })
        .eq('id', exportId)
    }
  }
}

// Productivity insights operations
export const insightsService = {
  async getProductivityCorrelations(userId: string): Promise<ProductivityCorrelation[]> {
    const { data, error } = await supabase
      .rpc('generate_productivity_insights', {
        p_user_id: userId,
        p_insight_type: 'habit_correlation'
      })

    if (error) {
      throw new DatabaseError('Failed to generate productivity correlations', error)
    }

    return data?.correlations || []
  },

  async getWeeklyPatterns(userId: string): Promise<WeeklyPattern[]> {
    const { data, error } = await supabase
      .rpc('generate_productivity_insights', {
        p_user_id: userId,
        p_insight_type: 'weekly_pattern'
      })

    if (error) {
      throw new DatabaseError('Failed to generate weekly patterns', error)
    }

    return data?.daily_averages || []
  },

  async generateCustomInsight(
    userId: string, 
    insightType: string, 
    parameters?: Record<string, any>
  ): Promise<any> {
    const { data, error } = await supabase
      .rpc('generate_productivity_insights', {
        p_user_id: userId,
        p_insight_type: insightType,
        p_parameters: parameters || {}
      })

    if (error) {
      throw new DatabaseError('Failed to generate custom insight', error)
    }

    return data
  }
}