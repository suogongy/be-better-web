import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'
import { taskService } from './task-service'
import { postService } from './post-service'
import { DailySummary } from '@/types/database'

// Daily summary operations
export const summaryService = {
  async getSummary(userId: string, date: string): Promise<DailySummary | null> {
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

    const summaryData = {
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

    // Check if summary already exists
    const existingSummary = await this.getSummary(userId, date)
    if (existingSummary) {
      return this.updateSummary(userId, date, summaryData)
    } else {
      return this.createSummary(summaryData)
    }
  },

  async createSummary(summary: {
    user_id: string
    summary_date: string
    total_tasks?: number
    completed_tasks?: number
    completion_rate?: number
    total_planned_time?: number
    total_actual_time?: number
    productivity_score?: number
    mood_rating?: number
    energy_rating?: number
    notes?: string
    achievements?: unknown[]
    challenges?: unknown[]
    tomorrow_goals?: unknown[]
    auto_blog_generated?: boolean
  }): Promise<DailySummary> {
    const { data, error } = await supabase
      .from('daily_summaries')
      .insert(summary)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create daily summary', error)
    }

    return data
  },

  async updateSummary(userId: string, date: string, updates: {
    total_tasks?: number
    completed_tasks?: number
    completion_rate?: number
    total_planned_time?: number
    total_actual_time?: number
    productivity_score?: number
    mood_rating?: number
    energy_rating?: number
    notes?: string
    achievements?: unknown[]
    challenges?: unknown[]
    tomorrow_goals?: unknown[]
    auto_blog_generated?: boolean
    generated_post_id?: string
  }): Promise<DailySummary> {
    const { data, error } = await supabase
      .from('daily_summaries')
      .update(updates)
      .eq('user_id', userId)
      .eq('summary_date', date)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update daily summary', error)
    }

    return data
  },

  async deleteSummary(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('daily_summaries')
      .delete()
      .eq('user_id', userId)
      .eq('summary_date', date)

    if (error) {
      throw new DatabaseError('Failed to delete daily summary', error)
    }
  },

  async getProductivityTrends(userId: string, days: number = 30): Promise<{
    daily: Array<{
      date: string
      completion_rate: number
      productivity_score: number
      total_tasks: number
      completed_tasks: number
    }>
    averages: {
      avg_completion_rate: number
      avg_productivity_score: number
      avg_tasks_per_day: number
      trend_direction: 'up' | 'down' | 'stable'
    }
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const summaries = await this.getSummaries(userId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: days
    })

    const daily = summaries.map(s => ({
      date: s.summary_date,
      completion_rate: s.completion_rate || 0,
      productivity_score: s.productivity_score || 0,
      total_tasks: s.total_tasks || 0,
      completed_tasks: s.completed_tasks || 0
    }))

    // Calculate averages
    const avg_completion_rate = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.completion_rate, 0) / daily.length 
      : 0
    
    const avg_productivity_score = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.productivity_score, 0) / daily.length 
      : 0
    
    const avg_tasks_per_day = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.total_tasks, 0) / daily.length 
      : 0

    // Calculate trend direction (simple linear trend)
    let trend_direction: 'up' | 'down' | 'stable' = 'stable'
    if (daily.length >= 7) {
      const recentWeek = daily.slice(0, 7)
      const olderWeek = daily.slice(-7)
      
      const recentAvg = recentWeek.reduce((sum, d) => sum + d.productivity_score, 0) / recentWeek.length
      const olderAvg = olderWeek.reduce((sum, d) => sum + d.productivity_score, 0) / olderWeek.length
      
      if (recentAvg > olderAvg + 5) trend_direction = 'up'
      else if (recentAvg < olderAvg - 5) trend_direction = 'down'
    }

    return {
      daily: daily.reverse(), // Most recent first
      averages: {
        avg_completion_rate: Math.round(avg_completion_rate * 100) / 100,
        avg_productivity_score: Math.round(avg_productivity_score * 100) / 100,
        avg_tasks_per_day: Math.round(avg_tasks_per_day * 100) / 100,
        trend_direction
      }
    }
  },

  async getWeeklyInsights(userId: string, weekOffset: number = 0): Promise<{
    week_start: string
    week_end: string
    total_tasks: number
    completed_tasks: number
    completion_rate: number
    productivity_score: number
    best_day: string | null
    worst_day: string | null
    daily_breakdown: Array<{
      date: string
      day_name: string
      tasks: number
      completed: number
      score: number
    }>
  }> {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() - (weekOffset * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const summaries = await this.getSummaries(userId, {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0]
    })

    const dailyBreakdown = []
    let totalTasks = 0
    let completedTasks = 0
    let totalScore = 0
    let bestDay: string | null = null
    let worstDay: string | null = null
    let bestScore = -1
    let worstScore = 101

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(weekStart.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const summary = summaries.find(s => s.summary_date === dateStr)
      const dayTasks = summary?.total_tasks || 0
      const dayCompleted = summary?.completed_tasks || 0
      const dayScore = summary?.productivity_score || 0

      totalTasks += dayTasks
      completedTasks += dayCompleted
      totalScore += dayScore

      if (dayScore > bestScore) {
        bestScore = dayScore
        bestDay = dateStr
      }
      if (dayScore < worstScore && dayTasks > 0) {
        worstScore = dayScore
        worstDay = dateStr
      }

      dailyBreakdown.push({
        date: dateStr,
        day_name: dayNames[currentDate.getDay()],
        tasks: dayTasks,
        completed: dayCompleted,
        score: dayScore
      })
    }

    return {
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      productivity_score: totalScore / 7,
      best_day: bestDay,
      worst_day: worstDay,
      daily_breakdown: dailyBreakdown
    }
  },

  async generateBlogPost(userId: string, summaryId: string, template: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const summary = await this.getSummary(userId, summaryId)
    if (!summary) {
      throw new DatabaseError('Summary not found')
    }

    const tasks = await taskService.getTasks(userId, {
      date: summary.summary_date
    })

    // Generate blog content based on template
    switch (template) {
      case 'daily':
        return this.generateDailyBlogPost(summary, tasks)
      case 'weekly':
        return this.generateWeeklyBlogPost(userId, summary.summary_date)
      case 'monthly':
        return this.generateMonthlyBlogPost(userId, summary.summary_date)
      default:
        return this.generateDailyBlogPost(summary, tasks)
    }
  },

  async generateDailyBlogPost(summary: DailySummary, tasks: unknown[]): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const date = new Date(summary.summary_date)
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const completionRate = Math.round(summary.completion_rate || 0)
    const productivityScore = Math.round(summary.productivity_score || 0)
    
    // Generate title
    let title: string
    if (productivityScore >= 80) {
      title = `Crushing It: A Highly Productive ${dateStr}`
    } else if (productivityScore >= 60) {
      title = `Steady Progress: My ${dateStr} Journey`
    } else if (productivityScore >= 40) {
      title = `Mixed Results: Lessons from ${dateStr}`
    } else {
      title = `Learning & Growing: Reflections on ${dateStr}`
    }

    // Generate content
    let content = `# ${title}\n\n`
    
    content += `Today was ${dateStr}, and I wanted to share my daily productivity journey with you.\n\n`
    
    // Overview section
    content += `## 📊 Daily Overview\n\n`
    content += `- **Tasks Completed**: ${summary.completed_tasks}/${summary.total_tasks} (${completionRate}%)\n`
    content += `- **Productivity Score**: ${productivityScore}%\n`
    
    if (summary.total_planned_time && summary.total_actual_time) {
      const efficiency = Math.round((summary.total_planned_time / summary.total_actual_time) * 100)
      content += `- **Time Efficiency**: ${efficiency}% (${summary.total_actual_time}m spent vs ${summary.total_planned_time}m planned)\n`
    }
    
    if (summary.mood_rating) {
      const moodText = summary.mood_rating >= 4 ? 'Great' : summary.mood_rating >= 3 ? 'Good' : 'Challenging'
      content += `- **Mood**: ${moodText} (${summary.mood_rating}/5)\n`
    }
    
    if (summary.energy_rating) {
      const energyText = summary.energy_rating >= 4 ? 'High' : summary.energy_rating >= 3 ? 'Medium' : 'Low'
      content += `- **Energy Level**: ${energyText} (${summary.energy_rating}/5)\n`
    }
    
    content += `\n`

    // Achievements section
    if (summary.achievements && summary.achievements.length > 0) {
      content += `## 🎉 Today's Achievements\n\n`
      summary.achievements.forEach((achievement: string) => {
        content += `- ${achievement}\n`
      })
      content += `\n`
    }

    // Challenges section
    if (summary.challenges && summary.challenges.length > 0) {
      content += `## 🧗 Challenges Faced\n\n`
      summary.challenges.forEach((challenge: string) => {
        content += `- ${challenge}\n`
      })
      content += `\n`
    }

    // Task breakdown
    if (tasks.length > 0) {
      content += `## ✅ Task Breakdown\n\n`
      const completedTasks = tasks.filter(t => t.status === 'completed')
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
      const pendingTasks = tasks.filter(t => t.status === 'pending')
      
      if (completedTasks.length > 0) {
        content += `**Completed:**\n`
        completedTasks.forEach((task: any) => {
          content += `- ✅ ${task.title}${task.category ? ` (${task.category})` : ''}\n`
        })
        content += `\n`
      }
      
      if (inProgressTasks.length > 0) {
        content += `**In Progress:**\n`
        inProgressTasks.forEach((task: any) => {
          content += `- 🔄 ${task.title} (${task.progress || 0}% complete)\n`
        })
        content += `\n`
      }
      
      if (pendingTasks.length > 0) {
        content += `**Pending:**\n`
        pendingTasks.forEach((task: any) => {
          content += `- ⏳ ${task.title}\n`
        })
        content += `\n`
      }
    }

    // Tomorrow's goals
    if (summary.tomorrow_goals && summary.tomorrow_goals.length > 0) {
      content += `## 🎯 Tomorrow's Goals\n\n`
      summary.tomorrow_goals.forEach((goal: string) => {
        content += `- ${goal}\n`
      })
      content += `\n`
    }

    // Personal notes
    if (summary.notes) {
      content += `## 💭 Personal Reflections\n\n`
      content += `${summary.notes}\n\n`
    }

    // Closing
    content += `## 🚀 Wrapping Up\n\n`
    if (productivityScore >= 70) {
      content += `Overall, today was a productive day! I'm feeling good about the progress made and looking forward to tomorrow's challenges.\n\n`
    } else if (productivityScore >= 50) {
      content += `Today had its ups and downs, but I learned valuable lessons that will help me improve tomorrow.\n\n`
    } else {
      content += `Today was challenging, but every difficult day teaches us something valuable. Tomorrow is a new opportunity to grow and improve.\n\n`
    }
    
    content += `How was your day? I'd love to hear about your own productivity journey in the comments below!\n\n`
    content += `---\n\n*This post was automatically generated from my daily productivity tracking. I believe in transparency and sharing both successes and struggles on the path to continuous improvement.*`

    // Generate excerpt
    const excerpt = `A reflection on my ${dateStr} productivity journey - completed ${summary.completed_tasks}/${summary.total_tasks} tasks with a ${productivityScore}% productivity score.`

    // Generate tags
    const tags = ['daily-summary', 'productivity', 'self-improvement']
    if (productivityScore >= 80) tags.push('high-performance')
    if (summary.achievements && summary.achievements.length > 0) tags.push('achievements')
    if (summary.challenges && summary.challenges.length > 0) tags.push('lessons-learned')
    if (summary.mood_rating && summary.mood_rating >= 4) tags.push('positive-mindset')
    
    // Add category-based tags
    const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))]
    categories.forEach(category => {
      if (category && category.length > 0) {
        tags.push(category.toLowerCase().replace(/\s+/g, '-'))
      }
    })

    return {
      title,
      content,
      excerpt,
      tags: tags.slice(0, 10) // Limit to 10 tags
    }
  },

  async generateWeeklyBlogPost(userId: string, date: string): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const weeklyData = await this.getWeeklyInsights(userId, 0)
    
    const title = `Weekly Wrap-Up: Productivity Insights for ${weeklyData.week_start} to ${weeklyData.week_end}`
    
    let content = `# ${title}\n\n`
    content += `This week was filled with challenges, achievements, and valuable lessons. Here's my comprehensive weekly productivity review.\n\n`
    
    // Weekly stats
    content += `## 📈 Weekly Statistics\n\n`
    content += `- **Total Tasks**: ${weeklyData.total_tasks}\n`
    content += `- **Completed**: ${weeklyData.completed_tasks} (${Math.round(weeklyData.completion_rate)}%)\n`
    content += `- **Average Productivity Score**: ${Math.round(weeklyData.productivity_score)}%\n`
    
    if (weeklyData.best_day) {
      const bestDayData = weeklyData.daily_breakdown.find(d => d.date === weeklyData.best_day)
      content += `- **Best Day**: ${bestDayData?.day_name} (${Math.round(bestDayData?.score || 0)}% productivity)\n`
    }
    
    content += `\n## 📊 Daily Breakdown\n\n`
    weeklyData.daily_breakdown.forEach(day => {
      const emoji = day.score >= 80 ? '🔥' : day.score >= 60 ? '✅' : day.score >= 40 ? '⚡' : '📝'
      content += `- **${day.day_name}**: ${emoji} ${day.completed}/${day.tasks} tasks (${Math.round(day.score)}% score)\n`
    })
    
    content += `\n*This weekly summary was generated from my daily productivity tracking data.*`
    
    const excerpt = `My weekly productivity review: ${weeklyData.completed_tasks}/${weeklyData.total_tasks} tasks completed with ${Math.round(weeklyData.completion_rate)}% completion rate.`
    
    return {
      title,
      content,
      excerpt,
      tags: ['weekly-summary', 'productivity', 'self-improvement', 'progress-tracking']
    }
  },

  async generateMonthlyBlogPost(userId: string, date: string): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
  }> {
    const currentDate = new Date(date)
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const summaries = await this.getSummaries(userId, {
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0]
    })
    
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const title = `Monthly Review: ${monthName} Productivity Journey`
    
    const totalTasks = summaries.reduce((sum, s) => sum + (s.total_tasks || 0), 0)
    const completedTasks = summaries.reduce((sum, s) => sum + (s.completed_tasks || 0), 0)
    const avgScore = summaries.length > 0 
      ? summaries.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / summaries.length 
      : 0
    
    let content = `# ${title}\n\n`
    content += `As ${monthName} comes to a close, I want to reflect on the month's productivity journey and share key insights.\n\n`
    
    content += `## 🎯 Monthly Highlights\n\n`
    content += `- **Days Tracked**: ${summaries.length}\n`
    content += `- **Total Tasks**: ${totalTasks}\n`
    content += `- **Completed Tasks**: ${completedTasks} (${Math.round((completedTasks/totalTasks) * 100)}%)\n`
    content += `- **Average Productivity Score**: ${Math.round(avgScore)}%\n\n`
    
    content += `*This monthly review was compiled from ${summaries.length} days of productivity tracking data.*`
    
    const excerpt = `My ${monthName} productivity review: ${completedTasks}/${totalTasks} tasks completed across ${summaries.length} tracked days.`
    
    return {
      title,
      content,
      excerpt,
      tags: ['monthly-summary', 'productivity', 'self-improvement', 'monthly-review']
    }
  },

  async createBlogPostFromSummary(userId: string, summaryId: string, template: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    try {
      // Generate blog content
      const blogData = await this.generateBlogPost(userId, summaryId, template)
      
      // Get or create appropriate tags for the blog post
      const tagIds = await this.getOrCreateTagsForBlogPost(blogData.tags)
      
      // Get the 'Schedule' category for auto-generated posts
      const scheduleCategory = await this.getOrCreateScheduleCategory()
      
      // Create the blog post
      const post = await postService.createPost({
        user_id: userId,
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt,
        slug: this.generateSlug(blogData.title),
        status: 'draft', // Start as draft for review
        type: 'schedule_generated',
        meta_title: blogData.title,
        meta_description: blogData.excerpt,
        category_ids: scheduleCategory ? [scheduleCategory.id] : [],
        tag_ids: tagIds
      } as any)
      
      // Update summary to mark blog as generated
      await this.updateSummary(userId, summaryId, {
        auto_blog_generated: true,
        generated_post_id: post.id
      } as any)
      
      return post
    } catch (error) {
      throw new DatabaseError('Failed to create blog post from summary', undefined, error)
    }
  },

  async generateBlogFromSummary(userId: string, date: string, blogData: any): Promise<any> {
    try {
      // First get the summary for the date
      const summary = await this.getSummary(userId, date);
      if (!summary) {
        throw new DatabaseError('Summary not found for date: ' + date);
      }

      // Generate blog content
      const generatedBlogData = await this.generateBlogPost(userId, summary.id, 'daily');
      
      // Get or create appropriate tags for the blog post
      const tagIds = await this.getOrCreateTagsForBlogPost(generatedBlogData.tags);
      
      // Get the 'Schedule' category for auto-generated posts
      const scheduleCategory = await this.getOrCreateScheduleCategory();
      
      // Create the blog post
      const post = await postService.createPost({
        user_id: userId,
        title: generatedBlogData.title,
        content: generatedBlogData.content,
        excerpt: generatedBlogData.excerpt,
        slug: this.generateSlug(generatedBlogData.title),
        status: 'draft', // Start as draft for review
        type: 'schedule_generated',
        meta_title: generatedBlogData.title,
        meta_description: generatedBlogData.excerpt,
        category_ids: scheduleCategory ? [scheduleCategory.id] : [],
        tag_ids: tagIds
      } as any);
      
      // Update summary to mark blog as generated
      await this.updateSummary(userId, date, {
        auto_blog_generated: true,
        generated_post_id: post.id
      } as any);
      
      return post;
    } catch (error) {
      throw new DatabaseError('Failed to create blog post from summary', undefined, error);
    }
  },

  async regenerateTasks(userId: string, date: string): Promise<DailySummary | null> {
    return await this.generateDailySummary(userId, date);
  },

  async getOrCreateTagsForBlogPost(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = []
    
    for (const tagName of tagNames) {
      try {
        // First, try to find existing tag
        const { data: existingTags } = await supabase
          .from('tags')
          .select('id')
          .eq('slug', this.generateSlug(tagName))
          .limit(1)
        
        if (existingTags && existingTags.length > 0) {
          tagIds.push(existingTags[0].id)
        } else {
          // Create new tag if it doesn't exist
          const { data: newTag } = await supabase
            .from('tags')
            .insert({
              name: tagName,
              slug: this.generateSlug(tagName)
            })
            .select('id')
            .single()
          
          if (newTag) {
            tagIds.push(newTag.id)
          }
        }
      } catch (error) {
        console.warn(`Failed to create/find tag "${tagName}":`, error)
      }
    }
    
    return tagIds
  },

  async getOrCreateScheduleCategory(): Promise<{id: string} | null> {
    try {
      // First, try to find existing 'Schedule' category
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'schedule')
        .single()
      
      if (existingCategory) {
        return existingCategory
      }
      
      // Create 'Schedule' category if it doesn't exist
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          name: 'Schedule',
          slug: 'schedule',
          description: 'Posts generated from daily schedules and summaries',
          color: '#F59E0B'
        })
        .select('id')
        .single()
      
      return newCategory
    } catch (error) {
      console.warn('Failed to create/find Schedule category:', error)
      return null
    }
  },

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100)
  },
}