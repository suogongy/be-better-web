import { createClient } from '@supabase/supabase-js'
import { RecurringTaskService } from '../src/lib/supabase/services/recurring-task.service'
import { BlogGenerationService } from '../src/lib/supabase/services/blog-generation.service'
import { AutomationService } from '../src/lib/supabase/services/automation.service'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize services
const recurringTaskService = new RecurringTaskService(supabase)
const blogService = new BlogGenerationService(supabase)
const automationService = new AutomationService(supabase)

/**
 * 执行定时任务
 */
export async function scheduledTasks() {
  console.log('Starting scheduled tasks at:', new Date().toISOString())

  try {
    // 1. 生成重复任务实例
    console.log('Generating recurring task instances...')
    await recurringTaskService.generateDailyRecurringTasks()
    console.log('✓ Recurring tasks generated')

    // 2. 清理旧的已完成实例
    console.log('Cleaning up old task instances...')
    await recurringTaskService.cleanupOldInstances()
    console.log('✓ Old instances cleaned up')

    // 3. 处理自动化规则
    console.log('Processing automation rules...')
    await automationService.processScheduledAutomations()
    console.log('✓ Automation rules processed')

    // 4. 自动生成博客草稿（可选）
    if (process.env.ENABLE_AUTO_BLOG === 'true') {
      console.log('Generating blog drafts...')
      await generateAutoBlogs()
      console.log('✓ Blog drafts generated')
    }

    // 5. 发布定时博客
    console.log('Publishing scheduled blog posts...')
    await blogService.autoPublishApprovedPosts()
    console.log('✓ Scheduled posts published')

    console.log('All scheduled tasks completed successfully')
  } catch (error) {
    console.error('Error in scheduled tasks:', error)
    throw error
  }
}

/**
 * 为所有用户自动生成博客
 */
async function generateAutoBlogs() {
  // 获取所有启用了自动博客的用户
  const { data: users } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('auto_generate_blog', true)

  if (!users) return

  for (const { user_id } of users) {
    try {
      // 检查是否已经生成过今天的博客
      const today = new Date().toISOString().split('T')[0]
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user_id)
        .eq('type', 'schedule')
        .like('created_at', `${today}%`)
        .single()

      if (!existingPost) {
        // 获取或创建今日总结
        const { data: summary } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', user_id)
          .eq('date', today)
          .single()

        if (summary) {
          await blogService.generateBlogFromSummary(summary.id, {
            autoPublish: false, // 默认不自动发布
          })
        }
      }
    } catch (error) {
      console.error(`Failed to generate auto blog for user ${user_id}:`, error)
    }
  }
}

/**
 * 清理过期数据
 */
export async function cleanupTasks() {
  console.log('Starting cleanup tasks at:', new Date().toISOString())

  try {
    // 1. 清理90天前的任务实例
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)

    const { error } = await supabase
      .from('task_instances')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) throw error
    console.log('✓ Cleaned up old task instances')

    // 2. 清理执行历史
    // 这里可以添加清理自动化规则执行历史的逻辑

    console.log('Cleanup tasks completed successfully')
  } catch (error) {
    console.error('Error in cleanup tasks:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  scheduledTasks()
    .then(() => {
      console.log('Scheduled tasks completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Scheduled tasks failed:', error)
      process.exit(1)
    })
}