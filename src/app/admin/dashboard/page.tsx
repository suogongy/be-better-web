'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CategoryManager } from '@/components/blog/category-manager'
import { TagManager } from '@/components/blog/tag-manager'
import { CommentModeration } from '@/components/blog/comment-moderation'
import { PostsManager } from '@/components/blog/posts-manager'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { MessageCircle, Tag, FolderOpen, FileText, Settings, Database, Users, LogOut, User, Mail } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('blog')
  const [isSigningOut, setIsSigningOut] = useState(false)

  // 如果用户为空且不在加载状态，重定向到首页
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    try {
      setIsSigningOut(true)
      await signOut()
      
      // 显示退出成功提示
      addToast({
        title: '退出成功',
        description: '您已安全退出登录',
        variant: 'success',
      })
      
      // 跳转到首页
      router.push('/')
      
    } catch (error) {
      console.error('退出登录失败:', error)
      addToast({
        title: '退出失败',
        description: '退出登录时发生错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  // 如果正在加载且没有用户，显示加载状态
  if (loading && !user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果加载完成但没有用户，跳转到登录页面
  if (!loading && !user) {
    // 这里不应该到达，因为页面应该有权限保护
    return null
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">系统管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的Be Better Web平台各项功能和内容
          </p>
        </div>

        {/* 账户信息卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              账户信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.user_metadata?.name || user.email}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  管理员账户
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2"
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    退出中...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              博客管理
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

          <TabsContent value="blog" className="space-y-6">
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

        {/* 未来功能扩展区域 */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            即将推出的管理功能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg border">
              <Users className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">用户管理</h4>
              <p className="text-sm text-muted-foreground">管理系统用户和权限</p>
            </div>
            <div className="p-4 bg-background rounded-lg border">
              <Database className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">数据备份</h4>
              <p className="text-sm text-muted-foreground">备份和恢复系统数据</p>
            </div>
            <div className="p-4 bg-background rounded-lg border">
              <Settings className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">系统设置</h4>
              <p className="text-sm text-muted-foreground">配置系统参数和选项</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}