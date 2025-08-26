-- Be Better Web Database Schema
-- This file contains all table definitions for the personal blog and productivity platform

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

-- Additional utility functions

-- Function to increment post view count
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts 
  SET view_count = view_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate daily summary statistics
CREATE OR REPLACE FUNCTION public.calculate_daily_stats(user_id UUID, target_date DATE)
RETURNS TABLE(
  total_tasks INTEGER,
  completed_tasks INTEGER,
  completion_rate DECIMAL(5,2),
  total_planned_time INTEGER,
  total_actual_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::INTEGER as completed_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0::DECIMAL(5,2)
    END as completion_rate,
    COALESCE(SUM(t.estimated_minutes), 0)::INTEGER as total_planned_time,
    COALESCE(SUM(t.actual_minutes), 0)::INTEGER as total_actual_time
  FROM public.tasks t
  WHERE t.user_id = calculate_daily_stats.user_id
    AND t.due_date = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get posts with category and tag info
CREATE OR REPLACE FUNCTION public.get_posts_with_metadata(
  post_status TEXT DEFAULT 'published',
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  title VARCHAR(255),
  slug VARCHAR(255),
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status VARCHAR(20),
  type VARCHAR(20),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  categories JSONB,
  tags JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.slug,
    p.content,
    p.excerpt,
    p.featured_image,
    p.status,
    p.type,
    p.published_at,
    p.created_at,
    p.updated_at,
    p.view_count,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'color', c.color
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) as categories,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'slug', t.slug
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    ) as tags
  FROM public.posts p
  LEFT JOIN public.post_categories pc ON p.id = pc.post_id
  LEFT JOIN public.categories c ON pc.category_id = c.id
  LEFT JOIN public.post_tags pt ON p.id = pt.post_id
  LEFT JOIN public.tags t ON pt.tag_id = t.id
  WHERE p.status = post_status
  GROUP BY p.id, p.user_id, p.title, p.slug, p.content, p.excerpt, p.featured_image, 
           p.status, p.type, p.published_at, p.created_at, p.updated_at, p.view_count
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;