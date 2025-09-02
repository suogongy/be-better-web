'use client'

import React from 'react'

interface MDXContentProps {
  content: string
}

export function MDXContent({ content }: MDXContentProps) {
  // 改进的Markdown渲染实现
  const renderMarkdown = (markdown: string) => {
    // 首先分割成行
    const lines = markdown.split('\n')
    const result: string[] = []
    let i = 0
    
    while (i < lines.length) {
      const line = lines[i]
      
      // 处理标题
      if (line.startsWith('# ')) {
        result.push(`<h1 class="text-3xl font-bold my-4">${line.substring(2)}</h1>`)
      } else if (line.startsWith('## ')) {
        result.push(`<h2 class="text-2xl font-bold my-3">${line.substring(3)}</h2>`)
      } else if (line.startsWith('### ')) {
        result.push(`<h3 class="text-xl font-bold my-2">${line.substring(4)}</h3>`)
      }
      // 处理无序列表
      else if (line.startsWith('- ')) {
        const listItems: string[] = []
        while (i < lines.length && lines[i].startsWith('- ')) {
          const itemText = lines[i].substring(2)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
          listItems.push(`<li class="my-1">${itemText}</li>`)
          i++
        }
        result.push(`<ul class="list-disc list-inside my-2">${listItems.join('')}</ul>`)
        continue
      }
      // 处理空行（段落分隔）
      else if (line.trim() === '') {
        // 如果下一个非空行不是标题或列表，则添加段落分隔
        if (i + 1 < lines.length && 
            lines[i + 1].trim() !== '' && 
            !lines[i + 1].startsWith('#') && 
            !lines[i + 1].startsWith('- ')) {
          result.push('</p><p class="my-4">')
        }
      }
      // 处理普通文本
      else {
        // 处理段落内的文本格式
        let processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
          .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
        
        result.push(processedLine)
      }
      
      i++
    }
    
    // 将所有内容包装在段落标签中
    const finalContent = result.join('\n')
    
    // 处理段落 - 将连续的非空行包装在段落中
    let processedContent = finalContent
      .replace(/^(?!<[h|u])/gm, '<p class="my-4">')
      .replace(/<p class="my-4">\s*<\/p>/g, '')
      .replace(/(<\/p>)\s*(?!<[h|u])/g, '$1<p class="my-4">')
      .replace(/(<h[1-6][^>]*>.*?<\/h[1-6]>)\s*<p class="my-4">/g, '$1')
      .replace(/<\/p>\s*(<h[1-6][^>]*>.*?<\/h[1-6]>)/g, '$1')
      .replace(/(<ul[^>]*>.*?<\/ul>)\s*<p class="my-4">/g, '$1')
      .replace(/<\/p>\s*(<ul[^>]*>.*?<\/ul>)/g, '$1')
    
    // 确保所有段落都有正确的开始和结束标签
    const lines2 = processedContent.split('\n')
    const finalLines: string[] = []
    let inParagraph = false
    
    for (const line of lines2) {
      if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.trim() === '') {
        if (inParagraph) {
          finalLines.push('</p>')
          inParagraph = false
        }
        finalLines.push(line)
      } else if (!line.startsWith('<p')) {
        if (!inParagraph) {
          finalLines.push('<p class="my-4">')
          inParagraph = true
        }
        finalLines.push(line)
      } else {
        finalLines.push(line)
      }
    }
    
    if (inParagraph) {
      finalLines.push('</p>')
    }
    
    return finalLines.join('\n')
  }

  return (
    <div 
      className="prose prose-lg dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}