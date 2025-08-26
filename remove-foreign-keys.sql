-- Migration: Remove Foreign Key Constraints
-- This script removes all foreign key constraints from the database
-- to implement relationship management in application code

-- Drop foreign key constraints from posts table
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Drop foreign key constraints from post_categories table
ALTER TABLE public.post_categories DROP CONSTRAINT IF EXISTS post_categories_post_id_fkey;
ALTER TABLE public.post_categories DROP CONSTRAINT IF EXISTS post_categories_category_id_fkey;

-- Drop foreign key constraints from post_tags table
ALTER TABLE public.post_tags DROP CONSTRAINT IF EXISTS post_tags_post_id_fkey;
ALTER TABLE public.post_tags DROP CONSTRAINT IF EXISTS post_tags_tag_id_fkey;

-- Drop foreign key constraints from comments table
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;

-- Drop foreign key constraints from tasks table
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Drop foreign key constraints from daily_summaries table
ALTER TABLE public.daily_summaries DROP CONSTRAINT IF EXISTS daily_summaries_user_id_fkey;
ALTER TABLE public.daily_summaries DROP CONSTRAINT IF EXISTS daily_summaries_generated_post_id_fkey;

-- Drop foreign key constraints from habits table
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_user_id_fkey;

-- Drop foreign key constraints from habit_logs table
ALTER TABLE public.habit_logs DROP CONSTRAINT IF EXISTS habit_logs_habit_id_fkey;
ALTER TABLE public.habit_logs DROP CONSTRAINT IF EXISTS habit_logs_user_id_fkey;

-- Drop foreign key constraints from mood_logs table
ALTER TABLE public.mood_logs DROP CONSTRAINT IF EXISTS mood_logs_user_id_fkey;

-- Drop foreign key constraint from users table (if it references auth.users)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Remove unique constraints that might prevent data flexibility
ALTER TABLE public.daily_summaries DROP CONSTRAINT IF EXISTS daily_summaries_user_id_summary_date_key;
ALTER TABLE public.habit_logs DROP CONSTRAINT IF EXISTS habit_logs_habit_id_log_date_key;

-- Update RLS policies to be more permissive (optional)
-- This makes the database more open for testing and development

COMMENT ON SCHEMA public IS 'Foreign key constraints removed - relationships managed in application code';

-- Grant permissions to ensure the application can work without auth constraints
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;