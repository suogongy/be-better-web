// 博客生成服务类型定义
export interface BlogTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  template_content: string;
  is_default: boolean;
  variables?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BlogGenerationOptions {
  templateId?: string;
  includeTasks?: boolean;
  includeStats?: boolean;
  includeInsights?: boolean;
  customPrompt?: string;
  publishDate?: Date;
  autoPublish?: boolean;
}

export interface BlogPreview {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  estimatedReadingTime: number;
}

// 博客生成服务实现
export class BlogGenerationService {
  private supabase: any;
  private openai?: any; // 可选的AI集成

  constructor(supabase: any, openai?: any) {
    this.supabase = supabase;
    // 只有当openai有效且不是null时才设置
    if (openai) {
      this.openai = openai;
    }
  }

  /**
   * 从日程总结生成博客
   */
  async generateBlogFromSummary(
    summaryId: string,
    options: BlogGenerationOptions = {}
  ): Promise<any> {
    // 获取总结数据
    const { data: summary, error: summaryError } = await this.supabase
      .from('daily_summaries')
      .select(`
        *,
        user:user_id(
          name,
          timezone
        )
      `)
      .eq('id', summaryId)
      .single();

    if (summaryError) throw summaryError;

    // 获取完成任务
    const { data: completedTasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', summary.user_id)
      .eq('status', 'completed')
      .gte('completed_at', summary.date)
      .lt('completed_at', new Date(new Date(summary.date).getTime() + 24 * 60 * 60 * 1000).toISOString());

    // 获取模板
    let template = await this.getDefaultTemplate('daily');
    if (options.templateId) {
      const customTemplate = await this.getBlogTemplate(options.templateId);
      if (customTemplate) template = customTemplate;
    }

    // 准备模板变量
    const variables = await this.prepareTemplateVariables(summary, completedTasks || [], options);

    // 生成内容
    const content = await this.renderTemplate(template.template_content, variables);
    
    // 生成标题
    const title = await this.generateTitle(summary, variables);

    // 生成摘要
    const excerpt = this.generateExcerpt(content);

    // 生成标签
    const tags = await this.generateTags(content, summary);

    // 计算阅读时间
    const readingTime = this.calculateReadingTime(content);

    // 创建博客文章
    const postData = {
      user_id: summary.user_id,
      title,
      content,
      excerpt,
      type: 'schedule',
      status: options.autoPublish ? 'published' : 'draft',
      published_at: options.autoPublish ? options.publishDate || new Date() : null,
      estimated_reading_time: readingTime,
      tags,
    };

    const { data: post, error: postError } = await this.supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postError) throw postError;

    // 更新总结记录
    await this.supabase
      .from('daily_summaries')
      .update({
        auto_blog_generated: true,
        generated_post_id: post.id,
        blog_generation_config: options,
      })
      .eq('id', summaryId);

    return post;
  }

  /**
   * 自动生成博客（定时任务）
   */
  async generateAutoBlog(userId: string, date?: Date): Promise<any> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    // 检查是否已存在总结
    const { data: existingSummary } = await this.supabase
      .from('daily_summaries')
      .select('id, auto_blog_generated')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    if (!existingSummary) {
      // 先生成总结
      await this.generateDailySummary(userId, targetDate);
      return this.generateAutoBlog(userId, targetDate);
    }

    if (existingSummary.auto_blog_generated) {
      throw new Error('Blog already generated for this date');
    }

