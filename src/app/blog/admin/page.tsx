'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { LoadingError } from '@/components/ui/loading-error'
import { CategoryManager } from '@/components/blog/category-manager'
import { TagManager } from '@/components/blog/tag-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Tag, Folder } from 'lucide-react'

export default function BlogAdminPage() {
  const { user, loading, error } = useAuth()
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories')

  // 如果用户未登录，显示登录提示
  if (!loading && !error && !user) {
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
    <LoadingError loading={loading} error={error}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回博客
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">博客管理</h1>
              <p className="text-muted-foreground mt-1">
                管理分类、标签和博客设置
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('categories')}
          >
            <Folder className="h-4 w-4 mr-2" />
            分类管理
          </Button>
          <Button
            variant={activeTab === 'tags' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tags')}
          >
            <Tag className="h-4 w-4 mr-2" />
            标签管理
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'categories' && (
            <Card>
              <CardHeader>
                <CardTitle>分类管理</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager />
              </CardContent>
            </Card>
          )}

          {activeTab === 'tags' && (
            <Card>
              <CardHeader>
                <CardTitle>标签管理</CardTitle>
              </CardHeader>
              <CardContent>
                <TagManager />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LoadingError>
  )
}