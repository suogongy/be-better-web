'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { exportService } from '@/lib/supabase/advanced-services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { 
  Download,
  FileText,
  Database,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import type { DataExport, ExportOptions } from '@/types/advanced'

const exportTypes = [
  { 
    value: 'all', 
    label: 'All Data', 
    description: 'Complete export of all your data',
    icon: Database 
  },
  { 
    value: 'tasks', 
    label: 'Tasks', 
    description: 'All your tasks and task history',
    icon: CheckCircle 
  },
  { 
    value: 'summaries', 
    label: 'Daily Summaries', 
    description: 'All daily summaries and analytics',
    icon: Calendar 
  },
  { 
    value: 'habits', 
    label: 'Habits', 
    description: 'Habit tracking data and logs',
    icon: CheckCircle 
  },
  { 
    value: 'moods', 
    label: 'Mood Logs', 
    description: 'Mood tracking and wellness data',
    icon: AlertCircle 
  },
]

const exportFormats = [
  { 
    value: 'json', 
    label: 'JSON', 
    description: 'Machine-readable format for developers',
    extension: '.json'
  },
  { 
    value: 'csv', 
    label: 'CSV', 
    description: 'Spreadsheet format for analysis',
    extension: '.csv'
  },
  { 
    value: 'pdf', 
    label: 'PDF', 
    description: 'Human-readable report format',
    extension: '.pdf'
  },
]

export function DataExporter() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [exports, setExports] = useState<DataExport[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Export form state
  const [selectedType, setSelectedType] = useState<'tasks' | 'summaries' | 'habits' | 'moods' | 'all'>('all')
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf'>('json')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadExports = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await exportService.getExports(user.id)
      setExports(data)
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load export history.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
  }, [user])

  const handleCreateExport = async () => {
    if (!user) return
    
    try {
      setCreating(true)
      
      const options: ExportOptions = {
        type: selectedType,
        format: selectedFormat,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
      
      await exportService.createExport(user.id, options)
      
      addToast({
        title: 'Export Started',
        description: 'Your data export has been queued for processing.',
        variant: 'success',
      })
      
      loadExports()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create export. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
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
        <Loading text="Loading export history..." />
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
            Create Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              What to Export
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
                      onChange={(e) => setSelectedType(e.target.value as any)}
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
              Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {exportFormats.map(format => (
                <label key={format.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
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
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
            Create Export
          </Button>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Exports Yet</h3>
              <p className="text-muted-foreground">
                Create your first data export to get started.
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
                          {exportItem.format.toUpperCase()} format
                          {exportItem.date_range_start && exportItem.date_range_end && (
                            <span> • {format(new Date(exportItem.date_range_start), 'MMM d')} - {format(new Date(exportItem.date_range_end), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(exportItem.status)}>
                        {exportItem.status}
                      </Badge>
                      
                      {exportItem.status === 'completed' && exportItem.file_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={exportItem.file_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Created {format(new Date(exportItem.created_at), 'MMM d, yyyy at h:mm a')}</span>
                    <div className="flex items-center gap-4">
                      {exportItem.file_size && (
                        <span>{formatFileSize(exportItem.file_size)}</span>
                      )}
                      <span>Expires {format(new Date(exportItem.expires_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}