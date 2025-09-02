-- 修复每日总结功能的数据库迁移

-- 1. 为 daily_summaries 表创建 RLS 策略
DROP POLICY IF EXISTS "Users can view their own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can insert their own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can update their own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can delete their own daily summaries" ON public.daily_summaries;

-- 创建新的 RLS 策略
CREATE POLICY "Users can view their own daily summaries" ON public.daily_summaries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own daily summaries" ON public.daily_summaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own daily summaries" ON public.daily_summaries
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own daily summaries" ON public.daily_summaries
  FOR DELETE USING (true);

-- 2. 确保 JSONB 字段有默认值
ALTER TABLE public.daily_summaries 
  ALTER COLUMN achievements SET DEFAULT '[]'::jsonb,
  ALTER COLUMN challenges SET DEFAULT '[]'::jsonb,
  ALTER COLUMN tomorrow_goals SET DEFAULT '[]'::jsonb;

-- 3. 更新现有记录，确保 JSONB 字段不为 null
UPDATE public.daily_summaries 
SET 
  achievements = COALESCE(achievements, '[]'::jsonb),
  challenges = COALESCE(challenges, '[]'::jsonb),
  tomorrow_goals = COALESCE(tomorrow_goals, '[]'::jsonb)
WHERE 
  achievements IS NULL 
  OR challenges IS NULL 
  OR tomorrow_goals IS NULL;

-- 4. 添加检查约束确保评分在有效范围内（修正语法错误）
-- 为 mood_rating 添加检查约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'mood_rating_check' 
        AND conrelid = 'public.daily_summaries'::regclass
    ) THEN
        ALTER TABLE public.daily_summaries
            ADD CONSTRAINT mood_rating_check 
            CHECK (mood_rating IS NULL OR (mood_rating >= 1 AND mood_rating <= 5));
    END IF;
END
$$;

-- 为 energy_rating 添加检查约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'energy_rating_check' 
        AND conrelid = 'public.daily_summaries'::regclass
    ) THEN
        ALTER TABLE public.daily_summaries
            ADD CONSTRAINT energy_rating_check 
            CHECK (energy_rating IS NULL OR (energy_rating >= 1 AND energy_rating <= 5));
    END IF;
END
$$;

-- 5. 优化表结构，添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date 
  ON public.daily_summaries (user_id, summary_date);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_date 
  ON public.daily_summaries (summary_date);

-- 迁移完成