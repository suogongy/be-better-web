'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import type { DailySummary } from '@/types/database'

// 定义错误类型
interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function getErrorMessage(error: unknown) {
  if (isErrorWithMessage(error)) return error.message
  return String(error)
}

const summarySchema = z.object({
  mood_rating: z.number().min(1).max(5).optional(),
  energy_rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  tomorrow_goals: z.array(z.string()).optional(),
}).refine(data => {
  // 至少需要填写一个字段
  return data.mood_rating !== undefined || 
         data.energy_rating !== undefined || 
         (data.notes !== undefined && data.notes.trim() !== '') ||
         (data.achievements !== undefined && data.achievements.length > 0) ||
         (data.challenges !== undefined && data.challenges.length > 0) ||
         (data.tomorrow_goals !== undefined && data.tomorrow_goals.length > 0)
}, {
  message: "请至少填写一项内容",
  path: ["root"]
})

type SummaryFormData = z.infer<typeof summarySchema>

interface SummaryFormProps {
  summary: DailySummary | null
  date: string
  onSubmit: (data: SummaryFormData) => void
  onCancel: () => void
}

export function SummaryForm({ summary, date, onSubmit, onCancel }: SummaryFormProps) {
  console.log('SummaryForm 初始化, summary:', summary)
  
  const [achievements, setAchievements] = useState<string[]>(summary?.achievements as string[] || [])
  const [challenges, setChallenges] = useState<string[]>(summary?.challenges as string[] || [])
  const [tomorrowGoals, setTomorrowGoals] = useState<string[]>(summary?.tomorrow_goals as string[] || [])
  const [newAchievement, setNewAchievement] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, dirtyFields },
    setError,
    clearErrors
  } = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      mood_rating: summary?.mood_rating ?? undefined,
      energy_rating: summary?.energy_rating ?? undefined,
      notes: summary?.notes ?? '',
      achievements: summary?.achievements as string[] ?? [],
      challenges: summary?.challenges as string[] ?? [],
      tomorrow_goals: summary?.tomorrow_goals as string[] ?? [],
    },
    mode: 'onChange' // 实时验证
  })

  // 添加表单状态监听
  const formValues = watch()
  console.log('表单状态变化:', { 
    isValid, 
    errors: Object.keys(errors), 
    formValues: {
      mood_rating: formValues.mood_rating,
      energy_rating: formValues.energy_rating,
      notes: formValues.notes,
      achievements: formValues.achievements,
      challenges: formValues.challenges,
      tomorrow_goals: formValues.tomorrow_goals
    }
  })

  // 同步表单值到本地状态
  useEffect(() => {
    if (formValues.achievements) {
      setAchievements(formValues.achievements)
    }
    if (formValues.challenges) {
      setChallenges(formValues.challenges)
    }
    if (formValues.tomorrow_goals) {
      setTomorrowGoals(formValues.tomorrow_goals)
    }
  }, [formValues.achievements, formValues.challenges, formValues.tomorrow_goals])

  const addItem = (
    fieldName: 'achievements' | 'challenges' | 'tomorrow_goals',
    value: string,
    setter: (items: string[]) => void,
    clearInput: () => void
  ) => {
    if (value.trim()) {
      const newItems = [...(formValues[fieldName] || []), value.trim()]
      setValue(fieldName, newItems, { shouldValidate: true })
      setter(newItems)
      clearInput()
    }
  }

  const removeItem = (
    fieldName: 'achievements' | 'challenges' | 'tomorrow_goals',
    index: number,
    setter: (items: string[]) => void
) => {
    const newItems = (formValues[fieldName] || []).filter((_, i) => i !== index)
    setValue(fieldName, newItems, { shouldValidate: true })
    setter(newItems)
  }

  const handleFormSubmit = async (data: SummaryFormData) => {
    console.log('handleFormSubmit 被调用，表单验证状态:', isValid)
    console.log('接收到的数据:', data)
    
    setIsSubmitting(true)
    setSubmitError(null)
    clearErrors()
    
    try {
      // 确保数组字段被正确包含
      const formData = {
        ...data,
        achievements: data.achievements ?? [],
        challenges: data.challenges ?? [],
        tomorrow_goals: data.tomorrow_goals ?? [],
      }
      
      console.log('提交表单数据:', formData)
      console.log('数组字段详情:', {
        achievements: formData.achievements,
        achievementsLength: formData.achievements?.length,
        challenges: formData.challenges,
        challengesLength: formData.challenges?.length,
        tomorrow_goals: formData.tomorrow_goals,
        tomorrowGoalsLength: formData.tomorrow_goals?.length
      })
      
      await onSubmit(formData)
      // 成功后由父组件决定是否关闭表单
    } catch (error) {
      console.error('提交总结时出错:', error)
      const errorMessage = getErrorMessage(error)
      setSubmitError(errorMessage)
      setError('root', { message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingOptions = [
    { value: 1, label: '1 - 非常低', emoji: '😢' },
    { value: 2, label: '2 - 低', emoji: '😔' },
    { value: 3, label: '3 - 中等', emoji: '😐' },
    { value: 4, label: '4 - 高', emoji: '😊' },
    { value: 5, label: '5 - 非常高', emoji: '😄' },
  ]
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            编辑每日总结
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {date}
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={(e) => {
          console.log('表单提交事件触发')
          handleSubmit(handleFormSubmit)(e)
        }} className="space-y-6">
            {/* Mood Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                心情评分
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-muted">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formValues.mood_rating === option.value}
                      onChange={() => setValue('mood_rating', option.value, { shouldValidate: true })}
                      className="text-primary"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <span className="text-lg">{option.emoji}</span>
                      <span className="hidden sm:inline">{option.value}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Energy Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                精力水平
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-muted">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formValues.energy_rating === option.value}
                      onChange={() => setValue('energy_rating', option.value, { shouldValidate: true })}
                      className="text-primary"
                    />
                    <span className="text-sm">
                      {option.value} - {option.label.split(' - ')[1]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-medium mb-2">
                今日成就
              </label>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <span className="flex-1 text-sm">{achievement}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('achievements', index, setAchievements)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="添加一个成就..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('achievements', newAchievement, setAchievements, () => setNewAchievement(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('achievements', newAchievement, setAchievements, () => setNewAchievement(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-sm font-medium mb-2">
                遇到的挑战
              </label>
              <div className="space-y-2">
                {challenges.map((challenge, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                    <span className="flex-1 text-sm">{challenge}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('challenges', index, setChallenges)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    placeholder="添加一个挑战..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('challenges', newChallenge, setChallenges, () => setNewChallenge(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('challenges', newChallenge, setChallenges, () => setNewChallenge(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tomorrow's Goals */}
            <div>
              <label className="block text-sm font-medium mb-2">
                明日目标
              </label>
              <div className="space-y-2">
                {tomorrowGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="flex-1 text-sm">{goal}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('tomorrow_goals', index, setTomorrowGoals)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="为明天添加一个目标..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('tomorrow_goals', newGoal, setTomorrowGoals, () => setNewGoal(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('tomorrow_goals', newGoal, setTomorrowGoals, () => setNewGoal(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                笔记与反思
              </label>
              <Textarea
                {...register('notes')}
                placeholder="添加关于您这一天的任何额外笔记或反思..."
                rows={4}
              />
            </div>

            {/* Error Message */}
            {(submitError || errors.root) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">提交失败</div>
                  <div className="text-sm">{submitError || errors.root?.message}</div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} type="button">
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存总结'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}