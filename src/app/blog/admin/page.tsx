'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryManager } from '@/components/blog/category-manager'
import { TagManager } from '@/components/blog/tag-manager'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MessageCircle, Tag, FolderOpen, FileText } from 'lucide-react'

export default function BlogAdminPage() {
  const [activeTab, setActiveTab] = useState('comments')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">博客管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的博客文章、分类、标签和评论
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              评论管理
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              分类管理
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              标签管理
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              文章管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  评论管理
                </CardTitle>
                <CardDescription>
                  审核和管理用户评论
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button asChild>
                    <Link href="/blog/admin/comments">
                      进入评论管理
                    </Link>
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  在这里您可以审核用户提交的评论，批准、拒绝或标记为垃圾评论。
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  分类管理
                </CardTitle>
                <CardDescription>
                  管理博客文章分类
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  标签管理
                </CardTitle>
                <CardDescription>
                  管理博客文章标签
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  文章管理
                </CardTitle>
                <CardDescription>
                  管理博客文章
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button asChild>
                    <Link href="/blog/admin/posts">
                      进入文章管理
                    </Link>
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  在这里您可以创建、编辑和管理您的博客文章。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}