'use client'

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  X, 
  Save, 
  Eye,
  Calendar,
  Tag,
  Folder,
  Loader2
} from 'lucide-react'
import { BlogEditor } from './blog-editor'

// 表单验证规则（移除 slug）
const postSchema = z.object({
  title: z.string().min(1, '标题是必填项').max(200, '标题不能超过200个字符'),
  excerpt: z.string().max(300, '摘要不能超过300个字符').optional(),
  content: z.string().min(1, '文章内容是必填项'),
  status: z.enum(['draft', 'published']),
  category_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface BlogPostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function BlogPostForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BlogPostFormProps) {
  // 状态管理
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // 表单管理
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || '',
      excerpt: initialData?.excerpt || '',
      content: initialData?.content || '',
      status: initialData?.status || 'draft',
      category_ids: initialData?.category_ids || [],
      tag_ids: initialData?.tag_ids || [],
    }
  })

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: 'tag_ids'
  })

  // 加载分类和标签
  useEffect(() => {
    loadCategoriesAndTags()
  }, [])

  // 设置初始值
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        excerpt: initialData.excerpt || '',
        content: initialData.content || '',
        status: initialData.status || 'draft',
        category_ids: initialData.category_ids || [],
        tag_ids: initialData.tag_ids || [],
      })
    }
  }, [initialData, reset])

  const loadCategoriesAndTags = async () => {
    try {
      // 这里应该从 API 加载分类和标签
      // 暂时使用模拟数据
      setCategories([])
      setTags([])
    } catch (error) {
      console.error('Failed to load categories and tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return

    try {
      // 检查是否已存在
      const existingTag = tags.find(tag => 
        tag.name.toLowerCase() === newTagName.trim().toLowerCase()
      )
      
      if (existingTag) {
        if (!tagFields.some(field => field.id === existingTag.id)) {
          appendTag(existingTag.id)
        }
      } else {
        // 创建新标签
        // const newTag = await tagService.createTag({ name: newTagName.trim() })
        // appendTag(newTag.id)
        // setTags(prev => [...prev, newTag])
      }
      
      setNewTagName('')
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleFormSubmit = async (data: PostFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Failed to submit post:', error)
    }
  }

  const selectedCategories = watch('category_ids') || []
  const selectedTags = watch('tag_ids') || []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 主编辑区 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 标题输入 */}
        <Card>
          <CardContent className="p-6">
            <Input
              {...register('title')}
              placeholder="输入文章标题..."
              className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </CardContent>
        </Card>

        {/* 编辑器 */}
        <Card>
          <CardContent className="p-6">
            {showPreview ? (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: watch('content') }} />
              </div>
            ) : (
              <BlogEditor
                content={watch('content')}
                onChange={(content) => setValue('content', content, { shouldValidate: true })}
              />
            )}
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </CardContent>
        </Card>

        {/* 摘要输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>文章摘要</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              {...register('excerpt')}
              placeholder="输入文章摘要（可选）..."
              rows={3}
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 侧边栏 */}
      <div className="space-y-6">
        {/* 发布设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">发布设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">状态</label>
              <select
                {...register('status')}
                className="w-full p-2 border rounded-md"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? '继续编辑' : '预览'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              
              <Button
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 分类 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      const currentCategories = selectedCategories
                      if (e.target.checked) {
                        setValue('category_ids', [...currentCategories, category.id])
                      } else {
                        setValue('category_ids', currentCategories.filter(id => id !== category.id))
                      }
                    }}
                    className="rounded"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 标签 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              标签
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="添加新标签..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={tag.id}
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        const currentTags = selectedTags
                        if (e.target.checked) {
                          setValue('tag_ids', [...currentTags, tag.id])
                        } else {
                          setValue('tag_ids', currentTags.filter(id => id !== tag.id))
                        }
                      }}
                      className="rounded"
                    />
                    <span>{tag.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}