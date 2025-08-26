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
        <Loading text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access the admin panel.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
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
          Back to Blog
        </Link>
        <h1 className="text-3xl font-bold mt-2">Blog Management</h1>
        <p className="text-muted-foreground">Manage categories and tags for your blog posts</p>
      </div>

      {/* Navigation Tabs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'categories' ? 'default' : 'outline'}
              onClick={() => setActiveTab('categories')}
              className="flex items-center gap-2"
            >
              <Folder className="h-4 w-4" />
              Categories
            </Button>
            <Button
              variant={activeTab === 'tags' ? 'default' : 'outline'}
              onClick={() => setActiveTab('tags')}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Tags
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/blog/new">
              <Button variant="outline">Create New Post</Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline">View All Posts</Button>
            </Link>
            <Link href="/blog/admin/comments">
              <Button variant="outline">Moderate Comments</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}