'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  Clock,
  Bell,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutomationRule {
  id: string
  name: string
  description?: string
  is_enabled: boolean
  priority: number
  trigger_type: string
  trigger_config: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  last_triggered_at?: string
  execution_count: number
  created_at: string
  updated_at: string
}

const triggerTypeLabels: Record<string, string> = {
  'task_status_change': '任务状态变更',
  'daily_summary': '每日总结',
  'task_due_soon': '任务即将到期',
  'task_overdue': '任务已逾期',
  'time_based': '定时触发',
}

const actionTypeLabels: Record<string, string> = {
  'send_notification': '发送通知',
  'create_follow_up_task': '创建后续任务',
  'update_task_priority': '更新任务优先级',
  'move_task_to_category': '移动任务分类',
  'generate_daily_summary': '生成每日总结',
  'create_blog_draft': '创建博客草稿',
  'send_email': '发送邮件',
}

export default function AutomationPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  // 加载自动化规则
  const loadRules = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/automation/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules)
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载自动化规则失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadRules()
    }
  }, [user])

  // 创建规则
  const handleCreateRule = async (ruleData: any) => {
    try {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      })

      if (response.ok) {
        addToast({
          title: '成功',
          description: '自动化规则创建成功',
          variant: 'success',
        })
        setShowCreateForm(false)
        loadRules()
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建自动化规则失败',
        variant: 'destructive',
      })
    }
  }

  // 更新规则状态
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (response.ok) {
        loadRules()
        addToast({
          title: '成功',
          description: enabled ? '规则已启用' : '规则已禁用',
          variant: 'success',
        })
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '更新规则状态失败',
        variant: 'destructive',
      })
    }
  }

  // 删除规则
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这个自动化规则吗？')) return

    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          title: '成功',
          description: '自动化规则已删除',
          variant: 'success',
        })
        loadRules()
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '删除自动化规则失败',
        variant: 'destructive',
      })
    }
  }

  // 手动执行规则
  const handleExecuteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/automation/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      })

      if (response.ok) {
        addToast({
          title: '成功',
          description: '规则执行成功',
          variant: 'success',
        })
      }
    } catch (error) {
      addToast({
        title: '错误',
        description: '执行规则失败',
        variant: 'destructive',
      })
    }
  }

  // 渲染触发器配置
  const renderTriggerConfig = (type: string, config: Record<string, any>) => {
    switch (type) {
      case 'task_status_change':
        return (
          <div className="text-sm space-y-1">
            {config.from_status && (
              <div>从: <Badge variant="outline">{config.from_status}</Badge></div>
            )}
            {config.to_status && (
              <div>到: <Badge variant="outline">{config.to_status}</Badge></div>
            )}
            {config.category && (
              <div>分类: {config.category}</div>
            )}
          </div>
        )
      
      case 'time_based':
        return (
          <div className="text-sm space-y-1">
            {config.time && <div>时间: {config.time}</div>}
            {config.weekdays && (
              <div>
                星期: {config.weekdays.map((d: number) => `周${d}`).join(', ')}
              </div>
            )}
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500">复杂配置</div>
    }
  }

  // 渲染动作配置
  const renderActionConfig = (type: string, config: Record<string, any>) => {
    switch (type) {
      case 'send_notification':
        return (
          <div className="text-sm">
            <div className="font-medium">{config.title || '通知'}</div>
            <div className="text-gray-600 truncate">{config.message}</div>
          </div>
        )
      
      case 'create_follow_up_task':
        return (
          <div className="text-sm">
            <div className="font-medium">{config.title || '后续任务'}</div>
            <div className="text-gray-600">
              {config.due_in_days || 1}天后
            </div>
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500">复杂配置</div>
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">请先登录</h1>
            <p className="text-muted-foreground mb-4">
              您需要登录才能使用自动化功能。
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8" />
            自动化规则
          </h1>
          <p className="text-muted-foreground mt-1">
            设置自动化规则，让系统为您处理重复性任务
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建规则
        </Button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">暂无自动化规则</h3>
            <p className="text-gray-500 mb-4">
              创建您的第一个自动化规则，让工作更高效
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              创建规则
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={cn(
              "transition-all",
              !rule.is_enabled && "opacity-60"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <Badge variant={rule.is_enabled ? "default" : "secondary"}>
                        {rule.is_enabled ? "启用" : "禁用"}
                      </Badge>
                      {rule.last_triggered_at && (
                        <Badge variant="outline" className="text-xs">
                          最后执行: {new Date(rule.last_triggered_at).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    
                    {rule.description && (
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Trigger */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-sm">触发条件</span>
                        </div>
                        <div className="ml-6">
                          <div className="text-sm font-medium mb-1">
                            {triggerTypeLabels[rule.trigger_type] || rule.trigger_type}
                          </div>
                          {renderTriggerConfig(rule.trigger_type, rule.trigger_config)}
                        </div>
                      </div>

                      {/* Action */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">执行动作</span>
                        </div>
                        <div className="ml-6">
                          <div className="text-sm font-medium mb-1">
                            {actionTypeLabels[rule.action_type] || rule.action_type}
                          </div>
                          {renderActionConfig(rule.action_type, rule.action_config)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>执行次数: {rule.execution_count}</span>
                      <span>优先级: {rule.priority}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExecuteRule(rule.id)}
                      disabled={!rule.is_enabled}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      {(showCreateForm || editingRule) && (
        <AutomationRuleForm
          rule={editingRule}
          onSubmit={async (data) => {
            if (editingRule) {
              // Update logic
            } else {
              handleCreateRule(data)
            }
          }}
          onCancel={() => {
            setShowCreateForm(false)
            setEditingRule(null)
          }}
        />
      )}
    </div>
  )
}

// 自动化规则表单组件
function AutomationRuleForm({
  rule,
  onSubmit,
  onCancel,
}: {
  rule?: AutomationRule | null
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || 'task_status_change',
    trigger_config: rule?.trigger_config || {},
    action_type: rule?.action_type || 'send_notification',
    action_config: rule?.action_config || {},
    priority: rule?.priority || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? '编辑自动化规则' : '创建自动化规则'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              规则名称 *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入规则名称..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              描述
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="规则描述..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Trigger */}
            <div>
              <label className="block text-sm font-medium mb-2">
                触发条件 *
              </label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  trigger_type: e.target.value,
                  trigger_config: {}
                })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="task_status_change">任务状态变更</option>
                <option value="daily_summary">每日总结</option>
                <option value="task_due_soon">任务即将到期</option>
                <option value="task_overdue">任务已逾期</option>
                <option value="time_based">定时触发</option>
              </select>
              
              {/* Trigger config would go here based on type */}
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                触发条件配置将根据选择的类型动态显示
              </div>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium mb-2">
                执行动作 *
              </label>
              <select
                value={formData.action_type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  action_type: e.target.value,
                  action_config: {}
                })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="send_notification">发送通知</option>
                <option value="create_follow_up_task">创建后续任务</option>
                <option value="update_task_priority">更新任务优先级</option>
                <option value="move_task_to_category">移动任务分类</option>
                <option value="generate_daily_summary">生成每日总结</option>
                <option value="create_blog_draft">创建博客草稿</option>
                <option value="send_email">发送邮件</option>
              </select>
              
              {/* Action config would go here based on type */}
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                动作配置将根据选择的类型动态显示
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              优先级
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.priority}
              onChange={(e) => setFormData({ 
                ...formData, 
                priority: parseInt(e.target.value) || 0 
              })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">
              {rule ? '更新规则' : '创建规则'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}