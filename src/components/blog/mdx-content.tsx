'use client'

import React from 'react'

interface MDXContentProps {
  content: string
}

export function MDXContent({ content }: MDXContentProps) {
  // 简单的Markdown渲染实现
  const renderMarkdown = (markdown: string) => {
    // 将换行符转换为<br>标签
    let processedContent = markdown.replace(/\n/g, '<br>')
    
    // 简单的粗体文本处理
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // 简单的斜体文本处理
    processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 简单的链接处理
    processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    
    // 简单的标题处理 (h1-h3)
    processedContent = processedContent.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold my-2">$1</h3>')
    processedContent = processedContent.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold my-3">$1</h2>')
    processedContent = processedContent.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4">$1</h1>')
    
    return processedContent
  }

  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}