'use client'

import { Button } from '@/components/ui/button'
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link as LinkIcon,
  Copy
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface ShareButtonsProps {
  title: string
  url?: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const toastContext = useToast()
  const shareUrl = url || typeof window !== 'undefined' ? window.location.href : ''

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
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={copyToClipboard}>
        <Copy className="h-4 w-4 mr-2" />
        复制链接
      </Button>
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
    </div>
  )
}