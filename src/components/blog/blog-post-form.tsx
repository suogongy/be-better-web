'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BlogEditor } from './blog-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categoryService, tagService } from '@/lib/supabase/database'
import { createSlug } from '@/lib/utils'
import { X, Plus } from 'lucide-react'

// 表单验证规则
const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
  category_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
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
  const [content, setContent] = useState(initialData?.content || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.category_ids || [])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tag_ids || [])
  const [newTagName, setNewTagName] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  // 表单配置
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      category_ids: [],
      tag_ids: [],
      ...initialData,
    },
  })

  const watchedStatus = watch('status')

  // 加载分类和标签数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        const [categoriesData, tagsData] = await Promise.all([
          categoryService.getCategories(),
          tagService.getTags(),
        ])
        setCategories(categoriesData)
        setTags(tagsData)
      } catch (error) {
        console.error('Failed to load categories and tags:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // 处理标题变化，自动生成slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    const newSlug = createSlug(newTitle)
    setValue('slug', newSlug)
  }

  // 提交表单
  const handleFormSubmit = async (data: PostFormData) => {
    const formData = {
      ...data,
      content,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
    }
    await onSubmit(formData)
  }

  // 切换分类选择
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // 切换标签选择
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // 创建新标签
  const createNewTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await tagService.createTag({
        name: newTagName,
        slug: createSlug(newTagName),
      })
      setTags(prev => [...prev, newTag])
      setSelectedTags(prev => [...prev, newTag.id])
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? '编辑文章' : '创建新文章'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                onChange={(e) => {
                  register('title').onChange(e)
                  handleTitleChange(e)
                }}
                placeholder="输入文章标题"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('slug')}
                placeholder="url-slug"
                className={errors.slug ? 'border-red-500' : ''}
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
          </div>

          {/* 摘要和状态 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">摘要</label>
              <Textarea
                {...register('excerpt')}
                placeholder="简要描述文章内容"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                发布状态 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
              {watchedStatus === 'published' && (
                <p className="mt-1 text-sm text-green-600">
                  文章将在提交后立即公开可见
                </p>
              )}
              {watchedStatus === 'draft' && (
                <p className="mt-1 text-sm text-gray-600">
                  文章将保存为草稿，不会公开显示
                </p>
              )}
            </div>
          </div>

          {/* 分类选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            {loadingData ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      type="button"
                      variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId)
                      return category ? (
                        <Badge
                          key={categoryId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {category.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => toggleCategory(categoryId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">标签</label>
            {loadingData ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>

                {/* 创建新标签 */}
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="创建新标签"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        createNewTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createNewTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId)
                      return tag ? (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => toggleTag(tagId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 内容编辑器 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              文章内容 <span className="text-red-500">*</span>
            </label>
            <BlogEditor
              content={content}
              onChange={(newContent: string) => {
                setContent(newContent)
                setValue('content', newContent)
              }}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 md:flex-none"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? '更新中...' : '创建中...'}
                </>
              ) : (
                <>
                  {initialData ? '更新文章' : '创建文章'}
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                取消
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}