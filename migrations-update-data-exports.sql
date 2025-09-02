-- 更新data_exports表结构
-- 添加缺失的字段

-- 添加file_name字段
ALTER TABLE public.data_exports 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- 添加completed_at字段
ALTER TABLE public.data_exports 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 添加error_message字段
ALTER TABLE public.data_exports 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 更新现有记录的expires_at字段（如果为null）
UPDATE public.data_exports 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- 为file_name字段创建索引（可选，用于搜索）
CREATE INDEX IF NOT EXISTS idx_data_exports_file_name ON public.data_exports(file_name);

-- 为completed_at字段创建索引（用于排序和查询）
CREATE INDEX IF NOT EXISTS idx_data_exports_completed_at ON public.data_exports(completed_at);
