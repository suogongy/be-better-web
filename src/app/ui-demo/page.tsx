'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SimpleTooltip } from '@/components/ui/tooltip'

export default function UIDemoPage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">UI 组件库演示</h1>
        <p className="text-xl text-muted-foreground">
          基于 shadcn/ui 的现代化组件系统
        </p>
      </div>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>按钮组件</CardTitle>
          <CardDescription>
            支持多种变体和大小的按钮组件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🎨</Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Components */}
      <Card>
        <CardHeader>
          <CardTitle>输入组件</CardTitle>
          <CardDescription>
            表单输入控件，支持多种状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱输入</label>
              <Input type="email" placeholder="Enter your email" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">密码输入</label>
              <Input type="password" placeholder="Enter your password" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索输入</label>
              <Input placeholder="Search..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">禁用状态</label>
              <Input disabled placeholder="Disabled input" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">文本域</label>
            <Textarea 
              placeholder="Enter your message..." 
              showCharCount
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Components */}
      <Card>
        <CardHeader>
          <CardTitle>提示组件</CardTitle>
          <CardDescription>
            用于显示重要信息的提示框
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>提示信息</AlertTitle>
            <AlertDescription>
              这是一个默认的提示信息，用于展示普通信息。
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertTitle>错误提示</AlertTitle>
            <AlertDescription>
              操作失败，请检查您的输入并重试。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Loading Components */}
      <Card>
        <CardHeader>
          <CardTitle>加载状态</CardTitle>
          <CardDescription>
            各种加载动画和骨架屏
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-6 items-center">
            <Loading text="加载中..." />
            <Loading variant="dots" text="处理中..." />
            <Loading variant="bars" />
            <Loading variant="pulse" />
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">骨架屏效果</h4>
            <SkeletonCard />
          </div>
        </CardContent>
      </Card>

      {/* Other Components */}
      <Card>
        <CardHeader>
          <CardTitle>其他组件</CardTitle>
          <CardDescription>
            徽章、工具提示等辅助组件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <SimpleTooltip content="这是一个工具提示">
              <Button variant="outline">悬停查看提示</Button>
            </SimpleTooltip>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}