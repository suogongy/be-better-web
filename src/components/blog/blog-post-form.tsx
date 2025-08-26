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
  title: z.string().min(1, '标题是必填项').max(200, '标题不能超过200个字符'),
  slug: z.string()
    .min(1, 'URL链接是必填项')
    .max(50, 'URL链接不能超过50个字符')
    .regex(/^[a-z0-9-]+$/, 'URL链接只能包含小写字母、数字和连字符')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'URL链接不能以连字符开头或结尾'
    })
    .refine((val) => !val.includes('--'), {
      message: 'URL链接不能包含连续的连字符'
    }),
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
    
    // 只有在slug为空或者是基于之前标题生成的时候才自动更新
    const currentSlug = watch('slug')
    const currentTitle = watch('title')
    const shouldUpdateSlug = !currentSlug || currentSlug === createSlug(currentTitle || '')
    
    if (shouldUpdateSlug && newTitle) {
      const newSlug = createSlug(newTitle)
      setValue('slug', newSlug)
      
      // 如果生成的slug为空，给出提示
      if (!newSlug) {
        setValue('slug', 'post-' + Date.now().toString(36).slice(-6))
      }
    }
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
          <div className="grid grid-cols-1 gap-6">
            {/* 标题输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                文章标题 <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                onChange={(e) => {
                  register('title').onChange(e)
                  handleTitleChange(e)
                }}
                placeholder="输入吸引人的文章标题"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                💡 标题会自动生成URL链接，建议使用简洁明了的标题
              </p>
            </div>

            {/* URL Slug输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                URL链接 (Slug) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">网址预览:</span>
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    /blog/<span className="text-blue-600">{watch('slug') || 'your-post-url'}</span>
                  </code>
                </div>
                <Input
                  {...register('slug')}
                  placeholder="post-url-slug"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">什么是URL链接(Slug)？</h4>
                  <p className="text-xs text-blue-700 mb-2">
                    URL链接是文章网址的最后部分，用于唯一标识这篇文章。例如文章"我的第一篇博客"的链接可能是"my-first-blog"
                  </p>
                  <div className="text-xs text-blue-600">
                    <strong>规则：</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>只能包含小写字母、数字和连字符(-)</li>
                      <li>不能包含空格、特殊字符或中文</li>
                      <li>建议简短且有意义，便于SEO和分享</li>
                      <li>一旦发布后不建议修改，以免影响链接访问</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 摘要和状态 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                文章摘要
                <span className="text-gray-400 font-normal">（可选）</span>
              </label>
              <Textarea
                {...register('excerpt')}
                placeholder="简要描述文章内容，帮助读者快速了解文章主题（建议150字以内）"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 摘要会显示在博客列表中，好的摘要能吸引更多读者点击
              </p>
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