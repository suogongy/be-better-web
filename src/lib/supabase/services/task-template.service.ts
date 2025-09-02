// 任务模板类型定义
export interface TaskTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  is_system: boolean;
  is_shared: boolean;
  task_data: TaskTemplateData;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskTemplateData {
  tasks: Omit<TaskTemplateTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
  metadata?: {
    estimatedTotalTime: number;
    priorityDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
}

export interface TaskTemplateTask {
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimated_minutes?: number;
  tags?: string[];
  is_required?: boolean;
  order_index?: number;
  dependencies?: number[]; // 依赖其他任务的索引
}

export interface ApplyTemplateOptions {
  startDate?: Date;
  offsetDays?: number;
  adjustTimes?: boolean;
  preserveDependencies?: boolean;
  customizations?: Record<string, any>;
}

// 任务模板服务实现
export class TaskTemplateService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * 创建任务模板
   */
  async createTemplate(
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      tasks: any[];
      is_shared?: boolean;
    }
  ): Promise<TaskTemplate> {
    // 处理任务数据
    const taskData: TaskTemplateData = {
      tasks: data.tasks.map((task, index) => ({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        tags: task.tags || [],
        order_index: index,
        dependencies: task.dependencies || [],
      })),
      metadata: this.calculateTemplateMetadata(data.tasks),
    };

    const { data: template, error } = await this.supabase
      .from('task_templates')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        category: data.category,
        is_system: false,
        is_shared: data.is_shared || false,
        task_data: taskData,
      })
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  /**
   * 获取用户的任务模板
   */
  async getTemplates(userId: string, category?: string): Promise<TaskTemplate[]> {
    let query = this.supabase
      .from('task_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * 获取系统预设模板
   */
  async getSystemTemplates(): Promise<TaskTemplate[]> {
    const { data, error } = await this.supabase
      .from('task_templates')
      .select('*')
      .eq('is_system', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<TaskTemplate>
  ): Promise<TaskTemplate> {
    const { data, error } = await this.supabase
      .from('task_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.supabase
      .from('task_templates')
      .delete()
      .eq('id', templateId);
  }

  /**
   * 应用任务模板
   */
  async applyTemplate(
    userId: string,
    templateId: string,
    options: ApplyTemplateOptions = {}
  ): Promise<any[]> {
    // 获取模板
    const { data: template, error: templateError } = await this.supabase
      .from('task_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const startDate = options.startDate || new Date();
    const offsetDays = options.offsetDays || 0;
    const createdTasks: any[] = [];
    const taskMap = new Map<number, string>(); // 索引到任务ID的映射

    // 处理模板中的每个任务
    for (let i = 0; i < template.task_data.tasks.length; i++) {
      const templateTask = template.task_data.tasks[i];
      
      // 计算任务的截止日期
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + offsetDays + (templateTask.order_index || 0));

      // 创建任务
      const taskData = {
        user_id: userId,
        title: templateTask.title,
        description: templateTask.description,
        category: templateTask.category,
        priority: templateTask.priority,
        estimated_minutes: templateTask.estimated_minutes,
        tags: templateTask.tags || [],
        due_date: dueDate.toISOString(),
        template_id: templateId,
        is_template: false,
        order_index: templateTask.order_index || 0,
        ...options.customizations,
      };

      // 如果有依赖，暂时不设置，等所有任务创建完成后再处理
      if (templateTask.dependencies && templateTask.dependencies.length > 0) {
        delete taskData.dependencies;
      }

      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) throw taskError;

      createdTasks.push(task);
      taskMap.set(i, task.id);
    }

    // 处理任务依赖关系
    if (options.preserveDependencies !== false) {
      for (let i = 0; i < template.task_data.tasks.length; i++) {
        const templateTask = template.task_data.tasks[i];
        if (templateTask.dependencies && templateTask.dependencies.length > 0) {
          const taskId = taskMap.get(i);
          if (taskId) {
            for (const depIndex of templateTask.dependencies) {
              const dependsOnTaskId = taskMap.get(depIndex);
              if (dependsOnTaskId) {
                await this.supabase
                  .from('task_dependencies')
                  .insert({
                    user_id: userId,
                    task_id: taskId,
                    depends_on_task_id: dependsOnTaskId,
                    dependency_type: 'finish_to_start',
                  });
              }
            }
          }
        }
      }
    }

    // 更新模板使用次数
    await this.incrementTemplateUsage(templateId);

    return createdTasks;
  }

  /**
   * 预览模板应用结果
   */
  async previewTemplate(
    userId: string,
    templateId: string,
    previewDate: Date
  ): Promise<any[]> {
    const { data: template, error } = await this.supabase
      .from('task_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    return template.task_data.tasks.map((task: any, index: number) => ({
      ...task,
      due_date: new Date(previewDate.getTime() + index * 24 * 60 * 60 * 1000),
      is_preview: true,
    }));
  }

  /**
   * 从现有任务创建模板
   */
  async createTemplateFromTasks(
    userId: string,
    taskIds: string[],
    templateName: string,
    description?: string
  ): Promise<TaskTemplate> {
    // 获取任务数据
    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .order('order_index');

    if (error) throw error;

    // 转换为模板格式
    const templateTasks = tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      estimated_minutes: task.estimated_minutes,
      tags: task.tags || [],
      order_index: task.order_index || 0,
    }));

    const taskData: TaskTemplateData = {
      tasks: templateTasks,
      metadata: this.calculateTemplateMetadata(tasks),
    };

    // 创建模板
    const { data: template, error: createError } = await this.supabase
      .from('task_templates')
      .insert({
        user_id: userId,
        name: templateName,
        description,
        category: 'custom',
        is_system: false,
        is_shared: false,
        task_data,
      })
      .select()
      .single();

    if (createError) throw createError;
    return template;
  }

  /**
   * 增加模板使用次数
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    await this.supabase.rpc('increment_template_usage', {
      template_id: templateId,
    });
  }

  /**
   * 获取热门模板
   */
  async getPopularTemplates(userId: string, limit: number = 10): Promise<TaskTemplate[]> {
    const { data, error } = await this.supabase
      .from('task_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_shared.eq.true,is_system.eq.true`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * 获取用户最常用的模板
   */
  async getUserFavoriteTemplates(userId: string): Promise<TaskTemplate[]> {
    // 通过查询用户创建的任务中使用最多的模板
    const { data, error } = await this.supabase
      .from('tasks')
      .select('template_id, count')
      .eq('user_id', userId)
      .not('template_id', 'is', null)
      .group('template_id')
      .order('count', { ascending: false })
      .limit(5);

    if (error) return [];

    const templateIds = data.map((item: any) => item.template_id);
    
    const { data: templates } = await this.supabase
      .from('task_templates')
      .select('*')
      .in('id', templateIds);

    return templates || [];
  }

  /**
   * 计算模板元数据
   */
  private calculateTemplateMetadata(tasks: any[]): TaskTemplateData['metadata'] {
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0);
    
    const priorityDistribution = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      estimatedTotalTime: totalEstimatedTime,
      priorityDistribution,
      categoryDistribution,
    };
  }

  /**
   * 获取模板使用统计
   */
  async getTemplateUsageStats(templateId: string): Promise<{
    totalUses: number;
    uniqueUsers: number;
    averageCompletionRate: number;
  }> {
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('user_id, status')
      .eq('template_id', templateId);

    if (!tasks) {
      return { totalUses: 0, uniqueUsers: 0, averageCompletionRate: 0 };
    }

    const totalUses = tasks.length;
    const uniqueUsers = new Set(tasks.map(t => t.user_id)).size;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const averageCompletionRate = totalUses > 0 ? (completedTasks / totalUses) * 100 : 0;

    return {
      totalUses,
      uniqueUsers,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
    };
  }

  /**
   * 克隆模板
   */
  async cloneTemplate(userId: string, templateId: string): Promise<TaskTemplate> {
    const { data: originalTemplate } = await this.supabase
      .from('task_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const { data: clonedTemplate } = await this.supabase
      .from('task_templates')
      .insert({
        user_id: userId,
        name: `${originalTemplate.name} (副本)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        is_system: false,
        is_shared: false,
        task_data: originalTemplate.task_data,
      })
      .select()
      .single();

    return clonedTemplate;
  }
}