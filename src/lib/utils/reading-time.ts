/**
 * 阅读时间估算工具
 * 基于中文阅读速度：平均 300-500 字/分钟
 */

interface ReadingTimeOptions {
  wordsPerMinute?: number
  includeImages?: boolean
  imageTime?: number // 每张图片额外增加的阅读时间（秒）
  codeTimeMultiplier?: number // 代码块的阅读时间倍数
}

const DEFAULT_OPTIONS: Required<ReadingTimeOptions> = {
  wordsPerMinute: 400, // 中文平均阅读速度
  includeImages: true,
  imageTime: 12, // 每张图片额外增加12秒
  codeTimeMultiplier: 2, // 代码块需要2倍时间阅读
}

/**
 * 从 HTML 内容中提取纯文本并计算字数
 */
function extractTextFromHTML(html: string): string {
  // 创建一个临时的 DOM 元素
  const div = document.createElement('div')
  div.innerHTML = html
  
  // 移除不需要计数的元素
  const elementsToRemove = div.querySelectorAll('script, style, noscript, iframe, .no-reading-time')
  elementsToRemove.forEach(el => el.remove())
  
  // 获取文本内容
  return div.textContent || div.innerText || ''
}

/**
 * 计算图片数量
 */
function countImages(html: string): number {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.querySelectorAll('img').length
}

/**
 * 计算代码块数量
 */
function countCodeBlocks(html: string): number {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.querySelectorAll('pre, code').length
}

/**
 * 移除 Markdown 语法标记
 */
function stripMarkdown(markdown: string): string {
  return markdown
    // 移除标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体和斜体
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // 移除列表标记
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 移除引用
    .replace(/^>\s+/gm, '')
    // 移除水平线
    .replace(/^[-*_]{3,}$/gm, '')
    // 移除多余的空行
    .replace(/\n{3,}/g, '\n\n')
}

/**
 * 计算阅读时间
 */
export function calculateReadingTime(
  content: string,
  options: ReadingTimeOptions = {},
  isHTML: boolean = false
): {
  minutes: number
  seconds: number
  text: string
  wordCount: number
  imageCount: number
  codeBlockCount: number
} {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  // 提取纯文本
  let plainText: string
  if (isHTML) {
    plainText = extractTextFromHTML(content)
  } else {
    plainText = stripMarkdown(content)
  }
  
  // 计算中文字数（包括英文字符）
  const wordCount = plainText.length
  
  // 计算基础阅读时间（秒）
  let readingTimeSeconds = (wordCount / config.wordsPerMinute) * 60
  
  // 计算图片数量并添加额外时间
  const imageCount = config.includeImages ? countImages(content) : 0
  readingTimeSeconds += imageCount * config.imageTime
  
  // 计算代码块数量并添加额外时间
  const codeBlockCount = countCodeBlocks(content)
  readingTimeSeconds += (codeBlockCount * wordCount / config.wordsPerMinute * 60) * (config.codeTimeMultiplier - 1)
  
  const minutes = Math.ceil(readingTimeSeconds / 60)
  const seconds = Math.ceil(readingTimeSeconds % 60)
  
  // 生成友好的时间文本
  let text = ''
  if (minutes < 1) {
    text = '少于1分钟'
  } else if (minutes === 1) {
    text = '约1分钟'
  } else {
    text = `约${minutes}分钟`
  }
  
  return {
    minutes,
    seconds,
    text,
    wordCount,
    imageCount,
    codeBlockCount
  }
}

/**
 * 格式化阅读时间显示
 */
export function formatReadingTime(readingTime: ReturnType<typeof calculateReadingTime>): string {
  const { minutes, seconds, wordCount } = readingTime
  
  if (minutes < 1) {
    return `少于1分钟 · ${wordCount}字`
  } else if (minutes === 1) {
    return `1分钟 · ${wordCount}字`
  } else {
    return `${minutes}分钟 · ${wordCount}字`
  }
}

/**
 * 获取阅读时间的详细描述
 */
export function getReadingTimeDetails(readingTime: ReturnType<typeof calculateReadingTime>): {
  short: string
  medium: string
  detailed: string
} {
  const { minutes, seconds, wordCount, imageCount, codeBlockCount } = readingTime
  
  const short = formatReadingTime(readingTime)
  
  const medium = `阅读时间：${short}`
  
  let details = [`预计阅读时间：${short}`]
  if (imageCount > 0) {
    details.push(`包含 ${imageCount} 张图片`)
  }
  if (codeBlockCount > 0) {
    details.push(`包含 ${codeBlockCount} 个代码块`)
  }
  details.push(`共计 ${wordCount} 字`)
  
  return {
    short,
    medium,
    detailed: details.join('，')
  }
}