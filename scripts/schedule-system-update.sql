-- 日程管理系统重构数据库更新脚本
-- 执行时间：2025-01-02
-- 注意：本脚本不使用外键约束，所有关系通过代码维护

-- 开始事务
BEGIN;

-- 1. 创建新表

-- 任务模板表
CREATE TABLE public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_system BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    task_data JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任务依赖表
CREATE TABLE public.task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID NOT NULL,
    depends_on_task_id UUID NOT NULL,
    dependency_type VARCHAR(20) NOT NULL CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
    lag_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- 任务实例表（用于重复任务）
CREATE TABLE public.task_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID NOT NULL,
    parent_instance_id UUID,
    instance_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'cancelled')),
    completed_at TIMESTAMPTZ,
    actual_minutes INTEGER,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动化规则表
CREATE TABLE public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB NOT NULL,
    last_triggered_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 博客模板表
CREATE TABLE public.blog_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    template_content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    variables JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任务提醒表
CREATE TABLE public.task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    type VARCHAR(20) DEFAULT 'popup' CHECK (type IN ('popup', 'email', 'browser')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
    is_repeating BOOLEAN DEFAULT false,
    repeat_interval INTEGER DEFAULT 5,
    max_repeats INTEGER DEFAULT 3,
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 优化现有表结构

-- tasks 表优化
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time_zone VARCHAR(50) DEFAULT 'UTC';

-- daily_summaries 表优化
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS ai_insights TEXT;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS key_achievements TEXT[];
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS challenges_overcome TEXT[];
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS tomorrow_plan JSONB;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS blog_generation_config JSONB;

-- 3. 创建索引

-- 任务相关索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);

-- 实例相关索引
CREATE INDEX IF NOT EXISTS idx_instances_task_date ON public.task_instances(task_id, instance_date);
CREATE INDEX IF NOT EXISTS idx_instances_status ON public.task_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_user_date ON public.task_instances(user_id, instance_date);

-- 依赖相关索引
CREATE INDEX IF NOT EXISTS idx_dependencies_task ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends ON public.task_dependencies(depends_on_task_id);

