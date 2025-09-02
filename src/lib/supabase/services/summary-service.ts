import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import { taskService } from './task-service'
import { postService } from './post-service'
import { DailySummary, DailySummaryInsert, DailySummaryUpdate } from '@/types/database'

// Daily summary operations
export const summaryService = {
  async getSummary(userId: string, date: string): Promise<DailySummary | null> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch daily summary', error)
    }

    return data
  },

  async getSummaries(userId: string, options?: {
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<DailySummary[]> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    let query = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('summary_date', { ascending: false })

    if (options?.startDate) {
      query = query.gte('summary_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('summary_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch daily summaries', error)
    }

    return data || []
  },

  async createSummary(summaryData: DailySummaryInsert): Promise<DailySummary> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .insert(summaryData)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create daily summary', error)
    }

    return data
  },

  async generateDailySummary(userId: string, date: string): Promise<DailySummary> {
    // Get tasks for the specified date
    const tasks = await taskService.getTasks(userId, {
      date: date
    })

    // Calculate summary metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    const totalPlannedTime = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
    const totalActualTime = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.actual_minutes || 0), 0)
    
    // Calculate productivity score based on multiple factors
    let productivityScore = 0
    if (totalTasks > 0) {
      const completionFactor = completionRate / 100 // 0-1
      const timeFactor = totalPlannedTime > 0 && totalActualTime > 0 
        ? Math.min(totalPlannedTime / totalActualTime, 2) / 2 // 0-1, capped at 2x efficiency
        : 0.5 // neutral if no time data
      const taskVolumeFactor = Math.min(totalTasks / 5, 1) // 0-1, normalized to 5 tasks
      
      productivityScore = ((completionFactor * 0.5) + (timeFactor * 0.3) + (taskVolumeFactor * 0.2)) * 100
    }

    const summaryData: DailySummaryInsert = {
      user_id: userId,
      summary_date: date,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: Math.round(completionRate * 100) / 100,
      total_planned_time: totalPlannedTime,
      total_actual_time: totalActualTime,
      productivity_score: Math.round(productivityScore * 100) / 100,
      auto_blog_generated: false
    }

    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    // Check if summary already exists
    const existingSummary = await this.getSummary(userId, date)
    let result

    if (existingSummary) {
      // Update existing summary
      const { data, error } = await supabase
        .from('daily_summaries')
        .update(summaryData as DailySummaryUpdate)
        .eq('id', existingSummary.id)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to update daily summary', error)
      }
      result = data
    } else {
      // Create new summary
      const { data, error } = await supabase
        .from('daily_summaries')
        .insert(summaryData)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to create daily summary', error)
      }
      result = data
    }

    return result
  },

  async updateSummary(id: string, updates: DailySummaryUpdate): Promise<DailySummary> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update daily summary', error)
    }

    return data
  },

  async deleteSummary(id: string): Promise<void> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { error } = await supabase
      .from('daily_summaries')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete daily summary', error)
    }
  },

  async generateBlogFromSummary(userId: string, summaryId: string): Promise<{ post: any; summary: DailySummary }> {
    // Get the summary
    const summary = await this.getSummaryById(summaryId)
    if (!summary) {
      throw new DatabaseError('Summary not found')
    }

    if (summary.user_id !== userId) {
      throw new DatabaseError('Unauthorized access to summary')
    }

    // Generate blog content from summary data
    const blogContent = this.generateBlogContent(summary)

    // Create blog post
    const postData = {
      user_id: userId,
      title: `我的一天：${summary.summary_date}`,
      content: blogContent,
      excerpt: `关于 ${summary.summary_date} 的日常总结`,
      status: 'published',
      type: 'schedule_generated',
      published_at: new Date().toISOString()
    }
    
    console.log('准备创建博客文章，数据:', postData)
    const post = await postService.createPost(postData)

    // Update summary to mark blog as generated
    await this.updateSummary(summaryId, {
      auto_blog_generated: true,
      generated_post_id: post.id
    } as DailySummaryUpdate)

    return { post, summary }
  },

  async getSummaryById(id: string): Promise<DailySummary | null> {
    if (!supabase) throw new DatabaseError('Supabase client is not initialized')
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch daily summary', error)
    }

    return data
  },

  generateBlogContent(summary: DailySummary): string {
    let content = `# 我的一天：${summary.summary_date}\n\n`

    content += `今天是充实的一天，让我来总结一下今天的成果。\n\n`

    content += `## 任务完成情况\n\n`
    content += `- 总任务数：${summary.total_tasks}\n`
    content += `- 已完成任务：${summary.completed_tasks}\n`
    content += `- 完成率：${summary.completion_rate}%\n\n`

    if (summary.total_planned_time && summary.total_actual_time) {
      content += `## 时间管理\n\n`
      content += `- 计划时间：${summary.total_planned_time} 分钟\n`
      content += `- 实际用时：${summary.total_actual_time} 分钟\n\n`
    }

    if (summary.productivity_score) {
      content += `## 效率评分\n\n`
      content += `今日效率评分：${summary.productivity_score}/100\n\n`
    }

    if (summary.notes) {
      content += `## 今日备注\n\n${summary.notes}\n\n`
    }

    if (summary.achievements && summary.achievements.length > 0) {
      content += `## 今日成就\n\n`
      summary.achievements.forEach((achievement: unknown) => {
        content += `- ${achievement}\n`
      })
      content += `\n`
    }

    if (summary.challenges && summary.challenges.length > 0) {
      content += `## 遇到的挑战\n\n`
      summary.challenges.forEach((challenge: unknown) => {
        content += `- ${challenge}\n`
      })
      content += `\n`
    }

    if (summary.tomorrow_goals && summary.tomorrow_goals.length > 0) {
      content += `## 明日目标\n\n`
      summary.tomorrow_goals.forEach((goal: unknown) => {
        content += `- ${goal}\n`
      })
      content += `\n`
    }

    content += `---\n\n`
    content += `*这是系统根据我的日程自动创建的博客文章。*\n`

    return content
  }
}