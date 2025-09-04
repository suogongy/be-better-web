export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name?: string
          avatar_url?: string
          bio?: string
          website?: string
          social_links?: Record<string, string>
          preferences?: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          avatar_url?: string
          bio?: string
          website?: string
          social_links?: Record<string, string>
          preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          bio?: string
          website?: string
          social_links?: Record<string, string>
          preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description?: string
          color?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          color?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content?: string
          excerpt?: string
          featured_image?: string
          status: 'draft' | 'published' | 'archived'
          type: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          view_count?: number
          published_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string
          excerpt?: string
          featured_image?: string
          status?: 'draft' | 'published' | 'archived'
          type?: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          view_count?: number
          published_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          excerpt?: string
          featured_image?: string
          status?: 'draft' | 'published' | 'archived'
          type?: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          view_count?: number
          published_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_categories: {
        Row: {
          post_id: string
          category_id: string
        }
        Insert: {
          post_id: string
          category_id: string
        }
        Update: {
          post_id?: string
          category_id?: string
        }
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          parent_id?: string
          author_name: string
          author_email: string
          author_website?: string
          content: string
          status: 'pending' | 'approved' | 'spam' | 'rejected'
          ip_address?: string
          user_agent?: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          parent_id?: string
          author_name: string
          author_email: string
          author_website?: string
          content: string
          status?: 'pending' | 'approved' | 'spam' | 'rejected'
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          parent_id?: string
          author_name?: string
          author_email?: string
          author_website?: string
          content?: string
          status?: 'pending' | 'approved' | 'spam' | 'rejected'
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description?: string
          category?: string
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          progress: number
          estimated_minutes?: number
          actual_minutes?: number
          due_date?: string
          due_time?: string
          is_recurring: boolean
          recurrence_pattern?: Record<string, unknown>
          completion_notes?: string
          completed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string
          category?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          progress?: number
          estimated_minutes?: number
          actual_minutes?: number
          due_date?: string
          due_time?: string
          is_recurring?: boolean
          recurrence_pattern?: Record<string, unknown>
          completion_notes?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
          is_recurring?: boolean
          recurrence_pattern?: Record<string, unknown>
          completion_notes?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          summary_date: string
          total_tasks: number
          completed_tasks: number
          completion_rate?: number
          total_planned_time?: number
          total_actual_time?: number
          productivity_score?: number
          mood_rating?: number
          energy_rating?: number
          notes?: string
          achievements?: unknown[]
          challenges?: unknown[]
          tomorrow_goals?: unknown[]
          auto_blog_generated: boolean
          generated_post_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          achievements?: unknown[]
          challenges?: unknown[]
          tomorrow_goals?: unknown[]
          auto_blog_generated?: boolean
          generated_post_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          summary_date?: string
          total_tasks?: number
          completed_tasks?: number
          completion_rate?: number
          total_planned_time?: number
          total_actual_time?: number
          productivity_score?: number
          mood_rating?: number
          energy_rating?: number
          notes?: string
          achievements?: unknown[]
          challenges?: unknown[]
          tomorrow_goals?: unknown[]
          auto_blog_generated?: boolean
          generated_post_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      data_exports: {
        Row: {
          id: string
          user_id: string
          export_type: string
          format: string
          date_range_start?: string
          date_range_end?: string
          file_url?: string
          file_name?: string
          file_size?: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          expires_at: string
          completed_at?: string
          error_message?: string
        }
        Insert: {
          id?: string
          user_id: string
          export_type: string
          format: string
          date_range_start?: string
          date_range_end?: string
          file_url?: string
          file_name?: string
          file_size?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          expires_at?: string
          completed_at?: string
          error_message?: string
        }
        Update: {
          id?: string
          user_id?: string
          export_type?: string
          format?: string
          date_range_start?: string
          date_range_end?: string
          file_url?: string
          file_name?: string
          file_size?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          expires_at?: string
          completed_at?: string
          error_message?: string
          updated_at?: string
        }
      }
      /*
       * 已移除订阅功能，相关表定义已删除
       * subscriptions: {
       *   Row: {
       *     id: string
       *     email: string
       *     name?: string
       *     status: 'active' | 'unsubscribed' | 'bounced'
       *     preferences?: Record<string, unknown>
       *     created_at: string
       *     updated_at: string
       *     unsubscribed_at?: string
       *     last_email_sent_at?: string
       *     confirmation_token?: string
       *     confirmed_at?: string
       *   }
       *   Insert: {
       *     id?: string
       *     email: string
       *     name?: string
       *     status?: 'active' | 'unsubscribed' | 'bounced'
       *     preferences?: Record<string, unknown>
       *     created_at?: string
       *     updated_at?: string
       *     unsubscribed_at?: string
       *     last_email_sent_at?: string
       *     confirmation_token?: string
       *     confirmed_at?: string
       *   }
       *   Update: {
       *     id?: string
       *     email?: string
       *     name?: string
       *     status?: 'active' | 'unsubscribed' | 'bounced'
       *     preferences?: Record<string, unknown>
       *     created_at?: string
       *     updated_at?: string
       *     unsubscribed_at?: string
       *     last_email_sent_at?: string
       *     confirmation_token?: string
       *     confirmed_at?: string
       *   }
       * }
       */
    }
  }
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Post = Database['public']['Tables']['posts']['Row']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type DailySummary = Database['public']['Tables']['daily_summaries']['Row']
export type DailySummaryInsert = Database['public']['Tables']['daily_summaries']['Insert']
export type DailySummaryUpdate = Database['public']['Tables']['daily_summaries']['Update']

export type DataExport = Database['public']['Tables']['data_exports']['Row']
export type DataExportInsert = Database['public']['Tables']['data_exports']['Insert']
export type DataExportUpdate = Database['public']['Tables']['data_exports']['Update']

export type PostCategory = Database['public']['Tables']['post_categories']['Row']
export type PostCategoryInsert = Database['public']['Tables']['post_categories']['Insert']
export type PostCategoryUpdate = Database['public']['Tables']['post_categories']['Update']

export type PostTag = Database['public']['Tables']['post_tags']['Row']
export type PostTagInsert = Database['public']['Tables']['post_tags']['Insert']
export type PostTagUpdate = Database['public']['Tables']['post_tags']['Update']

/*
 * 已移除订阅功能，相关类型定义已删除
 * export type Subscription = Database['public']['Tables']['subscriptions']['Row']
 * export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
 * export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']
 */
