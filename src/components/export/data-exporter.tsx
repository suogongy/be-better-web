'use client'

import { useState, useEffect, useRef } from 'react'
import { exportService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { Download, FileText, Calendar, FileArchive, Loader2, Database, CheckCircle, AlertCircle, Clock, RefreshCw, Trash2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth/auth-context'
import { Loading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ExportRetryTest } from './export-retry-test'

import type { DataExport, ExportOptions } from '@/types/advanced'
import { supabase } from '@/lib/supabase/client'

const exportTypes = [
  { 
    value: 'all', 
    label: '全部数据', 
    description: '导出您的所有数据',
    icon: Database 
  },
  { 
    value: 'posts', 
    label: '博客文章', 
    description: '导出所有博客文章',
    icon: FileText 
  },
  { 
    value: 'tasks', 
    label: '任务', 
    description: '导出所有任务和任务历史',
    icon: CheckCircle 
  },
  { 
    value: 'summaries', 
    label: '每日总结', 
    description: '导出所有每日总结和分析',
    icon: Calendar 
  },
  { 
    value: 'habits', 
    label: '习惯', 
    description: '导出习惯追踪数据和日志',
    icon: CheckCircle 
  },
  { 
    value: 'moods', 
    label: '情绪日志', 
    description: '导出情绪追踪和健康数据',
    icon: AlertCircle 
  },
]

const exportFormats = [
  { 
    value: 'json', 
    label: 'JSON', 
    description: '适用于开发者的机器可读格式',
    extension: '.json'
  },
  { 
    value: 'csv', 
    label: 'CSV', 
    description: '适用于分析的电子表格格式',
    extension: '.csv'
  },
]

export function DataExporter() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [exports, setExports] = useState<DataExport[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  // Export form state
  const [selectedType, setSelectedType] = useState<'posts' | 'tasks' | 'summaries' | 'habits' | 'moods' | 'all'>('all')
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadExports = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const exports = await exportService.getExports(user.id)
      // 添加类型断言来修复类型不匹配问题
      setExports(exports as DataExport[])
      
      // Check if there are any pending or processing exports
      const hasActiveExports = exports?.some(exp => exp.status === 'pending' || exp.status === 'processing')
      
      if (hasActiveExports) {
        // Start polling for updates
        startPolling()
      } else {
        stopPolling()
      }
    } catch (error) {
      console.error('加载导出列表失败:', error)
      addToast({
        title: '错误',
        description: '加载导出列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    if (pollingRef.current) return
    
    pollingRef.current = setInterval(async () => {
      if (!user) return
      
      try {
        const data = await exportService.getExports(user.id)
        setExports(data || [])
        
        // Check if all exports are completed
        const hasActiveExports = data?.some(exp => exp.status === 'pending' || exp.status === 'processing')
        
        if (!hasActiveExports) {
          stopPolling()
        }
      } catch (error) {
        console.error('Polling exports failed:', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    if (user) {
      loadExports()
      
      // Set default date range (last 30 days)
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      
      setEndDate(format(end, 'yyyy-MM-dd'))
      setStartDate(format(start, 'yyyy-MM-dd'))
    }
    
    // Cleanup on unmount
    return () => {
      stopPolling()
    }
  }, [user])

  const handleCreateExport = async () => {
    if (!user) return
    
    try {
      setCreating(true)
      
      // 获取用户的认证token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('用户未认证，无法创建导出')
      }
      
      const response = await fetch('/api/exports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          exportType: selectedType,
          format: selectedFormat,
          dateRangeStart: startDate,
          dateRangeEnd: endDate
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建导出失败')
      }
      
      const result = await response.json()
      
      addToast({
        title: '导出已开始',
        description: '您的数据导出已加入处理队列',
        variant: 'success',
      })
      
      loadExports()
    } catch (error: any) {
      console.error('创建导出失败:', error)
      addToast({
        title: '错误',
        description: error.message || '创建导出失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleRetryExport = async (exportId: string) => {
    console.log('🔄 开始重试导出，ID:', exportId)
    
    try {
      setRetrying(exportId)
      console.log('✅ 设置重试状态为loading')
      
      console.log('📞 调用exportService.retryExport...')
      await exportService.retryExport(exportId)
      console.log('✅ exportService.retryExport 调用成功')
      
      addToast({
        title: '重新导出已开始',
        description: '导出任务已重新加入处理队列',
        variant: 'success',
      })
      
      console.log('🔄 重新加载导出列表...')
      loadExports()
    } catch (error: any) {
      console.error('❌ 重新导出失败:', error)
      addToast({
        title: '错误',
        description: error.message || '重新导出失败，请重试',
        variant: 'destructive',
      })
    } finally {
      console.log('🏁 清除重试状态')
      setRetrying(null)
    }
  }

  const handleDeleteExport = async (exportId: string) => {
    try {
      setDeleting(exportId)
      await exportService.deleteExport(exportId)
      
      addToast({
        title: '导出已删除',
        description: '导出记录和文件已成功删除',
        variant: 'success',
      })
      
      loadExports()
      setShowDeleteDialog(null)
    } catch (error: any) {
      console.error('删除导出失败:', error)
      addToast({
        title: '错误',
        description: error.message || '删除导出失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      case 'processing':
        return '处理中'
      case 'pending':
        return '待处理'
      default:
        return status
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="加载导出历史..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            创建数据导出
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              导出内容
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exportTypes.map(type => {
                const Icon = type.icon
                return (
                  <label key={type.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="exportType"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={(e) => setSelectedType(e.target.value as 'posts' | 'tasks' | 'summaries' | 'habits' | 'moods' | 'all')}
                      className="sr-only"
                    />
                    <div className={`p-4 border rounded-lg transition-all ${
                      selectedType === type.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          selectedType === type.value ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium mb-3">
              格式
            </label>
            <div className="grid grid-cols-3 gap-3">
              {exportFormats.map(format => (
                <label key={format.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as 'json' | 'csv')}
                    className="sr-only"
                  />
                  <div className={`p-3 border rounded-lg text-center transition-all ${
                    selectedFormat === format.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}>
                    <div className="font-medium">{format.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-3">
              日期范围
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  开始日期
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  结束日期
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Create Button */}
          <Button 
            onClick={handleCreateExport} 
            loading={creating}
            className="w-full"
            disabled={!startDate || !endDate}
          >
            <Download className="h-4 w-4 mr-2" />
            创建导出
          </Button>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>导出历史</CardTitle>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">暂无导出记录</h3>
              <p className="text-muted-foreground">
                创建您的第一个数据导出以开始使用。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exports.map(exportItem => (
                <div
                  key={exportItem.id}
                  className="p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(exportItem.status)}
                      <div>
                        <div className="font-medium">
                          {exportTypes.find(t => t.value === exportItem.export_type)?.label || exportItem.export_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {exportItem.format.toUpperCase()} 格式
                          {exportItem.date_range_start && exportItem.date_range_end && (
                            <span> • {format(new Date(exportItem.date_range_start), 'MMM d')} - {format(new Date(exportItem.date_range_end), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                        {exportItem.error_message && (
                          <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {exportItem.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(exportItem.status)}>
                        {getStatusText(exportItem.status)}
                      </Badge>
                      
                      {exportItem.status === 'completed' && exportItem.file_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={exportItem.file_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            下载
                          </a>
                        </Button>
                      )}
                      
                      {(exportItem.status === 'failed' || exportItem.status === 'pending') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRetryExport(exportItem.id)}
                          loading={retrying === exportItem.id}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {exportItem.status === 'failed' ? '重试' : '重新处理'}
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowDeleteDialog(exportItem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>创建于 {format(new Date(exportItem.created_at), 'yyyy年M月d日 H:mm')}</span>
                    <div className="flex items-center gap-4">
                      {exportItem.file_size && (
                        <span>{formatFileSize(exportItem.file_size)}</span>
                      )}
                      {exportItem.completed_at && (
                        <span>完成于 {format(new Date(exportItem.completed_at), 'yyyy年M月d日 H:mm')}</span>
                      )}
                      <span>过期时间 {format(new Date(exportItem.expires_at), 'yyyy年M月d日')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个导出记录吗？删除后将无法恢复，相关的导出文件也会被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(null)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDeleteExport(showDeleteDialog)}
              loading={deleting === showDeleteDialog}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}