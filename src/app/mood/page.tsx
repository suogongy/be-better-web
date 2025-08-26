'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { MoodLogger } from '@/components/mood/mood-logger'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export default function MoodPage() {
  const { user, loading: authLoading } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleMoodAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to track your mood.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Mood Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your daily mood, energy, and wellbeing
          </p>
        </div>
      </div>

      {/* Main Content */}
      <MoodLogger key={refreshKey} onLogAdded={handleMoodAdded} />
    </div>
  )
}