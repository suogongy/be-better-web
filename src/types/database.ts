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
          preferences?: Record<string, any>
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
          preferences?: Record<string, any>
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
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description?: string
          color?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          color?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          content?: string
          excerpt?: string
          featured_image?: string
          status: 'draft' | 'published' | 'archived'
          type: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          published_at?: string
          created_at: string
          updated_at: string
          view_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          content?: string
          excerpt?: string
          featured_image?: string
          status?: 'draft' | 'published' | 'archived'
          type?: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          published_at?: string
          created_at?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string
          featured_image?: string
          status?: 'draft' | 'published' | 'archived'
          type?: 'manual' | 'schedule_generated'
          meta_title?: string
          meta_description?: string
          published_at?: string
          created_at?: string
          updated_at?: string
          view_count?: number
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
          recurrence_pattern?: Record<string, any>
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
          recurrence_pattern?: Record<string, any>
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
          recurrence_pattern?: Record<string, any>
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
          achievements?: any[]
          challenges?: any[]
          tomorrow_goals?: any[]
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
          achievements?: any[]
          challenges?: any[]
          tomorrow_goals?: any[]
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
          achievements?: any[]
          challenges?: any[]
          tomorrow_goals?: any[]
          auto_blog_generated?: boolean
          generated_post_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Views would go here
    }
    Functions: {
      // Functions would go here
    }
    Enums: {
      // Enums would go here
    }
  }
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type DailySummary = Database['public']['Tables']['daily_summaries']['Row']