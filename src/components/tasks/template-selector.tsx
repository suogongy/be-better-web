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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  X, 
  Plus, 
  Calendar, 
  Clock, 
  Copy, 
  Eye, 
  Filter,
  Search,
  LayoutTemplate,
  FileText,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 模板表单验证
const templateSchema = z.object({
  name: z.string().min(1, '模板名称是必填的').max(100, '名称过长'),
  description: z.string().optional(),
  category: z.string().min(1, '请选择分类'),
  tasks: z.array(z.object({
    title: z.string().min(1, '任务标题是必填的'),
    description: z.string().optional(),
    category: z.string().min(1, '请选择分类'),
    priority: z.enum(['low', 'medium', 'high']),
    estimated_minutes: z.number().min(1, '预估时间必须大于0').optional(),
    is_required: z.boolean().default(true),
  })).min(1, '至少需要一个任务'),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TaskTemplate {
  id: string
  name: string
  description?: string
  category: string
  is_system: boolean
  is_shared: boolean
  task_data: {
    tasks: Array<{
      title: string
      description?: string
      category: string
      priority: 'low' | 'medium' | 'high'
      estimated_minutes?: number
    }>
    metadata?: {
      estimatedTotalTime: number
      priorityDistribution: Record<string, number>
      categoryDistribution: Record<string, number>
    }
  }
  usage_count: number
  created_at: string
}

interface TemplateSelectorProps {
  onApplyTemplate: (templateId: string, options?: {
    startDate?: Date
    offsetDays?: number
    customizations?: Record<string, any>
  }) => void
  onCreateTemplate?: (templateData: TemplateFormData) => void
  onPreviewTemplate?: (templateId: string, previewDate: Date) => void
}

export function TemplateSelector({ 
  onApplyTemplate, 
  onCreateTemplate,
  onPreviewTemplate 
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [previewDate, setPreviewDate] = useState(new Date())
  const [previewTasks, setPreviewTasks] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 获取模板列表
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // 获取当前用户的认证token
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token available')
        return
      }

      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        console.error('Failed to fetch templates:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // 筛选模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 获取所有分类
  const categories = [...new Set(templates.map(t => t.category))]

  // 应用模板
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    try {
      // 不再在这里调用API，而是通过回调函数让父组件处理
      // 这样可以避免重复调用API
      if (onApplyTemplate) {
        onApplyTemplate(selectedTemplate.id, { 
          startDate: previewDate
        })
      }
      
      // 关闭对话框并重置状态
      setIsOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  // 预览模板
  const handlePreviewTemplate = async (template: TaskTemplate) => {
    try {
      // 获取当前用户的认证token
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token available')
        return
      }

      const response = await fetch(`/api/templates/${template.id}/preview?date=${previewDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPreviewTasks(data.previewTasks)
        setShowPreview(true)
      } else {
        console.error('Failed to preview template:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to preview template:', error)
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            使用模板
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              任务模板
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-[calc(90vh-120px)]">
            {/* 左侧：模板列表 */}
            <div className="w-1/2 border-r p-4 overflow-y-auto">
              {/* 搜索和筛选 */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索模板..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedCategory === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('')}
                  >
                    全部
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 模板列表 */}
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    加载中...
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    没有找到匹配的模板
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTemplate?.id === template.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{template.name}</h3>
                              {template.is_system && (
                                <Badge variant="secondary" className="text-xs">
                                  系统
                                </Badge>
                              )}
                              {template.is_shared && (
                                <Badge variant="outline" className="text-xs">
                                  共享
                                </Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{template.task_data.tasks.length} 个任务</span>
                              <span>{template.category}</span>
                              <span>使用 {template.usage_count} 次</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePreviewTemplate(template)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* 右侧：模板详情和操作 */}
            <div className="w-1/2 p-4 overflow-y-auto">
              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* 模板信息 */}
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{selectedTemplate.name}</h2>
                    {selectedTemplate.description && (
                      <p className="text-gray-600 mb-3">{selectedTemplate.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Badge>{selectedTemplate.category}</Badge>
                      {selectedTemplate.task_data.metadata?.estimatedTotalTime && (
                        <Badge variant="outline">
                          预计 {selectedTemplate.task_data.metadata.estimatedTotalTime} 分钟
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 任务列表 */}
                  <div>
                    <h3 className="font-medium mb-3">包含的任务</h3>
                    <div className="space-y-2">
                      {selectedTemplate.task_data.tasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-gray-500">{task.description}</div>
                            )}
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </Badge>
                          {task.estimated_minutes && (
                            <div className="text-xs text-gray-500">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {task.estimated_minutes}分钟
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 应用设置 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">应用设置</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          开始日期
                        </label>
                        <Input
                          type="date"
                          value={previewDate.toISOString().split('T')[0]}
                          onChange={(e) => setPreviewDate(new Date(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleApplyTemplate} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      应用模板
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(null)
                        setShowCreateForm(true)
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制并编辑
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <LayoutTemplate className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>选择一个模板查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>模板预览</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              预览日期：{previewDate.toLocaleDateString('zh-CN')}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {previewTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded">
                  <span className="text-sm text-gray-500">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500">{task.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      截止：{new Date(task.due_date).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建模板表单 - 可以另外实现 */}
      {showCreateForm && (
        <CreateTemplateForm
          initialData={selectedTemplate ? {
            name: `${selectedTemplate.name} (副本)`,
            description: selectedTemplate.description,
            category: selectedTemplate.category,
            tasks: selectedTemplate.task_data.tasks,
          } : undefined}
          onSubmit={(data) => {
            onCreateTemplate?.(data)
            setShowCreateForm(false)
            setSelectedTemplate(null)
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </>
  )
}

// 创建模板表单组件
function CreateTemplateForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: {
  initialData?: Partial<TemplateFormData>
  onSubmit: (data: TemplateFormData) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      tasks: [{ title: '', category: 'general', priority: 'medium', is_required: true }],
    },
  })

  const watchedTasks = watch('tasks')

  const addTask = () => {
    const tasks = watchedTasks || []
    setValue('tasks', [...tasks, { title: '', category: 'general', priority: 'medium', is_required: true }])
  }

  const removeTask = (index: number) => {
    const tasks = watchedTasks || []
    setValue('tasks', tasks.filter((_, i) => i !== index))
  }

  const handleFormSubmit = (data: TemplateFormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? '复制模板' : '创建新模板'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              模板名称 *
            </label>
            <Input {...register('name')} placeholder="输入模板名称..." />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              描述
            </label>
            <Textarea {...register('description')} placeholder="模板描述..." rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              分类 *
            </label>
            <Input {...register('category')} placeholder="模板分类..." />
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                任务列表 *
              </label>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4 mr-1" />
                添加任务
              </Button>
            </div>
            
            <div className="space-y-3">
              {watchedTasks?.map((task, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Input
                            {...register(`tasks.${index}.title`)}
                            placeholder="任务标题..."
                          />
                          {errors.tasks?.[index]?.title && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.tasks[index]?.title?.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <select
                              {...register(`tasks.${index}.category`)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="general">通用</option>
                              <option value="work">工作</option>
                              <option value="personal">个人</option>
                              <option value="health">健康</option>
                              <option value="learning">学习</option>
                            </select>
                          </div>
                          
                          <div>
                            <select
                              {...register(`tasks.${index}.priority`)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="low">低优先级</option>
                              <option value="medium">中优先级</option>
                              <option value="high">高优先级</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <Input
                            {...register(`tasks.${index}.estimated_minutes`, { valueAsNumber: true })}
                            type="number"
                            placeholder="预估时间（分钟）"
                            min="1"
                          />
                        </div>
                      </div>
                      
                      {watchedTasks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">
              {initialData ? '创建副本' : '创建模板'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}