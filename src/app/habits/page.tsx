'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { habitService } from '@/lib/supabase/advanced-services'
import { HabitTracker } from '@/components/habits/habit-tracker'
import { HabitForm } from '@/components/habits/habit-form'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'
import type { HabitWithLogs } from '@/types/advanced'

export default function HabitsPage() {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateHabit = async (habitData: any) => {
    if (!user) return
    
    try {
      await habitService.createHabit({
        ...habitData,
        user_id: user.id
      })
      
      addToast({
        title: '成功',
        description: '习惯创建成功！',
        variant: 'success',
      })
      
      setShowHabitForm(false)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建习惯失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateHabit = async (habitData: any) => {
    if (!editingHabit) return
    
    try {
      await habitService.updateHabit(editingHabit.id, habitData)
      
      addToast({
        title: '成功',
        description: '习惯更新成功！',
        variant: 'success',
      })
      
      setEditingHabit(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      addToast({
        title: '错误',
        description: '更新习惯失败，请重试。',
        variant: 'destructive',
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能跟踪您的习惯。
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">习惯跟踪</h1>
          <p className="text-muted-foreground mt-1">
            培养积极习惯，跟踪您的进展
          </p>
        </div>
      </div>

      {/* Main Content */}
      <HabitTracker
        key={refreshKey}
        onCreateHabit={() => setShowHabitForm(true)}
        onEditHabit={setEditingHabit}
      />

      {/* Habit Form Modal */}
      {(showHabitForm || editingHabit) && (
        <HabitForm
          habit={editingHabit}
          onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
          onCancel={() => {
            setShowHabitForm(false)
            setEditingHabit(null)
          }}
        />
      )}
    </div>
  )
}