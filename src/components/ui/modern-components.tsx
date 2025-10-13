'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// 现代化的加载组件
export function ModernLoader({ size = 'md', text = '加载中...' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn(
        "animate-spin rounded-full border-4 border-blue-200 border-t-blue-600",
        sizeClasses[size]
      )}></div>
      <p className="text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  )
}

// 现代化的按钮组件
export function ModernButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus-ring'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed transform-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// 现代化的卡片组件
export function ModernCard({
  children,
  className,
  hover = true,
  glass = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
  glass?: boolean
}) {
  const baseClasses = 'rounded-2xl border transition-all duration-300'

  const variantClasses = {
    base: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg',
    hover: 'hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1',
    glass: 'bg-white/60 backdrop-blur-lg dark:bg-gray-800/60 border-white/20 dark:border-gray-700/20'
  }

  return (
    <div
      className={cn(
        baseClasses,
        glass ? variantClasses.glass : variantClasses.base,
        hover && variantClasses.hover,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 现代化的输入框组件
export function ModernInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        'focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
}

// 现代化的徽章组件
export function ModernBadge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors'

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// 现代化的分隔线组件
export function ModernDivider({
  className,
  label,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  label?: string
}) {
  return (
    <div className={cn('flex items-center gap-4 my-8', className)} {...props}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400 px-3">{label}</span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
    </div>
  )
}

// 现代化的容器组件
export function ModernContainer({
  children,
  size = 'lg',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}) {
  const sizeClasses = {
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div
      className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 现代化的网格布局组件
export function ModernGrid({
  children,
  cols = 1,
  gap = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4
  gap?: 2 | 4 | 6 | 8
}) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div
      className={cn(
        'grid',
        colsClasses[cols],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 现代化的渐变背景组件
export function GradientBackground({
  children,
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'subtle' | 'vibrant' | 'dark'
}) {
  const variantClasses = {
    default: 'bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20',
    subtle: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
    vibrant: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20',
    dark: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
  }

  return (
    <div
      className={cn(
        'min-h-screen',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 现代化的空状态组件
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'text-center py-16 px-8',
        className
      )}
      {...props}
    >
      {icon && <div className="flex justify-center mb-6">{icon}</div>}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}