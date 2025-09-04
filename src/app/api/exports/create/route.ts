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

    const { exportType, format, dateRangeStart, dateRangeEnd } = await request.json()
    
    if (!exportType || !format) {
      return NextResponse.json({ error: 'Export type and format are required' }, { status: 400 })
    }

    // Create export record
    const { data: exportRecord, error: createError } = await supabase
      .from('data_exports')
      .insert({
        user_id: user.id,
        export_type: exportType,
        format,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        status: 'processing'
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create export record:', createError)
      return NextResponse.json({ error: 'Failed to create export record' }, { status: 500 })
    }

    // Process export asynchronously
    processExport(exportRecord.id, exportRecord).catch(console.error)

    return NextResponse.json({ 
      message: 'Export created successfully',
      exportId: exportRecord.id 
    })

  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Failed to create export' }, { status: 500 })
  }
}

async function processExport(exportId: string, exportRecord: any) {
  try {
    console.log('开始处理导出:', exportId)
    
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
    let fileExtension: string
    
    switch (exportRecord.format) {
      case 'json':
        formattedData = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        fileExtension = 'json'
        break
      case 'csv':
        formattedData = convertToCSV(exportData)
        mimeType = 'text/csv'
        fileExtension = 'csv'
        break
      default:
        throw new Error(`Unsupported format: ${exportRecord.format}`)
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const uniqueFileName = `${fileName}_${timestamp}.${fileExtension}`
    const filePath = `exports/${exportRecord.id}/${uniqueFileName}`

    // Create blob
    const blob = new Blob([formattedData], { type: mimeType })

    // Upload to Supabase Storage using service role key
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, blob, {
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('文件上传失败:', uploadError)
      throw new Error('Failed to upload export file')
    }

    console.log('文件上传成功:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exports')
      .getPublicUrl(filePath)

    // Update status to completed
    const { error: updateError } = await supabase
      .from('data_exports')
      .update({
        status: 'completed',
        file_name: uniqueFileName,
        file_size: formattedData.length,
        file_url: urlData.publicUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId)

    if (updateError) {
      throw new Error('Failed to update export completion')
    }

    console.log('导出处理完成:', exportId)

  } catch (error) {
    console.error('Export processing failed:', error)
    
    // Update to failed status
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
    query = query.gte('date', startDate)
  }
  
  if (endDate) {
    query = query.lte('date', endDate)
  }
    
  query = query.order('date', { ascending: true })

  const { data: summaries } = await query
  return { summaries: summaries || [], exportDate: new Date().toISOString() }
}

async function exportHabits(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
    
  query = query.order('created_at', { ascending: true })

  const { data: habits } = await query
  return { habits: habits || [], exportDate: new Date().toISOString() }
}

async function exportMoods(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
    
  query = query.order('created_at', { ascending: true })

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
  // Simple CSV conversion - you might want to use a library like 'json2csv' for production
  if (!data || typeof data !== 'object') return ''
  
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const flattened: Record<string, any> = {}
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], newKey))
        } else {
          flattened[newKey] = obj[key]
        }
      }
    }
    
    return flattened
  }

  const items = Array.isArray(data) ? data : [data]
  if (items.length === 0) return ''
  
  const flattenedItems = items.map(item => flattenObject(item))
  const headers = Object.keys(flattenedItems[0] || {})
  
  const csvRows = [
    headers.join(','),
    ...flattenedItems.map(item => 
      headers.map(header => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}
