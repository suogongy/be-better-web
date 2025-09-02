// 重复任务类型定义
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // 重复间隔
  weekdays?: number[]; // 1-7 (周一到周日)
  monthDays?: number[]; // 1-31
  nthWeekday?: { week: number; weekday: number }; // 每月第几个星期几
  endDate?: Date; // 结束日期
  maxOccurrences?: number; // 最大重复次数
  excludeDates?: Date[]; // 排除的日期
}

export interface TaskInstance {
  id: string;
  user_id: string;
  task_id: string;
  parent_instance_id?: string;
  instance_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  completed_at?: Date;
  actual_minutes?: number;
  completion_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// 重复任务服务实现
export class RecurringTaskService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * 创建重复任务
   */
  async createRecurringTask(taskData: any, pattern: RecurrencePattern): Promise<any> {
    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert({
        ...taskData,
        is_recurring: true,
        recurrence_pattern: pattern,
      })
      .select()
      .single();

    if (error) throw error;

    // 生成初始实例
    await this.generateInitialInstances(task.id, pattern);

    return task;
  }

  /**
   * 生成重复任务实例
   */
  async generateRecurringInstances(
    taskId: string,
    endDate: Date,
    maxInstances: number = 30
  ): Promise<TaskInstance[]> {
    const { data: task, error: taskError } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    if (!task.is_recurring || !task.recurrence_pattern) {
      throw new Error('Task is not a recurring task');
    }

    const pattern = task.recurrence_pattern;
    const instances: TaskInstance[] = [];
    const user_id = task.user_id;

    // 获取已存在的实例日期
    const { data: existingInstances } = await this.supabase
      .from('task_instances')
      .select('instance_date')
      .eq('task_id', taskId);

    const existingDates = new Set(
      existingInstances?.map((inst: any) => inst.instance_date) || []
    );

    // 计算下一个实例日期
    let currentDate = new Date(task.due_date || task.created_at);
    currentDate.setHours(0, 0, 0, 0);

    while (instances.length < maxInstances && currentDate <= endDate) {
      // 检查是否匹配重复模式
      if (this.matchesPattern(currentDate, pattern) && !existingDates.has(currentDate.toISOString().split('T')[0])) {
        instances.push({
          id: '',
          user_id,
          task_id: taskId,
          instance_date: new Date(currentDate),
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // 计算下一个日期
      currentDate = this.getNextOccurrence(currentDate, pattern);
      if (!currentDate) break;
    }

    // 批量插入实例
    if (instances.length > 0) {
      const { data: insertedInstances, error: insertError } = await this.supabase
        .from('task_instances')
        .insert(instances.map(inst => ({
          user_id: inst.user_id,
          task_id: inst.task_id,
          instance_date: inst.instance_date.toISOString(),
          status: inst.status,
        })))
        .select();

      if (insertError) throw insertError;
      return insertedInstances || [];
    }

    return [];
  }

  /**
   * 检查日期是否匹配重复模式
   */
  private matchesPattern(date: Date, pattern: RecurrencePattern): boolean {
    const dayOfWeek = date.getDay() || 7; // 转换为1-7 (周一到周日)
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    switch (pattern.type) {
      case 'daily':
        return true;

      case 'weekly':
        return !pattern.weekdays || pattern.weekdays.includes(dayOfWeek);

      case 'monthly':
        if (pattern.monthDays) {
          return pattern.monthDays.includes(dayOfMonth);
        }
        if (pattern.nthWeekday) {
          return weekOfMonth === pattern.nthWeekday.week && 
                 dayOfWeek === pattern.nthWeekday.weekday;
        }
        return dayOfMonth === 1; // 默认每月1号

      case 'yearly':
        return true; // 简化处理，实际应该检查月份和日期

      case 'custom':
        // 自定义模式逻辑
        return true;

      default:
        return false;
    }
  }

  /**
   * 获取下一个重复日期
   */
  private getNextOccurrence(date: Date, pattern: RecurrencePattern): Date | null {
    const next = new Date(date);
    
    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;

      case 'weekly':
        next.setDate(next.getDate() + (7 * pattern.interval));
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval);
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + pattern.interval);
        break;

      default:
        return null;
    }

    // 检查是否超过结束日期
    if (pattern.endDate && next > pattern.endDate) {
      return null;
    }

    return next;
  }

  /**
   * 生成初始实例
   */
  private async generateInitialInstances(taskId: string, pattern: RecurrencePattern): Promise<void> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 提前生成一个月的实例

    await this.generateRecurringInstances(taskId, endDate, 10);
  }

  /**
   * 获取任务的所有实例
   */
  async getTaskInstances(taskId: string): Promise<TaskInstance[]> {
    const { data, error } = await this.supabase
      .from('task_instances')
      .select('*')
      .eq('task_id', taskId)
      .order('instance_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 更新任务实例
   */
  async updateInstance(instanceId: string, updates: Partial<TaskInstance>): Promise<TaskInstance> {
    const { data, error } = await this.supabase
      .from('task_instances')
      .update(updates)
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 跳过实例
   */
  async skipInstance(instanceId: string): Promise<void> {
    await this.updateInstance(instanceId, { status: 'skipped' });
  }

  /**
   * 暂停重复任务
   */
  async pauseRecurringTask(taskId: string): Promise<void> {
    await this.supabase
      .from('tasks')
      .update({ is_recurring: false })
      .eq('id', taskId);
  }

  /**
   * 恢复重复任务
   */
  async resumeRecurringTask(taskId: string): Promise<void> {
    const { data: task } = await this.supabase
      .from('tasks')
      .select('recurrence_pattern')
      .eq('id', taskId)
      .single();

    if (task?.recurrence_pattern) {
      await this.supabase
        .from('tasks')
        .update({ is_recurring: true })
        .eq('id', taskId);

      // 重新生成实例
      await this.generateRecurringInstances(taskId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    }
  }

  /**
   * 获取用户今日需要处理的重复任务
   */
  async getTodayRecurringTasks(userId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('task_instances')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('user_id', userId)
      .eq('instance_date', today)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  }

  /**
   * 自动生成每日重复任务（定时任务使用）
   */
  async generateDailyRecurringTasks(): Promise<void> {
    // 获取所有活跃的重复任务
    const { data: recurringTasks } = await this.supabase
      .from('tasks')
      .select('id, user_id, recurrence_pattern')
      .eq('is_recurring', true)
      .not('recurrence_pattern', 'is', null);

    if (!recurringTasks) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 提前生成一周的实例

    for (const task of recurringTasks) {
      try {
        await this.generateRecurringInstances(task.id, endDate, 7);
      } catch (error) {
        console.error(`Failed to generate instances for task ${task.id}:`, error);
      }
    }
  }

  /**
   * 清理旧的已完成实例
   */
  async cleanupOldInstances(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 保留3个月

    await this.supabase
      .from('task_instances')
      .delete()
      .lt('instance_date', cutoffDate.toISOString())
      .in('status', ['completed', 'skipped', 'cancelled']);
  }
}