    return this.generateBlogFromSummary(existingSummary.id, {
      autoPublish: false, // 默认不自动发布
    });
  }

  /**
   * 预览博客生成
   */
  async previewBlogGeneration(
    summaryId: string,
    templateId: string
  ): Promise<BlogPreview> {
    const { data: summary } = await this.supabase
      .from('daily_summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (!summary) throw new Error('Summary not found');

    const { data: completedTasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', summary.user_id)
      .eq('status', 'completed')
      .gte('completed_at', summary.date)
      .lt('completed_at', new Date(new Date(summary.date).getTime() + 24 * 60 * 60 * 1000).toISOString());

    const template = await this.getBlogTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const variables = await this.prepareTemplateVariables(summary, completedTasks || []);
    const content = await this.renderTemplate(template.template_content, variables);
    const title = await this.generateTitle(summary, variables);

    return {
      title,
      content,
      excerpt: this.generateExcerpt(content),
      tags: await this.generateTags(content, summary),
      estimatedReadingTime: this.calculateReadingTime(content),
    };
  }

  /**
   * 创建博客模板
   */
  async createBlogTemplate(
    userId: string,
    data: {
      name: string;
      description?: string;
      type: 'daily' | 'weekly' | 'monthly' | 'custom';
      template_content: string;
      variables?: Record<string, any>;
      is_default?: boolean;
    }
  ): Promise<BlogTemplate> {
    const { data: template, error } = await this.supabase
      .from('blog_templates')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        type: data.type,
        template_content: data.template_content,
        variables: data.variables,
        is_default: data.is_default || false,
      })
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  /**
   * 获取博客模板
   */
  async getBlogTemplates(userId?: string, type?: string): Promise<BlogTemplate[]> {
    let query = this.supabase
      .from('blog_templates')
      .select('*');

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_default.eq.true`);
    } else {
      query = query.eq('is_default', true);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  /**
   * 获取默认模板
   */
  async getDefaultTemplate(type: string): Promise<BlogTemplate> {
    const { data: template, error } = await this.supabase
      .from('blog_templates')
      .select('*')
      .eq('type', type)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return template;
  }

  /**
   * 准备模板变量
   */
  private async prepareTemplateVariables(
    summary: any,
    completedTasks: any[],
    options: BlogGenerationOptions = {}
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {
      // 基础信息
      date: new Date(summary.date).toLocaleDateString('zh-CN'),
      weekday: new Date(summary.date).toLocaleDateString('zh-CN', { weekday: 'long' }),
      year: new Date(summary.date).getFullYear(),
      month: new Date(summary.date).getMonth() + 1,
      day: new Date(summary.date).getDate(),

      // 统计数据
      totalTasks: summary.total_tasks || 0,
      completedTasks: summary.completed_tasks || 0,
      completionRate: summary.completion_rate || 0,
      productivityScore: summary.productivity_score || 0,
      moodRating: summary.mood_rating || 0,
      energyRating: summary.energy_rating || 0,

      // 时间统计
      totalPlannedTime: summary.total_planned_time || 0,
      totalActualTime: summary.total_actual_time || 0,
      timeEfficiency: summary.total_planned_time > 0 
        ? Math.round((summary.total_actual_time / summary.total_planned_time) * 100)
        : 0,

      // 内容
      notes: summary.notes || '',
      achievements: summary.key_achievements || [],
      challenges: summary.challenges_overcome || [],
      lessons: summary.lessons_learned || '',
      tomorrowPlan: summary.tomorrow_plan || {},
      aiInsights: summary.ai_insights || '',
    };

    // 任务详情
    if (options.includeTasks !== false) {
      variables.tasks = completedTasks.map((task, index) => ({
        index: index + 1,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimated_minutes,
        actualMinutes: task.actual_minutes,
        completionNotes: task.completion_notes,
        timeEfficiency: task.estimated_minutes > 0
          ? Math.round((task.actual_minutes / task.estimated_minutes) * 100)
          : 0,
      }));

      // 按分类分组
      variables.tasksByCategory = this.groupTasksByCategory(completedTasks);
      
      // 按优先级分组
      variables.tasksByPriority = this.groupTasksByPriority(completedTasks);
    }

    // 统计信息
    if (options.includeStats !== false) {
      variables.stats = {
        categoryDistribution: this.getCategoryDistribution(completedTasks),
        priorityDistribution: this.getPriorityDistribution(completedTasks),
        timeAnalysis: this.getTimeAnalysis(completedTasks),
        topCategories: this.getTopCategories(completedTasks, 3),
      };
    }

    // AI洞察
    if (options.includeInsights !== false && this.openai) {
      variables.aiInsights = await this.generateAIInsights(summary, completedTasks);
    }

    return variables;
  }

  /**
   * 渲染模板
   */
  private async renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
    let content = template;

    // 处理简单变量
    content = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(variables, key);
      return value !== undefined ? String(value) : match;
    });

    // 处理条件块
    content = content.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, body) => {
      const value = this.getNestedValue(variables, condition);
      return value ? body : '';
    });

    // 处理循环
    content = content.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, template) => {
      const array = this.getNestedValue(variables, arrayKey);
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        return template
          .replace(/\{\{this\}\}/g, JSON.stringify(item))
          .replace(/\{\{@index\}\}/g, String(index))
          .replace(/\{\{(\w+)\}\}/g, (m, key) => {
            return item[key] !== undefined ? String(item[key]) : m;
          });
      }).join('\n');
    });

    return content;
  }

  /**
   * 生成标题
   */
  private async generateTitle(summary: any, variables: Record<string, any>): Promise<string> {
    const date = new Date(summary.date).toLocaleDateString('zh-CN');
    const completionRate = variables.completionRate;
    
    if (completionRate >= 90) {
      return `${date} - 高效完成的一天！完成率${completionRate}%`;
    } else if (completionRate >= 70) {
      return `${date} - 日常总结：稳步前进`;
    } else if (completionRate >= 50) {
      return `${date} - 日程总结与反思`;
    } else {
      return `${date} - 挑战与成长`;
    }
  }

  /**
   * 生成摘要
   */
  private generateExcerpt(content: string): string {
    // 移除Markdown标记
    const plainText = content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 取前200个字符
    return plainText.substring(0, 200).trim() + '...';
  }

  /**
   * 生成标签
   */
  private async generateTags(content: string, summary: any): Promise<string[]> {
    const baseTags = ['日程管理', '每日总结'];
    
    // 根据完成率添加标签
    if (summary.completion_rate >= 90) {
      baseTags.push('高效');
    }
    
    // 根据心情添加标签
    if (summary.mood_rating >= 4) {
      baseTags.push('心情愉快');
    }
    
    // 根据生产力评分添加标签
    if (summary.productivity_score >= 8) {
      baseTags.push('高产出');
    }

    return [...new Set(baseTags)].slice(0, 5);
  }

  /**
   * 计算阅读时间
   */
  private calculateReadingTime(content: string): number {
    // 中文平均阅读速度：300字/分钟
    const wordCount = content.replace(/\s/g, '').length;
    return Math.ceil(wordCount / 300);
  }

  /**
   * 生成AI洞察
   */
  private async generateAIInsights(summary: any, tasks: any[]): Promise<string> {
    if (!this.openai) return '';

    const prompt = `
基于以下日程数据，生成一些有价值的洞察和建议：

完成率: ${summary.completion_rate}%
生产力评分: ${summary.productivity_score}/10
心情评分: ${summary.mood_rating}/10
精力评分: ${summary.energy_rating}/10

完成的任务:
${tasks.map(t => `- ${t.title} (${t.category}, ${t.actual_minutes}分钟)`).join('\n')}

请提供3-5点洞察，包括：
1. 工作模式分析
2. 效率改进建议
3. 时间分配优化
4. 积极的肯定和鼓励

用中文回答，简洁明了。
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return '';
    }
  }

  /**
   * 生成每日总结
   */
  private async generateDailySummary(userId: string, date: Date): Promise<any> {
    const dateStr = date.toISOString().split('T')[0];
    
    // 获取当天的任务
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .or(`and(due_date.eq.${dateStr},completed_at.gte.${dateStr}T00:00:00Z,completed_at.lt.${dateStr}T23:59:59Z)`);

    if (!tasks) {
      throw new Error('No tasks found for this date');
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalTasks = tasks.length;
    const completedCount = completedTasks.length;
    
    // 计算统计数据
    const totalPlannedTime = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const totalActualTime = completedTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
    
    // 生成总结
    const summaryData = {
      user_id: userId,
      date: dateStr,
      total_tasks: totalTasks,
      completed_tasks: completedCount,
      completion_rate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
      total_planned_time: totalPlannedTime,
      total_actual_time: totalActualTime,
      productivity_score: this.calculateProductivityScore(completedTasks, totalTasks),
      mood_rating: 0, // 需要用户输入
      energy_rating: 0, // 需要用户输入
      notes: this.generateSummaryNotes(completedTasks),
    };

    const { data: summary, error } = await this.supabase
      .from('daily_summaries')
      .insert(summaryData)
      .select()
      .single();

    if (error) throw error;
    return summary;
  }

  /**
   * 计算生产力评分
   */
  private calculateProductivityScore(completedTasks: any[], totalTasks: number): number {
    if (totalTasks === 0) return 5;

    const completionRate = completedTasks.length / totalTasks;
    const timeEfficiency = completedTasks.reduce((score, task) => {
      const efficiency = task.estimated_minutes > 0 
        ? task.actual_minutes / task.estimated_minutes 
        : 1;
      return score + (efficiency <= 1 ? 1 : 1 / efficiency);
    }, 0) / completedTasks.length;

    return Math.round((completionRate * 0.6 + timeEfficiency * 0.4) * 10);
  }

  /**
   * 生成总结备注
   */
  private generateSummaryNotes(completedTasks: any[]): string {
    if (completedTasks.length === 0) return '今天没有完成任务。';

    const categories = [...new Set(completedTasks.map(t => t.category))];
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
    
    return `今天完成了 ${completedTasks.length} 个任务，总计用时 ${totalTime} 分钟。主要涉及：${categories.join('、')}。`;
  }

  /**
   * 按分类分组任务
   */
  private groupTasksByCategory(tasks: any[]): Record<string, any[]> {
    return tasks.reduce((groups, task) => {
      const category = task.category || '其他';
      if (!groups[category]) groups[category] = [];
      groups[category].push(task);
      return groups;
    }, {});
  }

  /**
   * 按优先级分组任务
   */
  private groupTasksByPriority(tasks: any[]): Record<string, any[]> {
    return tasks.reduce((groups, task) => {
      const priority = task.priority || 'medium';
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(task);
      return groups;
    }, {});
  }

  /**
   * 获取分类分布
   */
  private getCategoryDistribution(tasks: any[]): Record<string, number> {
    const distribution = this.groupTasksByCategory(tasks);
    return Object.keys(distribution).reduce((acc, category) => {
      acc[category] = distribution[category].length;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 获取优先级分布
   */
  private getPriorityDistribution(tasks: any[]): Record<string, number> {
    const distribution = this.groupTasksByPriority(tasks);
    return Object.keys(distribution).reduce((acc, priority) => {
      acc[priority] = distribution[priority].length;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 获取时间分析
   */
  private getTimeAnalysis(tasks: any[]): Record<string, any> {
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
    
    return {
      totalEstimated,
      totalActual,
      difference: totalActual - totalEstimated,
      efficiency: totalEstimated > 0 ? Math.round((totalEstimated / totalActual) * 100) : 100,
    };
  }

  /**
   * 获取热门分类
   */
  private getTopCategories(tasks: any[], limit: number): Array<{ category: string; count: number }> {
    const distribution = this.getCategoryDistribution(tasks);
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
  }

  /**
   * 获取嵌套属性值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 定时发布已批准的博客
   */
  async autoPublishApprovedPosts(): Promise<void> {
    const now = new Date();
    
    const { data: posts } = await this.supabase
      .from('posts')
      .select('*')
      .eq('status', 'draft')
      .lte('published_at', now.toISOString())
      .not('published_at', 'is', null);

    if (!posts) return;

    for (const post of posts) {
      await this.supabase
        .from('posts')
        .update({ status: 'published' })
        .eq('id', post.id);
    }
  }
}