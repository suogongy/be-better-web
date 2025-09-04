import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './database-error'
import type { DataExport, Post, Task, DailySummary } from '@/types/database'

type DataExportInsert = {
  user_id: string
  export_type: string
  format: string
  date_range_start?: string
  date_range_end?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}

type DataExportUpdate = {
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  file_url?: string
  file_name?: string
  file_size?: number
  completed_at?: string
  updated_at?: string
  error_message?: string
}

// Data export operations
export const exportService = {
  async createExport(userId: string, options: {
    type: string;
    format: string;
    dateRange: { start: string; end: string };
  }): Promise<DataExport> {
    // Create export record
    const exportData: DataExportInsert = {
      user_id: userId,
      export_type: options.type,
      format: options.format,
      date_range_start: options.dateRange.start,
      date_range_end: options.dateRange.end,
      status: 'pending'
    };

    // @ts-ignore
    const { data, error } = await supabase
      .from('data_exports')
      .insert(exportData)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create export', error)
    }

    // Trigger export processing asynchronously
    this.processExport(data.id).catch(console.error)

    return data
  },

  async retryExport(exportId: string): Promise<void> {
    try {
      console.log('开始重试导出:', exportId)
      
      // 首先检查导出记录是否存在且状态允许重试
      const exportRecord = await this.getExportById(exportId)
      if (!exportRecord) {
        throw new Error('导出记录不存在')
      }
      
      console.log('导出记录状态:', exportRecord.status)
      
      // 检查状态是否允许重试
      if (exportRecord.status === 'processing') {
        throw new Error('导出正在处理中，无法重试')
      }
      
      // 清除之前的错误信息
      const { error: clearError } = await supabase
        .from('data_exports')
        .update({ 
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId)
      
      if (clearError) {
        console.error('清除错误信息失败:', clearError)
        throw new DatabaseError('Failed to clear error message', clearError)
      }
      
      console.log('错误信息已清除，通过API重新处理导出')
      
      // 获取当前用户的认证token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('用户未认证，无法重试导出')
      }
      
      // 通过API路由来执行重试，避免RLS权限问题
      const response = await fetch('/api/exports/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ exportId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '重试导出失败')
      }
      
      console.log('导出重试请求已发送到API')
      
    } catch (error) {
      console.error('重试导出失败:', error)
      throw error
    }
  },

  async deleteExport(exportId: string): Promise<void> {
    try {
      // Get export details to delete file from storage
      const exportRecord = await this.getExportById(exportId)
      if (exportRecord?.file_url) {
        // Extract file path from URL and delete from storage
        const urlParts = exportRecord.file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `exports/${exportRecord.user_id}/${fileName}`
        
        await supabase.storage
          .from('exports')
          .remove([filePath])
      }

      // Delete export record
      // @ts-ignore
      const { error } = await supabase
        .from('data_exports')
        .delete()
        .eq('id', exportId)

      if (error) {
        throw new DatabaseError('Failed to delete export', error)
      }
    } catch (error) {
      console.error('Delete export failed:', error)
      throw error
    }
  },
  
  async getExportById(id: string): Promise<DataExport | null> {
    // @ts-ignore
    const { data, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch export', error)
    }

    return data
  },

  async updateExportStatus(
    id: string, 
    status: DataExportUpdate['status'], 
    downloadUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    const updates: DataExportUpdate = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (downloadUrl) {
      updates.file_url = downloadUrl
    }

    if (errorMessage !== undefined) {
      updates.error_message = errorMessage
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await (supabase
      .from('data_exports')
      .update(updates)
      .eq('id', id) as any)

    if (error) {
      throw new DatabaseError('Failed to update export status', error)
    }
  },

  async getExports(userId: string): Promise<DataExport[]> {
    // @ts-ignore
    const { data, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError('Failed to fetch exports', error)
    }

    return data || []
  },

  async processExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportStatus(exportId, 'processing')

      // Get export details
      const exportRecord = await this.getExportById(exportId)
      if (!exportRecord) {
        throw new Error('Export not found')
      }

      // Generate export data based on type
      let exportData: any = {}
      let fileName = ''
      
      switch (exportRecord.export_type) {
        case 'posts':
          exportData = await this.exportPosts(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `posts_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        case 'tasks':
          exportData = await this.exportTasks(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `tasks_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        case 'summaries':
          exportData = await this.exportSummaries(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `summaries_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        case 'habits':
          exportData = await this.exportHabits(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `habits_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        case 'moods':
          exportData = await this.exportMoods(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `moods_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        case 'all':
          exportData = await this.exportAllData(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
          fileName = `all_data_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
          break
        default:
          throw new Error(`Unsupported export type: ${exportRecord.export_type}`)
      }

      // Convert to requested format
      let formattedData: string
      let mimeType: string
      switch (exportRecord.format) {
        case 'json':
          formattedData = JSON.stringify(exportData, null, 2)
          mimeType = 'application/json'
          fileName += '.json'
          break
        case 'csv':
          formattedData = this.convertToCSV(exportData)
          mimeType = 'text/csv'
          fileName += '.csv'
          break
        default:
          throw new Error(`Unsupported format: ${exportRecord.format}`)
      }

      // Create blob and upload to Supabase Storage
      const blob = new Blob([formattedData], { type: mimeType })
      
      // 生成唯一的文件名，避免重试时的路径冲突
      const timestamp = new Date().getTime()
      const uniqueFileName = `${fileName}_${timestamp}`
      const filePath = `exports/${exportRecord.user_id}/${uniqueFileName}`
      
      console.log('开始上传文件到路径:', filePath)
      
      // 先尝试删除可能存在的同名文件
      try {
        await supabase.storage
          .from('exports')
          .remove([filePath])
      } catch (deleteError) {
        // 忽略删除错误，文件可能不存在
        console.log('删除旧文件时出错（可忽略）:', deleteError)
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exports')
        .upload(filePath, blob, {
          upsert: true, // 如果文件存在则覆盖
          cacheControl: '3600'
        })
      
      if (uploadError) {
        console.error('文件上传失败:', uploadError)
        throw new DatabaseError('Failed to upload export file', uploadError)
      }
      
      console.log('文件上传成功:', uploadData)

      // Get public URL
      // @ts-ignore
      const { data: urlData } = supabase.storage
        .from('exports')
        .getPublicUrl(filePath)
      
      // Update status to completed with file info
      const updateData: DataExportUpdate = {
        status: 'completed',
        file_name: uniqueFileName, // 使用唯一的文件名
        file_size: formattedData.length,
        // @ts-ignore
        file_url: urlData.publicUrl,
        completed_at: new Date().toISOString()
      };

      // @ts-ignore
      const { error } = await supabase
        .from('data_exports')
        .update(updateData)
        .eq('id', exportId)

      if (error) {
        throw new DatabaseError('Failed to update export completion', error)
      }

    } catch (error) {
      console.error('Export processing failed:', error)
      // Update to failed status with error message
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        await this.updateExportStatus(exportId, 'failed', undefined, errorMessage)
      } catch (updateError) {
        console.error('Failed to update export status to failed:', updateError)
      }
      throw error
    }
  },

  // Helper methods for different export types
  async exportPosts(userId: string, startDate?: string, endDate?: string): Promise<{ posts: Post[], exportDate: string }> {
    // @ts-ignore
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      
    if (startDate) {
      // @ts-ignore
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      // @ts-ignore
      query = query.lte('created_at', endDate)
    }
      
    // @ts-ignore
    query = query.order('created_at', { ascending: true })

    // @ts-ignore
    const { data: posts } = await query

    return { posts: posts || [], exportDate: new Date().toISOString() }
  },



  async exportHabits(userId: string, startDate?: string, endDate?: string): Promise<{ habits: any[], exportDate: string }> {
    // @ts-ignore
    const query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      
    // @ts-ignore
    const { data: habits } = await query

    // Also get habit logs if date range is specified
    let habitLogs: any[] = []
    if (startDate && endDate) {
      // @ts-ignore
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true })
      
      habitLogs = logs || []
    }

    return { habits: habits || [], habitLogs, exportDate: new Date().toISOString() }
  },

  async exportTasks(userId: string, startDate?: string, endDate?: string): Promise<{ tasks: any[], exportDate: string }> {
    // @ts-ignore
    const query = supabase
      .from('tasks')
      .select(`
        *,
        task_templates (
          name,
          description
        )
      `)
      .eq('user_id', userId)
      
    // @ts-ignore
    const { data: tasks } = await query

    return { tasks: tasks || [], exportDate: new Date().toISOString() }
  },

  async exportSummaries(userId: string, startDate?: string, endDate?: string): Promise<{ summaries: any[], exportDate: string }> {
    // @ts-ignore
    let query = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      
    if (startDate) {
      // @ts-ignore
      query = query.gte('summary_date', startDate)
    }
    
    if (endDate) {
      // @ts-ignore
      query = query.lte('summary_date', endDate)
    }
    
    // @ts-ignore
    query = query.order('summary_date', { ascending: true })

    // @ts-ignore
    const { data: summaries } = await query

    return { summaries: summaries || [], exportDate: new Date().toISOString() }
  },

  async exportMoods(userId: string, startDate?: string, endDate?: string): Promise<{ moods: any[], exportDate: string }> {
    // @ts-ignore
    let query = supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      
    if (startDate) {
      // @ts-ignore
      query = query.gte('log_date', startDate)
    }
    
    if (endDate) {
      // @ts-ignore
      query = query.lte('log_date', endDate)
    }
      
    // @ts-ignore
    query = query.order('log_date', { ascending: true })

    // @ts-ignore
    const { data: moods } = await query

    return { moods: moods || [], exportDate: new Date().toISOString() }
  },

  async exportAllData(userId: string, startDate?: string, endDate?: string): Promise<{ 
    posts: Post[], 
    tasks: Task[], 
    summaries: DailySummary[],
    habits: any[],
    moods: any[],
    exportDate: string 
  }> {
    const [posts, tasks, summaries, habits, moods] = await Promise.all([
      this.exportPosts(userId, startDate, endDate),
      this.exportTasks(userId, startDate, endDate),
      this.exportSummaries(userId, startDate, endDate),
      this.exportHabits(userId, startDate, endDate),
      this.exportMoods(userId, startDate, endDate)
    ])

    return {
      posts: posts.posts,
      tasks: tasks.tasks,
      summaries: summaries.summaries,
      habits: habits.habits,
      moods: moods.moods,
      exportDate: new Date().toISOString()
    }
  },

  convertToCSV(data: any): string {
    if (!data || data.length === 0) return ''
    
    // Simple CSV conversion - this is a basic implementation
    // You might want to use a more robust library like PapaParse for production
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }
}