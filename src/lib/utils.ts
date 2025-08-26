import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }

  return formatDate(d)
}

export function createSlug(text: string): string {
  // 基础拼音映射表，用于中文转拼音
  const pinyinMap: Record<string, string> = {
    // 基础数字
    '0': 'ling', '1': 'yi', '2': 'er', '3': 'san', '4': 'si', '5': 'wu', '6': 'liu', '7': 'qi', '8': 'ba', '9': 'jiu',
    
    // 常用中文字符
    '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu', '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
    '中': 'zhong', '文': 'wen', '博': 'bo', '客': 'ke', '章': 'zhang',
    '日': 'ri', '常': 'chang', '计': 'ji', '划': 'hua', '任': 'ren', '务': 'wu', '管': 'guan', '理': 'li',
    '学': 'xue', '习': 'xi', '工': 'gong', '作': 'zuo', '生': 'sheng', '活': 'huo', '健': 'jian', '康': 'kang',
    '运': 'yun', '动': 'dong', '饮': 'yin', '食': 'shi', '休': 'xiu', '闲': 'xian', '娱': 'yu', '乐': 'le',
    '旅': 'lv', '游': 'you', '读': 'du', '书': 'shu', '写': 'xie', '创': 'chuang', '新': 'xin',
    '技': 'ji', '术': 'shu', '开': 'kai', '发': 'fa', '编': 'bian', '设': 'she',
    '项': 'xiang', '目': 'mu', '研': 'yan', '究': 'jiu', '测': 'ce', '试': 'shi', '部': 'bu', '署': 'shu',
    '维': 'wei', '护': 'hu', '优': 'you', '化': 'hua', '性': 'xing', '能': 'neng', '安': 'an', '全': 'quan',
    '经': 'jing', '验': 'yan', '教': 'jiao',
    '个': 'ge', '人': 'ren', '团': 'tuan', '队': 'dui', '协': 'xie', '通': 'tong',
    '会': 'hui', '议': 'yi', '报': 'bao', '告': 'gao', '展': 'zhan', '演': 'yan', '示': 'shi',
    '总': 'zong', '结': 'jie', '回': 'hui', '顾': 'gu', '望': 'wang', '未': 'wei', '来': 'lai',
    '挑': 'tiao', '战': 'zhan', '机': 'ji', '成': 'cheng', '功': 'gong', '失': 'shi', '败': 'bai',
    '帮': 'bang', '助': 'zhu', '支': 'zhi', '持': 'chi', '反': 'fan', '馈': 'kui', '建': 'jian',
    
    // 标点符号和特殊字符
    ' ': '-', ',': '-', '.': '-', '!': '-', '?': '-', ':': '-', ';': '-', '/': '-', '\\': '-', '|': '-', '_': '-',
    '~': '-', '*': '-', '+': '-', '=': '-', '@': '-', '#': '-', '$': '-', '%': '-', '^': '-', '&': '-', 
    '（': '-', '）': '-', '【': '-', '】': '-', '《': '-', '》': '-', '「': '-', '」': '-', '『': '-', '』': '-',
    '[': '-', ']': '-', '{': '-', '}': '-', '(': '-', ')': '-', '<': '-', '>': '-',
    '"': '-', '\'': '-', '`': '-', '“': '-', '”': '-', '‘': '-', '’': '-', '·': '-'
  }

  // 替换中文字符为拼音
  let slug = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    slug += pinyinMap[char] || char
  }

  // 转换为小写并清理特殊字符
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '')  // 只保留字母、数字和连字符
    .replace(/-+/g, '-')          // 将多个连字符合并为一个
    .replace(/^-|-$/g, '')        // 移除开头和结尾的连字符
    || 'post'                     // 如果结果为空，则使用默认值
}

export function truncateText(text: string, length: number = 150): string {
  if (text.length <= length) return text
  return text.slice(0, length).replace(/\s+\S*$/, '') + '...'
}

export function extractTextFromHtml(html: string): string {
  // Simple HTML tag removal - in production, you might want to use a proper HTML parser
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

export function generateExcerpt(content: string, length: number = 150): string {
  const plainText = extractTextFromHtml(content)
  return truncateText(plainText, length)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

export function randomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}