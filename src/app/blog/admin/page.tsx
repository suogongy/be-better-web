'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryManager } from '@/components/blog/category-manager'
import { TagManager } from '@/components/blog/tag-manager'
import { CommentModeration } from '@/components/blog/comment-moderation'
import { PostsManager } from '@/components/blog/posts-manager'
import { MessageCircle, Tag, FolderOpen, FileText } from 'lucide-react'

export default function BlogAdminPage() {
  const [activeTab, setActiveTab] = useState('posts')

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
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              文章管理
            </TabsTrigger>
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
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            <PostsManager />
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <CommentModeration />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <TagManager />
          </TabsContent>

          </Tabs>
      </div>
    </div>
  )
}