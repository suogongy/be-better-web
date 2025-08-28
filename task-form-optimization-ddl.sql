-- Task Form Optimization DDL Update Script
-- This script ensures the database structure supports the optimized task form implementation

-- Verify that the tasks table has all required columns
-- No changes needed as the current schema already supports all required features

/*
Current tasks table structure (for reference):
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

The current schema already supports:
1. due_date for required deadline date in one-time tasks
2. due_time for optional deadline time
3. estimated_minutes for optional estimated time
4. is_recurring flag to distinguish between one-time and recurring tasks
5. recurrence_pattern JSONB to store complex recurrence rules

No DDL changes are required for the task form optimization.
*/

-- Add comments to clarify the purpose of key columns
COMMENT ON COLUMN public.tasks.due_date IS 'Task deadline date (required for one-time tasks)';
COMMENT ON COLUMN public.tasks.due_time IS 'Task deadline time (optional)';
COMMENT ON COLUMN public.tasks.estimated_minutes IS 'Estimated time to complete task in minutes (optional)';
COMMENT ON COLUMN public.tasks.is_recurring IS 'Flag indicating if this is a recurring task';
COMMENT ON COLUMN public.tasks.recurrence_pattern IS 'JSONB structure storing recurrence rules for recurring tasks';

-- Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON public.tasks(is_recurring);