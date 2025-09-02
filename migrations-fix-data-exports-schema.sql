-- 修复data_exports表结构
-- 确保所有必需字段都存在

-- 检查并添加file_name字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' AND column_name = 'file_name'
    ) THEN
        ALTER TABLE public.data_exports ADD COLUMN file_name VARCHAR(255);
    END IF;
END $$;

-- 检查并添加completed_at字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.data_exports ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 检查并添加error_message字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' AND column_name = 'error_message'
    ) THEN
        ALTER TABLE public.data_exports ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- 检查并添加updated_at字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.data_exports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 更新现有记录的expires_at字段（如果为null）
UPDATE public.data_exports 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- 为重要字段创建索引
CREATE INDEX IF NOT EXISTS idx_data_exports_file_name ON public.data_exports(file_name);
CREATE INDEX IF NOT EXISTS idx_data_exports_completed_at ON public.data_exports(completed_at);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON public.data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON public.data_exports(user_id);

-- 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'data_exports' 
ORDER BY ordinal_position;
