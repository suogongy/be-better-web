'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Home, BookOpen, Calendar, User, Settings, BarChart3, Target, Heart, Download, Brain, Zap, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

export function AdminHeader() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-8xl">
        <div className="flex h-20 items-center">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 whitespace-nowrap">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-xl">BB</span>
              </div>
              <span className="font-bold text-2xl hidden sm:block text-foreground">
                Be Better Web
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Fixed Center */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <nav className="flex items-center space-x-2">
                            <Link
                href="/admin/dashboard"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/admin/dashboard')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="hidden lg:inline">系统管理</span>
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/dashboard')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="hidden lg:inline">仪表板</span>
              </Link>
              <Link
                href="/blog"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/blog')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BookOpen className="h-5 w-5" />
                <span>博客</span>
              </Link>
              <Link
                href="/schedule"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/schedule')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="h-5 w-5" />
                <span className="hidden lg:inline">日程安排</span>
              </Link>
              <Link
                href="/automation"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/automation')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Zap className="h-5 w-5" />
                <span className="hidden lg:inline">自动化</span>
              </Link>
              <Link
                href="/summary"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/summary')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="hidden lg:inline">总结报告</span>
              </Link>
              <Link
                href="/habits"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/habits')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Target className="h-5 w-5" />
                <span className="hidden lg:inline">习惯跟踪</span>
              </Link>
              <Link
                href="/mood"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/mood')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Heart className="h-5 w-5" />
                <span className="hidden lg:inline">心情记录</span>
              </Link>
              <Link
                href="/insights"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/insights')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Brain className="h-5 w-5" />
                <span className="hidden lg:inline">数据洞察</span>
              </Link>
              <Link
                href="/export"
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                  isActive('/export')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Download className="h-5 w-5" />
                <span className="hidden lg:inline">数据导出</span>
              </Link>
            </nav>
          </div>

          {/* Theme Toggle */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <ThemeToggleButton className="h-10 w-10" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggleButton className="h-10 w-10" />
            <Button
              variant="ghost"
              size="default"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/dashboard')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>仪表板</span>
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/blog')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span>博客</span>
              </Link>
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/admin/dashboard')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Settings className="h-4 w-4" />
                <span>系统管理</span>
              </Link>
              <Link
                href="/schedule"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/schedule')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>日程安排</span>
              </Link>
              <Link
                href="/automation"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/automation')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Zap className="h-4 w-4" />
                <span>自动化</span>
              </Link>
              <Link
                href="/summary"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/summary')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <BarChart3 className="h-4 w-4" />
                <span>总结报告</span>
              </Link>
              <Link
                href="/habits"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/habits')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Target className="h-4 w-4" />
                <span>习惯跟踪</span>
              </Link>
              <Link
                href="/mood"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/mood')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Heart className="h-4 w-4" />
                <span>心情记录</span>
              </Link>
              <Link
                href="/insights"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/insights')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Brain className="h-4 w-4" />
                <span>数据洞察</span>
              </Link>
              <Link
                href="/export"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                  isActive('/export')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Download className="h-4 w-4" />
                <span>数据导出</span>
              </Link>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">主题</span>
                  <ThemeToggleButton />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}