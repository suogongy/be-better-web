'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Repeat, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // Every X days/weeks/months/years
  daysOfWeek?: number[] // For weekly: 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number // For monthly: specific day (1-31)
  endDate?: string
  maxOccurrences?: number
}

interface RecurringTaskFormProps {
  isOpen: boolean
  initialPattern?: RecurrencePattern
  onSave: (pattern: RecurrencePattern) => void
  onCancel: () => void
}

export function RecurringTaskForm({ 
  isOpen, 
  initialPattern, 
  onSave, 
  onCancel 
}: RecurringTaskFormProps) {
  const [pattern, setPattern] = useState<RecurrencePattern>(
    initialPattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1], // Default to Monday
    }
  )

  if (!isOpen) return null

  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    setPattern(prev => ({ ...prev, ...updates }))
  }

  const handleTypeChange = (type: RecurrencePattern['type']) => {
    const newPattern: RecurrencePattern = {
      type,
      interval: 1,
    }

    switch (type) {
      case 'weekly':
        newPattern.daysOfWeek = [1] // Monday
        break
      case 'monthly':
        newPattern.dayOfMonth = 1
        break
    }

    setPattern(newPattern)
  }

  const toggleDayOfWeek = (dayIndex: number) => {
    if (pattern.type !== 'weekly') return

    const daysOfWeek = pattern.daysOfWeek || []
    const newDays = daysOfWeek.includes(dayIndex)
      ? daysOfWeek.filter(d => d !== dayIndex)
      : [...daysOfWeek, dayIndex].sort()

    updatePattern({ daysOfWeek: newDays })
  }

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  const getIntervalLabel = () => {
    switch (pattern.type) {
      case 'daily':
        return pattern.interval === 1 ? '天' : '天'
      case 'weekly':
        return pattern.interval === 1 ? '周' : '周'
      case 'monthly':
        return pattern.interval === 1 ? '个月' : '个月'
      case 'yearly':
        return pattern.interval === 1 ? '年' : '年'
    }
  }

  const generatePreview = () => {
    const { type, interval, daysOfWeek, dayOfMonth } = pattern

    switch (type) {
      case 'daily':
        return interval === 1 ? '每天' : `每 ${interval} 天`
      
      case 'weekly':
        const days = daysOfWeek?.map(d => `周${dayNames[d]}`).join('、') || '未选择日期'
        const weekText = interval === 1 ? '周' : `${interval} 周`
        return `每 ${weekText} 的 ${days}`
      
      case 'monthly':
        const monthText = interval === 1 ? '月' : `${interval} 个月`
        return `每 ${monthText} 的第 ${dayOfMonth || 1} 天`
      
      case 'yearly':
        const yearText = interval === 1 ? '年' : `${interval} 年`
        return `每 ${yearText}`
      
      default:
        return '无效模式'
    }
  }

  const isValidPattern = () => {
    if (pattern.interval < 1) return false
    
    if (pattern.type === 'weekly' && (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)) {
      return false
    }
    
    if (pattern.type === 'monthly' && (!pattern.dayOfMonth || pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      return false
    }

    return true
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-0">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 dark:bg-gray-800">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            重复任务设置
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6 bg-white dark:bg-gray-900">
          {/* Recurrence Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              重复类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm border transition-colors",
                    pattern.type === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  {type === 'daily' ? '每日' : type === 'weekly' ? '每周' : type === 'monthly' ? '每月' : '每年'}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              每
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={pattern.interval}
                onChange={(e) => updatePattern({ interval: parseInt(e.target.value) || 1 })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {getIntervalLabel()}
              </span>
            </div>
          </div>

          {/* Weekly: Days of Week */}
          {pattern.type === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                选择天数
              </label>
              <div className="flex gap-1">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDayOfWeek(index)}
                    className={cn(
                      "px-2 py-1 rounded text-xs border transition-colors",
                      pattern.daysOfWeek?.includes(index)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    )}
                  >
                    周{day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Day of Month */}
          {pattern.type === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                每月第几天
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={pattern.dayOfMonth || 1}
                onChange={(e) => updatePattern({ dayOfMonth: parseInt(e.target.value) || 1 })}
                className="w-20"
              />
            </div>
          )}

          {/* End Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              结束条件
            </label>
            <div className="space-y-3">
              {/* Never End */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!pattern.endDate && !pattern.maxOccurrences}
                  onChange={() => updatePattern({ endDate: undefined, maxOccurrences: undefined })}
                  className="text-primary"
                />
                <span className="text-sm">永不结束</span>
              </label>

              {/* End Date */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!pattern.endDate}
                  onChange={() => updatePattern({ 
                    endDate: new Date().toISOString().split('T')[0], 
                    maxOccurrences: undefined 
                  })}
                  className="text-primary"
                />
                <span className="text-sm">结束日期</span>
                {pattern.endDate && (
                  <Input
                    type="date"
                    value={pattern.endDate}
                    onChange={(e) => updatePattern({ endDate: e.target.value })}
                    className="ml-2"
                  />
                )}
              </label>

              {/* Max Occurrences */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!pattern.maxOccurrences}
                  onChange={() => updatePattern({ 
                    maxOccurrences: 10, 
                    endDate: undefined 
                  })}
                  className="text-primary"
                />
                <span className="text-sm">执行</span>
                {pattern.maxOccurrences && (
                  <>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={pattern.maxOccurrences}
                      onChange={(e) => updatePattern({ maxOccurrences: parseInt(e.target.value) || 1 })}
                      className="w-16"
                    />
                    <span className="text-sm">次</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">预览</div>
            <div className="text-sm text-muted-foreground">
              {generatePreview()}
              {pattern.endDate && (
                <span> ，直到 {pattern.endDate}</span>
              )}
              {pattern.maxOccurrences && (
                <span> ，共 {pattern.maxOccurrences} 次</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button 
              onClick={() => onSave(pattern)}
              disabled={!isValidPattern()}
            >
              保存设置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}