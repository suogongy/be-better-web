'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Repeat, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

const taskSchema = z.object({
  title: z.string().min(1, '标题是必填的').max(255, '标题过长'),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  estimated_minutes: z.number().min(1).optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  is_recurring: z.boolean(),
  progress: z.number().min(0).max(100),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: Task | null
  categories: string[]
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
}

type RecurrencePattern = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endDate?: string
  maxOccurrences?: number
}

export function TaskForm({ task, categories, onSubmit, onCancel }: TaskFormProps) {
  const [newCategory, setNewCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRecurringOptions, setShowRecurringOptions] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(
    task?.recurrence_pattern ? task.recurrence_pattern as RecurrencePattern : null
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      category: task?.category || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'pending',
      estimated_minutes: task?.estimated_minutes || undefined,
      due_date: task?.due_date || '',
      due_time: task?.due_time || '',
      is_recurring: task?.is_recurring || false,
      progress: task?.progress || 0,
    }
  })

  const watchedCategory = watch('category')
  const watchedStatus = watch('status')

  const handleFormSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      // Filter out empty strings and convert numbers
      const cleanData = {
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
        estimated_minutes: data.estimated_minutes || undefined,
        due_date: data.due_date || undefined,
        due_time: data.due_time || undefined,
        recurrence_pattern: recurrencePattern,
      }
      
      await onSubmit(cleanData)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setValue('category', newCategory.trim())
      setNewCategory('')
    }
  }

  // 重复任务相关函数
  const updateRecurrencePattern = (updates: Partial<RecurrencePattern>) => {
    setRecurrencePattern(prev => prev ? { ...prev, ...updates } : null)
  }

  const handleRecurrenceTypeChange = (type: RecurrencePattern['type']) => {
    const newPattern: RecurrencePattern = {
      type,
      interval: 1,
    }

    switch (type) {
      case 'weekly':
        newPattern.daysOfWeek = [1] // 默认周一
        break
      case 'monthly':
        newPattern.dayOfMonth = 1
        break
    }

    setRecurrencePattern(newPattern)
  }

  const toggleDayOfWeek = (dayIndex: number) => {
    if (!recurrencePattern || recurrencePattern.type !== 'weekly') return

    const daysOfWeek = recurrencePattern.daysOfWeek || []
    const newDays = daysOfWeek.includes(dayIndex)
      ? daysOfWeek.filter(d => d !== dayIndex)
      : [...daysOfWeek, dayIndex].sort()

    updateRecurrencePattern({ daysOfWeek: newDays })
  }

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  const generateRecurrencePreview = () => {
    if (!recurrencePattern) return ''
    
    const { type, interval, daysOfWeek, dayOfMonth } = recurrencePattern

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

  const priorityOptions = [
    { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高', color: 'bg-red-100 text-red-800' },
  ]

  const statusOptions = [
    { value: 'pending', label: '待办', color: 'bg-orange-100 text-orange-800' },
    { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl border-0">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 dark:bg-gray-800">
          <CardTitle className="text-lg font-semibold">
            {task ? '编辑任务' : '创建新任务'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                标题 *
              </label>
              <Input
                {...register('title')}
                placeholder="输入任务标题..."
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                描述
              </label>
              <Textarea
                {...register('description')}
                placeholder="添加任务描述..."
                rows={3}
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  优先级
                </label>
                <div className="space-y-2">
                  {priorityOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register('priority')}
                        value={option.value}
                        className="text-primary"
                      />
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  状态
                </label>
                <div className="space-y-2">
                  {statusOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register('status')}
                        value={option.value}
                        className="text-primary"
                      />
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                分类
              </label>
              <div className="space-y-3">
                {/* Existing Categories */}
                {categories.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">选择现有分类：</div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setValue('category', category)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            watchedCategory === category
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-border'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Category */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2">或创建新分类：</div>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="输入新分类..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addNewCategory}
                      disabled={!newCategory.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Manual category input */}
                <Input
                  {...register('category')}
                  placeholder="或直接输入分类..."
                  value={watchedCategory}
                />
              </div>
            </div>

            {/* Time and Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  预计时间（分钟）
                </label>
                <Input
                  type="number"
                  {...register('estimated_minutes', { valueAsNumber: true })}
                  placeholder="60"
                  min="1"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  截止日期
                </label>
                <Input
                  type="date"
                  {...register('due_date')}
                />
              </div>

              {/* Due Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  截止时间
                </label>
                <Input
                  type="time"
                  {...register('due_time')}
                />
              </div>
            </div>

            {/* Recurring Task */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">
                  重复任务
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecurringOptions(!showRecurringOptions)}
                  className="flex items-center gap-2"
                >
                  <Repeat className="h-4 w-4" />
                  {showRecurringOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showRecurringOptions ? '收起设置' : '展开设置'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('is_recurring')}
                    className="rounded"
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setRecurrencePattern(null)
                        setShowRecurringOptions(false)
                      } else {
                        setShowRecurringOptions(true)
                        if (!recurrencePattern) {
                          handleRecurrenceTypeChange('weekly')
                        }
                      }
                    }}
                  />
                  <label className="text-sm font-medium">
                    设置为重复任务
                  </label>
                </div>
                
                {/* 重复设置选项 */}
                {(watch('is_recurring') && showRecurringOptions) && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    {/* 重复类型 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        重复类型
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleRecurrenceTypeChange(type)}
                            className={cn(
                              "px-3 py-2 rounded-md text-sm border transition-colors",
                              recurrencePattern?.type === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border"
                            )}
                          >
                            {{
                              daily: '每日',
                              weekly: '每周',
                              monthly: '每月',
                              yearly: '每年'
                            }[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 间隔 */}
                    {recurrencePattern && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          每
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={recurrencePattern.interval}
                            onChange={(e) => updateRecurrencePattern({ interval: parseInt(e.target.value) || 1 })}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {{
                              daily: recurrencePattern.interval === 1 ? '天' : '天',
                              weekly: recurrencePattern.interval === 1 ? '周' : '周',
                              monthly: recurrencePattern.interval === 1 ? '个月' : '个月',
                              yearly: recurrencePattern.interval === 1 ? '年' : '年'
                            }[recurrencePattern.type]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 周天选择 */}
                    {recurrencePattern?.type === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          选择天数
                        </label>
                        <div className="flex gap-1">
                          {dayNames.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleDayOfWeek(index)}
                              className={cn(
                                "px-3 py-2 rounded text-sm border transition-colors",
                                recurrencePattern.daysOfWeek?.includes(index)
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

                    {/* 月日选择 */}
                    {recurrencePattern?.type === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          每月第几天
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={recurrencePattern.dayOfMonth || 1}
                          onChange={(e) => updateRecurrencePattern({ dayOfMonth: parseInt(e.target.value) || 1 })}
                          className="w-20"
                        />
                      </div>
                    )}

                    {/* 结束条件 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        结束条件
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="endCondition"
                            checked={!recurrencePattern?.endDate && !recurrencePattern?.maxOccurrences}
                            onChange={() => updateRecurrencePattern({ endDate: undefined, maxOccurrences: undefined })}
                            className="text-primary"
                          />
                          <span className="text-sm">永不结束</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="endCondition"
                            checked={!!recurrencePattern?.endDate}
                            onChange={() => updateRecurrencePattern({ 
                              endDate: new Date().toISOString().split('T')[0], 
                              maxOccurrences: undefined 
                            })}
                            className="text-primary"
                          />
                          <span className="text-sm">结束日期</span>
                          {recurrencePattern?.endDate && (
                            <Input
                              type="date"
                              value={recurrencePattern.endDate}
                              onChange={(e) => updateRecurrencePattern({ endDate: e.target.value })}
                              className="ml-2 w-auto"
                            />
                          )}
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="endCondition"
                            checked={!!recurrencePattern?.maxOccurrences}
                            onChange={() => updateRecurrencePattern({ 
                              maxOccurrences: 10, 
                              endDate: undefined 
                            })}
                            className="text-primary"
                          />
                          <span className="text-sm">执行</span>
                          {recurrencePattern?.maxOccurrences && (
                            <>
                              <Input
                                type="number"
                                min="1"
                                max="1000"
                                value={recurrencePattern.maxOccurrences}
                                onChange={(e) => updateRecurrencePattern({ maxOccurrences: parseInt(e.target.value) || 1 })}
                                className="w-16"
                              />
                              <span className="text-sm">次</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* 预览 */}
                    {recurrencePattern && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">预览</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {generateRecurrencePreview()}
                          {recurrencePattern.endDate && (
                            <span> ，直到 {recurrencePattern.endDate}</span>
                          )}
                          {recurrencePattern.maxOccurrences && (
                            <span> ，共 {recurrencePattern.maxOccurrences} 次</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress (only for editing) */}
            {task && watchedStatus !== 'pending' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  进度 ({watch('progress')}%)
                </label>
                <input
                  type="range"
                  {...register('progress', { valueAsNumber: true })}
                  min="0"
                  max="100"
                  step="5"
                  className="w-full"
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} type="button">
                取消
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {task ? '更新任务' : '创建任务'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}