'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Mail } from 'lucide-react'

export function NewsletterSubscription() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('请输入邮箱地址')
      return
    }
    
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // 这里可以集成邮件订阅服务
      // 暂时模拟一个成功的订阅
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSubscribed(true)
      setEmail('')
    } catch (error) {
      setError('订阅失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isSubscribed) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600">
        <Check className="h-5 w-5" />
        <span>订阅成功！感谢您的关注。</span>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="输入您的邮箱地址"
            className={error ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              订阅中...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              订阅
            </>
          )}
        </Button>
      </div>
    </form>
  )
}