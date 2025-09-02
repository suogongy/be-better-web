'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { moodService } from '@/lib/supabase/advanced-services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { 
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  AlertTriangle,
  Moon,
  Plus,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import type { MoodLog, MoodStats } from '@/types/advanced'

const moodEmojis = [
  { value: 1, emoji: '😢', label: '糟糕', color: 'text-red-600' },
  { value: 2, emoji: '😔', label: '不好', color: 'text-red-500' },
  { value: 3, emoji: '😕', label: '较差', color: 'text-orange-500' },
  { value: 4, emoji: '😐', label: '一般', color: 'text-yellow-500' },
  { value: 5, emoji: '🙂', label: '还好', color: 'text-yellow-600' },
  { value: 6, emoji: '😊', label: '不错', color: 'text-green-500' },
  { value: 7, emoji: '😄', label: '很好', color: 'text-green-600' },
  { value: 8, emoji: '😆', label: '非常好', color: 'text-blue-500' },
  { value: 9, emoji: '🤩', label: '极好', color: 'text-blue-600' },
  { value: 10, emoji: '🥳', label: '完美', color: 'text-purple-600' },
]

const energyLevels = [
  { value: 1, label: '精疲力尽', icon: '🔋', color: 'text-red-600' },
  { value: 2, label: '很低', icon: '🔋', color: 'text-red-500' },
  { value: 3, label: '较低', icon: '🔋', color: 'text-orange-500' },
  { value: 4, label: '一般以下', icon: '🔋', color: 'text-yellow-500' },
  { value: 5, label: '一般', icon: '🔋', color: 'text-yellow-600' },
  { value: 6, label: '良好', icon: '🔋', color: 'text-green-500' },
  { value: 7, label: '较高', icon: '⚡', color: 'text-green-600' },
  { value: 8, label: '很高', icon: '⚡', color: 'text-blue-500' },
  { value: 9, label: '精力充沛', icon: '⚡', color: 'text-blue-600' },
  { value: 10, label: '巅峰状态', icon: '⚡', color: 'text-purple-600' },
]

const stressLevels = [
  { value: 1, label: '完全平静', icon: '🧘', color: 'text-blue-600' },
  { value: 2, label: '非常放松', icon: '😌', color: 'text-blue-500' },
  { value: 3, label: '放松', icon: '😌', color: 'text-green-600' },
  { value: 4, label: '平静', icon: '😊', color: 'text-green-500' },
  { value: 5, label: '中性', icon: '😐', color: 'text-yellow-600' },
  { value: 6, label: '略有压力', icon: '😕', color: 'text-yellow-500' },
  { value: 7, label: '中度压力', icon: '😰', color: 'text-orange-500' },
  { value: 8, label: '压力较大', icon: '😫', color: 'text-red-500' },
  { value: 9, label: '压力很大', icon: '😖', color: 'text-red-600' },
  { value: 10, label: '不堪重负', icon: '🤯', color: 'text-red-700' },
]

const sleepQuality = [
  { value: 1, label: '很差', icon: '😴', color: 'text-red-600' },
  { value: 2, label: '较差', icon: '😴', color: 'text-red-500' },
  { value: 3, label: '不好', icon: '😴', color: 'text-orange-500' },
  { value: 4, label: '一般以下', icon: '😴', color: 'text-yellow-500' },
  { value: 5, label: '一般', icon: '😴', color: 'text-yellow-600' },
  { value: 6, label: '良好', icon: '😴', color: 'text-green-500' },
  { value: 7, label: '很好', icon: '😴', color: 'text-green-600' },
  { value: 8, label: '非常好', icon: '😴', color: 'text-blue-500' },
  { value: 9, label: '极好', icon: '😴', color: 'text-blue-600' },
  { value: 10, label: '完美', icon: '😴', color: 'text-purple-600' },
]

interface MoodLoggerProps {
  onLogAdded?: () => void
}

export function MoodLogger({ onLogAdded }: MoodLoggerProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [mood, setMood] = useState<number>(5)
  const [energy, setEnergy] = useState<number>(5)
  const [stress, setStress] = useState<number>(5)
  const [sleep, setSleep] = useState<number>(5)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [weather, setWeather] = useState('')
  const [location, setLocation] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [todayLogs, setTodayLogs] = useState<MoodLog[]>([])
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const [logs, statsData] = await Promise.all([
        moodService.getMoodLogs(user.id, { 
          startDate: today, 
          endDate: today 
        }),
        moodService.getMoodStats(user.id, 30)
      ])
      
      setTodayLogs(logs)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load mood data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const handleLogMood = async () => {
    if (!user) return
    
    try {
      setIsLogging(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      
      await moodService.logMood({
        user_id: user.id,
        log_date: today,
        mood_rating: mood,
        energy_level: energy,
        stress_level: stress,
        sleep_quality: sleep,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        weather: weather.trim() || undefined,
        location: location.trim() || undefined
      })
      
      addToast({
        title: '心情已记录',
        description: '您的心情记录已成功保存。',
        variant: 'success',
      })
      
      // Reset form
      setNotes('')
      setTags([])
      setNewTag('')
      setWeather('')
      setLocation('')
      
      // Reload data
      loadData()
      onLogAdded?.()
      
    } catch (error) {
      addToast({
        title: '错误',
        description: '记录心情失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setIsLogging(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const renderRatingScale = (
    value: number,
    onChange: (value: number) => void,
    options: any[],
    title: string,
    icon: React.ReactNode
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
        <Badge variant="secondary">
          {options.find(opt => opt.value === value)?.label || value}
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-2 rounded-lg border transition-all text-center min-w-12 ${
              value === option.value
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-lg">{option.emoji || option.icon}</div>
            <div className="text-xs font-medium">{option.value}</div>
          </button>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="加载心情数据中..." />
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
                  <p className="text-sm font-medium text-muted-foreground">平均心情</p>
                  <p className="text-2xl font-bold">{stats.avg_mood.toFixed(1)}</p>
                </div>
                <Smile className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均精力</p>
                  <p className="text-2xl font-bold">{stats.avg_energy.toFixed(1)}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均压力</p>
                  <p className="text-2xl font-bold">{stats.avg_stress.toFixed(1)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">趋势</p>
                  <p className="text-lg font-bold capitalize">{stats.mood_trend}</p>
                </div>
                <TrendingUp className={`h-8 w-8 ${
                  stats.mood_trend === 'up' ? 'text-green-600' :
                  stats.mood_trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Logs */}
      {todayLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今日心情记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayLogs.map(log => (
                <div key={log.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{log.log_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {moodEmojis.find(m => m.value === log.mood_rating)?.emoji || '😐'}
                      </span>
                      <Badge variant="secondary">{log.mood_rating}/10</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">精力:</span>
                      <span className="ml-1 font-medium">{log.energy_level || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">压力:</span>
                      <span className="ml-1 font-medium">{log.stress_level || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">睡眠:</span>
                      <span className="ml-1 font-medium">{log.sleep_quality || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                  )}
                  
                  {log.tags && log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Logger Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            记录您的心情
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Rating */}
          {renderRatingScale(
            mood, 
            setMood, 
            moodEmojis, 
            '心情评分',
            <Smile className="h-5 w-5 text-blue-600" />
          )}

          {/* Energy Level */}
          {renderRatingScale(
            energy, 
            setEnergy, 
            energyLevels, 
            '精力水平',
            <Zap className="h-5 w-5 text-green-600" />
          )}

          {/* Stress Level */}
          {renderRatingScale(
            stress, 
            setStress, 
            stressLevels, 
            '压力水平',
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}

          {/* Sleep Quality */}
          {renderRatingScale(
            sleep, 
            setSleep, 
            sleepQuality, 
            '睡眠质量',
            <Moon className="h-5 w-5 text-purple-600" />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              备注（可选）
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="您感觉如何？今天有什么影响了您的心情？"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              标签（可选）
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签（例如：工作、周末、运动）"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                天气（可选）
              </label>
              <Input
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="例如：晴天、雨天、多云"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                位置（可选）
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：家里、办公室、健身房"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleLogMood} 
            loading={isLogging}
            className="w-full"
          >
            <Heart className="h-4 w-4 mr-2" />
            记录心情
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}