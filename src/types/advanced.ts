// Advanced features types
export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  category?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  color: string
  icon: string
  is_active: boolean
  reminder_time?: string
  reminder_enabled: boolean
  streak_count: number
  best_streak: number
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  log_date: string
  completed_count: number
  target_count: number
  notes?: string
  mood_after?: number
  created_at: string
}

export interface MoodLog {
  id: string
  user_id: string
  log_date: string
  log_time: string
  mood_rating: number
  energy_level?: number
  stress_level?: number
  sleep_quality?: number
  notes?: string
  tags?: string[]
  weather?: string
  location?: string
  created_at: string
}

export interface DataExport {
  id: string
  user_id: string
  export_type: 'tasks' | 'summaries' | 'habits' | 'moods' | 'all'
  format: 'json' | 'csv' | 'pdf'
  date_range_start?: string
  date_range_end?: string
  file_url?: string
  file_size?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  expires_at: string
}

export interface ProductivityInsight {
  id: string
  user_id: string
  insight_type: string
  period_start: string
  period_end: string
  data: Record<string, any>
  calculated_at: string
  expires_at: string
}

// Extended database interface for advanced features
export interface AdvancedDatabase {
  public: {
    Tables: {
      habits: {
        Row: Habit
        Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Habit, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      habit_logs: {
        Row: HabitLog
        Insert: Omit<HabitLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<HabitLog, 'id' | 'created_at'>>
      }
      mood_logs: {
        Row: MoodLog
        Insert: Omit<MoodLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<MoodLog, 'id' | 'created_at'>>
      }
      data_exports: {
        Row: DataExport
        Insert: Omit<DataExport, 'id' | 'created_at' | 'expires_at'> & {
          id?: string
          created_at?: string
          expires_at?: string
        }
        Update: Partial<Omit<DataExport, 'id' | 'created_at'>>
      }
      productivity_insights: {
        Row: ProductivityInsight
        Insert: Omit<ProductivityInsight, 'id' | 'calculated_at' | 'expires_at'> & {
          id?: string
          calculated_at?: string
          expires_at?: string
        }
        Update: Partial<Omit<ProductivityInsight, 'id' | 'calculated_at'>>
      }
    }
  }
}

// Habit-related interfaces
export interface HabitWithLogs extends Habit {
  recent_logs?: HabitLog[]
  completion_rate?: number
  current_streak?: number
}

export interface HabitStats {
  total_habits: number
  active_habits: number
  completed_today: number
  longest_streak: number
  completion_rate: number
}

export interface MoodStats {
  avg_mood: number
  avg_energy: number
  avg_stress: number
  mood_trend: 'up' | 'down' | 'stable'
  best_day: string
  worst_day: string
}

export interface ProductivityCorrelation {
  habit_name: string
  completion_rate: number
  productivity_impact: number
  correlation_strength: 'strong' | 'moderate' | 'weak'
}

export interface WeeklyPattern {
  day_of_week: number
  day_name: string
  avg_productivity: number
  avg_mood: number
  avg_habits_completed: number
  task_completion_rate: number
}

export interface ExportOptions {
  type: 'tasks' | 'summaries' | 'habits' | 'moods' | 'all'
  format: 'json' | 'csv' | 'pdf'
  dateRange: {
    start: string
    end: string
  }
  includeDeleted?: boolean
  includePrivateNotes?: boolean
}