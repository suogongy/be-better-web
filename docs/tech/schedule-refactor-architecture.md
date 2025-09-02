# 日程管理系统重构架构设计

## 1. 系统架构概述

### 1.1 架构分层

```
┌─────────────────────────────────────────┐
│              表现层 (UI)                │
│  ┌─────────────┐ ┌─────────────────────┐│
│  │  日程页面   │ │     任务组件        ││
│  └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│             应用层 (API)               │
│  ┌─────────────┐ ┌─────────────────────┐│
│  │ 路由处理     │ │    业务逻辑         ││
│  └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│             服务层 (Service)            │
│  ┌─────────────┐ ┌─────────────────────┐│
│  │ 任务服务     │ │    总结服务         ││
│  │ 重复任务服务 │ │    模板服务         ││
│  │ 自动化服务   │ │    博客生成服务     ││
│  └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│             数据层 (Data)               │
│  ┌─────────────┐ ┌─────────────────────┐│
│  │  数据库     │ │     缓存            ││
│  └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────┘
```

### 1.2 核心模块

1. **任务管理模块**：基础CRUD、状态管理、批量操作
2. **重复任务模块**：重复模式、实例生成、生命周期管理
3. **任务模板模块**：模板创建、应用、管理
4. **自动化模块**：规则引擎、触发器、动作执行
5. **数据分析模块**：统计计算、趋势分析、洞察生成
6. **博客生成模块**：内容模板、智能生成、发布流程

## 2. 数据库架构优化

### 2.1 新增表结构

#### task_templates 表（任务模板）
```sql
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_system BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    task_data JSONB NOT NULL, -- 存储模板的任务结构
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### task_dependencies 表（任务依赖）
```sql
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID NOT NULL,
    depends_on_task_id UUID NOT NULL,
    dependency_type VARCHAR(20) NOT NULL CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
    lag_minutes INTEGER DEFAULT 0, -- 延迟时间（分钟）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);
