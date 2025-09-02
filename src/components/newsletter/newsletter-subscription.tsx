'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface NewsletterSubscriptionProps {
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function NewsletterSubscription({ className, variant = 'default' }: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const toastContext = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toastContext.addToast({
        title: '请输入邮箱地址',
        description: '邮箱地址不能为空',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || '订阅成功！请查看邮箱确认订阅。')
        setEmail('')
        setName('')
        
        toastContext.addToast({
          title: '订阅成功',
          description: '请查看邮箱确认订阅',
          variant: 'success'
        })
      } else {
        throw new Error(data.error || '订阅失败')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '订阅失败，请稍后重试')
      
      toastContext.addToast({
        title: '订阅失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="输入您的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isSubmitting || status === 'success'}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || status === 'success' || !email}
          className="whitespace-nowrap"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            '订阅'
          )}
        </Button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Mail className="h-4 w-4 text-gray-500" />
        <Input
          type="email"
          placeholder="订阅更新"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8"
          disabled={isSubmitting || status === 'success'}
        />
        <Button 
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || status === 'success' || !email}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            '订阅'
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          订阅博客更新
        </CardTitle>
        <CardDescription>
          获取最新的博客文章和网站更新，我们承诺不会发送垃圾邮件。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                姓名（可选）
              </label>
              <Input
                id="name"
                type="text"
                placeholder="您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || status === 'success'}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                邮箱地址 *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || status === 'success'}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>订阅类型：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>新文章通知</li>
              <li>每周精选摘要</li>
              <li>月度总结报告</li>
            </ul>
          </div>
          
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{message}</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || status === 'success' || !email}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                订阅中...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                已订阅
              </>
            ) : (
              '立即订阅'
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            订阅即表示您同意我们的隐私政策。您可以随时取消订阅。
          </p>
        </form>
      </CardContent>
    </Card>
  )
}