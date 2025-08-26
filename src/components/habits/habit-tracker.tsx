'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { habitService } from '@/lib/supabase/advanced-services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loading } from '@/components/ui/loading'
import { 
  Plus,
  Target,
  Flame,
  Calendar,
  CheckCircle,
  Circle,
  TrendingUp,
  Award,
  Settings,
  MoreHorizontal
} from 'lucide-react'
import { format, parseISO, isToday } from 'date-fns'
import type { HabitWithLogs, HabitStats } from '@/types/advanced'

interface HabitTrackerProps {
  onCreateHabit?: () => void
  onEditHabit?: (habit: HabitWithLogs) => void
}

export function HabitTracker({ onCreateHabit, onEditHabit }: HabitTrackerProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [habits, setHabits] = useState<HabitWithLogs[]>([])
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingHabit, setLoggingHabit] = useState<string | null>(null)

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [habitsData, statsData] = await Promise.all([
        habitService.getHabits(user.id),
        habitService.getHabitStats(user.id)
      ])
      
      setHabits(habitsData)
      setStats(statsData)
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load habits. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const handleLogHabit = async (habitId: string, completed: boolean = true) => {
    if (!user || loggingHabit) return
    
    try {
      setLoggingHabit(habitId)
      const today = format(new Date(), 'yyyy-MM-dd')
      
      if (completed) {
        await habitService.logHabit({
          habit_id: habitId,
          user_id: user.id,
          log_date: today,
          completed_count: 1
        })
        
        addToast({
          title: 'Great job!',
          description: 'Habit logged successfully.',
          variant: 'success',
        })
      }
      
      loadData()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to log habit. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoggingHabit(null)
    }
  }

  const isHabitCompletedToday = (habit: HabitWithLogs): boolean => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return habit.recent_logs?.some(log => 
      log.log_date === today && log.completed_count >= log.target_count
    ) || false
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-orange-600 bg-orange-100'
    if (streak >= 14) return 'text-purple-600 bg-purple-100'
    if (streak >= 7) return 'text-blue-600 bg-blue-100'
    if (streak >= 3) return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-blue-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading habits..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Habits</p>
                  <p className="text-2xl font-bold">{stats.active_habits}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{stats.completed_today}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold">{stats.longest_streak}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">{Math.round(stats.completion_rate)}%</p>
                  <p className="text-xs text-muted-foreground">30 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Habits List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Habits</CardTitle>
          <Button onClick={onCreateHabit} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Habits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building positive habits to track your progress.
              </p>
              <Button onClick={onCreateHabit}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => {
                const isCompleted = isHabitCompletedToday(habit)
                const completionRate = habit.completion_rate || 0
                
                return (
                  <div
                    key={habit.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Completion Button */}
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLogHabit(habit.id, !isCompleted)}
                          disabled={loggingHabit === habit.id}
                          className={`h-10 w-10 rounded-full p-0 ${
                            isCompleted 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : ''
                          }`}
                        >
                          {loggingHabit === habit.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </Button>

                        {/* Habit Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${
                              isCompleted ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {habit.name}
                            </h3>
                            
                            {/* Frequency Badge */}
                            <Badge variant="secondary" className="text-xs">
                              {habit.frequency}
                            </Badge>
                            
                            {/* Category Badge */}
                            {habit.category && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: habit.color }}
                              >
                                {habit.category}
                              </Badge>
                            )}
                          </div>
                          
                          {habit.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {habit.description}
                            </p>
                          )}
                          
                          {/* Progress and Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className={`font-medium ${getStreakColor(habit.streak_count)}`}>
                                {habit.streak_count} day streak
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              <span className={`font-medium ${getCompletionColor(completionRate)}`}>
                                {Math.round(completionRate)}% completion
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Best Streak Badge */}
                        {habit.best_streak > 0 && (
                          <Badge className={getStreakColor(habit.best_streak)}>
                            <Award className="h-3 w-3 mr-1" />
                            Best: {habit.best_streak}
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditHabit?.(habit)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>30-day completion rate</span>
                        <span>{Math.round(completionRate)}%</span>
                      </div>
                      <Progress 
                        value={completionRate} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}