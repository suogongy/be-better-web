'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  X, 
  Target, 
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  Zap
} from 'lucide-react'
import type { HabitWithLogs } from '@/types/advanced'

const habitSchema = z.object({
  name: z.string().min(1, '习惯名称不能为空').max(255, '名称过长'),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '无效的颜色格式'),
  icon: z.string(),
  reminder_time: z.string().optional(),
  reminder_enabled: z.boolean(),
})

type HabitFormData = z.infer<typeof habitSchema>

interface HabitFormProps {
  habit?: HabitWithLogs | null
  onSubmit: (data: HabitFormData) => Promise<void>
  onCancel: () => void
}

const colorOptions = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

const iconOptions = [
  { value: 'circle', icon: Circle, label: '圆形' },
  { value: 'square', icon: Square, label: '方形' },
  { value: 'triangle', icon: Triangle, label: '三角形' },
  { value: 'star', icon: Star, label: '星星' },
  { value: 'heart', icon: Heart, label: '爱心' },
  { value: 'zap', icon: Zap, label: '闪电' },
  { value: 'target', icon: Target, label: '目标' },
]

const frequencyOptions = [
  { value: 'daily', label: '每日', description: '每天' },
  { value: 'weekly', label: '每周', description: '每周一次' },
  { value: 'monthly', label: '每月', description: '每月一次' },
]

export function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit?.name || '',
      description: habit?.description || '',
      category: habit?.category || '',
      frequency: habit?.frequency || 'daily',
      target_count: habit?.target_count || 1,
      color: habit?.color || '#3B82F6',
      icon: habit?.icon || 'circle',
      reminder_time: habit?.reminder_time || '',
      reminder_enabled: habit?.reminder_enabled || false,
    }
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const selectedFrequency = watch('frequency')

  const handleFormSubmit = async (data: HabitFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedIconComponent = iconOptions.find(opt => opt.value === selectedIcon)?.icon || Circle

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {habit ? '编辑习惯' : '创建新习惯'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  习惯名称 *
                </label>
                <Input
                  {...register('name')}
                  placeholder="例如：每天喝8杯水"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  描述
                </label>
                <Textarea
                  {...register('description')}
                  placeholder="可选的描述或动机..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  分类
                </label>
                <Input
                  {...register('category')}
                  placeholder="例如：健康、效率、学习"
                />
              </div>
            </div>

            {/* Frequency and Target */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">
                  频率
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {frequencyOptions.map(option => (
                    <label key={option.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        {...register('frequency')}
                        value={option.value}
                        className="sr-only"
                      />
                      <div className={`p-3 border rounded-lg text-center transition-all ${
                        selectedFrequency === option.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  目标次数
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('target_count', { valueAsNumber: true })}
                    min={1}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    次/{selectedFrequency === 'daily' ? '天' : selectedFrequency === 'weekly' ? '周' : '月'}
                  </span>
                </div>
                {errors.target_count && (
                  <p className="text-sm text-red-600 mt-1">{errors.target_count.message}</p>
                )}
              </div>
            </div>

            {/* Visual Customization */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">
                  颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  图标
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map(option => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('icon', option.value)}
                        className={`p-3 border rounded-lg transition-all ${
                          selectedIcon === option.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto" style={{ color: selectedColor }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('reminder_enabled')}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">启用提醒</div>
                  <div className="text-sm text-muted-foreground">
                    接收完成此习惯的通知
                  </div>
                </div>
              </div>

              {watch('reminder_enabled') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    提醒时间
                  </label>
                  <Input
                    type="time"
                    {...register('reminder_time')}
                    className="w-40"
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">预览</h4>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedColor + '20', borderColor: selectedColor, borderWidth: 2 }}
                >
                  {React.createElement(selectedIconComponent, { 
                    className: "h-5 w-5",
                    style: { color: selectedColor }
                  })}
                </div>
                <div>
                  <div className="font-medium">{watch('name') || '习惯名称'}</div>
                  <div className="text-sm text-muted-foreground">
                    {watch('target_count')} 次/{selectedFrequency}
                    {watch('category') && ` • ${watch('category')}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} type="button">
                取消
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {habit ? '更新习惯' : '创建习惯'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}