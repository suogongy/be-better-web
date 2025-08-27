'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { commentService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send } from 'lucide-react'

const commentSchema = z.object({
  author_name: z.string().min(1, '姓名不能为空'),
  author_email: z.string().email('请输入有效的邮箱地址'),
  author_website: z.string().url('请输入有效的网址').optional().or(z.literal('')),
  content: z.string().min(1, '评论内容不能为空')
})

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentSubmitted?: () => void
  onCancel?: () => void
  placeholder?: string
  showTitle?: boolean
  className?: string
}

interface CommentFormData {
  author_name: string
  author_email: string
  author_website?: string
  content: string
}

export function CommentForm({ 
  postId, 
  parentId,
  onCommentSubmitted, 
  onCancel,
  placeholder = "请输入您的评论...",
  showTitle = false,
  className 
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const handleFormSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true)
    try {
      // 获取客户端信息用于垃圾评论检测
      const userAgent = navigator.userAgent
      const ipAddress = undefined // 客户端无法获取IP地址

      const commentData = {
        post_id: postId,
        parent_id: parentId,
        author_name: data.author_name,
        author_email: data.author_email,
        author_website: data.author_website || undefined,
        content: data.content,
        user_agent: userAgent,
        ip_address: ipAddress,
      }

      await commentService.createComment(commentData)

      addToast({
        title: '评论已提交',
        description: '您的评论已提交审核，审核通过后将显示。',
        variant: 'success',
      })

      reset()
      onCommentSubmitted?.()
    } catch (error) {
      console.error('提交评论失败:', error)
      addToast({
        title: '错误',
        description: '提交评论失败，请重试。',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {parentId ? '回复评论' : '发表评论'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 作者信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('author_name')}
                placeholder="您的姓名"
                className={errors.author_name ? 'border-red-500' : ''}
              />
              {errors.author_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('author_email')}
                type="email"
                placeholder="your@email.com"
                className={errors.author_email ? 'border-red-500' : ''}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                邮箱不会被公开
              </p>
              {errors.author_email && (
                <p className="mt-1 text-sm text-red-600">{errors.author_email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              网站 <span className="text-muted-foreground">（可选）</span>
            </label>
            <Input
              {...register('author_website')}
              type="url"
              placeholder="https://yourwebsite.com"
              className={errors.author_website ? 'border-red-500' : ''}
            />
            {errors.author_website && (
              <p className="mt-1 text-sm text-red-600">{errors.author_website.message}</p>
            )}
          </div>

          {/* 评论内容 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              评论 <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register('content')}
              placeholder={placeholder}
              rows={4}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* 评论指南 */}
          <div className="bg-muted rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">评论指南：</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 请保持尊重和建设性</li>
              <li>• 请保持话题相关性</li>
              <li>• 禁止垃圾信息、自我推广或攻击性内容</li>
              <li>• 评论需要经过审核，可能需要一些时间才会显示</li>
            </ul>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {parentId ? '发表回复' : '发表评论'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}