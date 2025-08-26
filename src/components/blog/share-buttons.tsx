'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Copy } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  url?: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  
  // 获取当前页面URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : url || ''
  
  // 复制链接功能
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl)
      } else {
        // 回退方案
        const textArea = document.createElement('textarea')
        textArea.value = currentUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }
  
  // 原生分享功能
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `查看这篇文章: ${title}`,
          url: currentUrl
        })
      } catch (error) {
        console.error('分享失败:', error)
        // 回退到复制链接
        handleCopyLink()
      }
    } else {
      // 不支持原生分享，直接复制链接
      handleCopyLink()
    }
  }
  
  // Twitter分享
  const handleTwitterShare = () => {
    const text = encodeURIComponent(title)
    const tweetUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
  }
  
  // LinkedIn分享
  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer')
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        分享
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            已复制
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            复制链接
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="flex items-center gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Twitter
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="flex items-center gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn
      </Button>
    </div>
  )
}