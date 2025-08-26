-- Be Better Web Database Setup
-- Complete schema for the personal blog and productivity platform
-- Run this in your Supabase SQL Editor to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  social_links JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  type VARCHAR(20) DEFAULT 'manual' CHECK (type IN ('manual', 'schedule_generated')),
  meta_title VARCHAR(255),
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Post-Category junction table
CREATE TABLE IF NOT EXISTS public.post_categories (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Post-Tag junction table
CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_website VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  due_date DATE,
  due_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB, -- Stores recurrence rules
  completion_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily summaries table
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  total_planned_time INTEGER, -- in minutes
  total_actual_time INTEGER, -- in minutes
  productivity_score DECIMAL(5,2),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_rating INTEGER CHECK (energy_rating >= 1 AND energy_rating <= 5),
  notes TEXT,
  achievements JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  tomorrow_goals JSONB DEFAULT '[]',
  auto_blog_generated BOOLEAN DEFAULT FALSE,
  generated_post_id UUID REFERENCES public.posts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);

-- Advanced Features: Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  frequency VARCHAR(50) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER DEFAULT 1,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'circle',
  is_active BOOLEAN DEFAULT TRUE,
  reminder_time TIME,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  streak_count INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed_count INTEGER DEFAULT 1,
  target_count INTEGER DEFAULT 1,
  notes TEXT,
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- Mood logs table
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  log_time TIME DEFAULT CURRENT_TIME,
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes TEXT,
  tags JSONB DEFAULT '[]',
  weather VARCHAR(50),
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON public.mood_logs(user_id, log_date);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Productivity', 'productivity', 'Tips and insights about productivity and time management', '#3B82F6'),
  ('Personal', 'personal', 'Personal thoughts, experiences, and reflections', '#10B981'),
  ('Technology', 'technology', 'Technology-related posts and tutorials', '#8B5CF6'),
  ('Schedule', 'schedule', 'Posts generated from daily schedules and summaries', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO public.tags (name, slug) VALUES
  ('productivity', 'productivity'),
  ('time-management', 'time-management'),
  ('habits', 'habits'),
  ('goals', 'goals'),
  ('reflection', 'reflection'),
  ('weekly-review', 'weekly-review'),
  ('daily-summary', 'daily-summary'),
  ('tips', 'tips'),
  ('getting-started', 'getting-started'),
  ('tutorial', 'tutorial')
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public content (posts, categories, tags)
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own posts" ON public.posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

-- RLS Policies for user-specific content
CREATE POLICY "Users can view and edit their own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summaries" ON public.daily_summaries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mood logs" ON public.mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Comments policy (approved comments are public)
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);