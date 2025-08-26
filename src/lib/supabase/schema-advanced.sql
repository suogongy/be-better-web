-- Advanced Features Schema Extension
-- This file adds tables for habit tracking, mood logging, and other advanced features

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  frequency VARCHAR(50) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER DEFAULT 1, -- How many times per frequency period
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  icon VARCHAR(50) DEFAULT 'circle', -- Icon identifier
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

-- Mood logs table (expanded mood tracking)
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

-- Data exports table (track export history)
CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL, -- 'tasks', 'summaries', 'habits', 'moods', 'all'
  format VARCHAR(20) NOT NULL, -- 'json', 'csv', 'pdf'
  date_range_start DATE,
  date_range_end DATE,
  file_url TEXT,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Productivity insights cache table
CREATE TABLE IF NOT EXISTS public.productivity_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL, -- 'weekly_pattern', 'monthly_trend', 'habit_correlation', etc.
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id, insight_type, period_start, period_end)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON public.habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON public.mood_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON public.data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON public.data_exports(status);
CREATE INDEX IF NOT EXISTS idx_productivity_insights_user_type ON public.productivity_insights(user_id, insight_type);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for habit streak calculation
CREATE OR REPLACE FUNCTION public.calculate_habit_streak(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  habit_frequency VARCHAR(50);
BEGIN
  -- Get habit frequency
  SELECT frequency INTO habit_frequency FROM public.habits WHERE id = p_habit_id;
  
  -- Calculate streak based on frequency
  WHILE EXISTS (
    SELECT 1 FROM public.habit_logs 
    WHERE habit_id = p_habit_id 
    AND log_date = check_date 
    AND completed_count >= target_count
  ) LOOP
    current_streak := current_streak + 1;
    
    -- Move to previous period based on frequency
    CASE habit_frequency
      WHEN 'daily' THEN check_date := check_date - INTERVAL '1 day';
      WHEN 'weekly' THEN check_date := check_date - INTERVAL '7 days';
      WHEN 'monthly' THEN check_date := check_date - INTERVAL '1 month';
    END CASE;
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to update habit streaks
CREATE OR REPLACE FUNCTION public.update_habit_streaks()
RETURNS VOID AS $$
DECLARE
  habit_record RECORD;
  current_streak INTEGER;
BEGIN
  FOR habit_record IN SELECT id FROM public.habits WHERE is_active = TRUE LOOP
    current_streak := public.calculate_habit_streak(habit_record.id);
    
    UPDATE public.habits 
    SET 
      streak_count = current_streak,
      best_streak = GREATEST(best_streak, current_streak)
    WHERE id = habit_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate productivity insights
CREATE OR REPLACE FUNCTION public.generate_productivity_insights(p_user_id UUID, p_insight_type VARCHAR(100))
RETURNS JSONB AS $$
DECLARE
  insight_data JSONB;
  start_date DATE;
  end_date DATE;
BEGIN
  end_date := CURRENT_DATE;
  
  CASE p_insight_type
    WHEN 'weekly_pattern' THEN
      start_date := end_date - INTERVAL '4 weeks';
      
      SELECT jsonb_build_object(
        'best_day_of_week', best_day,
        'worst_day_of_week', worst_day,
        'daily_averages', daily_stats
      ) INTO insight_data
      FROM (
        SELECT 
          (SELECT EXTRACT(DOW FROM summary_date) 
           FROM daily_summaries 
           WHERE user_id = p_user_id AND summary_date >= start_date
           GROUP BY EXTRACT(DOW FROM summary_date)
           ORDER BY AVG(productivity_score) DESC LIMIT 1) as best_day,
          (SELECT EXTRACT(DOW FROM summary_date) 
           FROM daily_summaries 
           WHERE user_id = p_user_id AND summary_date >= start_date
           GROUP BY EXTRACT(DOW FROM summary_date)
           ORDER BY AVG(productivity_score) ASC LIMIT 1) as worst_day,
          jsonb_agg(jsonb_build_object(
            'day_of_week', day_num,
            'avg_productivity', avg_score,
            'avg_tasks', avg_tasks
          )) as daily_stats
        FROM (
          SELECT 
            EXTRACT(DOW FROM summary_date) as day_num,
            AVG(productivity_score) as avg_score,
            AVG(total_tasks) as avg_tasks
          FROM daily_summaries 
          WHERE user_id = p_user_id AND summary_date >= start_date
          GROUP BY EXTRACT(DOW FROM summary_date)
        ) daily_breakdown
      ) analysis;
      
    WHEN 'habit_correlation' THEN
      start_date := end_date - INTERVAL '30 days';
      
      SELECT jsonb_build_object(
        'correlations', habit_mood_correlations
      ) INTO insight_data
      FROM (
        SELECT jsonb_agg(jsonb_build_object(
          'habit_name', h.name,
          'completion_rate', completion_rate,
          'avg_mood_after', avg_mood
        )) as habit_mood_correlations
        FROM habits h
        LEFT JOIN (
          SELECT 
            habit_id,
            COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT log_date) FROM habit_logs WHERE habit_id = hl.habit_id) as completion_rate,
            AVG(mood_after) as avg_mood
          FROM habit_logs hl
          WHERE user_id = p_user_id AND log_date >= start_date
          GROUP BY habit_id
        ) stats ON h.id = stats.habit_id
        WHERE h.user_id = p_user_id AND h.is_active = TRUE
      ) correlations;
      
    ELSE
      insight_data := '{}';
  END CASE;
  
  RETURN insight_data;
END;
$$ LANGUAGE plpgsql;