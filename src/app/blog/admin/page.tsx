'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Loading } from '@/components/ui/loading'
import { CategoryManager } from '@/components/blog/category-manager'
import { TagManager } from '@/components/blog/tag-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Tag, Folder } from 'lucide-react'

export default function BlogAdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您需要登录才能访问管理面板。</p>
          <Link href="/auth/login">
            <Button>登录</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回博客
        </Link>
        <h1 className="text-3xl font-bold mt-2">博客管理</h1>
        <p className="text-muted-foreground">管理您的博客文章分类和标签</p>
      </div>

      {/* Navigation Tabs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>内容管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'categories' ? 'default' : 'outline'}
              onClick={() => setActiveTab('categories')}
              className="flex items-center gap-2"
            >
              <Folder className="h-4 w-4" />
              分类
            </Button>
            <Button
              variant={activeTab === 'tags' ? 'default' : 'outline'}
              onClick={() => setActiveTab('tags')}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              标签
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'tags' && <TagManager />}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/blog/new">
              <Button variant="outline">创建新文章</Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline">查看所有文章</Button>
            </Link>
            <Link href="/blog/admin/comments">
              <Button variant="outline">管理评论</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">返回控制台</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}