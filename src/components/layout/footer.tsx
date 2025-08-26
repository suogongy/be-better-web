'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

const socialLinks = [
  { href: '#', icon: Github, label: 'GitHub' },
  { href: '#', icon: Twitter, label: 'Twitter' },
  { href: '#', icon: Linkedin, label: 'LinkedIn' },
  { href: 'mailto:contact@bebetter.web', icon: Mail, label: 'Email' },
]

const footerLinks = {
  '产品': [
    { href: '/blog', label: '博客' },
    { href: '/schedule', label: '日程安排' },
    { href: '/features', label: '功能特色' },
  ],
  '公司': [
    { href: '/about', label: '关于我们' },
    { href: '/contact', label: '联系我们' },
    { href: '/privacy', label: '隐私政策' },
    { href: '/terms', label: '服务条款' },
  ],
  '资源': [
    { href: '/docs', label: '文档' },
    { href: '/help', label: '帮助中心' },
    { href: '/api', label: 'API' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BB</span>
              </div>
              <span className="font-bold text-xl">Be Better Web</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              您的个人博客和生产力管理平台。
              跟踪您的进步，分享您的旅程，每天都变得更好。
            </p>
            <div className="flex space-x-2 mt-6">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Button
                    key={link.label}
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={link.href} aria-label={link.label}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Be Better Web. 保留所有权利。
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}