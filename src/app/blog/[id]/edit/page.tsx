'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronDown, Check } from 'lucide-react'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  X,
  FolderOpen,
  Tag,
  FileText
} from 'lucide-react'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { postService, categoryService, tagService } from '@/lib/supabase/services'
import { Post } from '@/types/database'

interface Category {
  id: string
  name: string
  color?: string | null
}

interface Tag {
  id: string
  name: string
}

// 状态选择器组件
function StatusSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    { value: 'draft', label: '草稿' },
    { value: 'published', label: '已发布' },
    { value: 'archived', label: '已归档' }
  ]

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-32 bg-popover border border-border rounded-md shadow-md">
          <div className="py-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                  option.value === value ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 多选下拉组件
function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder,
  getLabel,
  getValue,
}: {
  options: any[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder: string
  getLabel: (item: any) => string
  getValue: (item: any) => string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id]
    onChange(newSelected)
  }

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder
    return selectedIds.length === 1 
      ? getLabel(options.find(opt => getValue(opt) === selectedIds[0]))
      : `已选择 ${selectedIds.length} 项`
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block truncate">{getDisplayText()}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          <div className="max-h-60 overflow-auto">
            {options.map((option) => {
              const value = getValue(option)
              const isSelected = selectedIds.includes(value)
              return (
                <div
                  key={value}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => handleToggle(e, value)}
                >
                  <span>{getLabel(option)}</span>
                  {isSelected && <Check className="absolute left-2 h-4 w-4 text-primary" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default function EditBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    category_ids: [] as string[],
    tag_ids: [] as string[]
  })
  
  // 选项数据
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // 并行加载文章、分类和标签数据
        const [postResult, categoriesData, tagsData] = await Promise.all([
          postService.getPostById(postId),
          categoryService.getAllCategories(),
          tagService.getAllTags()
        ])
        
        if (postResult) {
          setPost(postResult)
          setFormData({
            title: postResult.title,
            excerpt: postResult.excerpt || '',
            content: postResult.content,
            status: postResult.status,
            category_ids: postResult.category_ids || [],
            tag_ids: postResult.tag_ids || []
          })
        } else {
          setError('文章不存在')
        }
        
        setCategories(categoriesData?.data || [])
        setTags(tagsData?.data || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      loadData()
    }
  }, [postId])

  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryChange = (selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      category_ids: selectedIds
    }))
  }

  const handleTagChange = (selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: selectedIds
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      await postService.updatePost(postId, {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        status: formData.status
      }, formData.category_ids, formData.tag_ids)
      
      // 跳转到文章管理页
      router.push('/blog/admin/posts')
    } catch (err) {
      console.error('Failed to update post:', err)
      setError('更新文章失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{error || '文章不存在'}</h1>
            <Button onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-semibold">编辑文章</h1>
                <p className="text-sm text-muted-foreground">
                  {formData.title || '无标题'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isSubmitting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <form id="edit-form" onSubmit={handleSubmit} className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主要编辑区域 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 标题和摘要输入 */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-medium">文章标题 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="输入文章标题..."
                      className="mt-2 text-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt" className="text-base font-medium">文章摘要</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="输入文章摘要（可选）..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 内容编辑器 */}
            <Card className="flex-1">
              <CardContent className="p-0">
                <div className="h-[70vh] min-h-[500px]">
                  <MarkdownEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange('content', value)}
                    placeholder="开始编写您的文章内容..."
                    previewMode="right"
                    showToolbar={true}
                    autoSave={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏设置 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 分类选择 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4" />
                  文章分类
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <MultiSelect
                  options={categories}
                  selectedIds={formData.category_ids}
                  onChange={handleCategoryChange}
                  placeholder="选择分类..."
                  getLabel={(category) => category.name}
                  getValue={(category) => category.id}
                />
                
                {/* 已选择的分类 */}
                {formData.category_ids.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">已选择的分类：</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.category_ids.map(categoryId => {
                        const category = categories.find(c => c.id === categoryId)
                        return category ? (
                          <Badge key={categoryId} variant="secondary" className="text-xs">
                            {category.name}
                            <button
                              type="button"
                              onClick={() => handleCategoryChange(formData.category_ids.filter(id => id !== categoryId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 标签选择 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  文章标签
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <MultiSelect
                  options={tags}
                  selectedIds={formData.tag_ids}
                  onChange={handleTagChange}
                  placeholder="选择标签..."
                  getLabel={(tag) => `#${tag.name}`}
                  getValue={(tag) => tag.id}
                />
                
                {/* 已选择的标签 */}
                {formData.tag_ids.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">已选择的标签：</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.tag_ids.map(tagId => {
                        const tag = tags.find(t => t.id === tagId)
                        return tag ? (
                          <Badge key={tagId} variant="outline" className="text-xs">
                            #{tag.name}
                            <button
                              type="button"
                              onClick={() => handleTagChange(formData.tag_ids.filter(id => id !== tagId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 状态选择和保存按钮 */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium whitespace-nowrap">发布状态</span>
                  <StatusSelector 
                    value={formData.status} 
                    onChange={(value) => handleInputChange('status', value)}
                  />
                </div>
                <Button
                  type="submit"
                  form="edit-form"
                  className="w-full"
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? '保存中...' : '保存文章'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}