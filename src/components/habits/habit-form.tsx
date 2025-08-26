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
  name: z.string().min(1, 'Habit name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
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
  { value: 'circle', icon: Circle, label: 'Circle' },
  { value: 'square', icon: Square, label: 'Square' },
  { value: 'triangle', icon: Triangle, label: 'Triangle' },
  { value: 'star', icon: Star, label: 'Star' },
  { value: 'heart', icon: Heart, label: 'Heart' },
  { value: 'zap', icon: Zap, label: 'Lightning' },
  { value: 'target', icon: Target, label: 'Target' },
]

const frequencyOptions = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Once per week' },
  { value: 'monthly', label: 'Monthly', description: 'Once per month' },
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
            {habit ? 'Edit Habit' : 'Create New Habit'}
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
                  Habit Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Drink 8 glasses of water"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  {...register('description')}
                  placeholder="Optional description or motivation..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Input
                  {...register('category')}
                  placeholder="e.g., Health, Productivity, Learning"
                />
              </div>
            </div>

            {/* Frequency and Target */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Frequency
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
                  Target Count
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
                    times per {selectedFrequency === 'daily' ? 'day' : selectedFrequency === 'weekly' ? 'week' : 'month'}
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
                  Color
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
                  Icon
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
                  <div className="font-medium">Enable Reminders</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified to complete this habit
                  </div>
                </div>
              </div>

              {watch('reminder_enabled') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reminder Time
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
              <h4 className="font-medium mb-2">Preview</h4>
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
                  <div className="font-medium">{watch('name') || 'Habit Name'}</div>
                  <div className="text-sm text-muted-foreground">
                    {watch('target_count')} time{watch('target_count') > 1 ? 's' : ''} per {selectedFrequency}
                    {watch('category') && ` • ${watch('category')}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {habit ? 'Update Habit' : 'Create Habit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}