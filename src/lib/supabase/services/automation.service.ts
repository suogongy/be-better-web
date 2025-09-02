// 自动化规则类型定义
export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  priority: number;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  last_triggered_at?: Date;
  execution_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TriggerContext {
  user_id: string;
  trigger_type: string;
  trigger_data: Record<string, any>;
  timestamp: Date;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

// 自动化服务实现
export class AutomationService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * 创建自动化规则
   */
  async createRule(userId: string, data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config: Record<string, any>;
    action_type: string;
    action_config: Record<string, any>;
  }): Promise<AutomationRule> {
    const { data: rule, error } = await this.supabase
      .from('automation_rules')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config,
        action_type: data.action_type,
        action_config: data.action_config,
      })
      .select()
      .single();

    if (error) throw error;
    return rule;
  }

  /**
   * 获取用户的自动化规则
   */
  async getRules(userId: string): Promise<AutomationRule[]> {
    const { data, error } = await this.supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 更新自动化规则
   */
  async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await this.supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 删除自动化规则
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);
  }

  /**
   * 执行自动化规则
   */
  async executeRule(ruleId: string, context?: TriggerContext): Promise<ActionResult> {
    // 获取规则
    const { data: rule, error: ruleError } = await this.supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError) throw ruleError;
    if (!rule.is_enabled) {
      return { success: false, message: 'Rule is disabled' };
    }

    try {
      // 检查触发条件
      if (context && !await this.evaluateTrigger(rule, context)) {
        return { success: false, message: 'Trigger conditions not met' };
      }

      // 执行动作
      const result = await this.executeAction(rule, context);

      // 更新执行记录
      await this.updateRule(ruleId, {
        last_triggered_at: new Date(),
        execution_count: rule.execution_count + 1,
      });

      return result;
    } catch (error) {
      console.error(`Failed to execute rule ${ruleId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 处理任务状态变更触发器
   */
  async handleTaskStatusChange(
    taskId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    // 获取任务信息
    const { data: task } = await this.supabase
      .from('tasks')
      .select('user_id, title, category')
      .eq('id', taskId)
      .single();

    if (!task) return;

    // 获取相关的自动化规则
    const rules = await this.getRules(task.user_id);

    for (const rule of rules) {
      if (rule.trigger_type === 'task_status_change') {
        const context: TriggerContext = {
          user_id: task.user_id,
          trigger_type: 'task_status_change',
          trigger_data: {
            task_id: taskId,
            old_status: oldStatus,
            new_status: newStatus,
            task_title: task.title,
            task_category: task.category,
          },
          timestamp: new Date(),
        };

        // 检查规则条件
        if (await this.evaluateTrigger(rule, context)) {
          await this.executeRule(rule.id, context);
        }
      }
    }
  }

  /**
   * 处理时间触发器
   */
  async handleTimeTrigger(triggerType: string): Promise<void> {
    // 获取所有启用的时间触发规则
    const { data: rules } = await this.supabase
      .from('automation_rules')
      .select('*')
      .eq('is_enabled', true)
      .eq('trigger_type', triggerType);

    if (!rules) return;

    for (const rule of rules) {
      const context: TriggerContext = {
        user_id: rule.user_id,
        trigger_type: triggerType,
        trigger_data: {},
        timestamp: new Date(),
      };

      await this.executeRule(rule.id, context);
    }
  }

  /**
   * 评估触发条件
   */
  private async evaluateTrigger(rule: AutomationRule, context: TriggerContext): Promise<boolean> {
    const { trigger_config } = rule;

    switch (rule.trigger_type) {
      case 'task_status_change':
        return this.evaluateTaskStatusTrigger(trigger_config, context.trigger_data);

      case 'daily_summary':
        return this.evaluateDailySummaryTrigger(trigger_config, context);

      case 'task_due_soon':
        return await this.evaluateTaskDueSoonTrigger(trigger_config, context.user_id);

      case 'task_overdue':
        return await this.evaluateTaskOverdueTrigger(trigger_config, context.user_id);

      case 'time_based':
        return this.evaluateTimeBasedTrigger(trigger_config);

      default:
        return false;
    }
  }

  /**
   * 评估任务状态变更触发器
   */
  private evaluateTaskStatusTrigger(config: any, triggerData: any): boolean {
    // 检查状态变更是否匹配
    if (config.from_status && config.from_status !== triggerData.old_status) {
      return false;
    }

    if (config.to_status && config.to_status !== triggerData.new_status) {
      return false;
    }

    // 检查任务分类
    if (config.category && config.category !== triggerData.task_category) {
      return false;
    }

    // 检查任务标题关键词
    if (config.title_keywords && config.title_keywords.length > 0) {
      const title = triggerData.task_title.toLowerCase();
      const hasKeyword = config.title_keywords.some((keyword: string) => 
        title.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    return true;
  }

  /**
   * 评估每日总结触发器
   */
  private async evaluateDailySummaryTrigger(config: any, context: TriggerContext): Promise<boolean> {
    // 获取当天的总结
    const today = new Date().toISOString().split('T')[0];
    const { data: summary } = await this.supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', context.user_id)
      .eq('date', today)
      .single();

    if (!summary) return false;

    // 检查完成率条件
    if (config.min_completion_rate !== undefined) {
      if (summary.completion_rate < config.min_completion_rate) {
        return false;
      }
    }

    // 检查生产力评分
    if (config.min_productivity_score !== undefined) {
      if (summary.productivity_score < config.min_productivity_score) {
        return false;
      }
    }

    return true;
  }

  /**
   * 评估任务即将到期触发器
   */
  private async evaluateTaskDueSoonTrigger(config: any, userId: string): Promise<boolean> {
    const hoursAhead = config.hours_ahead || 24;
    const cutoffTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('due_date', cutoffTime.toISOString())
      .gt('due_date', new Date().toISOString());

    return tasks && tasks.length > 0;
  }

  /**
   * 评估任务逾期触发器
   */
  private async evaluateTaskOverdueTrigger(config: any, userId: string): Promise<boolean> {
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .lt('due_date', new Date().toISOString());

    return tasks && tasks.length > 0;
  }

  /**
   * 评估时间触发器
   */
  private evaluateTimeBasedTrigger(config: any): boolean {
    const now = new Date();
    
    // 检查时间
    if (config.time) {
      const [hours, minutes] = config.time.split(':').map(Number);
      if (now.getHours() !== hours || now.getMinutes() !== minutes) {
        return false;
      }
    }

    // 检查星期几
    if (config.weekdays && config.weekdays.length > 0) {
      const dayOfWeek = now.getDay() || 7; // 1-7 (周一到周日)
      if (!config.weekdays.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 执行动作
   */
  private async executeAction(rule: AutomationRule, context?: TriggerContext): Promise<ActionResult> {
    const { action_type, action_config } = rule;

    switch (action_type) {
      case 'send_notification':
        return await this.sendNotification(rule.user_id, action_config, context);

      case 'create_follow_up_task':
        return await this.createFollowUpTask(rule.user_id, action_config, context);

      case 'update_task_priority':
        return await this.updateTaskPriority(action_config, context);

      case 'move_task_to_category':
        return await this.moveTaskToCategory(action_config, context);

      case 'generate_daily_summary':
        return await this.generateDailySummary(rule.user_id, action_config);

      case 'create_blog_draft':
        return await this.createBlogDraft(rule.user_id, action_config, context);

      case 'send_email':
        return await this.sendEmail(rule.user_id, action_config, context);

      default:
        return { success: false, message: `Unknown action type: ${action_type}` };
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(
    userId: string,
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    const message = this.renderTemplate(config.message, context?.trigger_data || {});

    // 这里可以集成通知服务
    console.log(`Notification for user ${userId}: ${message}`);

    return { success: true, message: 'Notification sent' };
  }

  /**
   * 创建后续任务
   */
  private async createFollowUpTask(
    userId: string,
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    const taskData = {
      user_id: userId,
      title: this.renderTemplate(config.title, context?.trigger_data || {}),
      description: this.renderTemplate(config.description, context?.trigger_data || {}),
      category: config.category || 'general',
      priority: config.priority || 'medium',
      due_date: this.calculateDueDate(config.due_in_days || 1),
    };

    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Follow-up task created', data: task };
  }

  /**
   * 更新任务优先级
   */
  private async updateTaskPriority(
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    const taskId = context?.trigger_data?.task_id;
    if (!taskId) {
      return { success: false, message: 'No task ID in context' };
    }

    const { error } = await this.supabase
      .from('tasks')
      .update({ priority: config.priority })
      .eq('id', taskId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Task priority updated' };
  }

  /**
   * 移动任务到分类
   */
  private async moveTaskToCategory(
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    const taskId = context?.trigger_data?.task_id;
    if (!taskId) {
      return { success: false, message: 'No task ID in context' };
    }

    const { error } = await this.supabase
      .from('tasks')
      .update({ category: config.category })
      .eq('id', taskId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Task category updated' };
  }

  /**
   * 生成每日总结
   */
  private async generateDailySummary(
    userId: string,
    config: any
  ): Promise<ActionResult> {
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否已存在
    const { data: existing } = await this.supabase
      .from('daily_summaries')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return { success: false, message: 'Summary already exists for today' };
    }

    // 计算统计数据
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', today)
      .lt('completed_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    const summaryData = {
      user_id: userId,
      date: today,
      total_tasks: tasks?.length || 0,
      completed_tasks: tasks?.length || 0,
      completion_rate: 100,
      productivity_score: config.default_score || 8,
      notes: config.auto_generate_notes ? this.generateSummaryNotes(tasks || []) : null,
    };

    const { data: summary, error } = await this.supabase
      .from('daily_summaries')
      .insert(summaryData)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Daily summary generated', data: summary };
  }

  /**
   * 创建博客草稿
   */
  private async createBlogDraft(
    userId: string,
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取今日总结
    const { data: summary } = await this.supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!summary) {
      return { success: false, message: 'No daily summary found for today' };
    }

    // 生成博客内容
    const content = this.generateBlogContent(summary, config.template);

    const postData = {
      user_id: userId,
      title: `日程总结 - ${today}`,
      content,
      excerpt: content.substring(0, 200) + '...',
      status: 'draft',
      type: 'schedule',
      published_at: null,
    };

    const { data: post, error } = await this.supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Blog draft created', data: post };
  }

  /**
   * 发送邮件
   */
  private async sendEmail(
    userId: string,
    config: any,
    context?: TriggerContext
  ): Promise<ActionResult> {
    // 获取用户邮箱
    const { data: user } = await this.supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      return { success: false, message: 'User email not found' };
    }

    const subject = this.renderTemplate(config.subject, context?.trigger_data || {});
    const body = this.renderTemplate(config.body, context?.trigger_data || {});

    // 这里集成邮件服务
    console.log(`Email to ${user.email}: ${subject}`);

    return { success: true, message: 'Email sent' };
  }

  /**
   * 渲染模板字符串
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * 计算截止日期
   */
  private calculateDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  /**
   * 生成总结备注
   */
  private generateSummaryNotes(tasks: any[]): string {
    const completedCount = tasks.length;
    const totalTime = tasks.reduce((sum, task) => sum + (task.actual_minutes || 0), 0);
    const categories = [...new Set(tasks.map(t => t.category))];

    return `今日完成了 ${completedCount} 个任务，总计用时 ${totalTime} 分钟。涉及领域：${categories.join('、')}。`;
  }

  /**
   * 生成博客内容
   */
  private generateBlogContent(summary: any, template?: string): string {
    const defaultTemplate = `# {{date}} 日程总结

## 今日完成
完成了 {{completed_tasks}} 个任务，完成率 {{completion_rate}}%。

## 效率评分
今日生产力评分：{{productivity_score}}/10

## 总结
{{notes}}
`;

    const templateToUse = template || defaultTemplate;
    return this.renderTemplate(templateToUse, summary);
  }

  /**
   * 处理定时自动化任务
   */
  async processScheduledAutomations(): Promise<void> {
    const triggers = ['daily_summary', 'task_due_soon', 'task_overdue', 'time_based'];
    
    for (const trigger of triggers) {
      await this.handleTimeTrigger(trigger);
    }
  }

  /**
   * 清理旧的执行记录
   */
  async cleanupOldExecutions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 保留6个月

    // 这里可以添加清理逻辑，比如将执行历史归档到单独的表
  }
}