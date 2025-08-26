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
import { RecurringTaskForm } from './recurring-task-form'
import { X, Plus, Repeat } from 'lucide-react'
import type { Task } from '@/types/database'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
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
  const [showRecurringForm, setShowRecurringForm] = useState(false)
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

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  ]

  const statusOptions = [
    { value: 'pending', label: 'To Do', color: 'bg-orange-100 text-orange-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title *
              </label>
              <Input
                {...register('title')}
                placeholder="Enter task title..."
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                {...register('description')}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
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
                  Status
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
                Category
              </label>
              <div className="space-y-3">
                {/* Existing Categories */}
                {categories.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Select existing:</div>
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
                  <div className="text-xs text-muted-foreground mb-2">Or create new:</div>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category..."
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
                  placeholder="Or type category directly..."
                  value={watchedCategory}
                />
              </div>
            </div>

            {/* Time and Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estimated Time (minutes)
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
                  Due Date
                </label>
                <Input
                  type="date"
                  {...register('due_date')}
                />
              </div>

              {/* Due Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Time
                </label>
                <Input
                  type="time"
                  {...register('due_time')}
                />
              </div>
            </div>

            {/* Recurring Task */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recurring Task
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('is_recurring')}
                    className="rounded"
                  />
                  <label className="text-sm font-medium">
                    Make this a recurring task
                  </label>
                </div>
                
                {watch('is_recurring') && (
                  <div className="space-y-3">
                    {recurrencePattern ? (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Recurrence Pattern</div>
                            <div className="text-xs text-muted-foreground">
                              {/* Display pattern summary */}
                              {recurrencePattern.type} pattern configured
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRecurringForm(true)}
                            >
                              <Repeat className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecurrencePattern(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRecurringForm(true)}
                        className="w-full"
                      >
                        <Repeat className="h-4 w-4 mr-2" />
                        Set Recurrence Pattern
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress (only for editing) */}
            {task && watchedStatus !== 'pending' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Progress ({watch('progress')}%)
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
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Recurring Task Form Modal */}
      <RecurringTaskForm
        isOpen={showRecurringForm}
        initialPattern={recurrencePattern || undefined}
        onSave={(pattern) => {
          setRecurrencePattern(pattern)
          setShowRecurringForm(false)
        }}
        onCancel={() => setShowRecurringForm(false)}
      />
    </div>
  )
}