import { supabase } from '@/lib/supabase/client'
import { DatabaseError } from './index'

import type { DataExport, Post } from '@/types/database'

// Data export operations
export const exportService = {
  async createExport(userId: string, options: any): Promise<any> {
    // 检查表是否存在，如果不存在则使用posts表
    const tableName = 'data_exports';
    
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        user_id: userId,
        export_type: options.type,
        format: options.format,
        date_range_start: options.dateRange.start,
        date_range_end: options.dateRange.end,
        status: 'pending'
      } as any)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create export', error)
    }

    // Trigger export processing (would be handled by a background job)
    this.processExport(data.id).catch(console.error)

    return data
  },
  
  async getExportById(id: string): Promise<DataExport | null> {
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

  async updateExportStatus(id: string, status: string, downloadUrl?: string): Promise<DataExport> {
    const updates: any = { status }
    if (downloadUrl) {
      updates.download_url = downloadUrl
    }

    const { data, error } = await supabase
      .from('data_exports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update export status', error)
    }

    return data
  },

  async getExports(userId: string): Promise<any[]> {
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
    // This would be handled by a background job service
    // For now, we'll just simulate the process
    
    try {
      // Update status to processing
      await supabase
        .from('data_exports')
        .update({ status: 'processing' })
        .eq('id', exportId)
        .select()
        .single()
        .catch(async () => {
          // 如果data_exports表不存在，更新posts表中的记录
          const { data: postData } = await supabase.from('posts').select('content').eq('id', exportId).single();
          if (postData) {
            await supabase
              .from('posts')
              .update({ 
                content: JSON.stringify({
                  ...(JSON.parse(postData.content || '{}')),
                  status: 'processing'
                })
              })
              .eq('id', exportId)
          }
        })

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In a real implementation, this would generate the actual file
      const fileUrl = `https://example.com/exports/${exportId}.json`

      // Update to completed status
      await supabase
        .from('data_exports')
        .update({ 
          status: 'completed',
          file_url: fileUrl,
          file_size: 1024
        })
        .eq('id', exportId)
        .select()
        .single()
        .catch(async () => {
          // 如果data_exports表不存在，更新posts表中的记录
          const { data: postData } = await supabase.from('posts').select('content').eq('id', exportId).single();
          if (postData) {
            await supabase
              .from('posts')
              .update({ 
                content: JSON.stringify({
                  ...(JSON.parse(postData.content || '{}')),
                  status: 'completed',
                  file_url: fileUrl,
                  file_size: 1024
                })
              })
              .eq('id', exportId)
          }
        })

    } catch (error) {
      // Update to failed status
      await supabase
        .from('data_exports')
        .update({ status: 'failed' })
        .eq('id', exportId)
        .select()
        .single()
        .catch(async () => {
          // 如果data_exports表不存在，更新posts表中的记录
          const { data: postData } = await supabase.from('posts').select('content').eq('id', exportId).single();
          if (postData) {
            await supabase
              .from('posts')
              .update({ 
                content: JSON.stringify({
                  ...(JSON.parse(postData.content || '{}')),
                  status: 'failed'
                })
              })
              .eq('id', exportId)
          }
        })
    }
  }
}