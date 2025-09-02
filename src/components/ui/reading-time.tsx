'use client'

import { Clock, FileText, Image, Code } from 'lucide-react'
import { calculateReadingTime, formatReadingTime, getReadingTimeDetails } from '@/lib/utils/reading-time'
import { cn } from '@/lib/utils'

interface ReadingTimeProps {
  content: string
  isHTML?: boolean
  variant?: 'simple' | 'detailed' | 'card'
  className?: string
  showWordCount?: boolean
  showBreakdown?: boolean
}

export function ReadingTime({
  content,
  isHTML = false,
  variant = 'simple',
  className,
  showWordCount = false,
  showBreakdown = false
}: ReadingTimeProps) {
  const readingTime = calculateReadingTime(content, {}, isHTML)
  const details = getReadingTimeDetails(readingTime)

  if (variant === 'simple') {
    return (
      <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
        <Clock className="h-3 w-3" />
        <span>{details.short}</span>
        {showWordCount && (
          <>
            <span>·</span>
            <span>{readingTime.wordCount}字</span>
          </>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-1 text-sm', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{details.medium}</span>
        </div>
        {showBreakdown && (
          <div className="space-y-1 text-xs text-muted-foreground pl-6">
            {readingTime.imageCount > 0 && (
              <div className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                <span>{readingTime.imageCount} 张图片</span>
              </div>
            )}
            {readingTime.codeBlockCount > 0 && (
              <div className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                <span>{readingTime.codeBlockCount} 个代码块</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{readingTime.wordCount} 字</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-muted/50 rounded-lg p-3 space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">阅读时间</span>
          </div>
          <span className="text-lg font-semibold">{readingTime.minutes}分钟</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium">{readingTime.wordCount}</div>
            <div className="text-muted-foreground">字数</div>
          </div>
          {readingTime.imageCount > 0 && (
            <div className="text-center">
              <div className="font-medium">{readingTime.imageCount}</div>
              <div className="text-muted-foreground">图片</div>
            </div>
          )}
          {readingTime.codeBlockCount > 0 && (
            <div className="text-center">
              <div className="font-medium">{readingTime.codeBlockCount}</div>
              <div className="text-muted-foreground">代码</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}