'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Wand2, 
  FileText, 
  Calendar,
  BarChart3,
  Eye,
  Sparkles
} from 'lucide-react'
import type { DailySummary } from '@/types/database'

const blogGenerationSchema = z.object({
  template: z.enum(['daily', 'weekly', 'monthly']),
  includeTaskBreakdown: z.boolean().default(true),
  includePersonalNotes: z.boolean().default(true),
  includeProductivityStats: z.boolean().default(true),
  tone: z.enum(['professional', 'casual', 'motivational', 'reflective']).default('casual'),
  publishImmediately: z.boolean().default(false),
})

type BlogGenerationFormData = z.infer<typeof blogGenerationSchema>

interface BlogGenerationFormProps {
  summary: DailySummary
  onGenerate: (data: BlogGenerationFormData) => Promise<void>
  onCancel: () => void
  onPreview?: (data: BlogGenerationFormData) => void
}

export function BlogGenerationForm({ 
  summary, 
  onGenerate, 
  onCancel, 
  onPreview 
}: BlogGenerationFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BlogGenerationFormData>({
    resolver: zodResolver(blogGenerationSchema),
    defaultValues: {
      template: 'daily',
      includeTaskBreakdown: true,
      includePersonalNotes: true,
      includeProductivityStats: true,
      tone: 'casual',
      publishImmediately: false,
    }
  })

  const selectedTemplate = watch('template')
  const selectedTone = watch('tone')

  const handleFormSubmit = async (data: BlogGenerationFormData) => {
    setIsGenerating(true)
    try {
      await onGenerate(data)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      const data = {
        template: selectedTemplate,
        includeTaskBreakdown: watch('includeTaskBreakdown'),
        includePersonalNotes: watch('includePersonalNotes'),
        includeProductivityStats: watch('includeProductivityStats'),
        tone: selectedTone,
        publishImmediately: watch('publishImmediately'),
      }
      onPreview(data)
      setShowPreview(true)
    }
  }

  const templateOptions = [
    {
      value: 'daily',
      label: '每日总结',
      description: '详细的每日生产力洞察',
      icon: FileText,
      recommended: true
    },
    {
      value: 'weekly',
      label: '每周回顾',
      description: '全面的每周概览与趋势分析',
      icon: Calendar,
      recommended: false
    },
    {
      value: 'monthly',
      label: '每月回顾',
      description: '高层次的月度生产力分析',
      icon: BarChart3,
      recommended: false
    }
  ]

  const toneOptions = [
    {
      value: 'professional',
      label: '专业',
      description: '正式、商务化的语言风格',
      example: '"今天的指标表现出强劲的性能..."'
    },
    {
      value: 'casual',
      label: '轻松',
      description: '友好、对话式的语气',
      example: '"今天过得相当不错..."'
    },
    {
      value: 'motivational',
      label: '激励性',
      description: '鼓舞人心和积极的',
      example: '"今天又是向目标迈进一步的一天..."'
    },
    {
      value: 'reflective',
      label: '反思性',
      description: '深思熟虑和内省的',
      example: '"回顾今天，我学到了..."'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            生成博客文章
            <Badge variant="secondary" className="ml-2">
              {new Date(summary.summary_date).toLocaleDateString()}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                博客模板
              </label>
              <div className="grid gap-3">
                {templateOptions.map(option => {
                  const Icon = option.icon
                  return (
                    <label key={option.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        {...register('template')}
                        value={option.value}
                        className="sr-only"
                      />
                      <div className={`p-4 border rounded-lg transition-all ${
                        selectedTemplate === option.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${
                            selectedTemplate === option.value ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {option.recommended && (
                                <Badge variant="secondary" className="text-xs">
                                  推荐
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Content Options */}
            <div>
              <label className="block text-sm font-medium mb-3">
                内容板块
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="checkbox"
                    {...register('includeTaskBreakdown')}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">任务分解</div>
                    <div className="text-sm text-muted-foreground">
                      包含已完成、进行中和待办任务的详细列表
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="checkbox"
                    {...register('includePersonalNotes')}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">个人笔记</div>
                    <div className="text-sm text-muted-foreground">
                      包含您当天的个人反思和笔记
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="checkbox"
                    {...register('includeProductivityStats')}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">生产力统计</div>
                    <div className="text-sm text-muted-foreground">
                      包含完成率、生产力分数和时间跟踪数据
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                写作语气
              </label>
              <div className="grid gap-3">
                {toneOptions.map(option => (
                  <label key={option.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      {...register('tone')}
                      value={option.value}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg transition-all ${
                      selectedTone === option.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            示例：{option.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Publishing Options */}
            <div>
              <label className="block text-sm font-medium mb-3">
                发布选项
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                <input
                  type="checkbox"
                  {...register('publishImmediately')}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">立即发布</div>
                  <div className="text-sm text-muted-foreground">
                    生成后立即发布博客文章（否则保存为草稿）
                  </div>
                </div>
              </label>
            </div>

            {/* Summary Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">总结数据预览</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">任务：</span>
                  <span className="ml-2">{summary.completed_tasks}/{summary.total_tasks}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">完成率：</span>
                  <span className="ml-2">{Math.round(summary.completion_rate || 0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">生产力：</span>
                  <span className="ml-2">{Math.round(summary.productivity_score || 0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">成就：</span>
                  <span className="ml-2">{summary.achievements?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <div className="flex gap-2">
                {onPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    预览
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} type="button">
                  取消
                </Button>
                <Button 
                  type="submit" 
                  loading={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? '正在生成...' : '生成博客文章'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}