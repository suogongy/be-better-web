'use client'

import { Button } from '@/components/ui/button'
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Send,
  Link as LinkIcon,
  Copy,
  Share2,
  Bookmark
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { useState } from 'react'

interface ShareButtonsProps {
  title: string
  url?: string
  description?: string
  tags?: string[]
  className?: string
}

export function ShareButtons({ 
  title, 
  url, 
  description = '', 
  tags = [],
  className 
}: ShareButtonsProps) {
  const toastContext = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toastContext.addToast({
        title: '链接已复制',
        description: '博客链接已复制到剪贴板',
        variant: 'success'
      })
    } catch (err) {
      toastContext.addToast({
        title: '复制失败',
        description: '无法复制链接到剪贴板',
        variant: 'destructive'
      })
    }
  }

  // Web Share API 支持
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true)
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toastContext.addToast({
            title: '分享失败',
            description: '无法分享此内容',
            variant: 'destructive'
          })
        }
      } finally {
        setIsSharing(false)
      }
    } else {
      // 回退到复制链接
      copyToClipboard()
    }
  }

  // 微信分享（显示二维码）
  const shareToWeChat = () => {
    toastContext.addToast({
      title: '微信分享',
      description: '请使用微信扫描二维码分享',
      variant: 'default'
    })
  }

  // 微博分享
  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
    window.open(weiboUrl, '_blank')
  }

  // Telegram 分享
  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title + '\n\n' + description)}`
    window.open(telegramUrl, '_blank')
  }

  // WhatsApp 分享
  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + '\n' + shareUrl)}`
    window.open(whatsappUrl, '_blank')
  }

  // 邮件分享
  const shareViaEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + shareUrl)}`
    window.location.href = emailUrl
  }

  
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, '_blank')
  }

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(linkedinUrl, '_blank')
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Web Share API 按钮（优先显示） */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <Button variant="default" size="sm" onClick={nativeShare} disabled={isSharing}>
          <Share2 className="h-4 w-4 mr-2" />
          {isSharing ? '分享中...' : '分享'}
        </Button>
      )}
      
      {/* 复制链接 */}
      <Button variant="outline" size="sm" onClick={copyToClipboard}>
        <Copy className="h-4 w-4 mr-2" />
        复制链接
      </Button>
      
      {/* 国外平台 */}
      <Button variant="outline" size="sm" onClick={shareToFacebook}>
        <Facebook className="h-4 w-4 mr-2" />
        Facebook
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToTwitter}>
        <Twitter className="h-4 w-4 mr-2" />
        Twitter
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToLinkedIn}>
        <Linkedin className="h-4 w-4 mr-2" />
        LinkedIn
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToWhatsApp}>
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToTelegram}>
        <Send className="h-4 w-4 mr-2" />
        Telegram
      </Button>
      
      {/* 国内平台 */}
      <Button variant="outline" size="sm" onClick={shareToWeChat}>
        <MessageCircle className="h-4 w-4 mr-2" />
        微信
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToWeibo}>
        <MessageCircle className="h-4 w-4 mr-2" />
        微博
      </Button>
      
      {/* 其他分享方式 */}
      <Button variant="outline" size="sm" onClick={shareViaEmail}>
        <LinkIcon className="h-4 w-4 mr-2" />
        邮件
      </Button>
      
          </div>
  )
}