import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/auth-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { exportId } = await request.json()
    if (!exportId) {
      return NextResponse.json({ error: 'Export ID is required' }, { status: 400 })
    }

    // Get export details
    const { data: exportRecord, error: fetchError } = await supabase
      .from('data_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 })
    }

    // Check if export can be retried
    if (exportRecord.status === 'processing') {
      return NextResponse.json({ error: 'Export is currently processing' }, { status: 400 })
    }

    // Update status to processing
    await supabase
      .from('data_exports')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    // Process export asynchronously
    processExport(exportId, exportRecord).catch(console.error)

    return NextResponse.json({ 
      message: 'Export retry started',
      exportId 
    })

  } catch (error) {
    console.error('Error starting export retry:', error)
    return NextResponse.json({ error: 'Failed to start export retry' }, { status: 500 })
  }
}

async function processExport(exportId: string, exportRecord: any) {
  try {
    // Generate export data based on type
    let exportData: any = {}
    let fileName = ''
    
    switch (exportRecord.export_type) {
      case 'posts':
        exportData = await exportPosts(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
        fileName = `posts_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
        break
      case 'tasks':
        exportData = await exportTasks(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
        fileName = `tasks_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
        break
      case 'summaries':
        exportData = await exportSummaries(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
        fileName = `summaries_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
        break
      case 'habits':
        exportData = await exportHabits(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
        fileName = `habits_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
        break
      case 'moods':
        exportData = await exportMoods(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
        fileName = `moods_${exportRecord.date_range_start}_to_${exportRecord.date_range_end}`
        break
      case 'all':
        exportData = await exportAllData(exportRecord.user_id, exportRecord.date_range_start, exportRecord.date_range_end)
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
        formattedData = convertToCSV(exportData)
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
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, blob, {
        upsert: true,
        cacheControl: '3600'
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload export file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exports')
      .getPublicUrl(filePath)
    
    // Update status to completed with file info
    await supabase
      .from('data_exports')
      .update({
        status: 'completed',
        file_name: uniqueFileName,
        file_size: formattedData.length,
        file_url: urlData.publicUrl,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    console.log('导出处理完成:', exportId)

  } catch (error) {
    console.error('Export processing failed:', error)
    // Update to failed status with error message
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      await supabase
        .from('data_exports')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId)
    } catch (updateError) {
      console.error('Failed to update export status to failed:', updateError)
    }
  }
}

// Helper functions for different export types
async function exportPosts(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
    
  query = query.order('created_at', { ascending: true })

  const { data: posts } = await query
  return { posts: posts || [], exportDate: new Date().toISOString() }
}

async function exportTasks(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
    
  query = query.order('created_at', { ascending: true })

  const { data: tasks } = await query
  return { tasks: tasks || [], exportDate: new Date().toISOString() }
}

async function exportSummaries(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('summary_date', startDate)
  }
  
  if (endDate) {
    query = query.lte('summary_date', endDate)
  }
    
  query = query.order('summary_date', { ascending: true })

  const { data: summaries } = await query
  return { summaries: summaries || [], exportDate: new Date().toISOString() }
}

async function exportHabits(userId: string, startDate?: string, endDate?: string) {
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)

  let habitLogs: any[] = []
  if (startDate && endDate) {
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true })
    
    habitLogs = logs || []
  }

  return { 
    habits: habits || [], 
    habitLogs,
    exportDate: new Date().toISOString() 
  }
}

async function exportMoods(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('log_date', startDate)
  }
  
  if (endDate) {
    query = query.lte('log_date', endDate)
  }
    
  query = query.order('log_date', { ascending: true })

  const { data: moods } = await query
  return { moods: moods || [], exportDate: new Date().toISOString() }
}

async function exportAllData(userId: string, startDate?: string, endDate?: string) {
  const [posts, tasks, summaries, habits, moods] = await Promise.all([
    exportPosts(userId, startDate, endDate),
    exportTasks(userId, startDate, endDate),
    exportSummaries(userId, startDate, endDate),
    exportHabits(userId, startDate, endDate),
    exportMoods(userId, startDate, endDate)
  ])

  return {
    posts: posts.posts,
    tasks: tasks.tasks,
    summaries: summaries.summaries,
    habits: habits.habits,
    moods: moods.moods,
    exportDate: new Date().toISOString()
  }
}

function convertToCSV(data: any): string {
  if (!data || data.length === 0) return ''
  
  // Simple CSV conversion
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row: any) => 
    Object.values(row).map(value => 
      `"${String(value).replace(/"/g, '""')}"`
    ).join(',')
  )
  
  return [headers, ...rows].join('\n')
}
