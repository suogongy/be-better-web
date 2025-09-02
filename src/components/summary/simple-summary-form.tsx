import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'

// 简化的验证模式
const simpleSummarySchema = z.object({
  mood_rating: z.number().min(1).max(5).optional(),
  energy_rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
})

type SimpleSummaryFormData = z.infer<typeof simpleSummarySchema>

interface SimpleSummaryFormProps {
  summary: any
  date: string
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function SimpleSummaryForm({ summary, date, onSubmit, onCancel }: SimpleSummaryFormProps) {
  const [achievements, setAchievements] = React.useState<string[]>(summary?.achievements as string[] || [])
  const [challenges, setChallenges] = React.useState<string[]>(summary?.challenges as string[] || [])
  const [tomorrowGoals, setTomorrowGoals] = React.useState<string[]>(summary?.tomorrow_goals as string[] || [])
  const [newAchievement, setNewAchievement] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [challenges, setChallenges] = React.useState<string[]>(summary?.challenges as string[] || [])
  const [tomorrowGoals, setTomorrowGoals] = React.useState<string[]>(summary?.tomorrow_goals as string[] || [])
  const [newChallenge, setNewChallenge] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SimpleSummaryFormData>({
    resolver: zodResolver(simpleSummarySchema),
    defaultValues: {
      mood_rating: summary?.mood_rating || undefined,
      energy_rating: summary?.energy_rating || undefined,
      notes: summary?.notes || '',
    }
  })

  const addItem = (value: string, setter: (items: string[]) => void, clearInput: () => void) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()])
      clearInput()
    }
  }

  const removeItem = (index: number, setter: (items: string[]) => void) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: SimpleSummaryFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      console.log('提交表单数据:', data)
      
      const formData = {
        ...data,
        achievements: achievements.filter(a => a.trim() !== ''),
        challenges: challenges.filter(c => c.trim() !== ''),
        tomorrow_goals: tomorrowGoals.filter(g => g.trim() !== ''),
      }
      
      console.log('最终提交数据:', formData)
      
      await onSubmit(formData)
      onCancel()
    } catch (error) {
      console.error('提交总结时出错:', error)
      setSubmitError(String(error))
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
            编辑每日总结（简化版）
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {date}
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Mood Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                心情评分
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center justify-center p-2 rounded border hover:bg-muted cursor-pointer">
                    <input
                      type="radio"
                      {...register('mood_rating', { valueAsNumber: true })}
                      value={option.value}
                      className="sr-only"
                    />
                    <span className="text-lg">{option.emoji}</span>
                    <span className="text-xs ml-1">{option.value}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Energy Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                精力水平
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center justify-center p-2 rounded border hover:bg-muted cursor-pointer">
                    <input
                      type="radio"
                      {...register('energy_rating', { valueAsNumber: true })}
                      value={option.value}
                      className="sr-only"
                    />
                    <span className="text-sm">{option.value}</span>
                  </label>
                ))}
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
                      onClick={() => removeItem(index, setAchievements)}
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem(newAchievement, setAchievements, () => setNewAchievement(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">提交失败</div>
                  <div className="text-sm">{submitError}</div>
                </div>
              </div>
            )}

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
                      onClick={() => removeItem(index, setChallenges)}
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem(newChallenge, setChallenges, () => setNewChallenge(''))}
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
                      onClick={() => removeItem(index, setTomorrowGoals)}
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem(newGoal, setTomorrowGoals, () => setNewGoal(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

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