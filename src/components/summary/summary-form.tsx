'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2 } from 'lucide-react'
import type { DailySummary } from '@/types/database'

const summarySchema = z.object({
  mood_rating: z.number().min(1).max(5).optional(),
  energy_rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  achievements: z.array(z.string()),
  challenges: z.array(z.string()),
  tomorrow_goals: z.array(z.string()),
})

type SummaryFormData = z.infer<typeof summarySchema>

interface SummaryFormProps {
  summary: DailySummary | null
  date: string
  onSubmit: (data: SummaryFormData) => void
  onCancel: () => void
}

export function SummaryForm({ summary, date, onSubmit, onCancel }: SummaryFormProps) {
  const [achievements, setAchievements] = useState<string[]>(summary?.achievements || [])
  const [challenges, setChallenges] = useState<string[]>(summary?.challenges || [])
  const [tomorrowGoals, setTomorrowGoals] = useState<string[]>(summary?.tomorrow_goals || [])
  const [newAchievement, setNewAchievement] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      mood_rating: summary?.mood_rating || undefined,
      energy_rating: summary?.energy_rating || undefined,
      notes: summary?.notes || '',
      achievements: achievements,
      challenges: challenges,
      tomorrow_goals: tomorrowGoals,
    }
  })

  const addItem = (
    type: 'achievement' | 'challenge' | 'goal',
    value: string,
    setter: (items: string[]) => void,
    currentItems: string[],
    clearInput: () => void
  ) => {
    if (value.trim()) {
      setter([...currentItems, value.trim()])
      clearInput()
    }
  }

  const removeItem = (
    type: 'achievement' | 'challenge' | 'goal',
    index: number,
    setter: (items: string[]) => void,
    currentItems: string[]
  ) => {
    setter(currentItems.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: SummaryFormData) => {
    setIsSubmitting(true)
    try {
      const formData = {
        ...data,
        achievements,
        challenges,
        tomorrow_goals: tomorrowGoals,
      }
      await onSubmit(formData)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingOptions = [
    { value: 1, label: '1 - Very Low', emoji: '😢' },
    { value: 2, label: '2 - Low', emoji: '😔' },
    { value: 3, label: '3 - Medium', emoji: '😐' },
    { value: 4, label: '4 - High', emoji: '😊' },
    { value: 5, label: '5 - Very High', emoji: '😄' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Edit Daily Summary
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
                Mood Rating
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-muted">
                    <input
                      type="radio"
                      {...register('mood_rating', { valueAsNumber: true })}
                      value={option.value}
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
                Energy Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {ratingOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-muted">
                    <input
                      type="radio"
                      {...register('energy_rating', { valueAsNumber: true })}
                      value={option.value}
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
                Today's Achievements
              </label>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <span className="flex-1 text-sm">{achievement}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('achievement', index, setAchievements, achievements)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="Add an achievement..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('achievement', newAchievement, setAchievements, achievements, () => setNewAchievement(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('achievement', newAchievement, setAchievements, achievements, () => setNewAchievement(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Challenges Faced
              </label>
              <div className="space-y-2">
                {challenges.map((challenge, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                    <span className="flex-1 text-sm">{challenge}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('challenge', index, setChallenges, challenges)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    placeholder="Add a challenge..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('challenge', newChallenge, setChallenges, challenges, () => setNewChallenge(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('challenge', newChallenge, setChallenges, challenges, () => setNewChallenge(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tomorrow's Goals */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tomorrow's Goals
              </label>
              <div className="space-y-2">
                {tomorrowGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="flex-1 text-sm">{goal}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem('goal', index, setTomorrowGoals, tomorrowGoals)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a goal for tomorrow..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('goal', newGoal, setTomorrowGoals, tomorrowGoals, () => setNewGoal(''))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem('goal', newGoal, setTomorrowGoals, tomorrowGoals, () => setNewGoal(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes & Reflections
              </label>
              <Textarea
                {...register('notes')}
                placeholder="Add any additional notes or reflections about your day..."
                rows={4}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Summary
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}