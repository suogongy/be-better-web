'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-provider'
import { commentService } from '@/lib/supabase/database'
import { MessageCircle, Send } from 'lucide-react'

const commentSchema = z.object({
  author_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  author_email: z.string().email('Valid email required').max(255, 'Email too long'),
  author_website: z.string().url('Valid URL required').optional().or(z.literal('')),
  content: z.string().min(10, 'Comment must be at least 10 characters').max(2000, 'Comment too long'),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentSubmitted: () => void
  onCancel?: () => void
  placeholder?: string
  showTitle?: boolean
}

export function CommentForm({
  postId,
  parentId,
  onCommentSubmitted,
  onCancel,
  placeholder = 'Write your comment...',
  showTitle = true,
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
      // Get client information for spam detection
      const userAgent = navigator.userAgent
      const ipAddress = undefined // We don't have access to IP on client side

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
        title: 'Comment Submitted',
        description: 'Your comment has been submitted for review. It will appear after moderation.',
        variant: 'success',
      })

      reset()
      onCommentSubmitted()
    } catch (error) {
      console.error('Failed to submit comment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to submit comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-6">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {parentId ? 'Reply to Comment' : 'Leave a Comment'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Author Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('author_name')}
                placeholder="Your name"
                className={errors.author_name ? 'border-red-500' : ''}
              />
              {errors.author_name && (
                <p className="mt-1 text-sm text-red-600">{errors.author_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('author_email')}
                type="email"
                placeholder="your@email.com"
                className={errors.author_email ? 'border-red-500' : ''}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Email will not be published
              </p>
              {errors.author_email && (
                <p className="mt-1 text-sm text-red-600">{errors.author_email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Website <span className="text-muted-foreground">(optional)</span>
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

          {/* Comment Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Comment <span className="text-red-500">*</span>
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

          {/* Guidelines */}
          <div className="bg-muted rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Comment Guidelines:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Be respectful and constructive</li>
              <li>• Stay on topic</li>
              <li>• No spam, self-promotion, or offensive content</li>
              <li>• Comments are moderated and may take time to appear</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {parentId ? 'Post Reply' : 'Post Comment'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}