```

#### task_instances 表（任务实例，用于重复任务）
```sql
CREATE TABLE task_instances (
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
```

#### automation_rules 表（自动化规则）
```sql
CREATE TABLE automation_rules (
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
```

#### blog_templates 表（博客模板）
```sql
CREATE TABLE blog_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, custom
    template_content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    variables JSONB, -- 模板变量定义
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### task_reminders 表（任务提醒）
```sql
CREATE TABLE task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    type VARCHAR(20) DEFAULT 'popup' CHECK (type IN ('popup', 'email', 'browser')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
    is_repeating BOOLEAN DEFAULT false,
    repeat_interval INTEGER DEFAULT 5, -- 重复间隔（分钟）
    max_repeats INTEGER DEFAULT 3,
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 现有表结构优化

#### tasks 表优化
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_zone VARCHAR(50) DEFAULT 'UTC';
```

#### daily_summaries 表优化
```sql
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS ai_insights TEXT;
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS key_achievements TEXT[];
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS challenges_overcome TEXT[];
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS tomorrow_plan JSONB;
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS blog_generation_config JSONB;
```

## 3. 服务层架构

### 3.1 任务服务 (TaskService)

```typescript
// src/lib/supabase/services/task.service.ts
export class TaskService {
  // 基础CRUD
  async createTask(data: CreateTaskInput): Promise<Task>
  async getTask(id: string): Promise<Task>
  async updateTask(id: string, data: UpdateTaskInput): Promise<Task>
  async deleteTask(id: string): Promise<void>
  
  // 批量操作
  async batchUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<Task[]>
  async batchDeleteTasks(taskIds: string[]): Promise<void>
  
  // 查询和筛选
  async getTasks(filters: TaskFilters): Promise<Task[]>
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]>
  async getOverdueTasks(): Promise<Task[]>
  
  // 任务操作
  async completeTask(id: string, data: CompleteTaskInput): Promise<Task>
  async postponeTask(id: string, newDate: Date): Promise<Task>
  async prioritizeTask(id: string, priority: Priority): Promise<Task>
  
  // 统计和分析
  async getTaskStats(dateRange: DateRange): Promise<TaskStats>
  async getProductivityMetrics(userId: string): Promise<ProductivityMetrics>
}
```

### 3.2 重复任务服务 (RecurringTaskService)

```typescript
// src/lib/supabase/services/recurring-task.service.ts
export class RecurringTaskService {
  // 重复任务管理
  async createRecurringTask(data: CreateRecurringTaskInput): Promise<Task>
  async generateRecurringInstances(taskId: string, endDate: Date): Promise<TaskInstance[]>
  async updateRecurringPattern(taskId: string, pattern: RecurrencePattern): Promise<Task>
  
  // 实例管理
  async getTaskInstances(taskId: string): Promise<TaskInstance[]>
  async updateInstance(instanceId: string, data: UpdateInstanceInput): Promise<TaskInstance>
  async skipInstance(instanceId: string): Promise<void>
  
  // 自动生成
  async generateDailyRecurringTasks(): Promise<void>
  async cleanupOldInstances(): Promise<void>
  
  // 重复模式解析
  parseRecurrencePattern(pattern: RecurrencePattern): RecurrenceRule
  getNextOccurrence(task: Task, fromDate: Date): Date | null
}
```

### 3.3 任务模板服务 (TaskTemplateService)

```typescript
// src/lib/supabase/services/task-template.service.ts
export class TaskTemplateService {
  // 模板管理
  async createTemplate(data: CreateTemplateInput): Promise<TaskTemplate>
  async getTemplates(category?: string): Promise<TaskTemplate[]>
  async updateTemplate(id: string, data: UpdateTemplateInput): Promise<TaskTemplate>
  async deleteTemplate(id: string): Promise<void>
  
  // 模板应用
  async applyTemplate(templateId: string, options: ApplyTemplateOptions): Promise<Task[]>
  async previewTemplate(templateId: string, date: Date): Promise<Task[]>
  
  // 预设模板
  async getSystemTemplates(): Promise<TaskTemplate[]>
  async createDailyRoutineTemplate(tasks: Task[]): Promise<TaskTemplate>
  
  // 使用统计
  async incrementTemplateUsage(templateId: string): Promise<void>
  async getPopularTemplates(): Promise<TaskTemplate[]>
}
```

### 3.4 自动化服务 (AutomationService)

```typescript
// src/lib/supabase/services/automation.service.ts
export class AutomationService {
  // 规则管理
  async createRule(data: CreateRuleInput): Promise<AutomationRule>
  async getRules(): Promise<AutomationRule[]>
  async executeRule(ruleId: string): Promise<void>
  
  // 触发器处理
  async handleTaskStatusChange(taskId: string, oldStatus: string, newStatus: string): Promise<void>
  async handleTimeTrigger(triggerType: string): Promise<void>
  
  // 动作执行
  async createAction(action: AutomationAction): Promise<void>
  async sendNotification(notification: Notification): Promise<void>
  async createFollowUpTask(sourceTask: Task): Promise<Task>
  
  // 定时任务
  async processScheduledAutomations(): Promise<void>
  async cleanupOldExecutions(): Promise<void>
}
```

### 3.5 博客生成服务 (BlogGenerationService)

```typescript
// src/lib/supabase/services/blog-generation.service.ts
export class BlogGenerationService {
  // 博客生成
  async generateBlogFromSummary(summaryId: string, templateId?: string): Promise<Post>
  async generateAutoBlog(date: Date): Promise<Post>
  async previewBlogGeneration(summaryId: string, templateId: string): Promise<string>
  
  // 模板管理
  async createBlogTemplate(data: CreateBlogTemplateInput): Promise<BlogTemplate>
  async getBlogTemplates(type?: string): Promise<BlogTemplate[]>
  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<string>
  
  // 智能内容生成
  async generateInsights(summary: DailySummary): Promise<string>
  async generateTitle(content: string): Promise<string>
  async generateTags(content: string): Promise<string[]>
  
  // 发布管理
  async scheduleBlogPost(postId: string, publishDate: Date): Promise<void>
  async autoPublishApprovedPosts(): Promise<void>
}
```

## 4. API 路由设计

### 4.1 任务管理 API

```typescript
// src/app/api/tasks/route.ts
export async function GET(request: Request) {
  // 获取任务列表，支持筛选、排序、分页
}

export async function POST(request: Request) {
  // 创建新任务
}

// src/app/api/tasks/[id]/route.ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // 更新任务
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // 删除任务
}

// src/app/api/tasks/batch/route.ts
export async function POST(request: Request) {
  // 批量操作任务
}
```

### 4.2 重复任务 API

```typescript
// src/app/api/tasks/recurring/generate/route.ts
export async function POST(request: Request) {
  // 手动生成重复任务实例
}

// src/app/api/tasks/recurring/instances/[taskId]/route.ts
export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  // 获取任务的所有实例
}
```

### 4.3 自动化 API

```typescript
// src/app/api/automation/rules/route.ts
export async function GET(request: Request) {
  // 获取自动化规则列表
}

export async function POST(request: Request) {
  // 创建自动化规则
}

// src/app/api/automation/trigger/route.ts
export async function POST(request: Request) {
  // 手动触发自动化规则
}
```

### 4.4 博客生成 API

```typescript
// src/app/api/blog/generate/route.ts
export async function POST(request: Request) {
  // 从日程生成博客
}

// src/app/api/blog/preview/route.ts
export async function POST(request: Request) {
  // 预览博客生成
}
```

## 5. 前端组件架构

### 5.1 任务管理组件

```
TaskPage (主页面)
├── TaskHeader (页面头部)
├── TaskFilters (筛选器)
├── TaskViews (视图切换)
│   ├── TaskListView (列表视图)
│   ├── TaskBoardView (看板视图)
│   ├── TaskCalendarView (日历视图)
│   └── TaskTimelineView (时间线视图)
└── TaskFormModal (任务表单弹窗)
    ├── TaskBasicInfo (基本信息)
    ├── TaskDateTime (时间设置)
    ├── TaskRecurrence (重复设置)
    ├── TaskDependencies (依赖设置)
    └── TaskAdvanced (高级设置)
```

### 5.2 重复任务组件

```
RecurringTaskManager
├── RecurringPatternSelector (重复模式选择)
├── RecurringPreview (重复预览)
├── RecurringInstancesList (实例列表)
└── RecurringSettings (重复设置)
```

### 5.3 自动化规则组件

```
AutomationPage
├── RuleList (规则列表)
├── RuleBuilder (规则构建器)
│   ├── TriggerSelector (触发器选择)
│   ├── ActionSelector (动作选择)
│   └── ConditionBuilder (条件构建)
└── RuleExecutionHistory (执行历史)
```

### 5.4 博客生成组件

```
BlogGenerationPage
├── TemplateSelector (模板选择器)
├── ContentPreview (内容预览)
├── BlogEditor (博客编辑器)
└── PublishSettings (发布设置)
```

## 6. 定时任务和自动化

### 6.1 定时任务设计

```typescript
// src/lib/cron-jobs.ts
export const scheduledJobs = {
  // 每日凌晨生成重复任务
  '0 0 * * *': generateDailyRecurringTasks,
  
  // 每小时检查任务提醒
  '0 * * * *': processTaskReminders,
  
  // 每5分钟处理自动化规则
  '*/5 * * * *': processAutomationRules,
  
  // 每日凌晨生成博客草稿
  '0 22 * * *': generateDailyBlogDrafts,
  
  // 每周日凌晨生成周报
  '0 9 * * 0': generateWeeklySummary,
  
  // 每月1号生成月报
  '0 9 1 * *': generateMonthlySummary
};
```

### 6.2 自动化规则引擎

```typescript
// src/lib/automation/engine.ts
export class AutomationEngine {
  async evaluateTrigger(trigger: Trigger, context: ExecutionContext): Promise<boolean>
  async executeAction(action: Action, context: ExecutionContext): Promise<ActionResult>
  async processRules(): Promise<void>
}
```

## 7. 性能优化策略

### 7.1 数据库优化
- 为常用查询字段添加索引
- 使用物化视图存储统计数据
- 实现分页查询避免大量数据加载
- 使用连接池优化数据库连接

### 7.2 缓存策略
- Redis缓存用户任务数据
- 缓存重复任务生成结果
- 缓存博客模板渲染结果
- CDN缓存静态资源

### 7.3 前端优化
- 虚拟滚动处理大量任务列表
- 懒加载日历视图
- 防抖处理搜索输入
- 预加载下一页数据

## 8. 安全考虑

### 8.1 数据安全
- 所有API接口需要认证
- 行级安全策略保护用户数据
- 敏感操作需要二次确认
- 审计日志记录关键操作

### 8.2 输入验证
- 使用Zod进行严格的数据验证
- 防止SQL注入和XSS攻击
- 限制文件上传大小和类型
- 验证用户权限

## 9. 监控和日志

### 9.1 性能监控
- API响应时间监控
- 数据库查询性能监控
- 前端渲染性能监控
- 用户行为分析

### 9.2 错误监控
- 全局错误捕获和处理
- 错误日志记录和分析
- 自动错误报警
- 用户反馈收集

这个架构设计提供了一个完整的日程管理系统重构方案，涵盖了从数据库设计到前端实现的各个方面。通过模块化的设计和清晰的分层架构，系统将具有良好的可维护性、可扩展性和性能表现。