-- 提醒相关索引
CREATE INDEX IF NOT EXISTS idx_reminders_task ON public.task_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_time ON public.task_reminders(user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.task_reminders(status);

-- 自动化规则索引
CREATE INDEX IF NOT EXISTS idx_rules_user_enabled ON public.automation_rules(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_rules_trigger_type ON public.automation_rules(trigger_type);

-- 4. 创建行级安全策略

-- 任务模板 RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON public.task_templates
    FOR SELECT USING (user_id = auth.uid() OR is_system = true);
CREATE POLICY "Users can insert own templates" ON public.task_templates
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own templates" ON public.task_templates
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON public.task_templates
    FOR DELETE USING (user_id = auth.uid());

-- 任务依赖 RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dependencies" ON public.task_dependencies
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own dependencies" ON public.task_dependencies
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own dependencies" ON public.task_dependencies
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own dependencies" ON public.task_dependencies
    FOR DELETE USING (user_id = auth.uid());

-- 任务实例 RLS
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own instances" ON public.task_instances
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own instances" ON public.task_instances
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own instances" ON public.task_instances
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own instances" ON public.task_instances
    FOR DELETE USING (user_id = auth.uid());

-- 自动化规则 RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rules" ON public.automation_rules
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own rules" ON public.automation_rules
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own rules" ON public.automation_rules
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own rules" ON public.automation_rules
    FOR DELETE USING (user_id = auth.uid());

-- 博客模板 RLS
ALTER TABLE public.blog_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blog templates" ON public.blog_templates
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own blog templates" ON public.blog_templates
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own blog templates" ON public.blog_templates
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own blog templates" ON public.blog_templates
    FOR DELETE USING (user_id = auth.uid());

-- 任务提醒 RLS
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminders" ON public.task_reminders
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own reminders" ON public.task_reminders
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reminders" ON public.task_reminders
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reminders" ON public.task_reminders
    FOR DELETE USING (user_id = auth.uid());

-- 5. 创建触发器函数

-- 更新 updated_at 字段
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要 updated_at 的表创建触发器
CREATE TRIGGER handle_task_templates_updated_at
    BEFORE UPDATE ON public.task_templates
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_blog_templates_updated_at
    BEFORE UPDATE ON public.blog_templates
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_task_instances_updated_at
    BEFORE UPDATE ON public.task_instances
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. 插入预设数据

-- 插入系统任务模板
INSERT INTO public.task_templates (user_id, name, description, category, is_system, task_data) VALUES
('00000000-0000-0000-0000-000000000000', '每日晨间例行', '标准的晨间任务模板', 'routine', true, 
 '{"tasks": [{"title": "冥想", "description": "10分钟冥想练习", "category": "health", "priority": "medium", "estimated_minutes": 10}, {"title": "运动", "description": "30分钟有氧运动", "category": "health", "priority": "high", "estimated_minutes": 30}, {"title": "阅读", "description": "阅读15分钟", "category": "learning", "priority": "medium", "estimated_minutes": 15}]}'),
('00000000-0000-0000-0000-000000000000', '周计划模板', '每周规划模板', 'planning', true,
 '{"tasks": [{"title": "回顾上周", "description": "总结上周完成情况", "category": "work", "priority": "high", "estimated_minutes": 30}, {"title": "制定本周目标", "description": "设定本周要完成的主要目标", "category": "work", "priority": "high", "estimated_minutes": 45}, {"title": "安排重要任务", "description": "将重要任务分配到具体日期", "category": "work", "priority": "high", "estimated_minutes": 60}]}'),
('00000000-0000-0000-0000-000000000000', '项目启动模板', '新项目启动检查清单', 'work', true,
 '{"tasks": [{"title": "项目需求分析", "description": "详细分析项目需求", "category": "work", "priority": "high", "estimated_minutes": 120}, {"title": "制定项目计划", "description": "创建项目时间线和里程碑", "category": "work", "priority": "high", "estimated_minutes": 90}, {"title": "资源分配", "description": "分配项目所需资源", "category": "work", "priority": "medium", "estimated_minutes": 60}, {"title": "风险评估", "description": "识别并评估项目风险", "category": "work", "priority": "medium", "estimated_minutes": 45}]}');

-- 插入预设博客模板
INSERT INTO public.blog_templates (user_id, name, description, type, template_content, is_default, variables) VALUES
('00000000-0000-0000-0000-000000000000', '日报式模板', '简洁的每日工作汇报模板', 'daily', 
'# {{date}} 日程总结

## 今日完成
{{#each completedTasks}}
- {{this.title}} ({{this.actual_minutes}}分钟)
{{/each}}

## 关键成就
{{keyAchievements}}

## 遇到的挑战
{{challenges}}

## 明日计划
{{tomorrowPlan}}

## 效率评分
{{productivityScore}}/10

{{#if aiInsights}}
## AI 洞察
{{aiInsights}}
{{/if}}', true, 
'{"date": "日期", "completedTasks": "完成的任务列表", "keyAchievements": "关键成就", "challenges": "挑战", "tomorrowPlan": "明日计划", "productivityScore": "效率评分", "aiInsights": "AI洞察"}'),

('00000000-0000-0000-0000-000000000000', '反思式模板', '深度反思和学习的日报模板', 'daily',
'# {{date}} - 工作与反思

## 今日工作总结
{{workSummary}}

## 学到的东西
{{learnings}}

## 可以改进的地方
{{improvements}}

## 时间使用分析
{{timeAnalysis}}

## 情绪与能量
{{moodEnergy}}

## 明日目标
{{tomorrowGoals}}

---
*完成 {{completedCount}} 个任务，总计用时 {{totalMinutes}} 分钟*', false,
'{"date": "日期", "workSummary": "工作总结", "learnings": "学到的东西", "improvements": "改进点", "timeAnalysis": "时间分析", "moodEnergy": "情绪能量", "tomorrowGoals": "明日目标", "completedCount": "完成任务数", "totalMinutes": "总用时"}'),

('00000000-0000-0000-0000-000000000000', '成就式模板', '专注于成就和进步的日报模板', 'daily',
'# {{date}} - 又是进步的一天！ 🎉

## 今日成就
{{#each achievements}}
- {{this}}
{{/each}}

## 突破进展
{{breakthroughs}}

## 解决的问题
{{problemsSolved}}

## 习惯追踪
{{habitTracking}}

## 感谢
{{gratitude}}

## 明日期待
{{tomorrowExcitement}}

---
*保持进步，每一天都是新的开始！*', false,
'{"date": "日期", "achievements": "成就列表", "breakthroughs": "突破进展", "problemsSolved": "解决的问题", "habitTracking": "习惯追踪", "gratitude": "感谢", "tomorrowExcitement": "明日期待"}');

-- 7. 创建视图用于简化查询

-- 任务统计视图
CREATE OR REPLACE VIEW task_stats_view AS
SELECT 
    u.id as user_id,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) as overdue_tasks,
    COALESCE(SUM(t.estimated_minutes), 0) as total_estimated_minutes,
    COALESCE(SUM(t.actual_minutes), 0) as total_actual_minutes,
    COALESCE(AVG(t.progress), 0) as avg_progress
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
GROUP BY u.id;

-- 每日完成率趋势视图
CREATE OR REPLACE VIEW daily_completion_rate_view AS
SELECT 
    ds.user_id,
    ds.summary_date as date,
    ds.total_tasks,
    ds.completed_tasks,
    CASE 
        WHEN ds.total_tasks > 0 THEN ROUND(CAST(ds.completed_tasks AS NUMERIC) / CAST(ds.total_tasks AS NUMERIC) * 100, 2)
        ELSE 0
    END as completion_rate,
    ds.productivity_score,
    ds.mood_rating
FROM public.daily_summaries ds
ORDER BY ds.summary_date DESC;

-- 8. 完成提示
SELECT 'Database schema updated successfully!' as message;

-- 提交事务
COMMIT;