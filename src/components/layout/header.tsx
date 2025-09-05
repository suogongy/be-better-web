'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Home, BookOpen, Calendar, User, LogOut, Settings, BarChart3, Target, Heart, Download, Brain, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

const publicNavItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/blog', label: '博客', icon: BookOpen },
]

const authNavItems = [
  { href: '/blog', label: '博客', icon: BookOpen },
  { href: '/admin/dashboard', label: '系统管理', icon: Settings },
  { href: '/schedule', label: '日程安排', icon: Calendar },
  { href: '/automation', label: '自动化', icon: Zap },
  { href: '/summary', label: '总结报告', icon: BarChart3 },
  { href: '/habits', label: '习惯跟踪', icon: Target },
  { href: '/mood', label: '心情记录', icon: Heart },
  { href: '/insights', label: '数据洞察', icon: Brain },
  { href: '/export', label: '数据导出', icon: Download },
]

export function Header() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = publicNavItems

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      // Error is handled in the auth context
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-8xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 whitespace-nowrap flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-lg">BB</span>
              </div>
              <span className="font-bold text-2xl hidden sm:block text-foreground">
                Be Better Web
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground whitespace-nowrap',
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Theme Toggle */}
            <div className="flex items-center pl-3 border-l border-border">
              <ThemeToggleButton />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggleButton />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2',
                      isActive(item.href)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">主题</span>
                  <ThemeToggleButton />
                </div>
              </div>

              {user && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {user.user_metadata?.name || user.email}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      退出登录
                    </Button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}